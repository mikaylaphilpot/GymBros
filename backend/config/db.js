import { MongoClient } from 'mongodb';

const client = new MongoClient("mongodb+srv://laehpimentel_db_user:CRR5PVFyxhYr6R2B@dev-gymbros.abktuqj.mongodb.net/");

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

// Call this only when your application terminates
export async function disconnectFromMongoDB() {
  await client.close();
}