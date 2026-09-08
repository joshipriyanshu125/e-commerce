export const CURRENCY_PRESETS = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (INR)', flag: '🇮🇳', region: 'India' },
  { code: 'USD', symbol: '$', name: 'US Dollar (USD)', flag: '🇺🇸', region: 'United States' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR)', flag: '🇪🇺', region: 'European Union' },
  { code: 'GBP', symbol: '£', name: 'British Pound (GBP)', flag: '🇬🇧', region: 'United Kingdom' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham (AED)', flag: '🇦🇪', region: 'United Arab Emirates' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar (CAD)', flag: '🇨🇦', region: 'Canada' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar (AUD)', flag: '🇦🇺', region: 'Australia' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen (JPY)', flag: '🇯🇵', region: 'Japan' },
  { code: 'SGD', symbol: 'SG$', name: 'Singapore Dollar (SGD)', flag: '🇸🇬', region: 'Singapore' },
]

export const formatPrice = (amount, symbol = '₹', position = 'prefix', decimals = 2) => {
  if (amount === undefined || amount === null || isNaN(amount) || amount === '') return `${symbol}0.00`
  const num = Number(amount)
  const formatted = num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
  return position === 'suffix' ? `${formatted} ${symbol}` : `${symbol}${formatted}`
}

export default {
  CURRENCY_PRESETS,
  formatPrice,
}
