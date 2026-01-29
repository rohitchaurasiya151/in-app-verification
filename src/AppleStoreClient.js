
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import { config } from './config.js';

export class AppleStoreClient {
    constructor() {
        this.issuerId = config.issuerId;
        this.keyId = config.keyId;
        this.bundleId = config.bundleId;
        this.privateKey = config.privateKey;
        this.environment = config.environment;
        this.baseUrl = this.environment === 'Production'
            ? 'https://api.storekit.itunes.apple.com'
            : 'https://api.storekit-sandbox.itunes.apple.com';
    }

    generateAuthToken() {
        const payload = {
            iss: this.issuerId,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiration
            aud: 'appstoreconnect-v1',
            bid: this.bundleId,
        };

        const options = {
            algorithm: 'ES256',
            header: {
                kid: this.keyId,
                typ: 'JWT',
                alg: 'ES256',
            },
        };

        try {
            const token = jwt.sign(payload, this.privateKey, options);
            return token;
        } catch (error) {
            console.error('Error generating JWT:', error);
            throw error;
        }
    }

    async getTransactionInfo(transactionId) {
        const token = this.generateAuthToken();
        const url = `${this.baseUrl}/inApps/v1/transactions/${transactionId}`;

        console.log(`Making request to: ${url}`);

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching transaction info:', error);
            throw error;
        }
    }

    // Legacy verifyReceipt
    async verifyLegacyReceipt(receiptData) {
        const url = this.environment === 'Production'
            ? 'https://buy.itunes.apple.com/verifyReceipt'
            : 'https://sandbox.itunes.apple.com/verifyReceipt';

        const body = {
            'receipt-data': receiptData,
            'password': config.sharedSecret,
            'exclude-old-transactions': true
        };

        console.log(`Verifying receipt at: ${url}`);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                throw new Error(`Receipt Verification Failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error verifying receipt:', error);
            throw error;
        }
    }

    // Generic JWS Decoder
    decodeJWS(token) {
        try {
            return jwt.decode(token);
        } catch (error) {
            console.error('Error decoding JWS:', error);
            return null;
        }
    }

    // Helper to decode the signed transaction info from the response
    decodeTransactionInfo(signedTransactionInfo) {
        return this.decodeJWS(signedTransactionInfo);
    }
}
