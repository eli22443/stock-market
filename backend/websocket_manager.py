"""
Finnhub WebSocket Connection Manager
Handles connection to Finnhub WebSocket and processes incoming messages
"""

import asyncio
import websockets
import json
import os
from typing import Callable, Optional, TYPE_CHECKING
from dotenv import load_dotenv

if TYPE_CHECKING:
    from websockets.asyncio.client import ClientConnection

load_dotenv()

# Finnhub WebSocket URL
FINNHUB_WS_URL = "wss://ws.finnhub.io?token="


class FinnhubWebSocketManager:
    """
    Manages the connection to Finnhub WebSocket API
    """

    def __init__(self):
        self.api_key = os.getenv("FINNHUB_API_KEY", "")
        self.websocket: Optional["ClientConnection"] = None
        self.connected = False
        self.message_handler: Optional[Callable] = None
        self.reconnect_task: Optional[asyncio.Task] = None
        self.reconnect_delay = 5  # seconds

    def set_message_handler(self, handler: Callable):
        """Set the callback function to handle incoming messages"""
        self.message_handler = handler

    async def connect(self):
        """Connect to Finnhub WebSocket"""
        if self.connected:
            print("⚠️  Already connected to Finnhub")
            return

        if not self.api_key:
            raise ValueError("FINNHUB_API_KEY not found in environment variables")

        try:
            url = f"{FINNHUB_WS_URL}{self.api_key}"
            print(f"🔌 Connecting to Finnhub WebSocket...")
            self.websocket = await websockets.connect(url)
            self.connected = True
            print("✅ Connected to Finnhub WebSocket")

            # Start listening for messages
            asyncio.create_task(self._listen())

        except Exception as e:
            print(f"❌ Failed to connect to Finnhub: {e}")
            self.connected = False
            raise

    async def disconnect(self):
        """Disconnect from Finnhub WebSocket"""
        self.connected = False
        if self.websocket:
            await self.websocket.close()
            self.websocket = None
            print("✅ Disconnected from Finnhub WebSocket")

    def is_connected(self) -> bool:
        """Check if connected to Finnhub"""
        return self.connected and self.websocket is not None

    async def subscribe(self, symbols: list[str]):
        """
        Subscribe to stock symbols

        Args:
            symbols: List of stock symbols (e.g., ["AAPL", "NVDA"])
        """
        if not self.is_connected():
            raise ConnectionError("Not connected to Finnhub WebSocket")

        assert self.websocket is not None  # Type narrowing: is_connected() ensures this
        for symbol in symbols:
            # Finnhub subscription format: {"type":"subscribe","symbol":"AAPL"}
            message = {"type": "subscribe", "symbol": symbol.upper()}
            await self.websocket.send(json.dumps(message))
            print(f"📊 Subscribed to {symbol.upper()}")

    async def unsubscribe(self, symbols: list[str]):
        """
        Unsubscribe from stock symbols

        Args:
            symbols: List of stock symbols to unsubscribe from
        """
        if not self.is_connected():
            return

        assert self.websocket is not None  # Type narrowing: is_connected() ensures this
        for symbol in symbols:
            # Finnhub unsubscription format: {"type":"unsubscribe","symbol":"AAPL"}
            message = {"type": "unsubscribe", "symbol": symbol.upper()}
            await self.websocket.send(json.dumps(message))
            print(f"📊 Unsubscribed from {symbol.upper()}")

    async def _listen(self):
        """Listen for messages from Finnhub WebSocket"""
        if self.websocket is None:
            return

        try:
            async for message in self.websocket:
                try:
                    data = json.loads(message)

                    # Handle different message types from Finnhub
                    if data.get("type") == "ping":
                        # Respond to ping to keep connection alive
                        await self.websocket.send(json.dumps({"type": "pong"}))

                    elif data.get("type") == "trade":
                        # Trade/price update message
                        # Format: {"type":"trade","data":[{"s":"AAPL","p":150.25,"t":1234567890,"v":100}]}
                        if self.message_handler:
                            await self.message_handler(data)

                    elif data.get("type") == "error":
                        # Error message from Finnhub
                        print(f"❌ Finnhub error: {data}")

                except json.JSONDecodeError as e:
                    print(f"❌ Failed to parse message: {e}")
                except Exception as e:
                    print(f"❌ Error processing message: {e}")

        except websockets.exceptions.ConnectionClosed:
            print("❌ Finnhub WebSocket connection closed")
            self.connected = False
            # Attempt to reconnect
            await self._reconnect()
        except Exception as e:
            print(f"❌ Error in _listen: {e}")
            self.connected = False

    async def _reconnect(self):
        """Attempt to reconnect to Finnhub WebSocket"""
        if self.reconnect_task and not self.reconnect_task.done():
            return  # Already attempting to reconnect

        self.reconnect_task = asyncio.create_task(self._reconnect_loop())

    async def _reconnect_loop(self):
        """Reconnection loop with exponential backoff"""
        max_delay = 60  # Maximum delay of 60 seconds
        delay = self.reconnect_delay

        while not self.connected:
            try:
                print(f"🔄 Attempting to reconnect in {delay} seconds...")
                await asyncio.sleep(delay)
                await self.connect()
                delay = self.reconnect_delay  # Reset delay on success
            except Exception as e:
                print(f"❌ Reconnection failed: {e}")
                delay = min(delay * 2, max_delay)  # Exponential backoff
