import { AppleStoreClient } from '../AppleStoreClient.js';
import { GooglePlayClient } from '../GooglePlayClient.js';
import { config } from '../config.js';
import { db } from '../db.js';

const client = new AppleStoreClient();
const googleClient = new GooglePlayClient();

export const verifyAppleTransaction = async (req, res) => {
    try {
        const { transactionId } = req.body;

        if (!transactionId) {
            return res.status(400).json({ error: 'Transaction ID is required' });
        }

        console.log(`Verifying Transaction ID: ${transactionId} in ${config.environment}`);

        const response = await client.getTransactionInfo(transactionId);
        let decoded = null;

        if (response.signedTransactionInfo) {
            decoded = client.decodeTransactionInfo(response.signedTransactionInfo);

            // Save to local DB
            if (decoded) {
                db.saveSubscription({
                    originalTransactionId: decoded.originalTransactionId,
                    transactionId: decoded.transactionId,
                    productId: decoded.productId,
                    purchaseDate: decoded.purchaseDate,
                    expirationDate: decoded.expiresDate,
                    environment: config.environment,
                    status: 'ACTIVE', // Assume active on verification
                    platform: 'apple'
                });
            }
        }

        res.json({
            success: true,
            environment: config.environment,
            data: response,
            decoded: decoded
        });

    } catch (error) {
        console.error('Verify Apple Transaction Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

export const verifyLegacyReceipt = async (req, res) => {
    try {
        const { receiptData } = req.body;

        if (!receiptData) {
            return res.status(400).json({ error: 'Receipt Data (Base64) is required' });
        }

        console.log(`Verifying Legacy Receipt in ${config.environment}`);

        if (!config.sharedSecret) {
            console.warn('Warning: SHARED_SECRET is not set.');
        }

        const response = await client.verifyLegacyReceipt(receiptData);

        res.json({
            success: true,
            environment: config.environment,
            data: response
        });

        // Save to local DB (Best effort for legacy)
        if (response && response.latest_receipt_info && response.latest_receipt_info.length > 0) {
            const latest = response.latest_receipt_info[0];
            db.saveSubscription({
                originalTransactionId: latest.original_transaction_id,
                transactionId: latest.transaction_id,
                productId: latest.product_id,
                purchaseDate: parseInt(latest.purchase_date_ms),
                expirationDate: parseInt(latest.expires_date_ms),
                environment: config.environment,
                status: 'ACTIVE',
                platform: 'apple_legacy'
            });
        }

    } catch (error) {
        console.error('Verify Legacy Receipt Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

export const decodeToken = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        const decoded = client.decodeJWS(token);

        res.json({
            success: true,
            decoded: decoded
        });

    } catch (error) {
        console.error('Decode Token Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

export const verifyAndroidTransaction = async (req, res) => {
    try {
        const { productId, token, isSubscription } = req.body;

        if (!productId || !token) {
            return res.status(400).json({ error: 'Product ID (or Subscription ID) and Token are required' });
        }

        console.log(`Verifying Android Transaction: ${productId} (Subscription: ${!!isSubscription})`);

        let response;
        if (isSubscription) {
            response = await googleClient.verifySubscription(productId, token);
        } else {
            response = await googleClient.verifyProduct(productId, token);
        }

        res.json({
            success: true,
            data: response
        });

        // Save to local DB if it's a subscription
        if (isSubscription && response) {
            db.saveSubscription({
                originalTransactionId: response.orderId, // Android orderId is unique
                transactionId: response.orderId,
                productId: productId,
                purchaseDate: parseInt(response.startTimeMillis),
                expirationDate: parseInt(response.expiryTimeMillis),
                environment: 'Production', // Google API is usually prod
                status: 'ACTIVE',
                platform: 'android'
            });
        }

    } catch (error) {
        console.error('Verify Android Transaction Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

export const getSubscriptionGroupSubscriptions = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ error: 'Subscription Group ID is required' });
        }

        console.log(`Fetching subscriptions for group: ${id}`);

        const response = await client.getSubscriptionGroupSubscriptions(id);

        res.json({
            success: true,
            data: response
        });

    } catch (error) {
        console.error('Get Subscription Group Subscriptions Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

export const handleAppleWebhook = async (req, res) => {
    try {
        const { signedPayload } = req.body;

        if (!signedPayload) {
            return res.status(400).send('SignedPayload is required');
        }

        const decodedPayload = client.decodeJWS(signedPayload);
        if (!decodedPayload) {
            return res.status(400).send('Invalid JWS');
        }

        console.log(`Received Webhook: ${decodedPayload.notificationType}`);

        if (decodedPayload.data && decodedPayload.data.signedTransactionInfo) {
            const transactionInfo = client.decodeTransactionInfo(decodedPayload.data.signedTransactionInfo);

            if (transactionInfo) {
                db.handleNotification(decodedPayload.notificationType, transactionInfo);
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).send('Error handling webhook');
    }
};

export const getActiveSubscriptions = async (req, res) => {
    try {
        console.log('[iapController] Fetching active subscriptions...');
        const subscriptions = db.getSubscriptions();
        console.log(`[iapController] Got ${subscriptions ? subscriptions.length : 'null'} subscriptions`);
        res.json({
            success: true,
            count: subscriptions.length,
            data: subscriptions
        });
    } catch (error) {
        console.error('Get Subscriptions Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
