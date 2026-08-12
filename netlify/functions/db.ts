import { MongoClient, Db } from 'mongodb'

let cachedClient: MongoClient | null = null
let cachedDb: Db | null = null

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb }
  }

  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI not defined in environment')
  }

  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    minPoolSize: 2,
  })

  try {
    await client.connect()
    const db = client.db('vively_campaigns')
    cachedClient = client
    cachedDb = db
    console.log('Connected to MongoDB')
    return { client, db }
  } catch (error) {
    console.error('MongoDB connection failed:', error)
    throw error
  }
}

export async function getCampaignsCollection() {
  const { db } = await connectToDatabase()
  return db.collection('campaigns')
}

export async function getUsersCollection() {
  const { db } = await connectToDatabase()
  return db.collection('users')
}

export async function getApplicationsCollection() {
  const { db } = await connectToDatabase()
  return db.collection('applications')
}

export async function closeDatabase() {
  if (cachedClient) {
    await cachedClient.close()
    cachedClient = null
    cachedDb = null
    console.log('Disconnected from MongoDB')
  }
}

export { Db }
