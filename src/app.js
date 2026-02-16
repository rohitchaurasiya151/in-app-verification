
import express from 'express';
import cors from 'cors';
import { verifyAppleTransaction, verifyLegacyReceipt, decodeToken, verifyAndroidTransaction, getSubscriptionGroupSubscriptions } from './controllers/iapController.js';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.post('/api/verify/apple', verifyAppleTransaction);
app.post('/api/verify/receipt', verifyLegacyReceipt);
app.post('/api/verify/android', verifyAndroidTransaction);
app.post('/api/decode', decodeToken);
app.get('/api/subscriptionGroups/:id/subscriptions', getSubscriptionGroupSubscriptions);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

export default app;
