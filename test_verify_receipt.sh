#!/bin/bash

# REPLACE 'YOUR_BASE64_RECEIPT_STRING' with the actual output from your App
# - Flutter: `purchaseDetails.verificationData.serverVerificationData`
# - iOS Swift: `Bundle.main.appStoreReceiptURL` -> `base64EncodedString()`
# Print it in your app and paste it here.

RECEIPT_DATA="YOUR_BASE64_RECEIPT_STRING"

curl -X POST http://localhost:3000/api/verify/receipt \
  -H "Content-Type: application/json" \
  -d "{
    \"receiptData\": \"$RECEIPT_DATA\"
  }"
