import { Handler } from '@netlify/functions'
import { getCampaignsCollection } from './db'
import { extractToken, requireAuth } from './auth'
import { ObjectId } from 'mongodb'

export const handler: Handler = async (event) => {
  const token = extractToken(event.headers.authorization)
  const user = requireAuth(token)

  if (!user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' }),
    }
  }

  try {
    const campaigns = await getCampaignsCollection()

    // GET - List all campaigns for admin
    if (event.httpMethod === 'GET') {
      const id = event.queryStringParameters?.id
      
      if (id) {
        try {
          const campaign = await campaigns.findOne({ _id: new ObjectId(id) })
          if (!campaign) {
            return {
              statusCode: 404,
              body: JSON.stringify({ error: 'Campaign not found' }),
            }
          }
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(campaign),
          }
        } catch (error) {
          return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid campaign ID' }),
          }
        }
      }

      const allCampaigns = await campaigns.find({}).toArray()
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allCampaigns),
      }
    }

    // POST - Create new campaign
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}')
      const newCampaign = {
        ...body,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      }
      
      const result = await campaigns.insertOne(newCampaign)
      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _id: result.insertedId,
          ...newCampaign,
        }),
      }
    }

    // PUT - Update campaign
    if (event.httpMethod === 'PUT') {
      const id = event.queryStringParameters?.id
      if (!id) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Campaign ID required' }),
        }
      }

      try {
        const body = JSON.parse(event.body || '{}')
        const result = await campaigns.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              ...body,
              updatedAt: new Date(),
            },
          }
        )

        if (result.matchedCount === 0) {
          return {
            statusCode: 404,
            body: JSON.stringify({ error: 'Campaign not found' }),
          }
        }

        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Campaign updated' }),
        }
      } catch (error) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid campaign ID' }),
        }
      }
    }

    // DELETE - Delete campaign
    if (event.httpMethod === 'DELETE') {
      const id = event.queryStringParameters?.id
      if (!id) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Campaign ID required' }),
        }
      }

      try {
        const result = await campaigns.deleteOne({ _id: new ObjectId(id) })

        if (result.deletedCount === 0) {
          return {
            statusCode: 404,
            body: JSON.stringify({ error: 'Campaign not found' }),
          }
        }

        return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Campaign deleted' }),
        }
      } catch (error) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid campaign ID' }),
        }
      }
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  } catch (error) {
    console.error('Error in admin-campaigns:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    }
  }
}
