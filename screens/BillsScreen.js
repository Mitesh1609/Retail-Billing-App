import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAllBills, getBillItems } from '../database/billQueries';
import { generateAndSharePDF } from '../utils/pdfGenerator';
import { formatCurrency } from '../utils/formatters';
import PrinterModal from '../components/PrinterModal';

export default function BillsScreen() {
  const insets = useSafeAreaInsets();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  const [billItems, setBillItems] = useState([]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [printerModalVisible, setPrinterModalVisible] = useState(false);

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    setLoading(true);
    const data = await getAllBills();
    setBills(data);
    setLoading(false);
  };

  const openBillDetail = async (bill) => {
    setSelectedBill(bill);
    setLoadingItems(true);
    setDetailModalVisible(true);
    const items = await getBillItems(bill.id);
    setBillItems(items);
    setLoadingItems(false);
  };

  const handleReshare = async () => {
    if (!selectedBill) return;
    await generateAndSharePDF(
      selectedBill.bill_number,
      selectedBill.customer_name || 'Walk-in Customer',
      billItems,
      selectedBill.total_amount,
      selectedBill.discount,
      selectedBill.final_amount,
      selectedBill.payment_method
    );
  };

  const handlePrint = () => {
    if (!selectedBill) return;
    setDetailModalVisible(false);
    setPrinterModalVisible(true);
  };

  const getPrintBillData = () => {
    if (!selectedBill) return null;
    return {
      billNumber: selectedBill.bill_number,
      customerName: selectedBill.customer_name || 'Walk-in Customer',
      items: billItems,
      totalAmount: selectedBill.total_amount,
      discount: selectedBill.discount,
      finalAmount: selectedBill.final_amount,
      paymentMethod: selectedBill.payment_method,
      date: formatDate(selectedBill.created_at),
    };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderBill = ({ item }) => (
    <TouchableOpacity
      style={styles.billCard}
      onPress={() => openBillDetail(item)}
    >
      <View style={styles.billLeft}>
        <Text style={styles.billNumber}>{item.bill_number}</Text>
        <Text style={styles.billCustomer}>
          👤 {item.customer_name || 'Walk-in Customer'}
        </Text>
        <Text style={styles.billDate}>
          📅 {formatDate(item.created_at)} · {formatTime(item.created_at)}
        </Text>
      </View>
      <View style={styles.billRight}>
        <Text style={styles.billAmount}>
          {formatCurrency(item.final_amount)}
        </Text>
        <View style={styles.paymentBadge}>
          <Text style={styles.paymentBadgeText}>{item.payment_method}</Text>
        </View>
        <Text style={styles.viewDetails}>View →</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🧾 Bills History</Text>
        <Text style={styles.headerSubtitle}>{bills.length} total bills</Text>
      </View>

      {/* Bills List */}
      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
      ) : bills.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No bills yet!</Text>
          <Text style={styles.emptySubText}>
            Generate your first bill to see it here
          </Text>
        </View>
      ) : (
        <FlatList
          data={bills}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderBill}
          contentContainerStyle={{ paddingBottom: 30 }}
        />
      )}

      {/* Bill Detail Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalBillNumber}>
                  {selectedBill?.bill_number}
                </Text>
                <Text style={styles.modalDate}>
                  {selectedBill ? formatDate(selectedBill.created_at) : ''}
                  {' · '}
                  {selectedBill ? formatTime(selectedBill.created_at) : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setDetailModalVisible(false)}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Customer & Payment */}
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                👤 {selectedBill?.customer_name || 'Walk-in Customer'}
              </Text>
              <View style={styles.paymentBadge}>
                <Text style={styles.paymentBadgeText}>
                  {selectedBill?.payment_method}
                </Text>
              </View>
            </View>

            {/* Items */}
            <Text style={styles.itemsTitle}>Items</Text>
            {loadingItems ? (
              <ActivityIndicator size="small" color="#2563EB" />
            ) : (
              <>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, { flex: 2 }]}>Item</Text>
                  <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Qty</Text>
                  <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Price</Text>
                  <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Total</Text>
                </View>

                {/* Table Rows */}
                {billItems.map((item) => (
                  <View key={item.id} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>{item.product_name}</Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>{item.quantity}</Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                      {formatCurrency(item.price)}
                    </Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'right', fontWeight: '700' }]}>
                      {formatCurrency(item.subtotal)}
                    </Text>
                  </View>
                ))}
              </>
            )}

            {/* Totals */}
            <View style={styles.totals}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(selectedBill?.total_amount || 0)}
                </Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount</Text>
                <Text style={styles.totalValue}>
                  − {formatCurrency(selectedBill?.discount || 0)}
                </Text>
              </View>
              <View style={[styles.totalRow, styles.finalRow]}>
                <Text style={styles.finalLabel}>Final Amount</Text>
                <Text style={styles.finalValue}>
                  {formatCurrency(selectedBill?.final_amount || 0)}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.printBtn}
                onPress={handlePrint}
              >
                <Text style={styles.printBtnText}>🖨️ Print Bill</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shareBtn}
                onPress={handleReshare}
              >
                <Text style={styles.shareBtnText}>📤 Share PDF</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

      <PrinterModal
        visible={printerModalVisible}
        onClose={() => setPrinterModalVisible(false)}
        billData={getPrintBillData()}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  billCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  billLeft: {
    flex: 1,
  },
  billNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  billCustomer: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 3,
  },
  billDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 3,
  },
  billRight: {
    alignItems: 'flex-end',
  },
  billAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563EB',
  },
  paymentBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    marginTop: 6,
  },
  paymentBadgeText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  viewDetails: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
  },
  emptySubText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
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
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalBillNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  modalDate: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  closeBtn: {
    backgroundColor: '#F3F4F6',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  metaText: {
    fontSize: 14,
    color: '#374151',
  },
  itemsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableCell: {
    fontSize: 13,
    color: '#374151',
  },
  totals: {
    marginTop: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  totalValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  finalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    marginTop: 4,
  },
  finalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  finalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2563EB',
  },
  shareBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  shareBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  printBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  printBtnText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '700',
  },
});