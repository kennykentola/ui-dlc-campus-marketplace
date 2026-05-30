const { Client, Databases, Query } = require('node-appwrite');
require('dotenv').config();

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function patch() {
  try {
    const res = await databases.listDocuments(
      process.env.VITE_APPWRITE_DATABASE_ID, 
      process.env.VITE_APPWRITE_TRANSACTIONS_COLLECTION_ID,
      [Query.limit(10), Query.orderDesc('$createdAt')]
    );
    
    for (const tx of res.documents) {
        if (!tx.digitalFileUrl) {
            const product = await databases.getDocument(
                process.env.VITE_APPWRITE_DATABASE_ID,
                process.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID,
                tx.productId
            );
            
            if (product.digitalFileUrl) {
                console.log(`Patching TX ${tx.$id} with digital url...`);
                await databases.updateDocument(
                    process.env.VITE_APPWRITE_DATABASE_ID,
                    process.env.VITE_APPWRITE_TRANSACTIONS_COLLECTION_ID,
                    tx.$id,
                    {
                        digitalFileUrl: product.digitalFileUrl,
                        digitalFileName: product.digitalFileName
                    }
                );
            }
        }
    }
    console.log("Done patching.");
  } catch(e) {
    console.error(e);
  }
}
patch();
