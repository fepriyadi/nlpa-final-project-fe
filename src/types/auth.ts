import type { ResponseEnvelope } from './calculator'

export type Role =
  | 'bod'
  | 'hsp'
  | 'sp'
  | 'hmp'
  | 'mp'
  | 'sbu'

export type Department = 'sales' | 'marketing' | 'finance'

export interface UserPublic {
  id: string
  username: string
  email: string
  fullName: string
  role: Role
  department: Department
  isActive: boolean
}

export interface UserPermissions {
  role: Role
  pricingTier: number
  canInterruptPricing: boolean
  canApproveDeviation: boolean
}

export interface UserProfile {
  user: UserPublic
  permissions: UserPermissions
}

export type GetMeResponse = ResponseEnvelope<UserProfile>
