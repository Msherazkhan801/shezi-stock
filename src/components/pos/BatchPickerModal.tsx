import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { X, Calendar, Check, AlertCircle } from 'lucide-react-native';
import { Product, BatchRecord } from '../../types/product';
import { Badge } from '../common/Badge';
import { useAppStore } from '../../store/useAppStore';

interface BatchPickerModalProps {
  visible: boolean;
  product: Product | null;
  selectedBatchId?: string;
  onSelectBatch: (batch: BatchRecord) => void;
  onClose: () => void;
}

export const BatchPickerModal: React.FC<BatchPickerModalProps> = ({
  visible,
  product,
  selectedBatchId,
  onSelectBatch,
  onClose,
}) => {
  const { tenant } = useAppStore();
  if (!product || !product.batches) return null;

  const today = new Date();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Select Batch (FEFO)</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {product.name}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Batches List */}
          <ScrollView contentContainerStyle={styles.list}>
            {product.batches.map((batch) => {
              const exp = new Date(batch.expiryDate);
              const daysLeft = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              const isExpired = daysLeft <= 0;
              const isExpiringSoon = daysLeft > 0 && daysLeft <= 60;
              const isSelected = selectedBatchId === batch.id;

              return (
                <TouchableOpacity
                  key={batch.id}
                  style={[
                    styles.batchCard,
                    isSelected && styles.batchCardSelected,
                    isExpired && styles.batchCardExpired,
                  ]}
                  onPress={() => {
                    onSelectBatch(batch);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.batchInfo}>
                    <View style={styles.batchHeaderRow}>
                      <Text style={styles.batchNo}>Batch #{batch.batchNumber}</Text>
                      {isExpired ? (
                        <Badge label="Expired" variant="danger" size="small" />
                      ) : isExpiringSoon ? (
                        <Badge label={`Expiring in ${daysLeft}d`} variant="warning" size="small" />
                      ) : (
                        <Badge label="Safe" variant="success" size="small" />
                      )}
                    </View>

                    <View style={styles.batchDetailsRow}>
                      <Text style={styles.detailText}>
                        <Calendar size={12} color="#94A3B8" /> Exp: {batch.expiryDate}
                      </Text>
                      <Text style={styles.detailText}>
                        Stock: <Text style={{ color: '#F8FAFC', fontWeight: '700' }}>{batch.quantity}</Text>
                      </Text>
                      <Text style={styles.detailText}>
                        Price: <Text style={{ color: '#10B981', fontWeight: '700' }}>{tenant.currencySymbol}{batch.sellingPrice.toFixed(2)}</Text>
                      </Text>
                    </View>
                  </View>

                  {isSelected && (
                    <View style={styles.checkIcon}>
                      <Check size={18} color="#10B981" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
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
    maxHeight: '75%',
    paddingBottom: 24,
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
  list: {
    padding: 16,
    gap: 12,
  },
  batchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  batchCardSelected: {
    borderColor: '#10B981',
    backgroundColor: '#064E3B20',
  },
  batchCardExpired: {
    borderColor: '#7F1D1D',
    opacity: 0.7,
  },
  batchInfo: {
    flex: 1,
  },
  batchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  batchNo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  batchDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  detailText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  checkIcon: {
    marginLeft: 12,
  },
});
