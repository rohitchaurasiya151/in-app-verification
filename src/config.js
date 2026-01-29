
import dotenv from 'dotenv';
dotenv.config();

export const config = {
    issuerId: process.env.ISSUER_ID,
    keyId: process.env.KEY_ID,
    bundleId: process.env.BUNDLE_ID,
    privateKey: process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY.replace(/\\n/g, '\n') : '',
    environment: process.env.ENVIRONMENT || 'Production', // 'Sandbox' or 'Production'
    sharedSecret: process.env.SHARED_SECRET, // For legacy receipt verification

    // Google Play
    googleKeyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    googleClientEmail: process.env.GOOGLE_CLIENT_EMAIL,
    googlePrivateKey: process.env.GOOGLE_PRIVATE_KEY,
};
