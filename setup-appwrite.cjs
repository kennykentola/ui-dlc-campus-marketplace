
const { Client, Databases, Permission, Role } = require('node-appwrite');
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

        // High-Trust Permission Sets
        const standardPerms = [
            Permission.read(Role.any()),
            Permission.create(Role.users()),
            Permission.update(Role.users()),
            Permission.delete(Role.users()),
        ];

        const privatePerms = [
            Permission.read(Role.users()),
            Permission.create(Role.users()),
            Permission.update(Role.users()),
            Permission.delete(Role.users()),
        ];

        // Create collections with Industrial Schema and Permissions
        const collections = [
            {
                id: 'profiles',
                name: 'User Profiles',
                permissions: standardPerms,
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
                    { key: 'blockedUserIds', type: 'string', required: false, size: 255, array: true },
                    { key: 'notificationSettings', type: 'string', required: false, size: 1000 },
                    { key: 'verificationDocumentUrl', type: 'string', required: false, size: 2000 },
                    { key: 'createdAt', type: 'datetime', required: false },
                    { key: 'updatedAt', type: 'datetime', required: false }
                ]
            },
            {
                id: 'products',
                name: 'Product Listings',
                permissions: standardPerms,
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
                    { key: 'isFlagged', type: 'boolean', required: false, default: false },
                    { key: 'isNegotiable', type: 'boolean', required: false, default: true },
                    { key: 'condition', type: 'string', required: false, size: 100 },
                    { key: 'location', type: 'string', required: false, size: 255 },
                    { key: 'transactionType', type: 'string', required: false, size: 100 },
                    { key: 'exchangeTerms', type: 'string', required: false, size: 1000 },
                    { key: 'createdAt', type: 'datetime', required: false },
                    { key: 'updatedAt', type: 'datetime', required: false }
                ]
            },
            {
                id: 'transactions',
                name: 'Transactions',
                permissions: privatePerms,
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
                permissions: standardPerms,
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
                permissions: privatePerms,
                attributes: [
                    { key: 'conversationId', type: 'string', required: true, size: 255 },
                    { key: 'senderId', type: 'string', required: true, size: 255 },
                    { key: 'receiverId', type: 'string', required: true, size: 255 },
                    { key: 'text', type: 'string', required: false, size: 1000 },
                    { key: 'audioUrl', type: 'string', required: false, size: 500 },
                    { key: 'fileUrl', type: 'string', required: false, size: 500 },
                    { key: 'fileName', type: 'string', required: false, size: 500 },
                    { key: 'duration', type: 'integer', required: false },
                    { key: 'type', type: 'string', required: true, size: 50 },
                    { key: 'isRead', type: 'boolean', required: false },
                    { key: 'createdAt', type: 'datetime', required: false }
                ]
            },
            {
                id: 'calls',
                name: 'Voice Calls',
                permissions: privatePerms,
                attributes: [
                    { key: 'callerId', type: 'string', required: true, size: 255 },
                    { key: 'receiverId', type: 'string', required: true, size: 255 },
                    { key: 'status', type: 'string', required: true, size: 100 },
                    { key: 'sdp', type: 'string', required: false, size: 10000 },
                    { key: 'type', type: 'string', required: false, size: 50 },
                    { key: 'candidates', type: 'string', required: false, size: 5000, array: true },
                    { key: 'createdAt', type: 'datetime', required: false }
                ]
            },
            {
                id: 'reviews',
                name: 'Product Reviews',
                permissions: standardPerms,
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
                permissions: privatePerms,
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
                console.log(`Node exists. Synchronizing Permissions for ${collection.id}...`);
                await databases.updateCollection(dbId, collection.id, collection.name, collection.permissions);
            } catch (error) {
                if (error.code === 404) {
                    console.log(`Node missing. Deploying collection: ${collection.name}`);
                    await databases.createCollection(dbId, collection.id, collection.name, collection.permissions);
                } else {
                    throw error;
                }
            }

            for (const attr of collection.attributes) {
                process.stdout.write(`  Syncing Attribute: ${attr.key}... `);
                try {
                    const isArray = attr.array || false;
                    const isRequired = attr.required || false;
                    // Default values are not allowed for required attributes or arrays in Appwrite
                    const defaultValue = (isRequired || isArray) ? undefined : (attr.default !== undefined ? attr.default : (attr.type === 'string' ? '' : (attr.type === 'integer' || attr.type === 'double' ? 0 : (attr.type === 'boolean' ? false : null))));

                    if (attr.type === 'string') {
                        await databases.createStringAttribute(dbId, collection.id, attr.key, attr.size || 255, isRequired, defaultValue, isArray);
                    } else if (attr.type === 'integer') {
                        await databases.createIntegerAttribute(dbId, collection.id, attr.key, isRequired, -2147483647, 2147483647, defaultValue, isArray);
                    } else if (attr.type === 'double') {
                        await databases.createFloatAttribute(dbId, collection.id, attr.key, isRequired, -999999999, 999999999, defaultValue, isArray);
                    } else if (attr.type === 'boolean') {
                        await databases.createBooleanAttribute(dbId, collection.id, attr.key, isRequired, defaultValue, isArray);
                    } else if (attr.type === 'datetime') {
                        await databases.createDatetimeAttribute(dbId, collection.id, attr.key, isRequired, defaultValue, isArray);
                    }
                    console.log('OK');
                } catch (error) {
                    if (error.code === 409) {
                        console.log('EXISTS');
                    } else {
                        console.log(`FAIL: ${error.message}`);
                    }
                }
            }
        }

        console.log('Institutional Database Protocol finalized with Open Permission Gates.');
    } catch (error) {
        console.error('Critical Fail during Registry Auditing:', error);
    }
}

setupDatabase();
