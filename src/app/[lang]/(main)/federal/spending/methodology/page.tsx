import {
  ExternalLink,
  H1,
  H2,
  Intro,
  P,
  Page,
  PageContent,
  Section,
} from "@/components/Layout";
import { formatNumber } from "@/components/Sankey/utils";
import {
  getFederalDefaultYear,
  getFederalReconciliation,
  getFederalSummary,
} from "@/lib/federal";
import { initLingui, type PageLangParam } from "@/initLingui";
import { locales } from "@/lib/constants";
import { generateHreflangAlternates } from "@/lib/utils";
import { Trans, useLingui } from "@lingui/react/macro";
import type { PropsWithChildren } from "react";

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(
  props: PropsWithChildren<PageLangParam>,
) {
  const lang = (await props.params).lang;
  initLingui(lang);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { t } = useLingui();
  return {
    title: t`Federal Spending Methodology | Canada Spends`,
    description: t`How federal spending pages are built from Public Accounts of Canada data.`,
    alternates: generateHreflangAlternates(lang),
  };
}

export default async function FederalMethodologyPage(props: PageLangParam) {
  const lang = (await props.params).lang;
  initLingui(lang);

  const year = getFederalDefaultYear();
  const reconciliation = year ? getFederalReconciliation(year) : null;
  const summary = year ? getFederalSummary(year) : null;

  return (
    <Page>
      <PageContent>
        <Section>
          <H1>
            <Trans>Federal Spending Methodology</Trans>
          </H1>
          <Intro>
            <Trans>
              These pages are generated from the Public Accounts of Canada. This
              page documents the accounting bases, curation choices, and known
              differences so the numbers are traceable to source.
            </Trans>
          </Intro>
        </Section>

        <Section>
          <H2>
            <Trans>Volume I vs Volume II basis</Trans>
          </H2>
          <P>
            <Trans>
              Headline totals on the overview page (total spending, revenue, and
              deficit) use the Volume I consolidated financial statements, which
              are prepared on an accrual basis and include consolidated Crown
              corporations. For recent years the overview ministry list and the
              thematic Sankey are also on this Volume I accrual basis (see the
              allocation note below), so they sum to the headline exactly.
              Department pages remain on the Volume II appropriations
              (expenditure) basis, ministry by ministry, because that is where
              the line-level vote and transfer-payment detail exists — so a
              department&rsquo;s own total differs from its accrual ministry row
              on the overview. The reconciliation below bridges the two bases.
            </Trans>
          </P>
        </Section>

        <Section>
          <H2>
            <Trans>How ministry and Sankey totals are allocated</Trans>
          </H2>
          <P>
            <Trans>
              On the Volume I accrual basis, each ministry&rsquo;s total comes
              from Volume I Table 3.6 (&ldquo;External expenses by segment and
              by type&rdquo;), which reports accrual expenses for each
              ministerial portfolio. Where our portfolio grouping is finer than
              the table (for example, a regional development agency reported
              inside a host portfolio), the segment total is split across the
              affected portfolios in proportion to their Volume II expenditure
              shares for that year; where it is coarser, the relevant segments
              are summed. In the thematic Sankey, each portfolio&rsquo;s accrual
              total is spread across its thematic categories in the same
              proportions as its Volume II lines, and the tax-system and
              statutory items sourced directly from Volume I (Old Age Security,
              Employment Insurance, the Canada Child Benefit, major transfers to
              provinces, public debt charges, and so on) are carved out of the
              owning portfolio so nothing is double counted. Two
              non-departmental statement lines — net actuarial losses and the
              provision for valuation and other items — are shown as their own
              rows and leaves. Because sub-ministry Sankey leaves are allocated
              this way, they are proportional estimates, not literal Volume II
              line amounts; the department page carries the exact appropriations
              detail. For older years, each Table 3.6 edition carries the
              figures as first published while the headline uses the restated
              ten-year comparative statement, so the vintage segment figures are
              scaled proportionally to tie to the restated statement totals
              exactly (and for editions predating the separate net actuarial
              losses line, that statement amount is carved out of the portfolios
              the same way). Every year&rsquo;s ministry list and Sankey
              therefore sum to the published headline.
            </Trans>
          </P>
        </Section>

        <Section>
          <H2>
            <Trans>Net actuarial losses and the published total</Trans>
          </H2>
          <P>
            <Trans>
              Total spending equals the published Consolidated Statement of
              Operations total expenses, which include net actuarial losses on
              pensions and future benefits. In the source statement this line is
              stored sign-inverted (a loss is shown as a negative number), so we
              normalize it to a positive cost and place it under Obligations,
              alongside net interest on debt. With this line included, headline
              total spending, total revenue, and the deficit match the published
              statement exactly, and revenue minus spending equals the published
              Annual operating deficit for every year (a surplus year would show
              a negative deficit, labelled as a surplus).
            </Trans>
          </P>
        </Section>

        <Section>
          <H2>
            <Trans>Accounting and consolidation adjustments</Trans>
          </H2>
          <P>
            <Trans>
              Every published year is on the Volume I accrual basis, so the
              spending Sankey sums to the published headline and no adjustments
              leaf appears. The mechanism remains as a safeguard: should a
              residual over $1 million ever arise, a single top-level
              &ldquo;Accounting and consolidation adjustments&rdquo; leaf would
              reconcile the tree to the published total (it may be negative and
              equals the unattributed remainder in the reconciliation table
              below), keeping the Sankey and the reconciliation consistent.
            </Trans>
          </P>
        </Section>

        <Section>
          <H2>
            <Trans>Curation differences from the previous site</Trans>
          </H2>
          <P>
            <Trans>
              The previous hand-authored pages contained curated aggregations —
              for example, hand-massaged negative leaves and thematic groupings
              that split a single ministry across categories. Every node where
              the generated tree differs from the previous values is enumerated
              in the parity report with a reason code (basis, mapping, rounding,
              or source correction).
            </Trans>
          </P>
        </Section>

        <Section>
          <H2>
            <Trans>Machinery-of-government changes</Trans>
          </H2>
          <P>
            <Trans>
              Ministries have been renamed and merged between 2013 and 2025 (for
              example, Indian Affairs became Crown-Indigenous Relations). A
              normalization crosswalk is the canonical mapping; department pages
              for earlier years render under the current ministry slug with a
              note stating how the ministry was reported in that fiscal year.
            </Trans>
          </P>
        </Section>

        <Section>
          <H2>
            <Trans>Negative and adjustment rows</Trans>
          </H2>
          <P>
            <Trans>
              Parenthesized negatives, internal consolidation adjustments, and
              total or subtotal rows are flagged and excluded from Sankey leaves
              to avoid double counting, but they are retained in the line-item
              tables so the full detail remains available.
            </Trans>
          </P>
        </Section>

        <Section>
          <H2>
            <Trans>Units</Trans>
          </H2>
          <P>
            <Trans>
              Source tables arrive in mixed units (Volume I in millions, Volume
              II in dollars, open data CSVs in thousands). All chart data is
              normalized to billions of dollars; line-item tables are shown in
              dollars. Each JSON file records its units explicitly.
            </Trans>
          </P>
        </Section>

        <Section>
          <H2>
            <Trans>Thematic mapping</Trans>
          </H2>
          <P>
            <Trans>
              The Sankey uses a curated thematic tree. A maintained mapping
              assigns each Public Accounts line to a thematic node, mostly at
              the ministry or organization level with line-level overrides where
              needed. Each node is truncated to its largest children with the
              remainder rolled into an &ldquo;Other&rdquo; aggregate.
            </Trans>
          </P>
        </Section>

        <Section>
          <H2>
            <Trans>Translation</Trans>
          </H2>
          <P>
            <Trans>
              French labels use official bilingual terminology from open
              government data as a glossary; only free-text line-item
              descriptions are machine-translated, with the glossary supplied as
              required terminology. Translations are committed and reviewed, not
              generated at build time.
            </Trans>
          </P>
        </Section>

        <Section>
          <H2>
            <Trans>Inflation adjustment</Trans>
          </H2>
          <P>
            <Trans>
              Each year carries a Consumer Price Index multiplier to base-year
              dollars. The real/nominal toggle scales displayed headline and
              department figures in the browser; the underlying data is stored
              in nominal dollars only.
            </Trans>
          </P>
        </Section>

        {reconciliation && summary && (
          <Section>
            <H2>
              <Trans>
                Volume I to Volume II reconciliation, FY {summary.financialYear}
              </Trans>
            </H2>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-3 py-2 font-semibold text-foreground/70">
                      <Trans>Item</Trans>
                    </th>
                    <th className="px-3 py-2 font-semibold text-foreground/70 text-right">
                      <Trans>Amount</Trans>
                    </th>
                    <th className="px-3 py-2 font-semibold text-foreground/70">
                      <Trans>Note</Trans>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-3 py-2 font-medium">
                      <Trans>Volume I consolidated total</Trans>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatNumber(reconciliation.vol1Total, 1e9)}
                    </td>
                    <td className="px-3 py-2 text-foreground/60" />
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium">
                      <Trans>Sum of Volume II ministry totals</Trans>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatNumber(reconciliation.vol2MinistrySum, 1e9)}
                    </td>
                    <td className="px-3 py-2 text-foreground/60" />
                  </tr>
                  {reconciliation.items.map((item, idx) => (
                    <tr key={item.id ?? idx}>
                      <td className="px-3 py-2 pl-6">{item.name}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatNumber(item.amount, 1e9)}
                      </td>
                      <td className="px-3 py-2 text-foreground/60">
                        {item.note}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-medium">
                    <td className="px-3 py-2">
                      <Trans>Total difference</Trans>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatNumber(reconciliation.difference, 1e9)}
                    </td>
                    <td className="px-3 py-2" />
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>
        )}

        <Section>
          <H2>
            <Trans>Source and licence</Trans>
          </H2>
          <P>
            <Trans>
              Data is derived from the Public Accounts of Canada under the Open
              Government Licence – Canada.
            </Trans>{" "}
            <ExternalLink href="https://www.tpsgc-pwgsc.gc.ca/recgen/cpc-pac/index-eng.html">
              <Trans>Public Accounts of Canada</Trans>
            </ExternalLink>
          </P>
        </Section>
      </PageContent>
    </Page>
  );
}
