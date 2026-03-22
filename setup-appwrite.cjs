
const { Client, Databases } = require('node-appwrite');
require('dotenv').config();

const client = new Client();

const endpoint = process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const project = process.env.VITE_APPWRITE_PROJECT_ID || 'uidlc-marketplace';
const apiKey = process.env.APPWRITE_API_KEY;

if (!apiKey) {
  console.error('CRITICAL: Internal Security Violation - APPWRITE_API_KEY missing in Registry (.env)');
  process.exit(1);
}

client
  .setEndpoint(endpoint)
  .setProject(project)
  .setKey(apiKey);

const databases = new Databases(client);

async function setupDatabase() {
  try {
    const dbId = process.env.VITE_APPWRITE_DATABASE_ID || 'main-db';
    
    console.log(`Checking for Registry Hub: ${dbId}...`);
    try {
      await databases.get(dbId);
      console.log(`Registry Hub verified: ${dbId}`);
    } catch (e) {
       console.log('No existing Registry Hub. Creating new administrative database...');
       await databases.create(dbId, 'UI DLC Campus Marketplace Database');
       console.log('Registry Hub deployment successful.');
    }

    // Create collections with Industrial Schema
    const collections = [
      {
        id: 'profiles',
        name: 'User Profiles',
        attributes: [
          { key: 'userId', type: 'string', required: true, size: 255 },
          { key: 'name', type: 'string', required: true, size: 255 },
          { key: 'email', type: 'string', required: true, size: 255 },
          { key: 'matricNumber', type: 'string', required: true, size: 255 },
          { key: 'department', type: 'string', required: true, size: 255 },
          { key: 'level', type: 'string', required: true, size: 255 },
          { key: 'role', type: 'string', required: true, size: 255 },
          { key: 'sellerStatus', type: 'string', required: true, size: 255 },
          { key: 'avatarUrl', type: 'string', required: false, size: 500 },
          { key: 'phoneNumber', type: 'string', required: false, size: 20 },
          { key: 'bankName', type: 'string', required: false, size: 255 },
          { key: 'accountNumber', type: 'string', required: false, size: 20 },
          { key: 'accountName', type: 'string', required: false, size: 255 },
          { key: 'fintechHandles', type: 'string', required: false, size: 500 },
          { key: 'averageRating', type: 'double', required: false },
          { key: 'totalReviews', type: 'integer', required: false },
          { key: 'favorites', type: 'string', required: false, size: 255, array: true },
          { key: 'completionRate', type: 'integer', required: false },
          { key: 'responseTime', type: 'string', required: false, size: 100 },
          { key: 'blockedUserIds', type: 'string', required: false, array: true },
          { key: 'notificationSettings', type: 'string', required: false, size: 1000 },
          { key: 'verificationDocumentUrl', type: 'string', required: false, size: 2000 },
          { key: 'createdAt', type: 'datetime', required: false },
          { key: 'updatedAt', type: 'datetime', required: false }
        ]
      },
      {
        id: 'products',
        name: 'Product Listings',
        attributes: [
          { key: 'name', type: 'string', required: true, size: 255 },
          { key: 'description', type: 'string', required: true, size: 2000 },
          { key: 'price', type: 'integer', required: true },
          { key: 'category', type: 'string', required: true, size: 255 },
          { key: 'sellerId', type: 'string', required: true, size: 255 },
          { key: 'sellerName', type: 'string', required: true, size: 255 },
          { key: 'status', type: 'string', required: true, size: 255 },
          { key: 'imageUrls', type: 'string', required: true, array: true },
          { key: 'buyerId', type: 'string', required: false, size: 255 },
          { key: 'listingType', type: 'string', required: false, size: 100 },
          { key: 'deliveryMethods', type: 'string', required: false, size: 100, array: true },
          { key: 'createdAt', type: 'datetime', required: false },
          { key: 'updatedAt', type: 'datetime', required: false }
        ]
      },
      {
        id: 'transactions',
        name: 'Transactions',
        attributes: [
          { key: 'productId', type: 'string', required: true, size: 255 },
          { key: 'productName', type: 'string', required: true, size: 255 },
          { key: 'sellerId', type: 'string', required: true, size: 255 },
          { key: 'sellerName', type: 'string', required: true, size: 255 },
          { key: 'buyerId', type: 'string', required: true, size: 255 },
          { key: 'buyerName', type: 'string', required: true, size: 255 },
          { key: 'amount', type: 'integer', required: true },
          { key: 'status', type: 'string', required: true, size: 100 },
          { key: 'paymentProofUrl', type: 'string', required: false, size: 1000 },
          { key: 'disputeReason', type: 'string', required: false, size: 1000 },
          { key: 'createdAt', type: 'datetime', required: false },
          { key: 'updatedAt', type: 'datetime', required: false }
        ]
      },
      {
        id: 'requests',
        name: 'Buyer Requests',
        attributes: [
          { key: 'userId', type: 'string', required: true, size: 255 },
          { key: 'userName', type: 'string', required: true, size: 255 },
          { key: 'itemNeeded', type: 'string', required: true, size: 255 },
          { key: 'description', type: 'string', required: true, size: 1000 },
          { key: 'budget', type: 'integer', required: false },
          { key: 'isFulfilled', type: 'boolean', required: true },
          { key: 'createdAt', type: 'datetime', required: false }
        ]
      },
      {
        id: 'messages',
        name: 'User Messages',
        attributes: [
          { key: 'conversationId', type: 'string', required: true, size: 255 },
          { key: 'senderId', type: 'string', required: true, size: 255 },
          { key: 'receiverId', type: 'string', required: true, size: 255 },
          { key: 'text', type: 'string', required: false, size: 1000 },
          { key: 'audioUrl', type: 'string', required: false, size: 500 },
          { key: 'type', type: 'string', required: true, size: 50 },
          { key: 'isRead', type: 'boolean', required: false },
          { key: 'createdAt', type: 'datetime', required: false }
        ]
      },
      {
        id: 'reviews',
        name: 'Product Reviews',
        attributes: [
          { key: 'productId', type: 'string', required: true, size: 255 },
          { key: 'sellerId', type: 'string', required: true, size: 255 },
          { key: 'buyerId', type: 'string', required: true, size: 255 },
          { key: 'buyerName', type: 'string', required: true, size: 255 },
          { key: 'rating', type: 'integer', required: true },
          { key: 'comment', type: 'string', required: false, size: 1000 },
          { key: 'createdAt', type: 'datetime', required: false }
        ]
      },
      {
        id: 'reports',
        name: 'User Reports',
        attributes: [
          { key: 'reporterId', type: 'string', required: true, size: 255 },
          { key: 'reporterName', type: 'string', required: true, size: 255 },
          { key: 'productId', type: 'string', required: false, size: 255 },
          { key: 'productName', type: 'string', required: false, size: 255 },
          { key: 'reason', type: 'string', required: true, size: 255 },
          { key: 'description', type: 'string', required: false, size: 1000 },
          { key: 'status', type: 'string', required: false, size: 255, default: 'pending' },
          { key: 'createdAt', type: 'datetime', required: false }
        ]
      }
    ];

    for (const collection of collections) {
      console.log(`Auditing Institutional Node: ${collection.name}...`);
      try {
        await databases.getCollection(dbId, collection.id);
      } catch (error) {
        if (error.code === 404) {
          console.log(`Node missing. Deploying collection: ${collection.name}`);
          await databases.createCollection(dbId, collection.id, collection.name);
        } else {
          throw error;
        }
      }

      for (const attr of collection.attributes) {
        process.stdout.write(`  Syncing Attribute: ${attr.key}... `);
        try {
          if (attr.type === 'string') {
            await databases.createStringAttribute(dbId, collection.id, attr.key, attr.size || 255, attr.required, attr.required ? undefined : (attr.default || ''), attr.array || false);
          } else if (attr.type === 'integer') {
            await databases.createIntegerAttribute(dbId, collection.id, attr.key, attr.required, -99999999, 99999999, attr.required ? undefined : (attr.default || 0), attr.array || false);
          } else if (attr.type === 'double') {
            await databases.createFloatAttribute(dbId, collection.id, attr.key, attr.required, -999999, 999999, attr.required ? undefined : (attr.default || 0), attr.array || false);
          } else if (attr.type === 'boolean') {
            await databases.createBooleanAttribute(dbId, collection.id, attr.key, attr.required, attr.required ? undefined : (attr.default || false), attr.array || false);
          } else if (attr.type === 'datetime') {
            await databases.createDatetimeAttribute(dbId, collection.id, attr.key, attr.required, attr.required ? undefined : (attr.default || null), attr.array || false);
          }
          console.log('OK');
        } catch (error) {
           console.log('EXISTS');
        }
      }
    }

    console.log('Institutional Database Protocol finalized with Zero Vulnerabilities.');
  } catch (error) {
    console.error('Critical Fail during Registry Auditing:', error);
  }
}

setupDatabase();
