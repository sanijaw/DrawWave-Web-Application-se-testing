import mediapipe as mp
import cv2
from collections import deque

class HandTracker:
    def __init__(self):
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=1,
            min_detection_confidence=0.75,
            min_tracking_confidence=0.75
        )
        self.mp_drawing = mp.solutions.drawing_utils
        self.tip_history = deque(maxlen=5)  # For smoothing index fingertip
        
        
    def get_smoothed_tip(self, tip):
        self.tip_history.append((tip.x, tip.y))
        avg_x = sum(p[0] for p in self.tip_history) / len(self.tip_history)
        avg_y = sum(p[1] for p in self.tip_history) / len(self.tip_history)
        return (avg_x, avg_y)
        

    def detect_hands(self, image):
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        result = self.hands.process(image_rgb)
        if result.multi_hand_landmarks:
            for landmarks in result.multi_hand_landmarks:
                self.mp_drawing.draw_landmarks(image, landmarks, self.mp_hands.HAND_CONNECTIONS)
        return image, result

    def get_index_finger_position(self, landmarks):
        """Extract the position of the index finger tip from landmarks"""
        if landmarks:
            index_tip = landmarks.landmark[self.mp_hands.HandLandmark.INDEX_FINGER_TIP]
            # Return normalized coordinates (0-1)
            return (index_tip.x, index_tip.y)
        return None

    def process_frame(self, image):
        """Process a frame and return the processed image, detected landmarks, recognized gesture, and index finger position"""
        # First detect hands in the image
        processed_image, result = self.detect_hands(image)
        
        # Extract landmarks if hands were detected
        landmarks = None
        index_position = None
        if result.multi_hand_landmarks:
            landmarks = result.multi_hand_landmarks[0]
            if landmarks:
                index_position = self.get_index_finger_position(landmarks)
        
        # Recognize the gesture based on the landmarks
        gesture = "idle"
        if landmarks:
            gesture = self.recognize_gesture(landmarks)
            
        return processed_image, landmarks, gesture, index_position
        
    def recognize_gesture(self, landmarks):
        if landmarks:
            # Get fingertip and base landmarks
            tips = {
                "thumb": landmarks.landmark[self.mp_hands.HandLandmark.THUMB_TIP],
                "index": landmarks.landmark[self.mp_hands.HandLandmark.INDEX_FINGER_TIP],
                "middle": landmarks.landmark[self.mp_hands.HandLandmark.MIDDLE_FINGER_TIP],
                "ring": landmarks.landmark[self.mp_hands.HandLandmark.RING_FINGER_TIP],
                "pinky": landmarks.landmark[self.mp_hands.HandLandmark.PINKY_TIP],
            }

            bases = {
                "thumb": landmarks.landmark[self.mp_hands.HandLandmark.THUMB_IP],
                "index": landmarks.landmark[self.mp_hands.HandLandmark.INDEX_FINGER_MCP],
                "middle": landmarks.landmark[self.mp_hands.HandLandmark.MIDDLE_FINGER_MCP],
                "ring": landmarks.landmark[self.mp_hands.HandLandmark.RING_FINGER_MCP],
                "pinky": landmarks.landmark[self.mp_hands.HandLandmark.PINKY_MCP],
            }

            # Determine finger states
            index_up = tips["index"].y < bases["index"].y
            middle_up = tips["middle"].y < bases["middle"].y
            thumb_down = tips["thumb"].y > bases["thumb"].y
            ring_down = tips["ring"].y > bases["ring"].y
            pinky_down = tips["pinky"].y > bases["pinky"].y
            
            # Calculate distance between index and middle fingertips
            index_tip = tips["index"]
            middle_tip = tips["middle"]
            
            # Calculate Euclidean distance between index and middle finger tips
            # Convert to 3D coordinates for more accurate distance measurement
            index_pos = (index_tip.x, index_tip.y, index_tip.z)
            middle_pos = (middle_tip.x, middle_tip.y, middle_tip.z)
            
            # Calculate distance
            tip_distance = ((index_pos[0] - middle_pos[0])**2 + 
                           (index_pos[1] - middle_pos[1])**2 + 
                           (index_pos[2] - middle_pos[2])**2)**0.5
            
            # 🖊️ Drawing: Only index up
            if index_up and not middle_up and thumb_down and ring_down and pinky_down:
                return "drawing"

            # 🧽 Erasing: Index + middle up, others down
            if index_up and middle_up and thumb_down and ring_down and pinky_down:
                return "erase"

            # ↩️ Undo: All fingers up
            if index_up and middle_up and not thumb_down and not ring_down and not pinky_down:
                return "idle"
                
            # Idle: We'll default to idle for any unrecognized gestures

        return "drawing"