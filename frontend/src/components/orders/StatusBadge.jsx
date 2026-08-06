import React from 'react'
import {
  Clock, CheckCircle2, Package, Truck, MapPin,
  CheckCheck, XCircle, RotateCcw
} from 'lucide-react'

const STATUS_CONFIG_LIGHT = {
  Pending:            { color: 'text-amber-800 border-amber-200 bg-amber-50', icon: Clock, label: 'Pending' },
  Confirmed:          { color: 'text-sky-850 border-sky-200 bg-sky-50', icon: CheckCircle2, label: 'Confirmed' },
  Packed:             { color: 'text-violet-800 border-violet-200 bg-violet-50', icon: Package, label: 'Packed' },
  Shipped:            { color: 'text-indigo-800 border-indigo-200 bg-indigo-50', icon: Truck, label: 'Shipped' },
  'Out for Delivery': { color: 'text-orange-800 border-orange-200 bg-orange-50', icon: MapPin, label: 'Out for Delivery' },
  Delivered:          { color: 'text-emerald-800 border-emerald-250 bg-emerald-50', icon: CheckCheck, label: 'Delivered' },
  Cancelled:          { color: 'text-rose-800 border-rose-200 bg-rose-50', icon: XCircle, label: 'Cancelled' },
  Refunded:           { color: 'text-amber-900 border-amber-250 bg-amber-100/50', icon: RotateCcw, label: 'Refunded' },
}

const STATUS_CONFIG_DARK = {
  Pending:            { color: 'text-amber-400 border-amber-500/20 bg-amber-500/10', icon: Clock, label: 'Pending' },
  Confirmed:          { color: 'text-sky-400 border-sky-500/20 bg-sky-500/10', icon: CheckCircle2, label: 'Confirmed' },
  Packed:             { color: 'text-violet-400 border-violet-500/20 bg-violet-500/10', icon: Package, label: 'Packed' },
  Shipped:            { color: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/10', icon: Truck, label: 'Shipped' },
  'Out for Delivery': { color: 'text-orange-400 border-orange-500/20 bg-orange-500/10', icon: MapPin, label: 'Out for Delivery' },
  Delivered:          { color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10', icon: CheckCheck, label: 'Delivered' },
  Cancelled:          { color: 'text-rose-455 border-rose-500/20 bg-rose-500/10', icon: XCircle, label: 'Cancelled' },
  Refunded:           { color: 'text-amber-300 border-amber-500/25 bg-amber-500/15', icon: RotateCcw, label: 'Refunded' },
}

const StatusBadge = ({ status, size = 'md', dark = false }) => {
  const config = dark ? STATUS_CONFIG_DARK : STATUS_CONFIG_LIGHT
  const cfg = config[status] || config.Pending
  const Icon = cfg.icon

  const sizeClasses = {
    sm: 'text-[9px] px-2.5 py-0.5 gap-1',
    md: 'text-[10px] px-3 py-1 gap-1.5',
    lg: 'text-xs px-3.5 py-1.5 gap-2',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-mono uppercase tracking-wider font-semibold border
        ${cfg.color} ${sizeClasses[size] || sizeClasses.md}`}
    >
      <Icon size={size === 'lg' ? 12 : 10} strokeWidth={2} />
      {cfg.label}
    </span>
  )
}

export { STATUS_CONFIG_LIGHT as STATUS_CONFIG }
export default StatusBadge
