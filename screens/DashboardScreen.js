import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTodaySummary, getMonthlySummary, getAllBills } from '../database/billQueries';
import { formatCurrency } from '../utils/formatters';
import { useFocusEffect } from '@react-navigation/native';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [todaySummary, setTodaySummary] = useState({ totalBills: 0, totalSales: 0 });
  const [monthlySummary, setMonthlySummary] = useState({ totalBills: 0, totalSales: 0 });
  const [recentBills, setRecentBills] = useState([]);

  // Reload data every time screen is focused
  useFocusEffect(
      useCallback(() => {
        loadData();
      }, [])
    );

  const loadData = async () => {
    setLoading(true);
    try {
      const today = await getTodaySummary();
      const monthly = await getMonthlySummary();
      const bills = await getAllBills();

      setTodaySummary({
        totalBills: today?.totalBills || 0,
        totalSales: today?.totalSales || 0,
      });
      setMonthlySummary({
        totalBills: monthly?.totalBills || 0,
        totalSales: monthly?.totalSales || 0,
      });
      setRecentBills(bills.slice(0, 5)); // Only show last 5 bills
    } catch (error) {
      console.log('Dashboard error:', error);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏪 Dashboard</Text>
        <Text style={styles.headerSubtitle}>Pull down to refresh</Text>
      </View>

      {/* ── Today's Stats ── */}
      <Text style={styles.sectionTitle}>📅 Today</Text>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
          <Text style={styles.statIcon}>💰</Text>
          <Text style={styles.statValue}>
            {formatCurrency(todaySummary.totalSales || 0)}
          </Text>
          <Text style={styles.statLabel}>Sales</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#F0FDF4' }]}>
          <Text style={styles.statIcon}>🧾</Text>
          <Text style={styles.statValue}>{todaySummary.totalBills}</Text>
          <Text style={styles.statLabel}>Bills</Text>
        </View>
      </View>

      {/* ── Monthly Stats ── */}
      <Text style={styles.sectionTitle}>📆 This Month</Text>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#FFF7ED' }]}>
          <Text style={styles.statIcon}>📈</Text>
          <Text style={styles.statValue}>
            {formatCurrency(monthlySummary.totalSales || 0)}
          </Text>
          <Text style={styles.statLabel}>Sales</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FDF4FF' }]}>
          <Text style={styles.statIcon}>📋</Text>
          <Text style={styles.statValue}>{monthlySummary.totalBills}</Text>
          <Text style={styles.statLabel}>Bills</Text>
        </View>
      </View>

      {/* ── Recent Bills ── */}
      <Text style={styles.sectionTitle}>🕒 Recent Bills</Text>
      {recentBills.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No bills yet!</Text>
          <Text style={styles.emptySubText}>Generate your first bill to see it here</Text>
        </View>
      ) : (
        recentBills.map((bill) => (
          <View key={bill.id} style={styles.billCard}>
            <View style={styles.billLeft}>
              <Text style={styles.billNumber}>{bill.bill_number}</Text>
              <Text style={styles.billCustomer}>
                👤 {bill.customer_name || 'Walk-in Customer'}
              </Text>
              <Text style={styles.billDate}>📅 {formatDate(bill.created_at)}</Text>
            </View>
            <View style={styles.billRight}>
              <Text style={styles.billAmount}>
                {formatCurrency(bill.final_amount)}
              </Text>
              <View style={styles.paymentBadge}>
                <Text style={styles.paymentBadgeText}>{bill.payment_method}</Text>
              </View>
            </View>
          </View>
        ))
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 10,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
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
  emptyState: {
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  emptySubText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 6,
    textAlign: 'center',
  },
});