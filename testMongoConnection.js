// testMongoConnection.js
require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
  try {
    await client.connect();
    console.log("Connected successfully to server");
    const database = client.db('real_estate_management');
    const collection = database.collection('projects');
    
    // Verifica cuántos documentos hay en la colección
    const count = await collection.countDocuments();
    console.log(`Number of documents in collection: ${count}`);
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
