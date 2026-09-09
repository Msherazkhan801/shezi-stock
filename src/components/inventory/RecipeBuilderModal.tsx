import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { X, Plus, Trash2, Layers, Check, Calculator } from 'lucide-react-native';
import { Product, RecipeIngredient } from '../../types/product';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useAppStore } from '../../store/useAppStore';

interface RecipeBuilderModalProps {
  visible: boolean;
  dish: Product | null;
  onClose: () => void;
}

export const RecipeBuilderModal: React.FC<RecipeBuilderModalProps> = ({
  visible,
  dish,
  onClose,
}) => {
  const { tenant } = useAppStore();
  const { products, updateRecipe } = useInventoryStore();

  const rawIngredients = products.filter(
    (p) => p.industry === 'restaurant' && p.itemType === 'raw_ingredient'
  );

  const [recipe, setRecipe] = useState<RecipeIngredient[]>(dish?.recipe || []);
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>('');
  const [quantityInput, setQuantityInput] = useState<string>('1');

  if (!dish) return null;

  const handleAddIngredient = () => {
    if (!selectedIngredientId) return;
    const ing = rawIngredients.find((r) => r.id === selectedIngredientId);
    if (!ing) return;

    const qty = parseFloat(quantityInput) || 1;
    const existingIndex = recipe.findIndex((r) => r.ingredientId === ing.id);

    if (existingIndex > -1) {
      const updated = [...recipe];
      updated[existingIndex].quantityUsed += qty;
      setRecipe(updated);
    } else {
      setRecipe([
        ...recipe,
        {
          ingredientId: ing.id,
          ingredientName: ing.name,
          quantityUsed: qty,
          unit: ing.unit,
        },
      ]);
    }

    setSelectedIngredientId('');
    setQuantityInput('1');
  };

  const handleRemoveIngredient = (ingredientId: string) => {
    setRecipe(recipe.filter((r) => r.ingredientId !== ingredientId));
  };

  const handleSaveRecipe = () => {
    updateRecipe(dish.id, recipe);
    onClose();
  };

  // Compute estimated food cost based on ingredient cost prices
  const estimatedCost = recipe.reduce((sum, item) => {
    const raw = rawIngredients.find((r) => r.id === item.ingredientId);
    if (!raw) return sum;
    return sum + raw.costPrice * item.quantityUsed;
  }, 0);

  const profitMargin = dish.sellingPrice > 0 ? ((dish.sellingPrice - estimatedCost) / dish.sellingPrice) * 100 : 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Recipe Bill of Materials (BOM)</Text>
              <Text style={styles.subtitle}>{dish.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Cost & Margin Banner */}
          <View style={styles.costBanner}>
            <View>
              <Text style={styles.costBannerLabel}>Calculated Food Cost</Text>
              <Text style={styles.costBannerValue}>
                {tenant.currencySymbol}{estimatedCost.toFixed(2)}
              </Text>
            </View>
            <View>
              <Text style={styles.costBannerLabel}>Menu Price</Text>
              <Text style={[styles.costBannerValue, { color: '#F97316' }]}>
                {tenant.currencySymbol}{dish.sellingPrice.toFixed(2)}
              </Text>
            </View>
            <View>
              <Text style={styles.costBannerLabel}>Gross Margin</Text>
              <Text style={[styles.costBannerValue, { color: profitMargin >= 65 ? '#10B981' : '#F59E0B' }]}>
                {profitMargin.toFixed(1)}%
              </Text>
            </View>
          </View>

          {/* Ingredients List */}
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
            <Text style={styles.sectionTitle}>Ingredients Consumed per Serving</Text>

            {recipe.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No ingredients added to this recipe yet.</Text>
                <Text style={styles.emptySubtext}>
                  Add ingredients below to automatically deduct stock on each POS sale.
                </Text>
              </View>
            ) : (
              recipe.map((item) => (
                <View key={item.ingredientId} style={styles.ingredientRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ingredientName}>{item.ingredientName}</Text>
                    <Text style={styles.ingredientUnit}>
                      Deduction: <Text style={{ color: '#F97316', fontWeight: '700' }}>{item.quantityUsed} {item.unit}</Text> per order
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveIngredient(item.ingredientId)}
                    style={styles.deleteBtn}
                  >
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))
            )}

            {/* Add Ingredient Section */}
            <View style={styles.addSection}>
              <Text style={styles.sectionTitle}>Add Raw Ingredient</Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rawPickerScroll}>
                {rawIngredients.map((raw) => {
                  const isSelected = selectedIngredientId === raw.id;
                  return (
                    <TouchableOpacity
                      key={raw.id}
                      style={[
                        styles.rawChip,
                        isSelected && styles.rawChipSelected,
                      ]}
                      onPress={() => setSelectedIngredientId(raw.id)}
                    >
                      <Text
                        style={[
                          styles.rawChipText,
                          isSelected && { color: '#F97316', fontWeight: '700' },
                        ]}
                      >
                        {raw.name} ({raw.unit})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {selectedIngredientId && (
                <View style={styles.qtyRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Quantity to deduct per dish</Text>
                    <TextInput
                      style={styles.qtyInput}
                      value={quantityInput}
                      onChangeText={setQuantityInput}
                      keyboardType="numeric"
                      placeholder="e.g. 150"
                      placeholderTextColor="#64748B"
                    />
                  </View>

                  <TouchableOpacity
                    onPress={handleAddIngredient}
                    style={styles.addBtn}
                    activeOpacity={0.8}
                  >
                    <Plus size={16} color="#FFFFFF" />
                    <Text style={styles.addBtnText}>Link</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer Save Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleSaveRecipe}
              style={styles.saveBtn}
              activeOpacity={0.8}
            >
              <Check size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Save Recipe BOM</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: 13,
    color: '#F97316',
    marginTop: 2,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#0F172A',
  },
  costBanner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  costBannerLabel: {
    fontSize: 10,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  costBannerValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  emptyBox: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  ingredientUnit: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  deleteBtn: {
    padding: 6,
  },
  addSection: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 10,
    marginTop: 10,
  },
  rawPickerScroll: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  rawChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  rawChipSelected: {
    borderColor: '#F97316',
    backgroundColor: '#7C2D1230',
  },
  rawChipText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  label: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 4,
  },
  qtyInput: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#F8FAFC',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F97316',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footer: {
    padding: 16,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F97316',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
