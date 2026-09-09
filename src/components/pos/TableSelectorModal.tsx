import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { X, Check, Utensils, ShoppingBag, Truck } from 'lucide-react-native';
import { OrderType } from '../../types/sale';

interface TableSelectorModalProps {
  visible: boolean;
  selectedTable: string;
  orderType: OrderType;
  onSelectTable: (table: string, type: OrderType) => void;
  onClose: () => void;
}

const TABLES = [
  'Table 1', 'Table 2', 'Table 3', 'Table 4',
  'Table 5', 'Table 6', 'Table 7', 'Table 8',
  'Patio 1', 'Patio 2', 'Patio 3', 'VIP Lounge',
];

export const TableSelectorModal: React.FC<TableSelectorModalProps> = ({
  visible,
  selectedTable,
  orderType,
  onSelectTable,
  onClose,
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Dining & Order Mode</Text>
              <Text style={styles.subtitle}>Select Dine-in Table or Order Type</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Quick Order Type Selector */}
          <View style={styles.orderTypesRow}>
            <TouchableOpacity
              style={[
                styles.orderTypeCard,
                orderType === 'dine_in' && styles.orderTypeCardActive,
              ]}
              onPress={() => onSelectTable(selectedTable || 'Table 1', 'dine_in')}
            >
              <Utensils size={18} color={orderType === 'dine_in' ? '#F97316' : '#94A3B8'} />
              <Text
                style={[
                  styles.orderTypeText,
                  orderType === 'dine_in' && { color: '#F97316', fontWeight: '700' },
                ]}
              >
                Dine-In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.orderTypeCard,
                orderType === 'takeaway' && styles.orderTypeCardActive,
              ]}
              onPress={() => {
                onSelectTable('Takeaway', 'takeaway');
                onClose();
              }}
            >
              <ShoppingBag size={18} color={orderType === 'takeaway' ? '#F97316' : '#94A3B8'} />
              <Text
                style={[
                  styles.orderTypeText,
                  orderType === 'takeaway' && { color: '#F97316', fontWeight: '700' },
                ]}
              >
                Takeaway
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.orderTypeCard,
                orderType === 'delivery' && styles.orderTypeCardActive,
              ]}
              onPress={() => {
                onSelectTable('Delivery', 'delivery');
                onClose();
              }}
            >
              <Truck size={18} color={orderType === 'delivery' ? '#F97316' : '#94A3B8'} />
              <Text
                style={[
                  styles.orderTypeText,
                  orderType === 'delivery' && { color: '#F97316', fontWeight: '700' },
                ]}
              >
                Delivery
              </Text>
            </TouchableOpacity>
          </View>

          {orderType === 'dine_in' && (
            <>
              <Text style={styles.sectionLabel}>Dine-in Table Floorplan</Text>
              <ScrollView contentContainerStyle={styles.tableGrid}>
                {TABLES.map((table) => {
                  const isSelected = selectedTable === table;
                  return (
                    <TouchableOpacity
                      key={table}
                      style={[
                        styles.tableCard,
                        isSelected && styles.tableCardSelected,
                      ]}
                      onPress={() => {
                        onSelectTable(table, 'dine_in');
                        onClose();
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.tableCardText,
                          isSelected && { color: '#F97316', fontWeight: '800' },
                        ]}
                      >
                        {table}
                      </Text>
                      {isSelected && <Check size={14} color="#F97316" style={{ marginTop: 2 }} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}
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
  orderTypesRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
  },
  orderTypeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  orderTypeCardActive: {
    borderColor: '#F97316',
    backgroundColor: '#7C2D1220',
  },
  orderTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  tableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
  },
  tableCard: {
    width: '30%',
    aspectRatio: 1.4,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableCardSelected: {
    borderColor: '#F97316',
    backgroundColor: '#7C2D1230',
  },
  tableCardText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
});
