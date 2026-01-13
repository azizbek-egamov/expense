"use client"

import { Doughnut } from 'react-chartjs-2'
import { commonOptions, chartColors } from './config'
import { ChartData } from 'chart.js'

interface DoughnutChartProps {
    data: ChartData<'doughnut'>
    title?: string
}

export function DoughnutChart({ data, title }: DoughnutChartProps) {
    const options = {
        ...commonOptions,
        cutout: '60%',
        scales: {
            x: { display: false },
            y: { display: false }
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
        <div className="w-full h-full min-h-[300px] flex items-center justify-center">
            <div className="relative w-full h-full max-w-[400px]">
                <Doughnut options={options} data={data} />
            </div>
        </div>
    )
}
