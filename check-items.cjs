const { Client, Databases } = require('node-appwrite');
require('dotenv').config();

const client = new Client();
client.setEndpoint(process.env.VITE_APPWRITE_ENDPOINT).setProject(process.env.VITE_APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
const databases = new Databases(client);

async function checkItems() {
  const dbId = process.env.VITE_APPWRITE_DATABASE_ID || 'main-db';
  try {
    const res = await databases.listDocuments(dbId, 'products');
    console.log(`Total items: ${res.total}`);
    res.documents.forEach(d => {
      console.log(`- ${d.name} | Status: ${d.status} | ID: ${d.$id}`);
    });
  } catch (e) { console.error(e.message); }
}

checkItems();
