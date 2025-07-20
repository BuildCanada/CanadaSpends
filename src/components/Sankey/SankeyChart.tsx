import { hierarchy } from 'd3'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import Select from 'react-select'
import './SankeyChart.css'
import { SankeyData } from './SankeyChartD3'
import { SankeyChartSingle } from './SankeyChartSingle'
import { formatNumber, sortNodesByAmount, transformToIdBased } from './utils'

type FlatDataNodes = ReturnType<typeof getFlatData>['nodes']
type Node = FlatDataNodes[number] & {
	realValue?: number
}

interface HoverNodeType extends Node {
	percent: number;
	blockRect?: DOMRect;
}

interface SearchOptionType {
	value: string;
	label: string;
}

const getFlatData = (data: SankeyData) => {
	const revenueRoot = hierarchy(data.revenue_data).sum(d => {
		return Math.abs(d.amount)
	})

	const spendingRoot = hierarchy(data.spending_data).sum(d => {
		return Math.abs(d.amount)
	})

	return {
		nodes: [
			...revenueRoot.descendants().map(d => ({
				...d.data,
				parent: d.parent?.data.id,
				value: d.value,
				type: 'revenue'
			})),
			...spendingRoot.descendants().map(d => ({
				...d.data,
				parent: d.parent?.data.id,
				value: d.value,
				type: 'spending'
			}))
		].sort((a, b) => {
			return (a.displayName || a.name || "").localeCompare(b.displayName || b.name || "");
		}),
		revenueTotal: revenueRoot.value ?? 0,
		spendingTotal: spendingRoot.value ?? 0
	}
}

const chartHeight = 760
const amountScalingFactor = 1e9

const chartConfig = {
	revenue: {
		id: 'revenue-chart-root',
		colors: {
			primary: '#249EDC'
		},
		direction: 'right-to-left',
		differenceLabel: 'Deficit'
	},
	spending: {
		id: 'spending-chart-root',
		colors: {
			primary: '#E3007D'
		},
		direction: 'left-to-right',
		differenceLabel: 'Surplus'
	}
} as const

type SankeyChartProps = {
	data: SankeyData
}

export function SankeyChart(props: SankeyChartProps) {
	const router = useRouter()
	const [chartData, setChartData] = useState<SankeyData | null>(null)
	const [flatData, setFlatData] = useState<FlatDataNodes | null>(null)

	const [searchedNode, setSearchedNode] = useState<SearchOptionType | null>(null)
	const [searchResult, setSearchResult] = useState<Node | null>(null)
	const [hoverNode, setHoverNode] = useState<HoverNodeType | null>(null)
	// Mouse position as fallback - ensures tooltip still works if blockRect is missing
	const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null)
	const [totalAmount, setTotalAmount] = useState(0)
	const [tooltipTimeout, setTooltipTimeout] = useState<NodeJS.Timeout | null>(null)

	useEffect(() => {
		// Transform the data to use ID-based structure
		const transformedData = {
			...props.data,
			revenue_data: transformToIdBased(props.data.revenue_data),
			spending_data: transformToIdBased(props.data.spending_data)
		}
		
		setChartData(transformedData)
		const { nodes, revenueTotal, spendingTotal } = getFlatData(transformedData)

		setFlatData(nodes)
		setTotalAmount(Math.max(revenueTotal, spendingTotal))
	}, [props.data])

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (tooltipTimeout) {
				clearTimeout(tooltipTimeout)
			}
		}
	}, [tooltipTimeout])

	const handleSearch = (selected: SearchOptionType | null) => {
		setSearchedNode(selected)

		if (!selected) {
			return setSearchResult(null)
		}

		let node = flatData?.find(d => d.id === selected.value)

		// If it's a leaf node, we need to find the parent node
		if (!node?.children) {
			node = flatData?.find(d => d.id === node?.parent)
		}

		setSearchResult(node ?? null)
	}

	const handleMouseOver = useCallback((totalAmount: number) => {
		return (node: Node, event?: MouseEvent) => {
			const percent = (node.realValue! / totalAmount) * 100
			setHoverNode({
				...node,
				percent,
			})
			// Store mouse position as fallback for tooltip positioning
			if (event) {
				setMousePosition({ x: event.clientX, y: event.clientY })
			}
		}
	}, [])

	const handleMouseOut = useCallback(() => {
		// Clear any existing timeout
		if (tooltipTimeout) {
			clearTimeout(tooltipTimeout)
		}
		
		// Set a delay before hiding tooltip to allow mouse movement to tooltip
		const timeout = setTimeout(() => {
			setHoverNode(null)
			setMousePosition(null)
		}, 300) // 300ms delay
		
		setTooltipTimeout(timeout)
	}, [tooltipTimeout])

	const handleTooltipMouseEnter = useCallback(() => {
		// Cancel hiding tooltip when mouse enters tooltip
		if (tooltipTimeout) {
			clearTimeout(tooltipTimeout)
			setTooltipTimeout(null)
		}
	}, [tooltipTimeout])

	const handleTooltipMouseLeave = useCallback(() => {
		// Hide tooltip immediately when mouse leaves tooltip area
		setHoverNode(null)
		setMousePosition(null)
		if (tooltipTimeout) {
			clearTimeout(tooltipTimeout)
			setTooltipTimeout(null)
		}
	}, [tooltipTimeout])

	const getDepartmentName = (url: string): string => {
		const departmentNames: Record<string, string> = {
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
		
		return departmentNames[url] || 'Government Department'
	}

	const getDepartmentUrl = (nodeName: string): string | undefined => {
		const normalizedName = (nodeName || '').toLowerCase()
		
		// Department mappings based on spending categories
		const departmentMappings: Record<string, string> = {
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
			'children\'s benefits': '/spending/employment-and-social-development-canada',
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

		// Check for exact or partial matches
		for (const [key, url] of Object.entries(departmentMappings)) {
			if (normalizedName.includes(key)) {
				return url
			}
		}
		
		return undefined
	}

	const handleClick = useCallback(() => {
		// Click functionality removed - links are now only in tooltips
		return
	}, [])

	return (
		<div className='sankey-chart-wrapper'>
			<div className='sankey-chart-header'>
				<div className='search-container'>
				<Select
					instanceId="sankey-search"
					inputId="sankey-search-input"
					value={searchedNode}
					options={flatData?.map(d => ({
						value: d.id!,
						label: d.displayName || d.name || 'Unknown'
					})).filter(d => d.value && d.label)}
					onChange={handleSearch}
					isClearable={true}
					placeholder='Search...'
					className='search-select'
					styles={{
						input: base => ({
							...base,
							color: '#fff'
						}),
						singleValue: base => ({
							...base,
							color: '#fff'
						}),
						control: (base) => ({
							...base,
							color: '#fff',
							backgroundColor: '#000',
							borderColor: '#444'
						})
					}}
				/>
				</div>
			</div>

			<div className='sankey-chart-content'>
				{hoverNode && (
				<div 
					className='node-tooltip'
					onMouseEnter={handleTooltipMouseEnter}
					onMouseLeave={handleTooltipMouseLeave}
					style={{
						// Horizontal: right of the block, constrained to viewport
						left: hoverNode.blockRect 
							? `${Math.min(hoverNode.blockRect.right + 10, window.innerWidth - 340)}px` 
							: `${Math.min((mousePosition?.x || 0) + 10, window.innerWidth - 340)}px`,
						// Vertical: 40px above the block to avoid native tooltip conflict
						// Math.max ensures tooltip stays within viewport (min 10px from top)
						top: hoverNode.blockRect 
							? `${Math.max(10, hoverNode.blockRect.top - 40)}px`
							: `${(mousePosition?.y || 0) + 10}px`,
						pointerEvents: 'auto', // Enable mouse events on tooltip
						cursor: 'default'
					}}
				>
					<p className='node-tooltip-name'>{hoverNode.displayName || hoverNode.name}</p>
					<div className='node-tooltip-amount'>
						<span>{formatNumber(hoverNode.realValue ?? 0, amountScalingFactor)}</span>
						<span className='node-tooltip-amount-divider'>&#8226;</span>
						<span>{hoverNode.percent.toFixed(1)}%</span>
					</div>
					{(() => {
						let url = getDepartmentUrl(hoverNode.displayName || hoverNode.name || '')
						if (!url && hoverNode.link) {
							url = hoverNode.link
						}
						
						if (url) {
							const departmentName = getDepartmentName(url)
							return (
								<div style={{ marginTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.2)', paddingTop: '8px' }}>
									<a 
										href={url}
										onClick={(e) => {
											e.preventDefault()
											router.push(url)
											setHoverNode(null) // Hide tooltip after click
										}}
										style={{
											color: '#66c4ef',
											textDecoration: 'none',
											fontSize: '11px',
											fontWeight: '600',
											display: 'flex',
											alignItems: 'center',
											gap: '4px',
											cursor: 'pointer'
										}}
										onMouseEnter={(e) => {
											e.currentTarget.style.textDecoration = 'underline'
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.textDecoration = 'none'
										}}
									>
										🔗 Visit {departmentName}
									</a>
								</div>
							)
						}
						return null
					})()}
				</div>
			)}

			{chartData && !searchResult && (
				<div className='charts'>
					<SankeyChartSingle
						{...chartConfig.revenue}
						data={sortNodesByAmount(chartData.revenue_data)}
						totalAmount={totalAmount}
						difference={chartData.total - chartData.revenue}
						height={chartHeight}
						amountScalingFactor={amountScalingFactor}
						onMouseOver={handleMouseOver(chartData.revenue)}
						onMouseOut={handleMouseOut}
						onClick={handleClick}
					/>

					<SankeyChartSingle
						{...chartConfig.spending}
						data={sortNodesByAmount(chartData.spending_data)}
						totalAmount={totalAmount}
						difference={chartData.total - chartData.spending}
						height={chartHeight}
						amountScalingFactor={amountScalingFactor}
						onMouseOver={handleMouseOver(chartData.spending)}
						onMouseOut={handleMouseOut}
						onClick={handleClick}
					/>
				</div>
			)}

			{searchResult && (
				<div className='chart search-results'>
					<SankeyChartSingle
						id='search-results-root'
						data={searchResult}
						// @ts-expect-error: fix type here
						colors={chartConfig[searchResult.type].colors}
						// @ts-expect-error: fix type here
						direction={chartConfig[searchResult.type].direction}
						totalAmount={searchResult.value ?? 0}
						height={chartHeight}
						amountScalingFactor={amountScalingFactor}
						difference={0}
						differenceLabel=''
						onClick={handleClick}
					/>
				</div>
			)}
			</div>
		</div>
	)
}


