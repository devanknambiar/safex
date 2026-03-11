import { MongoClient } from "mongodb";

export async function GET() {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();

  const db = client.db("safex");
  const collection = db.collection("sensor_data");

  const data = await collection.findOne({}, { sort: { receivedAt: -1 } });

  await client.close();

  return Response.json(data);
}