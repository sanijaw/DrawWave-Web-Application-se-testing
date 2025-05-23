import sys
from PyQt5.QtWidgets import QApplication
from virtual_painter_gui import VirtualPainterGUI  # Import the canvas GUI directly

def main():
    app = QApplication(sys.argv)
    painter_gui = VirtualPainterGUI()  # Instantiate VirtualPainterGUI instead of StartScreen
    painter_gui.show()  # Show the canvas window directly
    sys.exit(app.exec_())

if __name__ == "__main__":
    main()
