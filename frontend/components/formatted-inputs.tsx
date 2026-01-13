"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { formatInputNumber, parseInputNumber, formatDateMask } from "@/lib/format-utils"

// MONEY INPUT
interface MoneyInputProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    required?: boolean
    className?: string
}

export function MoneyInput({ value, onChange, placeholder = "0", required, className }: MoneyInputProps) {
    const [displayValue, setDisplayValue] = useState("")

    useEffect(() => {
        if (value !== undefined && value !== null) {
            setDisplayValue(formatInputNumber(value))
        } else {
            setDisplayValue("")
        }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value
        const cleanValue = rawValue.replace(/\D/g, "")
        const formatted = formatInputNumber(cleanValue)
        setDisplayValue(formatted)
        onChange(cleanValue)
    }

    return (
        <div className="relative">
            <input
                type="text"
                inputMode="numeric"
                value={displayValue}
                onChange={handleChange}
                placeholder={placeholder}
                required={required}
                className={cn(
                    'h-10 w-full rounded-lg px-4 py-2 text-sm transition-all duration-200 outline-none',
                    'bg-slate-800/80 border border-slate-600 text-slate-100',
                    'placeholder:text-slate-500',
                    'hover:border-slate-500',
                    'focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    'pr-16',
                    className,
                )}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                so'm
            </span>
        </div>
    )
}

// DATE INPUT
interface DateInputProps {
    value: string // Value is masked string (dd.mm.yyyy) or raw string
    onChange: (value: string) => void
    placeholder?: string
    required?: boolean
    className?: string
}

export function DateInput({ value, onChange, placeholder = "DD.MM.YYYY", required, className }: DateInputProps) {
    // Value parentdan dd.mm.yyyy formatida kelishi kutiladi (agar backend format bo'lsa parent o'zi o'tkazishi kerak)
    // Lekin biz har ehtimolga qarshi mask ishlatamiz.

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value

        // Agar o'chirish bo'lsa (backspace) mask qiymatdan tezroq o'chib ketmasligi uchun
        // oddiy mask funksiyasini ishlatamiz
        const masked = formatDateMask(val)
        onChange(masked)
    }

    return (
        <input
            type="text"
            inputMode="numeric"
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            required={required}
            maxLength={10}
            className={cn(
                'h-10 w-full rounded-lg px-4 py-2 text-sm transition-all duration-200 outline-none',
                'bg-slate-800/80 border border-slate-600 text-slate-100',
                'placeholder:text-slate-500',
                'hover:border-slate-500',
                'focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30',
                'disabled:cursor-not-allowed disabled:opacity-50',
                className,
            )}
        />
    )
}

// PHONE INPUT
interface PhoneInputProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    required?: boolean
    className?: string
}

function formatPhone(value: string): string {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length === 0) return ""
    if (numbers.length <= 3) return `+${numbers}`
    if (numbers.length <= 5) return `+${numbers.slice(0, 3)} ${numbers.slice(3)}`
    if (numbers.length <= 8) return `+${numbers.slice(0, 3)} ${numbers.slice(3, 5)} ${numbers.slice(5)}`
    if (numbers.length <= 10) return `+${numbers.slice(0, 3)} ${numbers.slice(3, 5)} ${numbers.slice(5, 8)} ${numbers.slice(8)}`
    return `+${numbers.slice(0, 3)} ${numbers.slice(3, 5)} ${numbers.slice(5, 8)} ${numbers.slice(8, 10)} ${numbers.slice(10, 12)}`
}

export function PhoneInput({ value, onChange, placeholder = "+998 XX XXX XX XX", required, className }: PhoneInputProps) {
    const [displayValue, setDisplayValue] = useState("")

    useEffect(() => {
        if (value) {
            setDisplayValue(formatPhone(value))
        } else {
            setDisplayValue("")
        }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value
        const numbers = rawValue.replace(/\D/g, "")

        if (numbers.length <= 12) {
            setDisplayValue(formatPhone(numbers))
            onChange(numbers)
        }
    }

    return (
        <input
            type="tel"
            value={displayValue}
            onChange={handleChange}
            placeholder={placeholder}
            required={required}
            className={cn(
                'h-10 w-full rounded-lg px-4 py-2 text-sm transition-all duration-200 outline-none',
                'bg-slate-800/80 border border-slate-600 text-slate-100',
                'placeholder:text-slate-500',
                'hover:border-slate-500',
                'focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30',
                'disabled:cursor-not-allowed disabled:opacity-50',
                className,
            )}
        />
    )
}
