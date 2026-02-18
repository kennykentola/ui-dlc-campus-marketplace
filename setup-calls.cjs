const sdk = require('node-appwrite');
const fs = require('fs');
const path = require('path');

// Manually parse .env.production
const envPath = path.join(__dirname, '.env.production');
const envContent = fs.readFileSync(envPath, 'utf8');
const envConfig = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envConfig[key.trim()] = value.trim();
    }
});

console.log('Parsed keys:', Object.keys(envConfig));
console.log('Project ID:', envConfig.VITE_APPWRITE_PROJECT_ID);
console.log('Endpoint:', envConfig.VITE_APPWRITE_ENDPOINT);

const client = new sdk.Client();

const endpoint = 'https://cloud.appwrite.io/v1'; // Trying global endpoint
const projectId = 'uidlc-marketplace';
const apiKey = 'standard_9fd3bbd3040f622b126894db84da3f73e9c6078337ac5c607a683693b2d88cc2f30670f341ea18f84191f544e3f15c610e255e2ee0a9463566a0e75daa2128fc77acd7f76861e8a20827c4dc2beacb7081790ef3c4babe4adf9266ea7af94e3eee1f5990c9d90d7054a307e1e77c398d48b13e4157fecc69cec64a97765edc59';

if (!endpoint || !projectId || !apiKey) {
    console.error('Missing environment variables. Please check .env.production');
    process.exit(1);
}

client
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

const databases = new sdk.Databases(client);

async function listDatabases() {
    try {
        const dbs = await databases.list();
        if (dbs.total > 0) {
            console.log('Found databases:', dbs.documents.map(d => `${d.name} (${d.$id})`));
            return dbs.documents[0].$id;
        } else {
            console.log('No databases found. Creating "main-db"...');
            await databases.create('main-db', 'Main Database');
            return 'main-db';
        }
    } catch (error) {
        console.error('Error listing databases (listing failed, defaulting to "main-db"):', error);
        return 'main-db'; // Fallback to main-db instead of failing
    }
}

async function createCallsCollection() {
    const dbId = await listDatabases();
    if (!dbId) return;

    try {
        console.log(`Creating 'calls' collection in database '${dbId}'...`);

        // 1. Create Collection
        try {
            await databases.createCollection(dbId, callsCollectionId, 'Voice Calls');
            console.log('Collection created.');
        } catch (error) {
            if (error.code === 409) {
                console.log('Collection already exists. Skipping creation.');
            } else {
                throw error;
            }
        }

        // 2. Create Attributes
        const attributes = [
            { key: 'callerId', type: 'string', size: 50, required: true },
            { key: 'receiverId', type: 'string', size: 50, required: true },
            { key: 'status', type: 'string', size: 20, required: true }, // ringing, connected, ended
            { key: 'sdp', type: 'string', size: 5000, required: false }, // Session Description
            { key: 'type', type: 'string', size: 20, required: false }, // offer, answer
            { key: 'candidates', type: 'string', size: 5000, required: false, array: true }, // ICE candidates (JSON strings)
        ];

        for (const attr of attributes) {
            try {
                if (attr.array) {
                    await databases.createStringAttribute(dbId, callsCollectionId, attr.key, attr.size, attr.required, undefined, true);
                } else {
                    await databases.createStringAttribute(dbId, callsCollectionId, attr.key, attr.size, attr.required);
                }
                console.log(`Attribute '${attr.key}' created.`);
                // Wait a bit to avoid race conditions
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                if (error.code === 409) {
                    console.log(`Attribute '${attr.key}' already exists.`);
                } else {
                    console.error(`Error creating attribute '${attr.key}':`, error.message);
                }
            }
        }

        // 3. Create Indexes
        try {
            await databases.createIndex(dbId, callsCollectionId, 'receiverId_status_index', 'key', ['receiverId', 'status'], ['asc', 'asc']);
            console.log('Index created.');
        } catch (error) {
            if (error.code === 409) {
                console.log('Index already exists.');
            } else {
                console.error('Error creating index:', error.message);
            }
        }

        console.log('Calls collection setup complete!');

    } catch (error) {
        console.error('Error setting up calls collection:', error);
    }
}

createCallsCollection();
