import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    TooltipItem,
} from 'chart.js'
import { formatCurrency } from '@/lib/format-utils'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
)

export const chartColors = {
    emerald: '#10b981',
    amber: '#f59e0b',
    blue: '#3b82f6',
    rose: '#f43f5e',
    purple: '#a855f7',
    cyan: '#06b6d4',
    slate: '#64748b',
    white: '#ffffff',
    grid: '#334155', // slate-700 for grid lines
    text: '#94a3b8', // slate-400 for text labels
}

export const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom' as const,
            labels: {
                color: chartColors.text,
                font: {
                    family: 'inherit',
                    size: 12,
                },
                usePointStyle: true,
                padding: 20,
            },
        },
        tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f1f5f9',
            bodyColor: '#e2e8f0',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
                label: function (context: TooltipItem<any>) {
                    let label = context.dataset.label || ''
                    if (label) {
                        label += ': '
                    }
                    if (context.parsed.y !== null && context.parsed.y !== undefined) {
                        // For bar/line
                        const value = context.raw as number
                        label += formatCurrency(value)
                    } else if (context.parsed !== null) {
                        // For doughnut/pie where parsed is the value sometimes or raw
                        const value = context.raw as number
                        label += formatCurrency(value)
                    }
                    return label
                }
            }
        },
    },
    scales: {
        x: {
            grid: {
                color: chartColors.grid,
                drawBorder: false,
            },
            ticks: {
                color: chartColors.text,
                font: {
                    family: 'inherit',
                },
            },
        },
        y: {
            grid: {
                color: chartColors.grid,
                drawBorder: false,
            },
            ticks: {
                color: chartColors.text,
                font: {
                    family: 'inherit',
                },
            },
        },
    },
}

// Axis callback for formatting money
export const moneyScale = {
    grid: {
        color: chartColors.grid,
        drawBorder: false,
    },
    ticks: {
        color: chartColors.text,
        font: {
            family: 'inherit',
        },
        callback: function (value: any) {
            if (typeof value === 'number') {
                return formatCurrency(value)
            }
            return value
        },
    },
}
