import { MetadataRoute } from "next";
import { BASE_URL, locales } from "@/lib/constants";
import path from "path";
import {
  getProvincialSlugs,
  getMunicipalitiesByProvince,
  getAvailableYearsForJurisdiction,
  getFileLastModified,
} from "@/lib/jurisdictions";
import { getArticleSlugs } from "@/lib/articles";

export default function sitemap(): MetadataRoute.Sitemap {
  const urls: MetadataRoute.Sitemap = [];

  const addUrl = (
    url: string,
    changeFreq: MetadataRoute.Sitemap[number]["changeFrequency"] = "yearly",
    relativeFilePath?: string,
  ) => {
    urls.push({
      url: `${BASE_URL}${url}`,
      lastModified: relativeFilePath
        ? getFileLastModified(relativeFilePath)
        : new Date(),
      changeFrequency: changeFreq,
    });
  };

  // Home and federal pages
  for (const lang of locales) {
    addUrl(`/${lang}`, "daily");
    addUrl(`/${lang}/federal/spending`);
    addUrl(`/${lang}/federal/budget`);
    addUrl(`/${lang}/tax-visualizer`);
    addUrl(`/${lang}/search`);
    addUrl(`/${lang}/about`);
    addUrl(`/${lang}/contact`);
    addUrl(`/${lang}/articles`);

    // Articles
    for (const slug of getArticleSlugs(lang)) {
      const articlePath = path.join("articles", lang, slug, "metadata.json");
      addUrl(`/${lang}/articles/${slug}`, "yearly", articlePath);
    }
  }

  // Provincial and municipal pages (non-year and year-specific)
  for (const lang of locales) {
    // Provincial
    for (const province of getProvincialSlugs()) {
      const years = getAvailableYearsForJurisdiction(province);
      if (years.length === 0) continue;

      // Add non-year URL (renders latest year)
      const latestYear = years[0];
      const latestYearFilePath = latestYear
        ? path.join("data", "provincial", province, latestYear, "summary.json")
        : undefined;
      addUrl(`/${lang}/provincial/${province}`, "yearly", latestYearFilePath);

      // Add year-specific URLs
      for (const year of years) {
        const yearFilePath = path.join(
          "data",
          "provincial",
          province,
          year,
          "summary.json",
        );
        addUrl(
          `/${lang}/provincial/${province}/${year}`,
          "yearly",
          yearFilePath,
        );
      }
    }

    // Municipal
    for (const { province, municipalities } of getMunicipalitiesByProvince()) {
      for (const municipality of municipalities) {
        const jurisdiction = `${province}/${municipality.slug}`;
        const years = getAvailableYearsForJurisdiction(jurisdiction);
        if (years.length === 0) continue;

        // Add non-year URL (renders latest year)
        const latestYear = years[0];
        const latestYearFilePath = latestYear
          ? path.join(
              "data",
              "municipal",
              province,
              municipality.slug,
              latestYear,
              "summary.json",
            )
          : undefined;
        addUrl(
          `/${lang}/municipal/${province}/${municipality.slug}`,
          "yearly",
          latestYearFilePath,
        );

        // Add year-specific URLs
        for (const year of years) {
          const yearFilePath = path.join(
            "data",
            "municipal",
            province,
            municipality.slug,
            year,
            "summary.json",
          );
          addUrl(
            `/${lang}/municipal/${province}/${municipality.slug}/${year}`,
            "yearly",
            yearFilePath,
          );
        }
      }
    }
  }

  return urls;
}
