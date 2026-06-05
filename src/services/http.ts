import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import applyCaseMiddleware from 'axios-case-converter'
import { errorMessages } from './error'
import { toast } from 'vue-sonner'

// Instance with case middleware (untuk most endpoints)
const instance: AxiosInstance = applyCaseMiddleware(
  axios.create({
    baseURL: import.meta.env.VITE_BASE_API || '__VITE_BASE_API__'
  })
)

// Instance tanpa middleware (untuk endpoints yang butuh raw data like getCorporateData)
const instanceRaw: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_API || '__VITE_BASE_API__'
})

let refreshTokenPromise: Promise<string> | null = null

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

const clearAuthAndRedirect = () => {
  localStorage.clear()
  if (window.location.pathname !== '/home') {
    window.location.href = '/home'
  }
}

const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) {
    throw new Error('Missing refresh token')
  }

  const baseURL = (import.meta.env.VITE_BASE_API || '__VITE_BASE_API__').replace(/\/+$/, '')
  const { data } = await axios.post(
    `${baseURL}/api/v1/auth/refresh`,
    // eslint-disable-next-line camelcase
    { refresh_token: refreshToken },
    { headers: { 'ngrok-skip-browser-warning': 'true' } }
  )

  const accessToken = data.access_token ?? data.accessToken
  const newRefreshToken = data.refresh_token ?? data.refreshToken

  if (!accessToken || !newRefreshToken) {
    throw new Error('Malformed refresh response')
  }

  localStorage.setItem('token', accessToken)
  localStorage.setItem('refreshToken', newRefreshToken)

  return accessToken
}

const getNewAccessToken = async (): Promise<string> => {
  if (!refreshTokenPromise) {
    refreshTokenPromise = refreshAccessToken().finally(() => {
      refreshTokenPromise = null
    })
  }

  return refreshTokenPromise
}

const isAuthExpiredError = (error: unknown) => {
  const axiosError = error as {
    response?: { status?: number; data?: { code?: string; message?: string; status?: { message?: string } } }
  }
  const status = axiosError.response?.status
  const code = axiosError.response?.data?.code

  return (
    status === 401 ||
    status === 403 ||
    code === 'INVALID_TOKEN' ||
    code === 'TOKEN_EXPIRED'
  )
}

const attachInterceptors = (client: AxiosInstance) => {
  client.interceptors.request.use(
    (config) => {
      config.headers['ngrok-skip-browser-warning'] = 'true'

      const token = localStorage.getItem('token')

      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`
      }

      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  client.interceptors.response.use(
    (response) => {
      return response
    },
    async (error) => {
      const response = error.response
      const message: string | undefined = response?.data?.message ?? response?.data?.status?.message
      const originalRequest = error.config as RetryableRequestConfig | undefined

      if (isAuthExpiredError(error) && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true

        try {
          const newAccessToken = await getNewAccessToken()
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          return client(originalRequest)
        } catch {
          clearAuthAndRedirect()
          return Promise.reject(error)
        }
      }

      if (isAuthExpiredError(error)) {
        clearAuthAndRedirect()
        return Promise.reject(error)
      }

      if (error.config?.method !== 'get' && message) {
        toast.error(errorMessages(message))
      }

      return Promise.reject(error)
    }
  )
}

attachInterceptors(instance)
attachInterceptors(instanceRaw)

export default instance
export { instanceRaw }