"use client"

import { Bar } from 'react-chartjs-2'
import { commonOptions, chartColors, moneyScale } from './config'
import { ChartData } from 'chart.js'

interface BarChartProps {
    data: ChartData<'bar'>
    title?: string
    horizontal?: boolean
}

export function BarChart({ data, title, horizontal = false }: BarChartProps) {
    const options = {
        ...commonOptions,
        indexAxis: horizontal ? 'y' as const : 'x' as const,
        scales: {
            x: horizontal ? moneyScale : commonOptions.scales.x,
            y: horizontal ? commonOptions.scales.y : moneyScale,
        },
        plugins: {
            ...commonOptions.plugins,
            title: {
                display: !!title,
                text: title,
                color: chartColors.white,
                font: { size: 16, weight: 'bold' as const },
                padding: { bottom: 20 },
            },
        },
    }

    return (
        <div className="w-full h-full min-h-[300px]">
            <Bar options={options} data={data} />
        </div>
    )
}
