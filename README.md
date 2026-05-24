<div align="center">
  
  
  <h1>UI DLC Campus Marketplace</h1>
  <p>A secure, peer-to-peer marketplace and exchange platform designed exclusively for University of Ibadan Distance Learning Centre (UI DLC) scholars.</p>
</div>

---

## 📖 Overview

The **UI DLC Campus Marketplace** is a comprehensive web application built to facilitate secure trading, buying, selling, and resource exchange among UI DLC students. It integrates robust features such as escrow protocols, real-time messaging, verified scholar profiles, and hub-based logistics (Ibadan, Lagos, etc.) to ensure a safe and reliable campus commerce experience.

## ✨ Key Features

- **🔐 Verified Profiles**: Secure authentication and identity verification for UI DLC scholars.
- **🛒 Product Listings**: Buy, sell, or exchange textbooks, notes, and academic resources.
- **💬 Real-Time Messaging**: Integrated peer-to-peer chat for negotiations and meetups.
- **🛡️ Secure Escrow Protocol**: Checkout system with payment proof upload and verification.
- **📍 Hub-Based Logistics**: Set delivery preferences based on DLC Learning Hubs (e.g., Ibadan, Lagos, Abuja).
- **⚠️ Dispute Resolution**: Built-in reporting and flagging system for trust and safety.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, FontAwesome
- **Routing**: React Router DOM v7
- **Backend as a Service (BaaS)**: Appwrite (Authentication, Databases, Storage)

## ⚙️ Prerequisites

Before you begin, ensure you have met the following requirements:
* **Node.js** (v18 or higher recommended)
* **npm** or **yarn**
* An active **Appwrite** project (Cloud or Self-Hosted)

## 🚀 Installation & Setup

1. **Clone the repository (if applicable) and navigate to the directory:**
   ```bash
   cd ui-dlc-campus-marketplace
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory (you can use `.env.example` if available as a template) and add your Appwrite configuration:
   
   ```env
   # Base Endpoint & Project Management
   VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   VITE_APPWRITE_PROJECT_ID=your_project_id

   # Institutional Database Nodes
   VITE_APPWRITE_DATABASE_ID=your_database_id
   VITE_APPWRITE_PROFILES_COLLECTION_ID=profiles
   VITE_APPWRITE_PRODUCTS_COLLECTION_ID=products
   VITE_APPWRITE_MESSAGES_COLLECTION_ID=messages
   VITE_APPWRITE_REVIEWS_COLLECTION_ID=reviews
   VITE_APPWRITE_REPORTS_COLLECTION_ID=reports
   VITE_APPWRITE_TRANSACTIONS_COLLECTION_ID=transactions
   VITE_APPWRITE_REQUESTS_COLLECTION_ID=requests

   # Archive & Registry Storage
   VITE_APPWRITE_BUCKET_ID=your_bucket_id
   
   # For Node admin scripts ONLY (Do not expose to frontend)
   APPWRITE_API_KEY=your_secret_api_key
   ```

4. **Initialize Appwrite Database (Optional):**
   If you are setting up the project from scratch, you can run the setup scripts to scaffold the database collections and attributes.
   ```bash
   node setup-appwrite.cjs
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000` (or the port specified in your Vite config).

## 📜 Available Scripts

- `npm run dev`: Starts the Vite development server.
- `npm run build`: Compiles TypeScript and builds the application for production.
- `npm run preview`: Previews the production build locally.
- Node Administration Scripts:
  - `node setup-appwrite.cjs`: Initializes the Appwrite schema.
  - `node verify-profile.cjs`: Admin script to manually verify a scholar's profile.
  - `node sync-hub.cjs`: Admin script for hub synchronization.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! 

## 📝 License

This project is intended for the UI DLC community.
