import React from 'react'

const OrderSkeleton = () => (
  <div className="bg-atelier-cream border border-atelier-lightgray p-6 animate-pulse space-y-4">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-atelier-lightgray flex-shrink-0" />
        <div className="space-y-2">
          <div className="h-2 w-20 bg-atelier-lightgray/70" />
          <div className="h-4 w-40 bg-atelier-lightgray/70" />
        </div>
      </div>
      <div className="h-6 w-20 bg-atelier-lightgray/70" />
    </div>
    <div className="flex items-center justify-between pt-4 border-t border-atelier-lightgray/50">
      <div className="flex gap-6">
        <div className="space-y-2">
          <div className="h-2 w-12 bg-atelier-lightgray/70" />
          <div className="h-3 w-16 bg-atelier-lightgray/70" />
        </div>
        <div className="space-y-2">
          <div className="h-2 w-12 bg-atelier-lightgray/70" />
          <div className="h-3 w-16 bg-atelier-lightgray/70" />
        </div>
      </div>
      <div className="h-3 w-12 bg-atelier-lightgray/70" />
    </div>
  </div>
)

const OrderDetailSkeleton = () => (
  <div className="animate-pulse space-y-8">
    <div className="h-8 w-48 bg-atelier-lightgray/70" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-atelier-cream border border-atelier-lightgray p-6 space-y-4">
          <div className="h-4 w-32 bg-atelier-lightgray/70" />
          {[1, 2].map(i => (
            <div key={i} className="flex gap-4">
              <div className="w-16 h-16 bg-atelier-lightgray flex-shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 w-40 bg-atelier-lightgray/70" />
                <div className="h-3 w-24 bg-atelier-lightgray/70" />
                <div className="h-3 w-16 bg-atelier-lightgray/70" />
              </div>
            </div>
          ))}
        </div>
        <div className="bg-atelier-cream border border-atelier-lightgray p-6 space-y-3">
          <div className="h-4 w-36 bg-atelier-lightgray/70" />
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-3 w-full bg-atelier-lightgray/50" />)}
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <div className="bg-atelier-cream border border-atelier-lightgray p-6 space-y-4">
          <div className="h-4 w-28 bg-atelier-lightgray/70" />
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-atelier-lightgray flex-shrink-0" />
              <div className="flex-1 space-y-1.5 py-1">
                <div className="h-3 w-20 bg-atelier-lightgray/70" />
                <div className="h-2.5 w-28 bg-atelier-lightgray/70" />
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
