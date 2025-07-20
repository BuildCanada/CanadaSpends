// @ts-nocheck: too complex to type for now... one day. Inputs are good enough

import { select } from 'd3-selection'
import { scaleLinear } from 'd3-scale'
import { curveBumpX, area } from 'd3-shape'
import { cumsum, pairs, rollups, sum } from 'd3-array'
import { hierarchy } from 'd3-hierarchy'
import { formatNumber } from './utils'

export type SankeyNode = {
	id: string           // Unique identifier for internal operations
	displayName: string  // User-facing name for display
	name?: string        // Optional: for backward compatibility
	amount: number
	children?: SankeyNode[]
	link?: string        // Optional: URL link for clickable nodes
}

export type SankeyData = {
	total: number
	spending: number
	revenue: number
	spending_data: SankeyNode
	revenue_data: SankeyNode
}

export type SankeyChartD3Props = {
	container?: HTMLElement
	width?: number
	height: number
	direction: 'left-to-right' | 'right-to-left'
	margin?: {
		top: number
		right: number
		bottom: number
		left: number
	}
	colors?: {
		primary: string
	}
	shortBlockHeight?: number
	data: SankeyNode
	totalAmount: number
	difference?: number
	differenceLabel?: string
	amountScalingFactor?: number
	onMouseOver?: (node: any) => void
	onMouseOut?: (node: any) => void
	onClick?: (node: any) => void
}
export class SankeyChartD3 {
	params: SankeyChartD3Props

	constructor(props: SankeyChartD3Props) {
		// Default configuration parameters for the chart
		const params = Object.assign(
			{
				container: document.body,
				width: 0, // calculated dynamically if zero
				height: 600,
				margin: {
					top: 50,
					right: 1,
					bottom: 0,
					left: 1
				},
				colors: {
					primary: '#E3007D'
				},
				shortBlockHeight: 16,
				data: null,
				totalAmount: 100,
				difference: 0,
				differenceLabel: 'Deficit',
				amountScalingFactor: 1e9,
				onMouseOver: () => {},
				onMouseOut: () => {},
				onClick: () => {}
			},
			props
		)

		this.highlightedNode = null
		this.linksMap = new Map()

		this.params = params
		this.container = select(params.container || 'body').style(
			'position',
			'relative'
		)

		this.link = area()
			.x(d => d.x)
			.y0(d => d.y0)
			.y1(d => d.y1)
			.curve(curveBumpX)

		this.setChartDimensions()
		this.renderContainers()

		if (this.params.data) {
			this.transformData()
			this.draw()
			this.drawLinks()

			// Handle resize
			const resizeObserver = new ResizeObserver(() => {
				this.drawLinks()
				if (this.highlightedNode) {
					this.highlightNode(this.highlightedNode)
				}
			})

			resizeObserver.observe(this.container.node())
		}
	}

	// Calculates dimensions and sets up the scaling function
	setChartDimensions() {
		const { width, height, margin } = this.params

		if (!width) {
			const w = this.container.node().getBoundingClientRect().width
			if (w) {
				this.params.width = w
			}
		}

		this.chartWidth = (this.params.width || width) - margin.left - margin.right
		this.chartHeight = height - margin.top - margin.bottom

		this.scale = scaleLinear()
			.domain([0, this.params.totalAmount])
			.range([0.02, this.chartHeight * 0.7])
			.clamp(true)
	}

	// Creates the main SVG and DIV containers for the chart
	renderContainers() {
		const { margin } = this.params

		this.rootDiv = this.container
			.selectAll('div')
			.data(['sankey-chart-outer'])
			.join('div')
			.attr('class', 'sankey-chart-outer')
			.style('height', `${this.params.height}px`)
			.style('padding-left', `${margin.left}px`)
			.style('padding-right', `${margin.right}px`)

		this.sankeyDiv = this.rootDiv
			.selectAll('div')
			.data(['sankey-chart'])
			.join('div')
			.attr('class', 'sankey-chart')
			.attr('data-direction', this.params.direction)

		this.sankeySvg = this.container
			.selectAll('svg')
			.data(['sankey-chart-svg'])
			.join('svg')
			.attr('class', 'sankey-chart-svg')
			.style('position', 'absolute')
			.style('top', '0')
			.style('left', '0')
			.style('width', '100%')
			.style('height', '100%')
	}

	// Main drawing function that creates the blocks and labels
	draw() {
		// Create columns
		const columns = this.sankeyDiv
			.selectAll('.column')
			.data(this.columnsData)
			.join('div')
			.attr('class', 'column')
			.attr('data-level', d => d.index)
			.classed('narrow', d => d.index === 0)
			.on('scroll', () => {
				this.drawLinks()
				if (this.highlightedNode) {
					this.highlightNode(this.highlightedNode)
				}
			})

		const groups = columns
			.selectAll('.group')
			.data(d => d.groups)
			.join('div')
			.attr('class', 'group')
			.attr('data-level', d => d.columnIndex)

		groups
			.selectAll('.spacer')
			.data(d => (d.index === 0 ? [d] : []))
			.join('div')
			.attr('class', 'spacer')
			.style('height', () => {
				return this.params.margin.top + 'px'
			})

		// Create blocks within each group
		const blocks = groups
			.selectAll('.block')
			.data(
				d => d.blocks,
				d => d.id
			)
			.join('div')
			.attr('class', 'block')
			.style('position', 'relative')
			.classed('fake', d => d.fake)
			.classed('clickable', d => {
				const hasLink = !!d.link
				if (hasLink) {
					console.log('Block with clickable class:', d.displayName, 'link:', d.link)
				}
				return hasLink
			})
			.classed(
				'with-background',
				d => d.amount < 0 || this.scale(d.value) < this.params.shortBlockHeight
			)
			.classed(
				'short',
				d => this.scale(d.value) < this.params.shortBlockHeight * 3
			)
			.classed('difference', d => d.isDifference)
			.classed('negative', d => d.amount < 0)
			.style('height', d => this.scale(d.value) + 'px')
			.style('background-color', this.params.colors.primary)
			.style('opacity', d => (d.fake ? 0 : 1))
			.style('margin-top', (d, i) => {
				if (d.groupIndex === 0 && i === 0) {
					return d.depth * 10 + 'px'
				}
				return 0
			})
			.on('mouseover', (e, d) => {
				const target = e.currentTarget as HTMLElement
				const rect = target.getBoundingClientRect()
				
				this.highlightNode(d)
				this.params.onMouseOver({ ...d, blockRect: rect }, e)
			})
			.on('mouseout', (e, d) => {
				this.highlightNode(null)
				this.params.onMouseOut(d)
			})
			.on('click', (e, d) => {
				this.params.onClick(d)
			})

		blocks
			.selectAll('.label')
			.data(
				d => [d].filter(d => !d.fake),
				d => d.id
			)
			.join('p')
			.attr('class', 'label')
			.html(
				d => `
					<div class="label-amount">${this.getNumber(d.realValue)}</div>
					<div class="label-name" title="${d.displayName}">
						${d.link ? `<a href="${d.link}" target="_blank">${d.displayName}</a>` : d.displayName}
					</div>
				`
			)
	}

	// Highlights selected node and its connections
	highlightNode(node) {
		this.highlightedNode = node

		if (!node) {
			this.autoScrolledFor = null
			// Reset all highlights when no node is selected
			this.sankeyDiv
				.selectAll('.block')
				.classed('highlight', false)
				.classed('current-node', false)
			this.sankeySvg.selectAll('.link').classed('highlight', false)
			this.sankeySvg.selectAll('.highlight-group').remove()
			// Automatic scroll into view
			if (this.timerId) {
				clearTimeout(this.timerId)
				this.timerId = null
			}
			return
		}

		// Skip difference and fake nodes
		if (node.isDifference || node.fake) {
			return
		}

		// Find all connected nodes and calculate paths
		const nodesToHighlight = Array.from(
			new Set([...node.pathToRoot, ...node.descendants])
		)

		const currentNodeHeight = this.scale(node.value)

		const path = pairs(node.pathToRoot)
			.map(d => {
				return this.linksMap.get(`${d[1]}->${d[0]}`)
			})
			.filter(d => d)
			.map((link, i, arr) => {
				const cummulativeSum = sum(
					arr.slice(0, i),
					d => d.target.cumulativeHeight
				)

				const cummulativeSumPrevious = sum(
					arr.slice(0, i - 1),
					d => d.target.cumulativeHeight
				)

				const sourceY = i
					? link.lineCoords[0].y0 + cummulativeSum
					: link.lineCoords[0].y0

				const targetY = i
					? arr[i - 1].lineCoords[0].y0 + cummulativeSumPrevious
					: link.lineCoords[1].y0

				return {
					id: link.id,
					rect: {
						x: link.source.x,
						y: sourceY,
						width: link.source.width,
						height: currentNodeHeight
					},
					lineCoords: [
						{
							x: link.lineCoords[0].x,
							y0: sourceY,
							y1: sourceY + currentNodeHeight
						},
						{
							x: link.lineCoords[1].x,
							y0: targetY,
							y1: targetY + currentNodeHeight
						}
					]
				}
			})

		this.sankeySvg.selectAll('.link').classed('highlight', x => {
			return (
				path.some(d => d.id === x.id) ||
				nodesToHighlight.includes(x.target.id)
			)
		})

		const highlightedNodeElements = []

		this.sankeyDiv
			.selectAll('.block:not(.fake)')
			.classed('highlight', function (x) {
				if (nodesToHighlight.includes(x.id)) {
					// @ts-expect-error: D3 element typing complexity
					highlightedNodeElements.push(this.querySelector('.label'))
					return true
				}
				return false
			})
			.classed('current-node', x => {
				return x.id === node.id
			})

		this.drawHighlightedPath(
			path.map(d => d.rect),
			path.map(d => d.lineCoords)
		)

		if (highlightedNodeElements.length > 0) {
			this.autoScroll(highlightedNodeElements)
		}
	}

	autoScroll(highlightedNodeElements) {
		// Automatic scroll into view
		if (this.timerId) {
			clearTimeout(this.timerId)
		}

		if (this.autoScrolledFor === this.highlightedNode?.id) {
			return
		}

		this.timerId = setTimeout(() => {
			// Auto scroll only once
			this.autoScrolledFor = this.highlightedNode?.id
			const hiddenElements = highlightedNodeElements.reduce((acc, element) => {
				// Check if element is fully visible in viewport
				const rect = element.getBoundingClientRect()
				const parent = element.closest('.column')

				if (!parent) {
					return acc
				}

				const parentRect = parent.getBoundingClientRect()
				const isFullyVisible =
					rect.top >= parentRect.top && rect.bottom <= parentRect.bottom

				// Only scroll if element is not fully visible
				if (!isFullyVisible) {
					acc.push(element)
				}
				return acc
			}, [])

			if (hiddenElements.length > 0) {
				const elementsToScroll = rollups(
					hiddenElements,
					elements => {
						// Sort elements by their vertical position
						const positions = elements.map(el => ({
							element: el,
							position: this.getRelativePosition(el, this.container.node()).y
						}))

						// Get the topmost and bottommost elements
						const topElement = positions.reduce((a, b) =>
							a.position < b.position ? a : b
						)
						const bottomElement = positions.reduce((a, b) =>
							a.position > b.position ? a : b
						)

						// If topmost element is above viewport center, scroll to it
						// Otherwise scroll to bottommost element
						return topElement.position < this.params.height * 0.5
							? topElement.element
							: bottomElement.element
					},
					d => d.__data__.columnIndex
				).map(d => d[1])

				elementsToScroll.forEach(element => {
					setTimeout(() => {
						element.scrollIntoView({
							behavior: 'smooth',
							block: 'nearest'
						})
					}, 0)
				})
			}
		}, 300)
	}

	getRelativePosition(element, parent) {
		const childPos = element.getBoundingClientRect()
		const parentPos = parent.getBoundingClientRect()

		return {
			y: childPos.top - parentPos.top,
			x: childPos.left - parentPos.left,
			width: childPos.width,
			height: childPos.height
		}
	}

	// Draws the connecting lines between blocks
	drawHighlightedPath(nodes, links) {
		// Create container group
		const highlightGroup = this.sankeySvg
			.selectAll('g.highlight-group')
			.data(['highlight-group'])
			.join('g')
			.attr('class', 'highlight-group')

		// Add rectangles for nodes
		highlightGroup
			.selectAll('rect.highlight-box')
			.data(nodes)
			.join('rect')
			.attr('class', 'highlight-box')
			.attr('x', d => d.x)
			.attr('y', d => d.y)
			.attr('width', d => d.width)
			.attr('height', d => d.height)

		// Add paths for links
		highlightGroup
			.selectAll('path.highlight-link')
			.data(links)
			.join('path')
			.attr('class', 'highlight-link')
			.attr('d', this.link)
	}

	// Draws the connecting lines between blocks
	drawLinks() {
		// Calculate positions of all blocks relative to container
		const coords = []
		const getRelativePosition = this.getRelativePosition
		const parent = this.container.node()
		const scale = this.scale

		this.sankeyDiv.selectAll('.block').each(function (d) {
			if (d.fake || d.isDifference) return

			const bound = getRelativePosition(this, parent)
			coords.push({
				id: d.target.id,
				x: bound.x,
				y: bound.y,
				width: bound.width,
				height: scale(d.value),
				groupIndex: d.groupIndex,
				columnIndex: d.columnIndex
			})
		})

		// If blockes are not rendered, don't draw links
		if (coords.length === 0) {
			return
		}

		const coordsGrouped = rollups(
			coords,
			arr => {
				const cumulativeHeights = cumsum(arr, d => d.height)
				const newArr = arr.map((d, i) => {
					return {
						...d,
						cumulativeHeight: i ? cumulativeHeights[i - 1] : 0
					}
				})
				return newArr
			},
			d => d.columnIndex,
			d => d.groupIndex
		).flatMap(d => {
			return d[1].flatMap(d => d[1])
		})

		const coordsLookup = new Map(coordsGrouped.map(d => [d.id, d]))
		const isFlipped = this.params.direction === 'right-to-left'

		const data = this.linksData.map(d => {
			const source = coordsLookup.get(d.source.data.id)
			const target = coordsLookup.get(d.target.data.id)

			return {
				id: `${d.source.data.id}->${d.target.data.id}`,
				source: {
					id: d.source.data.id,
					x: source.x,
					y: source.y,
					width: source.width,
					height: source.height,
					cumulativeHeight: source.cumulativeHeight
				},
				target: {
					id: d.target.data.id,
					x: target.x,
					y: target.y,
					width: target.width,
					height: target.height,
					cumulativeHeight: target.cumulativeHeight
				},
				lineCoords: [
					{
						x: isFlipped ? source.x : source.x + source.width,
						y0: source.y + target.cumulativeHeight,
						y1: source.y + target.cumulativeHeight + target.height
					},
					{
						x: isFlipped ? target.x + target.width : target.x,
						y0: target.y,
						y1: target.y + target.height
					}
				]
			}
		})

		this.sankeySvg
			.selectAll('.link')
			.data(data)
			.join('path')
			.attr('class', 'link')
			.attr('d', d => this.link(d.lineCoords))
			.attr('fill', this.params.colors.primary)

		this.linksMap = new Map(data.map(d => [d.id, d]))
	}

	// Transforms hierarchical data into format needed for visualization
	transformData() {
		const clonedData = structuredClone(this.params.data)

		// Compute the real sum of the data
		const realSum = hierarchy(clonedData).sum(d => {
			return d.amount
		})

		// Create a lookup table for the values of the data
		const valueLookup = new Map(
			realSum.descendants().map(d => [d.data.id, d.value])
		)

		// Compute the sum of the data treating negatives as positives
		const root = hierarchy(clonedData).sum(d => {
			return Math.abs(d.amount)
		})

		const links = root.links()

		// Calculate paths to root for each node
		const maxDepth = root.height

		root.each(node => {
			// Store visual value of the node
			node.data.value = node.value
			// Store the real value of the node
			node.data.realValue = valueLookup.get(node.data.id)

			if (node.depth > 0) {
				const pathToRoot = node.path(root)
				node.data.pathToRoot = pathToRoot.map(d => d.data.id)
			} else {
				node.data.pathToRoot = []
			}

			node.data.descendants = node.descendants().map(d => d.data.id)

			if (node.depth < maxDepth && !node.data.children) {
				this.fillLink(node.data, node.depth, maxDepth)
			}
		})

		const nodes = hierarchy(clonedData).descendants()

		// Organize nodes into columns and groups
		const columns = rollups(
			nodes,
			arr => {
				return arr.map(d => {
					return {
						source: d.parent?.data,
						target: d.data,
						depth: d.depth,
						...d.data
					}
				})
			},
			d => d.depth,
			d => d.parent?.data?.id || 'Root'
		).map(([, _groups], columnIndex) => {
			const groups = _groups.map(([, blocks], groupIndex) => {
				return {
					index: groupIndex,
					columnIndex: columnIndex,
					blocks: blocks.map((x, blockIndex) => {
						return {
							...x,
							index: blockIndex,
							groupIndex: groupIndex,
							columnIndex: columnIndex
						}
					})
				}
			})

			// Remove empty groups
			let groupIndex = groups.length - 1

			while (groupIndex >= 0) {
				if (groups[groupIndex].blocks.some(d => !d.fake)) {
					break
				}
				groups.pop()
				groupIndex--
			}

			return {
				index: columnIndex,
				groups: groups
			}
		})

		const difference = this.params.totalAmount - root.value

		if (this.params.difference > 0) {
			columns[0].groups[0].blocks.push({
				index: columns[0].groups[0].blocks.length,
				amount: this.params.difference,
				realValue: this.params.difference,
				value: difference,
				id: 'difference_block',
				displayName: this.params.differenceLabel,
				name: this.params.differenceLabel,
				isDifference: true,
				groupIndex: 0,
				columnIndex: 0,
				depth: 0,
				source: null,
				target: null,
				link: null
			})
		}

		this.columnsData = columns
		this.linksData = links
	}

	fillLink(node, level, maxLevel) {
		if (level === maxLevel) {
			return node
		}
		node.children = [
			this.fillLink({ 
				...node, 
				fake: true,
				id: `${node.id}_fake_${level}`,
				displayName: node.displayName || node.name || 'Fake'
			}, level + 1, maxLevel)
		]
		return node
	}

	getNumber(amount: number) {
		return formatNumber(amount, this.params.amountScalingFactor)
	}
}
