
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, '../subscriptions.json');

export class JSONFileDB {
    constructor() {
        this.dbFile = DB_FILE;
        console.log(`[JSONFileDB] Database File Path: ${this.dbFile}`);
        this.ensureDbExists();
    }

    ensureDbExists() {
        if (!fs.existsSync(this.dbFile)) {
            console.log(`[JSONFileDB] Creating new DB file at ${this.dbFile}`);
            fs.writeFileSync(this.dbFile, JSON.stringify([], null, 2));
        } else {
            console.log(`[JSONFileDB] Found existing DB file at ${this.dbFile}`);
        }
    }

    read() {
        try {
            if (!fs.existsSync(this.dbFile)) {
                return [];
            }
            const data = fs.readFileSync(this.dbFile, 'utf8');
            console.log(`[JSONFileDB] Read ${data.length} bytes from DB`);
            if (!data || data.trim().length === 0) {
                return [];
            }
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading DB:', error);
            return [];
        }
    }

    write(data) {
        try {
            fs.writeFileSync(this.dbFile, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Error writing DB:', error);
        }
    }

    // Save or update a subscription
    saveSubscription(subscriptionData) {
        const subscriptions = this.read();

        // We use originalTransactionId as the unique identifier for a subscription chain
        const existingIndex = subscriptions.findIndex(
            sub => sub.originalTransactionId === subscriptionData.originalTransactionId
        );

        if (existingIndex >= 0) {
            // Update existing
            subscriptions[existingIndex] = { ...subscriptions[existingIndex], ...subscriptionData, updatedAt: new Date().toISOString() };
        } else {
            // Create new
            subscriptions.push({ ...subscriptionData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        }

        this.write(subscriptions);
        console.log(`Subscription saved: ${subscriptionData.originalTransactionId}`);
    }

    // Handle a notification update (e.g., renewal, expiration)
    handleNotification(notificationType, transactionInfo) {
        const subscriptions = this.read();
        const { originalTransactionId, expiresDate, transactionId } = transactionInfo;

        const existingIndex = subscriptions.findIndex(
            sub => sub.originalTransactionId === originalTransactionId
        );

        if (existingIndex >= 0) {
            const sub = subscriptions[existingIndex];

            // Update fields based on notification
            sub.lastNotificationType = notificationType;
            sub.latestTransactionId = transactionId;

            if (expiresDate) {
                sub.expirationDate = expiresDate;
            }

            // Simple status logic
            if (notificationType === 'DID_RENEW' || notificationType === 'SUBSCRIBED') {
                sub.status = 'ACTIVE';
            } else if (notificationType === 'EXPIRED') {
                sub.status = 'EXPIRED';
            } else if (notificationType === 'DID_FAIL_TO_RENEW') {
                sub.status = 'GRACE_PERIOD'; // Or expired, depending on logic
            }

            sub.updatedAt = new Date().toISOString();
            subscriptions[existingIndex] = sub;
            this.write(subscriptions);
            console.log(`Subscription updated via Webhook: ${originalTransactionId} (${notificationType})`);
            return true;
        } else {
            console.log(`Creating new subscription from Webhook: ${originalTransactionId}`);
            const newSub = {
                originalTransactionId,
                transactionId,
                productId: transactionInfo.productId,
                purchaseDate: transactionInfo.purchaseDate,
                expirationDate: expiresDate,
                environment: transactionInfo.environment || 'Production',
                status: 'ACTIVE',
                lastNotificationType: notificationType,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                platform: 'apple'
            };
            subscriptions.push(newSub);
            this.write(subscriptions);
            return true;
        }
    }

    getSubscriptions() {
        return this.read();
    }
}

export const db = new JSONFileDB();
