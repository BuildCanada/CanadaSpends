import { allMessages } from "@/appRouterI18n";
import { LinguiClientProvider } from "@/components/LinguiClientProvider";
import { initLingui, PageLangParam } from "@/initLingui";
import { generateHreflangAlternates } from "@/lib/utils";
import { useLingui } from "@lingui/react/macro";
import { PropsWithChildren } from "react";
import { Toaster } from "sonner";
import "./globals.css";
import { PostHogProvider } from "./providers";

export async function generateMetadata(
  props: PropsWithChildren<PageLangParam>,
) {
  const lang = (await props.params).lang;
  initLingui(lang);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { t } = useLingui();

  return {
    title: t`Get The Facts About Government Spending`,
    description: t`Government spending shouldn't be a black box. We turn complex data into clear, non-partisan insights so every Canadian knows where their money goes.`,
    alternates: generateHreflangAlternates(lang),
    openGraph: {
      images: [
        {
          url: `https://canadaspends.com/cs-seo-image.png`,
          width: 1200,
          height: 630,
          alt: "Canada Spends",
        },
      ],
    },
    icons: [
      {
        url: "/favicon-96x96.png",
        type: "image/png",
        sizes: "96x96",
      },
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
      },
      {
        url: "/favicon.ico",
        rel: "shortcut icon",
      },
      {
        url: "/apple-touch-icon.png",
        rel: "apple-touch-icon",
        sizes: "180x180",
      },
    ],
    manifest: "/site.webmanifest",
    appleWebApp: {
      title: "CanadaSpends",
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: PropsWithChildren<PageLangParam>) {
  const lang = (await params).lang;
  initLingui(lang);

  return (
    <html lang={lang}>
      <body className="antialiased">
        <PostHogProvider>
          <LinguiClientProvider
            initialLocale={lang}
            initialMessages={allMessages[lang]!}
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
