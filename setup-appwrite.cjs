const { Client, Databases } = require('node-appwrite');

const client = new Client();
client.setEndpoint('https://cloud.appwrite.io/v1');
client.setProject('uidlc-marketplace');
client.setKey('standard_9fd3bbd3040f622b126894db84da3f73e9c6078337ac5c607a683693b2d88cc2f30670f341ea18f84191f544e3f15c610e255e2ee0a9463566a0e75daa2128fc77acd7f76861e8a20827c4dc2beacb7081790ef3c4babe4adf9266ea7af94e3eee1f5990c9d90d7054a307e1e77c398d48b13e4157fecc69cec64a97765edc59');

const databases = new Databases(client);

async function setupDatabase() {
  try {
    // database checking logic
    let dbId = 'main-db';
    try {
      console.log('Checking for existing databases...');
      const dbs = await databases.list();
      if (dbs.total > 0) {
        dbId = dbs.databases[0].$id;
        console.log(`Using existing database: ${dbId} (${dbs.databases[0].name})`);
      } else {
        console.log('Creating database...');
        await databases.create('main-db', 'UI DLC Campus Marketplace Database');
        console.log('Database created successfully');
      }
    } catch (e) {
      console.log('Error checking/creating DB, trying to use main-db anyway:', e.message);
    }

    // Create collections
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
          { key: 'transactionType', type: 'string', required: false, size: 255 },
          { key: 'isNegotiable', type: 'boolean', required: false },
          { key: 'condition', type: 'string', required: false, size: 255 },
          { key: 'location', type: 'string', required: false, size: 255 },
          { key: 'exchangeTerms', type: 'string', required: false, size: 1000 },
          { key: 'createdAt', type: 'datetime', required: false },
          { key: 'updatedAt', type: 'datetime', required: false }
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
          { key: 'duration', type: 'integer', required: false },
          { key: 'isRead', type: 'boolean', required: false },
          { key: 'reactions', type: 'string', required: false, size: 5000 },
          { key: 'createdAt', type: 'datetime', required: false }
        ]
      },
      {
        id: 'reviews',
        name: 'Product Reviews',
        attributes: [
          { key: 'productId', type: 'string', required: true, size: 255 },
          { key: 'productName', type: 'string', required: true, size: 255 },
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
          { key: 'reportedUserId', type: 'string', required: true, size: 255 },
          { key: 'reportedProductId', type: 'string', required: false, size: 255 },
          { key: 'reason', type: 'string', required: true, size: 255 },
          { key: 'description', type: 'string', required: false, size: 1000 },
          { key: 'status', type: 'string', required: false, size: 255 },
          { key: 'createdAt', type: 'datetime', required: false },
          { key: 'updatedAt', type: 'datetime', required: false }
        ]
      }
    ];

    for (const collection of collections) {
      console.log(`Creating collection: ${collection.name}`);
      try {
        await databases.createCollection(dbId, collection.id, collection.name);
      } catch (error) {
        console.log(`Collection ${collection.name} might already exist or error: ${error.message}`);
      }

      for (const attr of collection.attributes) {
        console.log(`Adding attribute: ${attr.key}`);
        try {
          if (attr.type === 'string') {
            await databases.createStringAttribute(dbId, collection.id, attr.key, attr.size || 255, attr.required, attr.required ? undefined : (attr.default || ''), attr.array || false);
          } else if (attr.type === 'integer') {
            await databases.createIntegerAttribute(dbId, collection.id, attr.key, attr.required, attr.min || 0, attr.max || 999999, attr.required ? undefined : (attr.default || 0), attr.array || false);
          } else if (attr.type === 'double') {
            await databases.createFloatAttribute(dbId, collection.id, attr.key, attr.required, attr.min || 0, attr.max || 999999, attr.required ? undefined : (attr.default || 0), attr.array || false);
          } else if (attr.type === 'boolean') {
            await databases.createBooleanAttribute(dbId, collection.id, attr.key, attr.required, attr.required ? undefined : (attr.default || false), attr.array || false);
          } else if (attr.type === 'datetime') {
            await databases.createDatetimeAttribute(dbId, collection.id, attr.key, attr.required, attr.required ? undefined : (attr.default || null), attr.array || false);
          }
        } catch (error) {
          console.log(`Attribute ${attr.key} might already exist or error: ${error.message}`);
        }
      }
    }

    console.log('All collections and attributes created successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

setupDatabase();
