import React from 'react'
import {
  Clock, CheckCircle2, Package, Truck, MapPin,
  CheckCheck, XCircle, RotateCcw
} from 'lucide-react'

const PIPELINE = [
  { key: 'Pending',            label: 'Pending',          icon: Clock,        color: 'text-amber-400',   ring: 'ring-amber-400/60',   fill: 'bg-amber-400' },
  { key: 'Confirmed',          label: 'Confirmed',        icon: CheckCircle2, color: 'text-blue-400',    ring: 'ring-blue-400/60',    fill: 'bg-blue-400' },
  { key: 'Packed',             label: 'Packed',           icon: Package,      color: 'text-violet-400',  ring: 'ring-violet-400/60',  fill: 'bg-violet-400' },
  { key: 'Shipped',            label: 'Shipped',          icon: Truck,        color: 'text-indigo-400',  ring: 'ring-indigo-400/60',  fill: 'bg-indigo-400' },
  { key: 'Out for Delivery',   label: 'Out for Delivery', icon: MapPin,       color: 'text-orange-400',  ring: 'ring-orange-400/60',  fill: 'bg-orange-400' },
  { key: 'Delivered',          label: 'Delivered',        icon: CheckCheck,   color: 'text-emerald-400', ring: 'ring-emerald-400/60', fill: 'bg-emerald-400' },
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
      <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
        isCancelled ? 'border-red-500/20 bg-red-500/5' : 'border-pink-500/20 bg-pink-500/5'
      }`}>
        {isCancelled
          ? <XCircle size={22} className="text-red-400 shrink-0" />
          : <RotateCcw size={22} className="text-pink-400 shrink-0" />
        }
        <div>
          <p className={`font-semibold text-sm ${isCancelled ? 'text-red-400' : 'text-pink-400'}`}>
            Order {orderStatus}
          </p>
          {getTimestamp(orderStatus) && (
            <p className="text-xs text-white/40 mt-0.5">{getTimestamp(orderStatus)}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
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
              <div className="absolute left-[17px] top-9 bottom-0 w-px">
                <div className={`h-full w-full transition-all duration-700 ${
                  isDone ? 'bg-emerald-400/40' : 'bg-white/8'
                }`} />
              </div>
            )}

            {/* Node */}
            <div className={`relative z-10 mt-1 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 ${
              isActive
                ? `ring-2 ${step.ring} ${step.fill}/20 ${step.color} scale-110`
                : isDone
                ? 'bg-emerald-400/20 ring-1 ring-emerald-400/40 text-emerald-400'
                : 'bg-white/5 ring-1 ring-white/10 text-white/20'
            }`}>
              {isDone
                ? <CheckCheck size={14} strokeWidth={2.5} />
                : <Icon size={14} strokeWidth={2.5} />
              }
            </div>

            {/* Content */}
            <div className={`pb-6 pt-1 flex-1 ${isPending ? 'opacity-40' : ''}`}>
              <p className={`text-sm font-semibold leading-tight ${
                isActive ? step.color : isDone ? 'text-emerald-400' : 'text-white/40'
              }`}>
                {step.label}
              </p>
              {timestamp && (
                <p className="text-xs text-white/40 mt-0.5">{timestamp}</p>
              )}
              {isActive && !timestamp && (
                <p className="text-xs text-white/40 mt-0.5">In progress…</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default OrderTimeline
