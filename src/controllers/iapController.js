
import { AppleStoreClient } from '../AppleStoreClient.js';
import { config } from '../config.js';

const client = new AppleStoreClient();

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
