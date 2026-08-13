import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { updateMeasurements } from '../../features/auth/authSlice'
import api from '../../services/axiosInstance'

/* ── Local size engine (mirrors the backend, runs instantly) ─────────────── */
const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']

const computeRecommendation = ({ height, weight, usualSize, preferredFit }) => {
  if (!height || !weight || !usualSize) return null
  const bmi = weight / ((height / 100) ** 2)
  let baseIdx =
    bmi < 17.5 ? 0 : bmi < 19 ? 1 : bmi < 22 ? 2 : bmi < 25 ? 3 : bmi < 29 ? 4 : bmi < 33 ? 5 : 6
  const usualIdx = SIZE_ORDER.indexOf((usualSize || '').toUpperCase())
  let idx = usualIdx !== -1 ? Math.round((baseIdx + usualIdx) / 2) : baseIdx
  const fit = (preferredFit || '').toLowerCase()
  if (fit === 'oversized' && idx < SIZE_ORDER.length - 1) idx++
  if (fit === 'slim'      && idx > 0)                     idx--
  idx = Math.max(0, Math.min(SIZE_ORDER.length - 1, idx))
  return SIZE_ORDER[idx]
}

/* ── Constants ────────────────────────────────────────────────────────────── */
const FIT_OPTIONS = ['Slim', 'Regular', 'Relaxed', 'Oversized']
const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']

export default function SizeRecommender({ availableSizes = [], onRecommend }) {
  const dispatch  = useDispatch()
  const { user, isAuthenticated } = useSelector(s => s.auth)

  // Pre-fill from saved measurements
  const saved = user?.measurements || {}
  const [open,   setOpen]   = useState(false)
  const [height, setHeight] = useState(saved.height  || '')
  const [weight, setWeight] = useState(saved.weight  || '')
  const [size,   setSize]   = useState(saved.usualSize   || '')
  const [fit,    setFit]    = useState(saved.preferredFit || '')
  const [result, setResult] = useState(null)
  const [saving, setSaving] = useState(false)

  // Auto-show result if measurements already saved
  useEffect(() => {
    if (saved.height && saved.weight && saved.usualSize) {
      const rec = computeRecommendation({
        height: saved.height, weight: saved.weight,
        usualSize: saved.usualSize, preferredFit: saved.preferredFit,
      })
      setResult(rec)
      if (rec && onRecommend) onRecommend(rec)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const canCompute = height && weight && size

  const handleCompute = async () => {
    const rec = computeRecommendation({ height: Number(height), weight: Number(weight), usualSize: size, preferredFit: fit })
    setResult(rec)
    if (rec && onRecommend) onRecommend(rec)

    // Persist if logged in
    if (isAuthenticated) {
      try {
        setSaving(true)
        const res = await api.put('users/measurements', {
          height: Number(height), weight: Number(weight),
          usualSize: size, preferredFit: fit,
        })
        if (res.data.success) dispatch(updateMeasurements({ measurements: res.data.measurements }))
      } catch (_) {/* silent */} finally { setSaving(false) }
    }
  }

  // Is the recommended size actually available?
  const isAvailable = result && (
    availableSizes.length === 0 ||
    availableSizes.map(s => s.toUpperCase()).includes(result.toUpperCase())
  )

  return (
    <div className="border-t border-[#E5E2DA] pt-4">
      {/* Trigger row */}
      <button
        id="size-recommender-trigger"
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-[11px] font-mono tracking-[0.18em] uppercase text-[#706E6B] hover:text-[#111111] transition-colors"
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="6.5" cy="6.5" r="5.75" stroke="currentColor" strokeWidth="1"/>
          <path d="M6.5 5.5v3M6.5 4.2v.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        {result ? `AI Recommends ${result} — adjust` : 'Find My Size with AI'}
      </button>

      {/* Inline result pill (before expanding form) */}
      {result && !open && (
        <div className="mt-3 flex items-start gap-3">
          <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center border font-mono text-sm font-bold tracking-wider ${
            isAvailable ? 'border-[#111111] bg-[#111111] text-white' : 'border-[#E5E2DA] bg-[#E5E2DA] text-[#9B9B9B]'
          }`}>
            {result}
          </div>
          <div>
            <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-[#111111] font-semibold">
              {isAvailable ? 'Recommended for you' : 'Not available in this product'}
            </p>
            <p className="font-sans text-[11px] text-[#706E6B] mt-0.5 max-w-xs">
              We recommend {result} based on your measurements. This is a guide, not a guarantee.
            </p>
          </div>
        </div>
      )}

      {/* Expandable form */}
      {open && (
        <div className="mt-4 bg-[#FAF8F5] border border-[#E5E2DA] p-5 space-y-5">
          {/* Height + Weight */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[9px] tracking-[0.2em] uppercase text-[#9B9B9B] mb-1.5">
                Height (cm)
              </label>
              <input
                id="sr-height"
                type="number"
                min="100" max="230"
                value={height}
                onChange={e => setHeight(e.target.value)}
                placeholder="175"
                className="w-full h-10 px-3 border border-[#E5E2DA] bg-white font-mono text-sm text-[#111111] placeholder-[#C8C5BC] focus:outline-none focus:border-[#111111] transition-colors"
              />
            </div>
            <div>
              <label className="block font-mono text-[9px] tracking-[0.2em] uppercase text-[#9B9B9B] mb-1.5">
                Weight (kg)
              </label>
              <input
                id="sr-weight"
                type="number"
                min="30" max="200"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                placeholder="68"
                className="w-full h-10 px-3 border border-[#E5E2DA] bg-white font-mono text-sm text-[#111111] placeholder-[#C8C5BC] focus:outline-none focus:border-[#111111] transition-colors"
              />
            </div>
          </div>

          {/* Usual Size */}
          <div>
            <label className="block font-mono text-[9px] tracking-[0.2em] uppercase text-[#9B9B9B] mb-1.5">
              Your Usual Size
            </label>
            <div className="flex flex-wrap gap-2">
              {SIZE_OPTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={`px-3 py-2 border font-mono text-xs tracking-wider min-w-[2.5rem] text-center transition-all duration-150 ${
                    size === s
                      ? 'border-[#111111] bg-[#111111] text-white'
                      : 'border-[#E5E2DA] text-[#111111] hover:border-[#111111]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Fit */}
          <div>
            <label className="block font-mono text-[9px] tracking-[0.2em] uppercase text-[#9B9B9B] mb-1.5">
              Preferred Fit <span className="text-[#C8C5BC]">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {FIT_OPTIONS.map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFit(prev => prev.toLowerCase() === f.toLowerCase() ? '' : f.toLowerCase())}
                  className={`px-3 py-2 border font-mono text-xs tracking-wider transition-all duration-150 ${
                    fit.toLowerCase() === f.toLowerCase()
                      ? 'border-[#111111] bg-[#111111] text-white'
                      : 'border-[#E5E2DA] text-[#111111] hover:border-[#111111]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            id="sr-compute"
            type="button"
            onClick={handleCompute}
            disabled={!canCompute || saving}
            className={`w-full py-3 font-mono text-[10px] tracking-[0.2em] uppercase transition-all duration-200 ${
              canCompute && !saving
                ? 'bg-[#111111] text-white hover:bg-[#2a2a2a]'
                : 'bg-[#E5E2DA] text-[#9B9B9B] cursor-not-allowed'
            }`}
          >
            {saving ? 'Saving…' : 'Get My Size Recommendation →'}
          </button>

          {/* Result inside form */}
          {result && (
            <div className="border-t border-[#E5E2DA] pt-4 flex items-start gap-3">
              <div className={`flex-shrink-0 w-12 h-12 flex items-center justify-center border font-mono text-base font-bold tracking-wider ${
                isAvailable ? 'border-[#111111] bg-[#111111] text-white' : 'border-[#E5E2DA] bg-[#E5E2DA] text-[#9B9B9B]'
              }`}>
                {result}
              </div>
              <div>
                <p className="font-mono text-[10px] tracking-[0.15em] uppercase font-semibold text-[#111111]">
                  {isAvailable ? 'We recommend ' + result : result + ' — Not available'}
                </p>
                <p className="font-sans text-[11px] text-[#706E6B] mt-1 max-w-xs leading-relaxed">
                  Based on your measurements ({height} cm, {weight} kg)
                  {fit ? ` and a ${fit} fit preference` : ''}.
                  This is a recommendation, not a guarantee.
                </p>
                {!isAuthenticated && (
                  <p className="font-mono text-[9px] tracking-wider uppercase text-[#C8C5BC] mt-2">
                    Sign in to save your measurements
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Close */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="font-mono text-[9px] tracking-[0.2em] uppercase text-[#9B9B9B] hover:text-[#111111] transition-colors"
          >
            ← Collapse
          </button>
        </div>
      )}
    </div>
  )
}
