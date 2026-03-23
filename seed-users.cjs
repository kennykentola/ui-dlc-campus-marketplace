const { Client, Users, Databases, ID, Query } = require('node-appwrite');
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

const users = new Users(client);
const databases = new Databases(client);

const USERS = [
    {
        email: 'seller@test.com',
        password: 'password123',
        name: 'Test Seller',
        role: 'student',
        sellerStatus: 'verified' // Critical for posting
    },
    {
        email: 'buyer@test.com',
        password: 'password123',
        name: 'Test Buyer',
        role: 'student',
        sellerStatus: 'unverified'
    }
];

async function seedUsers() {
    let dbId = 'main-db';
    try {
        const dbs = await databases.list();
        if (dbs.total > 0) dbId = dbs.databases[0].$id;
    } catch (e) { }

    for (const u of USERS) {
        console.log(`Processing ${u.email}...`);
        let userId;

        // Auth
        try {
            const list = await users.list([Query.equal('email', u.email)]);
            if (list.total > 0) {
                userId = list.users[0].$id;
                console.log(`User exists: ${userId}`);
            } else {
                const user = await users.create(ID.unique(), u.email, undefined, u.password, u.name);
                userId = user.$id;
                console.log(`Created user: ${userId}`);
            }
        } catch (e) {
            console.error(`Auth error for ${u.email}:`, e.message);
            continue;
        }

        // Profile
        try {
            try {
                await databases.getDocument(dbId, 'profiles', userId);
                console.log(`Profile exists for ${u.email}`);
            } catch (e) {
                if (e.code === 404) {
                    await databases.createDocument(dbId, 'profiles', userId, {
                        userId: userId,
                        name: u.name,
                        email: u.email,
                        role: u.role,
                        matricNumber: 'TEST-' + Math.floor(Math.random() * 1000),
                        department: 'Computer Science',
                        level: '400',
                        sellerStatus: u.sellerStatus,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });
                    console.log(`Created profile for ${u.email}`);
                } else {
                    throw e;
                }
            }
        } catch (e) {
            console.error(`Profile error for ${u.email}:`, e.message);
        }
    }
}

seedUsers();
