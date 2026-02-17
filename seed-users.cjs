const { Client, Users, Databases, ID, Query } = require('node-appwrite');

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('uidlc-marketplace')
    .setKey('standard_9fd3bbd3040f622b126894db84da3f73e9c6078337ac5c607a683693b2d88cc2f30670f341ea18f84191f544e3f15c610e255e2ee0a9463566a0e75daa2128fc77acd7f76861e8a20827c4dc2beacb7081790ef3c4babe4adf9266ea7af94e3eee1f5990c9d90d7054a307e1e77c398d48b13e4157fecc69cec64a97765edc59');

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
