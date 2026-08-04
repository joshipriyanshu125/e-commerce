import React from 'react'
import {
  Clock, CheckCircle2, Package, Truck, MapPin,
  CheckCheck, XCircle, RotateCcw
} from 'lucide-react'

const PIPELINE = [
  { key: 'Pending',            label: 'Pending',          icon: Clock,        color: 'text-atelier-dark',   ring: 'ring-atelier-dark/20',   fill: 'bg-atelier-dark' },
  { key: 'Confirmed',          label: 'Confirmed',        icon: CheckCircle2, color: 'text-atelier-dark',    ring: 'ring-atelier-dark/20',    fill: 'bg-atelier-dark' },
  { key: 'Packed',             label: 'Packed',           icon: Package,      color: 'text-atelier-dark',  ring: 'ring-atelier-dark/20',  fill: 'bg-atelier-dark' },
  { key: 'Shipped',            label: 'Shipped',          icon: Truck,        color: 'text-atelier-dark',  ring: 'ring-atelier-dark/20',  fill: 'bg-atelier-dark' },
  { key: 'Out for Delivery',   label: 'Out for Delivery', icon: MapPin,       color: 'text-atelier-dark',  ring: 'ring-atelier-dark/20',  fill: 'bg-atelier-dark' },
  { key: 'Delivered',          label: 'Delivered',        icon: CheckCheck,   color: 'text-emerald-700', ring: 'ring-emerald-700/20', fill: 'bg-emerald-700' },
]

const formatDate = (dateStr) => {
  if (!dateStr) return null
  try {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  } catch { return null }
}

const OrderTimeline = ({ orderStatus, trackingHistory = [] }) => {
  const isTerminal = ['Cancelled', 'Refunded'].includes(orderStatus)
  const currentIdx = PIPELINE.findIndex(s => s.key === orderStatus)

  // Get timestamp for a status from trackingHistory
  const getTimestamp = (statusKey) => {
    if (!trackingHistory.length) return null
    const entry = [...trackingHistory].reverse().find(h => h.status === statusKey)
    return entry ? formatDate(entry.timestamp) : null
  }

  if (isTerminal) {
    const isCancelled = orderStatus === 'Cancelled'
    return (
      <div className={`flex items-center gap-3 p-4 border ${
        isCancelled ? 'border-rose-500/20 bg-rose-50/50' : 'border-amber-500/20 bg-amber-50/50'
      }`}>
        {isCancelled
          ? <XCircle size={20} className="text-rose-700 shrink-0" />
          : <RotateCcw size={20} className="text-amber-800 shrink-0" />
        }
        <div>
          <p className={`font-semibold font-serif text-sm ${isCancelled ? 'text-rose-800' : 'text-amber-900'}`}>
            Order {orderStatus}
          </p>
          {getTimestamp(orderStatus) && (
            <p className="text-xs text-atelier-gray font-mono mt-0.5">{getTimestamp(orderStatus)}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="relative pl-2">
      {PIPELINE.map((step, i) => {
        const Icon = step.icon
        const isDone = currentIdx > i
        const isActive = currentIdx === i
        const isPending = currentIdx < i
        const timestamp = getTimestamp(step.key)

        return (
          <div key={step.key} className="flex gap-4 relative">
            {/* Vertical line */}
            {i < PIPELINE.length - 1 && (
              <div className="absolute left-[13px] top-7 bottom-0 w-[1px]">
                <div className={`h-full w-full transition-all duration-700 ${
                  isDone ? 'bg-atelier-dark' : 'bg-atelier-lightgray'
                }`} />
              </div>
            )}

            {/* Node */}
            <div className={`relative z-10 mt-1 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-500 ${
              isActive
                ? `ring-4 ${step.ring} ${step.fill} text-white scale-110`
                : isDone
                ? 'bg-atelier-dark text-white'
                : 'bg-[#FAF8F5] border border-atelier-lightgray text-atelier-gray/40'
            }`}>
              {isDone
                ? <CheckCheck size={11} strokeWidth={2.5} />
                : <Icon size={11} strokeWidth={2.5} />
              }
            </div>

            {/* Content */}
            <div className={`pb-6 pt-0.5 flex-1 ${isPending ? 'opacity-40' : ''}`}>
              <p className={`text-xs font-semibold leading-tight font-mono uppercase tracking-widest ${
                isActive ? 'text-atelier-dark' : isDone ? 'text-atelier-dark/80' : 'text-atelier-gray/60'
              }`}>
                {step.label}
              </p>
              {timestamp && (
                <p className="text-[11px] text-atelier-gray font-mono mt-0.5">{timestamp}</p>
              )}
              {isActive && !timestamp && (
                <p className="text-[10px] text-atelier-gray font-mono mt-0.5">In progress…</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default OrderTimeline
