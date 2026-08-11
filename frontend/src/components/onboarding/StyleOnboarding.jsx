import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { updateStyleProfile } from '../../features/auth/authSlice'
import api from '../../services/axiosInstance'

// ─── Style Options ────────────────────────────────────────────────────────────
const STYLE_OPTIONS = [
  { id: 'streetwear', label: 'Streetwear', emoji: '🧢', desc: 'Bold urban fits' },
  { id: 'minimal', label: 'Minimal', emoji: '⬜', desc: 'Clean & refined' },
  { id: 'casual', label: 'Casual', emoji: '👕', desc: 'Everyday comfort' },
  { id: 'y2k', label: 'Y2K', emoji: '✨', desc: 'Early 2000s revival' },
  { id: 'oversized', label: 'Oversized', emoji: '🫧', desc: 'Relaxed & boxy' },
  { id: 'athleisure', label: 'Athleisure', emoji: '🏃', desc: 'Sport meets style' },
]

const COLOR_OPTIONS = [
  { id: 'black', label: 'Black', bg: 'bg-gray-900', border: 'border-gray-700' },
  { id: 'white', label: 'White', bg: 'bg-white', border: 'border-gray-300' },
  { id: 'beige', label: 'Beige', bg: 'bg-amber-50', border: 'border-amber-200' },
  { id: 'navy', label: 'Navy', bg: 'bg-blue-900', border: 'border-blue-700' },
  { id: 'grey', label: 'Grey', bg: 'bg-gray-400', border: 'border-gray-300' },
  { id: 'olive', label: 'Olive', bg: 'bg-olive-500', border: 'border-yellow-700' },
  { id: 'brown', label: 'Brown', bg: 'bg-amber-800', border: 'border-amber-600' },
  { id: 'red', label: 'Red', bg: 'bg-red-600', border: 'border-red-400' },
]

const CATEGORY_OPTIONS = [
  { id: 'hoodies', label: 'Hoodies', emoji: '🧥' },
  { id: 'tshirts', label: 'T-Shirts', emoji: '👕' },
  { id: 'cargo', label: 'Cargo', emoji: '🪖' },
  { id: 'sneakers', label: 'Sneakers', emoji: '👟' },
  { id: 'joggers', label: 'Joggers', emoji: '🩲' },
  { id: 'jackets', label: 'Jackets', emoji: '🥋' },
  { id: 'accessories', label: 'Accessories', emoji: '🕶️' },
  { id: 'denim', label: 'Denim', emoji: '🦋' },
]

const FIT_OPTIONS = [
  { id: 'slim', label: 'Slim Fit', emoji: '📐', desc: 'Tailored & close-fitting' },
  { id: 'regular', label: 'Regular Fit', emoji: '📏', desc: 'Standard classic cut' },
  { id: 'relaxed', label: 'Relaxed Fit', emoji: '🛋️', desc: 'Comfortable & loose' },
  { id: 'oversized', label: 'Oversized Fit', emoji: '🧥', desc: 'Extra baggy & boxy' },
]

const OCCASION_OPTIONS = [
  { id: 'casual', label: 'Casual', emoji: '☕', desc: 'Everyday outings' },
  { id: 'party', label: 'Party / Night out', emoji: '🍷', desc: 'Statement fits' },
  { id: 'work', label: 'Smart Casual / Work', emoji: '💼', desc: 'Polished & sharp' },
  { id: 'sport', label: 'Active / Sport', emoji: '🎾', desc: 'Performance wear' },
  { id: 'lounge', label: 'Lounge / Home', emoji: '🏡', desc: 'Comfort first' },
  { id: 'formal', label: 'Formal events', emoji: '👔', desc: 'Dressed to impress' },
]

const PRICE_RANGES = [
  { id: '₹500-₹1000', label: '₹500 – ₹1,000', sub: 'Budget-friendly' },
  { id: '₹1000-₹2500', label: '₹1,000 – ₹2,500', sub: 'Mid-range' },
  { id: '₹2500-₹5000', label: '₹2,500 – ₹5,000', sub: 'Premium' },
  { id: '₹5000+', label: '₹5,000+', sub: 'Luxury' },
]

const STEPS = ['styles', 'colors', 'categories', 'fit', 'occasions', 'price']

const STEP_META = {
  styles: { title: 'What\'s your vibe?', sub: 'Select all that define you', emoji: '🎨' },
  colors: { title: 'Your Color Palette', sub: 'What colors do you reach for most?', emoji: '🎭' },
  categories: { title: 'What do you wear?', sub: 'Pick your go-to categories', emoji: '🛍️' },
  fit: { title: 'Your Preferred Fit', sub: 'How do you like your clothes to fit?', emoji: '📏' },
  occasions: { title: 'Where do you wear them?', sub: 'Select occasions you dress for', emoji: '✨' },
  price: { title: 'Your Budget Range', sub: 'How much do you usually spend per item?', emoji: '💰' },
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
const StepProgress = ({ current, total }) => (
  <div className="flex gap-1.5 justify-center mb-8">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className={`h-1 rounded-full transition-all duration-500 ${
          i <= current
            ? 'bg-atelier-dark w-8'
            : 'bg-atelier-lightgray/40 w-4'
        }`}
      />
    ))}
  </div>
)

// ─── Main Component ───────────────────────────────────────────────────────────
const StyleOnboarding = ({ onComplete, onSkip, initialValues }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [selections, setSelections] = useState({
    styles: initialValues?.styles || [],
    preferredColors: initialValues?.preferredColors || [],
    favoriteCategories: initialValues?.favoriteCategories || [],
    preferredFit: initialValues?.preferredFit || [],
    occasions: initialValues?.occasions || [],
    priceRange: initialValues?.priceRange || '',
  })

  const currentStep = STEPS[step]
  const meta = STEP_META[currentStep]

  const toggle = (field, value) => {
    setSelections(prev => {
      const arr = prev[field] || []
      return {
        ...prev,
        [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value],
      }
    })
  }

  const selectSingle = (field, value) => {
    setSelections(prev => ({ ...prev, [field]: value }))
  }

  const canProceed = () => {
    if (currentStep === 'styles') return selections.styles.length > 0
    if (currentStep === 'colors') return selections.preferredColors.length > 0
    if (currentStep === 'categories') return selections.favoriteCategories.length > 0
    if (currentStep === 'fit') return selections.preferredFit.length > 0
    if (currentStep === 'occasions') return selections.occasions.length > 0
    if (currentStep === 'price') return selections.priceRange !== ''
    return false
  }

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1)
  }

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1)
  }

  const handleSubmit = async () => {
    try {
      setSaving(true)
      const res = await api.put('users/style-profile', {
        styles: selections.styles,
        preferredColors: selections.preferredColors,
        favoriteCategories: selections.favoriteCategories,
        preferredFit: selections.preferredFit,
        occasions: selections.occasions,
        priceRange: selections.priceRange,
      })
      if (res.data.success) {
        dispatch(updateStyleProfile({ styleProfile: res.data.styleProfile }))
        if (onComplete) onComplete()
        else navigate('/')
      }
    } catch (err) {
      console.error('Failed to save style profile', err)
    } finally {
      setSaving(false)
    }
  }

  const isLast = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg mx-4 bg-atelier-beige border border-atelier-lightgray/60 shadow-2xl overflow-hidden">

        {/* Header glow strip */}
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-atelier-dark to-transparent" />

        <div className="p-8 sm:p-10">
          {/* Skip */}
          <button
            onClick={onSkip || (() => navigate('/'))}
            className="absolute top-5 right-5 text-[10px] font-mono uppercase tracking-widest text-atelier-gray hover:text-atelier-dark transition-colors"
          >
            Skip →
          </button>

          {/* Progress */}
          <StepProgress current={step} total={STEPS.length} />

          {/* Step Header */}
          <div className="text-center mb-8 space-y-2">
            <span className="text-3xl" role="img" aria-label={meta.title}>{meta.emoji}</span>
            <h1 className="font-serif text-2xl text-atelier-dark font-medium">{meta.title}</h1>
            <p className="text-xs font-mono uppercase tracking-widest text-atelier-gray">{meta.sub}</p>
          </div>

          {/* ── Step Content ─────────────────────────────────────────────── */}

          {/* STYLES */}
          {currentStep === 'styles' && (
            <div className="grid grid-cols-2 gap-3">
              {STYLE_OPTIONS.map(opt => {
                const selected = selections.styles.includes(opt.id)
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggle('styles', opt.id)}
                    className={`relative flex items-center gap-3 px-4 py-3.5 border text-left transition-all duration-200 ${
                      selected
                        ? 'border-atelier-dark bg-atelier-dark text-white'
                        : 'border-atelier-lightgray bg-atelier-cream/40 hover:border-atelier-dark/60 text-atelier-dark'
                    }`}
                  >
                    <span className="text-xl">{opt.emoji}</span>
                    <div>
                      <p className="text-xs font-mono font-semibold uppercase tracking-wider">{opt.label}</p>
                      <p className={`text-[10px] ${selected ? 'text-white/70' : 'text-atelier-gray'}`}>{opt.desc}</p>
                    </div>
                    {selected && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white" />
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* COLORS */}
          {currentStep === 'colors' && (
            <div className="grid grid-cols-4 gap-3">
              {COLOR_OPTIONS.map(opt => {
                const selected = selections.preferredColors.includes(opt.id)
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggle('preferredColors', opt.id)}
                    className={`flex flex-col items-center gap-2 p-3 border transition-all duration-200 ${
                      selected ? 'border-atelier-dark scale-105' : 'border-atelier-lightgray/40 hover:border-atelier-dark/40'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full border-2 ${opt.bg} ${opt.border} ${selected ? 'ring-2 ring-atelier-dark ring-offset-1' : ''}`} />
                    <span className="text-[9px] font-mono uppercase tracking-wider text-atelier-gray">{opt.label}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* CATEGORIES */}
          {currentStep === 'categories' && (
            <div className="grid grid-cols-2 gap-3">
              {CATEGORY_OPTIONS.map(opt => {
                const selected = selections.favoriteCategories.includes(opt.id)
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggle('favoriteCategories', opt.id)}
                    className={`flex items-center gap-3 px-4 py-3 border text-left transition-all duration-200 ${
                      selected
                        ? 'border-atelier-dark bg-atelier-dark text-white'
                        : 'border-atelier-lightgray bg-atelier-cream/40 hover:border-atelier-dark/60 text-atelier-dark'
                    }`}
                  >
                    <span className="text-lg">{opt.emoji}</span>
                    <span className="text-xs font-mono uppercase tracking-wider font-medium">{opt.label}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* FIT */}
          {currentStep === 'fit' && (
            <div className="grid grid-cols-2 gap-3">
              {FIT_OPTIONS.map(opt => {
                const selected = selections.preferredFit.includes(opt.id)
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggle('preferredFit', opt.id)}
                    className={`relative flex items-center gap-3 px-4 py-3.5 border text-left transition-all duration-200 ${
                      selected
                        ? 'border-atelier-dark bg-atelier-dark text-white'
                        : 'border-atelier-lightgray bg-atelier-cream/40 hover:border-atelier-dark/60 text-atelier-dark'
                    }`}
                  >
                    <span className="text-xl">{opt.emoji}</span>
                    <div>
                      <p className="text-xs font-mono font-semibold uppercase tracking-wider">{opt.label}</p>
                      <p className={`text-[10px] ${selected ? 'text-white/70' : 'text-atelier-gray'}`}>{opt.desc}</p>
                    </div>
                    {selected && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white" />
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* OCCASIONS */}
          {currentStep === 'occasions' && (
            <div className="grid grid-cols-2 gap-3">
              {OCCASION_OPTIONS.map(opt => {
                const selected = selections.occasions.includes(opt.id)
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggle('occasions', opt.id)}
                    className={`relative flex items-center gap-3 px-4 py-3.5 border text-left transition-all duration-200 ${
                      selected
                        ? 'border-atelier-dark bg-atelier-dark text-white'
                        : 'border-atelier-lightgray bg-atelier-cream/40 hover:border-atelier-dark/60 text-atelier-dark'
                    }`}
                  >
                    <span className="text-xl">{opt.emoji}</span>
                    <div>
                      <p className="text-xs font-mono font-semibold uppercase tracking-wider">{opt.label}</p>
                      <p className={`text-[10px] ${selected ? 'text-white/70' : 'text-atelier-gray'}`}>{opt.desc}</p>
                    </div>
                    {selected && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white" />
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* PRICE */}
          {currentStep === 'price' && (
            <div className="space-y-3">
              {PRICE_RANGES.map(opt => {
                const selected = selections.priceRange === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => selectSingle('priceRange', opt.id)}
                    className={`w-full flex items-center justify-between px-5 py-4 border text-left transition-all duration-200 ${
                      selected
                        ? 'border-atelier-dark bg-atelier-dark text-white'
                        : 'border-atelier-lightgray bg-atelier-cream/40 hover:border-atelier-dark/60 text-atelier-dark'
                    }`}
                  >
                    <div>
                      <p className="font-mono text-sm font-semibold tracking-wide">{opt.label}</p>
                      <p className={`text-[10px] font-mono uppercase tracking-wider ${selected ? 'text-white/60' : 'text-atelier-gray'}`}>{opt.sub}</p>
                    </div>
                    {selected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-white flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* ── Navigation ───────────────────────────────────────────────── */}
          <div className="mt-8 flex gap-3">
            {step > 0 && (
              <button
                onClick={handleBack}
                className="px-5 py-3 border border-atelier-lightgray font-mono text-xs uppercase tracking-widest text-atelier-dark hover:border-atelier-dark transition-colors"
              >
                ← Back
              </button>
            )}
            <button
              onClick={isLast ? handleSubmit : handleNext}
              disabled={!canProceed() || saving}
              className={`flex-1 py-3 font-mono text-xs uppercase tracking-widest transition-all duration-200 ${
                canProceed() && !saving
                  ? 'bg-atelier-dark text-white hover:opacity-90'
                  : 'bg-atelier-lightgray/30 text-atelier-gray cursor-not-allowed'
              }`}
            >
              {saving ? 'Creating your profile…' : isLast ? '✨ Build My Style Profile' : 'Next →'}
            </button>
          </div>
        </div>

        {/* Footer strip */}
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-atelier-lightgray to-transparent" />
      </div>
    </div>
  )
}

export default StyleOnboarding
