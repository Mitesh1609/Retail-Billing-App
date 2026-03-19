const BASE_URL = 'https://retail-chatbot-1kmr.onrender.com';

// ─── PRODUCTS SYNC ────────────────────────────────────

export const syncProducts = async (products, pushToken) => {
    try {
        const response = await fetch(`${BASE_URL}/api/products/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ products, token: pushToken }),
        });
        const data = await response.json();
        console.log('✅ Products synced:', data.count);
        return data;
    } catch (error) {
        console.error('❌ Sync failed:', error.message);
        return null;
    }
};

// ─── ORDERS ───────────────────────────────────────────

export const getOnlineOrders = async () => {
    try {
        const response = await fetch(`${BASE_URL}/api/orders`);
        const data = await response.json();
        return data.orders || [];
    } catch (error) {
        console.error('❌ Fetch orders failed:', error.message);
        return [];
    }
};

export const updateOrderStatus = async (orderId, status) => {
    try {
        const response = await fetch(`${BASE_URL}/api/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        return await response.json();
    } catch (error) {
        console.error('❌ Update status failed:', error.message);
        return null;
    }
};