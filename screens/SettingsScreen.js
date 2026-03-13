import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { exportData, importData } from '../utils/exportImport';
import { getAllProducts } from '../database/productQueries';
import { getAllCustomers } from '../database/customerQueries';
import { getAllBills } from '../database/billQueries';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [stats, setStats] = useState({
    products: 0,
    customers: 0,
    bills: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const products = await getAllProducts();
    const customers = await getAllCustomers();
    const bills = await getAllBills();
    setStats({
      products: products.length,
      customers: customers.length,
      bills: bills.length,
    });
  };

  // ─── EXPORT ───────────────────────────────
  const handleExport = async () => {
    Alert.alert(
      '📤 Export Data',
      `This will export:\n• ${stats.products} products\n• ${stats.customers} customers\n• ${stats.bills} bills\n\nYou can save or share the backup file.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            setLoading(true);
            setLoadingMsg('Exporting data...');
            const result = await exportData();
            setLoading(false);
            if (result.success) {
              Alert.alert(
                '✅ Export Successful',
                `Exported:\n• ${result.counts.products} products\n• ${result.counts.customers} customers\n• ${result.counts.bills} bills`
              );
            } else {
              Alert.alert('❌ Export Failed', result.error);
            }
          },
        },
      ]
    );
  };

  // ─── IMPORT ───────────────────────────────
  const handleImport = () => {
    Alert.alert(
      '📥 Import Data',
      'How do you want to import?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: '🔀 Merge',
          onPress: () => confirmImport('merge'),
        },
        {
          text: '🔄 Replace All',
          style: 'destructive',
          onPress: () => confirmImport('replace'),
        },
      ]
    );
  };

  const confirmImport = (mode) => {
    const isReplace = mode === 'replace';
    Alert.alert(
      isReplace ? '⚠️ Replace All Data?' : '🔀 Merge Data?',
      isReplace
        ? 'This will DELETE all existing data and replace it with the backup. This cannot be undone!'
        : 'This will add new data from backup while keeping your existing data. Duplicates will be skipped.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isReplace ? 'Yes, Replace' : 'Yes, Merge',
          style: isReplace ? 'destructive' : 'default',
          onPress: () => runImport(mode),
        },
      ]
    );
  };

  const runImport = async (mode) => {
    setLoading(true);
    setLoadingMsg('Importing data...');
    const result = await importData(mode);
    setLoading(false);

    if (result.canceled) return;

    if (result.success) {
      await loadStats();
      Alert.alert(
        '✅ Import Successful',
        `Imported:\n• ${result.counts.products} products\n• ${result.counts.customers} customers\n• ${result.counts.bills} bills`
      );
    } else {
      Alert.alert('❌ Import Failed', result.error);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚙️ Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* App Stats */}
        <Text style={styles.sectionTitle}>📊 App Data</Text>
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>📦 Products</Text>
            <Text style={styles.statValue}>{stats.products}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>👥 Customers</Text>
            <Text style={styles.statValue}>{stats.customers}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>🧾 Bills</Text>
            <Text style={styles.statValue}>{stats.bills}</Text>
          </View>
        </View>

        {/* Backup Section */}
        <Text style={styles.sectionTitle}>💾 Backup & Restore</Text>
        <View style={styles.card}>

          {/* Export Button */}
          <TouchableOpacity
            style={styles.exportBtn}
            onPress={handleExport}
            disabled={loading}
          >
            <Text style={styles.exportIcon}>📤</Text>
            <View style={styles.btnTextGroup}>
              <Text style={styles.btnTitle}>Export Data</Text>
              <Text style={styles.btnSubtitle}>Save backup as JSON file</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Import Button */}
          <TouchableOpacity
            style={styles.importBtn}
            onPress={handleImport}
            disabled={loading}
          >
            <Text style={styles.importIcon}>📥</Text>
            <View style={styles.btnTextGroup}>
              <Text style={styles.btnTitle}>Import Data</Text>
              <Text style={styles.btnSubtitle}>Restore from JSON backup file</Text>
            </View>
          </TouchableOpacity>

        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            💡 <Text style={styles.infoBold}>Merge</Text> — adds new data, keeps existing
          </Text>
          <Text style={styles.infoText}>
            💡 <Text style={styles.infoBold}>Replace</Text> — deletes everything, restores backup
          </Text>
          <Text style={styles.infoText}>
            💡 Export regularly to avoid data loss
          </Text>
        </View>

        {/* App Info */}
        <Text style={styles.sectionTitle}>ℹ️ App Info</Text>
        <View style={styles.card}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Version</Text>
            <Text style={styles.statValue}>1.0.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Built with</Text>
            <Text style={styles.statValue}>React Native + Expo</Text>
          </View>
        </View>

      </ScrollView>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>{loadingMsg}</Text>
          </View>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 16,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  statLabel: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 15,
    color: '#2563EB',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 14,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  exportIcon: {
    fontSize: 28,
  },
  importIcon: {
    fontSize: 28,
  },
  btnTextGroup: {
    flex: 1,
  },
  btnTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  btnSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: '700',
    color: '#2563EB',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '600',
  },
});