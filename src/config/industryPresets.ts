import { IndustryConfig, IndustryType } from '../types/industry';

export const INDUSTRY_PRESETS: Record<IndustryType, IndustryConfig> = {
  pharmacy: {
    id: 'pharmacy',
    title: 'Pharmacy & Healthcare',
    tagline: 'Batch tracking, Expiry FEFO management & Generic Salts',
    badge: 'Rx Pharma Edition',
    iconName: 'Pill',
    accentColor: '#10B981', // Emerald 500
    accentSecondary: '#06B6D4', // Cyan 500
    gradient: ['#059669', '#0E7490'],
    cardBg: '#064E3B20',
    posFeatures: [
      {
        title: 'FEFO Batch Selection',
        description: 'Automatically picks nearest expiring stock first to minimize inventory loss.',
        icon: 'Calendar',
      },
      {
        title: 'Generic Salt Matching',
        description: 'Instant lookup for alternate generic brands by chemical formula.',
        icon: 'Search',
      },
      {
        title: 'Prescription Verification',
        description: 'Flag scheduled drugs and record doctor/license IDs on billing.',
        icon: 'FileText',
      },
    ],
    schemaHighlights: [
      'Batch Number & Expiry Date',
      'Generic Salt / Formula',
      'Dosage Form (Tab, Cap, Syrup)',
      'Doctor & Prescription Log',
      'Days-to-Expiry Color Badges',
    ],
  },
  general_store: {
    id: 'general_store',
    title: 'General Store & Retail',
    tagline: 'Bulk SKUs, Carton-to-Unit ratios & Warehouse Aisle mapping',
    badge: 'Retail & Mart Edition',
    iconName: 'Store',
    accentColor: '#6366F1', // Indigo 500
    accentSecondary: '#F59E0B', // Amber 500
    gradient: ['#4F46E5', '#D97706'],
    cardBg: '#312E8120',
    posFeatures: [
      {
        title: 'Wholesale / Retail Switch',
        description: '1-tap price toggle between customer retail and bulk buyer tiers.',
        icon: 'Tag',
      },
      {
        title: 'Carton Breakdown Ratio',
        description: 'Automatically converts master cartons into individual sellable units.',
        icon: 'Boxes',
      },
      {
        title: 'Aisle & Shelf Locators',
        description: 'Displays exact warehouse aisle and shelf coordinates for fast picker retrieval.',
        icon: 'MapPin',
      },
    ],
    schemaHighlights: [
      'Rack / Aisle / Shelf Location',
      'Bulk SKU & Master Carton Ratio',
      'Wholesale vs Retail Pricing',
      'Supplier Contacts & Reorder Point',
      'Fast Quantity Steppers',
    ],
  },
  restaurant: {
    id: 'restaurant',
    title: 'Restaurant & Cafe',
    tagline: 'Recipe BOM, Automated ingredient deduction & Table KOT',
    badge: 'Kitchen & Cafe Edition',
    iconName: 'UtensilsCrossed',
    accentColor: '#F97316', // Orange 500
    accentSecondary: '#EF4444', // Red 500
    gradient: ['#EA580C', '#DC2626'],
    cardBg: '#7C2D1220',
    posFeatures: [
      {
        title: 'Automated Recipe BOM',
        description: 'Selling 1 burger automatically decrements buns, patties, and cheese in real-time.',
        icon: 'Layers',
      },
      {
        title: 'Table & Dine-in Billing',
        description: 'Manage active tables, takeaway orders, and generate Kitchen Order Tickets (KOT).',
        icon: 'LayoutGrid',
      },
      {
        title: 'Low Ingredient Warnings',
        description: 'Dishes are automatically flagged when raw ingredient levels run low.',
        icon: 'AlertTriangle',
      },
    ],
    schemaHighlights: [
      'Recipe Bill of Materials (BOM)',
      'Raw Ingredients vs Prepared Dishes',
      'Table Number & Order Type (Dine/Take/Del)',
      'Kitchen Order Ticket (KOT) Printing',
      'Allergen & Prep Station Tracking',
    ],
  },
};
