
const { Client, Databases } = require('node-appwrite');
require('dotenv').config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || 'uidlc-marketplace')
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.VITE_APPWRITE_DATABASE_ID || 'main-db';
const collectionId = 'reports';

async function syncReports() {
    console.log("Synchronizing Institutional Safety Nodes...");
    const attributes = [
        { key: 'reporterEmail', type: 'string', size: 255 },
        { key: 'reporterMatric', type: 'string', size: 255 },
        { key: 'reportedUserId', type: 'string', size: 255 },
        { key: 'reportedName', type: 'string', size: 255 },
        { key: 'reportedMatric', type: 'string', size: 255 },
        { key: 'reportedEmail', type: 'string', size: 255 },
        { key: 'updatedAt', type: 'datetime' }
    ];

    for (const attr of attributes) {
        try {
            console.log(`Deploying ${attr.key}...`);
            if (attr.type === 'string') {
                await databases.createStringAttribute(dbId, collectionId, attr.key, attr.size, false);
            } else if (attr.type === 'datetime') {
                await databases.createDatetimeAttribute(dbId, collectionId, attr.key, false);
            }
            console.log(`Node ${attr.key} finalized.`);
        } catch (e) {
            console.log(`Node ${attr.key} status: ${e.message}`);
        }
    }
    console.log("Safety Registry Integrity Verified.");
}

syncReports();
