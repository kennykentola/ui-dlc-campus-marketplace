const { Client, Databases, ID } = require('node-appwrite');
require('dotenv').config();

const client = new Client();
client.setEndpoint(process.env.VITE_APPWRITE_ENDPOINT).setProject(process.env.VITE_APPWRITE_PROJECT_ID).setKey(process.env.APPWRITE_API_KEY);
const databases = new Databases(client);

async function testCreate() {
  const dbId = process.env.VITE_APPWRITE_DATABASE_ID || 'main-db';
  try {
    const res = await databases.createDocument(dbId, 'products', ID.unique(), {
      name: 'Test Item with Logistics',
      description: 'Testing deliveryMethods attribute',
      price: 1000,
      category: 'Books',
      sellerId: 'test-user',
      sellerName: 'Tester',
      status: 'approved',
      imageUrls: ['https://placehold.co/150'],
      listingType: 'Normal',
      deliveryMethods: ['Meetup'],
      isFlagged: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log(`Success! ID: ${res.$id}`);
  } catch (e) { console.error('Error:', e.message); }
}

testCreate();
