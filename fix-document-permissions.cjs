const { Client, Databases, Permission, Role } = require('node-appwrite');

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('uidlc-marketplace')
    .setKey('standard_9fd3bbd3040f622b126894db84da3f73e9c6078337ac5c607a683693b2d88cc2f30670f341ea18f84191f544e3f15c610e255e2ee0a9463566a0e75daa2128fc77acd7f76861e8a20827c4dc2beacb7081790ef3c4babe4adf9266ea7af94e3eee1f5990c9d90d7054a307e1e77c398d48b13e4157fecc69cec64a97765edc59');

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
