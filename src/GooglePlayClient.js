
import { google } from 'googleapis';
import { config } from './config.js';

export class GooglePlayClient {
    constructor() {
        this.packageName = config.bundleId; // Usually same as bundleId/package name

        // Initialize Auth
        // google.auth.GoogleAuth will automatically look for GOOGLE_APPLICATION_CREDENTIALS
        // or we can pass credentials explicitly if they are in env vars
        const authOptions = {
            scopes: ['https://www.googleapis.com/auth/androidpublisher']
        };

        if (config.googleKeyFile) {
            authOptions.keyFile = config.googleKeyFile;
        } else if (config.googleClientEmail && config.googlePrivateKey) {
            authOptions.credentials = {
                client_email: config.googleClientEmail,
                private_key: config.googlePrivateKey.replace(/\\n/g, '\n'),
            };
        }

        this.auth = new google.auth.GoogleAuth(authOptions);
        this.publisher = google.androidpublisher({ version: 'v3', auth: this.auth });
    }

    /**
     * Verify a one-time product (consumable or non-consumable)
     * @param {string} productId 
     * @param {string} token 
     */
    async verifyProduct(productId, token) {
        try {
            console.log(`Verifying Android Product: ${productId}`);
            const res = await this.publisher.purchases.products.get({
                packageName: this.packageName,
                productId: productId,
                token: token,
            });
            return res.data;
        } catch (error) {
            console.error('Error verifying Android product:', error.message);
            throw error;
        }
    }

    /**
     * Verify a subscription
     * @param {string} subscriptionId 
     * @param {string} token 
     */
    async verifySubscription(subscriptionId, token) {
        try {
            console.log(`Verifying Android Subscription: ${subscriptionId}`);
            const res = await this.publisher.purchases.subscriptions.get({
                packageName: this.packageName,
                subscriptionId: subscriptionId,
                token: token,
            });
            return res.data;
        } catch (error) {
            console.error('Error verifying Android subscription:', error.message);
            throw error;
        }
    }
}
