import React from 'react'
import { useCurrency } from '../../context/CurrencyContext'

const AnnouncementBar = () => {
  const { formatPrice } = useCurrency()

  return (
    <div className="bg-atelier-dark text-white text-center py-2.5 px-4">
      <p className="font-mono text-xs sm:text-sm tracking-[0.2em] uppercase">
        Complimentary shipping on orders over {formatPrice(150)} &nbsp;&bull;&nbsp; 30-day returns &nbsp;&bull;&nbsp; New arrivals weekly
      </p>
    </div>
  )
}

export default AnnouncementBar
