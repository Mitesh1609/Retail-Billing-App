import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export const registerForPushNotifications = async () => {
    try {
        // Skip in Expo Go
        if (Constants.executionEnvironment === 'storeClient') {
            console.log('⚠️ Push notifications not supported in Expo Go — skipping');
            return null;
        }

        if (!Device.isDevice) {
            console.log('Push notifications require real device');
            return null;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Push notification permission denied');
            return null;
        }

        const token = await Notifications.getExpoPushTokenAsync({
            projectId: 'b28ec528-0c53-4532-bd82-2ab2a21150af',
        });

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('orders', {
                name: 'Online Orders',
                importance: Notifications.AndroidImportance.MAX,
                sound: true,
            });
        }

        console.log('✅ Push token:', token.data);
        return token.data;

    } catch (error) {
        console.error('❌ Push token error:', error.message);
        return null;
    }
};