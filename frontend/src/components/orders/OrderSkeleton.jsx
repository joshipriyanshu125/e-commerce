import React from 'react'

const OrderSkeleton = () => (
  <div className="bg-white/3 border border-white/8 rounded-2xl p-5 animate-pulse">
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-xl bg-white/8 flex-shrink-0" />
        <div className="space-y-2">
          <div className="h-2.5 w-24 rounded bg-white/8" />
          <div className="h-3.5 w-36 rounded bg-white/8" />
        </div>
      </div>
      <div className="h-5 w-20 rounded-full bg-white/8" />
    </div>
    <div className="flex items-center justify-between pt-3 border-t border-white/6">
      <div className="flex gap-4">
        <div className="space-y-1.5">
          <div className="h-2 w-10 rounded bg-white/8" />
          <div className="h-3 w-20 rounded bg-white/8" />
        </div>
        <div className="space-y-1.5">
          <div className="h-2 w-8 rounded bg-white/8" />
          <div className="h-4 w-14 rounded bg-white/8" />
        </div>
      </div>
      <div className="h-3 w-14 rounded bg-white/8" />
    </div>
  </div>
)

const OrderDetailSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-8 w-48 rounded bg-white/8" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6 space-y-4">
          <div className="h-4 w-32 rounded bg-white/8" />
          {[1, 2].map(i => (
            <div key={i} className="flex gap-4">
              <div className="w-20 h-20 rounded-xl bg-white/8 flex-shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3.5 w-40 rounded bg-white/8" />
                <div className="h-3 w-24 rounded bg-white/8" />
                <div className="h-4 w-16 rounded bg-white/8" />
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6 space-y-3">
          <div className="h-4 w-36 rounded bg-white/8" />
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-3 w-full rounded bg-white/8" />)}
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6 space-y-4">
          <div className="h-4 w-28 rounded bg-white/8" />
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-white/8 flex-shrink-0" />
              <div className="flex-1 space-y-1.5 py-1">
                <div className="h-3 w-20 rounded bg-white/8" />
                <div className="h-2.5 w-28 rounded bg-white/8" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)

export { OrderSkeleton, OrderDetailSkeleton }
export default OrderSkeleton
