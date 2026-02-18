
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

// Mock keys for signing (doesn't matter for local decoding as long as we don't verify signature strictness in this mock)
// However, our code currently just does `jwt.decode` so the signature doesn't need to be valid, just the format.
// But to be "real", let's sign it.
const PRIVATE_KEY = 'shh_secret';

function sign(payload) {
    return jwt.sign(payload, PRIVATE_KEY, { algorithm: 'HS256' });
}

// 1. Create Signed Transaction Info (Inner JWS)
const transactionInfo = {
    originalTransactionId: '2000000000000001',
    transactionId: '2000000000000002',
    productId: 'com.zebraLearn.reader.monthly',
    purchaseDate: Date.now(),
    expiresDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // +30 days
    environment: 'Sandbox',
    webOrderLineItemId: '3000000000000001'
};

const signedTransactionInfo = sign(transactionInfo);

// 2. Create Signed Payload (Outer JWS)
const payload = {
    notificationType: 'DID_RENEW', // or SUBSCRIBED, EXPIRED
    subtype: 'AUTO_RENEW_ENABLED',
    notificationUUID: 'uuid-123-456',
    data: {
        bundleId: 'com.zebraLearn.reader',
        bundleVersion: '1.0.0',
        environment: 'Sandbox',
        signedTransactionInfo: signedTransactionInfo
    },
    version: '2.0'
};

const signedPayload = sign(payload);

// 3. Send Webhook
async function sendWebhook() {
    console.log('Sending Webhook with notificationType: DID_RENEW');

    try {
        const response = await fetch('http://localhost:3000/api/webhooks/apple', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ signedPayload })
        });

        console.log(`Response: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log(text);
    } catch (error) {
        console.error('Error sending webhook:', error);
    }
}

sendWebhook();
