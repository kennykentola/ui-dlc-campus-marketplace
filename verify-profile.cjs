const { Client, Databases, Query } = require('node-appwrite');

const client = new Client();
client
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('uidlc-marketplace')
    .setKey('standard_9fd3bbd3040f622b126894db84da3f73e9c6078337ac5c607a683693b2d88cc2f30670f341ea18f84191f544e3f15c610e255e2ee0a9463566a0e75daa2128fc77acd7f76861e8a20827c4dc2beacb7081790ef3c4babe4adf9266ea7af94e3eee1f5990c9d90d7054a307e1e77c398d48b13e4157fecc69cec64a97765edc59');

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
