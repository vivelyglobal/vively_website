// MongoDB connection utility
const { MongoClient } = require("mongodb");

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI not defined in environment");
  }

  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    minPoolSize: 2,
  });

  try {
    await client.connect();
    const db = client.db("vively_campaigns");
    cachedClient = client;
    cachedDb = db;
    console.log("Connected to MongoDB");
    return { client, db };
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    throw error;
  }
}

async function getCampaignsCollection() {
  const { db } = await connectToDatabase();
  return db.collection("campaigns");
}

async function getUsersCollection() {
  const { db } = await connectToDatabase();
  return db.collection("users");
}

async function getApplicationsCollection() {
  const { db } = await connectToDatabase();
  return db.collection("applications");
}

async function closeDatabase() {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
  }
}

module.exports = {
  connectToDatabase,
  getCampaignsCollection,
  getUsersCollection,
  getApplicationsCollection,
  closeDatabase,
};
