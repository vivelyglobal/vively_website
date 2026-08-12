import { Handler } from '@netlify/functions'
import { getUsersCollection } from './db'
import { generateToken, hashPassword, comparePassword } from './auth'

interface LoginRequest {
  email: string
  password: string
  name?: string
  action: 'login' | 'register'
}

interface LoginResponse {
  message: string
  token: string
  user: {
    _id: string
    email: string
    name: string
    role: string
  }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  try {
    const body: LoginRequest = JSON.parse(event.body || '{}')
    const { action, email, password, name } = body

    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Email and password required' }),
      }
    }

    const users = await getUsersCollection()

    // REGISTER
    if (action === 'register') {
      const existing = await users.findOne({ email })
      if (existing) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Email already registered' }),
        }
      }

      const passwordHash = await hashPassword(password)
      const user = {
        email,
        name: name || email.split('@')[0],
        passwordHash,
        role: 'user',
        createdAt: new Date(),
      }

      const result = await users.insertOne(user)
      const token = generateToken(result.insertedId, email, 'user')

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'User registered successfully',
          token,
          user: {
            _id: result.insertedId.toString(),
            email,
            name: user.name,
            role: 'user',
          },
        } as LoginResponse),
      }
    }

    // LOGIN
    if (action === 'login') {
      const user = await users.findOne({ email })
      if (!user) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: 'Invalid email or password' }),
        }
      }

      const validPassword = await comparePassword(password, user.passwordHash)
      if (!validPassword) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: 'Invalid email or password' }),
        }
      }

      const token = generateToken(user._id, email, user.role)
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Login successful',
          token,
          user: {
            _id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
          },
        } as LoginResponse),
      }
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid action' }),
    }
  } catch (error) {
    console.error('Error in auth:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    }
  }
}
