import React from 'react'
import {
  Clock, CheckCircle2, Package, Truck, MapPin,
  CheckCheck, XCircle, RotateCcw
} from 'lucide-react'

const STATUS_CONFIG = {
  Pending:            { color: 'text-amber-800',   bg: 'bg-amber-100/40',   border: 'border-amber-200',   icon: Clock,         label: 'Pending' },
  Confirmed:          { color: 'text-sky-800',    bg: 'bg-sky-100/40',    border: 'border-sky-200',    icon: CheckCircle2,  label: 'Confirmed' },
  Packed:             { color: 'text-violet-800',  bg: 'bg-violet-100/40',  border: 'border-violet-200',  icon: Package,       label: 'Packed' },
  Shipped:            { color: 'text-indigo-800',  bg: 'bg-indigo-100/40',  border: 'border-indigo-200',  icon: Truck,         label: 'Shipped' },
  'Out for Delivery': { color: 'text-orange-800',  bg: 'bg-orange-100/40',  border: 'border-orange-200',  icon: MapPin,        label: 'Out for Delivery' },
  Delivered:          { color: 'text-emerald-800', bg: 'bg-emerald-100/40', border: 'border-emerald-200', icon: CheckCheck,    label: 'Delivered' },
  Cancelled:          { color: 'text-rose-800',     bg: 'bg-rose-100/40',     border: 'border-rose-200',     icon: XCircle,       label: 'Cancelled' },
  Refunded:           { color: 'text-amber-955',    bg: 'bg-amber-100/60',    border: 'border-amber-200',    icon: RotateCcw,     label: 'Refunded' },
}

const StatusBadge = ({ status, size = 'md' }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Pending
  const Icon = cfg.icon

  const sizeClasses = {
    sm: 'text-[9px] px-2.5 py-0.5 gap-1',
    md: 'text-[10px] px-3 py-1 gap-1.5',
    lg: 'text-xs px-3.5 py-1.5 gap-2',
  }

  return (
    <span
      className={`inline-flex items-center rounded-none font-mono uppercase tracking-widest font-semibold border
        ${cfg.color} ${cfg.bg} ${cfg.border} ${sizeClasses[size] || sizeClasses.md}`}
    >
      <Icon size={size === 'lg' ? 12 : 10} strokeWidth={2} />
      {cfg.label}
    </span>
  )
}

export { STATUS_CONFIG }
export default StatusBadge
