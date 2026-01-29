
import { AppleStoreClient } from './src/AppleStoreClient.js';
import { config } from './src/config.js';

async function main() {
    const args = process.argv.slice(2);
    const input = args[0];

    if (!input) {
        console.error('Usage:');
        console.error('  Verify Transaction ID: node index.js <transactionId>');
        console.error('  Verify Legacy Receipt: node index.js <base64_receipt_data>');
        console.error('  Decode JWS Token:      node index.js --decode <jws_token>');
        console.log('Environment:', config.environment);
        process.exit(1);
    }

    const client = new AppleStoreClient();

    // Heuristic to distinguish Transaction ID vs Receipt Blob vs JWS
    // Transaction IDs are numeric (digits only).
    // JWS tokens start with 'ey' and contain dots.
    const isTransactionId = /^\d+$/.test(input);
    const isJws = input.startsWith('ey') && input.includes('.');

    // Mode: Decode JWS
    if (input === '--decode' || (args.length === 2 && args[0] === '--decode') || isJws) {
        let realToken;
        if (input === '--decode' || args[0] === '--decode') {
            realToken = args.length === 2 ? args[1] : args[0];
        } else {
            console.log("Auto-detected JWS token. Switching to decode mode.");
            realToken = input;
        }

        if (!realToken) {
            console.error('Error: Please provide a token to decode.');
            process.exit(1);
        }

        console.log('\n--- Decoding JWS Token ---');
        const decoded = client.decodeJWS(realToken);
        console.log(JSON.stringify(decoded, null, 2));
        return;
    }

    if (!config.issuerId || !config.keyId || !config.privateKey) {
        console.error('Error: Missing environment variables. Please check your .env file.');
        process.exit(1);
    }

    if (isTransactionId) {
        console.log(`Verifying Transaction ID: ${input} in ${config.environment} environment...`);
        try {
            const response = await client.getTransactionInfo(input);
            console.log('\n--- Raw Response ---');
            console.log(JSON.stringify(response, null, 2));

            if (response.signedTransactionInfo) {
                const decoded = client.decodeTransactionInfo(response.signedTransactionInfo);
                console.log('\n--- Decoded Transaction Info ---');
                console.log(JSON.stringify(decoded, null, 2));
            }
        } catch (error) {
            console.error('\nVerification Failed:', error.message);
        }
    } else {
        // Assume it's a legacy receipt blob
        console.log(`Verifying Legacy Receipt in ${config.environment} environment...`);
        if (!config.sharedSecret) {
            console.warn('Warning: SHARED_SECRET is not set in .env. Auto-renewable subscriptions verification might fail.');
        }

        try {
            const response = await client.verifyLegacyReceipt(input);
            console.log('\n--- Receipt Verification Response ---');
            console.log(JSON.stringify(response, null, 2));

            if (response.latest_receipt_info && response.latest_receipt_info.length > 0) {
                console.log('\n--- Latest Receipt Info (Last Item) ---');
                console.log(JSON.stringify(response.latest_receipt_info[0], null, 2));
            }
        } catch (error) {
            console.error('\nVerification Failed:', error.message);
        }
    }
}

main();
