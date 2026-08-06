// Build responsive CDN URLs only for Cloudinary assets; external/fallback URLs stay untouched.
export const optimizeImage = (src, { width = 900, height, crop = 'fill' } = {}) => {
  if (!src || !src.includes('/upload/')) return src
  const transforms = [`f_auto`, `q_auto`, `w_${width}`, height ? `h_${height}` : null, height ? `c_${crop}` : null].filter(Boolean).join(',')
  return src.replace('/upload/', `/upload/${transforms}/`)
}
