"""
Subscription Manager
Manages symbol subscriptions and routes updates to clients
"""

from typing import Dict, Set, List
from websocket_manager import FinnhubWebSocketManager
from client_manager import ClientManager


class SubscriptionManager:
    """
    Manages subscriptions: tracks which clients want which symbols,
    and only subscribes to Finnhub once per unique symbol
    """

    def __init__(
        self, finnhub_manager: FinnhubWebSocketManager, client_manager: ClientManager
    ):
        self.finnhub_manager = finnhub_manager
        self.client_manager = client_manager

        # Map client_id to set of subscribed symbols
        self.client_subscriptions: Dict[str, Set[str]] = {}

        # Map symbol to set of client_ids that want it
        self.symbol_clients: Dict[str, Set[str]] = {}

        # Set up message handler for Finnhub updates
        self.finnhub_manager.set_message_handler(self._handle_finnhub_message)

    async def subscribe(self, client_id: str, symbols: List[str]):
        """
        Subscribe a client to stock symbols

        Args:
            client_id: Unique identifier for the client
            symbols: List of stock symbols to subscribe to
        """
        # Initialize client's subscription set if needed
        if client_id not in self.client_subscriptions:
            self.client_subscriptions[client_id] = set()

        # Track which symbols are new (not already subscribed by anyone)
        new_symbols = []

        for symbol in symbols:
            symbol_upper = symbol.upper()

            # Add to client's subscriptions
            self.client_subscriptions[client_id].add(symbol_upper)

            # Add client to symbol's client list
            if symbol_upper not in self.symbol_clients:
                self.symbol_clients[symbol_upper] = set()
                new_symbols.append(symbol_upper)

            self.symbol_clients[symbol_upper].add(client_id)

        # Subscribe to Finnhub only for new symbols
        if new_symbols and self.finnhub_manager.is_connected():
            await self.finnhub_manager.subscribe(new_symbols)

        print(f"📊 Client {client_id} subscribed to: {symbols}")

    async def unsubscribe(self, client_id: str, symbols: List[str]):
        """
        Unsubscribe a client from stock symbols

        Args:
            client_id: Unique identifier for the client
            symbols: List of stock symbols to unsubscribe from
        """
        if client_id not in self.client_subscriptions:
            return

        # Track which symbols should be unsubscribed from Finnhub
        symbols_to_unsubscribe = []

        for symbol in symbols:
            symbol_upper = symbol.upper()

            # Remove from client's subscriptions
            self.client_subscriptions[client_id].discard(symbol_upper)

            # Remove client from symbol's client list
            if symbol_upper in self.symbol_clients:
                self.symbol_clients[symbol_upper].discard(client_id)

                # If no clients want this symbol anymore, unsubscribe from Finnhub
                if len(self.symbol_clients[symbol_upper]) == 0:
                    del self.symbol_clients[symbol_upper]
                    symbols_to_unsubscribe.append(symbol_upper)

        # Unsubscribe from Finnhub for symbols with no clients
        if symbols_to_unsubscribe and self.finnhub_manager.is_connected():
            await self.finnhub_manager.unsubscribe(symbols_to_unsubscribe)

        print(f"📊 Client {client_id} unsubscribed from: {symbols}")

    async def unsubscribe_all(self, client_id: str):
        """
        Unsubscribe a client from all symbols (when they disconnect)

        Args:
            client_id: Unique identifier for the client
        """
        if client_id not in self.client_subscriptions:
            return

        # Get all symbols this client was subscribed to
        symbols = list(self.client_subscriptions[client_id])

        # Unsubscribe from all symbols
        await self.unsubscribe(client_id, symbols)

        # Remove client's subscription record
        del self.client_subscriptions[client_id]

    def get_subscribed_symbols(self) -> List[str]:
        """
        Get list of all currently subscribed symbols

        Returns:
            List of subscribed symbols
        """
        return list(self.symbol_clients.keys())

    def get_subscription_count(self) -> int:
        """
        Get the number of unique symbols subscribed to

        Returns:
            Number of subscribed symbols
        """
        return len(self.symbol_clients)

    async def _handle_finnhub_message(self, message: dict):
        """
        Handle incoming message from Finnhub WebSocket

        Args:
            message: Message dictionary from Finnhub
        """
        if message.get("type") == "trade" and "data" in message:
            # Process trade data
            trades = message["data"]

            for trade in trades:
                symbol = trade.get("s", "").upper()  # Stock symbol
                price = trade.get("p")  # Price
                timestamp = trade.get("t")  # Timestamp
                volume = trade.get("v", 0)  # Volume

                if not symbol or price is None:
                    continue

                # Find all clients subscribed to this symbol
                clients_to_notify = self.symbol_clients.get(symbol, set())

                # Prepare update message
                update_message = {
                    "type": "price_update",
                    "symbol": symbol,
                    "data": {"price": price, "volume": volume, "timestamp": timestamp},
                }

                # Broadcast to all subscribed clients
                for client_id in clients_to_notify:
                    await self.client_manager.send_to_client(client_id, update_message)
