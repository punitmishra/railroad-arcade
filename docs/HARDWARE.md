# Hardware Setup Guide

Complete guide for setting up the Raspberry Pi and hardware components for **Live Mode** operation.

## Table of Contents

- [System Overview](#system-overview)
- [Hardware Requirements](#hardware-requirements)
- [Raspberry Pi Setup](#raspberry-pi-setup)
- [Rust Backend Installation](#rust-backend-installation)
- [Hardware Connections](#hardware-connections)
- [Camera Setup](#camera-setup)
- [Network Configuration](#network-configuration)
- [Systemd Service](#systemd-service)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Raspberry Pi 4                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Rust Backend (Actix-web)                  │  │
│  │              Port 5000 - REST API                      │  │
│  │              Port 8080 - MJPEG Stream                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   I2C Bus   │  │   Serial    │  │      USB            │  │
│  │   (PWM)     │  │   (CPX)     │  │    Camera           │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │             │
└─────────┼────────────────┼─────────────────────┼─────────────┘
          │                │                     │
          ▼                ▼                     ▼
   ┌──────────────┐ ┌──────────────┐     ┌──────────────┐
   │   PCA9685    │ │     CPX      │     │   Webcam     │
   │  PWM Driver  │ │ (Adafruit)   │     │  (Logitech)  │
   │              │ │              │     │              │
   │  • Motor 1   │ │  • Servo 1-4 │     │  • 640x480   │
   │  • Motor 2   │ │  • Gate      │     │  • 30 FPS    │
   │  • Motor 3   │ │  • LEDs      │     │  • MJPEG     │
   │              │ │  • Buzzer    │     │              │
   └──────────────┘ └──────────────┘     └──────────────┘
```

---

## Hardware Requirements

### Core Components

| Component | Model | Purpose | Est. Cost |
|-----------|-------|---------|-----------|
| Single Board Computer | Raspberry Pi 4 (4GB) | Main controller | $55 |
| Power Supply | USB-C 5V 3A | Pi power | $10 |
| MicroSD Card | 32GB+ Class 10 | OS and storage | $10 |
| PWM Driver | PCA9685 16-Channel | Motor speed control | $10 |
| Microcontroller | Circuit Playground Express | Servo/LED/Sound | $25 |
| Distance Sensors | HC-SR04 (x6) | Train detection | $12 |
| USB Camera | Logitech C270/C920 | Video streaming | $30-80 |

### Model Railroad Components

| Component | Qty | Purpose |
|-----------|-----|---------|
| DC Motor Trains | 3 | Level 1 and 2 trains |
| Track Segments | - | HO scale track layout |
| Track Feeders | 3 | Power delivery points |
| Motor Driver | 1 | L298N or similar |
| Servo Motors | 4 | Junction switches |
| Gate Servo | 1 | Crossing gate |
| LEDs | - | Scenery lighting |

### Power Supply

| Component | Voltage | Current | Purpose |
|-----------|---------|---------|---------|
| Pi Power | 5V | 3A | Raspberry Pi |
| Track Power | 12V | 5A | DC train motors |
| Servo Power | 5V | 2A | CPX and servos |

---

## Raspberry Pi Setup

### 1. Flash Raspberry Pi OS

```bash
# Download Raspberry Pi Imager
# https://www.raspberrypi.com/software/

# Flash Raspberry Pi OS (64-bit Lite) to SD card
# In Imager settings:
# - Enable SSH
# - Set username/password
# - Configure WiFi (optional)
```

### 2. Initial Configuration

```bash
# Connect via SSH
ssh pi@raspberrypi.local

# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y \
    git \
    curl \
    build-essential \
    pkg-config \
    libssl-dev \
    libudev-dev \
    v4l-utils \
    ffmpeg

# Enable I2C and Serial
sudo raspi-config
# Interface Options → Enable:
#   - I2C
#   - Serial Port (disable login shell, enable hardware)

# Reboot
sudo reboot
```

### 3. Install Rust

```bash
# Install Rust via rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add to PATH
source $HOME/.cargo/env

# Verify installation
rustc --version
cargo --version
```

---

## Rust Backend Installation

### 1. Clone Repository

```bash
# Create application directory
sudo mkdir -p /opt/railroad
sudo chown pi:pi /opt/railroad
cd /opt/railroad

# Clone the backend repository
git clone https://github.com/punitmishra/pi-railroad-controller.git
cd pi-railroad-controller
```

### 2. Build the Application

```bash
# Build release version (optimized)
cargo build --release

# Binary will be at: target/release/pi-railroad-controller
```

### 3. Configuration

Create `/opt/railroad/pi-railroad-controller/config.toml`:

```toml
[server]
host = "0.0.0.0"
port = 5000

[hardware]
# PCA9685 PWM driver address
pwm_address = 0x40
pwm_frequency = 1000

# Circuit Playground Express serial port
cpx_port = "/dev/ttyACM0"
cpx_baud = 115200

# Track configuration
[tracks]
track1_channel = 0
track2_channel = 1
track3_channel = 2

[camera]
device = "/dev/video0"
width = 640
height = 480
fps = 30
stream_port = 8080

[sensors]
# HC-SR04 trigger/echo GPIO pins
sensor1_trigger = 23
sensor1_echo = 24
sensor2_trigger = 25
sensor2_echo = 8
# ... additional sensors
```

### 4. Run Manually (Testing)

```bash
cd /opt/railroad/pi-railroad-controller
./target/release/pi-railroad-controller
```

---

## Hardware Connections

### PCA9685 PWM Driver (I2C)

```
Raspberry Pi              PCA9685
─────────────────────────────────
3.3V (Pin 1)    ───────   VCC
GND  (Pin 6)    ───────   GND
SDA  (Pin 3)    ───────   SDA
SCL  (Pin 5)    ───────   SCL

                          PWM 0  ───→  Track 1 Motor Driver
                          PWM 1  ───→  Track 2 Motor Driver
                          PWM 2  ───→  Track 3 Motor Driver
```

### Circuit Playground Express (USB Serial)

```
Raspberry Pi              CPX
─────────────────────────────────
USB Port        ───────   USB Cable

CPX Pin Mapping:
  A1 → Servo 1 (Junction 1)
  A2 → Servo 2 (Junction 2)
  A3 → Servo 3 (Junction 3)
  A4 → Servo 4 (Gate)
```

### HC-SR04 Distance Sensors (GPIO)

```
Raspberry Pi              HC-SR04
─────────────────────────────────
5V   (Pin 2)    ───────   VCC
GND  (Pin 6)    ───────   GND
GPIO 23         ───────   TRIG
GPIO 24 ──┬──── ECHO ──── 1kΩ ──┐
          │                     │
          └───── 2kΩ ───────────┴── GND
          (Voltage divider: 5V → 3.3V)
```

### Motor Driver (L298N)

```
PCA9685 PWM Output        L298N
─────────────────────────────────
PWM 0           ───────   ENA (Enable A)
                          IN1 ─── Direction control
                          IN2 ─── Direction control
                          OUT1 ──┬── Track 1 Feeder (+)
                          OUT2 ──┴── Track 1 Feeder (-)

12V Supply      ───────   +12V
GND             ───────   GND
```

---

## Camera Setup

### USB Camera Configuration

```bash
# List video devices
v4l2-ctl --list-devices

# Check camera capabilities
v4l2-ctl -d /dev/video0 --list-formats-ext

# Test camera (display on console)
ffmpeg -f v4l2 -video_size 640x480 -i /dev/video0 -f null -
```

### Camera Stream URL

When the Rust backend is running:
- API: `http://raspberry-pi:5000/api/...`
- Stream: `http://raspberry-pi:8080/stream`

The MJPEG stream can be viewed directly in a browser or embedded in an `<img>` tag:

```html
<img src="http://raspberry-pi:8080/stream" />
```

---

## Network Configuration

### Static IP (Recommended)

```bash
# Edit dhcpcd configuration
sudo nano /etc/dhcpcd.conf

# Add static IP
interface eth0
static ip_address=192.168.1.100/24
static routers=192.168.1.1
static domain_name_servers=192.168.1.1 8.8.8.8
```

### mDNS Hostname

The Pi is accessible at `raspberrypi.local` by default. To change:

```bash
sudo hostnamectl set-hostname railroad-pi
# Now accessible at railroad-pi.local
```

### Firewall (UFW)

```bash
# Install UFW
sudo apt install -y ufw

# Allow SSH
sudo ufw allow 22/tcp

# Allow API server
sudo ufw allow 5000/tcp

# Allow camera stream
sudo ufw allow 8080/tcp

# Enable firewall
sudo ufw enable
```

### Remote Access Options

1. **Local Network**: Direct IP access
2. **Cloudflare Tunnel**: Secure public access without port forwarding
3. **Tailscale/ZeroTier**: VPN mesh network

---

## Systemd Service

### Create Service File

```bash
sudo nano /etc/systemd/system/railroad.service
```

```ini
[Unit]
Description=Railroad Arcade - Rust Backend
After=network.target

[Service]
Type=simple
User=pi
Group=pi
WorkingDirectory=/opt/railroad/pi-railroad-controller
ExecStart=/opt/railroad/pi-railroad-controller/target/release/pi-railroad-controller
Restart=always
RestartSec=5
Environment=RUST_LOG=info

# Hardware access
SupplementaryGroups=gpio i2c dialout video

[Install]
WantedBy=multi-user.target
```

### Enable and Start

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable on boot
sudo systemctl enable railroad

# Start service
sudo systemctl start railroad

# Check status
sudo systemctl status railroad

# View logs
sudo journalctl -u railroad -f
```

---

## Testing

### Test I2C Connection

```bash
# Detect PCA9685 (should show 0x40)
sudo i2cdetect -y 1
```

### Test Serial Connection

```bash
# List USB devices
ls -la /dev/ttyACM*

# Test CPX communication
screen /dev/ttyACM0 115200
# Type: STATUS
# Should receive JSON response
```

### Test API Endpoints

```bash
# System status
curl http://localhost:5000/api/status

# Get tracks
curl http://localhost:5000/api/tracks

# Set track speed
curl -X POST http://localhost:5000/api/tracks/1/speed \
  -H "Content-Type: application/json" \
  -d '{"speed": 50}'

# Emergency stop
curl -X POST http://localhost:5000/api/emergency-stop

# Get CPX status
curl http://localhost:5000/api/cpx/status

# Set servo angle
curl -X POST http://localhost:5000/api/cpx/servo/1/45

# Set gate
curl -X POST http://localhost:5000/api/cpx/gate/down
```

### Test Camera Stream

```bash
# Check camera status
curl http://localhost:5000/api/camera/status

# Start camera
curl -X POST http://localhost:5000/api/camera/start

# Open in browser
# http://raspberry-pi:8080/stream
```

---

## Troubleshooting

### PCA9685 Not Detected

```bash
# Check I2C is enabled
sudo raspi-config
# Interface Options → I2C → Enable

# Check connections
sudo i2cdetect -y 1
# Should show device at 0x40
```

### CPX Not Responding

```bash
# Check USB connection
lsusb | grep Adafruit

# Check serial port
ls -la /dev/ttyACM*

# Verify permissions
sudo usermod -aG dialout pi
# Logout and login again
```

### Camera Not Working

```bash
# Check device exists
ls -la /dev/video*

# Check permissions
sudo usermod -aG video pi

# Test with v4l2
v4l2-ctl -d /dev/video0 --all
```

### Service Won't Start

```bash
# Check logs
sudo journalctl -u railroad -n 50

# Run manually to see errors
cd /opt/railroad/pi-railroad-controller
RUST_LOG=debug ./target/release/pi-railroad-controller
```

### High CPU Usage

```bash
# Check which process
htop

# Reduce camera FPS in config.toml
[camera]
fps = 15  # Lower from 30
```

---

## Performance Optimization

### GPU Memory

```bash
# Increase GPU memory for camera
sudo nano /boot/config.txt

# Add line:
gpu_mem=256
```

### Disable Unused Services

```bash
sudo systemctl disable bluetooth
sudo systemctl disable avahi-daemon
sudo systemctl disable triggerhappy
```

### CPU Governor

```bash
# Set to performance mode
echo performance | sudo tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor
```

---

## Safety Notes

- **Power Isolation**: Keep 12V track power isolated from Pi 3.3V/5V
- **Fuses**: Use appropriate fuses on track power (1-2A per track)
- **Heat Dissipation**: Use heatsinks on Pi and motor drivers
- **Emergency Stop**: Always test emergency stop functionality
- **Grounding**: Ensure common ground between all components
- **Current Limits**: Don't exceed motor driver ratings (typically 2A per channel)

---

## Support

- [GitHub Issues](https://github.com/punitmishra/railroad-arcade/issues) - Bug reports
- [GitHub Discussions](https://github.com/punitmishra/railroad-arcade/discussions) - Questions
- [Rust Backend Repo](https://github.com/punitmishra/pi-railroad-controller) - Hardware-specific issues
