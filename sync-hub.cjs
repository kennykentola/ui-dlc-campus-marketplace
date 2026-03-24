const { Client, Databases, Storage, Users, Permission, Role, ID, Query } = require('node-appwrite');
require('dotenv').config();

// Identity Hub
const config = {
    endpoint: process.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
    project: process.env.VITE_APPWRITE_PROJECT_ID || 'uidlc-marketplace',
    key: process.env.APPWRITE_API_KEY,
    dbId: process.env.VITE_APPWRITE_DATABASE_ID || 'main-db',
    bucketId: process.env.VITE_APPWRITE_BUCKET_ID || 'product-images'
};

if (!config.key) {
    console.error('CRITICAL: Internal Security Violation - APPWRITE_API_KEY missing in Registry (.env)');
    process.exit(1);
}

const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.project)
    .setKey(config.key);

const databases = new Databases(client);
const storage = new Storage(client);
const users = new Users(client);

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

// Sector Registry Schema
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
            { key: 'sdp', type: 'string', required: false, size: 4000 },
            { key: 'type', type: 'string', required: false, size: 50 },
            { key: 'candidates', type: 'string', required: false, size: 4000, array: true },
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

// Command Logic
async function syncStorage() {
    console.log('\n--- Sector 1: Storage Clearance (Bucket) ---');
    try {
        await storage.getBucket(config.bucketId);
        console.log(`Checking Permissions for: ${config.bucketId}...`);
        await storage.updateBucket(
            config.bucketId,
            'Campus Asset Vault',
            [
                Permission.read(Role.any()),
                Permission.create(Role.users()),
                Permission.update(Role.users()),
                Permission.delete(Role.users())
            ],
            false,
            true
        );
        console.log('✅ Bucket synchronized.');
    } catch (e) {
        if (e.code === 404) {
            console.log('Node missing. Deploying bucket...');
            await storage.createBucket(config.bucketId, 'Campus Asset Vault', [Permission.read(Role.any()), Permission.create(Role.users())], false, true);
            console.log('✅ Bucket Created.');
        } else {
            console.error('❌ Storage Sync Failed:', e.message);
        }
    }
}

async function syncRegistry() {
    console.log('\n--- Sector 2: Database Node Synchronization ---');
    try {
        console.log(`Verification: Accessing Registry Hub (${config.dbId})...`);
        try {
            await databases.get(config.dbId);
        } catch (e) {
            if (e.code === 404) {
                console.log('Hub missing. Deploying new Registry Database...');
                await databases.create(config.dbId, 'UI DLC Campus Marketplace Database');
            } else throw e;
        }

        for (const collection of collections) {
            process.stdout.write(`Auditing Node: ${collection.name}... `);
            try {
                await databases.getCollection(config.dbId, collection.id);
                await databases.updateCollection(config.dbId, collection.id, collection.name, collection.permissions);
                console.log('OK');
            } catch (error) {
                if (error.code === 404) {
                    await databases.createCollection(config.dbId, collection.id, collection.name, collection.permissions);
                    console.log('DEPLOYED');
                } else throw error;
            }

            for (const attr of collection.attributes) {
                process.stdout.write(`  Syncing Attr: ${attr.key}... `);
                try {
                    const isArray = attr.array || false;
                    const isRequired = attr.required || false;
                    const defaultValue = (isRequired || isArray) ? undefined : (attr.default !== undefined ? attr.default : (attr.type === 'string' ? '' : (attr.type === 'integer' || attr.type === 'double' ? 0 : (attr.type === 'boolean' ? false : null))));

                    if (attr.type === 'string') {
                        await databases.createStringAttribute(config.dbId, collection.id, attr.key, attr.size || 255, isRequired, defaultValue, isArray);
                    } else if (attr.type === 'integer') {
                        await databases.createIntegerAttribute(config.dbId, collection.id, attr.key, isRequired, -2147483647, 2147483647, defaultValue, isArray);
                    } else if (attr.type === 'double') {
                        await databases.createFloatAttribute(config.dbId, collection.id, attr.key, isRequired, -999999999, 999999999, defaultValue, isArray);
                    } else if (attr.type === 'boolean') {
                        await databases.createBooleanAttribute(config.dbId, collection.id, attr.key, isRequired, defaultValue, isArray);
                    } else if (attr.type === 'datetime') {
                        await databases.createDatetimeAttribute(config.dbId, collection.id, attr.key, isRequired, defaultValue, isArray);
                    }
                    console.log('OK');
                } catch (error) {
                    if (error.code === 409) console.log('EXISTS');
                    else console.log(`FAIL: ${error.message}`);
                }
            }
        }
        
        // Special Case: Index for Calls
        try {
            await databases.createIndex(config.dbId, 'calls', 'receiverId_status_index', 'key', ['receiverId', 'status'], ['asc', 'asc']);
            console.log('✅ Receiver Index deployed on Calls node.');
        } catch (e) { if (e.code !== 409) console.log(`⚠️ Index node skip: ${e.message}`); }

    } catch (e) { console.error('❌ Registry Sync Failed:', e.message); }
}

async function createAdmin(email) {
    console.log(`\n--- Sector 3: Admin Authority Audit (${email}) ---`);
    try {
        const list = await users.list([Query.equal('email', email)]);
        if (list.total === 0) { console.log('❌ User not found in Auth registry.'); return; }

        const user = list.users[0];
        const userId = user.$id;
        try {
            await databases.updateDocument(config.dbId, 'profiles', userId, {
                role: 'admin',
                sellerStatus: 'verified',
                updatedAt: new Date().toISOString()
            });
            console.log('✅ Privileges Elevated: Profile Updated.');
        } catch (e) {
            if (e.code === 404) {
                console.log('ℹ️ Profile missing. Provisioning new Admin Profile...');
                await databases.createDocument(config.dbId, 'profiles', userId, {
                    userId,
                    name: user.name,
                    email: user.email,
                    role: 'admin',
                    matricNumber: 'ADMIN-MASTER',
                    department: 'computer science',
                    level: '500l',
                    sellerStatus: 'verified',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
                console.log('✅ Admin Profile Provisioned.');
            } else throw e;
        }
    } catch (e) { console.error('❌ Admin Setup Failed:', e.message); }
}

async function seedCampus() {
    console.log('\n--- Sector 4: Campus Seeding Protocol ---');
    const SAMPLE_USERS = [
        { email: 'seller@test.com', pass: 'password123', name: 'Alumni Seller', role: 'student', stat: 'verified' },
        { email: 'buyer@test.com', pass: 'password123', name: 'Freshman Buyer', role: 'student', stat: 'unverified' }
    ];

    const SAMPLE_PRODUCTS = [
        { name: 'Calculus Textbook', cat: 'Books', price: 5000, desc: 'Used but in good condition. 7th Edition.', img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800' },
        { name: 'Scientific Calculator', cat: 'Electronics', price: 3500, desc: 'Casio fx-991ES Plus, works perfectly.', img: 'https://images.unsplash.com/photo-1587145820266-a5951ee1f620?w=800' }
    ];

    for (const u of SAMPLE_USERS) {
        try {
            let userId;
            const list = await users.list([Query.equal('email', u.email)]);
            if (list.total > 0) userId = list.users[0].$id;
            else {
                const created = await users.create(ID.unique(), u.email, undefined, u.pass, u.name);
                userId = created.$id;
            }

            try {
                await databases.createDocument(config.dbId, 'profiles', userId, {
                    userId, name: u.name, email: u.email, role: u.role, sellerStatus: u.stat,
                    level: '400', department: 'Industrial Design', matricNumber: 'DLC-' + Math.floor(Math.random() * 10000),
                    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
                });
            } catch (e) { if (e.code !== 409) throw e; }
            console.log(`✅ User Sync: ${u.email}`);
        } catch (e) { console.error(`⚠️ User ${u.email} seed error:`, e.name); }
    }

    try {
        const seller = (await users.list([Query.equal('email', 'seller@test.com')])).users[0];
        for (const p of SAMPLE_PRODUCTS) {
            await databases.createDocument(config.dbId, 'products', ID.unique(), {
                name: p.name, description: p.desc, price: p.price, category: p.cat,
                sellerId: seller.$id, sellerName: seller.name, status: 'approved',
                imageUrls: [p.img], listingType: 'Normal', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
            }, [Permission.read(Role.any()), Permission.update(Role.user(seller.$id))]);
            console.log(`✅ Product Sync: ${p.name}`);
        }
    } catch (e) { console.error('⚠️ Product seeding error:', e.message); }
}

// Orchestrator Logic
async function main() {
    const arg = process.argv[2];
    if (arg === '--storage') await syncStorage();
    else if (arg === '--registry') await syncRegistry();
    else if (arg === '--admin') await createAdmin('sajiboro2@gmail.com');
    else if (arg === '--seed') await seedCampus();
    else if (arg === '--all') {
        await syncStorage();
        await syncRegistry();
        await seedCampus();
        await createAdmin('sajiboro2@gmail.com');
        console.log('\n✅ HUB AUDIT COMPLETE: System Integrity Validated.');
    } else {
        console.log('Instruction for Hub: use --storage, --registry, --admin, --seed, or --all');
    }
}

main();
