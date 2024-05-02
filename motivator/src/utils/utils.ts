import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatAddress(address: string) {
    if (address.startsWith('0x') && address.length >= 20) {
        const firstPart = address.slice(0, 6)
        const lastPart = address.slice(-3)

        return `${firstPart}...${lastPart}`
    }
    return address
}

export function transformNumberK(value: number) {
    if (value > 999) {
        return `${(value / 1000).toFixed(1)}k`
    }
    if (value < -999) {
        return `${(value / 1000).toFixed(1)}k`
    }
    return value.toFixed(2)
}
