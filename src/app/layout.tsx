import { allMessages } from "@/appRouterI18n";
import { LinguiClientProvider } from "@/components/LinguiClientProvider";
import { initLingui } from "@/initLingui";
import { ReactNode } from "react";
import { Toaster } from "sonner";
import "./[lang]/globals.css";
import { PostHogProvider } from "./[lang]/providers";

export default function RootLayout({ children }: { children: ReactNode }) {
  // Initialize with default language for root layout
  // The [lang] layout will override this with the actual language
  initLingui("en");

  return (
    <html lang="en">
      <body className="antialiased">
        <PostHogProvider>
          <LinguiClientProvider
            initialLocale="en"
            initialMessages={allMessages["en"]!}
          >
            {children}
            <Toaster position="top-right" richColors />
          </LinguiClientProvider>
        </PostHogProvider>
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
