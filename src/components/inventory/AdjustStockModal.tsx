import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { X, Check, AlertTriangle } from 'lucide-react-native';
import { Product } from '../../types/product';
import { useInventoryStore } from '../../store/useInventoryStore';

interface AdjustStockModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
}

export const AdjustStockModal: React.FC<AdjustStockModalProps> = ({
  visible,
  product,
  onClose,
}) => {
  const { adjustStock } = useInventoryStore();
  const [stockInput, setStockInput] = useState(product?.currentStock ? product.currentStock.toString() : '0');
  const [reason, setReason] = useState('Physical Stock Audit Count');

  if (!product) return null;

  const handleSave = () => {
    const qty = parseFloat(stockInput);
    if (isNaN(qty)) return;
    adjustStock(product.id, qty, reason);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Adjust Stock Count</Text>
              <Text style={styles.subtitle}>{product.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.currentBox}>
              <Text style={styles.currentLabel}>Current System Stock:</Text>
              <Text style={styles.currentValue}>{product.currentStock} {product.unit}</Text>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>New Physical Stock Count ({product.unit}) *</Text>
              <TextInput
                style={styles.input}
                value={stockInput}
                onChangeText={setStockInput}
                keyboardType="numeric"
                autoFocus
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Reason for Adjustment</Text>
              <TextInput
                style={styles.input}
                value={reason}
                onChangeText={setReason}
                placeholder="Audit, damaged stock, supplier return"
                placeholderTextColor="#64748B"
              />
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={handleSave} style={styles.saveBtn} activeOpacity={0.8}>
              <Check size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Update Stock</Text>
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
    color: '#94A3B8',
    marginTop: 2,
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
  currentBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  currentLabel: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  currentValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#38BDF8',
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
    backgroundColor: '#38BDF8',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
});
