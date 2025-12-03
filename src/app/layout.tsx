import { allMessages } from "@/appRouterI18n";
import { LinguiClientProvider } from "@/components/LinguiClientProvider";
import { initLingui } from "@/initLingui";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import "./[lang]/globals.css";
import { PostHogProvider } from "./[lang]/providers";

// Root layout must provide <html> and <body> tags
// Default to 'en' for root layout (actual lang is handled by [lang]/layout)
const plusJakartaSans = Plus_Jakarta_Sans({
  weight: ["600", "700"],
  subsets: ["latin"],
});

export default function RootLayout({ children }: { children: ReactNode }) {
  // Initialize with default language for root layout
  // The [lang] layout will override this with the actual language
  initLingui("en");

  return (
    <html lang="en">
      <body className={cn("antialiased", plusJakartaSans.className)}>
        <PostHogProvider>
          <LinguiClientProvider
            initialLocale="en"
            initialMessages={allMessages["en"]!}
          >
            {children}
            <Toaster position="top-right" richColors />
          </LinguiClientProvider>
        </PostHogProvider>
        <Analytics />
        {/* Simple Analytics Script */}
        <script
          async
          defer
          src="https://scripts.simpleanalyticscdn.com/latest.js"
        ></script>
        <noscript>
          <img
            src="https://queue.simpleanalyticscdn.com/noscript.gif"
            alt=""
            referrerPolicy="no-referrer-when-downgrade"
          />
        </noscript>
      </body>
    </html>
  );
}
