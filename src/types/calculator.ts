export interface ResponseEnvelope<T> {
  data: T
  message?: string
  status?: string
}
