import { TaxYearProvinceConfig } from "../../types";
import {
  ALBERTA_FEDERAL_TRANSFER_NAME,
  ALBERTA_SPENDING,
} from "../2025/alberta";
import {
  ONTARIO_FEDERAL_TRANSFER_NAME,
  ONTARIO_SPENDING,
} from "../2025/ontario";
import { FEDERAL_SPENDING, FEDERAL_TAX_CONFIG } from "./federal";
import { ALBERTA_TAX_CONFIG } from "./alberta";
import { BRITISH_COLUMBIA_TAX_CONFIG } from "./british-columbia";
import { MANITOBA_TAX_CONFIG } from "./manitoba";
import { NEW_BRUNSWICK_TAX_CONFIG } from "./new-brunswick";
import { NEWFOUNDLAND_AND_LABRADOR_TAX_CONFIG } from "./newfoundland-and-labrador";
import { NORTHWEST_TERRITORIES_TAX_CONFIG } from "./northwest-territories";
import { NOVA_SCOTIA_TAX_CONFIG } from "./nova-scotia";
import { NUNAVUT_TAX_CONFIG } from "./nunavut";
import { ONTARIO_TAX_CONFIG } from "./ontario";
import { PRINCE_EDWARD_ISLAND_TAX_CONFIG } from "./prince-edward-island";
import { QUEBEC_TAX_CONFIG } from "./quebec";
import { SASKATCHEWAN_TAX_CONFIG } from "./saskatchewan";
import { YUKON_TAX_CONFIG } from "./yukon";

export const YEAR = "2026";

export const ALBERTA_CONFIG: TaxYearProvinceConfig = {
  year: YEAR,
  province: "alberta",
  federal: FEDERAL_TAX_CONFIG,
  provincial: ALBERTA_TAX_CONFIG,
  // Provincial spending is the same as 2025 (2023-24 fiscal data) until new
  // fiscal data is available
  spending: {
    federal: FEDERAL_SPENDING,
    provincial: ALBERTA_SPENDING,
    federalTransferName: ALBERTA_FEDERAL_TRANSFER_NAME,
  },
};

export const BRITISH_COLUMBIA_CONFIG: TaxYearProvinceConfig = {
  year: YEAR,
  province: "british-columbia",
  federal: FEDERAL_TAX_CONFIG,
  provincial: BRITISH_COLUMBIA_TAX_CONFIG,
};

export const MANITOBA_CONFIG: TaxYearProvinceConfig = {
  year: YEAR,
  province: "manitoba",
  federal: FEDERAL_TAX_CONFIG,
  provincial: MANITOBA_TAX_CONFIG,
};

export const NEW_BRUNSWICK_CONFIG: TaxYearProvinceConfig = {
  year: YEAR,
  province: "new-brunswick",
  federal: FEDERAL_TAX_CONFIG,
  provincial: NEW_BRUNSWICK_TAX_CONFIG,
};

export const NEWFOUNDLAND_AND_LABRADOR_CONFIG: TaxYearProvinceConfig = {
  year: YEAR,
  province: "newfoundland-and-labrador",
  federal: FEDERAL_TAX_CONFIG,
  provincial: NEWFOUNDLAND_AND_LABRADOR_TAX_CONFIG,
};

export const NORTHWEST_TERRITORIES_CONFIG: TaxYearProvinceConfig = {
  year: YEAR,
  province: "northwest-territories",
  federal: FEDERAL_TAX_CONFIG,
  provincial: NORTHWEST_TERRITORIES_TAX_CONFIG,
};

export const NOVA_SCOTIA_CONFIG: TaxYearProvinceConfig = {
  year: YEAR,
  province: "nova-scotia",
  federal: FEDERAL_TAX_CONFIG,
  provincial: NOVA_SCOTIA_TAX_CONFIG,
};

export const NUNAVUT_CONFIG: TaxYearProvinceConfig = {
  year: YEAR,
  province: "nunavut",
  federal: FEDERAL_TAX_CONFIG,
  provincial: NUNAVUT_TAX_CONFIG,
};

export const ONTARIO_CONFIG: TaxYearProvinceConfig = {
  year: YEAR,
  province: "ontario",
  federal: FEDERAL_TAX_CONFIG,
  provincial: ONTARIO_TAX_CONFIG,
  // Provincial spending is the same as 2025 (2023-24 fiscal data) until new
  // fiscal data is available
  spending: {
    federal: FEDERAL_SPENDING,
    provincial: ONTARIO_SPENDING,
    federalTransferName: ONTARIO_FEDERAL_TRANSFER_NAME,
  },
};

export const PRINCE_EDWARD_ISLAND_CONFIG: TaxYearProvinceConfig = {
  year: YEAR,
  province: "prince-edward-island",
  federal: FEDERAL_TAX_CONFIG,
  provincial: PRINCE_EDWARD_ISLAND_TAX_CONFIG,
};

export const QUEBEC_CONFIG: TaxYearProvinceConfig = {
  year: YEAR,
  province: "quebec",
  federal: FEDERAL_TAX_CONFIG,
  provincial: QUEBEC_TAX_CONFIG,
};

export const SASKATCHEWAN_CONFIG: TaxYearProvinceConfig = {
  year: YEAR,
  province: "saskatchewan",
  federal: FEDERAL_TAX_CONFIG,
  provincial: SASKATCHEWAN_TAX_CONFIG,
};

export const YUKON_CONFIG: TaxYearProvinceConfig = {
  year: YEAR,
  province: "yukon",
  federal: FEDERAL_TAX_CONFIG,
  provincial: YUKON_TAX_CONFIG,
};

// Re-export individual configs
export { FEDERAL_TAX_CONFIG, FEDERAL_SPENDING } from "./federal";
export { ALBERTA_TAX_CONFIG } from "./alberta";
export { BRITISH_COLUMBIA_TAX_CONFIG } from "./british-columbia";
export { MANITOBA_TAX_CONFIG } from "./manitoba";
export { NEW_BRUNSWICK_TAX_CONFIG } from "./new-brunswick";
export { NEWFOUNDLAND_AND_LABRADOR_TAX_CONFIG } from "./newfoundland-and-labrador";
export { NORTHWEST_TERRITORIES_TAX_CONFIG } from "./northwest-territories";
export { NOVA_SCOTIA_TAX_CONFIG } from "./nova-scotia";
export { NUNAVUT_TAX_CONFIG } from "./nunavut";
export { ONTARIO_TAX_CONFIG } from "./ontario";
export { PRINCE_EDWARD_ISLAND_TAX_CONFIG } from "./prince-edward-island";
export { QUEBEC_TAX_CONFIG } from "./quebec";
export { SASKATCHEWAN_TAX_CONFIG } from "./saskatchewan";
export { YUKON_TAX_CONFIG } from "./yukon";
