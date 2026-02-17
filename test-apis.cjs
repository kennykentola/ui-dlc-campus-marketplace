const { Client, Databases, Query, Users } = require('node-appwrite');

// Configuration
const PROJECT_ID = 'uidlc-marketplace';
const API_KEY = 'standard_9fd3bbd3040f622b126894db84da3f73e9c6078337ac5c607a683693b2d88cc2f30670f341ea18f84191f544e3f15c610e255e2ee0a9463566a0e75daa2128fc77acd7f76861e8a20827c4dc2beacb7081790ef3c4babe4adf9266ea7af94e3eee1f5990c9d90d7054a307e1e77c398d48b13e4157fecc69cec64a97765edc59';
const ENDPOINT = 'https://cloud.appwrite.io/v1';
const DB_ID = 'main-db';
const PRODUCTS_COL_ID = 'products';
const MESSAGES_COL_ID = 'messages';

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);

async function verifyApis() {
    console.log('--- STARTING API VERIFICATION ---');

    try {
        // 1. List Products (Home Page)
        console.log('\n[TEST 1] Listing Products (Simulating Home Page)...');
        const products = await databases.listDocuments(DB_ID, PRODUCTS_COL_ID, [
            Query.limit(5),
            Query.orderDesc('createdAt')
        ]);

        if (products.total > 0) {
            console.log(`✅ Success: Found ${products.total} products.`);
            console.log(`   Sample: "${products.documents[0].name}" - ₦${products.documents[0].price}`);

            // 2. Get Product Detail
            const pId = products.documents[0].$id;
            console.log(`\n[TEST 2] Fetching Detail for Product ID: ${pId}...`);
            const product = await databases.getDocument(DB_ID, PRODUCTS_COL_ID, pId);

            if (product.$id === pId) {
                console.log(`✅ Success: Retrieved details for "${product.name}".`);
                console.log(`   Description: ${product.description.substring(0, 30)}...`);
                console.log(`   Image URL: ${product.imageUrls ? product.imageUrls[0] : 'None'}`);
            } else {
                console.error('❌ Failed to retrieve product details.');
            }

            // 3. Simulate Chat (Message Creation)
            console.log('\n[TEST 3] Testing Chat/Message API...');
            // We need a sender and receiver. Using the product seller and a dummy ID.
            const sellerId = product.sellerId;
            const buyerId = 'test-buyer-id-verification'; // Dummy ID for test

            const messagePayload = {
                conversationId: `conv_${sellerId}_${buyerId}`,
                senderId: buyerId,
                receiverId: sellerId,
                text: "Is this item still available? (API Test)",
                type: 'text',
                createdAt: new Date().toISOString(),
                isRead: false
            };

            // Note: In client-side logic, we might check/create a Conversation document first.
            // Here we just test the Message creation in the 'messages' collection.
            try {
                // Check if collection permissions allow this (we set them to Role.users() earlier)
                // Since we are using Server SDK with API Key, we bypass permissions, but this verifies the DB schema works.
                // To strictly test permissions we'd need Client SDK, which isn't easy in Node script without polyfills.
                // We will trust the Server verification of SCHEMA and DATA integrity.
                const msg = await databases.createDocument(DB_ID, MESSAGES_COL_ID, 'unique()', messagePayload);
                console.log(`✅ Success: Message sent! ID: ${msg.$id}`);
                console.log(`   Content: "${msg.text}"`);

                // 4. List Messages
                console.log('\n[TEST 4] Listing Messages for Conversation...');
                const msgs = await databases.listDocuments(DB_ID, MESSAGES_COL_ID, [
                    Query.equal('conversationId', messagePayload.conversationId)
                ]);
                if (msgs.total > 0) {
                    console.log(`✅ Success: Retrieved ${msgs.total} messages.`);
                } else {
                    console.error('❌ Failed to list messages.');
                }

            } catch (msgError) {
                console.error('❌ Message Test Failed:', msgError.message);
                if (msgError.message.includes('Collection not found')) {
                    console.log('   (Did you create the "messages" collection properly?)');
                }
            }

        } else {
            console.error('❌ No products found. Did seeding work?');
        }

    } catch (error) {
        console.error('🚨 API Verification Failed:', error);
    }

    console.log('\n--- VERIFICATION COMPLETE ---');
}

verifyApis();
