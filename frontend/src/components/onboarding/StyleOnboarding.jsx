import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { updateStyleProfile } from '../../features/auth/authSlice'
import api from '../../services/axiosInstance'

const STYLE_OPTIONS = [
  { id: 'streetwear', label: 'Streetwear', desc: 'Bold urban fits' },
  { id: 'minimal', label: 'Minimal', desc: 'Clean & refined' },
  { id: 'casual', label: 'Casual', desc: 'Everyday comfort' },
  { id: 'y2k', label: 'Y2K', desc: 'Early 2000s revival' },
  { id: 'oversized', label: 'Oversized', desc: 'Relaxed & boxy' },
  { id: 'athleisure', label: 'Athleisure', desc: 'Sport meets style' },
]

const COLOR_OPTIONS = [
  { id: 'black',  label: 'Black',  hex: '#111111' },
  { id: 'white',  label: 'White',  hex: '#F5F2EB', border: true },
  { id: 'beige',  label: 'Beige',  hex: '#C8B9A2' },
  { id: 'navy',   label: 'Navy',   hex: '#1E2D4A' },
  { id: 'grey',   label: 'Grey',   hex: '#9B9B9B' },
  { id: 'olive',  label: 'Olive',  hex: '#6B6B3A' },
  { id: 'brown',  label: 'Brown',  hex: '#7A4E2D' },
  { id: 'red',    label: 'Red',    hex: '#B33A3A' },
]

const CATEGORY_OPTIONS = [
  { id: 'hoodies',     label: 'Hoodies' },
  { id: 'tshirts',     label: 'T-Shirts' },
  { id: 'cargo',       label: 'Cargo' },
  { id: 'sneakers',    label: 'Sneakers' },
  { id: 'joggers',     label: 'Joggers' },
  { id: 'jackets',     label: 'Jackets' },
  { id: 'accessories', label: 'Accessories' },
  { id: 'denim',       label: 'Denim' },
]

const FIT_OPTIONS = [
  { id: 'slim',     label: 'Slim Fit',     desc: 'Tailored & close-fitting' },
  { id: 'regular',  label: 'Regular Fit',  desc: 'Standard classic cut' },
  { id: 'relaxed',  label: 'Relaxed Fit',  desc: 'Comfortable & loose' },
  { id: 'oversized',label: 'Oversized Fit',desc: 'Extra baggy & boxy' },
]

const OCCASION_OPTIONS = [
  { id: 'casual',  label: 'Casual',           desc: 'Everyday outings' },
  { id: 'party',   label: 'Party / Night Out', desc: 'Statement fits' },
  { id: 'work',    label: 'Smart Casual',      desc: 'Polished & sharp' },
  { id: 'sport',   label: 'Active / Sport',    desc: 'Performance wear' },
  { id: 'lounge',  label: 'Lounge',            desc: 'Comfort first' },
  { id: 'formal',  label: 'Formal',            desc: 'Dressed to impress' },
]

const PRICE_RANGES = [
  { id: '₹500-₹1000',  label: '₹500 – ₹1,000',  sub: 'Budget-friendly' },
  { id: '₹1000-₹2500', label: '₹1,000 – ₹2,500', sub: 'Mid-range' },
  { id: '₹2500-₹5000', label: '₹2,500 – ₹5,000', sub: 'Premium' },
  { id: '₹5000+',      label: '₹5,000+',          sub: 'Luxury' },
]

const STEPS = ['styles', 'colors', 'categories', 'fit', 'occasions', 'price']

const STEP_META = {
  styles:     { step: '01', title: "What's your vibe?",          sub: 'Select all that define your aesthetic' },
  colors:     { step: '02', title: 'Your Color Palette',          sub: 'Colors you reach for most' },
  categories: { step: '03', title: 'What do you wear?',           sub: 'Pick your go-to categories' },
  fit:        { step: '04', title: 'Your Preferred Fit',           sub: 'How you like your clothes to sit' },
  occasions:  { step: '05', title: 'Where do you wear it?',       sub: 'Occasions you dress for' },
  price:      { step: '06', title: 'Your Budget Range',            sub: 'Spend per item, typically' },
}

const StyleOnboarding = ({ onComplete, onSkip, initialValues }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [selections, setSelections] = useState({
    styles:             initialValues?.styles || [],
    preferredColors:    initialValues?.preferredColors || [],
    favoriteCategories: initialValues?.favoriteCategories || [],
    preferredFit:       initialValues?.preferredFit || [],
    occasions:          initialValues?.occasions || [],
    priceRange:         initialValues?.priceRange || '',
  })

  const currentStep = STEPS[step]
  const meta = STEP_META[currentStep]
  const isLast = step === STEPS.length - 1

  const toggle = (field, value) => {
    setSelections(prev => {
      const arr = prev[field] || []
      return { ...prev, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] }
    })
  }

  const selectSingle = (field, value) => setSelections(prev => ({ ...prev, [field]: value }))

  const canProceed = () => {
    if (currentStep === 'styles')     return selections.styles.length > 0
    if (currentStep === 'colors')     return selections.preferredColors.length > 0
    if (currentStep === 'categories') return selections.favoriteCategories.length > 0
    if (currentStep === 'fit')        return selections.preferredFit.length > 0
    if (currentStep === 'occasions')  return selections.occasions.length > 0
    if (currentStep === 'price')      return selections.priceRange !== ''
    return false
  }

  const handleClose = () => { if (onSkip) onSkip(); else navigate('/') }
  const handleNext = () => { if (step < STEPS.length - 1) setStep(s => s + 1) }
  const handleBack = () => { if (step > 0) setStep(s => s - 1) }

  const handleSubmit = async () => {
    try {
      setSaving(true)
      const res = await api.put('users/style-profile', {
        styles:             selections.styles,
        preferredColors:    selections.preferredColors,
        favoriteCategories: selections.favoriteCategories,
        preferredFit:       selections.preferredFit,
        occasions:          selections.occasions,
        priceRange:         selections.priceRange,
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

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-[#111111]/90 backdrop-blur-sm animate-fade-in px-4"
      onClick={handleClose}
    >
      <div className="relative w-full max-w-xl bg-[#F5F2EB] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Top progress rail */}
        <div className="flex h-[2px] w-full bg-[#E5E2DA]">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="flex-1 transition-all duration-500"
              style={{ background: i <= step ? '#111111' : 'transparent' }}
            />
          ))}
        </div>

        <div className="px-10 pt-10 pb-8">

          {/* Step label + close */}
          <div className="flex items-center justify-between mb-8">
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#9B9B9B]">
              Step {meta.step} / 06
            </span>
            <button
              onClick={handleClose}
              aria-label="Close"
              className="flex items-center justify-center w-7 h-7 border border-[#E5E2DA] text-[#9B9B9B] hover:border-[#111111] hover:text-[#111111] transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Step header */}
          <div className="mb-8">
            <h2 className="font-serif text-3xl text-[#111111] font-medium leading-tight mb-1">
              {meta.title}
            </h2>
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#9B9B9B]">
              {meta.sub}
            </p>
          </div>

          {/* ── STYLES ─────────────────────────────────────── */}
          {currentStep === 'styles' && (
            <div className="grid grid-cols-2 gap-2">
              {STYLE_OPTIONS.map(opt => {
                const sel = selections.styles.includes(opt.id)
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggle('styles', opt.id)}
                    className={`group relative px-5 py-4 border text-left transition-all duration-150 ${
                      sel
                        ? 'border-[#111111] bg-[#111111]'
                        : 'border-[#E5E2DA] bg-transparent hover:border-[#111111]'
                    }`}
                  >
                    <p className={`font-mono text-xs font-semibold tracking-[0.12em] uppercase mb-0.5 ${sel ? 'text-white' : 'text-[#111111]'}`}>
                      {opt.label}
                    </p>
                    <p className={`font-sans text-[10px] ${sel ? 'text-white/60' : 'text-[#9B9B9B]'}`}>
                      {opt.desc}
                    </p>
                    {sel && <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-white/80" />}
                  </button>
                )
              })}
            </div>
          )}

          {/* ── COLORS ─────────────────────────────────────── */}
          {currentStep === 'colors' && (
            <div className="grid grid-cols-4 gap-2">
              {COLOR_OPTIONS.map(opt => {
                const sel = selections.preferredColors.includes(opt.id)
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggle('preferredColors', opt.id)}
                    className={`flex flex-col items-center gap-2.5 py-4 border transition-all duration-150 ${
                      sel ? 'border-[#111111]' : 'border-[#E5E2DA] hover:border-[#111111]'
                    }`}
                  >
                    <div
                      className="w-8 h-8"
                      style={{
                        background: opt.hex,
                        outline: sel ? '2px solid #111111' : opt.border ? '1px solid #E5E2DA' : 'none',
                        outlineOffset: sel ? '2px' : '0',
                      }}
                    />
                    <span className="font-mono text-[9px] tracking-widest uppercase text-[#706E6B]">
                      {opt.label}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* ── CATEGORIES ─────────────────────────────────── */}
          {currentStep === 'categories' && (
            <div className="grid grid-cols-2 gap-2">
              {CATEGORY_OPTIONS.map(opt => {
                const sel = selections.favoriteCategories.includes(opt.id)
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggle('favoriteCategories', opt.id)}
                    className={`px-5 py-3.5 border text-left transition-all duration-150 ${
                      sel
                        ? 'border-[#111111] bg-[#111111]'
                        : 'border-[#E5E2DA] hover:border-[#111111]'
                    }`}
                  >
                    <span className={`font-mono text-xs tracking-[0.12em] uppercase font-semibold ${sel ? 'text-white' : 'text-[#111111]'}`}>
                      {opt.label}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          {/* ── FIT ────────────────────────────────────────── */}
          {currentStep === 'fit' && (
            <div className="grid grid-cols-2 gap-2">
              {FIT_OPTIONS.map(opt => {
                const sel = selections.preferredFit.includes(opt.id)
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggle('preferredFit', opt.id)}
                    className={`relative px-5 py-4 border text-left transition-all duration-150 ${
                      sel
                        ? 'border-[#111111] bg-[#111111]'
                        : 'border-[#E5E2DA] hover:border-[#111111]'
                    }`}
                  >
                    <p className={`font-mono text-xs font-semibold tracking-[0.12em] uppercase mb-0.5 ${sel ? 'text-white' : 'text-[#111111]'}`}>
                      {opt.label}
                    </p>
                    <p className={`font-sans text-[10px] ${sel ? 'text-white/60' : 'text-[#9B9B9B]'}`}>
                      {opt.desc}
                    </p>
                    {sel && <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-white/80" />}
                  </button>
                )
              })}
            </div>
          )}

          {/* ── OCCASIONS ──────────────────────────────────── */}
          {currentStep === 'occasions' && (
            <div className="grid grid-cols-2 gap-2">
              {OCCASION_OPTIONS.map(opt => {
                const sel = selections.occasions.includes(opt.id)
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggle('occasions', opt.id)}
                    className={`relative px-5 py-4 border text-left transition-all duration-150 ${
                      sel
                        ? 'border-[#111111] bg-[#111111]'
                        : 'border-[#E5E2DA] hover:border-[#111111]'
                    }`}
                  >
                    <p className={`font-mono text-xs font-semibold tracking-[0.12em] uppercase mb-0.5 ${sel ? 'text-white' : 'text-[#111111]'}`}>
                      {opt.label}
                    </p>
                    <p className={`font-sans text-[10px] ${sel ? 'text-white/60' : 'text-[#9B9B9B]'}`}>
                      {opt.desc}
                    </p>
                    {sel && <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-white/80" />}
                  </button>
                )
              })}
            </div>
          )}

          {/* ── PRICE ──────────────────────────────────────── */}
          {currentStep === 'price' && (
            <div className="space-y-2">
              {PRICE_RANGES.map(opt => {
                const sel = selections.priceRange === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => selectSingle('priceRange', opt.id)}
                    className={`w-full flex items-center justify-between px-5 py-4 border text-left transition-all duration-150 ${
                      sel
                        ? 'border-[#111111] bg-[#111111]'
                        : 'border-[#E5E2DA] hover:border-[#111111]'
                    }`}
                  >
                    <div>
                      <p className={`font-mono text-sm font-semibold tracking-wide ${sel ? 'text-white' : 'text-[#111111]'}`}>
                        {opt.label}
                      </p>
                      <p className={`font-mono text-[9px] tracking-widest uppercase mt-0.5 ${sel ? 'text-white/50' : 'text-[#9B9B9B]'}`}>
                        {opt.sub}
                      </p>
                    </div>
                    {sel && <span className="w-2 h-2 rounded-full bg-white flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
          )}

          {/* ── Navigation ─────────────────────────────────── */}
          <div className="mt-8 flex gap-2">
            {step > 0 && (
              <button
                onClick={handleBack}
                className="px-6 py-3.5 border border-[#E5E2DA] font-mono text-[10px] tracking-[0.2em] uppercase text-[#706E6B] hover:border-[#111111] hover:text-[#111111] transition-colors"
              >
                ← Back
              </button>
            )}
            <button
              onClick={isLast ? handleSubmit : handleNext}
              disabled={!canProceed() || saving}
              className={`flex-1 py-3.5 font-mono text-[10px] tracking-[0.2em] uppercase transition-all duration-200 ${
                canProceed() && !saving
                  ? 'bg-[#111111] text-white hover:bg-[#2a2a2a]'
                  : 'bg-[#E5E2DA] text-[#9B9B9B] cursor-not-allowed'
              }`}
            >
              {saving ? 'Saving…' : isLast ? 'Build My Style Profile' : 'Continue →'}
            </button>
          </div>
        </div>

        {/* Bottom border line */}
        <div className="h-px w-full bg-[#E5E2DA]" />
      </div>
    </div>
  )
}

export default StyleOnboarding
