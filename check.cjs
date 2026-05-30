const { Client, Databases, Query } = require('node-appwrite');
require('dotenv').config();

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function check() {
  try {
    const res = await databases.listDocuments(
      process.env.VITE_APPWRITE_DATABASE_ID, 
      process.env.VITE_APPWRITE_TRANSACTIONS_COLLECTION_ID,
      [Query.limit(1), Query.orderDesc('$createdAt')]
    );
    const tx = res.documents[0];
    console.log("LATEST TX:", tx);
    
    if (tx) {
        const product = await databases.getDocument(
            process.env.VITE_APPWRITE_DATABASE_ID,
            process.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID,
            tx.productId
        );
        console.log("PRODUCT FOR TX:", product);
    }
  } catch(e) {
    console.error(e);
  }
}
check();
