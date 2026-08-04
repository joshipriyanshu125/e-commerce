import React from 'react'
import {
  Clock, CheckCircle2, Package, Truck, MapPin,
  CheckCheck, XCircle, RotateCcw
} from 'lucide-react'

const STATUS_CONFIG = {
  Pending:            { color: 'text-amber-400',   bg: 'bg-amber-400/10',   border: 'border-amber-400/30',   icon: Clock,         label: 'Pending' },
  Confirmed:          { color: 'text-blue-400',    bg: 'bg-blue-400/10',    border: 'border-blue-400/30',    icon: CheckCircle2,  label: 'Confirmed' },
  Packed:             { color: 'text-violet-400',  bg: 'bg-violet-400/10',  border: 'border-violet-400/30',  icon: Package,       label: 'Packed' },
  Shipped:            { color: 'text-indigo-400',  bg: 'bg-indigo-400/10',  border: 'border-indigo-400/30',  icon: Truck,         label: 'Shipped' },
  'Out for Delivery': { color: 'text-orange-400',  bg: 'bg-orange-400/10',  border: 'border-orange-400/30',  icon: MapPin,        label: 'Out for Delivery' },
  Delivered:          { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', icon: CheckCheck,    label: 'Delivered' },
  Cancelled:          { color: 'text-red-400',     bg: 'bg-red-400/10',     border: 'border-red-400/30',     icon: XCircle,       label: 'Cancelled' },
  Refunded:           { color: 'text-pink-400',    bg: 'bg-pink-400/10',    border: 'border-pink-400/30',    icon: RotateCcw,     label: 'Refunded' },
}

const StatusBadge = ({ status, size = 'md' }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Pending
  const Icon = cfg.icon

  const sizeClasses = {
    sm: 'text-[9px] px-2 py-0.5 gap-1',
    md: 'text-[10px] px-2.5 py-1 gap-1.5',
    lg: 'text-xs px-3 py-1.5 gap-2',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-mono uppercase tracking-widest font-semibold border
        ${cfg.color} ${cfg.bg} ${cfg.border} ${sizeClasses[size] || sizeClasses.md}`}
    >
      <Icon size={size === 'lg' ? 12 : 10} strokeWidth={2.5} />
      {cfg.label}
    </span>
  )
}

export { STATUS_CONFIG }
export default StatusBadge
