"use client";

import { createClient } from "@/lib/supabase/client";
import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";

export function AuthListener() {
  const posthog = usePostHog();
  const supabase = createClient();

  useEffect(() => {
    // Check current session on mount (handles page refreshes)
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        posthog.identify(user.id, { email: user.email });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        posthog.identify(session.user.id, { email: session.user.email });
      } else if (event === "SIGNED_OUT") {
        posthog.reset();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [posthog, supabase.auth]);

  return null;
}
