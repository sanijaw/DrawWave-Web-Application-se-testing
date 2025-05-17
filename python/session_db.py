import requests
import json
import base64
import traceback
import time

class SessionDB:
    """
    A class to interact with the Node.js backend for session management.
    """
    def __init__(self, api_url="http://localhost:5000/api"):
        self.api_url = api_url
    
    def check_session_exists(self, session_id):
        """
        Check if a session exists in MongoDB.
        Returns a tuple (exists, session_data) where exists is a boolean and session_data is the session data if it exists.
        """
        try:
            response = requests.get(f"{self.api_url}/sessions/{session_id}")
            data = response.json()
            
            if response.status_code == 200 and data.get('success'):
                return True, data.get('data')
            return False, None
        except Exception as e:
            print(f"Error checking session: {e}")
            return False, None
    
    def get_session(self, session_id):
        """
        Get a session from MongoDB by session ID.
        Returns the session data or None if the session doesn't exist.
        """
        try:
            response = requests.get(f"{self.api_url}/sessions/{session_id}")
            data = response.json()
            
            if response.status_code == 200 and data.get('success'):
                return data.get('data')
            return None
        except Exception as e:
            print(f"Error getting session: {e}")
            return None
    
    def create_user(self, user_name, session_id, room_id):
        """
        Create a user in MongoDB with retry logic.
        """
        max_retries = 3
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                print(f"Attempting to create user: {user_name} for session {session_id} (attempt {retry_count + 1})")
                response = requests.post(
                    f"{self.api_url}/users/create",
                    json={
                        "userName": user_name,
                        "sessionId": session_id,
                        "roomId": room_id
                    },
                    timeout=10  # Add timeout to prevent hanging requests
                )
                
                data = response.json()
                
                if response.status_code == 201 and data.get('success'):
                    print(f"Successfully created user: {user_name} for session {session_id}")
                    return True, data.get('data')
                elif response.status_code == 400 and "already exists" in data.get('message', ''):
                    # User or session already exists, consider this a success
                    print(f"User already exists: {user_name} for session {session_id}")
                    return True, None
                else:
                    error_msg = data.get('message', 'Unknown error')
                    print(f"Failed to create user: {error_msg} (Status: {response.status_code})")
                    
                    if retry_count < max_retries - 1:
                        retry_count += 1
                        time.sleep(1)  # Wait before retrying
                        continue
                    return False, None
            except requests.exceptions.RequestException as e:
                print(f"Network error creating user: {e}")
                if retry_count < max_retries - 1:
                    retry_count += 1
                    time.sleep(1)  # Wait before retrying
                    continue
                return False, None
            except Exception as e:
                print(f"Unexpected error creating user: {e}")
                print(traceback.format_exc())
                return False, None
            
    def update_canvas_state(self, session_id, canvas_base64, is_drawing_layer=False):
        """
        Update the canvas state in MongoDB. This allows canvas persistence between sessions.
        """
        try:
            # Remove the data URL prefix if present
            if canvas_base64.startswith('data:image/png;base64,'):
                canvas_base64 = canvas_base64.replace('data:image/png;base64,', '')
                
            response = requests.post(
                f"{self.api_url}/sessions/update-canvas",
                json={
                    "sessionId": session_id,
                    "canvasData": canvas_base64,
                    "isDrawingLayer": is_drawing_layer
                }
            )
            
            data = response.json()
            if response.status_code == 200 and data.get('success'):
                return True
            return False
        except Exception as e:
            print(f"Error updating canvas state: {e}")
            return False
            
    def get_all_active_sessions(self):
        """
        Get all active sessions from MongoDB.
        Returns a list of session data objects or None if there are no active sessions.
        """
        try:
            response = requests.get(f"{self.api_url}/sessions/active")
            data = response.json()
            
            if response.status_code == 200 and data.get('success'):
                return data.get('data')
            return None
        except Exception as e:
            print(f"Error getting active sessions: {e}")
            return None
