"use client"

import { Line } from 'react-chartjs-2'
import { commonOptions, chartColors, moneyScale } from './config'
import { ChartData } from 'chart.js'

interface LineChartProps {
    data: ChartData<'line'>
    title?: string
}

export function LineChart({ data, title }: LineChartProps) {
    const options = {
        ...commonOptions,
        scales: {
            ...commonOptions.scales,
            y: moneyScale,
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
            <Line options={options} data={data} />
        </div>
    )
}
