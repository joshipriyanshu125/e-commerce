import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, ChevronRight, ShoppingBag } from 'lucide-react'
import StatusBadge from './StatusBadge'

const formatDate = (d) => {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return '—' }
}

const OrderCard = ({ order }) => {
  const navigate = useNavigate()
  const items = order.orderItems || order.items || []
  const firstImage = items[0]?.image || null

  return (
    <div
      onClick={() => navigate(`/orders/${order._id}`)}
      className="group cursor-pointer bg-white/3 hover:bg-white/5 border border-white/8 hover:border-white/15
        rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-black/20
        hover:-translate-y-0.5 active:translate-y-0"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          {/* Thumbnail */}
          {firstImage ? (
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
              <img
                src={firstImage}
                alt={items[0]?.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
              <ShoppingBag size={22} className="text-white/20" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-0.5">
              #{order._id?.slice(-8)?.toUpperCase()}
            </p>
            <p className="text-sm text-white/70 font-medium truncate">
              {items.length === 1
                ? items[0]?.name || 'Order item'
                : `${items.length} items`}
            </p>
          </div>
        </div>
        <StatusBadge status={order.orderStatus} size="sm" />
      </div>

      {/* Items preview */}
      {items.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          {items.slice(0, 4).map((item, idx) => (
            item.image && (
              <div
                key={idx}
                className="w-9 h-9 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 ring-1 ring-white/10"
              >
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
            )
          ))}
          {items.length > 4 && (
            <div className="w-9 h-9 rounded-lg bg-white/5 ring-1 ring-white/10 flex items-center justify-center flex-shrink-0">
              <span className="text-[9px] text-white/40 font-mono">+{items.length - 4}</span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/6">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Date</p>
            <p className="text-xs text-white/60 mt-0.5">{formatDate(order.createdAt)}</p>
          </div>
          <div>
            <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Total</p>
            <p className="text-sm font-semibold text-white mt-0.5">${(order.totalPrice || 0).toFixed(2)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-white/30 group-hover:text-white/60 transition-colors">
          <span className="text-[10px] font-mono uppercase tracking-widest">Details</span>
          <ChevronRight size={14} />
        </div>
      </div>
    </div>
  )
}

export default OrderCard
