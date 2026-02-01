// app/providers.tsx
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import { usePostHog } from "posthog-js/react";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: "/ph",
        ui_host: "https://us.posthog.com",
        person_profiles: "always", // or 'always' to create profiles for anonymous users as well
        capture_pageview: false, // Disable automatic pageview capture, as we capture manually
        capture_pageleave: true, // Enable pageleave capture
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

  // Capture put_me_in_coach_* query parameters as person properties
  useEffect(() => {
    if (!posthog) return;

    const personProperties: Record<string, string> = {};
    const keysToRemove: string[] = [];

    searchParams.forEach((value, key) => {
      if (key.startsWith("put_me_in_coach_")) {
        personProperties[key] = value;
        keysToRemove.push(key);
      }
    });

    if (keysToRemove.length > 0) {
      posthog.setPersonProperties(personProperties);

      // Remove the query parameters from the URL without triggering a page reload
      const newSearchParams = new URLSearchParams(searchParams.toString());
      keysToRemove.forEach((key) => newSearchParams.delete(key));
      const newUrl =
        window.origin +
        pathname +
        (newSearchParams.toString() ? "?" + newSearchParams.toString() : "");
      window.history.replaceState(null, "", newUrl);
    }
  }, [searchParams, posthog, pathname]);

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
