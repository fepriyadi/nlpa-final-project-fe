import type { AxiosResponse } from 'axios'
import instance from './http'
import type { GetMeResponse } from '@/types/auth'

export const getMe = async (): Promise<AxiosResponse<GetMeResponse>> => {
  const res: AxiosResponse<GetMeResponse> = await instance.get('/api/v1/auth/me')
  return res
}
