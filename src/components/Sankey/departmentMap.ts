// Department name and mapping config for Sankey

export const departmentNames: Record<string, string> = {
  '/spending/health-canada': 'Health Canada',
  '/spending/veterans-affairs': 'Veterans Affairs Canada',
  '/spending/employment-and-social-development-canada': 'Employment and Social Development Canada',
  '/spending/housing-infrastructure-communities': 'Housing, Infrastructure and Communities Canada',
  '/spending/innovation-science-and-industry': 'Innovation, Science and Economic Development Canada',
  '/spending/national-defence': 'Department of National Defence',
  '/spending/indigenous-services-and-northern-affairs': 'Indigenous Services Canada and Crown-Indigenous Relations',
  '/spending/global-affairs-canada': 'Global Affairs Canada',
  '/spending/public-safety-canada': 'Public Safety Canada',
  '/spending/transport-canada': 'Transport Canada',
  '/spending/canada-revenue-agency': 'Canada Revenue Agency',
  '/spending/immigration-refugees-and-citizenship': 'Immigration, Refugees and Citizenship Canada',
  '/spending/public-services-and-procurement-canada': 'Public Services and Procurement Canada',
  '/spending/department-of-finance': 'Department of Finance Canada'
}

export const departmentMappings: Record<string, string> = {
  // Health Canada
  'health': '/spending/health-canada',
  'health research': '/spending/health-canada',
  'health care systems + protection': '/spending/health-canada',
  'food safety': '/spending/health-canada',
  'public health + disease prevention': '/spending/health-canada',
  'health transfer to provinces': '/spending/health-canada',
  'first nations and inuit health infrastructure support': '/spending/health-canada',
  'first nations and inuit primary health care': '/spending/health-canada',

  // Veterans Affairs Canada
  'support for veterans': '/spending/veterans-affairs',
  'veteran pensions': '/spending/veterans-affairs',
  'veteran benefits': '/spending/veterans-affairs',

  // Employment and Social Development Canada (ESDC)
  'employment + training': '/spending/employment-and-social-development-canada',
  'employment insurance': '/spending/employment-and-social-development-canada',
  'old age security': '/spending/employment-and-social-development-canada',
  'canada pension plan': '/spending/employment-and-social-development-canada',
  'social security': '/spending/employment-and-social-development-canada',
  'retirement benefits': '/spending/employment-and-social-development-canada',
  "children's benefits": '/spending/employment-and-social-development-canada',
  'covid-19 income support': '/spending/employment-and-social-development-canada',
  'canada emergency wage subsidy': '/spending/employment-and-social-development-canada',

  // Housing, Infrastructure and Communities Canada (HICC)
  'housing assistance': '/spending/housing-infrastructure-communities',
  'infrastructure investments': '/spending/housing-infrastructure-communities',
  'community infrastructure grants': '/spending/housing-infrastructure-communities',
  'interim housing assistance': '/spending/housing-infrastructure-communities',
  'sustainable bases, it systems, infrastructure': '/spending/housing-infrastructure-communities',

  // Innovation, Science and Economic Development Canada (ISED)
  'innovation + research': '/spending/innovation-science-and-industry',
  'investment, growth and commercialization': '/spending/innovation-science-and-industry',
  'research': '/spending/innovation-science-and-industry',
  'statistics canada': '/spending/innovation-science-and-industry',
  'economic development in southern ontario': '/spending/innovation-science-and-industry',
  'economic development in atlantic canada': '/spending/innovation-science-and-industry',
  'economic development in the pacific region': '/spending/innovation-science-and-industry',
  'western + northern economic development': '/spending/innovation-science-and-industry',
  'economic development in northern ontario': '/spending/innovation-science-and-industry',
  'economic development in quebec': '/spending/innovation-science-and-industry',
  'other boards + councils': '/spending/innovation-science-and-industry',
  'space': '/spending/innovation-science-and-industry',

  // National Defence
  'defence': '/spending/national-defence',
  'defence team': '/spending/national-defence',
  'defence operations + internal services': '/spending/national-defence',
  'other defence': '/spending/national-defence',

  // Indigenous Services Canada and Crown-Indigenous Relations
  'indigenous priorities': '/spending/indigenous-services-and-northern-affairs',
  'indigenous well-being + self determination': '/spending/indigenous-services-and-northern-affairs',
  'grants to support the new fiscal relationship with first nations': '/spending/indigenous-services-and-northern-affairs',
  'first nations elementary and secondary educational advancement': '/spending/indigenous-services-and-northern-affairs',
  'other support for indigenous well-being': '/spending/indigenous-services-and-northern-affairs',
  'crown-indigenous relations': '/spending/indigenous-services-and-northern-affairs',
  'other grants and contributions to support crown-indigenous relations': '/spending/indigenous-services-and-northern-affairs',

  // Global Affairs Canada
  'international affairs': '/spending/global-affairs-canada',
  'international diplomacy': '/spending/global-affairs-canada',
  'other international affairs activities': '/spending/global-affairs-canada',
  'development, peace + security programming': '/spending/global-affairs-canada',
  'official languages + culture': '/spending/global-affairs-canada',

  // Public Safety Canada
  'public safety': '/spending/public-safety-canada',
  'corrections': '/spending/public-safety-canada',
  'other public safety expenses': '/spending/public-safety-canada',
  'csis': '/spending/public-safety-canada',
  'rcmp': '/spending/public-safety-canada',
  'disaster relief': '/spending/public-safety-canada',
  'community safety': '/spending/public-safety-canada',
  'justice system': '/spending/public-safety-canada',
  'communications security establishment': '/spending/public-safety-canada',

  // Immigration, Refugees and Citizenship Canada (IRCC)
  'immigration + border security': '/spending/immigration-refugees-and-citizenship',
  'border security': '/spending/immigration-refugees-and-citizenship',
  'other immigration services': '/spending/immigration-refugees-and-citizenship',
  'citizenship + passports': '/spending/immigration-refugees-and-citizenship',
  'settlement assistance': '/spending/immigration-refugees-and-citizenship',
  'visitors, international students + temporary workers': '/spending/immigration-refugees-and-citizenship',

  // Transport Canada
  'transportation': '/spending/transport-canada',
  'excise tax — aviation gasoline and jet fuel': '/spending/transport-canada',
  'coastguard operations': '/spending/transport-canada',

  // Canada Revenue Agency
  'revenue canada': '/spending/canada-revenue-agency',
  'taxation': '/spending/canada-revenue-agency',
  'tax collection': '/spending/canada-revenue-agency',
  'carbon tax rebate': '/spending/canada-revenue-agency',

  // Public Services and Procurement Canada
  'other public services + procurement': '/spending/public-services-and-procurement-canada',
  'defence procurement': '/spending/public-services-and-procurement-canada',
  'government it operations': '/spending/public-services-and-procurement-canada',

  // Department of Finance Canada
  'banking + finance': '/spending/department-of-finance',
  'transfers to provinces': '/spending/department-of-finance',
  'social transfer to provinces': '/spending/department-of-finance',
  'equalization payments to provinces': '/spending/department-of-finance',
  'territorial formula financing': '/spending/department-of-finance',

  // Environment and Climate Change Canada (missing from URL structure, using closest)
  'environment and climate change': '/spending/innovation-science-and-industry',
  'other environment and climate change programs': '/spending/innovation-science-and-industry',
  'weather services': '/spending/innovation-science-and-industry',
  'nature conservation': '/spending/innovation-science-and-industry',
  'national parks': '/spending/innovation-science-and-industry',

  // Fisheries and Oceans Canada (missing from URL structure, using closest)
  'fisheries': '/spending/innovation-science-and-industry',
  'fisheries + aquatic ecosystems': '/spending/innovation-science-and-industry',
  'other fisheries expenses': '/spending/innovation-science-and-industry',

  // Agriculture and Agri-Food Canada (missing from URL structure, using closest)
  'agriculture': '/spending/innovation-science-and-industry',

  // Natural Resources Canada (missing from URL structure, using closest)
  'natural resources management': '/spending/innovation-science-and-industry',
  'innovative and sustainable natural resources development': '/spending/innovation-science-and-industry',
  'support for global competition': '/spending/innovation-science-and-industry',
  'nuclear labs + decommissioning': '/spending/innovation-science-and-industry',
  'natural resources science + risk mitigation': '/spending/innovation-science-and-industry',
  'other natural resources management support': '/spending/innovation-science-and-industry',

  // Gender Equality (Status of Women Canada) - part of Women and Gender Equality Canada
  'gender equality': '/spending/employment-and-social-development-canada',

  // Additional Treasury Board items (missing from URL structure)
  'treasury board': '/spending/public-services-and-procurement-canada',
  'parliament': '/spending/public-services-and-procurement-canada',
  'privy council office': '/spending/public-services-and-procurement-canada',
  'office of the secretary to the governor general': '/spending/public-services-and-procurement-canada',
  'office of the chief electoral officer': '/spending/public-services-and-procurement-canada'
}
