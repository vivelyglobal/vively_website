// Campaign types
export interface Campaign {
  _id: string
  title: string
  brand: string
  category: string
  description: string
  guidelines: string[]
  targetAudience: string[]
  budget: string
  spots: number
  imageUrl: string
  status: 'active' | 'closed' | 'draft'
  applicants: string[]
  createdAt: string
  updatedAt: string
}

// Application types
export interface Application {
  _id: string
  campaignId: string
  userId: string
  name: string
  email: string
  instagram?: string
  message?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

// User types
export interface User {
  _id: string
  email: string
  name: string
  password?: string
  role: 'user' | 'admin'
  createdAt: string
}

// Auth types
export interface AuthToken {
  token: string
  user: User
}

export interface AuthError {
  message: string
  code?: string
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}
