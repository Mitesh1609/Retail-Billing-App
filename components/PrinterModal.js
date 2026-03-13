import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { getPairedDevices, connectPrinter, printBill } from '../utils/bluetoothPrinter';

export default function PrinterModal({ visible, onClose, billData }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);

  // Load paired devices when modal opens
  const loadDevices = async () => {
    setLoading(true);
    try {
      const paired = await getPairedDevices();
      setDevices(paired);
    } catch (error) {
      Alert.alert('Error', 'Could not get Bluetooth devices. Make sure Bluetooth is ON.');
    } finally {
      setLoading(false);
    }
  };

  // Called when modal becomes visible
  const handleModalShow = () => {
    loadDevices();
  };

  // Connect and print
  const handlePrint = async (device) => {
    setSelectedDevice(device);
    setPrinting(true);
    try {
      // Connect to printer
      await connectPrinter(device.address);

      // Print the bill
      await printBill(billData);

      Alert.alert('Success', 'Bill printed successfully! 🎉');
      onClose();
    } catch (error) {
      Alert.alert('Print Failed', 'Could not print. Make sure printer is ON and nearby.');
    } finally {
      setPrinting(false);
      setSelectedDevice(null);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onShow={handleModalShow}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>🖨️ Select Printer</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Loading */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.loadingText}>Scanning for devices...</Text>
            </View>
          )}

          {/* Device list */}
          {!loading && devices.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No paired devices found!</Text>
              <Text style={styles.emptySubText}>
                Please pair your printer in Bluetooth settings first.
              </Text>
              <TouchableOpacity style={styles.retryBtn} onPress={loadDevices}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading && devices.length > 0 && (
            <>
              <Text style={styles.subtitle}>Paired Bluetooth Devices:</Text>
              <FlatList
                data={devices}
                keyExtractor={(item) => item.address}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.deviceItem}
                    onPress={() => handlePrint(item)}
                    disabled={printing}
                  >
                    <View style={styles.deviceInfo}>
                      <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
                      <Text style={styles.deviceAddress}>{item.address}</Text>
                    </View>
                    {printing && selectedDevice?.address === item.address ? (
                      <ActivityIndicator size="small" color="#2563EB" />
                    ) : (
                      <Text style={styles.printText}>Print</Text>
                    )}
                  </TouchableOpacity>
                )}
              />
            </>
          )}

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeBtn: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  deviceAddress: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  printText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
});