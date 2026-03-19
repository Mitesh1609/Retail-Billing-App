import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addProduct, updateProduct } from '../database/productQueries';
import { syncProducts } from '../utils/api';
import { getAllProducts } from '../database/productQueries';

export default function AddProductScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const editingProduct = route.params?.product || null;

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('');
  const [loading, setLoading] = useState(false);

  // If editing, prefill form with existing data
  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setPrice(editingProduct.price.toString());
      setCategory(editingProduct.category || '');
      setUnit(editingProduct.unit || '');
    }
  }, []);

  const handleSave = async () => {
    // Validations
    if (!name.trim()) {
      Alert.alert('Error', 'Product name is required!');
      return;
    }
    if (name.trim().length < 2) {
      Alert.alert('Error', 'Product name must be at least 2 characters!');
      return;
    }
    if (!price.trim() || isNaN(price) || parseFloat(price) <= 0) {
      Alert.alert('Error', 'Please enter a valid price!');
      return;
    }

    setLoading(true);
    try {
      if (editingProduct) {
        await updateProduct(
          editingProduct.id,
          name.trim(),
          parseFloat(price),
          category.trim(),
          unit.trim()
        );
        Alert.alert('Success', 'Product saved!', [
          {
            text: 'OK', onPress: async () => {
              // Sync to server
              const products = await getAllProducts();
              await syncProducts(products, global.pushToken);
              navigation.goBack();
            }
          },
        ]);
      } else {
        await addProduct(
          name.trim(),
          parseFloat(price),
          category.trim(),
          unit.trim()
        );
        Alert.alert('Success', 'Product added successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {editingProduct ? 'Edit Product' : 'Add Product'}
          </Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Form */}
        <ScrollView
          style={styles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.label}>Product Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Rice, Sugar, Soap"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
            autoFocus={!editingProduct}
          />

          <Text style={styles.label}>Price *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 50.00"
            placeholderTextColor="#9CA3AF"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Category</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Food, Electronics, Clothing"
            placeholderTextColor="#9CA3AF"
            value={category}
            onChangeText={setCategory}
          />

          <Text style={styles.label}>Unit</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. pcs, kg, litre, box"
            placeholderTextColor="#9CA3AF"
            value={unit}
            onChangeText={setUnit}
          />

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveBtnText}>
                {loading ? 'Saving...' : editingProduct ? 'Update' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 60,
  },
  backBtnText: {
    fontSize: 15,
    color: '#2563EB',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    marginBottom: 16,
    color: '#111827',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 32,
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: '#93C5FD',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});