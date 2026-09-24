// app/providers.tsx
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { usePostHog } from "posthog-js/react";

import posthog from "posthog-js";
import type { CaptureResult } from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

// Browser extensions and injected third-party scripts throw errors inside our
// pages. Without a filter, PostHog error tracking ingests them as first-party
// issues, drowning genuine regressions in noise (e.g. `scanPdf` from a PDF
// extension, `beTracker`, `runtime.sendMessage`, Cloudflare Zaraz).
type ExceptionFrame = { in_app?: boolean };
type ExceptionItem = {
  type?: string;
  value?: string;
  stacktrace?: { frames?: ExceptionFrame[] };
};

// Substrings that unambiguously identify globals injected by extensions or
// third-party scripts we don't ship.
const EXTENSION_ERROR_PATTERNS = [
  "scanPdf",
  "beTracker",
  "runtime.sendMessage",
  "zaraz",
];

function getExceptionList(result: CaptureResult): ExceptionItem[] {
  const list = result.properties?.["$exception_list"];
  return Array.isArray(list) ? (list as ExceptionItem[]) : [];
}

// True only when at least one stack frame is attributed to our own code.
// Exceptions with no frames at all (e.g. cross-origin "Script error.") cannot
// be attributed to us and are treated as third-party.
function hasFirstPartyFrame(exceptions: ExceptionItem[]): boolean {
  return exceptions.some((exception) =>
    (exception.stacktrace?.frames ?? []).some((frame) => frame.in_app === true),
  );
}

function matchesExtensionDenylist(exceptions: ExceptionItem[]): boolean {
  const haystack = exceptions
    .flatMap((exception) => [exception.type, exception.value])
    .filter((part): part is string => typeof part === "string")
    .join(" ");
  return EXTENSION_ERROR_PATTERNS.some((pattern) => haystack.includes(pattern));
}

function filterThirdPartyExceptions(
  result: CaptureResult | null,
): CaptureResult | null {
  if (!result || result.event !== "$exception") {
    return result;
  }

  const exceptions = getExceptionList(result);
  if (matchesExtensionDenylist(exceptions) || !hasFirstPartyFrame(exceptions)) {
    return null;
  }

  return result;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: "/ph",
        ui_host: "https://us.posthog.com",
        person_profiles: "always", // or 'always' to create profiles for anonymous users as well
        capture_pageview: false, // Disable automatic pageview capture, as we capture manually
        capture_pageleave: true, // Enable pageleave capture
        before_send: filterThirdPartyExceptions, // Drop extension/third-party exceptions
      });
    }
  }, []);

  return (
    <PHProvider client={posthog}>
      <SuspendedPostHogPageView />
      {children}
    </PHProvider>
  );
}

function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthog = usePostHog();

  // Track pageviews
  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname;
      if (searchParams.toString()) {
        url = url + "?" + searchParams.toString();
      }

      posthog.capture("$pageview", { $current_url: url });
    }
  }, [pathname, searchParams, posthog]);

  return null;
}

// Wrap PostHogPageView in Suspense to avoid the useSearchParams usage above
// from de-opting the whole app into client-side rendering
// See: https://nextjs.org/docs/messages/deopted-into-client-rendering
function SuspendedPostHogPageView() {
  return (
    <Suspense fallback={null}>
      <PostHogPageView />
    </Suspense>
  );
}
