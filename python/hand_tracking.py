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

    def process_frame(self, image):
        """Process a frame and return the processed image, detected landmarks, and recognized gesture"""
        # First detect hands in the image
        processed_image, result = self.detect_hands(image)
        
        # Get the first hand landmarks if detected
        landmarks = None
        if result.multi_hand_landmarks:
            landmarks = result.multi_hand_landmarks[0]
        
        # Recognize the gesture based on the landmarks
        gesture = "idle"
        if landmarks:
            gesture = self.recognize_gesture(landmarks)
            
        return processed_image, landmarks, gesture
        
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

            # 🖊️ Drawing: Only index up
            if index_up and not middle_up and thumb_down and ring_down and pinky_down:
                return "drawing"

            # 🧽 Erasing: Index + middle up, others down
            if index_up and middle_up and thumb_down and ring_down and pinky_down:
                return "erase"

            # ✋ Idle: all fingers up
            if index_up and middle_up and not thumb_down and not ring_down and not pinky_down:
                return "idle"

        return "drawing"