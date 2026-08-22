import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const products = await mongoose.connection.db.collection('products').find({}).toArray();
  console.log(`TOTAL DB PRODUCTS: ${products.length}`);
  products.forEach((p, idx) => {
    console.log(`[${idx+1}] Name: "${p.name}" | Category: "${p.category}" | FirstImg: ${p.images?.[0]?.url}`);
  });
  process.exit(0);
}

run().catch(console.error);
