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

const EMAIL = 'sajiboro2@gmail.com';
const PASSWORD = 'Samuelajiboro123';
const NAME = 'Sajiboro';

async function createAdmin() {
    let userId;

    // Check if user exists
    try {
        console.log(`Checking if user ${EMAIL} exists...`);
        const userList = await users.list([Query.equal('email', EMAIL)]);

        if (userList.total > 0) {
            console.log('User already exists.');
            userId = userList.users[0].$id;
        } else {
            console.log('Creating new user...');
            const user = await users.create(ID.unique(), EMAIL, undefined, PASSWORD, NAME);
            userId = user.$id;
            console.log(`User created with ID: ${userId}`);
        }

        // Get existing database ID logic (similar to setup script)
        let dbId = 'main-db';
        try {
            const dbs = await databases.list();
            if (dbs.total > 0) {
                dbId = dbs.databases[0].$id;
            }
        } catch (e) {
            console.log('Error checking DB, using default:', e.message);
        }

        // Create or Update Profile
        console.log(`Ensuring profile for ${userId} in database ${dbId}...`);
        try {
            // Try to get profile
            const profile = await databases.getDocument(dbId, 'profiles', userId);
            if (profile.role !== 'admin') {
                console.log('Updating user role to admin...');
                await databases.updateDocument(dbId, 'profiles', userId, {
                    role: 'admin',
                    sellerStatus: 'verified' // Admins should probably be verified too
                });
                console.log('User role updated to admin.');
            } else {
                console.log('User is already an admin.');
            }
        } catch (error) {
            if (error.code === 404) {
                console.log('Profile not found, creating new admin profile...');
                await databases.createDocument(dbId, 'profiles', userId, {
                    userId: userId,
                    name: NAME,
                    email: EMAIL,
                    role: 'admin',
                    matricNumber: 'ADMIN', // Placeholder
                    department: 'ADMIN',
                    level: 'N/A',
                    sellerStatus: 'verified',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
                console.log('Admin profile created.');
            } else {
                throw error;
            }
        }

    } catch (error) {
        console.error('Error creating/updating admin:', error);
    }
}

createAdmin();
