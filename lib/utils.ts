import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(priceRange: string | null | undefined): string {
  if (!priceRange) return ""
  const cleaned = priceRange
    .replace(/[THBthb,\s]/g, "")
    .replace(/฿/g, "")
    .trim()

  const formatNumber = (num: number): string => {
    return num.toLocaleString("th-TH")
  }

  const parts = cleaned.split("-").map((p) => {
    const num = parseFloat(p.trim())
    return isNaN(num) ? null : num
  })

  const validParts = parts.filter((n): n is number => n !== null)

  if (validParts.length === 0) return ""
  if (validParts.length === 1) {
    return `฿${formatNumber(validParts[0])}`
  }
  if (validParts.length === 2) {
    return `฿${formatNumber(validParts[0])} - ${formatNumber(validParts[1])}`
  }

  return `฿${formatNumber(validParts[0])}`
}
