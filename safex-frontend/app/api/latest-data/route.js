import { MongoClient } from "mongodb";

export async function GET() {
  // Use the same URI your backend uses
  const client = new MongoClient(process.env.MONGODB_URI); 
  
  try {
    await client.connect();

    // MUST match DB_NAME in listen.js
    const db = client.db("wearableDataDB"); 
    
    // MUST match SENSOR_COLLECTION in listen.js
    const collection = db.collection("sensorReadings");

    // Get the latest one
    const data = await collection.findOne({}, { sort: { _id: -1 } });

    if (!data) {
      return new Response(JSON.stringify({ error: "No data found" }), { status: 404 });
    }

    return Response.json(data);
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  } finally {
    await client.close();
  }
}