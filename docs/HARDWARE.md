# Hardware Setup Guide

This guide covers setting up the Raspberry Pi and hardware components for running Railroad Arcade in **Live Mode**.

## Table of Contents

- [Requirements](#requirements)
- [Raspberry Pi Setup](#raspberry-pi-setup)
- [GPIO Pin Mapping](#gpio-pin-mapping)
- [PWM Train Control](#pwm-train-control)
- [Camera Setup](#camera-setup)
- [Sensor Integration](#sensor-integration)
- [Network Configuration](#network-configuration)
- [API Server Setup](#api-server-setup)
- [Troubleshooting](#troubleshooting)

---

## Requirements

### Hardware

| Component | Recommended | Purpose |
|-----------|-------------|---------|
| Raspberry Pi | Pi 4 Model B (4GB+) | Main controller |
| MicroSD Card | 32GB+ Class 10 | OS and storage |
| Power Supply | 5V 3A USB-C | Pi power |
| PWM HAT | Adafruit 16-Channel PWM | Train speed control |
| Relay Board | 8-Channel 5V Relay | Building/scenery control |
| Camera | Pi Camera Module 3 | Live streaming |
| IR Sensors | TCRT5000 modules | Train detection |
| Level Shifter | 3.3V to 5V Bi-directional | Signal conversion |

### Software

- Raspberry Pi OS (64-bit recommended)
- Node.js 20.x LTS
- Python 3.11+
- FFmpeg (for camera streaming)

---

## Raspberry Pi Setup

### 1. Flash Raspberry Pi OS

```bash
# Download Raspberry Pi Imager from https://www.raspberrypi.com/software/
# Flash Raspberry Pi OS (64-bit) to your SD card
# Enable SSH in the imager settings
```

### 2. Initial Configuration

```bash
# Connect via SSH
ssh pi@raspberrypi.local

# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y git nodejs npm python3-pip ffmpeg

# Enable I2C, SPI, and Camera
sudo raspi-config
# Navigate to Interface Options and enable:
# - I2C
# - SPI
# - Camera (Legacy)
# - SSH

# Reboot
sudo reboot
```

### 3. Install Node.js 20.x

```bash
# Install Node.js via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node --version  # Should show v20.x.x
npm --version
```

---

## GPIO Pin Mapping

### Train Control (PWM)

Using Adafruit PCA9685 16-Channel PWM HAT:

| Channel | Function | Description |
|---------|----------|-------------|
| 0 | Track 1 Speed | Level 2 - Express Line |
| 1 | Track 1 Direction | Forward/Reverse relay |
| 2 | Track 2 Speed | Level 2 - Second train |
| 3 | Track 2 Direction | Forward/Reverse relay |
| 4 | Track 3 Speed | Level 1 - Local Line |
| 5 | Track 3 Direction | Forward/Reverse relay |
| 6-9 | Reserved | Future expansion |
| 10-15 | Lighting | Station/building lights |

### Relay Board Mapping

| Relay | GPIO | Function |
|-------|------|----------|
| 1 | GPIO 17 | Police Station Lights |
| 2 | GPIO 27 | Fire Station Lights |
| 3 | GPIO 22 | Cafe Lights |
| 4 | GPIO 23 | Smart Home |
| 5 | GPIO 24 | Construction Zone |
| 6 | GPIO 25 | Crossing Gate |
| 7 | GPIO 5 | Junction 1 Servo |
| 8 | GPIO 6 | Junction 2 Servo |

### Sensor Inputs

| Sensor | GPIO | Function |
|--------|------|----------|
| IR 1 | GPIO 12 | Track 1 Detection |
| IR 2 | GPIO 13 | Track 2 Detection |
| IR 3 | GPIO 16 | Track 3 Detection |
| IR 4 | GPIO 19 | Station 1 Arrival |
| IR 5 | GPIO 20 | Station 2 Arrival |
| IR 6 | GPIO 26 | Crossing Detection |

---

## PWM Train Control

### Wiring Diagram

```
Raspberry Pi         PCA9685 PWM HAT        Motor Driver
  3.3V ─────────────── VCC
  GND ──────────────── GND ────────────────── GND
  SDA (GPIO 2) ─────── SDA
  SCL (GPIO 3) ─────── SCL
                       PWM 0 ─────────────── Track 1 Speed
                       PWM 1 ─────────────── Track 1 Dir
                       ...
```

### Python Control Script

```python
# /opt/railroad-arcade/train_control.py
import board
import busio
from adafruit_pca9685 import PCA9685

# Initialize I2C and PWM
i2c = busio.I2C(board.SCL, board.SDA)
pca = PCA9685(i2c)
pca.frequency = 1000  # 1kHz for motor control

def set_train_speed(track_id: int, speed: int):
    """Set train speed (0-100)"""
    channel = (track_id - 1) * 2
    # Convert 0-100 to 0-65535 PWM duty cycle
    duty_cycle = int((speed / 100) * 65535)
    pca.channels[channel].duty_cycle = duty_cycle

def set_train_direction(track_id: int, forward: bool):
    """Set train direction"""
    channel = (track_id - 1) * 2 + 1
    pca.channels[channel].duty_cycle = 65535 if forward else 0

def emergency_stop():
    """Stop all trains immediately"""
    for i in range(6):
        pca.channels[i].duty_cycle = 0
```

---

## Camera Setup

### Single Camera (Pi Camera Module)

```bash
# Install camera tools
sudo apt install -y libcamera-apps

# Test camera
libcamera-hello

# Start MJPEG stream
libcamera-vid -t 0 --width 1280 --height 720 --framerate 30 \
  --codec mjpeg -o - | \
  ffmpeg -i - -c:v copy -f mjpeg http://localhost:8081/stream.mjpg
```

### Multi-Camera Setup (USB Cameras)

```bash
# Install motion for multi-camera support
sudo apt install -y motion

# Configure /etc/motion/motion.conf
# Set up multiple camera threads

# Start motion daemon
sudo systemctl enable motion
sudo systemctl start motion
```

### Camera Stream URLs

| Camera | URL | Description |
|--------|-----|-------------|
| Main | `http://pi:8081/stream.mjpg` | Overview camera |
| Station 1 | `http://pi:8082/stream.mjpg` | Grand Central |
| Station 2 | `http://pi:8083/stream.mjpg` | Valley Station |
| Action | `http://pi:8084/stream.mjpg` | Track action cam |

---

## Sensor Integration

### IR Train Detection

```python
# /opt/railroad-arcade/sensors.py
import RPi.GPIO as GPIO
import time

GPIO.setmode(GPIO.BCM)

# Sensor pins
SENSORS = {
    'track1': 12,
    'track2': 13,
    'track3': 16,
    'station1': 19,
    'station2': 20,
    'crossing': 26,
}

# Setup inputs with pull-up resistors
for pin in SENSORS.values():
    GPIO.setup(pin, GPIO.IN, pull_up_down=GPIO.PUD_UP)

def on_train_detected(channel):
    """Callback when train detected"""
    sensor_name = [k for k, v in SENSORS.items() if v == channel][0]
    timestamp = time.time()
    # Send event to API server
    print(f"Train detected at {sensor_name} at {timestamp}")

# Add event detection
for pin in SENSORS.values():
    GPIO.add_event_detect(pin, GPIO.FALLING,
                          callback=on_train_detected,
                          bouncetime=200)
```

---

## Network Configuration

### Static IP Setup

```bash
# Edit dhcpcd.conf
sudo nano /etc/dhcpcd.conf

# Add static IP configuration
interface eth0
static ip_address=192.168.1.100/24
static routers=192.168.1.1
static domain_name_servers=192.168.1.1 8.8.8.8
```

### Firewall Rules

```bash
# Allow API server port
sudo ufw allow 3001/tcp

# Allow camera streams
sudo ufw allow 8081:8084/tcp

# Enable firewall
sudo ufw enable
```

---

## API Server Setup

### Install and Run

```bash
# Clone the API server
git clone https://github.com/yourusername/railroad-api.git /opt/railroad-api
cd /opt/railroad-api

# Install dependencies
npm install

# Create environment file
cp .env.example .env
nano .env

# Start the server
npm start
```

### Environment Variables

```env
# /opt/railroad-api/.env
PORT=3001
HOST=0.0.0.0

# PWM Configuration
PWM_I2C_ADDRESS=0x40
PWM_FREQUENCY=1000

# Camera URLs
CAMERA_MAIN=http://localhost:8081/stream.mjpg
CAMERA_STATION1=http://localhost:8082/stream.mjpg
CAMERA_STATION2=http://localhost:8083/stream.mjpg
CAMERA_ACTION=http://localhost:8084/stream.mjpg

# Security
API_KEY=your-secret-api-key
CORS_ORIGINS=https://railroad-arcade-v5.vercel.app
```

### Systemd Service

```bash
# Create service file
sudo nano /etc/systemd/system/railroad-api.service
```

```ini
[Unit]
Description=Railroad Arcade API Server
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/opt/railroad-api
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable railroad-api
sudo systemctl start railroad-api

# Check status
sudo systemctl status railroad-api
```

---

## Troubleshooting

### Common Issues

#### PWM HAT Not Detected

```bash
# Check I2C devices
sudo i2cdetect -y 1

# Should show device at 0x40
# If not shown, check wiring and enable I2C in raspi-config
```

#### Camera Not Working

```bash
# Check if camera is detected
libcamera-hello --list-cameras

# Check camera cable connection
# Ensure camera is enabled in raspi-config
```

#### API Server Not Starting

```bash
# Check logs
sudo journalctl -u railroad-api -f

# Common fixes:
# - Ensure Node.js is installed
# - Check port availability: sudo lsof -i :3001
# - Verify environment variables
```

#### GPIO Permission Denied

```bash
# Add user to gpio group
sudo usermod -aG gpio pi

# Or run with sudo (not recommended for production)
```

### Performance Optimization

```bash
# Increase GPU memory for camera
sudo nano /boot/config.txt
# Add: gpu_mem=256

# Disable unnecessary services
sudo systemctl disable bluetooth
sudo systemctl disable avahi-daemon

# Set CPU governor to performance
echo performance | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```

---

## Testing

### Test Train Control

```bash
curl -X POST http://localhost:3001/api/trains/1/speed \
  -H "Content-Type: application/json" \
  -d '{"speed": 50}'
```

### Test Camera Stream

```bash
# Open in browser or use curl
curl -I http://localhost:8081/stream.mjpg
```

### Test Sensors

```bash
# Run sensor test script
python3 /opt/railroad-arcade/test_sensors.py
```

---

## Support

For hardware-related issues:
- Check the [GitHub Discussions](https://github.com/yourusername/railroad-arcade/discussions)
- Open an issue with the `hardware` label
- Include your Pi model, OS version, and error logs

---

## Safety Notes

- Always use appropriate fuses for track power
- Never exceed motor driver current ratings
- Keep high-voltage track power isolated from Pi GPIO
- Use optocouplers for sensor isolation
- Ensure proper grounding throughout the system
