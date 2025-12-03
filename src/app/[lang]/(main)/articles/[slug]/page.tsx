import { Page, PageContent, Section } from "@/components/Layout";
import { AuthorProfile } from "@/components/articles/AuthorProfile";
import { RelatedArticles } from "@/components/articles/RelatedArticles";
import { MDXComponents } from "@/components/mdx-components";
import {
  getArticleSlugs,
  getArticleWithAuthor,
  getRelatedArticles,
  formatDate,
} from "@/lib/articles";
import { initLingui } from "@/initLingui";
import { generateHreflangAlternates } from "@/lib/utils";
import { locales } from "@/lib/constants";
import { Trans } from "@lingui/react/macro";
import { notFound } from "next/navigation";
import { FiClock, FiCalendar } from "react-icons/fi";
import { PropsWithChildren } from "react";

interface ArticlePageProps {
  params: Promise<{
    lang: string;
    slug: string;
  }>;
}

// Generate static params for all articles (for static site generation)
export async function generateStaticParams() {
  const paths: { lang: string; slug: string }[] = [];

  for (const lang of locales) {
    const slugs = getArticleSlugs(lang);
    slugs.forEach((slug) => {
      paths.push({ lang, slug });
    });
  }

  return paths;
}

// Generate metadata for SEO
export async function generateMetadata(
  props: PropsWithChildren<ArticlePageProps>,
) {
  const { lang, slug } = await props.params;
  const article = getArticleWithAuthor(slug, lang);

  if (!article) {
    return {
      title: "Article Not Found | Canada Spends",
    };
  }

  return {
    title: `${article.metadata.title} | Canada Spends`,
    description: article.metadata.subtitle,
    alternates: generateHreflangAlternates(lang, "/articles/[slug]", { slug }),
    openGraph: {
      title: article.metadata.title,
      description: article.metadata.subtitle,
      type: "article",
      publishedTime: article.metadata.publishDate,
      authors: [article.authorData.name],
    },
  };
}

export default async function ArticlePage(
  props: PropsWithChildren<ArticlePageProps>,
) {
  const { lang, slug } = await props.params;
  initLingui(lang);

  // Get the article with author data
  const article = getArticleWithAuthor(slug, lang);

  if (!article) {
    notFound();
  }

  // Get related articles
  const relatedArticles = getRelatedArticles(slug, lang, 3);

  // Dynamically import the MDX content
  // MDX files compiled by Next.js accept a components prop
  const MDXModule = await import(
    `../../../../../../articles/${lang}/${slug}/index.mdx`
  );
  const MDXContent = MDXModule.default;

  return (
    <Page>
      <PageContent>
        {/* Article Header */}
        <Section>
          <div className="max-w-4xl mx-auto">
            {/* Tags */}
            {article.metadata.tags && article.metadata.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {article.metadata.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-medium px-3 py-1 rounded-full bg-indigo-100 text-indigo-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {article.metadata.title}
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-gray-600 mb-6">
              {article.metadata.subtitle}
            </p>

            {/* Metadata Row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-8">
              {/* Publish Date */}
              <div className="flex items-center gap-2">
                <FiCalendar className="w-4 h-4" />
                <span>{formatDate(article.metadata.publishDate, lang)}</span>
              </div>

              {/* Reading Time */}
              <div className="flex items-center gap-2">
                <FiClock className="w-4 h-4" />
                <span>{article.readingTime.text}</span>
              </div>
            </div>

            {/* Author Profile */}
            <AuthorProfile author={article.authorData} />
          </div>
        </Section>

        {/* Article Content */}
        <Section>
          <article className="max-w-4xl mx-auto prose prose-lg prose-gray prose-headings:font-bold prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline">
            <MDXContent components={MDXComponents} />
          </article>
        </Section>

        {/* Related Articles */}
        <Section>
          <div className="max-w-4xl mx-auto">
            <RelatedArticles
              articles={relatedArticles}
              lang={lang}
              title={lang === "fr" ? "Articles connexes" : "Related Articles"}
            />
          </div>
        </Section>

        {/* Back to Articles Link */}
        <Section>
          <div className="max-w-4xl mx-auto text-center">
            <a
              href={`/${lang}/articles`}
              className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium"
            >
              ← <Trans>Back to All Articles</Trans>
            </a>
          </div>
        </Section>
      </PageContent>
    </Page>
  );
}
