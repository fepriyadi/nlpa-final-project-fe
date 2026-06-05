import { instanceRaw } from './http'

// The Review Consistency Detector API judges whether a review's text sentiment
// is consistent with its star rating. Responses use snake_case; we hit them via
// `instanceRaw` (no case middleware) so the payload — and FormData uploads —
// pass through untouched.

export interface ModelsResponse {
  default_model: string
  allowed_models: string[]
}

export interface AnalyzeResult {
  predicted_sentiment: string
  rating_sentiment: string
  is_consistent: boolean
  explanation: string
}

export interface BulkResponse {
  total_rows: number
  results: AnalyzeResult[]
}

export interface AnalyzePayload {
  review_text: string
  rating: number
  model?: string
}

/** GET /models — allowed OpenRouter models + the default. */
export async function getModels(): Promise<ModelsResponse> {
  const { data } = await instanceRaw.get<ModelsResponse>('/models')
  return data
}

/** POST /analyze — analyze a single review. */
export async function analyzeOne(payload: AnalyzePayload): Promise<AnalyzeResult> {
  const { data } = await instanceRaw.post<AnalyzeResult>('/analyze', payload)
  return data
}

/** POST /analyze-bulk — upload a CSV (review_text, rating columns) and analyze every row. */
export async function analyzeBulk(file: File, model?: string): Promise<BulkResponse> {
  const form = new FormData()
  form.append('file', file)
  if (model) form.append('model', model)
  const { data } = await instanceRaw.post<BulkResponse>('/analyze-bulk', form)
  return data
}
