// Heuristic-only mock classifier used to make the prototype feel alive.
// This is NOT a real ML model — the production app would call the IndoBERT
// service. Kept deterministic so the same review always yields the same label.

export type ReviewLabel = 'genuine' | 'suspicious' | 'fake'

/**
 * Result returned by the real consistency-detector API (camelCased from the
 * snake_case payload). Present on a Review only when it was analyzed by the API
 * rather than the local heuristic.
 */
export interface SentimentAnalysis {
  predictedSentiment: string
  ratingSentiment: string
  isConsistent: boolean
  explanation: string
}

export interface Review {
  id: number
  username: string
  rating: number
  text: string
  product: string
  date: string
  /** Set when the review was scored by the API instead of the heuristic. */
  analysis?: SentimentAnalysis
}

export interface Batch {
  id: string
  marketplace: string
  category: string
  count: number
  fakePct: string
  date: string
  /** Origin of the data: 'Upload CSV' | 'Input manual' | 'Scrape API'. */
  source: string
  /** Classification model used for this batch. */
  model: string
  /** Who created the batch (no auth in the prototype — stamped from a constant). */
  createdBy: string
  /** Human-readable timestamp when the batch was created. */
  createdAt: string
  /** Human-readable timestamp when classification finished. */
  processedAt: string
  selected?: boolean
}

export interface Classification {
  label: ReviewLabel
  /**
   * Model probability for the chosen label, as a percentage (0–100).
   * `null` for API-analyzed reviews — the consistency API returns no score.
   */
  confidence: number | null
}

export type ClassifiedReview = Review & Classification

/**
 * Map an API consistency result onto the three-way UI label:
 * consistent → genuine; an inconsistent negative review with a high rating
 * (the classic manipulated review) → fake; any other mismatch → suspicious.
 */
export function labelFromAnalysis(a: SentimentAnalysis, rating: number): ReviewLabel {
  if (a.isConsistent) return 'genuine'
  if (a.predictedSentiment.toLowerCase() === 'negative' && rating >= 4) return 'fake'
  return 'suspicious'
}

/** Classify a review via the API result if present, otherwise the heuristic. */
export function classifyReview(r: Review): Classification {
  if (r.analysis) {
    return { label: labelFromAnalysis(r.analysis, r.rating), confidence: null }
  }
  return classify(r.text, r.rating)
}

const FAKE_MARKERS = [
  'mantap', 'joss', 'recommended seller', 'barang ori', 'pengiriman cepat',
  'the best', 'no tipu', 'amazing', 'wajib beli', 'kerennn', '5 bintang',
  'tidak mengecewakan', 'produk istimewa', 'fast respon', 'kualitas premium',
]

export function classify(text: string, rating: number): Classification {
  const t = (text || '').toLowerCase()
  const len = t.replace(/\s+/g, ' ').trim().length
  let score = 0

  // Very short + high rating reads as suspicious.
  if (rating >= 5 && len < 25) score += 0.45
  if (rating >= 5 && len < 60) score += 0.15

  // Marketing / spam marker words.
  let hits = 0
  for (const m of FAKE_MARKERS) if (t.includes(m)) hits++
  score += Math.min(0.4, hits * 0.12)

  // Many exclamation marks.
  const exclamations = (t.match(/!/g) || []).length
  if (exclamations >= 3) score += 0.1

  // Repeated characters (mantappp, baguss).
  if (/(\w)\1{2,}/.test(t)) score += 0.08

  // Contradiction: low rating paired with overly positive markers.
  if (rating <= 2 && hits >= 1) score += 0.2

  // Long, specific reviews tend to be genuine.
  if (len > 140) score -= 0.2
  if (/(setelah|pemakaian|hari|minggu|bulan|sebelumnya|dibanding)/i.test(t)) score -= 0.12

  score = Math.max(0.02, Math.min(0.98, score + 0.05))

  let label: ReviewLabel
  let conf: number
  if (score >= 0.65) {
    label = 'fake'
    conf = score
  } else if (score >= 0.4) {
    label = 'suspicious'
    conf = 1 - Math.abs(0.5 - score)
  } else {
    label = 'genuine'
    conf = 1 - score
  }

  return { label, confidence: Math.round(conf * 1000) / 10 }
}

export function suggestionFor(label: ReviewLabel, rating: number): string {
  if (label === 'fake') return 'Tandai & sembunyikan dari listing; tinjau riwayat akun.'
  if (label === 'suspicious') return 'Minta verifikasi pembelian; pantau review lain dari user yang sama.'
  if (rating <= 2) return 'Eskalasi ke tim CS untuk follow-up keluhan.'
  return 'Tampilkan normal; review terlihat otentik.'
}

export interface LabelMeta {
  text: string
  dot: string
  badge: string
  bar: string
}

export const LABEL_META: Record<ReviewLabel, LabelMeta> = {
  genuine: {
    text: 'Genuine',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700',
    bar: 'bg-emerald-500',
  },
  suspicious: {
    text: 'Suspicious',
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700',
    bar: 'bg-amber-500',
  },
  fake: {
    text: 'Fake',
    dot: 'bg-rose-500',
    badge: 'bg-rose-50 text-rose-700',
    bar: 'bg-rose-500',
  },
}

const AVATAR_PALETTE = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-purple-100 text-purple-700',
  'bg-slate-100 text-slate-600',
]

export function avatarClass(name: string): string {
  const hash = [...name].reduce((a, c) => a + c.charCodeAt(0), 0)
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length]
}

export function avatarInitials(name: string): string {
  return name.slice(0, 2).toUpperCase()
}

/** Indonesian-style percentage: one decimal place, comma separator. */
export function pctID(n: number): string {
  return n.toFixed(1).replace('.', ',') + '%'
}
