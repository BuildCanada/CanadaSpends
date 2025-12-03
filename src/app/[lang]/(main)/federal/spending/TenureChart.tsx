import { BarList } from "@/components/BarList";
import { useLingui } from "@lingui/react/macro";

export const TenureChart = () => {
  const { t } = useLingui();

  const tenureData = [
    { name: t`Indeterminate`, value: 359000 },
    { name: t`Student + Casual`, value: 22000 },
    { name: t`Term`, value: 59000 },
  ];

  return (
    <BarList
      className="h-40"
      data={tenureData}
      valueFormatter={(value) =>
        Intl.NumberFormat("en-US", {
          notation: "compact",
        }).format(Number(value))
      }
    />
  );
};
