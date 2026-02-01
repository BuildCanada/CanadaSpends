"use client";

import {
  useCurrentRefinements,
  useClearRefinements,
} from "react-instantsearch";

// Define attribute labels here as they are closely tied to this component
const attributeLabels: Record<string, string> = {
  fiscal_year: "Fiscal Year",
  payer: "Department",
  award_type: "Type",
  province: "Province",
  country: "Country",
  program: "Program",
  recipient: "Recipient",
};

// --- IndividualRefinementChips Component ---
export function IndividualRefinementChips() {
  const { items, refine } = useCurrentRefinements();
  const { canRefine: canClear, refine: clearAllRefinements } =
    useClearRefinements();

  const allRefinements = items.flatMap((item) =>
    item.refinements.map((refinement) => {
      // Extract attribute label using the constant defined above
      const attributeLabel = attributeLabels[item.attribute] || item.attribute;
      return {
        ...refinement,
        attribute: item.attribute, // Ensure original attribute is preserved if needed
        attributeLabel: attributeLabel,
      };
    }),
  );

  if (allRefinements.length === 0) {
    return null;
  }

  return (
    <div className="px-4 mt-3 mb-3 flex items-center gap-2 flex-wrap">
      {allRefinements.map(
        (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          refinement: any,
        ) => (
          <div
            key={`${refinement.attribute}-${refinement.value}`}
            className="flex items-center bg-gray-100 rounded-lg px-2 py-0.5 text-xs font-medium"
          >
            <span className="mr-1 font-semibold">
              {refinement.attributeLabel}:
            </span>
            <span className="mr-1.5">{refinement.label}</span>
            <button
              onClick={() => refine(refinement)} // Pass the whole refinement object back to refine
              className="ml-1 text-gray-500 hover:text-gray-800 font-bold leading-none"
              aria-label={`Remove ${refinement.label}`}
            >
              &times;
            </button>
          </div>
        ),
      )}
      {canClear && (
        <button
          onClick={clearAllRefinements}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Clear All
        </button>
      )}
    </div>
  );
}
