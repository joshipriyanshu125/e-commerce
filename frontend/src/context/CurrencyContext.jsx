import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/axiosInstance'
import { CURRENCY_PRESETS, formatPrice as baseFormatPrice } from '../utils/currency'

const CurrencyContext = createContext({
  currency: 'INR',
  currencySymbol: '₹',
  currencyPosition: 'prefix',
  formatPrice: (amount) => `₹${amount}`,
  updateCurrency: () => {},
  refreshSettings: () => {},
  CURRENCY_PRESETS
})

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState(() => localStorage.getItem('store_currency') || 'INR')
  const [currencySymbol, setCurrencySymbol] = useState(() => localStorage.getItem('store_currency_symbol') || '₹')
  const [currencyPosition, setCurrencyPosition] = useState(() => localStorage.getItem('store_currency_position') || 'prefix')

  const fetchStoreSettings = useCallback(async () => {
    try {
      const res = await api.get('settings')
      if (res.data?.success && res.data?.settings?.storeInfo) {
        const { currency: curr, currencySymbol: sym, currencyPosition: pos } = res.data.settings.storeInfo
        const finalCurr = curr || 'INR'
        const finalSym = sym || (finalCurr === 'INR' ? '₹' : finalCurr === 'USD' ? '$' : '₹')
        const finalPos = pos || 'prefix'

        setCurrency(finalCurr)
        setCurrencySymbol(finalSym)
        setCurrencyPosition(finalPos)

        localStorage.setItem('store_currency', finalCurr)
        localStorage.setItem('store_currency_symbol', finalSym)
        localStorage.setItem('store_currency_position', finalPos)
      }
    } catch (err) {
      // Fallback silently to localStorage or defaults
    }
  }, [])

  useEffect(() => {
    fetchStoreSettings()
  }, [fetchStoreSettings])

  const updateCurrency = useCallback((curr, sym, pos = 'prefix') => {
    setCurrency(curr)
    setCurrencySymbol(sym)
    setCurrencyPosition(pos)
    localStorage.setItem('store_currency', curr)
    localStorage.setItem('store_currency_symbol', sym)
    localStorage.setItem('store_currency_position', pos)
  }, [])

  const formatPrice = useCallback((amount, decimals = 2) => {
    return baseFormatPrice(amount, currencySymbol, currencyPosition, decimals)
  }, [currencySymbol, currencyPosition])

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencySymbol,
        currencyPosition,
        formatPrice,
        updateCurrency,
        refreshSettings: fetchStoreSettings,
        CURRENCY_PRESETS
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

export const useCurrency = () => useContext(CurrencyContext)

export default CurrencyContext
