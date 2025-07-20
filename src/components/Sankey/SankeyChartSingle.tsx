import { useEffect, useRef } from 'react'
import { SankeyChartD3, SankeyChartD3Props } from './SankeyChartD3'

export type SankeyChartProps = {
	id: string
} & SankeyChartD3Props

export function SankeyChartSingle(props: SankeyChartProps) {
	const {
		id,
		data,
		direction = 'left-to-right',
		colors,
		difference,
		differenceLabel,
		totalAmount,
		height = 760,
		amountScalingFactor = 1e9,
		onMouseOver = () => { },
		onMouseOut = () => { },
		onClick = () => { }
	} = props;

	const chartRef = useRef(null)

	useEffect(
		() => {
			if (!data || !chartRef.current) return

			new SankeyChartD3({
				height,
				container: chartRef.current,
				data,
				direction,
				totalAmount,
				difference,
				differenceLabel,
				amountScalingFactor,
				colors,
				onMouseOver,
				onMouseOut,
				onClick
			})
		},
		// No need to add other dependencies because the chart is only rendered once
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[data]
	)

	return <div id={id} className='chart' ref={chartRef}></div>
}

