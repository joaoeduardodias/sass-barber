export interface ApiResponse<T = unknown> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface ApiError {
  error: string
  message: string
  statusCode: number
}

export type UserRole = 'ADMIN' | 'OWNER' | 'BARBER' | 'CUSTOMER'

export * from './schemas/barbershop'
export * from './schemas/service'
export * from './schemas/barber'
export * from './schemas/appointment'

export interface Barbershop {
  id: string
  name: string
  slug: string
  description: string | null
  address: string
  phone: string
  logoUrl: string | null
  ownerId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}
