export const formatCurrency = (amount: number | string) => {
    const num = Number(amount)
    if (isNaN(num)) return "0 so'm"

    const absNum = Math.abs(num)

    // Helper to remove trailing .00
    const cleanNumber = (val: string) => val.replace(/\.00$/, '')

    if (absNum >= 1000000000000) {
        return cleanNumber((num / 1000000000000).toFixed(2)) + " trln so'm"
    }

    if (absNum >= 1000000000) {
        const formatted = (num / 1000000000).toFixed(2)
        if (Math.abs(Number(formatted)) >= 1000) {
            return cleanNumber((num / 1000000000000).toFixed(2)) + " trln so'm"
        }
        return cleanNumber(formatted) + " mlrd so'm"
    }

    if (absNum >= 1000000) {
        const formatted = (num / 1000000).toFixed(2)
        if (Math.abs(Number(formatted)) >= 1000) {
            return cleanNumber((num / 1000000000).toFixed(2)) + " mlrd so'm"
        }
        return cleanNumber(formatted) + " mln so'm"
    }

    return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(num) + " so'm"
}

// Full currency format without abbreviations (1 000 000 000 so'm)
export const formatFullCurrency = (amount: number | string) => {
    const num = Number(amount)
    if (isNaN(num)) return "0 so'm"
    return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(num) + " so'm"
}

export const formatInputNumber = (value: string | number): string => {
    if (value === null || value === undefined || value === "") return ""

    let strValue = String(value)
    if (strValue.includes('.')) {
        strValue = strValue.split('.')[0]
    }

    const clean = strValue.replace(/\D/g, "")
    return clean.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}

export const parseInputNumber = (value: string): string => {
    return value.replace(/\s/g, "")
}

// DATE UTILS

// yyyy-mm-dd -> dd.mm.yyyy
export const ymdToDmy = (date: string): string => {
    if (!date) return ""
    const [y, m, d] = date.split('-')
    if (!y || !m || !d) return date
    return `${d}.${m}.${y}`
}

// dd.mm.yyyy -> yyyy-mm-dd
export const dmyToYmd = (date: string): string => {
    if (!date) return ""
    const parts = date.split('.')
    if (parts.length !== 3) return ""
    const [d, m, y] = parts
    return `${y}-${m}-${d}`
}

// Input mask: 01112023 -> 01.11.2023
export const formatDateMask = (value: string): string => {
    const digits = value.replace(/\D/g, "").slice(0, 8)

    if (digits.length >= 5) {
        return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`
    }
    if (digits.length >= 3) {
        return `${digits.slice(0, 2)}.${digits.slice(2)}`
    }
    return digits
}
