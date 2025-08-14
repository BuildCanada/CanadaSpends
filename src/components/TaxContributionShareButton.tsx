"use client";

import { Twitter, Facebook, Linkedin } from "lucide-react";

interface TaxContributionShareButtonProps {
  contributionIndex: number;
  amount: number;
  lang: string;
  item: string;
}

export function TaxContributionShareButton({
  contributionIndex,
  amount,
  lang,
  item,
}: TaxContributionShareButtonProps) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = `${baseUrl}/${lang}/tax-visualizer/share/${contributionIndex}?amount=${amount}`;

  // Format amount properly for display
  const formattedAmount = new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  const shareText = `Proud to contribute ${formattedAmount} towards ${item} 🇨🇦`;
  const ogImageUrl = `${baseUrl}/api/og?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="flex flex-col items-center space-y-4">
      <img
        src={ogImageUrl}
        alt="Social media share preview"
        className="rounded-lg border w-full max-w-md"
      />
      <div className="flex items-center space-x-2">
        <a
          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-full bg-blue-400 text-white hover:bg-blue-500"
        >
          <Twitter size={20} />
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700"
        >
          <Facebook size={20} />
        </a>
        <a
          href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-full bg-blue-800 text-white hover:bg-blue-900"
        >
          <Linkedin size={20} />
        </a>
      </div>
    </div>
  );
}
