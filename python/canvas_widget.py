from PyQt5.QtWidgets import QWidget
from PyQt5.QtGui import QPainter, QImage, QMouseEvent
from PyQt5.QtCore import Qt

class CanvasWidget(QWidget):
    def __init__(self, canvas, parent=None):
        super().__init__(parent)
        self.canvas = canvas
        self.drawing = False
        self.last_pos = None
        self.current_display_canvas = None  # For cursor display
        
        # Cursor properties
        self.cursor_x = 0
        self.cursor_y = 0
        self.cursor_visible = False
        self.cursor_mode = "IDLE"

    def set_drawing(self, status):
        self.drawing = status

    def set_cursor(self, x, y, visible, mode):
        """Update cursor properties for direct drawing in paintEvent"""
        self.cursor_x = x
        self.cursor_y = y
        self.cursor_visible = visible
        self.cursor_mode = mode
    
    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing)
        
        # Draw the base canvas
        canvas_data = self.canvas.get_canvas()
        canvas_image = QImage(canvas_data.data,
                             self.canvas.width,
                             self.canvas.height,
                             self.canvas.width * 3,
                             QImage.Format_RGB888)
        painter.drawImage(0, 0, canvas_image)
        
        # Draw cursor if visible
        if self.cursor_visible:
            x, y = self.cursor_x, self.cursor_y
            
            # Set cursor color based on mode
            if self.cursor_mode == "DRAW":
                cursor_color = QColor(255, 165, 0)  # Orange for drawing
            elif self.cursor_mode == "ERASE":
                cursor_color = QColor(255, 0, 0)    # Red for erasing
            elif self.cursor_mode == "CLEAR":
                cursor_color = QColor(128, 0, 128)  # Purple for clear
            else:
                cursor_color = QColor(0, 0, 255)    # Blue for idle
            
            # Draw a large, very visible cursor
            # Outer colored glow effect
            painter.setPen(Qt.NoPen)
            glow = QRadialGradient(x, y, 25)
            glow.setColorAt(0, QColor(cursor_color.red(), cursor_color.green(), cursor_color.blue(), 150))
            glow.setColorAt(1, QColor(cursor_color.red(), cursor_color.green(), cursor_color.blue(), 0))
            painter.setBrush(glow)
            painter.drawEllipse(QPoint(x, y), 25, 25)
            
            # Main cursor circle
            painter.setBrush(Qt.NoBrush)
            painter.setPen(QPen(cursor_color, 3))
            painter.drawEllipse(x-15, y-15, 30, 30)
            
            # Inner solid circle
            painter.setBrush(cursor_color)
            painter.setPen(Qt.NoPen)
            painter.drawEllipse(x-8, y-8, 16, 16)
            
            # Crosshair lines
            painter.setPen(QPen(cursor_color, 2))
            painter.drawLine(x-25, y, x+25, y)
            painter.drawLine(x, y-25, x, y+25)
            
            # Mode label with better visibility
            painter.setPen(QPen(Qt.black, 1))  # Black outline
            painter.setFont(QFont("Arial", 10, QFont.Bold))
            text_x = x + 30
            text_y = y - 15
            # Draw text outline for better visibility
            for dx in [-1, 0, 1]:
                for dy in [-1, 0, 1]:
                    if dx != 0 or dy != 0:  # Skip the center position
                        painter.drawText(text_x + dx, text_y + dy, self.cursor_mode)
            # Draw the actual text
            painter.setPen(cursor_color)
            painter.drawText(text_x, text_y, self.cursor_mode)
        
    def update_canvas(self, canvas_data):
        """Update the canvas with the provided canvas data (including cursor overlay)"""
        self.current_display_canvas = canvas_data
        self.update()

    def mousePressEvent(self, event: QMouseEvent):
        if event.button() == Qt.LeftButton and getattr(self.parent(), "mode", "") == "mouse":
            self.drawing = True
            self.last_pos = event.pos()
            self.canvas.reset_previous_points()
            self.canvas.draw((event.x()/self.canvas.width, event.y()/self.canvas.height))
            self.update()

    def mouseMoveEvent(self, event: QMouseEvent):
        if self.drawing and getattr(self.parent(), "mode", "") == "mouse":
            current_pos = event.pos()
            self.canvas.draw((current_pos.x() / self.canvas.width, current_pos.y() / self.canvas.height))
            self.last_pos = current_pos
            self.update()

    def mouseReleaseEvent(self, event: QMouseEvent):
        if event.button() == Qt.LeftButton:
            self.drawing = False
            self.last_pos = None
