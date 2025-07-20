import { hierarchy } from 'd3'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import Select from 'react-select'
import './SankeyChart.css'
import { SankeyData } from './SankeyChartD3'
import { SankeyChartSingle } from './SankeyChartSingle'
import { formatNumber, transformToIdBased } from './utils'
import { departmentNames, departmentMappings } from './departmentMap'

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
		]
	}
}

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

export function SankeyChart({ 
	data,
	shouldIncludeNode = () => true,
	displayName = {}
}: {
	data: SankeyData
	shouldIncludeNode?: (node: Node) => boolean
	displayName?: { [nodeId: string]: string }
}) {
	const router = useRouter()
	const [hoverNode, setHoverNode] = useState<HoverNodeType | null>(null)
	const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null)
	const [searchOptions, setSearchOptions] = useState<SearchOptionType[]>([])
	const [tooltipTimeout, setTooltipTimeout] = useState<NodeJS.Timeout | null>(null)

	const { nodes } = getFlatData(data)

	// Process nodes for search options
	useEffect(() => {
		const options = nodes
			.filter(node => shouldIncludeNode(node) && node.type === 'spending')
			.sort((a, b) => {
				const aValue = (a as any).realValue || a.value || 0
				const bValue = (b as any).realValue || b.value || 0
				return bValue - aValue
			})
			.slice(0, 10) // Top 10 spending items
			.map(node => ({
				value: node.id,
				label: `${displayName[node.id] || node.name} (${formatNumber((node as any).realValue || node.value || 0)})`
			}))
		
		setSearchOptions(options)
	}, [nodes, shouldIncludeNode, displayName])

	const handleDepartmentSelect = useCallback((option: SearchOptionType | null) => {
		if (option) {
			// Navigate to the department's first matching node
			console.log('Selected department:', option.value)
		}
	}, [])

	const handleNodeHover = useCallback((node: Node | null, event?: MouseEvent) => {
		if (node) {
			const blockRect = (event?.target as HTMLElement)?.getBoundingClientRect()
			const totalSpending = getFlatData(data).nodes
				.filter(n => n.type === 'spending' && (n.value || 0) > 0)
				.reduce((sum, n) => sum + ((n as any).realValue || n.value || 0), 0)
			
			setHoverNode({
				...node,
				percent: (((node as any).realValue || node.value || 0) / totalSpending) * 100,
				blockRect: blockRect
			})
			
			if (event) {
				setMousePosition({ x: event.clientX, y: event.clientY })
			}
		} else {
			// Delayed hide to allow mouse to move to tooltip
			const timeout = setTimeout(() => {
				setHoverNode(null)
				setMousePosition(null)
			}, 300) // 300ms delay
			
			setTooltipTimeout(timeout)
		}
	}, [data])

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
		return departmentNames[url] || 'Government Department'
	}

	const getDepartmentUrl = (nodeName: string): string | undefined => {
		const normalizedName = (nodeName || '').toLowerCase()
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
			<div className='sankey-controls'>
				<div>
					<h3>Department Exploration</h3>
					<label htmlFor='department-search'>
						<p style={{ color: 'white' }}>🔍 Jump to department:</p>
					</label>
					<Select
						inputId='department-search'
						value={null}
						options={searchOptions}
						onChange={handleDepartmentSelect}
						placeholder="Search departments..."
						isClearable
						styles={{
							option: (base) => ({
								...base,
								color: '#000'
							}),
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
					<div className='tooltip-content'>
						<div className='tooltip-header'>
							<h4>{displayName[hoverNode.id] || hoverNode.displayName || hoverNode.name || 'Unknown'}</h4>
						</div>
						<div className='tooltip-body'>
							<p><strong>Amount:</strong> 
								<span>{formatNumber((hoverNode as any).realValue ?? 0, 1e9)}</span>
							</p>
							<p><strong>Percentage:</strong> {hoverNode.percent.toFixed(2)}%</p>
							
							{(() => {
								const url = getDepartmentUrl(hoverNode.displayName || hoverNode.name || '')
								if (url) {
									const departmentName = getDepartmentName(url)
									return (
										<div className='tooltip-link'>
											<p><strong>Related Ministry:</strong></p>
											<a 
												href={url}
												className='department-link'
												onClick={(e) => {
													e.preventDefault()
													router.push(url)
												}}
											>
												{departmentName} →
											</a>
										</div>
									)
								}
								return null
							})()}
						</div>
					</div>
				</div>
				)}

				<SankeyChartSingle
					id='sankey-chart'
					data={transformToIdBased(data)}
					onClick={handleClick}
					onMouseOver={handleNodeHover}
					onMouseOut={handleNodeHover}
					height={600}
					direction="left-to-right"
					totalAmount={1e12}
				/>
			</div>
		</div>
	)
}
