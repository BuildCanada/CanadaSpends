import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/hover-card";
import { FaCircleInfo } from "react-icons/fa6";
import { notFound } from "next/navigation";
import { DetailsPage } from "./DetailsPage";

function InfoHoverCard({ info }: { info: string }) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <FaCircleInfo className="text-muted-foreground/40" />
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex justify-between space-x-4 text-sm">{info}</div>
      </HoverCardContent>
    </HoverCard>
  );
}

const CADDollar = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "CAD",
});

const formatMoney = (value: number) => {
  return CADDollar.format(value);
};

const fieldMapping = {
  reference_number: {
    human_name: "Reference Number",
    info: "It is a unique identifier given to each line item in the spreadsheet. Having a unique identifier for each item will allow users to locate a specific item should they need to modify or delete.",
    mapping: null,
  },
  procurement_id: {
    human_name: "Procurement Identification Number",
    info: "It is recommended that the procurement identification number be the contract number. Alternatively, the procurement identification number may be the commitment number or requisition number if this is the standard practice in the department.",
    mapping: null,
  },
  // vendor_name: {
  //   human_name: "Vendor Name",
  //   info: "It is recommended that the vendor name be the legal name of the contractor, as indicated on the contract. Alternatively, the vendor name may be the name in the financial system if this is the standard practice in the department.",
  //   mapping: null
  // },
  vendor_postal_code: {
    human_name: "Vendor Postal Code",
    info: 'i. It is recommended that this field be populated with the first three digits of the postal code for the vendor identified in the contract. ii. Alternatively, the vendor postal code may be the first three digits of the postal code identified in the procurement or financial system if this is the standard practice in the department. iii. This field is to be populated with "NA" if the vendor is located outside of Canada, as the value "NA" for this field indicates not applicable.',
    mapping: null,
  },
  buyer_name: {
    human_name: "Buyer Name",
    info: 'i. It is recommended that the field be populated with the name of the buyer, as indicated on the original contract or, alternatively, the individual responsible for the procurement at the department. ii. For the establishment of a standing offer or supply arrangement agreement, it is recommended that this field be populated with the name of the buyer that issued the original standing offer or supply arrangement agreement. iii. For a call-up contract against a standing offer or supply arrangement, this field should be the name of the buyer identified in the original call-up contract. iv. For a contract with task authorizations, this field may be populated with the name of the buyer indicated in the original contract or in the individual task authorization. v. For amendments, it is recommended that this field be populated with the value "NA," as the value "NA" for this field indicates not applicable. vi. For contracts awarded by PSPC or Shared Services Canada (SSC) on behalf of the client department, it is recommended that this field be populated with the name of the PSPC or SSC contracting authority. If this is not available, indicate the values, "PSPC-SPAC" or "SSC-SPC" as applicable.',
    mapping: null,
  },
  contract_date: {
    human_name: "Contract Date",
    info: "i. It is recommended that the contract date be the date the contract is awarded by the government. Alternatively, the contract date may be the hard commitment date (the date that the financial commitment is recorded in the departmental financial system) if this is the standard practice in the department. ii. It is recommended that the contract date for a contract with task authorizations be the date that the contract is awarded (or the hard commitment date) for the contract. When the full value of the contract with task authorizations is likely not to be used, the contract date for each task authorization may be the date that each task authorization is issued (or the hard commitment date). iii. It is recommended that the contract date for an amended contract or the exercising of an option be the date that the contract is awarded (or the hard commitment date). iv. It is recommended that the contract date for a confirming order be the date of the verbal contract for goods, services or an amendment. If the date of the verbal contract cannot be determined, the contract date may be the date that the confirming order is issued.",
    mapping: null,
  },
  economic_object_code: {
    human_name: "Economic Object Code",
    info: 'i. It is recommended that this field be populated with the contract\'s numeric economic object code. Economic object codes are listed in the government-wide chart of accounts. The use of accurate economic object codes is important for maintaining the integrity of the Public Accounts of Canada. Departments are to ensure that all expenditures are coded appropriately in accordance with the Directive on Accounting Standards: GC 5000 Recording Financial Transactions in the Accounts of Canada. ii. For standing offers and supply arrangement agreements, this field may be populated with the data value "NA" as the value "NA" for this field means not applicable. iii. When a contract involves more than one economic object, it is recommended that the economic object associated with the largest dollar value be used. A department may use a different approach if this is the standard practice in the department.',
    mapping: null,
  },
  // description_en: {
  //   human_name: "Description of Work English",
  //   info: "It is recommended that this field be populated with the economic object code's text description as listed in the government-wide chart of accounts ( http://www.tpsgc-pwgsc.gc.ca/recgen/pceaf-gwcoa/index-eng.html ). For standing offers and supply arrangement agreements, this field may be populated with the commodity code's text description used by the federal government for procurement activities.",
  //   mapping: null
  // },
  // description_fr: {
  //   human_name: "Description of Work French",
  //   info: "It is recommended that this field be populated with the economic object code's text description as listed in the government-wide chart of accounts ( http://www.tpsgc-pwgsc.gc.ca/recgen/pceaf-gwcoa/index-eng.html ). For standing offers and supply arrangement agreements, this field may be populated with the commodity code's text description used by the federal government for procurement activities.",
  //   mapping: null
  // },
  contract_period_start: {
    human_name: "Contract Period Start Date",
    info: "i. For a services or construction services contract, it is recommended that the contract period start date be the starting date for the period of time over which the services are provided. ii. For a standing or supply arrangement, it is recommended that this field be populated with the starting date for the period of time over which a call-up may be entered into. iii. For a contract with task authorizations, it is recommended that this field be populated with the starting date for the period of time over the entire contract. For a contract with task authorizations where the full value of a contract with task authorizations is likely not to be used, it is recommended for this field be populated with the starting date for each task authorization.",
    mapping: null,
  },
  delivery_date: {
    human_name: "Contract Period End Date or Delivery Date",
    info: "i. For a goods contract, it is recommended that this field be the date when goods are to be delivered, which may be the contract period end date. The department may use the last delivery date if the contract involves multiple items on multiple dates. ii. For a services or construction services contract, it is recommended that this field be the end date for the period of time over which the services are provided. iii. For a standing offer or supply arrangement, it is recommended that this field be the end date for the period of time over which a call-up may be entered into. iv. For a contract with task authorizations, it is recommended that this field be populated with the end date for the period of time over the entire contract. For a contract with task authorizations where the full value of a contract with task authorization is likely not to be used, it is recommended for this field to be populated with the end date for each task authorization.",
    mapping: null,
  },
  contract_value: {
    human_name: "Total Contract Value",
    info: "i. It is recommended that the total contract value be the amount of the hard commitment recorded in the departmental financial system for all contracts and all subsequent amendments regardless of dollar value. It is recommended for this field be in Canadian currency and for it to include all applicable taxes. ii. For a multi-year contract, it is recommended for this field to be the total amount of the contract for all years. iii. For a contract amendment, it is recommended for this field to be the amended contract value. iv. For a contract with task authorizations, the full potential value of the contract may be reported upon contract award unless the full value is not expected to be used. In the latter situation, each task authorization may be reported individually or cumulatively. When a contract includes a fixed deliverable and another deliverable that requires a task authorization, the department may report the contract and task authorizations in any manner that is transparent. v. The value of this field for the reporting of a standing offer agreement or supply arrangement agreement is $0.",
    mapping: formatMoney,
  },
  original_value: {
    human_name: "Original Contract Value",
    info: "i. It is recommended that the original contract value be the amount of the hard commitment recorded in the departmental financial system at the time of contract award for a contract or amended contract. It is recommended for this field be in Canadian currency and for it to include all applicable taxes. ii. For a multi-year contract, it is recommended for this field to be the amount at the time of contract award for the multi-year contract period. iii. For a contract option, it is recommended for this field to be excluded from the original contract value and for it to be reported at a later date as an amendment when the contract option is exercised. Alternatively, the full value of a contract, including options, may be reported at the time of contract award. iv. For a contract with task authorizations, it is recommended that the original contract value be for the full amount of the contract rather than the amount specified within the minimum work guarantee clause. The full potential value of the contract may be reported in the original contract value unless the full value is not expected to be used. In the latter situation, each task authorization may be reported individually or cumulatively. When a contract includes a fixed deliverable and another deliverable that requires a task authorization, the department may report the contract and task authorizations in any manner that is transparent. v. The value of this field for the reporting of a standing offer agreement or supply arrangement agreement should be $0.",
    mapping: formatMoney,
  },
  amendment_value: {
    human_name: "Contract Amendment Value",
    info: 'i. For an amendment, it is recommended that the contract amendment value be the value of the contract amendment. Negative amendments should include a minus sign in front of the value. It is recommended for this field to be in Canadian currency and for it to include all applicable taxes. ii. Multiple amendment(s) to a contract that take place in the same fiscal quarter may be reported either individually or combined. Positive or negative amendments over $10,000 are to be reported quarterly in accordance with Appendix A. Positive or negative amendments of $10,000 and under are to be reported annually via email to PSPC in accordance with Appendix A, and to be reported annually on the Open Government Portal in accordance with Appendix B. An amendment should be reported either quarterly or annually. Reporting an amendment both quarterly and annually would result in double counting of the amendment\'s value when calculating the total contracting activity of an organization. iii. When a contract is entered into and subsequently amended in the same fiscal quarter, the two transactions should be reported separately. Entry into the contract should be reported as a separate entry with the value at contract entry in the original contract value and should not include the value of the contract amendment. The contract amendment should also be reported as a separate entry with the value of the amendment in the contract amendment value and the contract entry value in the original contract value. iv. For a contract with task authorizations, when the full value is likely not to be used, the value of any subsequent task authorization may be reported as an amendment with its value reported in the contract amendment value. v. A "0" value should be included if there are no amendments associated with the contract.',
    mapping: formatMoney,
  },
  // comments_en: {
  //   human_name: "Comments English",
  //   info: "i. Standardized comments are recommended to be used (refer to Appendix C). Avoid the use of acronyms within this field. ii. Departments are encouraged to provide a brief description of each contract. iii. When a contract involves an economic object code specified in Appendix D, departments are to fulfill the reporting requirements specified in Appendix D.",
  //   mapping: null
  // },
  // comments_fr: {
  //   human_name: "Comments French",
  //   info: "i. Standardized comments are recommended to be used (refer to Appendix C). Avoid the use of acronyms within this field. ii. Departments are encouraged to provide a brief description of each contract. iii. When a contract involves an economic object code specified in Appendix D, departments are to fulfill the reporting requirements specified in Appendix D.",
  //   mapping: null
  // },
  additional_comments_en: {
    human_name: "Additional Comments English",
    info: "The additional comments English field may be populated with additional comments when an organization needs additional capacity to fulfill the reporting requirements under the comments English data field.",
    mapping: null,
  },
  // additional_comments_fr: {
  //   human_name: "Additional Comments French",
  //   info: "The additional comments French field may be populated with additional comments when an organization needs additional capacity to fulfill the reporting requirements under the comments French data field.",
  //   mapping: null
  // },
  agreement_type_code: {
    human_name: "Agreement Type",
    info: "This data field is archived and replaced by the Appendix A data fields for Trade Agreement, Comprehensive Land Claims Agreement and Procurement Strategy for Indigenous Business.",
    mapping: (v: string) => {
      const codes: { [key: string]: string } = {
        "0": "None",
        A: "ABSA",
        C: "NAFTA / CFTA",
        D: "CETA / TCA / CFTA",
        E: "CETA / TCA / WTO-AGP / CFTA / CCFTA / CCoFTA / CHFTA / CPaFTA / CPFTA / CKFTA",
        F: "CETA / TCA / WTO-AGP / NAFTA / CFTA / CCFTA / CCoFTA / CHFTA / CPaFTA / CPFTA / CKFTA",
        I: "CFTA",
        R: "LCSA",
        S: "NAFTA / CFTA / CCFTA / CCoFTA / CHFTA / CPaFTA",
        T: "NAFTA / CFTA / CCFTA / CCoFTA / CHFTA / CPaFTA / CPFTA / CKFTA",
        V: "CFTA / CCFTA / CKFTA",
        W: "WTO-AGP / CFTA / CCFTA / CCoFTA / CHFTA / CPaFTA / CPFTA / CKFTA",
        X: "WTO-AGP / CFTA / CCFTA / CKFTA",
        Y: "WTO-AGP / NAFTA / CFTA / CCFTA / CCoFTA / CHFTA / CPaFTA / CPFTA / CKFTA",
        Z: "WTO-AGP / NAFTA",
        AB: "CFTA / CCFTA / CCoFTA / CHFTA / CPaFTA / CKFTA",
        AC: "CFTA / CCFTA / CCoFTA / CHFTA / CPaFTA / CPFTA / CKFTA",
        AD: "CETA / TCA / WTO-AGP / CFTA / CCFTA / CKFTA",
        AF: "CFTA / CHFTA",
        AG: "CETA / TCA / CFTA / CHFTA",
        AH: "CKFTA",
        AI: "CFTA / CKFTA",
        AJ: "CFTA / NAFTA / CKFTA",
        AK: "CPTPP",
        AN: "CFTA / CHFTA / CETA / TCA / CPTPP",
        AO: "CFTA / CCFTA / CKFTA / WTO-AGP / CPTPP",
        AP: "CFTA / NAFTA / CCFTA / CCoFTA / CHFTA / CPaFTA / CPFTA / CKFTA / WTO-AGP / CETA / TCA / CPTPP",
        AQ: "CFTA / CCFTA / CCoFTA / CHFTA / CPaFTA / CPFTA / CKFTA / WTO-AGP / CETA / TCA / CPTPP",
        AR: "CFTA / NAFTA / CCFTA / CCoFTA / CHFTA / CPaFTA / CPFTA / CKFTA / WTO-AGP / CPTPP",
        AS: "CFTA / CCFTA / CCoFTA / CHFTA / CPaFTA / CPFTA / CKFTA / WTO-AGP / CPTPP",
        AT: "CFTA / CCFTA / CKFTA",
        AU: "CFTA / CCFTA / CKFTA / WTO-AGP / CETA / TCA / CPTPP",
        AV: "CFTA / CCFTA",
        AW: "CFTA / CCFTA / CPTPP",
        AX: "CFTA / CKFTA / WTO-AGP / CETA / TCA",
        AY: "CFTA / CKFTA / WTO-AGP / CETA / TCA / CPTPP",
        AZ: "CFTA / CKFTA / WTO-AGP / CPTPP",
        BA: "ABSA / LCSA",
        N: "(discontinued) NAFTA / CCFTA / CCoFTA / CHFTA / CPaFTA",
        P: "(discontinued) NAFTA / CFTA / CCFTA / CCoFTA / CHFTA / CPaFTA",
        U: "(discontinued) CCFTA",
        AA: "(discontinued) CCFTA / CCoFTA / CHFTA / CPaFTA",
        AE: "(discontinued) CHFTA",
        AL: "(discontinued) CFTA / CPTPP",
        AM: "(discontinued) CFTA / CETA / TCA / CPTPP",
      };
      return codes[v] || v;
    },
  },
  trade_agreement: {
    human_name: "Trade Agreement",
    info: "i. It is recommended that this field indicate whether the procurement is covered by each of the applicable trade agreements. ii. It is recommended that this field be populated with one or more of the following alphabetic characters. Report the alphabetic characters only. All text after the alphabetic characters, including the colon, is for information purposes only. For example, a procurement covered by the Canadian Free Trade Agreement and the Comprehensive Economic Free Trade Agreement is reported as CA, EU.",
    mapping: (v: string) => {
      const codes: { [key: string]: string } = {
        CA: "Canadian Free Trade Agreement",
        CL: "Canada-Chile Free Trade Agreement",
        CO: "Canada-Colombia Free Trade Agreement",
        EU: "Comprehensive Economic Free Trade Agreement",
        GP: "World Trade Organization – Agreement on Government Procurement",
        HN: "Canada-Honduras Free Trade Agreement",
        KR: "Canada-Korea Free Trade Agreement",
        NA: "North American Free Trade Agreement",
        PA: "Canada-Panama Free Trade Agreement",
        PE: "Canada-Peru Free Trade Agreement",
        TP: "Comprehensive and Progressive Agreement for Trans-Pacific Partnership",
        UA: "Canada-Ukraine Free Trade Agreement",
        UK: "Canada-United Kingdom Trade Continuity Agreement",
        XX: "None",
      };
      return codes[v] || v;
    },
  },

  land_claims: {
    human_name: "Comprehensive Land Claims Agreement",
    info: "It is recommended that this field indicate whether the procurement is for goods, services or construction services to be delivered to an area that is within one or more of the Comprehensive Land Claims Agreements.",
    mapping: (v: string) => {
      const codes: { [key: string]: string } = {
        CH: "Champagne and Aishihik First Nations Final Agreement",
        CT: "Carcross/Tagish First Nation Final Agreement",
        EM: "Eeyou Marine Region Land Claims Agreement",
        FN: "First Nation of Nacho Nyak Dun Final Agreement",
        GW: "Gwich'in Comprehensive Land Claim Agreement",
        IF: "Inuvialuit Final Agreement",
        JN: "James Bay and Northern Quebec Agreement",
        KD: "Kwanlin Dun First Nation Final Agreement",
        KF: "Kluane First Nation Final Agreement",
        LI: "Labrador Inuit Land Claim Agreement",
        LS: "Little Salmon/Carmacks First Nation Final Agreement",
        MF: "Maa-nulth First Nations Final Agreement",
        NA: "Not Applicable",
        NF: "Nisga'a Final Agreement",
        NI: "Nunavik Inuit Land Claims Agreement",
        NQ: "Northeastern Quebec Agreement",
        NU: "Nunavut Agreement (Agreement between the Inuit of the Nunavut Settlement Area and Her Majesty the Queen in right of Canada)",
        SD: "Sahtu Dene and Metis Comprehensive Land Claim Agreement",
        SF: "Selkirk First Nation Final Agreement",
        TA: "Tlicho Agreement",
        TF: "Tsawwassen First Nation Final Agreement",
        TH: "Tr'ondëk Hwëch'in Final Agreement",
        TK: "Ta'an Kwach'an Council Final Agreement",
        TL: "Tla'amin Final Agreement",
        TT: "Teslin Tlingit Council Final Agreement",
        VG: "Vuntut Gwitchin First Nation Final Agreement",
        YA: "Yale First Nations Final Agreement",
      };
      return codes[v] || v;
    },
  },

  commodity_type: {
    human_name: "Commodity Type",
    info: "It is recommended that the commodity type be populated with the one of the three commodity types (Good, Service or Construction). When a contract involves more than one commodity type, the commodity type associated with the largest dollar value should be used. A department may use a different approach if this is the standard practice in the department.",
    mapping: (v: string) => {
      const codes: { [key: string]: string } = {
        C: "Construction",
        G: "Good",
        S: "Service",
      };
      return codes[v] || v;
    },
  },

  commodity_code: {
    human_name: "Commodity Code",
    info: 'i. It is recommended that the commodity code be populated with the generic product descriptions used by the federal government for procurement activities. ii. When using the Goods and Services Identification Number (GSIN), only those GSINs published by PSPC may be used. The commodity code for goods must use a minimum of four numeric characters. The commodity code for services must use either a minimum of one alphabetic character and three numeric characters or, two alphabetic characters and two numeric characters. The commodity code for construction must use a minimum of "51" and one or two numeric characters. iii. When a contract involves more than one commodity code, the commodity code associated with the largest dollar value should be used. A department may use a different approach if this is the standard practice in the department.',
    mapping: null,
  },
  country_of_vendor: {
    human_name: "Country of Vendor",
    info: "i. It is recommended that this data field be populated with the country of the vendor's address identified in the contract. ii. Alternatively, the country of the vendor may be the country of the vendor's address identified in the procurement or financial system if this is the standard practice in the department. iii. The country of vendor must be alphabetic characters listed in the International Organization for Standardization (ISO) 3166 Country Codes.",
    mapping: (v: string) => {
      const codes: { [key: string]: string } = {
        AD: "Andorra",
        AE: "United Arab Emirates",
        AF: "Afghanistan",
        AG: "Antigua and Barbuda",
        AI: "Anguilla",
        AL: "Albania",
        AM: "Armenia",
        AO: "Angola",
        AQ: "Antarctica",
        AR: "Argentina",
        AS: "American Samoa",
        AT: "Austria",
        AU: "Australia",
        AW: "Aruba",
        AX: "Åland Islands",
        AZ: "Azerbaijan",
        BA: "Bosnia and Herzegovina",
        BB: "Barbados",
        BD: "Bangladesh",
        BE: "Belgium",
        BF: "Burkina Faso",
        BG: "Bulgaria",
        BH: "Bahrain",
        BI: "Burundi",
        BJ: "Benin",
        BL: "Saint Barthélemy",
        BM: "Bermuda",
        BN: "Brunei Darussalam",
        BO: "Bolivia (Plurinational State of)",
        BQ: "Bonaire, Sint Eustatius and Saba",
        BR: "Brazil",
        BS: "Bahamas",
        BT: "Bhutan",
        BV: "Bouvet Island",
        BW: "Botswana",
        BY: "Belarus",
        BZ: "Belize",
        CA: "Canada",
        CC: "Cocos (Keeling) Islands",
        CD: "Democratic Republic of the Congo",
        CF: "Central African Republic",
        CG: "Congo",
        CH: "Switzerland",
        CI: "Ivory Coast",
        CK: "Cook Islands",
        CL: "Chile",
        CM: "Cameroon",
        CN: "China",
        CO: "Colombia",
        CR: "Costa Rica",
        CU: "Cuba",
        CV: "Cabo Verde",
        CW: "Curaçao",
        CX: "Christmas Island",
        CY: "Cyprus",
        CZ: "Czechia",
        DE: "Germany",
        DJ: "Djibouti",
        DK: "Denmark",
        DM: "Dominica",
        DO: "Dominican Republic",
        DZ: "Algeria",
        EC: "Ecuador",
        EE: "Estonia",
        EG: "Egypt",
        EH: "Western Sahara",
        ER: "Eritrea",
        ES: "Spain",
        ET: "Ethiopia",
        FI: "Finland",
        FJ: "Fiji",
        FK: "Falkland Islands",
        FM: "Micronesia (Federated States of)",
        FO: "Faroe Islands",
        FR: "France",
        GA: "Gabon",
        GB: "United Kingdom of Great Britain and Northern Ireland",
        GD: "Grenada",
        GE: "Georgia",
        GF: "French Guiana",
        GG: "Guernsey",
        GH: "Ghana",
        GI: "Gibraltar",
        GL: "Greenland",
        GM: "Gambia",
        GN: "Guinea",
        GP: "Guadeloupe",
        GQ: "Equatorial Guinea",
        GR: "Greece",
        GS: "South Georgia and the South Sandwich Islands",
        GT: "Guatemala",
        GU: "Guam",
        GW: "Guinea-Bissau",
        GY: "Guyana",
        HK: "China, Hong Kong Special Administrative Region",
        HM: "Heard Island and McDonald Islands",
        HN: "Honduras",
        HR: "Croatia",
        HT: "Haiti",
        HU: "Hungary",
        ID: "Indonesia",
        IE: "Ireland",
        IL: "Israel",
        IM: "Isle of Man",
        IN: "India",
        IO: "British Indian Ocean Territory",
        IQ: "Iraq",
        IR: "Iran (Islamic Republic of)",
        IS: "Iceland",
        IT: "Italy",
        JE: "Jersey",
        JM: "Jamaica",
        JO: "Jordan",
        JP: "Japan",
        KE: "Kenya",
        KG: "Kyrgyzstan",
        KH: "Cambodia",
        KI: "Kiribati",
        KM: "Comoros",
        KN: "Saint Kitts and Nevis",
        KP: "Democratic People's Republic of Korea",
        KR: "Republic of Korea",
        KW: "Kuwait",
        KY: "Cayman Islands",
        KZ: "Kazakhstan",
        LA: "Lao People's Democratic Republic",
        LB: "Lebanon",
        LC: "Saint Lucia",
        LI: "Liechtenstein",
        LK: "Sri Lanka",
        LR: "Liberia",
        LS: "Lesotho",
        LT: "Lithuania",
        LU: "Luxembourg",
        LV: "Latvia",
        LY: "Libya",
        MA: "Morocco",
        MC: "Monaco",
        MD: "Republic of Moldova",
        ME: "Montenegro",
        MF: "Saint Martin (French Part)",
        MG: "Madagascar",
        MH: "Marshall Islands",
        MK: "North Macedonia",
        ML: "Mali",
        MM: "Myanmar",
        MN: "Mongolia",
        MO: "China, Macao Special Administrative Region",
        MP: "Northern Mariana Islands",
        MQ: "Martinique",
        MR: "Mauritania",
        MS: "Montserrat",
        MT: "Malta",
        MU: "Mauritius",
        MV: "Maldives",
        MW: "Malawi",
        MX: "Mexico",
        MY: "Malaysia",
        MZ: "Mozambique",
        NA: "Namibia",
        NC: "New Caledonia",
        NE: "Niger",
        NF: "Norfolk Island",
        NG: "Nigeria",
        NI: "Nicaragua",
        NL: "Netherlands",
        NO: "Norway",
        NP: "Nepal",
        NR: "Nauru",
        NU: "Niue",
        NZ: "New Zealand",
        OM: "Oman",
        PA: "Panama",
        PE: "Peru",
        PF: "French Polynesia",
        PG: "Papua New Guinea",
        PH: "Philippines",
        PK: "Pakistan",
        PL: "Poland",
        PM: "Saint Pierre and Miquelon",
        PN: "Pitcairn",
        PR: "Puerto Rico",
        PS: "State of Palestine",
        PT: "Portugal",
        PW: "Palau",
        PY: "Paraguay",
        QA: "Qatar",
        RE: "Réunion",
        RO: "Romania",
        RS: "Serbia",
        RU: "Russian Federation",
        RW: "Rwanda",
        SA: "Saudi Arabia",
        SB: "Solomon Islands",
        SC: "Seychelles",
        SD: "Sudan",
        SE: "Sweden",
        SG: "Singapore",
        SH: "Saint Helena",
        SI: "Slovenia",
        SJ: "Svalbard and Jan Mayen Islands",
        SK: "Slovakia",
        SL: "Sierra Leone",
        SM: "San Marino",
        SN: "Senegal",
        SO: "Somalia",
        SR: "Suriname",
        SS: "South Sudan",
        ST: "Sao Tome and Principe",
        SV: "El Salvador",
        SX: "Sint Maarten (Dutch part)",
        SY: "Syrian Arab Republic",
        SZ: "Eswatini",
        TC: "Turks and Caicos Islands",
        TD: "Chad",
        TF: "French Southern Territories",
        TG: "Togo",
        TH: "Thailand",
        TJ: "Tajikistan",
        TK: "Tokelau",
        TL: "Timor-Leste",
        TM: "Turkmenistan",
        TN: "Tunisia",
        TO: "Tonga",
        TR: "Turkey",
        TT: "Trinidad and Tobago",
        TV: "Tuvalu",
        TW: "Taiwan",
        TZ: "United Republic of Tanzania",
        UA: "Ukraine",
        UG: "Uganda",
        UM: "United States Minor Outlying Islands",
        US: "United States of America",
        UY: "Uruguay",
        UZ: "Uzbekistan",
        VA: "Holy See",
        VC: "Saint Vincent and the Grenadines",
        VE: "Venezuela (Bolivarian Republic of)",
        VG: "British Virgin Islands",
        VI: "United States Virgin Islands",
        VN: "Viet Nam",
        VU: "Vanuatu",
        WF: "Wallis and Futuna Islands",
        WS: "Samoa",
        XK: "Kosovo",
        YE: "Yemen",
        YT: "Mayotte",
        ZA: "South Africa",
        ZM: "Zambia",
        ZW: "Zimbabwe",
      };
      return codes[v] || v;
    },
  },
  solicitation_procedure: {
    human_name: "Solicitation Procedure",
    info: "It is recommended that this field be populated with one of the five solicitation procedures listed below: • AC: Advance Contract Award Notice (ACAN) refers to a contract awarded to a supplier identified under an ACAN process where it was determined that there were no other statements of capabilities that could successfully meet the government's requirements. • OB: Competitive – Open Bidding (Government Electronic Tendering System (GETS)) refers to a competitive contract where bids were solicited via GETS. • TC: Competitive – Traditional refers to a competitive contract where bids were not solicited via GETS, but through another medium, such as soliciting bids directly from suppliers by email or phone. • ST: Competitive – Selective Tendering refers to a solicitation procedure permitted under Canada's trade agreements where qualified suppliers are selected from a source list (including single-use or multi-use lists) under the selective tendering procedural rules in Canada's trade agreements. • TN: Non-competitive refers to a contract awarded to a supplier without soliciting bids.",
    mapping: (v: string) => {
      const codes: { [key: string]: string } = {
        AC: "Advance Contract Award Notice",
        OB: "Competitive – Open Bidding (GETS)",
        ST: "Competitive – Selective Tendering",
        TC: "Competitive – Traditional",
        TN: "Non-Competitive",
      };
      return codes[v] || v;
    },
  },

  limited_tendering_reason: {
    human_name: "Limited Tendering Reason",
    info: "It is recommended that this field be populated with one or more of the limited tendering reasons listed below.",
    mapping: (v: string) => {
      const codes: { [key: string]: string } = {
        "00": "None",
        "05": "No response to bid solicitation",
        "20": "Goods purchased on a commodity market",
        "21": "Purchases made under exceptionally advantageous conditions",
        "22": "Winner of an architectural design contest",
        "23": "Consulting services regarding matters of a confidential nature",
        "30": "Work on a property by a contractor according to a warranty or guarantee",
        "31": "Work on a leased building or related property performed only by the lessor",
        "32": "Subscriptions to newspapers, magazines, or other periodicals",
        "33": "Goods regarding matters of a confidential or privileged nature",
        "71": "Exclusive rights",
        "72": "Prototype purchase",
        "74": "Additional deliveries",
        "81": "Extreme urgency",
      };
      return codes[v] || v;
    },
  },

  trade_agreement_exceptions: {
    human_name: "Trade Agreement Exceptions and Exclusions",
    info: "It is recommended that this field to be populated with one or more of the exceptions or exclusions listed below.",
    mapping: (v: string) => {
      const codes: { [key: string]: string } = {
        "00": "None",
        "01": "Shipbuilding and repair",
        "02": "Urban rail and urban transportation equipment systems, components and materials",
        "03": "Contracts respecting FSC 58 (communications, detection and coherent radiation equipment)",
        "05": "Agricultural products made in furtherance of agricultural support programs or human feeding programs",
        "06": "The Depts. of Transport, Communications and Fisheries & Oceans respecting FSC 70, 74, 36",
        "07": "Any measures for Indigenous peoples and businesses, including set asides for Indigenous businesses",
        "08": "Set-asides for small businesses other than Indigenous businesses",
        "09": "Measures necessary to protect public morals, order or safety",
        "10": "Measures necessary to protect human, animal or plant life or health",
        "11": "Measures necessary to protect intellectual property",
        "12": "Measures relating to goods or services of persons with disabilities, philanthropic institutions or prison labour",
        "13": "Services procured in support of military forces located overseas",
        "14": "Research and development services",
      };
      return codes[v] || v;
    },
  },

  indigenous_business: {
    human_name: "Procurement Strategy for Indigenous Business",
    info: "It is recommended that this field indicate whether the Procurement Strategy for Indigenous Business mandatory or voluntary set-aside applies to the procurement transaction.",
    mapping: (v: string) => {
      const codes: { [key: string]: string } = {
        MS: "Mandatory Set-Aside",
        NA: "None",
        VS: "Voluntary Set-Aside",
      };
      return codes[v] || v;
    },
  },

  indigenous_business_excluding_psib: {
    human_name: "Indigenous Business excluding PSIB",
    info: 'i. It is recommended that this field indicate whether a contract was awarded to an Indigenous business. ii. Any contract awarded to an Indigenous business where the procurement is subject to a mandatory or voluntary set-aside under the Procurement Strategy for Indigenous Business should be reported as "No" under this data field as such contracts are already reported under the Procurement Strategy for Indigenous Business data field.',
    mapping: (v: string) => {
      const codes: { [key: string]: string } = {
        N: "No",
        Y: "Yes",
      };
      return codes[v] || v;
    },
  },

  intellectual_property: {
    human_name: "Intellectual Property Indicator",
    info: "It is recommended that this field identify whether there are terms and conditions in the contract related to intellectual property and whether those terms would result in Crown or contractor ownership of the rights to the intellectual property.",
    mapping: (v: string) => {
      const codes: { [key: string]: string } = {
        A2: "Crown owned – exception 2",
        A3: "Crown owned – exception 3",
        A41: "Crown owned – exception 4.1",
        A42: "Crown owned – exception 4.2",
        A43: "Crown owned – exception 4.3",
        A5: "Crown owned – exception 5",
        A8: "Crown owned – exemption 8",
        B: "Contractor Owned",
        C: "No IP Terms in Contract",
      };
      return codes[v] || v;
    },
  },

  potential_commercial_exploitation: {
    human_name: "Potential for Commercial Exploitation",
    info: "It is recommended that this field identify whether intellectual property generated under the contract has the potential for commercial exploitation.",
    mapping: (v: string) => {
      const codes: { [key: string]: string } = {
        N: "No",
        Y: "Yes",
      };
      return codes[v] || v;
    },
  },
  former_public_servant: {
    human_name: "Former Public Servant in receipt of a PSSA pension",
    info: "It is recommended that this field identify whether the contractor is a former public servant in receipt of a pension under the Public Service Superannuation Act (PSSA).",
    mapping: (v: string) => {
      const codes: { [key: string]: string } = {
        N: "No",
        Y: "Yes",
      };
      return codes[v] || v;
    },
  },

  contracting_entity: {
    human_name: "Contracting Entity",
    info: "i. It is recommended that this field identify whether the procurement is a contract awarded by the client department, PSPC, SSC or another departmental entity or a call-up contract against a standing offer agreement or supply arrangement agreement established by PSPC, SSC or the department.",
    mapping: (v: string) => {
      const codes: { [key: string]: string } = {
        DC: "Contract awarded by the department",
        DSOSA:
          "Call-up or Contract Against a Standing Offer or Supply Arrangement Agreement established by the department",
        OGDC: "Contract awarded by another department on behalf of the client department",
        PWC: "Contract or Call-up awarded by PSPC on behalf of the client department",
        PWSOSA:
          "Call-up or Contract awarded by client department against a Standing Offer or Supply Arrangement Agreement established by Public Services and Procurement Canada",
        SSCC: "Contract awarded or Call-up by SSC on behalf of the client department",
        SSCSOSA:
          "Call-up or Contract awarded by client department against a Standing Offer or Supply Arrangement Agreement established by Shared Services Canada",
      };
      return codes[v] || v;
    },
  },

  standing_offer_number: {
    human_name: "Standing Offer or Supply Arrangement Number",
    info: "It is recommended that this field be populated with the Standing Offer or Supply Arrangement Number applicable to this contract. This field should be left blank if there is no standing offer or supply arrangement established by PSPC or SSC associated with this contract.",
    mapping: null,
  },

  instrument_type: {
    human_name: "Instrument Type",
    info: "i. It is recommended that the instrument type identify whether the transaction being reported is a contract, contract amendment, or a standing offer or supply arrangement agreement.",
    mapping: (v: string) => {
      const codes: { [key: string]: string } = {
        A: "Amendment",
        C: "Contract",
        SOSA: "Standing Offer or Supply Arrangement Agreement",
      };
      return codes[v] || v;
    },
  },

  ministers_office: {
    human_name: "Minister's Office Contracts",
    info: "It is recommended that this field indicate whether the transaction is for the Minister's office. Ministers' offices contracts are any contracts for goods and services entered into by a minister or their exempt staff.",
    mapping: (v: string) => {
      const codes: { [key: string]: string } = {
        N: "No",
        Y: "Yes",
      };
      return codes[v] || v;
    },
  },

  number_of_bids: {
    human_name: "Number of Bids",
    info: "It is recommended that this field be populated with the total number of compliant and non-compliant bids received in the procurement.",
    mapping: null,
  },

  article_6_exceptions: {
    human_name: "Section 6 Government Contracts Regulations Exceptions",
    info: "i. The Government Contracts Regulations requires the solicitation of bids unless one of the s.6 exceptions to the Government Contracts Regulations applies to the contract.",
    mapping: (v: string) => {
      const codes: { [key: string]: string } = {
        "0": "Not applicable",
        "1": "Pressing emergency in which delay would be injurious to the public interest",
        "2": "Does not exceed s.6 (b) Government Contracts Regulations prescribed dollar limits",
        "3": "Not in the public interest to solicit bids",
        "4": "Only one person is capable of performing the contract",
      };
      return codes[v] || v;
    },
  },

  award_criteria: {
    human_name: "Award Criteria",
    info: "It is recommended that this field be populated with one of the bid evaluation methodologies below if bids have been solicited for the contract.",
    mapping: (v: string) => {
      const codes: { [key: string]: string } = {
        "0": "Not applicable",
        "1": "Lowest Price",
        "2": "Lowest Cost-per-Point",
        "3": "Highest Combined Rating of Technical Merit and Price",
        "4": "Highest Technical Merit within a Stipulated Maximum Budget",
        "5": "Variations or combinations of the above methods",
      };
      return codes[v] || v;
    },
  },

  socioeconomic_indicator: {
    human_name: "Socio-Economic Indicator",
    info: "It is recommended for this field to indicate whether the procurement is subject to one or more of the applicable Socio-economic indicators.",
    mapping: (v: string) => {
      const codes: { [key: string]: string } = {
        FP: "Federal Contractors Program for Employment Equity",
        NA: "None",
      };
      return codes[v] || v;
    },
  },
  reporting_period: {
    human_name: "Reporting Period",
    info: "It is recommended that this field be populated in the standard format described below. When published on the Open Government portal, this field will contain the fiscal quarter this particular contract entry was reported to the public. For example if a contract is being amended on May 3, 2017, and reported in the first fiscal quarter of 2017-–2018, the entry should be 2017-2018-Q1.",
    mapping: null,
  },
};

const BASE = "https://api.canadasbuilding.com/canada-spends";

function jsonFetcher(url: string) {
  return fetch(url, { cache: "no-store" }).then((res) =>
    res.ok ? res.json() : null,
  );
}

type ContractInfo = {
  rowid: number;
  reference_number: string;
  procurement_id: string;
  vendor_name: string;
  vendor_postal_code: string;
  buyer_name: string;
  contract_date: string;
  economic_object_code: string;
  description_en: string;
  description_fr: string;
  contract_period_start: string;
  delivery_date: string;
  contract_value: number;
  original_value: number;
  amendment_value: number;
  comments_en: string;
  comments_fr: string;
  additional_comments_en: string;
  additional_comments_fr: string;
  agreement_type_code: string;
  trade_agreement: string;
  land_claims: string;
  commodity_type: string;
  commodity_code: string;
  country_of_vendor: string;
  solicitation_procedure: string;
  limited_tendering_reason: string;
  trade_agreement_exceptions: string;
  indigenous_business: string;
  indigenous_business_excluding_psib: string;
  intellectual_property: string;
  potential_commercial_exploitation: string;
  former_public_servant: string;
  contracting_entity: string;
  standing_offer_number: string;
  instrument_type: string;
  ministers_office: string;
  number_of_bids: number;
  article_6_exceptions: string;
  award_criteria: string;
  socioeconomic_indicator: string;
  reporting_period: string;
  owner_org: string;
  owner_org_title: string;
};

export async function ContractsOver10k({
  id,
  database,
}: {
  id: string;
  database: string;
}) {
  // Add database here
  const url = `${BASE}/contracts-over-10k/${id}.json?_shape=array`;
  const data = await jsonFetcher(url);
  if (!data || data.length === 0) return notFound();
  const contract = data[0] as ContractInfo;

  return (
    <DetailsPage
      fiscal_year={contract.reporting_period}
      title={contract.description_en}
      source_url="https://open.canada.ca/data/en/dataset/d8f85d91-7dec-4fd1-8055-483b77225d8b/resource/fac950c0-00d5-4ec1-a4d3-9cbebf98a305"
      recipient={contract.vendor_name}
      award_amount={contract.contract_value}
      program={contract.description_en}
      type="Contracts Over $10k"
      summary={contract.comments_en}
      reference_number={contract.reference_number}
      database={database}
      vendor_name={contract.vendor_name}
    >
      <Detail label={"rowid"} value={contract.rowid} />
      {Object.entries(fieldMapping).map(
        ([key, { human_name, info, mapping }]) => {
          // @ts-expect-error - dynamic key access
          const mapper = mapping || ((v: unknown) => v);
          // @ts-expect-error - dynamic key access
          const value = mapper(contract[key as keyof ContractInfo]);

          return (
            <Detail key={key} label={human_name} value={value} info={info} />
          );
        },
      )}
    </DetailsPage>
  );
}

function Detail({
  label,
  value,
  info,
}: {
  label: string;
  value: unknown;
  info?: string;
}) {
  return (
    <div>
      <div className="flex justify-start items-center mb-2 gap-2">
        <div className="font-bold text-foreground">{label}</div>
        {info && <InfoHoverCard info={info} />}
      </div>
      <div className="text-foreground/80">{String(value || "—")}</div>
    </div>
  );
}
