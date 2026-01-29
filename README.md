# iOS In-App Purchase Verification App

A Node.js application to verify iOS In-App Purchases using both the ** App Store Server API** (for new transaction IDs) and the **Legacy `verifyReceipt` Endpoint** (for base64 receipt blobs). It also supports JWS token decoding.

## Features
- **Verify Transaction ID**: Uses Apple's standard App Store Server API.
- **Verify Legacy Receipt**: Supports the `verifyReceipt` endpoint for older receipt blobs.
- **Decode JWS**: Decodes `signedTransactionInfo` or other JWS tokens offline.
- **CLI & API**: Can be run as a CLI script or a REST API server.

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Create a `.env` file with your Apple Developer credentials:
    ```env
    ISSUER_ID=your_issuer_id
    KEY_ID=your_key_id
    BUNDLE_ID=com.your.app.bundle
    PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
    ENVIRONMENT=Sandbox  # or Production
    SHARED_SECRET=your_shared_secret  # Required for legacy auto-renewable subscriptions
    ```

## Running the Server

Start the Express.js API server:
```bash
npm start
```
The server runs on **port 3000** by default.

## API Documentation

### 1. Verify Transaction ID (New API)
Verifies a transaction using the modern App Store Server API.

- **Endpoint**: `POST /api/verify/apple`
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "transactionId": "2000000456895360"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "environment": "Sandbox",
    "data": { "signedTransactionInfo": "..." },
    "decoded": { "transactionId": "...", "productId": "..." }
  }
  ```

### 2. Verify Legacy Receipt
Verifies a base64 receipt blob using the legacy `verifyReceipt` endpoint.

- **Endpoint**: `POST /api/verify/receipt`
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "receiptData": "MIIG..."
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "environment": "Sandbox",
    "data": { "status": 0, "latest_receipt_info": [...] }
  }
  ```

### 3. Decode JWS Token
Decodes a JWS token (like `signedTransactionInfo`) without making an API call to Apple.

- **Endpoint**: `POST /api/decode`
- **Headers**: `Content-Type: application/json`
- **Body**:
  ```json
  {
    "token": "eyJhbGci..."
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "decoded": { "header": {}, "payload": {}, "signature": "" }
  }
  ```

## CLI Usage

You can also run verification directly from the command line:

```bash
# Verify Transaction ID
npm run cli -- 2000000456895360

# Verify Legacy Receipt
npm run cli -- "MIIG..."

# Decode JWS Token (Auto-detected if starts with ey...)
npm run cli -- "eyJ..."
```
