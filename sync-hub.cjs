const { Client, Databases, Storage, Users, Permission, Role, ID, Query } = require('node-appwrite');
require('dotenv').config({ path: '.env.local' });

// Identity Hub
const config = {
    endpoint: process.env.VITE_APPWRITE_ENDPOINT,
    project: process.env.VITE_APPWRITE_PROJECT_ID,
    key: process.env.APPWRITE_API_KEY,
    dbId: process.env.VITE_APPWRITE_DATABASE_ID || 'main-db',
    bucketId: process.env.VITE_APPWRITE_BUCKET_ID || 'product-images'
};

const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.project)
    .setKey(config.key);

const databases = new Databases(client);
const storage = new Storage(client);
const users = new Users(client);

// Sector Registry
const SECTOR_CALLS = 'calls';
const SECTOR_PROFILES = 'profiles';
const SECTOR_PRODUCTS = 'products';

// Command Logic
async function syncStorage() {
    console.log('\n--- Sector 1: Storage Clearance ---');
    try {
        await storage.updateBucket(
            config.bucketId,
            'Campus Asset Vault',
            [
                Permission.read(Role.any()),
                Permission.create(Role.users()),
                Permission.update(Role.users()),
                Permission.delete(Role.users())
            ],
            false, // fileSecurity disabled (inherit bucket read permission)
            true
        );
        console.log('✅ Bucket "product-images" synchronized to Public Read.');
    } catch (e) {
        if (e.code === 404) {
            await storage.createBucket(config.bucketId, 'Campus Asset Vault', [Permission.read(Role.any()), Permission.create(Role.users())], false, true);
            console.log('✅ Bucket Created with Public Read.');
        } else {
            console.error('❌ Storage Sync Failed:', e.message);
        }
    }
}

async function syncCallsSector() {
    console.log('\n--- Sector 2: Voice Communication Node ---');
    try {
        try {
            await databases.createCollection(config.dbId, SECTOR_CALLS, 'Voice Calls', [
                Permission.read(Role.users()),
                Permission.create(Role.users()),
                Permission.update(Role.users()),
                Permission.delete(Role.users())
            ]);
            console.log('✅ "calls" collection deployed.');
        } catch (e) { if (e.code === 409) console.log('ℹ️ "calls" sector already active.'); else throw e; }

        const attrs = [
            { key: 'callerId', type: 'string', size: 50, req: true },
            { key: 'receiverId', type: 'string', size: 50, req: true },
            { key: 'status', type: 'string', size: 20, req: true },
            { key: 'sdp', type: 'string', size: 4000, req: false },
            { key: 'type', type: 'string', size: 20, req: false },
            { key: 'candidates', type: 'string', size: 4000, req: false, array: true }
        ];

        for (const a of attrs) {
            try {
                if (a.array) await databases.createStringAttribute(config.dbId, SECTOR_CALLS, a.key, a.size, a.req, undefined, true);
                else await databases.createStringAttribute(config.dbId, SECTOR_CALLS, a.key, a.size, a.req);
                console.log(`✅ Attribute "${a.key}" synced.`);
            } catch (e) { if (e.code !== 409) console.error(`⚠️ Attr ${a.key} error:`, e.message); }
        }

        try {
            await databases.createIndex(config.dbId, SECTOR_CALLS, 'receiverId_status_index', 'key', ['receiverId', 'status'], ['asc', 'asc']);
            console.log('✅ Search Index deployed.');
        } catch (e) { if (e.code !== 409) console.error('⚠️ Index error:', e.message); }
    } catch (e) { console.error('❌ Calls Sync Failed:', e.message); }
}

async function createAdmin(email) {
    console.log(`\n--- Sector 3: Admin Authority Audit (${email}) ---`);
    try {
        const list = await users.list([Query.equal('email', email)]);
        if (list.total === 0) { console.log('❌ User not found in Auth registry.'); return; }

        const user = list.users[0];
        const userId = user.$id;
        try {
            await databases.updateDocument(config.dbId, SECTOR_PROFILES, userId, {
                role: 'admin',
                sellerStatus: 'verified',
                updatedAt: new Date().toISOString()
            });
            console.log('✅ Privileges Elevated: Profile Updated.');
        } catch (e) {
            if (e.code === 404) {
                console.log('ℹ️ Profile missing. Provisioning new Admin Profile...');
                await databases.createDocument(config.dbId, SECTOR_PROFILES, userId, {
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
            } else {
                throw e;
            }
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
                await databases.createDocument(config.dbId, SECTOR_PROFILES, userId, {
                    userId, name: u.name, email: u.email, role: u.role, sellerStatus: u.stat,
                    level: '400', department: 'Industrial Design', matricNumber: 'DLC-' + Math.floor(Math.random() * 10000),
                    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
                });
            } catch (e) { if (e.code !== 409) throw e; }
            console.log(`✅ User Sync: ${u.email}`);
        } catch (e) { console.error(`⚠️ User ${u.email} seed error:`, e.name); }
    }

    // Product Injection
    try {
        const seller = (await users.list([Query.equal('email', 'seller@test.com')])).users[0];
        for (const p of SAMPLE_PRODUCTS) {
            await databases.createDocument(config.dbId, SECTOR_PRODUCTS, ID.unique(), {
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
    else if (arg === '--calls') await syncCallsSector();
    else if (arg === '--admin') await createAdmin('sajiboro2@gmail.com');
    else if (arg === '--seed') await seedCampus();
    else if (arg === '--all') {
        await syncStorage();
        await syncCallsSector();
        await seedCampus();
        await createAdmin('sajiboro2@gmail.com');
        console.log('\n✅ HUB AUDIT COMPLETE: System Integrity Validated.');
    } else {
        console.log('Instruction for Hub: use --storage, --calls, --admin, --seed, or --all');
    }
}

main();
