import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Text,
} from 'react-native';
import { Search, X, ScanBarcode } from 'lucide-react-native';

interface SearchBarProps {
  query: string;
  onChangeQuery: (text: string) => void;
  placeholder?: string;
  categories?: string[];
  selectedCategory?: string;
  onSelectCategory?: (cat: string) => void;
  onPressBarcodeScanner?: () => void;
  accentColor?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onChangeQuery,
  placeholder = 'Search by name, SKU, or barcode...',
  categories = [],
  selectedCategory,
  onSelectCategory,
  onPressBarcodeScanner,
  accentColor = '#38BDF8',
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <Search size={18} color="#94A3B8" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={onChangeQuery}
          placeholder={placeholder}
          placeholderTextColor="#64748B"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => onChangeQuery('')} style={styles.clearBtn}>
            <X size={16} color="#94A3B8" />
          </TouchableOpacity>
        )}
        {onPressBarcodeScanner && (
          <TouchableOpacity
            onPress={onPressBarcodeScanner}
            style={[styles.barcodeBtn, { backgroundColor: `${accentColor}25` }]}
            activeOpacity={0.7}
          >
            <ScanBarcode size={18} color={accentColor} />
          </TouchableOpacity>
        )}
      </View>

      {categories.length > 0 && onSelectCategory && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => onSelectCategory(cat)}
                style={[
                  styles.categoryChip,
                  isSelected && {
                    backgroundColor: accentColor,
                    borderColor: accentColor,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryText,
                    isSelected && { color: '#FFFFFF', fontWeight: '700' },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0F172A',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    height: 46,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
    height: '100%',
  },
  clearBtn: {
    padding: 4,
    marginRight: 4,
  },
  barcodeBtn: {
    padding: 6,
    borderRadius: 8,
    marginLeft: 4,
  },
  categoriesScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  categoryText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
});
