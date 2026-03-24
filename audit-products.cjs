const { Client, Databases } = require('node-appwrite');
require('dotenv').config();

const client = new Client();
client.setEndpoint(process.env.VITE_APPWRITE_ENDPOINT).setProject(process.env.VITE_APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
const databases = new Databases(client);

async function check() {
  const dbId = process.env.VITE_APPWRITE_DATABASE_ID || 'main-db';
  try {
    const coll = await databases.getCollection(dbId, 'products');
    console.log(`Attribute Count: ${coll.attributes.length}`);
    coll.attributes.forEach(attr => {
      console.log(`- ${attr.key}: ${attr.status} (${attr.type})`);
    });
  } catch (e) { console.error(e.message); }
}

check();
