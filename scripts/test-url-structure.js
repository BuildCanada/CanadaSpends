#!/usr/bin/env node

/**
 * URL Structure Validation Script
 *
 * Tests:
 * - robots.txt contains sitemap reference
 * - sitemap.xml is well-formed
 * - All sitemap URLs render correctly
 * - Canonical and hreflang tags are present
 * - 301 redirects work as expected
 *
 * Usage: node test-url-structure.js [base-url]
 * Example: node test-url-structure.js http://localhost:3000
 */

const BASE_URL = process.argv[2] || "http://localhost:3000";
const MAX_URLS_TO_TEST = parseInt(process.argv[3]) || 100; // Limit for faster testing

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

const stats = {
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: [],
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  stats.passed++;
  log(`✓ ${message}`, colors.green);
}

function fail(message, error = "") {
  stats.failed++;
  stats.errors.push({ message, error });
  log(`✗ ${message}`, colors.red);
  if (error) log(`  ${error}`, colors.red);
}

function warn(message) {
  stats.warnings++;
  log(`⚠ ${message}`, colors.yellow);
}

function info(message) {
  log(message, colors.cyan);
}

function section(title) {
  log(`\n${"=".repeat(60)}`, colors.blue);
  log(title, colors.bright + colors.blue);
  log("=".repeat(60), colors.blue);
}

async function fetchText(url) {
  const response = await fetch(url);
  return {
    status: response.status,
    text: await response.text(),
    headers: response.headers,
  };
}

// Test 1: Check robots.txt
async function testRobotsTxt() {
  section("TEST 1: robots.txt");

  try {
    const { status, text } = await fetchText(`${BASE_URL}/robots.txt`);

    if (status !== 200) {
      fail(`robots.txt returned ${status}`, "Expected 200");
      return;
    }
    success("robots.txt is accessible");

    if (text.includes("sitemap.xml") || text.includes("Sitemap:")) {
      success("robots.txt references sitemap.xml");
    } else {
      fail("robots.txt does not reference sitemap.xml");
    }

    info(`Content:\n${text}`);
  } catch (error) {
    fail("Failed to fetch robots.txt", error.message);
  }
}

// Test 2: Check sitemap.xml
async function testSitemap() {
  section("TEST 2: sitemap.xml");

  try {
    const { status, text } = await fetchText(`${BASE_URL}/sitemap.xml`);

    if (status !== 200) {
      fail(`sitemap.xml returned ${status}`, "Expected 200");
      return [];
    }
    success("sitemap.xml is accessible");

    // Check if it's valid XML
    if (!text.includes("<?xml") || !text.includes("<urlset")) {
      fail("sitemap.xml is not well-formed XML");
      return [];
    }
    success("sitemap.xml is well-formed XML");

    // Extract URLs
    const urlMatches = text.matchAll(/<loc>(.*?)<\/loc>/g);
    const urls = Array.from(urlMatches).map((match) => match[1]);

    if (urls.length === 0) {
      fail("sitemap.xml contains no URLs");
      return [];
    }
    success(`sitemap.xml contains ${urls.length} URLs`);

    // Check for required URL patterns
    const hasProvincial = urls.some((u) => u.includes("/provincial/"));
    const hasMunicipal = urls.some((u) => u.includes("/municipal/"));
    const hasFederal = urls.some((u) => u.includes("/federal/"));

    if (hasProvincial) success("sitemap includes provincial URLs");
    else warn("sitemap missing provincial URLs");

    if (hasMunicipal) success("sitemap includes municipal URLs");
    else warn("sitemap missing municipal URLs");

    if (hasFederal) success("sitemap includes federal URLs");
    else warn("sitemap missing federal URLs");

    return urls;
  } catch (error) {
    fail("Failed to fetch sitemap.xml", error.message);
    return [];
  }
}

// Test 3: Check individual URLs from sitemap
async function testSitemapUrls(urls) {
  section(
    `TEST 3: Sitemap URLs (testing ${Math.min(urls.length, MAX_URLS_TO_TEST)} of ${urls.length})`,
  );

  const urlsToTest = urls.slice(0, MAX_URLS_TO_TEST);

  for (const url of urlsToTest) {
    try {
      // Replace canadaspends.com with our BASE_URL for local testing
      const testUrl = url.replace("https://canadaspends.com", BASE_URL);

      const { status, text } = await fetchText(testUrl);

      if (status !== 200) {
        fail(`${url} returned ${status}`);
        continue;
      }

      // Check for canonical link
      const canonicalMatch = text.match(
        /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/,
      );
      const hasCanonical = canonicalMatch !== null;

      // Check for hreflang links (case-insensitive for hreflang/hrefLang)
      const hreflangMatches = text.match(
        /<link[^>]*rel=["']alternate["'][^>]*hreflang=["']([^"']+)["']/gi,
      );
      const hasHreflang = hreflangMatches && hreflangMatches.length > 0;

      // Extract just the path for display
      const urlPath = testUrl.replace(BASE_URL, "");

      if (status === 200 && hasCanonical && hasHreflang) {
        success(`${urlPath}`);
      } else {
        const issues = [];
        if (!hasCanonical) issues.push("no canonical");
        if (!hasHreflang) issues.push("no hreflang");
        warn(`${urlPath} - ${issues.join(", ")}`);
      }
    } catch (error) {
      fail(`${url}`, error.message);
    }
  }

  if (urls.length > MAX_URLS_TO_TEST) {
    info(
      `\n(Tested ${MAX_URLS_TO_TEST} of ${urls.length} URLs. Set higher limit with: node test-url-structure.js ${BASE_URL} 100)`,
    );
  }
}

// Test 4: Check 301 redirects
async function testRedirects() {
  section("TEST 4: 301 Redirects");

  const redirectTests = [
    // Federal
    {
      from: "/en/spending",
      to: "/en/federal/spending",
      desc: "Federal spending",
    },
    { from: "/en/budget", to: "/en/federal/budget", desc: "Federal budget" },
    {
      from: "/fr/spending",
      to: "/fr/federal/spending",
      desc: "Federal spending (FR)",
    },
    {
      from: "/fr/budget",
      to: "/fr/federal/budget",
      desc: "Federal budget (FR)",
    },

    // Provincial
    {
      from: "/en/ontario",
      to: "/en/provincial/ontario",
      desc: "Ontario provincial",
    },
    {
      from: "/en/british-columbia",
      to: "/en/provincial/british-columbia",
      desc: "BC provincial",
    },
    {
      from: "/en/alberta",
      to: "/en/provincial/alberta",
      desc: "Alberta provincial",
    },

    // Municipal
    {
      from: "/en/toronto",
      to: "/en/municipal/ontario/toronto",
      desc: "Toronto municipal",
    },
    {
      from: "/en/vancouver",
      to: "/en/municipal/british-columbia/vancouver",
      desc: "Vancouver municipal",
    },
  ];

  for (const test of redirectTests) {
    try {
      const response = await fetch(`${BASE_URL}${test.from}`, {
        redirect: "manual",
      });

      if (response.status === 301 || response.status === 308) {
        const location = response.headers.get("location");
        const expectedLocation = `${BASE_URL}${test.to}`;

        if (location === test.to || location === expectedLocation) {
          success(`${test.from} → ${test.to} (${response.status})`);
        } else {
          fail(
            `${test.from} redirects to wrong location`,
            `Expected: ${test.to}, Got: ${location}`,
          );
        }
      } else if (response.status === 200) {
        fail(
          `${test.from} returned 200 instead of redirect`,
          "Should be 301/308",
        );
      } else {
        fail(`${test.from} returned ${response.status}`, "Expected 301 or 308");
      }
    } catch (error) {
      fail(`${test.from}`, error.message);
    }
  }
}

// Test 5: Check non-year URLs render correctly
async function testNonYearUrls() {
  section("TEST 5: Non-Year URLs (Latest Year Rendering)");

  const nonYearTests = [
    {
      url: "/en/provincial/ontario",
      desc: "Ontario provincial (non-year)",
      shouldHaveCanonical: true,
      canonicalPattern: /\/en\/provincial\/ontario\/\d{4}/,
    },
    {
      url: "/en/municipal/ontario/toronto",
      desc: "Toronto municipal (non-year)",
      shouldHaveCanonical: true,
      canonicalPattern: /\/en\/municipal\/ontario\/toronto\/\d{4}/,
    },
    {
      url: "/en/provincial/british-columbia",
      desc: "BC provincial (non-year)",
      shouldHaveCanonical: true,
      canonicalPattern: /\/en\/provincial\/british-columbia\/\d{4}/,
    },
  ];

  for (const test of nonYearTests) {
    try {
      const response = await fetch(`${BASE_URL}${test.url}`, {
        redirect: "manual",
      });

      // Should NOT redirect
      if (response.status >= 300 && response.status < 400) {
        fail(
          `${test.url} redirected (${response.status})`,
          "Should render directly without redirect",
        );
        continue;
      }

      if (response.status !== 200) {
        fail(`${test.url} returned ${response.status}`, "Expected 200");
        continue;
      }

      success(`${test.url} renders without redirect (200)`);

      // Check canonical
      const html = await response.text();
      const canonicalMatch = html.match(
        /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/,
      );

      if (test.shouldHaveCanonical) {
        if (canonicalMatch) {
          const canonical = canonicalMatch[1];
          if (test.canonicalPattern.test(canonical)) {
            success(
              `  Canonical link points to year-specific URL: ${canonical}`,
            );
          } else {
            fail(
              `  Canonical link doesn't match expected pattern`,
              `Got: ${canonical}`,
            );
          }
        } else {
          fail(`  Missing canonical link`);
        }
      }

      // Check hreflang (case-insensitive for hreflang/hrefLang)
      const hreflangMatches = html.match(
        /<link[^>]*rel=["']alternate["'][^>]*hreflang=["']([^"']+)["']/gi,
      );
      if (hreflangMatches && hreflangMatches.length >= 2) {
        success(`  Has hreflang alternates (${hreflangMatches.length})`);
      } else {
        warn(`  Missing or incomplete hreflang alternates`);
      }
    } catch (error) {
      fail(`${test.url}`, error.message);
    }
  }
}

// Test 6: Check year-specific URLs
async function testYearSpecificUrls() {
  section("TEST 6: Year-Specific URLs");

  const yearTests = [
    { url: "/en/provincial/ontario/2023", desc: "Ontario 2023" },
    { url: "/en/municipal/ontario/toronto/2024", desc: "Toronto 2024" },
    { url: "/en/provincial/british-columbia/2024", desc: "BC 2024" },
  ];

  for (const test of yearTests) {
    try {
      const response = await fetch(`${BASE_URL}${test.url}`);

      if (response.status === 200) {
        success(`${test.url} (200)`);
      } else if (response.status === 404) {
        warn(`${test.url} (404) - Year may not have data yet`);
      } else {
        fail(`${test.url} returned ${response.status}`);
      }
    } catch (error) {
      fail(`${test.url}`, error.message);
    }
  }
}

// Main test runner
async function runTests() {
  log(`\n${"*".repeat(60)}`, colors.bright);
  log("URL STRUCTURE VALIDATION TEST SUITE", colors.bright + colors.cyan);
  log("*".repeat(60), colors.bright);
  log(`\nBase URL: ${BASE_URL}`, colors.cyan);
  log(`Time: ${new Date().toISOString()}\n`, colors.cyan);

  // Check if server is running
  try {
    await fetch(BASE_URL);
  } catch {
    log(`\n❌ Cannot connect to ${BASE_URL}`, colors.red);
    log("Make sure the dev server is running: npm run dev\n", colors.yellow);
    process.exit(1);
  }

  await testRobotsTxt();

  const urls = await testSitemap();

  if (urls.length > 0) {
    await testSitemapUrls(urls);
  }

  await testRedirects();
  await testNonYearUrls();
  await testYearSpecificUrls();

  // Print summary
  section("TEST SUMMARY");
  log(`Passed:   ${stats.passed}`, colors.green);
  log(`Failed:   ${stats.failed}`, colors.red);
  log(`Warnings: ${stats.warnings}`, colors.yellow);

  if (stats.errors.length > 0) {
    log("\nFailed Tests:", colors.red);
    stats.errors.forEach((error, i) => {
      log(`${i + 1}. ${error.message}`, colors.red);
      if (error.error) log(`   ${error.error}`, colors.red);
    });
  }

  log("\n" + "=".repeat(60) + "\n", colors.blue);

  if (stats.failed > 0) {
    log("❌ TESTS FAILED", colors.red + colors.bright);
    process.exit(1);
  } else if (stats.warnings > 0) {
    log("⚠️  TESTS PASSED WITH WARNINGS", colors.yellow + colors.bright);
  } else {
    log("✅ ALL TESTS PASSED", colors.green + colors.bright);
  }

  console.log("");
}

// Run tests
runTests().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});
