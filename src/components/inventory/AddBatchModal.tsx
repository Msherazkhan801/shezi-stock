import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { X, Plus, Calendar, Save } from 'lucide-react-native';
import { Product, BatchRecord } from '../../types/product';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useAppStore } from '../../store/useAppStore';

interface AddBatchModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
}

export const AddBatchModal: React.FC<AddBatchModalProps> = ({
  visible,
  product,
  onClose,
}) => {
  const { tenant } = useAppStore();
  const { addBatchToProduct } = useInventoryStore();

  const [batchNumber, setBatchNumber] = useState(`BTH-${Math.floor(1000 + Math.random() * 9000)}`);
  const [expiryDate, setExpiryDate] = useState('2027-12-31');
  const [quantity, setQuantity] = useState('50');
  const [costPrice, setCostPrice] = useState(product?.costPrice ? product.costPrice.toString() : '5.00');
  const [sellingPrice, setSellingPrice] = useState(product?.sellingPrice ? product.sellingPrice.toString() : '9.00');
  const [supplier, setSupplier] = useState(product?.manufacturer || 'Main Distro');

  if (!product) return null;

  const handleSave = () => {
    if (!batchNumber || !expiryDate || !quantity) return;

    addBatchToProduct(product.id, {
      batchNumber: batchNumber.trim(),
      expiryDate: expiryDate.trim(),
      quantity: parseFloat(quantity) || 0,
      costPrice: parseFloat(costPrice) || 0,
      sellingPrice: parseFloat(sellingPrice) || 0,
      supplier: supplier.trim(),
    });

    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Add New Batch</Text>
              <Text style={styles.subtitle}>{product.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.content}>
            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1.2 }]}>
                <Text style={styles.label}>Batch Number *</Text>
                <TextInput
                  style={styles.input}
                  value={batchNumber}
                  onChangeText={setBatchNumber}
                  placeholder="e.g. BTH-909"
                  placeholderTextColor="#64748B"
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1.2 }]}>
                <Text style={styles.label}>Expiry Date (YYYY-MM-DD) *</Text>
                <TextInput
                  style={styles.input}
                  value={expiryDate}
                  onChangeText={setExpiryDate}
                  placeholder="2027-12-31"
                  placeholderTextColor="#64748B"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Quantity Received ({product.unit})</Text>
                <TextInput
                  style={styles.input}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  placeholderTextColor="#64748B"
                />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Selling Price ({tenant.currencySymbol})</Text>
                <TextInput
                  style={styles.input}
                  value={sellingPrice}
                  onChangeText={setSellingPrice}
                  keyboardType="numeric"
                  placeholderTextColor="#64748B"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Distributor / Supplier</Text>
              <TextInput
                style={styles.input}
                value={supplier}
                onChangeText={setSupplier}
                placeholder="Pharma Logistics Ltd"
                placeholderTextColor="#64748B"
              />
            </View>
          </View>

          {/* Footer Save Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleSave}
              style={styles.saveBtn}
              activeOpacity={0.8}
            >
              <Save size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Save Batch</Text>
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
    color: '#10B981',
    marginTop: 2,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#0F172A',
  },
  content: {
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldGroup: {
    gap: 4,
  },
  label: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
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
    backgroundColor: '#10B981',
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
