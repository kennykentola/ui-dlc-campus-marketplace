const { Client, Databases, Query } = require('node-appwrite');
require('dotenv').config();

const client = new Client();
const endpoint = process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const project = process.env.VITE_APPWRITE_PROJECT_ID || 'uidlc-marketplace';
const apiKey = process.env.APPWRITE_API_KEY;

if (!apiKey) {
    throw new Error('APPWRITE_API_KEY is required.');
}

client
    .setEndpoint(endpoint)
    .setProject(project)
    .setKey(apiKey);

const databases = new Databases(client);

async function optimizeProfile() {
    try {
        console.log('--- PROFILE CONSOLIDATION ---');
        const targetId = '698323e50004793f2c9e'; // The one visible in Admin Console

        // 1. Get All Profiles
        const profiles = await databases.listDocuments(
            'main-db',
            'profiles',
            [Query.equal('email', 'kilocodes8@gmail.com')]
        );
        console.log(`Found ${profiles.total} profiles.`);

        // 2. Identify Target
        const targetProfile = profiles.documents.find(p => p.$id === targetId);
        if (!targetProfile) {
            console.error(`Target profile ${targetId} NOT FOUND. Cannot consolidate.`);
            return;
        }

        // 3. Verify Target
        if (targetProfile.sellerStatus !== 'verified') {
            console.log(`Verifying Target Profile [${targetId}]...`);
            await databases.updateDocument('main-db', 'profiles', targetId, {
                sellerStatus: 'verified'
            });
            console.log('Target Verified.');
        } else {
            console.log(`Target Profile [${targetId}] is already verified.`);
        }

        // 4. Delete Others
        let deletedCount = 0;
        for (const p of profiles.documents) {
            if (p.$id !== targetId) {
                console.log(`Deleting duplicate profile [${p.$id}]...`);
                await databases.deleteDocument('main-db', 'profiles', p.$id);
                deletedCount++;
            }
        }

        console.log(`\nCleanup Complete! Verified ID: ${targetId}`);
        console.log(`Deleted ${deletedCount} duplicates.`);

    } catch (error) {
        console.error('Error in consolidation:', error);
    }
}

optimizeProfile();
