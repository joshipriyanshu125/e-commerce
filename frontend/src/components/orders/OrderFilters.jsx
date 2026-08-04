import React from 'react'
import { Search, X } from 'lucide-react'

const FILTER_TABS = [
  { key: 'All',              label: 'All' },
  { key: 'active',           label: 'Active',    statuses: ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery'] },
  { key: 'Delivered',        label: 'Delivered' },
  { key: 'Cancelled',        label: 'Cancelled' },
  { key: 'Refunded',         label: 'Refunded' },
]

const OrderFilters = ({ filter, setFilter, search, setSearch }) => {
  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search size={16} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-atelier-gray/40" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by order ID or product name…"
          className="w-full bg-transparent border-b border-atelier-lightgray focus:border-atelier-dark py-3 pl-8 pr-10
            text-sm text-atelier-dark placeholder-atelier-gray/30 focus:outline-none transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-atelier-gray/40 hover:text-atelier-dark transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex-shrink-0 px-4 py-2 font-mono text-[10px] uppercase tracking-widest
              border transition-all duration-200 ${
              filter === tab.key
                ? 'border-atelier-dark bg-atelier-dark text-white'
                : 'border-atelier-lightgray bg-transparent text-atelier-gray hover:text-atelier-dark hover:border-atelier-gray'
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
