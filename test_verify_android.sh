#!/bin/bash

# REPLACE with actual values from your Android App Purchase
PRODUCT_ID="your_product_id_or_subscription_id"
PURCHASE_TOKEN="your_purchase_token_from_google_play"
IS_SUBSCRIPTION="false" # Set to "true" if validating a subscription

curl -X POST http://localhost:3000/api/verify/android \
  -H "Content-Type: application/json" \
  -d "{
    \"productId\": \"$PRODUCT_ID\",
    \"token\": \"$PURCHASE_TOKEN\",
    \"isSubscription\": $IS_SUBSCRIPTION
  }"
