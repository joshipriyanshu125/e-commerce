import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ShoppingBag } from 'lucide-react'
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
      className="group cursor-pointer bg-atelier-cream border border-atelier-lightgray/70
        p-6 transition-all duration-300 hover:shadow-md hover:border-atelier-dark/30 hover:-translate-y-0.5"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-4">
          {/* Thumbnail */}
          {firstImage ? (
            <div className="w-16 h-16 bg-atelier-beige border border-atelier-lightgray/40 overflow-hidden flex-shrink-0">
              <img
                src={firstImage}
                alt={items[0]?.name}
                className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
              />
            </div>
          ) : (
            <div className="w-16 h-16 bg-atelier-beige border border-atelier-lightgray/40 flex items-center justify-center flex-shrink-0">
              <ShoppingBag size={20} className="text-atelier-gray/40" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[10px] font-mono text-atelier-gray uppercase tracking-[0.2em] mb-1">
              #{order._id?.slice(-8)?.toUpperCase()}
            </p>
            <h4 className="font-serif text-base text-atelier-dark font-medium truncate max-w-[280px] sm:max-w-md">
              {items.length === 1
                ? items[0]?.name || 'Order item'
                : `${items.length} items`}
            </h4>
          </div>
        </div>
        <StatusBadge status={order.orderStatus} size="sm" />
      </div>

      {/* Items preview */}
      {items.length > 1 && (
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1.5 no-scrollbar">
          {items.slice(0, 5).map((item, idx) => (
            item.image && (
              <div
                key={idx}
                className="w-10 h-10 overflow-hidden bg-atelier-beige border border-atelier-lightgray/40 flex-shrink-0"
              >
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
            )
          ))}
          {items.length > 5 && (
            <div className="w-10 h-10 bg-atelier-beige border border-atelier-lightgray/40 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] text-atelier-gray font-mono">+{items.length - 5}</span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-atelier-lightgray/50">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-[9px] font-mono text-atelier-gray/60 uppercase tracking-widest">Placed Date</p>
            <p className="text-xs text-atelier-dark font-mono font-medium mt-1">{formatDate(order.createdAt)}</p>
          </div>
          <div>
            <p className="text-[9px] font-mono text-atelier-gray/60 uppercase tracking-widest">Total Value</p>
            <p className="text-sm font-mono font-semibold text-atelier-dark mt-0.5">${(order.totalPrice || 0).toFixed(2)}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 text-atelier-gray hover:text-atelier-dark transition-colors font-mono text-xs uppercase tracking-widest">
          <span>Details</span>
          <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  )
}

export default OrderCard
