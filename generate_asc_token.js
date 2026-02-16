import { AppleStoreClient } from './src/AppleStoreClient.js';
import { config } from './src/config.js';

async function generateToken() {
    try {
        const client = new AppleStoreClient();

        // Generate Token for App Store Connect API
        const token = client.generateAuthToken({
            includeBundleId: false,
            expiresIn: 1200, // 20 minutes (max allowed)
            useAscCredentials: true
        });

        console.log('\n--- App Store Connect API Token ---');
        console.log(token);
        console.log('-----------------------------------\n');

    } catch (error) {
        console.error('Error generating token:', error);
    }
}

generateToken();
