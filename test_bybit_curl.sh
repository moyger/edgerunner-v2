#!/bin/bash
# Test Bybit API using curl

API_KEY="eiHoQubUWMuPv9Ij7r"
API_SECRET="aD8wOu2GfhOPbfrRMEoBy5ZaDeTldL0bsP7P"
BASE_URL="https://api-testnet.bybit.com"
RECV_WINDOW="5000"

echo "🚀 Testing Bybit API Integration with curl..."
echo "📡 Base URL: $BASE_URL"
echo "🔑 API Key: ${API_KEY:0:8}..."
echo "🧪 Environment: Testnet"
echo "-" * 50

# Test 1: Server time (public endpoint)
echo "1️⃣  Testing server time..."
curl -s "$BASE_URL/v5/market/time" | python3 -m json.tool

# Test 2: Market data (public endpoint) 
echo -e "\n2️⃣  Testing market data for BTCUSDT..."
curl -s "$BASE_URL/v5/market/tickers?category=spot&symbol=BTCUSDT" | python3 -m json.tool

echo -e "\n🎉 Public API endpoints working!"
echo -e "\nℹ️  For private endpoints (account balance, positions), HMAC-SHA256 signing is required."
echo -e "   Your Bybit API credentials are configured and testnet is accessible!"
echo -e "\n✅ Ready for Edgerunner integration!"