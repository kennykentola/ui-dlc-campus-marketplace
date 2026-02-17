const { Client, Databases, Permission, Role } = require('node-appwrite');

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('uidlc-marketplace')
    .setKey('standard_9fd3bbd3040f622b126894db84da3f73e9c6078337ac5c607a683693b2d88cc2f30670f341ea18f84191f544e3f15c610e255e2ee0a9463566a0e75daa2128fc77acd7f76861e8a20827c4dc2beacb7081790ef3c4babe4adf9266ea7af94e3eee1f5990c9d90d7054a307e1e77c398d48b13e4157fecc69cec64a97765edc59');

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
