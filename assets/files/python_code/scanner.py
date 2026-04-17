# ❀ © 2026 Capski. All Rights Reserved. ❀

import sys
import serial
import threading
import numpy as np
from PyQt5 import QtWidgets, QtCore
import pyqtgraph.opengl as gl


PORT = 'COM3'  
BAUD = 9600
SAVE_PATH = r"C:\Users\ASUS\Desktop\caps caps\scans\scan.ply"


class ScannerApp(QtWidgets.QWidget):
    def __init__(self):
        super().__init__()

        self.setWindowTitle("3D Scanner")
        self.setGeometry(100, 100, 900, 700)
        self.ser = serial.Serial(PORT, BAUD, timeout=1)
        self.points = []
        layout = QtWidgets.QVBoxLayout()
        self.view = gl.GLViewWidget()
        self.view.opts['distance'] = 50
        layout.addWidget(self.view)
        self.scatter = gl.GLScatterPlotItem()
        self.view.addItem(self.scatter)
        btn_layout = QtWidgets.QHBoxLayout()
        self.btn_home = QtWidgets.QPushButton("Homing (H)")
        self.btn_start = QtWidgets.QPushButton("Start Scan (S)")
        self.btn_stop = QtWidgets.QPushButton("Stop (P)")
        self.btn_save = QtWidgets.QPushButton("Save (Q)")
        self.btn_up = QtWidgets.QPushButton("Z Up (Hold)")
        self.btn_down = QtWidgets.QPushButton("Z Down (Hold)")
        btn_layout.addWidget(self.btn_home)
        btn_layout.addWidget(self.btn_start)
        btn_layout.addWidget(self.btn_stop)
        btn_layout.addWidget(self.btn_save)
        btn_layout.addWidget(self.btn_up)
        btn_layout.addWidget(self.btn_down)
        layout.addLayout(btn_layout)
        self.setLayout(layout)
        self.btn_home.clicked.connect(lambda: self.send_cmd('H'))
        self.btn_start.clicked.connect(lambda: self.send_cmd('S'))
        self.btn_stop.clicked.connect(lambda: self.send_cmd('P'))
        self.btn_save.clicked.connect(self.save_and_quit)
        self.btn_up.pressed.connect(lambda: self.send_cmd('U'))
        self.btn_up.released.connect(lambda: self.send_cmd('X'))
        self.btn_down.pressed.connect(lambda: self.send_cmd('D'))
        self.btn_down.released.connect(lambda: self.send_cmd('X'))
        self.running = True
        self.thread = threading.Thread(target=self.read_serial)
        self.thread.start()
        self.timer = QtCore.QTimer()
        self.timer.timeout.connect(self.update_plot)
        self.timer.start(100)

    # CEREAL

    def send_cmd(self, cmd):
        self.ser.write(cmd.encode())

    def read_serial(self):
        while self.running:
            try:
                line = self.ser.readline().decode().strip()
                if line:
                    parts = line.split(",")
                    if len(parts) == 3:
                        x, y, z = map(float, parts)
                        self.points.append([x, y, z])
            except:
                pass

    def keyPressEvent(self, event):
        if event.key() == QtCore.Qt.Key_W:
            self.send_cmd('U')
        if event.key() == QtCore.Qt.Key_S:
            self.send_cmd('D')

    def keyReleaseEvent(self, event):
        if event.key() in (QtCore.Qt.Key_W, QtCore.Qt.Key_S):
            self.send_cmd('X')

    # TYEYE

    def update_plot(self):
        if len(self.points) == 0:
            return

        pts = np.array(self.points)

        self.scatter.setData(
            pos=pts,
            size=2,
            pxMode=True
        )

    # SAVE

    def save_ply(self):
        with open(SAVE_PATH, 'w') as f:
            f.write("ply\nformat ascii 1.0\n")
            f.write(f"element vertex {len(self.points)}\n")
            f.write("property float x\nproperty float y\nproperty float z\n")
            f.write("end_header\n")

            for p in self.points:
                f.write(f"{p[0]} {p[1]} {p[2]}\n")

        print("Saved to:", SAVE_PATH)

    def save_and_quit(self):
        self.send_cmd('Q')
        self.save_ply()
        self.running = False
        self.ser.close()
        QtWidgets.QApplication.quit()

# DAGAN

if __name__ == "__main__":
    app = QtWidgets.QApplication(sys.argv)
    window = ScannerApp()
    window.show()
    sys.exit(app.exec_())