const { Client, Databases, Permission, Role, Query, Users, ID } = require('node-appwrite');

// Configuration
const PROJECT_ID = 'uidlc-marketplace';
const API_KEY = 'standard_9fd3bbd3040f622b126894db84da3f73e9c6078337ac5c607a683693b2d88cc2f30670f341ea18f84191f544e3f15c610e255e2ee0a9463566a0e75daa2128fc77acd7f76861e8a20827c4dc2beacb7081790ef3c4babe4adf9266ea7af94e3eee1f5990c9d90d7054a307e1e77c398d48b13e4157fecc69cec64a97765edc59';
const ENDPOINT = 'https://cloud.appwrite.io/v1';
const DB_ID = 'main-db';
const PRODUCTS_COL_ID = 'products';

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);
const users = new Users(client);

// Dummy Data
const SELLER_EMAIL = 'seller@test.com';

const SAMPLE_PRODUCTS = [
    { name: 'Calculus Textbook', category: 'Books', price: 5000, desc: 'Used but in good condition. 7th Edition.', image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800' },
    { name: 'Scientific Calculator', category: 'Electronics', price: 3500, desc: 'Casio fx-991ES Plus, works perfectly.', image: 'https://images.unsplash.com/photo-1587145820266-a5951ee1f620?auto=format&fit=crop&w=800' },
    { name: 'Lab Coat', category: 'Services', price: 2000, desc: 'White lab coat, size M. Clean.', image: 'https://images.unsplash.com/photo-1576091160550-217358c7c8c8?auto=format&fit=crop&w=800' },
    { name: 'Reading Table', category: 'Accommodation', price: 15000, desc: 'Small wooden reading table, perfect for students.', image: 'https://images.unsplash.com/photo-1491924778227-f27b090632e6?auto=format&fit=crop&w=800' },
    { name: 'Extension Box', category: 'Electronics', price: 4000, desc: 'Surge protector with 4 sockets.', image: 'https://images.unsplash.com/photo-1563770094211-1ea440422fa7?auto=format&fit=crop&w=800' }, // Power strip concept
    { name: 'Past Questions (100L)', category: 'Books', price: 1000, desc: 'Complete set of past questions for 100 level.', image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800' },
    { name: 'Sneakers (Size 42)', category: 'Shoes', price: 8000, desc: 'Nike running shoes, barely used.', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800' },
    { name: 'Backpack', category: 'Bags', price: 6500, desc: 'Waterproof laptop backpack. Black.', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800' },
    { name: 'Wireless Mouse', category: 'Electronics', price: 2500, desc: 'Optical mouse with USB receiver.', image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800' },
    { name: 'Introduction to Python', category: 'Books', price: 4500, desc: 'Programming guide for beginners.', image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800' }
];

async function seedProducts() {
    try {
        console.log('Fetching Seller ID...');
        const userList = await users.list([Query.equal('email', SELLER_EMAIL)]);
        if (userList.total === 0) throw new Error('Seller user not found. Run seed-users.cjs first.');
        const sellerId = userList.users[0].$id;
        const sellerName = userList.users[0].name;

        console.log(`Using Seller: ${sellerName} (${sellerId})`);

        // 2. Create Products
        for (const p of SAMPLE_PRODUCTS) {
            console.log(`Creating product: ${p.name}`);
            await databases.createDocument(
                DB_ID,
                PRODUCTS_COL_ID,
                ID.unique(),
                {
                    name: p.name,
                    description: p.desc,
                    price: p.price,
                    category: p.category,
                    sellerId: sellerId,
                    sellerName: sellerName,
                    status: 'approved',
                    imageUrls: [p.image],
                    transactionType: 'sale',
                    isNegotiable: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                [
                    Permission.read(Role.any()),
                    Permission.update(Role.user(sellerId)),
                    Permission.delete(Role.user(sellerId))
                ]
            );
        }

        console.log('Successfully seeded 10 products!');

    } catch (error) {
        console.error('Seeding failed:', error);
    }
}

seedProducts();
