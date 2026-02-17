
import { UserProfile, UserRole, Product, ProductStatus, Category, Review, SellerStatus, ProductReport } from '../types';

const DEFAULT_NOTIFICATIONS = {
  emailMessages: true,
  emailReviews: true,
  emailVerification: true
};

const INITIAL_PROFILES: UserProfile[] = [
  {
    $id: 'user1',
    userId: 'u1',
    name: 'Adebayo Tunde',
    email: 'tunde@dlc.ui.edu.ng',
    matricNumber: 'DLC/21/0452',
    department: 'Computer Science',
    level: '300',
    role: UserRole.STUDENT,
    createdAt: new Date().toISOString(),
    averageRating: 4.5,
    totalReviews: 2,
    phoneNumber: '08123456789',
    bankName: 'First Bank',
    accountNumber: '3012345678',
    accountName: 'Adebayo Tunde',
    fintechHandles: 'OPay: 08123456789',
    sellerStatus: SellerStatus.VERIFIED,
    notificationSettings: DEFAULT_NOTIFICATIONS,
    updatedAt: new Date().toISOString()
  },
  {
    $id: 'dev1',
    userId: 'dev_uid',
    name: 'Peter Kehinde Ademola',
    email: 'peterkehindeademola@gmail.com',
    matricNumber: 'DLC/DEV/001',
    department: 'Software Engineering',
    level: '500',
    role: UserRole.STUDENT,
    createdAt: new Date().toISOString(),
    averageRating: 5.0,
    totalReviews: 1,
    phoneNumber: '07011223344',
    bankName: 'Access Bank',
    accountNumber: '0011223344',
    accountName: 'Peter Kehinde Ademola',
    fintechHandles: 'PalmPay: 07011223344',
    sellerStatus: SellerStatus.VERIFIED,
    notificationSettings: DEFAULT_NOTIFICATIONS,
    updatedAt: new Date().toISOString()
  },
  {
    $id: 'admin1',
    userId: 'admin_uid',
    name: 'Admin User',
    email: 'admin@dlc.ui.edu.ng',
    matricNumber: 'ADMIN/001',
    department: 'Administration',
    level: 'N/A',
    role: UserRole.ADMIN,
    createdAt: new Date().toISOString(),
    sellerStatus: SellerStatus.VERIFIED,
    notificationSettings: DEFAULT_NOTIFICATIONS,
    updatedAt: new Date().toISOString()
  }
];

const categories = [
  Category.ELECTRONICS, Category.BOOKS, Category.FASHION, Category.SERVICES, 
  Category.ACCOMMODATION, Category.STATIONERY, Category.BAGS, Category.SHOES, Category.CLOTHES
];

const sellerIds = ['u1', 'dev_uid'];
const sellerNames = ['Adebayo Tunde', 'Peter Kehinde Ademola'];

const generateMockProducts = (count: number): Product[] => {
  const products: Product[] = [];
  const baseProducts = [
    { name: 'Calculus for Engineers', desc: 'Standard textbook for MTH 101, very neat.', cat: Category.BOOKS, price: 4500 },
    { name: 'iPhone 12 Pro Max', desc: 'Used but in perfect condition. 128GB.', cat: Category.ELECTRONICS, price: 450000 },
    { name: 'Denim Jacket', desc: 'Stylish blue denim jacket, size Large.', cat: Category.CLOTHES, price: 8000 },
    { name: 'Scientific Calculator', desc: 'Casio fx-991EX, perfect for engineering students.', cat: Category.STATIONERY, price: 12000 },
    { name: 'Room at Agbowo', desc: 'Shared apartment near UI campus gate.', cat: Category.ACCOMMODATION, price: 150000 },
    { name: 'Web Dev Tutoring', desc: 'I can teach you React and Node.js for your project.', cat: Category.SERVICES, price: 5000 },
    { name: 'Nike Airforce 1', desc: 'Brand new shoes, size 43.', cat: Category.SHOES, price: 25000 },
    { name: 'Laptop Backpack', desc: 'Waterproof bag with USB charging port.', cat: Category.BAGS, price: 7500 },
    { name: 'Organic Chemistry Notes', desc: 'Handwritten notes from 200L classes.', cat: Category.BOOKS, price: 2000 },
    { name: 'Rechargeable Fan', desc: 'Slightly used fan, very useful during heat.', cat: Category.ELECTRONICS, price: 18000 }
  ];

  for (let i = 1; i <= count; i++) {
    const base = baseProducts[i % baseProducts.length];
    const sellerIdx = i % 2;
    products.push({
      $id: `p${i}`,
      name: `${base.name} #${i}`,
      description: `${base.desc} This is listing number ${i} in our marketplace simulation.`,
      price: base.price + (i * 100),
      category: base.cat,
      sellerId: sellerIds[sellerIdx],
      sellerName: sellerNames[sellerIdx],
      status: ProductStatus.APPROVED,
      imageUrls: [
        `https://picsum.photos/seed/product_${i}_1/600/400`,
        `https://picsum.photos/seed/product_${i}_2/600/400`,
        `https://picsum.photos/seed/product_${i}_3/600/400`
      ],
      createdAt: new Date(Date.now() - i * 3600000).toISOString(),
      isNegotiable: i % 3 === 0
    });
  }
  return products;
};

const INITIAL_PRODUCTS: Product[] = generateMockProducts(35);

const INITIAL_REVIEWS: Review[] = [
  {
    $id: 'r1',
    productId: 'p1',
    productName: 'Calculus for Engineers #1',
    sellerId: 'u1',
    buyerId: 'dev_uid',
    buyerName: 'Peter Kehinde Ademola',
    rating: 5,
    comment: 'Great book, exactly as described. Very helpful for my exam.',
    createdAt: new Date().toISOString(),
  }
];

const INITIAL_REPORTS: ProductReport[] = [];

export const getStore = (key: string, initial: any) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : initial;
};

export const saveStore = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

export { INITIAL_PROFILES, INITIAL_PRODUCTS, INITIAL_REVIEWS, INITIAL_REPORTS };
