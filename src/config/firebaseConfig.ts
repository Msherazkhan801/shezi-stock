import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Real Firebase Configuration for SheziStock
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAv9OOaOjFLF6jahe5V3MiXvqP2xXaajcA",
  authDomain: "shezistocks.firebaseapp.com",
  projectId: "shezistocks",
  storageBucket: "shezistocks.firebasestorage.app",
  messagingSenderId: "757439565104",
  appId: "1:757439565104:web:f3ce867632ab82213a8cf5",
  measurementId: "G-F3EJVGV61H",
};

let app: any = null;
let db: any = null;
let analytics: any = null;

export const initFirebase = (customConfig?: typeof DEFAULT_FIREBASE_CONFIG) => {
  const config = customConfig || DEFAULT_FIREBASE_CONFIG;
  try {
    if (!getApps().length) {
      app = initializeApp(config);
      try {
        db = initializeFirestore(app, {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          }),
        });
      } catch (e) {
        db = getFirestore(app);
      }

      // Initialize analytics safely where supported
      isSupported().then((supported) => {
        if (supported && app) {
          analytics = getAnalytics(app);
        }
      }).catch(() => {});
    } else {
      app = getApp();
      db = getFirestore(app);
    }
    return { app, db, analytics, isConnected: true };
  } catch (error) {
    console.warn('Firebase init fallback to offline store:', error);
    return { app: null, db: null, analytics: null, isConnected: false };
  }
};

export const getFirestoreDb = () => {
  if (!db) {
    initFirebase();
  }
  return db;
};

// Multi-tenant Firestore Path Resolvers
export const FIRESTORE_PATHS = {
  users: () => 'users',
  userDoc: (userId: string) => `users/${userId}`,
  tenants: () => 'tenants',
  tenantDoc: (tenantId: string) => `tenants/${tenantId}`,
  tenant: (tenantId: string) => `tenants/${tenantId}`,
  branch: (tenantId: string, branchId: string) => `tenants/${tenantId}/branches/${branchId}`,
  products: (tenantId: string, branchId: string) => `tenants/${tenantId}/branches/${branchId}/products`,
  productDoc: (tenantId: string, branchId: string, productId: string) =>
    `tenants/${tenantId}/branches/${branchId}/products/${productId}`,
  sales: (tenantId: string, branchId: string) => `tenants/${tenantId}/branches/${branchId}/sales`,
  audits: (tenantId: string, branchId: string) => `tenants/${tenantId}/branches/${branchId}/audits`,
  settings: (tenantId: string) => `tenants/${tenantId}/config/settings`,
};
