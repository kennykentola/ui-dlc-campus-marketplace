const { Client, Databases } = require('node-appwrite');
require('dotenv').config();

const client = new Client()
  .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT)
  .setProject(process.env.VITE_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = process.env.VITE_APPWRITE_PRODUCTS_COLLECTION_ID;

async function updateSchema() {
  console.log("Adding missing attributes to products collection...");
  try {
    try { await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, "learningHub", 100, false); console.log("Added learningHub"); } catch(e) {}
    try { await databases.createBooleanAttribute(DATABASE_ID, COLLECTION_ID, "isExamWeekSafe", false); console.log("Added isExamWeekSafe"); } catch(e) {}
    try { await databases.createBooleanAttribute(DATABASE_ID, COLLECTION_ID, "isSharedLogistics", false); console.log("Added isSharedLogistics"); } catch(e) {}
    try { await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, "digitalFileUrl", 1000, false); console.log("Added digitalFileUrl"); } catch(e) {}
    try { await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, "digitalFileName", 255, false); console.log("Added digitalFileName"); } catch(e) {}
    try { await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, "listingType", 100, false); console.log("Added listingType"); } catch(e) {}
    try { await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, "transactionType", 100, false); console.log("Added transactionType"); } catch(e) {}
    try { await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, "exchangeTerms", 1000, false); console.log("Added exchangeTerms"); } catch(e) {}
    try { await databases.createFloatAttribute(DATABASE_ID, COLLECTION_ID, "buyNowPrice", false); console.log("Added buyNowPrice"); } catch(e) {}
    try { await databases.createBooleanAttribute(DATABASE_ID, COLLECTION_ID, "isNegotiable", false); console.log("Added isNegotiable"); } catch(e) {}
    try { await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, "deliveryMethods", 100, false, undefined, true); console.log("Added deliveryMethods (Array)"); } catch(e) {}
    
    // Check Transactions table as well
    const TX_COLLECTION_ID = process.env.VITE_APPWRITE_TRANSACTIONS_COLLECTION_ID;
    try { await databases.createStringAttribute(DATABASE_ID, TX_COLLECTION_ID, "digitalFileUrl", 1000, false); console.log("Added digitalFileUrl to transactions"); } catch(e) {}
    try { await databases.createStringAttribute(DATABASE_ID, TX_COLLECTION_ID, "digitalFileName", 255, false); console.log("Added digitalFileName to transactions"); } catch(e) {}
    
    console.log("Schema update commands issued. Note: Appwrite may take a few seconds to process each attribute.");
  } catch (error) {
    console.error("Error updating schema:", error);
  }
}

updateSchema();
