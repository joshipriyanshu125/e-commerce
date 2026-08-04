import React from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'

const FILTER_TABS = [
  { key: 'All',              label: 'All' },
  { key: 'active',           label: 'Active',    statuses: ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery'] },
  { key: 'Delivered',        label: 'Delivered' },
  { key: 'Cancelled',        label: 'Cancelled' },
  { key: 'Refunded',         label: 'Refunded' },
]

const OrderFilters = ({ filter, setFilter, search, setSearch }) => {
  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by order ID or product name…"
          className="w-full bg-white/5 border border-white/8 rounded-xl pl-9 pr-10 py-2.5
            text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/20 transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-widest
              border transition-all duration-200 ${
              filter === tab.key
                ? 'border-white/30 bg-white/10 text-white'
                : 'border-white/8 bg-transparent text-white/40 hover:text-white/60 hover:border-white/15'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export { FILTER_TABS }
export default OrderFilters
