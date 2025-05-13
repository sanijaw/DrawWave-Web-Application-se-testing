"""
Web Server Mode for Virtual Painter
This will start a WebSocket server that accepts video frames from a web frontend,
processes them for hand tracking, and sends back canvas data.
"""

from websocket_server import run_server

if __name__ == "__main__":
    print("Starting WebSocket server for Virtual Painter...")
    run_server() 