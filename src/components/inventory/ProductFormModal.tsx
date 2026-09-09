import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { X, Sparkles, Plus, Save } from 'lucide-react-native';
import { Product } from '../../types/product';
import { useAppStore } from '../../store/useAppStore';
import { INDUSTRY_PRESETS } from '../../config/industryPresets';
import { BarcodeService } from '../../services/barcodeService';

interface ProductFormModalProps {
  visible: boolean;
  initialProduct?: Product | null;
  onSave: (product: any) => void;
  onClose: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  visible,
  initialProduct,
  onSave,
  onClose,
}) => {
  const { tenant, activeIndustry } = useAppStore();
  const preset = INDUSTRY_PRESETS[activeIndustry];

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [minStockAlert, setMinStockAlert] = useState('10');
  const [unit, setUnit] = useState('pcs');

  // Pharmacy
  const [genericFormula, setGenericFormula] = useState('');
  const [dosageForm, setDosageForm] = useState('Tablet');
  const [requiresPrescription, setRequiresPrescription] = useState(false);
  const [manufacturer, setManufacturer] = useState('');
  const [initialBatchNo, setInitialBatchNo] = useState('');
  const [initialExpiryDate, setInitialExpiryDate] = useState('');

  // General Store
  const [rackLocation, setRackLocation] = useState('');
  const [bulkSku, setBulkSku] = useState('');
  const [cartonQuantity, setCartonQuantity] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [supplierName, setSupplierName] = useState('');

  // Restaurant
  const [itemType, setItemType] = useState<'prepared_dish' | 'raw_ingredient'>('prepared_dish');
  const [kitchenStation, setKitchenStation] = useState('Main Kitchen');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState('10');

  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name);
      setSku(initialProduct.sku);
      setBarcode(initialProduct.barcode);
      setCategory(initialProduct.category);
      setCostPrice(initialProduct.costPrice.toString());
      setSellingPrice(initialProduct.sellingPrice.toString());
      setCurrentStock(initialProduct.currentStock.toString());
      setMinStockAlert(initialProduct.minStockAlert.toString());
      setUnit(initialProduct.unit);

      // Pharmacy
      setGenericFormula(initialProduct.genericFormula || '');
      setDosageForm(initialProduct.dosageForm || 'Tablet');
      setRequiresPrescription(initialProduct.requiresPrescription || false);
      setManufacturer(initialProduct.manufacturer || '');

      // General Store
      setRackLocation(initialProduct.rackLocation || '');
      setBulkSku(initialProduct.bulkSku || '');
      setCartonQuantity(initialProduct.cartonQuantity ? initialProduct.cartonQuantity.toString() : '');
      setWholesalePrice(initialProduct.wholesalePrice ? initialProduct.wholesalePrice.toString() : '');
      setSupplierName(initialProduct.supplierName || '');

      // Restaurant
      setItemType(initialProduct.itemType || 'prepared_dish');
      setKitchenStation(initialProduct.kitchenStation || 'Main Kitchen');
      setPrepTimeMinutes(initialProduct.prepTimeMinutes ? initialProduct.prepTimeMinutes.toString() : '10');
    } else {
      // Defaults for new product
      setName('');
      setSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
      setBarcode(BarcodeService.generateBarcode());
      setCategory(activeIndustry === 'pharmacy' ? 'Antibiotics' : activeIndustry === 'restaurant' ? 'Main Course' : 'General');
      setCostPrice('5.00');
      setSellingPrice('8.50');
      setCurrentStock('50');
      setMinStockAlert('10');
      setUnit(activeIndustry === 'pharmacy' ? 'Strip' : activeIndustry === 'restaurant' ? 'serving' : 'pcs');

      // Pharmacy
      setGenericFormula('');
      setDosageForm('Tablet');
      setRequiresPrescription(false);
      setManufacturer('');
      setInitialBatchNo(`BTH-${Math.floor(100 + Math.random() * 900)}`);
      setInitialExpiryDate('2027-12-31');

      // General Store
      setRackLocation('Aisle 1 - Shelf A');
      setBulkSku('');
      setCartonQuantity('12');
      setWholesalePrice('7.00');
      setSupplierName('Prime Distro Co');

      // Restaurant
      setItemType('prepared_dish');
      setKitchenStation('Main Kitchen');
      setPrepTimeMinutes('10');
    }
  }, [initialProduct, visible, activeIndustry]);

  const handleSave = () => {
    if (!name.trim()) return;

    const baseProduct = {
      tenantId: tenant.id,
      branchId: tenant.activeBranchId,
      industry: activeIndustry,
      name: name.trim(),
      sku: sku.trim(),
      barcode: barcode.trim(),
      category: category.trim() || 'General',
      costPrice: parseFloat(costPrice) || 0,
      sellingPrice: parseFloat(sellingPrice) || 0,
      currentStock: parseFloat(currentStock) || 0,
      minStockAlert: parseFloat(minStockAlert) || 5,
      unit: unit.trim() || 'pcs',
      isActive: true,
    };

    let payload: any = { ...baseProduct };

    if (activeIndustry === 'pharmacy') {
      const batches = initialProduct?.batches || [];
      if (!initialProduct && initialBatchNo && initialExpiryDate) {
        batches.push({
          id: `batch-${Date.now()}`,
          batchNumber: initialBatchNo,
          expiryDate: initialExpiryDate,
          quantity: parseFloat(currentStock) || 0,
          costPrice: parseFloat(costPrice) || 0,
          sellingPrice: parseFloat(sellingPrice) || 0,
          supplier: manufacturer || 'Default Distro',
        });
      }
      payload = {
        ...payload,
        genericFormula,
        dosageForm,
        requiresPrescription,
        manufacturer,
        batches,
      };
    } else if (activeIndustry === 'general_store') {
      payload = {
        ...payload,
        rackLocation,
        bulkSku,
        cartonQuantity: cartonQuantity ? parseInt(cartonQuantity) : undefined,
        wholesalePrice: wholesalePrice ? parseFloat(wholesalePrice) : undefined,
        supplierName,
      };
    } else if (activeIndustry === 'restaurant') {
      payload = {
        ...payload,
        itemType,
        kitchenStation,
        prepTimeMinutes: parseInt(prepTimeMinutes) || 10,
        recipe: initialProduct?.recipe || [],
      };
    }

    onSave(payload);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                {initialProduct ? 'Edit Product' : 'Add New Item'}
              </Text>
              <Text style={styles.subtitle}>{preset.title} Schema</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Form Fields Scroll */}
          <ScrollView style={styles.formScroll} contentContainerStyle={styles.formContent}>
            {/* Universal Basic Information */}
            <Text style={styles.sectionHeader}>Basic Product Info</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Product / Item Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Augmentin 625mg / Basmati Rice 5kg"
                placeholderTextColor="#64748B"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Category</Text>
                <TextInput
                  style={styles.input}
                  value={category}
                  onChangeText={setCategory}
                  placeholder="e.g. Antibiotics, Staples, Mains"
                  placeholderTextColor="#64748B"
                />
              </View>
              <View style={[styles.fieldGroup, { width: 100 }]}>
                <Text style={styles.label}>Unit</Text>
                <TextInput
                  style={styles.input}
                  value={unit}
                  onChangeText={setUnit}
                  placeholder="pcs, box, kg"
                  placeholderTextColor="#64748B"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>SKU</Text>
                <TextInput
                  style={styles.input}
                  value={sku}
                  onChangeText={setSku}
                  placeholderTextColor="#64748B"
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1.2 }]}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Barcode</Text>
                  <TouchableOpacity
                    onPress={() => setBarcode(BarcodeService.generateBarcode())}
                  >
                    <Text style={styles.autoGenText}>✨ Auto</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={styles.input}
                  value={barcode}
                  onChangeText={setBarcode}
                  placeholderTextColor="#64748B"
                />
              </View>
            </View>

            {/* Financials & Stock */}
            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Cost Price ({tenant.currencySymbol})</Text>
                <TextInput
                  style={styles.input}
                  value={costPrice}
                  onChangeText={setCostPrice}
                  keyboardType="numeric"
                  placeholderTextColor="#64748B"
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Selling Price ({tenant.currencySymbol}) *</Text>
                <TextInput
                  style={[styles.input, { borderColor: preset.accentColor }]}
                  value={sellingPrice}
                  onChangeText={setSellingPrice}
                  keyboardType="numeric"
                  placeholderTextColor="#64748B"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Initial Stock</Text>
                <TextInput
                  style={styles.input}
                  value={currentStock}
                  onChangeText={setCurrentStock}
                  keyboardType="numeric"
                  placeholderTextColor="#64748B"
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Low Stock Alert</Text>
                <TextInput
                  style={styles.input}
                  value={minStockAlert}
                  onChangeText={setMinStockAlert}
                  keyboardType="numeric"
                  placeholderTextColor="#64748B"
                />
              </View>
            </View>

            {/* --- SECTOR SPECIFIC FIELDS --- */}
            {activeIndustry === 'pharmacy' && (
              <View style={styles.sectorSection}>
                <Text style={[styles.sectionHeader, { color: '#10B981' }]}>
                  💊 Pharmacy Specific Metrics
                </Text>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Generic Chemical Formula / Salt</Text>
                  <TextInput
                    style={styles.input}
                    value={genericFormula}
                    onChangeText={setGenericFormula}
                    placeholder="e.g. Amoxicillin + Clavulanic Acid"
                    placeholderTextColor="#64748B"
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Dosage Form</Text>
                    <TextInput
                      style={styles.input}
                      value={dosageForm}
                      onChangeText={setDosageForm}
                      placeholder="Tablet, Syrup, Injection"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Manufacturer</Text>
                    <TextInput
                      style={styles.input}
                      value={manufacturer}
                      onChangeText={setManufacturer}
                      placeholder="GSK, Pfizer, Abbott"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                </View>

                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Requires Doctor Prescription (Rx)</Text>
                  <Switch
                    value={requiresPrescription}
                    onValueChange={setRequiresPrescription}
                    trackColor={{ false: '#334155', true: '#10B981' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {!initialProduct && (
                  <View style={styles.row}>
                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                      <Text style={styles.label}>Initial Batch No.</Text>
                      <TextInput
                        style={styles.input}
                        value={initialBatchNo}
                        onChangeText={setInitialBatchNo}
                        placeholder="BTH-101"
                        placeholderTextColor="#64748B"
                      />
                    </View>
                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                      <Text style={styles.label}>Expiry Date (YYYY-MM-DD)</Text>
                      <TextInput
                        style={styles.input}
                        value={initialExpiryDate}
                        onChangeText={setInitialExpiryDate}
                        placeholder="2027-12-31"
                        placeholderTextColor="#64748B"
                      />
                    </View>
                  </View>
                )}
              </View>
            )}

            {activeIndustry === 'general_store' && (
              <View style={styles.sectorSection}>
                <Text style={[styles.sectionHeader, { color: '#6366F1' }]}>
                  🏬 Retail & Wholesale Warehouse Metrics
                </Text>

                <View style={styles.row}>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Rack / Aisle Location</Text>
                    <TextInput
                      style={styles.input}
                      value={rackLocation}
                      onChangeText={setRackLocation}
                      placeholder="e.g. Aisle 3 - Shelf B2"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Wholesale Price ({tenant.currencySymbol})</Text>
                    <TextInput
                      style={styles.input}
                      value={wholesalePrice}
                      onChangeText={setWholesalePrice}
                      keyboardType="numeric"
                      placeholder="e.g. 7.50"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Units per Master Carton</Text>
                    <TextInput
                      style={styles.input}
                      value={cartonQuantity}
                      onChangeText={setCartonQuantity}
                      keyboardType="numeric"
                      placeholder="e.g. 24"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Supplier Name</Text>
                    <TextInput
                      style={styles.input}
                      value={supplierName}
                      onChangeText={setSupplierName}
                      placeholder="Supplier / Mill"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                </View>
              </View>
            )}

            {activeIndustry === 'restaurant' && (
              <View style={styles.sectorSection}>
                <Text style={[styles.sectionHeader, { color: '#F97316' }]}>
                  🍽️ Kitchen & Recipe Metrics
                </Text>

                <View style={styles.row}>
                  <TouchableOpacity
                    style={[
                      styles.typeSelectorBtn,
                      itemType === 'prepared_dish' && styles.typeSelectorActive,
                    ]}
                    onPress={() => setItemType('prepared_dish')}
                  >
                    <Text
                      style={[
                        styles.typeSelectorText,
                        itemType === 'prepared_dish' && { color: '#F97316', fontWeight: '800' },
                      ]}
                    >
                      Prepared Dish (With BOM)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.typeSelectorBtn,
                      itemType === 'raw_ingredient' && styles.typeSelectorActive,
                    ]}
                    onPress={() => setItemType('raw_ingredient')}
                  >
                    <Text
                      style={[
                        styles.typeSelectorText,
                        itemType === 'raw_ingredient' && { color: '#F97316', fontWeight: '800' },
                      ]}
                    >
                      Raw Ingredient
                    </Text>
                  </TouchableOpacity>
                </View>

                {itemType === 'prepared_dish' && (
                  <View style={styles.row}>
                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                      <Text style={styles.label}>Kitchen Station</Text>
                      <TextInput
                        style={styles.input}
                        value={kitchenStation}
                        onChangeText={setKitchenStation}
                        placeholder="Grill, Fryer, Bar, Main"
                        placeholderTextColor="#64748B"
                      />
                    </View>
                    <View style={[styles.fieldGroup, { width: 110 }]}>
                      <Text style={styles.label}>Prep (Mins)</Text>
                      <TextInput
                        style={styles.input}
                        value={prepTimeMinutes}
                        onChangeText={setPrepTimeMinutes}
                        keyboardType="numeric"
                        placeholderTextColor="#64748B"
                      />
                    </View>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Footer Save Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveBtn, { backgroundColor: preset.accentColor }]}
              activeOpacity={0.8}
            >
              <Save size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Save Product</Text>
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
    height: '90%',
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
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#0F172A',
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    padding: 16,
    gap: 12,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 6,
    marginBottom: 4,
  },
  fieldGroup: {
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  autoGenText: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  sectorSection: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 10,
    marginTop: 6,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  switchLabel: {
    fontSize: 13,
    color: '#F8FAFC',
    fontWeight: '600',
  },
  typeSelectorBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  typeSelectorActive: {
    borderColor: '#F97316',
    backgroundColor: '#7C2D1230',
  },
  typeSelectorText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
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
