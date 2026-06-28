"""
Simple test script to verify WebSocket connection works
Run this after starting the server to test the connection
"""

import asyncio
import websockets
import json


async def test_connection():
    """Test WebSocket connection to the server"""
    uri = "ws://localhost:8000/ws"

    try:
        print("🔌 Connecting to server...")
        async with websockets.connect(uri) as websocket:
            print("✅ Connected!")

            # Wait for connection message
            response = await websocket.recv()
            print(f"📨 Received: {response}")

            # Subscribe to some symbols
            subscribe_msg = {"action": "subscribe", "symbols": ["AAPL", "NVDA", "MSFT"]}
            print(f"📤 Sending: {json.dumps(subscribe_msg)}")
            await websocket.send(json.dumps(subscribe_msg))

            # Wait for subscription confirmation
            response = await websocket.recv()
            print(f"📨 Received: {response}")

            # Listen for price updates (wait 10 seconds)
            print("👂 Listening for price updates (10 seconds)...")
            try:
                while True:
                    response = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                    data = json.loads(response)
                    if data.get("type") == "price_update":
                        symbol = data.get("symbol")
                        price = data.get("data", {}).get("price")
                        print(f"💰 {symbol}: ${price}")
                    else:
                        print(f"📨 Received: {response}")
            except asyncio.TimeoutError:
                print(
                    "⏱️  Timeout - no updates received (this is normal if market is closed)"
                )

            # Unsubscribe
            unsubscribe_msg = {"action": "unsubscribe", "symbols": ["AAPL"]}
            print(f"📤 Sending: {json.dumps(unsubscribe_msg)}")
            await websocket.send(json.dumps(unsubscribe_msg))

            response = await websocket.recv()
            print(f"📨 Received: {response}")

            print("✅ Test completed!")

    except Exception as e:
        print(f"❌ Error: {e}")
        print("Make sure the server is running on http://localhost:8000")


if __name__ == "__main__":
    asyncio.run(test_connection())
