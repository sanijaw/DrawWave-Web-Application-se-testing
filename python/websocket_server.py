import asyncio
import websockets
import json
import base64
import cv2
import numpy as np
import uuid
from hand_tracking import HandTracker
from canvas import Canvas
import threading
import io
from PIL import Image
from session_db import SessionDB

class WebSocketServer:
    def __init__(self, host="0.0.0.0", port=8765):
        self.host = host
        self.port = port
        self.sessions = {}  # Dictionary to track sessions: {session_id: {"canvas": Canvas, "clients": set()}}
        self.client_sessions = {}  # Mapping of clients to their sessions: {websocket: session_id}
        self.hand_tracker = HandTracker()
        self.lock = threading.Lock()
        self.session_db = SessionDB()  # Initialize connection to MongoDB via Node.js API

    def create_session(self):
        """Create a new session and return the session ID"""
        session_id = str(uuid.uuid4())[:8]  # Generate a shorter, user-friendly ID
        self.sessions[session_id] = {
            "canvas": Canvas(),
            "clients": set(),
            "lock": threading.Lock()
        }
        return session_id

    async def broadcast_to_session(self, session_id, message, exclude=None):
        """Broadcast a message to all clients in a session except the excluded one"""
        if session_id not in self.sessions:
            return

        for client in self.sessions[session_id]["clients"]:
            if client != exclude and client.open:
                try:
                    await client.send(message)
                except:
                    pass

    async def handle_client(self, websocket):
        session_id = None
        try:
            async for message in websocket:
                try:
                    # Parse the incoming message
                    data = json.loads(message)
                    message_type = data.get("type")

                    # Handle session creation and joining
                    if message_type == "create_session":
                        user_name = data.get("user_name")
                        room_id = data.get("room_id")
                        session_id = data.get("session_id")

                        # Create the session in-memory
                        if session_id not in self.sessions:
                            self.sessions[session_id] = {
                                "canvas": Canvas(),
                                "room_id": room_id,
                                "clients": set(),
                                "lock": threading.Lock()
                            }
                        
                        self.sessions[session_id]["clients"].add(websocket)
                        self.client_sessions[websocket] = session_id
                        
                        # Create the session in MongoDB if it doesn't exist
                        mongo_session = self.session_db.get_session(session_id)
                        if not mongo_session:
                            # Also create the user in MongoDB
                            self.session_db.create_user(user_name, session_id, room_id)
                            
                        await websocket.send(json.dumps({
                            "type": "session_created",
                            "session_id": session_id,
                            "room_id": room_id
                        }))
                        continue

                    elif message_type == "join_session":
                        requested_session_id = data.get("session_id")
                        user_name = data.get("user_name")
                        
                        # First check if session exists in memory
                        if requested_session_id in self.sessions:
                            session_id = requested_session_id
                            room_id = self.sessions[session_id].get("room_id")
                        else:
                            # If not in memory, check MongoDB
                            mongo_session = self.session_db.get_session(requested_session_id)
                            if mongo_session:
                                # Session exists in MongoDB but not in memory, create it
                                session_id = requested_session_id
                                room_id = mongo_session.get("roomId")
                                
                                self.sessions[session_id] = {
                                    "canvas": Canvas(),
                                    "room_id": room_id,
                                    "clients": set(),
                                    "lock": threading.Lock()
                                }
                                
                                # Restore canvas state if available
                                canvas_data = mongo_session.get("canvasData")
                                if canvas_data and canvas_data.startswith("data:image/png;base64,"):
                                    # Extract base64 part and restore canvas
                                    base64_data = canvas_data.split(",")[1]
                                    canvas_bytes = base64.b64decode(base64_data)
                                    img = Image.open(io.BytesIO(canvas_bytes))
                                    cv_img = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
                                    self.sessions[session_id]["canvas"].set_canvas(cv_img)
                            else:
                                # Session not found anywhere
                                await websocket.send(json.dumps({
                                    "type": "error",
                                    "message": "Session not found",
                                    "errorCode": "session_not_found"
                                }))
                                continue
                        
                        # Session exists, add client
                        self.sessions[session_id]["clients"].add(websocket)
                        self.client_sessions[websocket] = session_id
                        
                        # Create or update user in MongoDB
                        self.session_db.create_user(user_name, session_id, room_id)

                        # Get current canvas state to send to the new client
                        with self.sessions[session_id]["lock"]:
                            canvas_image = self.sessions[session_id]["canvas"].get_canvas()
                            _, buffer = cv2.imencode('.png', canvas_image)
                            canvas_base64 = base64.b64encode(buffer).decode('utf-8')

                        # Notify the client that they've joined successfully
                        await websocket.send(json.dumps({
                            "type": "session_joined",
                            "session_id": session_id,
                            "room_id": room_id,
                            "canvas": f"data:image/png;base64,{canvas_base64}",
                            "participants": len(self.sessions[session_id]["clients"])
                        }))

                        # Notify other session participants about the new joiner
                        await self.broadcast_to_session(session_id, json.dumps({
                            "type": "participant_joined",
                            "participants": len(self.sessions[session_id]["clients"])
                        }), exclude=websocket)
                        continue
                    
                    # Additional message handling below
                    
                    # All other message types require a session

                    # All other message types require a session
                    if not session_id or session_id not in self.sessions:
                        await websocket.send(json.dumps({
                            "type": "error",
                            "message": "No active session. Please create or join a session."
                        }))
                        continue

                    if message_type == "frame":
                        # Process video frame
                        frame_data = data.get("frame")

                        # Validate frame data
                        if not frame_data or ',' not in frame_data:
                            print("Error: Invalid frame data format")
                            await websocket.send(json.dumps({
                                "type": "error",
                                "message": "Invalid frame data format"
                            }))
                            continue

                        # Ensure we have a valid session
                        if not session_id or session_id not in self.sessions:
                            await websocket.send(json.dumps({
                                "type": "error",
                                "message": "No active session"
                            }))
                            continue

                        try:
                            # Decode base64 image
                            img_data = base64.b64decode(frame_data.split(',')[1])

                            # Check if decoded data is empty
                            if len(img_data) == 0:
                                print("Error: Empty image data")
                                await websocket.send(json.dumps({
                                    "type": "error",
                                    "message": "Empty image data"
                                }))
                                continue

                            nparr = np.frombuffer(img_data, np.uint8)
                            # Check if array is empty
                            if nparr.size == 0:
                                print("Error: Empty image array")
                                await websocket.send(json.dumps({
                                    "type": "error",
                                    "message": "Empty image array"
                                }))
                                continue

                            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                            # Check if imdecode failed
                            if frame is None:
                                print("Error: Failed to decode image")
                                await websocket.send(json.dumps({
                                    "type": "error",
                                    "message": "Failed to decode image"
                                }))
                                continue

                            # Process frame with hand tracking
                            session = self.sessions[session_id]
                            with session["lock"]:
                                processed_frame, result = self.hand_tracker.detect_hands(frame)

                                # Process hand gestures if landmarks detected
                                if result.multi_hand_landmarks:
                                    landmarks = result.multi_hand_landmarks[0]
                                    gesture = self.hand_tracker.recognize_gesture(landmarks)
                                    self.handle_gesture(session["canvas"], gesture, landmarks)

                                # Get current canvas state
                                canvas_image = session["canvas"].get_canvas()

                                # Convert canvas to base64 for sending to frontend
                                _, buffer = cv2.imencode('.png', canvas_image)
                                canvas_base64 = base64.b64encode(buffer).decode('utf-8')

                                # Broadcast to all clients in session
                                update_message = json.dumps({
                                    "type": "canvas_update",
                                    "canvas": f"data:image/png;base64,{canvas_base64}"
                                })

                                # Send update to all clients in the session
                                await self.broadcast_to_session(session_id, update_message)
                        except Exception as e:
                            print(f"Error decoding image: {e}")
                            await websocket.send(json.dumps({
                                "type": "error",
                                "message": f"Error decoding image: {str(e)}"
                            }))
                            continue

                    elif message_type == "clear_canvas":
                        if session_id in self.sessions:
                            with self.sessions[session_id]["lock"]:
                                self.sessions[session_id]["canvas"].clear()

                                # Send updated canvas back to all clients
                                canvas_image = self.sessions[session_id]["canvas"].get_canvas()
                                _, buffer = cv2.imencode('.png', canvas_image)
                                canvas_base64 = base64.b64encode(buffer).decode('utf-8')
                                canvas_data_url = f"data:image/png;base64,{canvas_base64}"
                                
                                # Save canvas state to MongoDB
                                self.session_db.update_canvas_state(session_id, canvas_data_url, is_drawing_layer=False)
                                
                                update_message = json.dumps({
                                    "type": "canvas_update",
                                    "canvas": canvas_data_url
                                })
                                await self.broadcast_to_session(session_id, update_message)

                    elif message_type == "change_color":
                        if session_id in self.sessions:
                            with self.sessions[session_id]["lock"]:
                                color = data.get("color", [0, 0, 0])
                                self.sessions[session_id]["canvas"].change_color(color)
    
                                # Notify other clients about the color change
                                color_message = json.dumps({
                                    "type": "color_changed",
                                    "color": color
                                })
                                await self.broadcast_to_session(session_id, color_message, exclude=websocket)
                    
                    elif message_type == "mouse_draw":
                        if session_id in self.sessions:
                            # Handle mouse drawing events
                            start = data.get("start")
                            end = data.get("end")
                            color = data.get("color")
                            
                            if start and end and color:
                                # Process the drawing action with a lock to prevent race conditions
                                with self.sessions[session_id]["lock"]:
                                    # Convert color from hex to BGR
                                    color_hex = color.lstrip('#')
                                    color_rgb = tuple(int(color_hex[i:i+2], 16) for i in (0, 2, 4))
                                    cv_color = (color_rgb[2], color_rgb[1], color_rgb[0])  # RGB to BGR
                                    
                                    # Get coordinates
                                    start_point = (int(start["x"]), int(start["y"]))
                                    end_point = (int(end["x"]), int(end["y"]))
                                    
                                    # Draw line on canvas
                                    canvas = self.sessions[session_id]["canvas"]
                                    canvas.draw_line(start_point, end_point, cv_color)
                                
                                # Forward drawing event immediately to all other clients
                                # This is a small message containing just the line segment data for low-latency updates
                                draw_message = json.dumps({
                                    "type": "mouse_draw",
                                    "start": start,
                                    "end": end,
                                    "color": color
                                })
                                await self.broadcast_to_session(session_id, draw_message, exclude=websocket)
                    
                    elif message_type == "drawing_update":
                        if session_id in self.sessions:
                            # Handle complete drawing canvas updates
                            drawing_data = data.get("drawing", "")
                            
                            if drawing_data and drawing_data.startswith("data:image/png;base64,"):
                                # Use a lock to prevent race conditions when updating canvas state
                                with self.sessions[session_id]["lock"]:
                                    # Save drawing layer to MongoDB only if it's a final update (e.g., when drawing stops)
                                    if data.get("isFinal", False):
                                        self.session_db.update_canvas_state(session_id, drawing_data, is_drawing_layer=True)
                                
                                # Forward the drawing update to all other clients
                                drawing_message = json.dumps({
                                    "type": "drawing_update",
                                    "drawing": drawing_data
                                })
                                await self.broadcast_to_session(session_id, drawing_message, exclude=websocket)
                
                except Exception as e:
                    print(f"Error processing message: {e}")
                    await websocket.send(json.dumps({"type": "error", "message": str(e)}))

        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            # Clean up session and client data
            if websocket in self.client_sessions:
                session_id = self.client_sessions[websocket]
                if session_id in self.sessions:
                    self.sessions[session_id]["clients"].remove(websocket)

                    # Notify remaining clients about participant leaving
                    remaining_clients = len(self.sessions[session_id]["clients"])
                    if remaining_clients > 0:
                        asyncio.create_task(self.broadcast_to_session(session_id, json.dumps({
                            "type": "participant_left",
                            "participants": remaining_clients
                        })))
                    else:
                        # If no clients left, delete the session
                        del self.sessions[session_id]

                del self.client_sessions[websocket]

    def handle_gesture(self, canvas, gesture, landmarks):
        index_tip = landmarks.landmark[8]

        if gesture == "drawing":
            canvas.draw((index_tip.x, index_tip.y))

        elif gesture == "erase":
            middle_tip = landmarks.landmark[12]
            midpoint = ((index_tip.x + middle_tip.x) / 2, (index_tip.y + middle_tip.y) / 2)
            canvas.erase(midpoint)

        elif gesture == "idle":
            canvas.reset_previous_points()

    async def start_server(self):
        async with websockets.serve(self.handle_client, self.host, self.port):
            print(f"WebSocket server started at ws://{self.host}:{self.port}")
            await asyncio.Future()  # Run forever

def run_server():
    server = WebSocketServer()
    asyncio.run(server.start_server())

if __name__ == "__main__":
    run_server() 