import { Metadata } from "next";
import { redirect } from "next/navigation";
import { viralShares } from "@/lib/viralShares";
import { formatCurrency } from "@/lib/taxCalculator";

interface SharePageProps {
  params: {
    lang: string;
    contribution: string;
  };
  searchParams: {
    amount?: string;
  };
}

export async function generateMetadata({
  params,
  searchParams,
}: SharePageProps): Promise<Metadata> {
  const contributionIndex = parseInt(params.contribution);
  const amount = searchParams.amount ? parseFloat(searchParams.amount) : 0;

  if (
    isNaN(contributionIndex) ||
    contributionIndex < 0 ||
    contributionIndex >= viralShares.length
  ) {
    return {
      title: "Canada Spends - Tax Contribution",
    };
  }

  const contributionName = viralShares[contributionIndex].item;
  const shareText = `🇨🇦 Proud to contribute ${formatCurrency(amount)} towards ${contributionName}! My taxes are building a better Canada for everyone. 💪 #BuildCanada`;
  const ogImageUrl = `https://canadaspends.com/api/og?text=${encodeURIComponent(shareText)}`;

  return {
    title: `Tax Contribution: ${contributionName}`,
    description: shareText,
    openGraph: {
      title: `Tax Contribution: ${contributionName}`,
      description: shareText,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: shareText,
        },
      ],
      type: "website",
      url: `https://canadaspends.com/${params.lang}/tax-visualizer/share/${params.contribution}?amount=${amount}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `Tax Contribution: ${contributionName}`,
      description: shareText,
      images: [ogImageUrl],
    },
    other: {
      "twitter:image:src": ogImageUrl,
      "og:image:secure_url": ogImageUrl,
    },
  };
}

export default function SharePage({ params }: SharePageProps) {
  // Redirect to the main tax visualizer page
  redirect(`/${params.lang}/tax-visualizer`);
}
