
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import { config } from './config.js';

export class AppleStoreClient {
    constructor() {
        this.issuerId = config.issuerId;
        this.keyId = config.keyId;
        this.bundleId = config.bundleId;
        this.privateKey = config.privateKey;

        // App Store Connect API Credentials
        this.ascIssuerId = config.ascIssuerId;
        this.ascKeyId = config.ascKeyId;
        this.ascPrivateKey = config.ascPrivateKey;

        this.environment = config.environment;
        this.baseUrl = this.environment === 'Production'
            ? 'https://api.storekit.itunes.apple.com'
            : 'https://api.storekit-sandbox.itunes.apple.com';

        console.log('--- AppleStoreClient Config Debug ---');
        console.log(`Issuer ID: ${this.issuerId}`);
        console.log(`Key ID: ${this.keyId}`);
        console.log(`Bundle ID: ${this.bundleId}`);
        console.log(`ASC Issuer ID: ${this.ascIssuerId}`);
        console.log(`ASC Key ID: ${this.ascKeyId}`);
        console.log('-------------------------------------');
    }

    generateAuthToken({ includeBundleId = true, expiresIn = 3600, useAscCredentials = false } = {}) {
        const now = Math.floor(Date.now() / 1000);

        const issuerId = useAscCredentials ? this.ascIssuerId : this.issuerId;
        const keyId = useAscCredentials ? this.ascKeyId : this.keyId;
        const privateKey = useAscCredentials ? this.ascPrivateKey : this.privateKey;

        if (!issuerId || !keyId || !privateKey) {
            throw new Error(`Missing credentials for ${useAscCredentials ? 'App Store Connect API' : 'App Store Server API'}`);
        }

        const payload = {
            iss: issuerId,
            iat: now,
            exp: now + expiresIn,
            aud: 'appstoreconnect-v1',
        };

        if (includeBundleId && !useAscCredentials) {
            payload.bid = this.bundleId;
        }

        const options = {
            algorithm: 'ES256',
            header: {
                kid: keyId,
                typ: 'JWT',
                alg: 'ES256',
            },
        };



        try {
            const token = jwt.sign(payload, privateKey, options);
            return token;
        } catch (error) {
            console.error('Error generating JWT:', error);
            throw error;
        }
    }

    async getTransactionInfo(transactionId) {
        // App Store Server API allows 1 hour
        const token = this.generateAuthToken({ expiresIn: 3600 });
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

    async getSubscriptionGroupSubscriptions(id) {
        // App Store Connect API requires exp <= 20 minutes (1200 seconds)
        // We'll use 5 minutes (300 seconds) to be safe
        // And we MUST use the App Store Connect API credentials
        const token = this.generateAuthToken({
            includeBundleId: false,
            expiresIn: 300,
            useAscCredentials: true
        });
        const url = `https://api.appstoreconnect.apple.com/v1/subscriptionGroups/${id}/subscriptions`;

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
            console.error('Error fetching subscription group subscriptions:', error);
            throw error;
        }
    }
}
