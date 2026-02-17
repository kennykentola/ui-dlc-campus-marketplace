/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APPWRITE_ENDPOINT: string
  readonly VITE_APPWRITE_PROJECT_ID: string
  readonly VITE_APPWRITE_DATABASE_ID: string
  readonly VITE_APPWRITE_PROFILES_COLLECTION_ID: string
  readonly VITE_APPWRITE_PRODUCTS_COLLECTION_ID: string
  readonly VITE_APPWRITE_MESSAGES_COLLECTION_ID: string
  readonly VITE_APPWRITE_REVIEWS_COLLECTION_ID: string
  readonly VITE_APPWRITE_REPORTS_COLLECTION_ID: string
  readonly VITE_APPWRITE_BUCKET_ID: string
  readonly APPWRITE_API_KEY: string
  readonly GEMINI_API_KEY: string
  readonly BUCKET_ITEM_IMAGES: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
