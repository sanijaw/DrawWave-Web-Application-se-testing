import cv2
import numpy as np
from PIL import Image

class Canvas:
    def __init__(self, width=640, height=480):
        self.width = width
        self.height = height
        self.canvas = np.ones((height, width, 3), dtype=np.uint8) * 255
        self.previous_point_gesture = None
        self.previous_point_erase = None
        self.brush_size = 10
        self.color = (0, 0, 0)
        self.history = []
        self.redo_stack = []
        self.cursor_position = (0, 0)
        self.history_limit = 50  # Added limit to history stack
        
        
    def set_cursor_position(self, x, y):
        # Convert normalized coordinates (0-1) to actual pixels
        x_pixel = int(x * self.width)
        y_pixel = int(y * self.height)
        
        # Ensure the cursor position is within canvas bounds
        x_pixel = max(0, min(self.width - 1, x_pixel))
        y_pixel = max(0, min(self.height - 1, y_pixel))
        
        # Store the cursor position
        self.cursor_position = (x_pixel, y_pixel)

    def draw_cursor(self):
        # Create a temporary copy of canvas for cursor drawing
        temp_canvas = self.canvas.copy()
        
        # Store cursor animation state if not already present
        if not hasattr(self, '_cursor_pulse_value'):
            self._cursor_pulse_value = 0
        if not hasattr(self, '_cursor_pulse_direction'):
            self._cursor_pulse_direction = 1
        if not hasattr(self, '_cursor_mode'):
            self._cursor_mode = "IDLE"
            
        # Create a pulsing effect for the cursor
        self._cursor_pulse_value += 0.5 * self._cursor_pulse_direction
        if self._cursor_pulse_value >= 10 or self._cursor_pulse_value <= 0:
            self._cursor_pulse_direction *= -1
            
        # Determine cursor color based on mode
        if hasattr(self, '_cursor_mode'):
            if self._cursor_mode == "DRAW":
                cursor_color = (0, 165, 255)  # Orange for drawing
            elif self._cursor_mode == "ERASE":
                cursor_color = (0, 0, 255)    # Red for erasing
            else:
                cursor_color = (255, 0, 0)    # Blue for idle
        else:
            cursor_color = (255, 0, 0)  # Default blue
            
        # Create a more sophisticated cursor
        # 1. Inner solid circle
        inner_radius = 5
        cv2.circle(temp_canvas, self.cursor_position, inner_radius, cursor_color, -1)
        
        # 2. Pulsing outer ring
        outer_radius = 7 + int(self._cursor_pulse_value/2)
        cv2.circle(temp_canvas, self.cursor_position, outer_radius, cursor_color, 2)
        
        # 3. Crosshair for precise positioning
        crosshair_size = 8
        x, y = self.cursor_position
        cv2.line(temp_canvas, (x - crosshair_size, y), (x + crosshair_size, y), cursor_color, 1)
        cv2.line(temp_canvas, (x, y - crosshair_size), (x, y + crosshair_size), cursor_color, 1)
        
        # 4. Add mode indicator text
        if hasattr(self, '_cursor_mode'):
            cv2.putText(temp_canvas, self._cursor_mode, 
                      (self.cursor_position[0] + 15, self.cursor_position[1] - 15),
                      cv2.FONT_HERSHEY_SIMPLEX, 0.6, cursor_color, 2)
        
        return temp_canvas  # Return for display without saving to history



    def draw(self, current_point):
        current_point = (int(current_point[0] * self.width), int(current_point[1] * self.height))

        if self.previous_point_gesture is None:
            self.previous_point_gesture = current_point
            return  # Don't draw on the first point
            
        # Only draw if movement is significant
        if self.previous_point_gesture != current_point:
            cv2.line(self.canvas, self.previous_point_gesture, current_point, self.color, self.brush_size)
            self.previous_point_gesture = current_point

            if not self.history or not np.array_equal(self.history[-1], self.canvas):
                self.history.append(self.canvas.copy())
                self.redo_stack.clear()





    def erase(self, current_point):
        current_point = (int(current_point[0] * self.width), int(current_point[1] * self.height))

        if self.previous_point_erase is None:
            self.previous_point_erase = current_point

        cv2.line(self.canvas, self.previous_point_erase, current_point, (255, 255, 255), self.brush_size + 10)

        self.previous_point_erase = current_point
        if not self.history or not np.array_equal(self.history[-1], self.canvas):
            self.history.append(self.canvas.copy())
            self.redo_stack.clear()
                    
        self.redo_stack.clear()
        
        
        


    def reset_previous_points(self):
        self.previous_point_gesture = None
        self.previous_point_erase = None

    def change_color(self, new_color):
        self.color = tuple(new_color[:3])

    def change_brush_size(self, new_size):
        self.brush_size = new_size

    def save(self, file_path):
        image = Image.fromarray(self.canvas)
        image.save(file_path)

        
    def clear(self):
        self.canvas = np.ones((self.height, self.width, 3), dtype=np.uint8) * 255
        self.history = []
        self.redo_stack = []
        self.reset_previous_points()
        
    def save(self, file_path):
        try:
            image = Image.fromarray(self.canvas)
            image.save(file_path)
            return True
        except Exception as e:
            print(f"Error saving image: {e}")
            return False

    def get_canvas(self):
        return self.canvas.copy()
        
    def set_canvas(self, canvas_image):
        """Set the canvas to the provided image.
        Used for restoring canvas state from saved data.
        """
        if canvas_image is None:
            return False
            
        # Ensure the image has the correct dimensions
        if canvas_image.shape[0] != self.height or canvas_image.shape[1] != self.width:
            canvas_image = cv2.resize(canvas_image, (self.width, self.height))
            
        # Ensure the image has 3 channels (BGR)
        if len(canvas_image.shape) == 2 or canvas_image.shape[2] == 1:
            canvas_image = cv2.cvtColor(canvas_image, cv2.COLOR_GRAY2BGR)
        elif canvas_image.shape[2] == 4:  # RGBA
            canvas_image = cv2.cvtColor(canvas_image, cv2.COLOR_RGBA2BGR)
            
        self.canvas = canvas_image.copy()
        return True
        
    def draw_line(self, start_point, end_point, color=None):
        """
        Draw a line directly between two points with specified coordinates.
        This is used for mouse drawing where we have exact pixel positions.
        
        Args:
            start_point: Tuple of (x, y) coordinates for the start of the line
            end_point: Tuple of (x, y) coordinates for the end of the line
            color: Optional BGR color tuple. If None, uses the current color
        """
        if color is None:
            color = self.color
            
        # Make sure points are within canvas bounds
        x1, y1 = start_point
        x2, y2 = end_point
        
        x1 = max(0, min(int(x1), self.width-1))
        y1 = max(0, min(int(y1), self.height-1))
        x2 = max(0, min(int(x2), self.width-1))
        y2 = max(0, min(int(y2), self.height-1))
        
        # Draw the line
        cv2.line(self.canvas, (x1, y1), (x2, y2), color, self.brush_size)
        
        # Add to history if changed
        if not self.history or not np.array_equal(self.history[-1], self.canvas):
            self.history.append(self.canvas.copy())
            if len(self.history) > self.history_limit:
                self.history.pop(0)  # Remove oldest item if we exceed limit
            self.redo_stack.clear()
