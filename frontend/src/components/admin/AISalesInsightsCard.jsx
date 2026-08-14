import React, { useState, useEffect, useCallback } from 'react'
import { Flame, TrendingUp, AlertTriangle, DollarSign, RotateCcw, Sparkles, RefreshCw, Bot, ChevronRight } from 'lucide-react'
import api from '../../services/axiosInstance'

const renderFormattedText = (text) => {
  if (!text) return null
  return text.split('\n\n').map((paragraph, idx) => {
    const formatted = paragraph
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/`(.*?)`/g, '<code class="bg-white/10 px-1 rounded text-amber-300 font-mono text-xs">$1</code>')
    return (
      <div key={idx} className="flex items-start gap-2.5 text-xs text-white/80 leading-relaxed">
        <span className="text-amber-400 mt-1 flex-shrink-0 text-[10px]">✦</span>
        <p dangerouslySetInnerHTML={{ __html: formatted }} />
      </div>
    )
  })
}

const AISalesInsightsCard = ({ analytics }) => {
  const [briefing, setBriefing] = useState(null)
  const [loadingBrief, setLoadingBrief] = useState(false)
  const [generatedBy, setGeneratedBy] = useState('system')

  const rawInsights = analytics?.businessInsights || {}

  const insights = {
    topProduct: {
      name: rawInsights.topProduct?.name || 'Oversized Black Hoodie',
      sub: `${rawInsights.topProduct?.unitsSold || 0} units sold ($${(rawInsights.topProduct?.revenue || 0).toLocaleString()})`
    },
    fastestGrowingCategory: {
      name: rawInsights.fastestGrowingCategory?.name || "Women's Streetwear",
      sub: `${rawInsights.fastestGrowingCategory?.growth || '+0.0%'} MoM growth`
    },
    inventoryRisk: {
      name: rawInsights.inventoryRisk?.name || 'Cargo Pants – Black / M',
      sub: `${rawInsights.inventoryRisk?.status || 'Low Stock Alert'} (${rawInsights.inventoryRisk?.stock ?? 0} remaining)`
    },
    highestRevenueProduct: {
      name: rawInsights.highestRevenueProduct?.name || 'Classic Sneakers',
      sub: `$${(rawInsights.highestRevenueProduct?.revenue || 0).toLocaleString()} revenue`
    },
    highReturnProduct: {
      name: rawInsights.highReturnProduct?.name || 'Oversized Denim Jacket',
      sub: `${rawInsights.highReturnProduct?.returnedUnits || 0} return requests`
    }
  }

  const fetchAiBriefing = useCallback(async () => {
    setLoadingBrief(true)
    try {
      const res = await api.post('ai/daily-insights')
      if (res.data?.success && res.data?.briefing) {
        setBriefing(res.data.briefing)
        setGeneratedBy(res.data.generatedBy || 'ai')
      }
    } catch (err) {
      console.error('Failed to fetch AI briefing:', err)
    } finally {
      setLoadingBrief(false)
    }
  }, [])

  useEffect(() => {
    fetchAiBriefing()
  }, [fetchAiBriefing])

  const insightCards = [
    {
      title: 'Top Product',
      icon: Flame,
      emoji: '🔥',
      value: insights.topProduct.name,
      sub: insights.topProduct.sub,
      gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
      borderColor: 'rgba(245, 158, 11, 0.25)',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
    {
      title: 'Fastest Growing Category',
      icon: TrendingUp,
      emoji: '📈',
      value: insights.fastestGrowingCategory.name,
      sub: insights.fastestGrowingCategory.sub,
      gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      borderColor: 'rgba(16, 185, 129, 0.25)',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      title: 'Inventory Risk',
      icon: AlertTriangle,
      emoji: '⚠️',
      value: insights.inventoryRisk.name,
      sub: insights.inventoryRisk.sub,
      gradient: 'from-rose-500/20 via-red-500/10 to-transparent',
      borderColor: 'rgba(244, 63, 94, 0.25)',
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    },
    {
      title: 'Highest Revenue Product',
      icon: DollarSign,
      emoji: '💰',
      value: insights.highestRevenueProduct.name,
      sub: insights.highestRevenueProduct.sub,
      gradient: 'from-purple-500/20 via-indigo-500/10 to-transparent',
      borderColor: 'rgba(168, 85, 247, 0.25)',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    },
    {
      title: 'High Return Product',
      icon: RotateCcw,
      emoji: '🔄',
      value: insights.highReturnProduct.name,
      sub: insights.highReturnProduct.sub,
      gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
      borderColor: 'rgba(6, 182, 212, 0.25)',
      badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    },
  ]

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-5 lg:p-6 space-y-5 transition-all duration-300"
      style={{
        background: 'linear-gradient(135deg, rgba(17,17,26,0.95), rgba(10,10,16,0.98))',
        border: '1px solid rgba(245, 158, 11, 0.2)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(245,158,11,0.05)',
      }}
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-purple-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">AI Sales & Business Insights</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold tracking-wide bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-300">
                DAILY BRIEF
              </span>
            </div>
            <p className="text-xs text-white/50 font-mono mt-0.5">What should I know today?</p>
          </div>
        </div>

        <button
          onClick={fetchAiBriefing}
          disabled={loadingBrief}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-amber-200 border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
        >
          <RefreshCw size={13} className={loadingBrief ? 'animate-spin text-amber-400' : 'text-amber-400'} />
          {loadingBrief ? 'Generating...' : 'Refresh AI Brief'}
        </button>
      </div>

      {/* 5 Highlight Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 relative z-10">
        {insightCards.map((card, idx) => {
          const IconComponent = card.icon
          return (
            <div
              key={idx}
              className={`relative group rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02] bg-gradient-to-b ${card.gradient}`}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${card.borderColor}`,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-base">{card.emoji}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase ${card.badgeColor}`}>
                  {card.title.split(' ')[0]}
                </span>
              </div>

              <p className="text-[11px] font-mono uppercase tracking-wider text-white/40 mb-1">
                {card.title}
              </p>

              <h4 className="text-sm font-semibold text-white truncate max-w-full font-sans tracking-tight title={card.value}">
                {card.value}
              </h4>

              <p className="text-[11px] text-white/50 font-mono mt-1 truncate">
                {card.sub}
              </p>
            </div>
          )
        })}
      </div>

      {/* Executive Briefing Box */}
      <div
        className="relative z-10 rounded-2xl p-4 space-y-3"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.07)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-amber-400/20 flex items-center justify-center">
              <Bot size={12} className="text-amber-400" />
            </div>
            <h4 className="text-xs font-semibold text-white/90 tracking-wide uppercase font-mono">
              Today's Executive Summary
            </h4>
          </div>
          <span className="text-[10px] font-mono text-white/30">
            {generatedBy === 'ai' ? '✦ Generated by Gemini AI' : '○ Derived from Live Metrics'}
          </span>
        </div>

        {loadingBrief ? (
          <div className="space-y-2 py-2">
            <div className="h-4 bg-white/5 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-white/5 rounded animate-pulse w-5/6" />
            <div className="h-4 bg-white/5 rounded animate-pulse w-2/3" />
          </div>
        ) : (
          <div className="space-y-2.5">
            {renderFormattedText(briefing)}
          </div>
        )}
      </div>
    </div>
  )
}

export default AISalesInsightsCard
