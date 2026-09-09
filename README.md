# SheziStock - Multi-Tenant Industry-Adaptive Inventory & POS

**SheziStock** is a cutting-edge, cross-platform Android & mobile inventory management and Point-of-Sale (POS) application built with **React Native (Expo)**, **React Navigation**, **Zustand**, and **Firebase Firestore** with offline-first persistence.

---

## 🌟 Core Features & Multi-Industry Engine

SheziStock is designed around a **multi-tenant architecture** where businesses dynamically configure their operational sector:

### 1. 💊 Pharmacy & Healthcare Edition
- **FEFO Batch Allocation**: POS automatically identifies and assigns batches with closest expiry dates to minimize expired inventory.
- **Generic Salt / Formula Search**: Instantly look up substitute medications by chemical formula (e.g. *Amoxicillin + Clavulanic Acid*, *Paracetamol + Caffeine*).
- **Scheduled Drug / Rx Warnings**: Prescription verification flags on restricted drugs with doctor ID and pharmacist license number tracking.
- **Expiry Badges & Alerts**: Real-time alerts for drugs expiring in <60 days and expired inventory lockdown.

### 2. 🏬 General Store & Retail Mart Edition
- **Wholesale vs Retail Pricing**: 1-tap pricing mode toggle on individual cart items or bulk orders.
- **Carton-to-Unit Breakdown**: Configurable unit conversions (e.g., 1 Master Carton = 24 Pieces) for seamless warehouse-to-counter fulfillment.
- **Aisle & Shelf Locators**: Visual coordinates (e.g., *Aisle 3 - Shelf D4*) on every product card for rapid picker retrieval.
- **Reorder Point Monitoring**: Automated alerts when shelf stock hits minimum safety threshold.

### 3. 🍽️ Restaurant & Cafe Edition
- **Recipe Bill of Materials (BOM)**: Link raw ingredients (flour, beef patties, mozzarella, buns, espresso beans) to menu dishes.
- **Automated Ingredient Depletion**: When a dish is sold at POS, underlying raw material stocks are automatically decremented in real time.
- **Dine-In Table Floorplan & KOT**: Table assignment (e.g. *Table 4*, *VIP Lounge*), Takeaway, and Delivery order routing with Kitchen Order Ticket (KOT) formatting.
- **Ingredient Shortage Warnings**: Dishes are flagged when linked raw ingredients fall below required cooking thresholds.

---

## ⚡ Barcode Scanning & Real-Time Audits
- **Camera & Barcode Scanner**: High-speed camera scanner with instant barcode-to-product mapping.
- **Cycle Count Audits**: Compare physical counted stock vs system inventory; logs discrepancies, surplus/loss valuations, and reconciles with 1 tap.
- **Thermal & Digital Receipts**: Printable thermal receipts (58mm/80mm) and shareable PDF invoices with sector-specific metadata.

---

## 🛠️ Technology Stack
- **Framework**: React Native 0.76+ & Expo SDK 52
- **State Management**: Zustand (Offline-first persistence with AsyncStorage)
- **Navigation**: React Navigation (Bottom Tabs + Native Stack)
- **Backend & Database**: Firebase Firestore with persistent local multi-tab cache
- **Icons**: Lucide React Native
- **Print & Share**: Expo Print & Expo Sharing

---

## 🚀 Quickstart Guide

### 1. Installation
```bash
npm install
```

### 2. Run on Android Simulator / Device
```bash
npm run android
```

### 3. Run on Web Preview
```bash
npm run web
```

### 4. Firebase Setup (Optional)
1. Open the app and navigate to **Settings** → **Firebase Firestore Backend**.
2. Enter your Firebase **Project ID** and **API Key**.
3. Tap **Test Firestore Connection** to enable cloud synchronization.
4. If no credentials are entered, the app functions seamlessly in **Offline Persistence Mode** with local AsyncStorage.

---

## 📂 Project Architecture

```
SheziStock/
├── App.tsx                      # Root App with ThemeProvider & NavigationContainer
├── src/
│   ├── config/
│   │   ├── firebaseConfig.ts    # Multi-tenant Firestore paths & offline cache
│   │   └── industryPresets.ts  # Theme tokens, badges & color palettes
│   ├── types/
│   │   ├── industry.ts          # IndustryType ('pharmacy' | 'general_store' | 'restaurant')
│   │   ├── product.ts           # Sector-specific schemas (Batches, Recipes, Racks)
│   │   ├── sale.ts              # POS cart items, payments, invoices, discounts
│   │   ├── audit.ts             # Discrepancy logs & cycle count audits
│   │   └── tenant.ts            # Multi-tenant branch schemas
│   ├── store/
│   │   ├── useAppStore.ts       # Industry switcher & tenant settings
│   │   ├── useInventoryStore.ts # Catalog, batch manager & recipe BOM
│   │   ├── usePosStore.ts       # Rapid billing & FEFO cart checkout
│   │   └── useSalesStore.ts     # Invoices, transactions & analytics
│   ├── services/
│   │   ├── firestoreService.ts  # Firestore CRUD & atomic batch writes
│   │   ├── barcodeService.ts    # Barcode lookup & generator
│   │   ├── receiptService.ts    # Thermal & PDF receipt generator
│   │   └── mockData.ts          # Preloaded demo datasets for all 3 sectors
│   ├── components/
│   │   ├── common/              # AppHeader, StatCard, SearchBar, Badge
│   │   ├── pos/                 # PosItemCard, CartDrawer, ReceiptModal, TableSelector, BatchPicker
│   │   ├── inventory/           # ProductCard, ProductFormModal, RecipeBuilder, AddBatch, AdjustStock
│   │   └── audit/               # BarcodeScannerModal
│   └── screens/
│       ├── IndustrySelectScreen.tsx
│       ├── DashboardScreen.tsx
│       ├── PosScreen.tsx
│       ├── InventoryScreen.tsx
│       ├── StockAuditScreen.tsx
│       ├── SalesHistoryScreen.tsx
│       ├── AnalyticsScreen.tsx
│       └── SettingsScreen.tsx
```
