"""
Client Connection Manager
Manages WebSocket connections from Next.js clients
"""

from fastapi import WebSocket
from typing import Dict
import uuid


class ClientManager:
    """
    Manages all connected Next.js clients
    """

    def __init__(self):
        # Dictionary mapping client_id to WebSocket connection
        self.clients: Dict[str, WebSocket] = {}

    def add_client(self, websocket: WebSocket) -> str:
        """
        Add a new client connection

        Args:
            websocket: WebSocket connection from client

        Returns:
            client_id: Unique identifier for this client
        """
        client_id = str(uuid.uuid4())
        self.clients[client_id] = websocket
        print(f"➕ Client added: {client_id} (Total: {len(self.clients)})")
        return client_id

    def remove_client(self, client_id: str):
        """
        Remove a client connection

        Args:
            client_id: Unique identifier for the client
        """
        if client_id in self.clients:
            del self.clients[client_id]
            print(f"➖ Client removed: {client_id} (Total: {len(self.clients)})")

    def get_client(self, client_id: str) -> WebSocket | None:
        """
        Get a client's WebSocket connection

        Args:
            client_id: Unique identifier for the client

        Returns:
            WebSocket connection or None if not found
        """
        return self.clients.get(client_id)

    def get_all_clients(self) -> Dict[str, WebSocket]:
        """
        Get all client connections

        Returns:
            Dictionary of all client connections
        """
        return self.clients.copy()

    def get_client_count(self) -> int:
        """
        Get the number of connected clients

        Returns:
            Number of connected clients
        """
        return len(self.clients)

    async def send_to_client(self, client_id: str, message: dict):
        """
        Send a message to a specific client

        Args:
            client_id: Unique identifier for the client
            message: Message dictionary to send
        """
        client = self.get_client(client_id)
        if client:
            try:
                await client.send_json(message)
            except Exception as e:
                print(f"❌ Failed to send message to client {client_id}: {e}")
                # Remove client if connection is broken
                self.remove_client(client_id)

    async def broadcast(self, message: dict, exclude_client: str | None = None):
        """
        Broadcast a message to all connected clients

        Args:
            message: Message dictionary to broadcast
            exclude_client: Optional client_id to exclude from broadcast
        """
        disconnected_clients = []

        for client_id, client in self.clients.items():
            if client_id == exclude_client:
                continue

            try:
                await client.send_json(message)
            except Exception as e:
                print(f"❌ Failed to broadcast to client {client_id}: {e}")
                disconnected_clients.append(client_id)

        # Remove disconnected clients
        for client_id in disconnected_clients:
            self.remove_client(client_id)
