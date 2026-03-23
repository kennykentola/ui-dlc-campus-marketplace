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

async function fixPermissions() {
    let dbId = 'main-db';
    try {
        const dbs = await databases.list();
        if (dbs.total > 0) {
            dbId = dbs.databases[0].$id;
        }
    } catch (e) {
        console.log('Error listing dbs, assuming main-db');
    }

    const collections = [
        {
            id: 'profiles',
            name: 'User Profiles',
            permissions: [
                Permission.read(Role.any()), // Public profiles? Or Role.users()? Let's say Any for marketplace visibility
                Permission.create(Role.users()),
                Permission.update(Role.users()),
                Permission.delete(Role.users())
            ]
        },
        {
            id: 'products',
            name: 'Product Listings',
            permissions: [
                Permission.read(Role.any()),
                Permission.create(Role.users()),
                Permission.update(Role.users()),
                Permission.delete(Role.users())
            ]
        },
        {
            id: 'messages',
            name: 'User Messages',
            permissions: [
                Permission.read(Role.users()),
                Permission.create(Role.users()),
                Permission.update(Role.users()),
                Permission.delete(Role.users())
            ]
        },
        {
            id: 'reviews',
            name: 'Product Reviews',
            permissions: [
                Permission.read(Role.any()),
                Permission.create(Role.users()),
                Permission.update(Role.users()),
                Permission.delete(Role.users())
            ]
        },
        {
            id: 'reports',
            name: 'User Reports',
            permissions: [
                Permission.read(Role.users()), // Maybe only admin? But user needs to see their own?
                Permission.create(Role.users()),
                Permission.update(Role.users()),
                Permission.delete(Role.users())
            ]
        }
    ];

    for (const col of collections) {
        console.log(`Updating permissions for ${col.name} (${col.id})...`);
        try {
            await databases.updateCollection(
                dbId,
                col.id,
                col.name,
                col.permissions,
                true // Document Security Enabled
            );
            console.log(`Updated ${col.name}`);
        } catch (error) {
            console.error(`Failed to update ${col.name}:`, error.message);
        }
    }
}

fixPermissions();
