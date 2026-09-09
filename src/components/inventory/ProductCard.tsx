import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Edit3,
  Calendar,
  Layers,
  MapPin,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Plus,
} from 'lucide-react-native';
import { Product } from '../../types/product';
import { Badge } from '../common/Badge';
import { INDUSTRY_PRESETS } from '../../config/industryPresets';
import { useAppStore } from '../../store/useAppStore';

interface ProductCardProps {
  product: Product;
  onEdit: () => void;
  onAddBatch?: () => void;
  onEditRecipe?: () => void;
  onAdjustStock?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  onAddBatch,
  onEditRecipe,
  onAdjustStock,
}) => {
  const [expanded, setExpanded] = useState(false);
  const { tenant } = useAppStore();
  const preset = INDUSTRY_PRESETS[product.industry];
  const isPharma = product.industry === 'pharmacy';
  const isGeneral = product.industry === 'general_store';
  const isRestaurant = product.industry === 'restaurant';

  const isLowStock = product.currentStock <= product.minStockAlert;
  const isOutOfStock = product.currentStock <= 0;

  return (
    <View style={styles.card}>
      {/* Main Row */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <View style={styles.tagRow}>
            <Text style={styles.category}>{product.category}</Text>
            {isPharma && product.requiresPrescription && (
              <Badge label="Rx Req" variant="danger" size="small" />
            )}
            {isRestaurant && (
              <Badge
                label={product.itemType === 'raw_ingredient' ? 'Raw Material' : 'Dish'}
                variant={product.itemType === 'raw_ingredient' ? 'neutral' : 'warning'}
                size="small"
              />
            )}
            {isOutOfStock ? (
              <Badge label="Out of Stock" variant="danger" size="small" />
            ) : isLowStock ? (
              <Badge label="Low Stock" variant="warning" size="small" />
            ) : (
              <Badge label="In Stock" variant="success" size="small" />
            )}
          </View>

          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.barcodeText}>
            SKU: {product.sku} • Barcode: {product.barcode}
          </Text>
        </View>

        <TouchableOpacity onPress={onEdit} style={styles.editBtn}>
          <Edit3 size={16} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* Sector Details */}
      {isPharma && product.genericFormula && (
        <View style={styles.pharmaRow}>
          <Text style={styles.pharmaLabel}>Formula:</Text>
          <Text style={styles.pharmaValue} numberOfLines={1}>
            {product.genericFormula} ({product.dosageForm || 'Tab'})
          </Text>
        </View>
      )}

      {isGeneral && (
        <View style={styles.generalRow}>
          {product.rackLocation && (
            <Text style={styles.generalMeta}>
              <MapPin size={11} color="#C084FC" /> {product.rackLocation}
            </Text>
          )}
          {product.cartonQuantity && (
            <Text style={styles.generalMeta}>📦 1 Ctn = {product.cartonQuantity} Units</Text>
          )}
        </View>
      )}

      {isRestaurant && product.itemType === 'prepared_dish' && product.recipe && (
        <View style={styles.restaurantRow}>
          <Text style={styles.recipeMeta}>
            <Layers size={11} color="#F97316" /> {product.recipe.length} ingredients in recipe BOM
          </Text>
        </View>
      )}

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Cost</Text>
          <Text style={styles.metricValue}>
            {tenant.currencySymbol}{product.costPrice.toFixed(2)}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Selling</Text>
          <Text style={[styles.metricValue, { color: preset.accentColor }]}>
            {tenant.currencySymbol}{product.sellingPrice.toFixed(2)}
          </Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Stock</Text>
          <Text
            style={[
              styles.metricValue,
              isLowStock && { color: '#EF4444' },
            ]}
          >
            {product.currentStock} {product.unit}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setExpanded(!expanded)}
          style={styles.expandBtn}
          activeOpacity={0.7}
        >
          {expanded ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />}
        </TouchableOpacity>
      </View>

      {/* Expandable Batches or Recipe details */}
      {expanded && (
        <View style={styles.expandedSection}>
          {isPharma && product.batches && (
            <View>
              <View style={styles.expandedHeader}>
                <Text style={styles.expandedTitle}>Batches & Expiry Dates</Text>
                {onAddBatch && (
                  <TouchableOpacity onPress={onAddBatch} style={styles.addBatchSmallBtn}>
                    <Plus size={12} color="#10B981" />
                    <Text style={styles.addBatchText}>New Batch</Text>
                  </TouchableOpacity>
                )}
              </View>

              {product.batches.map((b) => (
                <View key={b.id} style={styles.batchSubRow}>
                  <Text style={styles.batchSubNumber}>#{b.batchNumber}</Text>
                  <Text style={styles.batchSubExp}>Exp: {b.expiryDate}</Text>
                  <Text style={styles.batchSubQty}>{b.quantity} {product.unit}</Text>
                </View>
              ))}
            </View>
          )}

          {isRestaurant && product.itemType === 'prepared_dish' && (
            <View>
              <View style={styles.expandedHeader}>
                <Text style={styles.expandedTitle}>Recipe Bill of Materials (BOM)</Text>
                {onEditRecipe && (
                  <TouchableOpacity onPress={onEditRecipe} style={styles.addBatchSmallBtn}>
                    <Edit3 size={12} color="#F97316" />
                    <Text style={[styles.addBatchText, { color: '#F97316' }]}>Configure BOM</Text>
                  </TouchableOpacity>
                )}
              </View>
              {product.recipe && product.recipe.length > 0 ? (
                product.recipe.map((r, i) => (
                  <View key={i} style={styles.batchSubRow}>
                    <Text style={styles.batchSubNumber}>{r.ingredientName}</Text>
                    <Text style={styles.batchSubQty}>
                      {r.quantityUsed} {r.unit} / order
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptySubtext}>No ingredients linked yet.</Text>
              )}
            </View>
          )}

          {onAdjustStock && (
            <TouchableOpacity onPress={onAdjustStock} style={styles.adjustStockBtn}>
              <Text style={styles.adjustStockText}>⚡ Quick Stock Adjustment</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  category: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    lineHeight: 20,
  },
  barcodeText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  editBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    marginLeft: 8,
  },
  pharmaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#064E3B15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  pharmaLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  pharmaValue: {
    fontSize: 11,
    color: '#34D399',
    fontWeight: '600',
    flex: 1,
  },
  generalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  generalMeta: {
    fontSize: 11,
    color: '#94A3B8',
  },
  restaurantRow: {
    marginTop: 4,
  },
  recipeMeta: {
    fontSize: 11,
    color: '#FB923C',
    fontWeight: '500',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  metricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748B',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 1,
  },
  expandBtn: {
    padding: 4,
  },
  expandedSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  expandedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  expandedTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  addBatchSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#0F172A',
  },
  addBatchText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  batchSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  batchSubNumber: {
    fontSize: 11,
    color: '#F8FAFC',
    fontWeight: '600',
  },
  batchSubExp: {
    fontSize: 11,
    color: '#60A5FA',
  },
  batchSubQty: {
    fontSize: 11,
    color: '#34D399',
    fontWeight: '700',
  },
  emptySubtext: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },
  adjustStockBtn: {
    backgroundColor: '#334155',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  adjustStockText: {
    fontSize: 12,
    color: '#F8FAFC',
    fontWeight: '700',
  },
});
