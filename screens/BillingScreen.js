import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAllProducts } from '../database/productQueries';
import { getAllCustomers } from '../database/customerQueries';
import { saveBill } from '../database/billQueries';
import { formatCurrency } from '../utils/formatters';
import { generateAndSharePDF } from '../utils/pdfGenerator';

export default function BillingScreen() {
  const insets = useSafeAreaInsets();

  // Data
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Cart
  const [cart, setCart] = useState([]); // { id, name, price, quantity, subtotal }

  // Selected customer
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Search
  const [productSearch, setProductSearch] = useState('');

  // Discount
  const [discount, setDiscount] = useState('0');

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Modals
  const [customerModalVisible, setCustomerModalVisible] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);

  const [allProducts, setAllProducts] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);

  // Load data on screen open
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
      const p = await getAllProducts();
      const c = await getAllCustomers();
      setAllProducts(p);
      setAllCustomers(c);
      setProducts(p);
      setCustomers(c);
   };

  const handleProductSearch = (text) => {
      setProductSearch(text);
      if (text.trim() === '') {
        setProducts(allProducts);
      } else {
        const filtered = allProducts.filter(p =>
          p.name.toLowerCase().includes(text.toLowerCase())
        );
        setProducts(filtered);
      }
    };

  // ─── CART FUNCTIONS ───────────────────────────────

  const addToCart = (product) => {
    // Check if product already in cart
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      // Increase quantity
      setCart(cart.map((item) =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      // Add new item
      setCart([...cart, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        subtotal: product.price,
      }]);
    }
    setProductModalVisible(false);
    setProductSearch('');
  };

  const increaseQty = (id) => {
    setCart(cart.map((item) =>
      item.id === id
        ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
        : item
    ));
  };

  const decreaseQty = (id) => {
    const item = cart.find((i) => i.id === id);
    if (item.quantity === 1) {
      // Remove from cart
      setCart(cart.filter((i) => i.id !== id));
    } else {
      setCart(cart.map((i) =>
        i.id === id
          ? { ...i, quantity: i.quantity - 1, subtotal: (i.quantity - 1) * i.price }
          : i
      ));
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  // ─── TOTALS ───────────────────────────────────────

  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const discountAmount = parseFloat(discount) || 0;
  const finalAmount = totalAmount - discountAmount;

  // ─── SAVE BILL ────────────────────────────────────

  const handleGenerateBill = async () => {
      if (cart.length === 0) {
        Alert.alert('Error', 'Please add at least one product to the bill');
        return;
      }
      if (finalAmount < 0) {
        Alert.alert('Error', 'Discount cannot be more than total amount');
        return;
      }

      const billData = {
        customerName: selectedCustomer ? selectedCustomer.name : 'Walk-in Customer',
        totalAmount,
        discount: discountAmount,
        finalAmount,
        paymentMethod,
      };

      // Save bill to database
      const billNumber = await saveBill(billData, cart);

      // Ask user what to do next
      Alert.alert(
        '✅ Bill Generated!',
        `Bill ${billNumber}\nAmount: ${formatCurrency(finalAmount)}`,
        [
          {
            text: '📤 Share PDF',
            onPress: async () => {
              await generateAndSharePDF(
                billNumber,
                billData.customerName,
                cart,
                totalAmount,
                discountAmount,
                finalAmount,
                paymentMethod
              );
              resetBill();
            },
          },
          {
            text: '🧾 New Bill',
            onPress: resetBill,
          },
        ]
      );
    };

    const resetBill = () => {
      setCart([]);
      setSelectedCustomer(null);
      setDiscount('0');
      setPaymentMethod('Cash');
    };

  // ─── RENDER ───────────────────────────────────────

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 180 }}>

        {/* ── Customer Selector ── */}
        <Text style={styles.sectionTitle}>👤 Customer</Text>
        <TouchableOpacity
          style={styles.customerSelector}
          onPress={() => {
              loadData();
              setCustomerModalVisible(true);
            }}
        >
          <Text style={selectedCustomer ? styles.customerSelected : styles.customerPlaceholder}>
            {selectedCustomer ? selectedCustomer.name : 'Select Customer (Optional)'}
          </Text>
          {selectedCustomer && (
            <TouchableOpacity onPress={() => setSelectedCustomer(null)}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* ── Add Products ── */}
        <Text style={styles.sectionTitle}>📦 Products</Text>
        <TouchableOpacity
          style={styles.addProductBtn}
          onPress={() => {
              loadData();
              setProductModalVisible(true);
            }}
        >
          <Text style={styles.addProductBtnText}>+ Add Product</Text>
        </TouchableOpacity>

        {/* ── Cart ── */}
        {cart.length === 0 ? (
          <View style={styles.emptyCart}>
            <Text style={styles.emptyCartText}>No products added yet</Text>
          </View>
        ) : (
          cart.map((item) => (
            <View key={item.id} style={styles.cartItem}>
              <View style={styles.cartItemInfo}>
                <Text style={styles.cartItemName}>{item.name}</Text>
                <Text style={styles.cartItemPrice}>{formatCurrency(item.price)} each</Text>
              </View>

              {/* Quantity Controls */}
              <View style={styles.qtyControls}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => decreaseQty(item.id)}>
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => increaseQty(item.id)}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.cartItemSubtotal}>{formatCurrency(item.subtotal)}</Text>

              <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                <Text style={styles.removeBtn}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* ── Discount ── */}
        <Text style={styles.sectionTitle}>🏷️ Discount</Text>
        <TextInput
          style={styles.discountInput}
          placeholder="Enter discount amount (₹)"
          placeholderTextColor="#9CA3AF"
          value={discount}
          onChangeText={setDiscount}
          keyboardType="numeric"
        />

        {/* ── Payment Method ── */}
        <Text style={styles.sectionTitle}>💳 Payment Method</Text>
        <View style={styles.paymentMethods}>
          {['Cash', 'UPI', 'Card'].map((method) => (
            <TouchableOpacity
              key={method}
              style={[
                styles.paymentBtn,
                paymentMethod === method && styles.paymentBtnActive,
              ]}
              onPress={() => setPaymentMethod(method)}
            >
              <Text style={[
                styles.paymentBtnText,
                paymentMethod === method && styles.paymentBtnTextActive,
              ]}>
                {method === 'Cash' ? '💵' : method === 'UPI' ? '📱' : '💳'} {method}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Bill Summary ── */}
        {cart.length > 0 && (
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totalAmount)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={styles.summaryValue}>− {formatCurrency(discountAmount)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.finalRow]}>
              <Text style={styles.finalLabel}>Final Amount</Text>
              <Text style={styles.finalValue}>{formatCurrency(finalAmount)}</Text>
            </View>
          </View>
        )}

      </ScrollView>

      {/* ── Generate Bill Button ── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[styles.generateBtn, cart.length === 0 && styles.generateBtnDisabled]}
          onPress={handleGenerateBill}
          disabled={cart.length === 0}
        >
          <Text style={styles.generateBtnText}>
            🧾 Generate Bill {cart.length > 0 ? `· ${formatCurrency(finalAmount)}` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Customer Modal ── */}
      <Modal visible={customerModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Customer</Text>
            <FlatList
              data={customers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.customerOption}
                  onPress={() => {
                    setSelectedCustomer(item);
                    setCustomerModalVisible(false);
                  }}
                >
                  <View style={styles.customerAvatar}>
                    <Text style={styles.customerAvatarText}>
                      {item.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.customerOptionName}>{item.name}</Text>
                    {item.phone ? <Text style={styles.customerOptionPhone}>{item.phone}</Text> : null}
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyModalText}>No customers found</Text>
              }
            />
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setCustomerModalVisible(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Product Search Modal ── */}
      <Modal visible={productModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Product</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="🔍 Search products..."
              placeholderTextColor="#9CA3AF"
              value={productSearch}
              onChangeText={handleProductSearch}
              autoFocus
            />
            <FlatList
              data={products}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.productOption}
                  onPress={() => addToCart(item)}
                >
                  <View style={styles.productOptionInfo}>
                    <Text style={styles.productOptionName}>{item.name}</Text>
                    <Text style={styles.productOptionCategory}>
                      {item.category} · {item.unit}
                    </Text>
                  </View>
                  <Text style={styles.productOptionPrice}>{formatCurrency(item.price)}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyModalText}>No products found</Text>
              }
            />
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setProductModalVisible(false);
                setProductSearch('');
              }}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  customerSelector: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  customerSelected: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  customerPlaceholder: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  clearBtn: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '700',
  },
  addProductBtn: {
    backgroundColor: '#EFF6FF',
    marginHorizontal: 16,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',
  },
  addProductBtnText: {
    fontSize: 15,
    color: '#2563EB',
    fontWeight: '600',
  },
  emptyCart: {
    alignItems: 'center',
    padding: 20,
  },
  emptyCartText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  cartItem: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  cartItemPrice: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  qtyBtn: {
    backgroundColor: '#F3F4F6',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 18,
    color: '#374151',
    fontWeight: '700',
  },
  qtyText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: 'center',
  },
  cartItemSubtotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
    marginHorizontal: 8,
  },
  removeBtn: {
    fontSize: 18,
  },
  discountInput: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paymentMethods: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 10,
  },
  paymentBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  paymentBtnActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  paymentBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  paymentBtnTextActive: {
    color: '#fff',
  },
  summary: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  finalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
    marginTop: 4,
  },
  finalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  finalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563EB',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  generateBtn: {
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  generateBtnDisabled: {
    backgroundColor: '#93C5FD',
  },
  generateBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  customerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  customerAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563EB',
  },
  customerOptionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  customerOptionPhone: {
    fontSize: 13,
    color: '#6B7280',
  },
  productOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  productOptionInfo: {
    flex: 1,
  },
  productOptionName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  productOptionCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  productOptionPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2563EB',
  },
  emptyModalText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
    padding: 20,
  },
  cancelBtn: {
    marginTop: 12,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 15,
  },
});