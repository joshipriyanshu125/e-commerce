import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Sparkles, X, Send, Copy, Check, RotateCcw, ChevronDown, Zap, AlertTriangle, Bot } from 'lucide-react'
import api from '../../services/axiosInstance'

// ─── Preset quick questions ────────────────────────────────────────────────────
const PRESETS = [
  { icon: '📈', label: 'Revenue summary', question: 'Give me a revenue summary for this month versus last month.' },
  { icon: '📦', label: 'Restock alerts', question: 'Which products should I restock urgently based on current stock levels and sales velocity?' },
  { icon: '↩️', label: 'Return rate', question: 'How has the return rate changed compared to last month? Any concerning trends?' },
  { icon: '🏆', label: 'Top performers', question: 'Which are my top-performing products and categories right now?' },
  { icon: '⚡', label: 'Sales velocity', question: 'What is my sales velocity? Which products are selling fastest in the last 30 days?' },
  { icon: '👥', label: 'Customer insights', question: 'Summarize customer acquisition: new vs repeat buyers and what it means for the business.' },
]

// ─── Simple markdown-like renderer ────────────────────────────────────────────
const renderMarkdown = (text) => {
  if (!text) return null
  const lines = text.split('\n')
  const elements = []
  let key = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Blank line
    if (!line.trim()) {
      elements.push(<div key={key++} className="h-2" />)
      continue
    }

    // Bullet points
    if (line.match(/^[-•*]\s/)) {
      const content = line.replace(/^[-•*]\s/, '')
      elements.push(
        <div key={key++} className="flex items-start gap-2 text-sm">
          <span className="text-amber-400 mt-0.5 flex-shrink-0">▸</span>
          <span dangerouslySetInnerHTML={{ __html: boldify(content) }} />
        </div>
      )
      continue
    }

    // Numbered lists
    if (line.match(/^\d+\.\s/)) {
      const content = line.replace(/^\d+\.\s/, '')
      const num = line.match(/^(\d+)/)[1]
      elements.push(
        <div key={key++} className="flex items-start gap-2 text-sm">
          <span className="text-amber-400/70 font-mono text-xs mt-0.5 flex-shrink-0 w-4">{num}.</span>
          <span dangerouslySetInnerHTML={{ __html: boldify(content) }} />
        </div>
      )
      continue
    }

    // Heading-ish lines (start with ##)
    if (line.startsWith('## ') || line.startsWith('### ')) {
      const content = line.replace(/^#{2,3}\s/, '')
      elements.push(
        <p key={key++} className="text-sm font-semibold text-white/90 mt-1"
          dangerouslySetInnerHTML={{ __html: boldify(content) }} />
      )
      continue
    }

    // Normal paragraph
    elements.push(
      <p key={key++} className="text-sm text-white/80 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: boldify(line) }} />
    )
  }

  return elements
}

// Bold **text** → <strong>
const boldify = (text) =>
  text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/`(.*?)`/g, '<code class="bg-white/10 px-1 rounded text-amber-300 text-xs font-mono">$1</code>')

// ─── Typing Indicator ─────────────────────────────────────────────────────────
const TypingIndicator = () => (
  <div className="flex items-center gap-3 px-4 py-3">
    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
      <Bot size={12} className="text-white" />
    </div>
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-amber-400/60"
          style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
    </div>
  </div>
)

// ─── Message Bubble ───────────────────────────────────────────────────────────
const MessageBubble = ({ msg, onCopy }) => {
  const isUser = msg.role === 'user'
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
    onCopy?.()
  }

  if (isUser) {
    return (
      <div className="flex justify-end px-4 py-1">
        <div
          className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm text-white/90 leading-relaxed"
          style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(99,102,241,0.2))', border: '1px solid rgba(245,158,11,0.2)' }}
        >
          {msg.content}
        </div>
      </div>
    )
  }

  // AI message
  return (
    <div className="px-4 py-1 group">
      <div className="flex items-start gap-2.5">
        {/* Avatar */}
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg shadow-amber-500/20">
          <Bot size={12} className="text-white" />
        </div>
        {/* Bubble */}
        <div className="flex-1 min-w-0">
          <div
            className="px-4 py-3 rounded-2xl rounded-tl-sm space-y-1"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {msg.error ? (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertTriangle size={14} />
                <span>{msg.content}</span>
              </div>
            ) : (
              <div className="space-y-1.5 text-white/75">
                {renderMarkdown(msg.content)}
              </div>
            )}
          </div>
          {/* Copy button */}
          {!msg.error && (
            <button
              onClick={handleCopy}
              className="mt-1 ml-1 flex items-center gap-1 text-[10px] text-white/25 hover:text-white/60 transition-colors opacity-0 group-hover:opacity-100"
            >
              {copied ? <Check size={10} /> : <Copy size={10} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

const AIAnalyticsChat = ({ analytics }) => {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPresets, setShowPresets] = useState(true)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [open])

  const sendMessage = useCallback(async (questionText) => {
    const q = (questionText || input).trim()
    if (!q || loading) return

    const userMsg = { role: 'user', content: q, id: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setShowPresets(false)

    // Build conversation history (exclude error messages)
    const history = messages
      .filter(m => !m.error)
      .map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await api.post('ai/analytics-chat', {
        question: q,
        conversationHistory: history,
      })

      const aiMsg = {
        role: 'assistant',
        content: res.data.answer,
        id: Date.now() + 1,
        generatedBy: res.data.generatedBy,
      }
      setMessages(prev => [...prev, aiMsg])
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Something went wrong. Please try again.'
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: errMsg, id: Date.now() + 1, error: true }
      ])
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
    setShowPresets(true)
    setInput('')
  }

  const dataLoaded = !!analytics

  return (
    <>
      {/* ── Bounce animation keyframes (injected once) ── */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 12px rgba(245,158,11,0.3); }
          50%       { box-shadow: 0 0 24px rgba(245,158,11,0.5); }
        }
        .ai-panel-enter { animation: slideUp 0.25s cubic-bezier(.16,1,.3,1) forwards; }
        .ai-trigger-glow { animation: glowPulse 2.5s ease-in-out infinite; }
      `}</style>

      {/* ── Floating Trigger Button ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {/* Data indicator badge */}
        {!open && dataLoaded && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono text-emerald-400 border border-emerald-500/20 bg-emerald-500/5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live data ready
          </div>
        )}
        <button
          onClick={() => setOpen(o => !o)}
          id="ai-analytics-chat-trigger"
          className="ai-trigger-glow flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold text-white transition-all duration-200 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316, #6366f1)', minWidth: 140 }}
        >
          {open ? <X size={16} /> : <Sparkles size={16} />}
          {open ? 'Close' : 'AI Insights'}
        </button>
      </div>

      {/* ── Chat Panel ── */}
      {open && (
        <div
          className="ai-panel-enter fixed bottom-24 right-6 z-50 flex flex-col rounded-3xl overflow-hidden"
          style={{
            width: 'min(420px, calc(100vw - 24px))',
            height: 'min(580px, calc(100vh - 120px))',
            background: 'rgba(10,10,16,0.97)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(245,158,11,0.15)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset',
          }}
        >
          {/* ── Header ── */}
          <div
            className="flex items-center justify-between px-4 py-3.5 flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(245,158,11,0.04)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}
              >
                <Sparkles size={15} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-none">Analytics AI</p>
                <p className="text-[10px] text-white/35 mt-0.5 font-mono">
                  {dataLoaded ? '✦ Real store data' : '○ Loading data...'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  title="Clear chat"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/5 transition-all"
                >
                  <RotateCcw size={13} />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/5 transition-all"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* ── Messages / Presets Area ── */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto py-3 space-y-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>

            {/* Welcome / empty state */}
            {messages.length === 0 && (
              <div className="px-4 pt-2 pb-3">
                <div
                  className="rounded-2xl px-4 py-4 space-y-1"
                  style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={14} className="text-amber-400" />
                    <span className="text-xs font-semibold text-amber-400">Ask anything about your store</span>
                  </div>
                  <p className="text-xs text-white/45 leading-relaxed">
                    I have access to your <strong className="text-white/70">live store data</strong> — revenue, orders, inventory, returns, customer behavior, and more. I only reference real numbers, never guesses.
                  </p>
                </div>
              </div>
            )}

            {/* Preset questions */}
            {showPresets && (
              <div className="px-4 space-y-1.5">
                <p className="text-[10px] font-mono text-white/25 uppercase tracking-widest mb-2">Quick questions</p>
                {PRESETS.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(preset.question)}
                    disabled={loading}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(245,158,11,0.2)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                  >
                    <span className="text-base flex-shrink-0">{preset.icon}</span>
                    <span className="text-xs text-white/70">{preset.label}</span>
                    <ChevronDown size={11} className="ml-auto text-white/20 -rotate-90 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {/* Conversation messages */}
            {messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}

            {/* Typing indicator */}
            {loading && <TypingIndicator />}
          </div>

          {/* ── Input Bar ── */}
          <div
            className="flex-shrink-0 px-3 py-3"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div
              className="flex items-end gap-2 rounded-2xl px-3 py-2"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
            >
              <textarea
                ref={inputRef}
                id="ai-analytics-input"
                rows={1}
                value={input}
                onChange={e => {
                  setInput(e.target.value)
                  // Auto-resize
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask about revenue, stock, returns, customers…"
                disabled={loading}
                className="flex-1 bg-transparent text-sm text-white/80 placeholder-white/20 resize-none outline-none leading-relaxed disabled:opacity-50"
                style={{ minHeight: '24px', maxHeight: '100px' }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                id="ai-analytics-send"
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-150 disabled:opacity-30 active:scale-90"
                style={{ background: input.trim() && !loading ? 'linear-gradient(135deg, #f59e0b, #f97316)' : 'rgba(255,255,255,0.08)' }}
              >
                <Send size={13} className="text-white" />
              </button>
            </div>
            <p className="text-[9px] text-white/15 text-center mt-1.5 font-mono">
              Shift+Enter for new line · Enter to send
            </p>
          </div>
        </div>
      )}
    </>
  )
}

export default AIAnalyticsChat
