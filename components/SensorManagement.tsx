'use client';

import { useState, useEffect } from 'react';
import {
  SensorIcon, DistanceSensorIcon, LightSensorIcon, TemperatureIcon,
  AccelerometerIcon, MicrophoneIcon, GPIOIcon, ChipIcon, WaveformIcon,
  GaugeIcon, CalibrationIcon, AlertCircleIcon, CheckCircleIcon,
  RefreshIcon, DownloadIcon, SettingsIcon, ZapIcon, ActivityIcon
} from './icons';

interface Sensor {
  id: string;
  name: string;
  type: 'distance' | 'light' | 'temperature' | 'accelerometer' | 'sound' | 'gpio';
  value: number;
  unit: string;
  min: number;
  max: number;
  threshold?: { low: number; high: number };
  status: 'online' | 'offline' | 'warning' | 'error';
  lastUpdate: Date;
  pin?: string;
}

interface GPIOPin {
  pin: number;
  name: string;
  mode: 'input' | 'output' | 'pwm';
  state: boolean | number;
  label: string;
}

export function SensorManagement() {
  const [activeTab, setActiveTab] = useState<'overview' | 'distance' | 'light' | 'cpx' | 'gpio' | 'calibration'>('overview');
  const [refreshRate, setRefreshRate] = useState(500);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const [sensors, setSensors] = useState<Sensor[]>([
    { id: 'dist-1', name: 'Station Entry', type: 'distance', value: 45.2, unit: 'cm', min: 0, max: 400, threshold: { low: 10, high: 50 }, status: 'online', lastUpdate: new Date(), pin: 'GPIO 17/27' },
    { id: 'dist-2', name: 'Station Exit', type: 'distance', value: 128.5, unit: 'cm', min: 0, max: 400, threshold: { low: 10, high: 50 }, status: 'online', lastUpdate: new Date(), pin: 'GPIO 22/23' },
    { id: 'dist-3', name: 'Tunnel A', type: 'distance', value: 8.3, unit: 'cm', min: 0, max: 400, threshold: { low: 5, high: 30 }, status: 'warning', lastUpdate: new Date(), pin: 'GPIO 24/25' },
    { id: 'light-1', name: 'Track Section A', type: 'light', value: 782, unit: 'lux', min: 0, max: 1023, threshold: { low: 200, high: 800 }, status: 'online', lastUpdate: new Date(), pin: 'MCP3008 CH0' },
    { id: 'light-2', name: 'Track Section B', type: 'light', value: 456, unit: 'lux', min: 0, max: 1023, threshold: { low: 200, high: 800 }, status: 'online', lastUpdate: new Date(), pin: 'MCP3008 CH1' },
    { id: 'light-3', name: 'Station Platform', type: 'light', value: 923, unit: 'lux', min: 0, max: 1023, status: 'online', lastUpdate: new Date(), pin: 'MCP3008 CH2' },
    { id: 'temp-cpx', name: 'CPX Temperature', type: 'temperature', value: 24.5, unit: '°C', min: -10, max: 50, status: 'online', lastUpdate: new Date() },
    { id: 'accel-cpx', name: 'CPX Accelerometer', type: 'accelerometer', value: 0.98, unit: 'g', min: 0, max: 4, status: 'online', lastUpdate: new Date() },
    { id: 'sound-cpx', name: 'CPX Microphone', type: 'sound', value: 42, unit: 'dB', min: 0, max: 120, status: 'online', lastUpdate: new Date() },
  ]);

  const [gpioPins, setGpioPins] = useState<GPIOPin[]>([
    { pin: 12, name: 'GPIO12', mode: 'pwm', state: 75, label: 'Track 3 Speed' },
    { pin: 18, name: 'GPIO18', mode: 'pwm', state: 50, label: 'Track 1 Forward' },
    { pin: 19, name: 'GPIO19', mode: 'pwm', state: 0, label: 'Track 2 Speed' },
    { pin: 23, name: 'GPIO23', mode: 'output', state: true, label: 'Track 1 Dir A' },
    { pin: 24, name: 'GPIO24', mode: 'output', state: false, label: 'Track 1 Dir B' },
    { pin: 25, name: 'GPIO25', mode: 'output', state: true, label: 'Junction 1' },
    { pin: 8, name: 'GPIO8', mode: 'output', state: false, label: 'Crossing Gate 1' },
    { pin: 7, name: 'GPIO7', mode: 'output', state: true, label: 'Station Lights' },
    { pin: 17, name: 'GPIO17', mode: 'input', state: false, label: 'Dist Sensor 1 Trig' },
    { pin: 27, name: 'GPIO27', mode: 'input', state: true, label: 'Dist Sensor 1 Echo' },
  ]);

  // Simulate sensor updates
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      setSensors(prev => prev.map(sensor => ({
        ...sensor,
        value: sensor.value + (Math.random() - 0.5) * (sensor.max - sensor.min) * 0.02,
        lastUpdate: new Date(),
      })));
    }, refreshRate);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshRate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#22c55e';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#71717a';
    }
  };

  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'distance': return <DistanceSensorIcon size={20} />;
      case 'light': return <LightSensorIcon size={20} />;
      case 'temperature': return <TemperatureIcon size={20} />;
      case 'accelerometer': return <AccelerometerIcon size={20} />;
      case 'sound': return <MicrophoneIcon size={20} />;
      default: return <SensorIcon size={20} />;
    }
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: <GaugeIcon size={18} /> },
    { id: 'distance' as const, label: 'Distance', icon: <DistanceSensorIcon size={18} /> },
    { id: 'light' as const, label: 'Light', icon: <LightSensorIcon size={18} /> },
    { id: 'cpx' as const, label: 'CPX', icon: <ChipIcon size={18} /> },
    { id: 'gpio' as const, label: 'GPIO', icon: <GPIOIcon size={18} /> },
    { id: 'calibration' as const, label: 'Calibration', icon: <CalibrationIcon size={18} /> },
  ];

  return (
    <div className="bg-[#0c0c14] rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <SensorIcon size={24} className="text-emerald-400" />
          </div>
          <div>
            <h2 
              className="text-lg font-bold tracking-wide"
              style={{ fontFamily: 'Orbitron, system-ui, sans-serif' }}
            >
              Sensor Management
            </h2>
            <p className="text-sm text-gray-400">Real-time hardware monitoring</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Refresh Rate */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
            <RefreshIcon size={14} className="text-gray-400" />
            <select
              value={refreshRate}
              onChange={(e) => setRefreshRate(Number(e.target.value))}
              className="bg-transparent text-sm text-gray-300 outline-none"
            >
              <option value={100}>100ms</option>
              <option value={250}>250ms</option>
              <option value={500}>500ms</option>
              <option value={1000}>1s</option>
            </select>
          </div>
          
          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl border transition-all
              ${autoRefresh 
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                : 'bg-white/5 border-white/10 text-gray-400'
              }
            `}
          >
            <ActivityIcon size={16} />
            <span className="text-sm font-medium">Live</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-6 py-3 bg-black/20 border-b border-white/5 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap
              ${activeTab === tab.id 
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
              }
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Status Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Sensors', value: sensors.length, color: '#00f0ff' },
                { label: 'Online', value: sensors.filter(s => s.status === 'online').length, color: '#22c55e' },
                { label: 'Warnings', value: sensors.filter(s => s.status === 'warning').length, color: '#f59e0b' },
                { label: 'Errors', value: sensors.filter(s => s.status === 'error').length, color: '#ef4444' },
              ].map((stat, i) => (
                <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/10">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{stat.label}</div>
                  <div 
                    className="text-3xl font-bold"
                    style={{ color: stat.color, fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            {/* All Sensors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sensors.map(sensor => (
                <div 
                  key={sensor.id}
                  className="p-4 rounded-xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ 
                          backgroundColor: `${getStatusColor(sensor.status)}15`,
                          color: getStatusColor(sensor.status)
                        }}
                      >
                        {getSensorIcon(sensor.type)}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{sensor.name}</div>
                        <div className="text-xs text-gray-500">{sensor.pin}</div>
                      </div>
                    </div>
                    <div 
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ 
                        backgroundColor: getStatusColor(sensor.status),
                        boxShadow: `0 0 8px ${getStatusColor(sensor.status)}`
                      }}
                    />
                  </div>
                  
                  <div className="flex items-end justify-between">
                    <div>
                      <div 
                        className="text-2xl font-bold"
                        style={{ fontFamily: 'JetBrains Mono, monospace' }}
                      >
                        {sensor.value.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500">{sensor.unit}</div>
                    </div>
                    <div className="flex-1 ml-4">
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-300"
                          style={{ 
                            width: `${((sensor.value - sensor.min) / (sensor.max - sensor.min)) * 100}%`,
                            backgroundColor: getStatusColor(sensor.status)
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Distance Sensors */}
        {activeTab === 'distance' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <DistanceSensorIcon size={20} className="text-cyan-400" />
                HC-SR04 Ultrasonic Sensors
              </h3>
              
              {sensors.filter(s => s.type === 'distance').map(sensor => (
                <div key={sensor.id} className="mb-6 last:mb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium">{sensor.name}</span>
                      <span className="text-xs text-gray-500 ml-2">{sensor.pin}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span 
                        className="text-xl font-bold"
                        style={{ fontFamily: 'JetBrains Mono, monospace' }}
                      >
                        {sensor.value.toFixed(1)} {sensor.unit}
                      </span>
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ 
                          backgroundColor: getStatusColor(sensor.status),
                          boxShadow: `0 0 8px ${getStatusColor(sensor.status)}`
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Visual Distance Bar */}
                  <div className="relative h-8 bg-white/5 rounded-lg overflow-hidden">
                    <div className="absolute inset-y-0 left-0 flex items-center">
                      <div 
                        className="h-4 rounded-r-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min((sensor.value / sensor.max) * 100, 100)}%`,
                          background: `linear-gradient(90deg, ${getStatusColor(sensor.status)}, ${getStatusColor(sensor.status)}80)`
                        }}
                      />
                    </div>
                    {/* Threshold markers */}
                    {sensor.threshold && (
                      <>
                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-amber-500"
                          style={{ left: `${(sensor.threshold.low / sensor.max) * 100}%` }}
                        />
                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-emerald-500"
                          style={{ left: `${(sensor.threshold.high / sensor.max) * 100}%` }}
                        />
                      </>
                    )}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                      Max: {sensor.max} {sensor.unit}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Wiring Guide */}
            <div className="p-5 rounded-2xl bg-cyan-500/5 border border-cyan-500/20">
              <h4 className="font-semibold mb-3 text-cyan-400">Wiring Reference</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">VCC</div>
                  <div className="font-mono">5V (Pin 2)</div>
                </div>
                <div>
                  <div className="text-gray-400">GND</div>
                  <div className="font-mono">GND (Pin 6)</div>
                </div>
                <div>
                  <div className="text-gray-400">Trigger</div>
                  <div className="font-mono">GPIO 17, 22, 24</div>
                </div>
                <div>
                  <div className="text-gray-400">Echo</div>
                  <div className="font-mono">GPIO 27, 23, 25 (via divider)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Light Sensors */}
        {activeTab === 'light' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <LightSensorIcon size={20} className="text-yellow-400" />
                LDR Sensors via MCP3008
              </h3>
              
              {sensors.filter(s => s.type === 'light').map(sensor => (
                <div key={sensor.id} className="mb-6 last:mb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium">{sensor.name}</span>
                      <span className="text-xs text-gray-500 ml-2">{sensor.pin}</span>
                    </div>
                    <div 
                      className="text-xl font-bold"
                      style={{ fontFamily: 'JetBrains Mono, monospace' }}
                    >
                      {Math.round(sensor.value)}
                    </div>
                  </div>
                  
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(sensor.value / sensor.max) * 100}%`,
                        background: `linear-gradient(90deg, #1a1a2e, #fcd34d)`
                      }}
                    />
                  </div>
                  
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>Dark (0)</span>
                    <span>Bright (1023)</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Detection Status */}
            <div className="grid grid-cols-3 gap-4">
              {sensors.filter(s => s.type === 'light').map(sensor => (
                <div 
                  key={sensor.id}
                  className={`
                    p-4 rounded-xl border text-center
                    ${sensor.value < 300 
                      ? 'bg-purple-500/10 border-purple-500/30' 
                      : 'bg-yellow-500/10 border-yellow-500/30'
                    }
                  `}
                >
                  <div className="text-2xl mb-1">{sensor.value < 300 ? '🚂' : '☀️'}</div>
                  <div className="text-sm font-medium">{sensor.name}</div>
                  <div className={`text-xs mt-1 ${sensor.value < 300 ? 'text-purple-400' : 'text-yellow-400'}`}>
                    {sensor.value < 300 ? 'Train Detected' : 'Clear'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CPX Sensors */}
        {activeTab === 'cpx' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <ChipIcon size={24} className="text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Circuit Playground Express</h3>
                  <p className="text-sm text-gray-400">Connected via USB Serial</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sensors.filter(s => s.id.includes('cpx')).map(sensor => (
                  <div 
                    key={sensor.id}
                    className="p-4 rounded-xl bg-black/30 border border-white/10"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      {getSensorIcon(sensor.type)}
                      <span className="text-sm font-medium">{sensor.name.replace('CPX ', '')}</span>
                    </div>
                    <div 
                      className="text-3xl font-bold mb-1"
                      style={{ fontFamily: 'JetBrains Mono, monospace' }}
                    >
                      {sensor.value.toFixed(sensor.type === 'temperature' ? 1 : 2)}
                    </div>
                    <div className="text-xs text-gray-500">{sensor.unit}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* NeoPixel Control */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
              <h4 className="font-semibold mb-4">NeoPixel Ring (10 LEDs)</h4>
              <div className="flex justify-center gap-2">
                {[...Array(10)].map((_, i) => (
                  <div 
                    key={i}
                    className="w-8 h-8 rounded-full cursor-pointer transition-all hover:scale-110"
                    style={{ 
                      background: `hsl(${i * 36}, 100%, 50%)`,
                      boxShadow: `0 0 12px hsl(${i * 36}, 100%, 50%)`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* GPIO */}
        {activeTab === 'gpio' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {gpioPins.map(pin => (
                <div 
                  key={pin.pin}
                  className={`
                    p-3 rounded-xl border transition-all cursor-pointer
                    ${pin.mode === 'input' 
                      ? 'bg-blue-500/10 border-blue-500/30' 
                      : pin.mode === 'pwm'
                        ? 'bg-purple-500/10 border-purple-500/30'
                        : 'bg-emerald-500/10 border-emerald-500/30'
                    }
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-gray-400">{pin.name}</span>
                    <span className={`
                      text-[10px] px-1.5 py-0.5 rounded uppercase font-medium
                      ${pin.mode === 'input' ? 'bg-blue-500/30 text-blue-400' : 
                        pin.mode === 'pwm' ? 'bg-purple-500/30 text-purple-400' : 
                        'bg-emerald-500/30 text-emerald-400'
                      }
                    `}>
                      {pin.mode}
                    </span>
                  </div>
                  <div className="text-sm font-medium truncate mb-1">{pin.label}</div>
                  <div className="flex items-center gap-2">
                    {pin.mode === 'pwm' ? (
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full">
                        <div 
                          className="h-full bg-purple-500 rounded-full transition-all"
                          style={{ width: `${pin.state}%` }}
                        />
                      </div>
                    ) : (
                      <div 
                        className={`w-3 h-3 rounded-full ${
                          pin.state ? 'bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-600'
                        }`}
                      />
                    )}
                    <span className="text-xs font-mono">
                      {pin.mode === 'pwm' ? `${pin.state}%` : (pin.state ? 'HIGH' : 'LOW')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* GPIO Legend */}
            <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-gray-400">Input</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-sm text-gray-400">Output</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-sm text-gray-400">PWM</span>
              </div>
            </div>
          </div>
        )}

        {/* Calibration */}
        {activeTab === 'calibration' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
              <div className="flex items-start gap-3">
                <AlertCircleIcon size={24} className="text-amber-400 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-amber-400">Calibration Mode</h4>
                  <p className="text-sm text-gray-400 mt-1">
                    Place trains in known positions before calibrating. Ensure consistent lighting conditions for light sensors.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Distance Calibration */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <DistanceSensorIcon size={18} />
                  Distance Sensor Calibration
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 block mb-2">Detection Threshold (cm)</label>
                    <input 
                      type="range" 
                      min="5" 
                      max="50" 
                      defaultValue="15"
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>5 cm</span>
                      <span>50 cm</span>
                    </div>
                  </div>
                  <button className="w-full py-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-medium hover:bg-cyan-500/30 transition-all">
                    Run Calibration
                  </button>
                </div>
              </div>
              
              {/* Light Calibration */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <LightSensorIcon size={18} />
                  Light Sensor Calibration
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 block mb-2">Dark Threshold (train present)</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="500" 
                      defaultValue="300"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-2">Ambient Light Level</label>
                    <input 
                      type="range" 
                      min="500" 
                      max="1023" 
                      defaultValue="800"
                      className="w-full"
                    />
                  </div>
                  <button className="w-full py-2.5 rounded-xl bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-medium hover:bg-yellow-500/30 transition-all">
                    Calibrate Ambient
                  </button>
                </div>
              </div>
            </div>
            
            {/* Save/Export */}
            <div className="flex gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium hover:bg-emerald-500/30 transition-all">
                <CheckCircleIcon size={18} />
                Save Calibration
              </button>
              <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 transition-all">
                <DownloadIcon size={18} />
                Export Config
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
