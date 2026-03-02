import express from 'express';
import cors from 'cors';
import { verifyAppleTransaction, verifyLegacyReceipt, decodeToken, verifyAndroidTransaction, getSubscriptionGroupSubscriptions, handleAppleWebhook, getActiveSubscriptions, getAppleSubscriptionInfo, getAppleTransactionHistory } from './controllers/iapController.js';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.post('/api/verify/apple', verifyAppleTransaction);
app.post('/api/verify/receipt', verifyLegacyReceipt);
app.post('/api/verify/android', verifyAndroidTransaction);
app.post('/api/decode', decodeToken);
app.get('/api/subscriptionGroups/:id/subscriptions', getSubscriptionGroupSubscriptions);
app.get('/api/subscriptions/apple/:transactionId', getAppleSubscriptionInfo);
app.get('/api/history/apple/:originalTransactionId', getAppleTransactionHistory);
app.post('/api/webhooks/apple', handleAppleWebhook);
app.get('/api/subscriptions', getActiveSubscriptions);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

export default app;
