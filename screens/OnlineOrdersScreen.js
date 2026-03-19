import { useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getOnlineOrders, updateOrderStatus } from '../utils/api';

export default function OnlineOrdersScreen() {
    const insets = useSafeAreaInsets();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            loadOrders();
        }, [])
    );

    const loadOrders = async () => {
        setLoading(true);
        const data = await getOnlineOrders();
        setOrders(data);
        setLoading(false);
    };

    const handleStatusUpdate = (order) => {
        Alert.alert(
            'Update Order Status',
            `Order #${order.order_number}\nCustomer: ${order.customer_name}`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: '✅ Mark Ready',
                    onPress: () => updateStatus(order.id, 'ready'),
                },
                {
                    text: '✔️ Mark Completed',
                    onPress: () => updateStatus(order.id, 'completed'),
                },
                {
                    text: '❌ Cancel Order',
                    style: 'destructive',
                    onPress: () => updateStatus(order.id, 'cancelled'),
                },
            ]
        );
    };

    const updateStatus = async (id, status) => {
        await updateOrderStatus(id, status);
        loadOrders();
    };

    const statusColor = (status) => {
        switch (status) {
            case 'pending': return '#F59E0B';
            case 'ready': return '#3B82F6';
            case 'completed': return '#22C55E';
            case 'cancelled': return '#EF4444';
            default: return '#6B7280';
        }
    };

    const renderOrder = ({ item }) => (
        <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <Text style={styles.orderNumber}>#{item.order_number}</Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: statusColor(item.status) }]}>
                        {item.status.toUpperCase()}
                    </Text>
                </View>
            </View>

            <Text style={styles.customerName}>👤 {item.customer_name}</Text>
            <Text style={styles.customerPhone}>📞 {item.customer_phone}</Text>

            <View style={styles.itemsList}>
                {item.items.map((i, idx) => (
                    <Text key={idx} style={styles.itemText}>
                        • {i.name} x{i.quantity} = ₹{(i.price * i.quantity).toFixed(2)}
                    </Text>
                ))}
            </View>

            <View style={styles.orderFooter}>
                <Text style={styles.totalAmount}>Total: ₹{item.total_amount.toFixed(2)}</Text>
                {item.status === 'pending' || item.status === 'ready' ? (
                    <TouchableOpacity
                        style={styles.updateBtn}
                        onPress={() => handleStatusUpdate(item)}
                    >
                        <Text style={styles.updateBtnText}>Update Status</Text>
                    </TouchableOpacity>
                ) : null}
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>🛒 Online Orders</Text>
                <TouchableOpacity onPress={loadOrders}>
                    <Text style={styles.refreshBtn}>Refresh</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
            ) : orders.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No online orders yet!</Text>
                    <Text style={styles.emptySubText}>Orders from your chatbot will appear here</Text>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderOrder}
                    contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                    onRefresh={loadOrders}
                    refreshing={loading}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6' },
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
    refreshBtn: { fontSize: 14, color: '#2563EB', fontWeight: '600' },
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    orderNumber: { fontSize: 15, fontWeight: '700', color: '#111827' },
    statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    statusText: { fontSize: 11, fontWeight: '700' },
    customerName: { fontSize: 14, color: '#374151', marginBottom: 2 },
    customerPhone: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
    itemsList: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 10, marginBottom: 10 },
    itemText: { fontSize: 13, color: '#374151', marginBottom: 2 },
    orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalAmount: { fontSize: 16, fontWeight: '700', color: '#2563EB' },
    updateBtn: { backgroundColor: '#2563EB', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
    updateBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText: { fontSize: 20, fontWeight: '600', color: '#374151' },
    emptySubText: { fontSize: 14, color: '#9CA3AF', marginTop: 8, textAlign: 'center' },
});