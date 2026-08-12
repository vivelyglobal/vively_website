import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { ObjectId } from 'mongodb'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES = '7d'

export interface TokenPayload {
  _id: ObjectId | string
  email: string
  role?: string
}

export function generateToken(_id: ObjectId | string, email: string, role = 'user'): string {
  return jwt.sign({ _id, email, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload
    return decoded
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null
  const parts = authHeader.split(' ')
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1]
  }
  return null
}

export function requireAuth(token: string | null): TokenPayload | null {
  if (!token) return null
  return verifyToken(token)
}
