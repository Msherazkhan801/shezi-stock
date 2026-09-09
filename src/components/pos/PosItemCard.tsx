import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Plus,
  Minus,
  Pill,
  MapPin,
  ChefHat,
  AlertCircle,
  Calendar,
  Layers,
} from 'lucide-react-native';
import { Product } from '../../types/product';
import { Badge } from '../common/Badge';
import { INDUSTRY_PRESETS } from '../../config/industryPresets';
import { useAppStore } from '../../store/useAppStore';

interface PosItemCardProps {
  product: Product;
  cartQuantity: number;
  onAddToCart: () => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
  onPressBatchSelector?: () => void;
}

export const PosItemCard: React.FC<PosItemCardProps> = ({
  product,
  cartQuantity,
  onAddToCart,
  onIncrement,
  onDecrement,
  onPressBatchSelector,
}) => {
  const { tenant } = useAppStore();
  const preset = INDUSTRY_PRESETS[product.industry];
  const isPharma = product.industry === 'pharmacy';
  const isGeneral = product.industry === 'general_store';
  const isRestaurant = product.industry === 'restaurant';

  const isOutOfStock = product.currentStock <= 0;
  const isLowStock = product.currentStock > 0 && product.currentStock <= product.minStockAlert;

  // Pharmacy: get closest expiring batch
  const closestBatch =
    isPharma && product.batches && product.batches.length > 0
      ? [...product.batches].sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))[0]
      : null;

  return (
    <View
      style={[
        styles.card,
        isOutOfStock && styles.cardDisabled,
        cartQuantity > 0 && { borderColor: preset.accentColor, borderWidth: 1.5 },
      ]}
    >
      <View style={styles.content}>
        {/* Category & Badges Row */}
        <View style={styles.badgeRow}>
          <Text style={styles.category}>{product.category}</Text>
          <View style={styles.tagsContainer}>
            {isPharma && product.requiresPrescription && (
              <Badge label="Rx Required" variant="danger" size="small" />
            )}
            {isGeneral && product.rackLocation && (
              <Badge
                label={product.rackLocation}
                variant="purple"
                size="small"
                icon={<MapPin size={10} color="#C084FC" />}
              />
            )}
            {isRestaurant && product.kitchenStation && (
              <Badge
                label={product.kitchenStation}
                variant="warning"
                size="small"
                icon={<ChefHat size={10} color="#FBBF24" />}
              />
            )}
            {isOutOfStock ? (
              <Badge label="Out of Stock" variant="danger" size="small" />
            ) : isLowStock ? (
              <Badge label={`Low: ${product.currentStock} left`} variant="warning" size="small" />
            ) : (
              <Badge
                label={`${product.currentStock} in stock`}
                variant="neutral"
                size="small"
              />
            )}
          </View>
        </View>

        {/* Product Name */}
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Sector-Specific Secondary Info */}
        {isPharma && (
          <View style={styles.metaBox}>
            {product.genericFormula && (
              <Text style={styles.metaText} numberOfLines={1}>
                💊 <Text style={{ color: '#34D399' }}>{product.genericFormula}</Text>
              </Text>
            )}
            {closestBatch && (
              <TouchableOpacity
                onPress={onPressBatchSelector}
                style={styles.batchTrigger}
                activeOpacity={0.7}
              >
                <Calendar size={11} color="#60A5FA" />
                <Text style={styles.batchText}>
                  Batch {closestBatch.batchNumber} (Exp: {closestBatch.expiryDate})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {isGeneral && (
          <View style={styles.metaBox}>
            <Text style={styles.metaText}>
              📦 {product.cartonQuantity ? `1 Carton = ${product.cartonQuantity} Units` : `SKU: ${product.sku}`}
              {product.wholesalePrice && (
                <Text style={{ color: '#F59E0B' }}>
                  {' • '}Wholesale: {tenant.currencySymbol}{product.wholesalePrice.toFixed(2)}
                </Text>
              )}
            </Text>
          </View>
        )}

        {isRestaurant && product.recipe && (
          <View style={styles.metaBox}>
            <Text style={styles.metaText} numberOfLines={1}>
              <Layers size={11} color="#F97316" /> BOM: {product.recipe.length} Ingredients linked
            </Text>
          </View>
        )}

        {/* Price & Cart Actions Row */}
        <View style={styles.footerRow}>
          <View>
            <Text style={styles.priceLabel}>Price</Text>
            <Text style={[styles.priceValue, { color: preset.accentColor }]}>
              {tenant.currencySymbol}
              {product.sellingPrice.toFixed(2)}
              <Text style={styles.unitText}> / {product.unit}</Text>
            </Text>
          </View>

          {cartQuantity === 0 ? (
            <TouchableOpacity
              onPress={onAddToCart}
              disabled={isOutOfStock}
              style={[
                styles.addBtn,
                { backgroundColor: preset.accentColor },
                isOutOfStock && styles.addBtnDisabled,
              ]}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#fff" />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.stepper}>
              <TouchableOpacity
                onPress={onDecrement}
                style={styles.stepperBtn}
                activeOpacity={0.7}
              >
                <Minus size={14} color="#F8FAFC" />
              </TouchableOpacity>
              <Text style={styles.stepperCount}>{cartQuantity}</Text>
              <TouchableOpacity
                onPress={onIncrement}
                disabled={cartQuantity >= product.currentStock}
                style={[
                  styles.stepperBtn,
                  cartQuantity >= product.currentStock && { opacity: 0.5 },
                ]}
                activeOpacity={0.7}
              >
                <Plus size={14} color="#F8FAFC" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardDisabled: {
    opacity: 0.6,
  },
  content: {
    padding: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  category: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    lineHeight: 22,
    marginBottom: 6,
  },
  metaBox: {
    backgroundColor: '#0F172A',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  metaText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  batchTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  batchText: {
    fontSize: 11,
    color: '#60A5FA',
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 4,
  },
  priceLabel: {
    fontSize: 10,
    color: '#64748B',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  unitText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  addBtnDisabled: {
    backgroundColor: '#475569',
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 2,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: '#334155',
  },
  stepperCount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
    paddingHorizontal: 10,
  },
});
