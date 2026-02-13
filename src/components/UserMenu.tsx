"use client";

import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Trans } from "@lingui/react/macro";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLingui } from "@lingui/react/macro";

export function UserMenu() {
  const { i18n } = useLingui();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push(`/${i18n.locale}/login`);
    router.refresh();
  };

  if (!user) {
    return null;
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-sm font-medium text-muted-foreground/80 hover:text-foreground"
    >
      <Trans>Sign Out</Trans>
    </button>
  );
}
