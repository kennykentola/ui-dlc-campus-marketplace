const { Client, Databases, Permission, Role } = require('node-appwrite');
require('dotenv').config();

const endpoint = process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const project = process.env.VITE_APPWRITE_PROJECT_ID || 'uidlc-marketplace';
const apiKey = process.env.APPWRITE_API_KEY;

if (!apiKey) {
    throw new Error('APPWRITE_API_KEY is required.');
}

const client = new Client()
    .setEndpoint(endpoint)
    .setProject(project)
    .setKey(apiKey);

const databases = new Databases(client);

async function fixDocumentPermissions() {
    let dbId = 'main-db';
    try {
        const dbs = await databases.list();
        if (dbs.total > 0) dbId = dbs.databases[0].$id;
    } catch (e) { }

    console.log(`Fixing permissions in database: ${dbId}`);

    // 1. Profiles
    try {
        const profiles = await databases.listDocuments(dbId, 'profiles');
        console.log(`Found ${profiles.total} profiles.`);
        for (const doc of profiles.documents) {
            console.log(`Updating profile for ${doc.name} (${doc.userId})...`);
            try {
                // If using server SDK, we can overwrite permissions
                await databases.updateDocument(
                    dbId,
                    'profiles',
                    doc.$id,
                    {}, // No data change
                    [
                        Permission.read(Role.any()),              // Everyone can see profiles
                        Permission.update(Role.user(doc.userId)), // Only owner can edit
                        Permission.delete(Role.user(doc.userId))  // Only owner can delete
                    ]
                );
            } catch (err) {
                console.error(`Failed to update profile ${doc.$id}:`, err.message);
            }
        }
    } catch (e) {
        console.error("Error listing profiles:", e.message);
    }

    // 2. Products (if any)
    try {
        const products = await databases.listDocuments(dbId, 'products');
        console.log(`Found ${products.total} products.`);
        for (const doc of products.documents) {
            console.log(`Updating product ${doc.name}...`);
            try {
                await databases.updateDocument(
                    dbId,
                    'products',
                    doc.$id,
                    {},
                    [
                        Permission.read(Role.any()),              // Everyone can see products
                        Permission.update(Role.user(doc.sellerId)), // Seller can edit
                        Permission.delete(Role.user(doc.sellerId))  // Seller can delete
                    ]
                );
            } catch (err) {
                console.error(`Failed to update product ${doc.$id}:`, err.message);
            }
        }
    } catch (e) {
        console.error("Error listing products:", e.message);
    }
}

fixDocumentPermissions();
