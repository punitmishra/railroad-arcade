'use client';

import { useState } from 'react';
import { ModulePanel, ControlButton, VehicleCard } from './ui';
import { 
  FireStationIcon, CafeIcon, HomeIcon, ConstructionIcon, CrossingIcon,
  LightbulbIcon, SunIcon, AlertIcon, FireTruckIcon, PoliceCarIcon, 
  TruckIcon, CarIcon, BoatIcon, RotateIcon, ThermometerIcon, HumidityIcon,
  TreeIcon, ChartIcon, TrainIcon
} from './icons';

// ========================================
// FIRE STATION MODULE
// ========================================
interface FireStationModuleProps {
  locked?: boolean;
  onUnlock?: () => void;
}

export function FireStationModule({ locked = false, onUnlock }: FireStationModuleProps) {
  const [lights, setLights] = useState({
    mainRoom: true,
    frontPark1: false,
    frontPark2: false,
    frontPark3: true,
    backPark: false,
    street1: false,
    street2: false,
  });

  const [vehicles, setVehicles] = useState([
    { id: 'truck1', name: 'Firetruck 1', status: 'active' as const },
    { id: 'truck2', name: 'Firetruck 2', status: 'active' as const },
    { id: 'police', name: 'Police Car', status: 'idle' as const },
  ]);

  return (
    <ModulePanel
      title="Fire Station Control"
      icon={<FireStationIcon size={20} />}
      themeColor="#ef4444"
      locked={locked}
      onUnlock={onUnlock}
      actions={
        <button className="p-1.5 rounded-lg hover:bg-white/10 text-red-400 transition-colors">
          <AlertIcon size={18} />
        </button>
      }
    >
      {/* Building Preview */}
      <div className="relative h-40 rounded-xl bg-gradient-to-b from-sky-100 to-sky-200 mb-4 overflow-hidden">
        {/* Street lamps */}
        <div className="absolute left-6 bottom-4">
          <div className="w-0.5 h-12 bg-gray-400" />
          <div className={`w-2 h-2 rounded-full -ml-0.5 ${lights.street1 ? 'bg-yellow-300 shadow-[0_0_8px_rgba(253,224,71,0.8)]' : 'bg-gray-300'}`} />
        </div>
        <div className="absolute right-6 bottom-4">
          <div className="w-0.5 h-12 bg-gray-400" />
          <div className={`w-2 h-2 rounded-full -ml-0.5 ${lights.street2 ? 'bg-yellow-300 shadow-[0_0_8px_rgba(253,224,71,0.8)]' : 'bg-gray-300'}`} />
        </div>

        {/* Building */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-36 h-20 bg-red-500 rounded-t-lg flex items-end justify-center pb-1">
            <div className={`w-6 h-4 rounded-sm ${lights.mainRoom ? 'bg-amber-200' : 'bg-red-300'}`} />
          </div>
          <div className="w-40 h-16 bg-gray-100 border-2 border-gray-200 flex items-center justify-center gap-2">
            {vehicles.map((v, i) => (
              <span key={i} className={v.id.includes('truck') ? 'text-red-500' : 'text-blue-500'}>
                {v.id.includes('truck') ? <FireTruckIcon size={16} /> : <PoliceCarIcon size={16} />}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Light Controls */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {Object.entries({
          mainRoom: 'Main Room',
          frontPark1: 'Front Park1',
          frontPark2: 'Front Park2',
          frontPark3: 'Front Park3',
          backPark: 'Back Park',
          street1: 'Street Light1',
          street2: 'Street Light2',
        }).map(([key, label]) => (
          <ControlButton
            key={key}
            icon={<LightbulbIcon size={18} />}
            label={label}
            active={lights[key as keyof typeof lights]}
            color="yellow"
            onClick={() => setLights(prev => ({ ...prev, [key]: !prev[key as keyof typeof lights] }))}
          />
        ))}
      </div>

      {/* Vehicle Controls */}
      <div className="grid grid-cols-3 gap-2">
        {vehicles.map(vehicle => (
          <ControlButton
            key={vehicle.id}
            icon={vehicle.id.includes('truck') ? <FireTruckIcon size={18} /> : <PoliceCarIcon size={18} />}
            label={vehicle.name}
            active={vehicle.status === 'active'}
            color="red"
          />
        ))}
      </div>
    </ModulePanel>
  );
}

// ========================================
// CAFE MODULE
// ========================================
interface CafeModuleProps {
  locked?: boolean;
  onUnlock?: () => void;
}

export function CafeModule({ locked = false, onUnlock }: CafeModuleProps) {
  const [controls, setControls] = useState({
    mainRoom: true,
    driveThru: false,
    parking: true,
    sign: false,
    roofAccent: true,
    closed: false,
    driveThruActive: true,
  });

  return (
    <ModulePanel
      title="Café Control Center"
      icon={<CafeIcon size={20} />}
      themeColor="#f59e0b"
      locked={locked}
      onUnlock={onUnlock}
      actions={
        <button className="p-1.5 rounded-lg hover:bg-white/10 text-yellow-400 transition-colors">
          <SunIcon size={18} />
        </button>
      }
    >
      {/* Building Preview */}
      <div className="relative h-44 rounded-xl bg-gradient-to-b from-sky-100 to-sky-200 mb-4 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/3">
          {/* Sign */}
          <div className="w-20 h-8 bg-red-500 rounded-full flex items-center justify-center mx-auto -mb-2 z-10 relative">
            <CafeIcon size={16} className="text-white" />
          </div>
          
          {/* Awning */}
          <div className="w-44 h-6 flex">
            {[...Array(8)].map((_, i) => (
              <div key={i} className={`flex-1 ${i % 2 === 0 ? 'bg-red-500' : 'bg-white'}`} />
            ))}
          </div>
          
          {/* Building */}
          <div className="w-40 h-20 bg-gray-100 border-2 border-gray-200 mx-auto flex items-center justify-around">
            <div className={`w-6 h-10 rounded-sm ${controls.mainRoom ? 'bg-gray-400' : 'bg-gray-200'}`} />
            <div className={`w-6 h-10 rounded-sm ${controls.mainRoom ? 'bg-gray-400' : 'bg-gray-200'}`} />
          </div>
          
          {/* Drive-thru sign */}
          <div className="absolute -right-8 top-12">
            <div className="w-2 h-8 bg-gray-400" />
            <div className={`px-2 py-0.5 text-[8px] rounded ${controls.driveThruActive ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>
              OPEN
            </div>
          </div>
        </div>
        
        {/* Car at drive-thru */}
        {controls.driveThruActive && (
          <div className="absolute right-8 bottom-8 text-blue-400">
            <CarIcon size={20} />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="grid grid-cols-3 gap-2">
        {Object.entries({
          mainRoom: 'Main Room',
          driveThru: 'Drive Thru',
          parking: 'Parking',
          sign: 'Sign',
          roofAccent: 'Roof Accent',
          closed: 'Closed',
        }).map(([key, label]) => (
          <ControlButton
            key={key}
            icon={key === 'closed' ? '🚫' : key === 'driveThru' ? <CarIcon size={18} /> : <LightbulbIcon size={18} />}
            label={label}
            active={controls[key as keyof typeof controls]}
            color={key === 'closed' ? 'red' : 'yellow'}
            onClick={() => setControls(prev => ({ ...prev, [key]: !prev[key as keyof typeof controls] }))}
          />
        ))}
        <ControlButton
          icon={<CarIcon size={18} />}
          label="Drive-Thru"
          active={controls.driveThruActive}
          color="blue"
          onClick={() => setControls(prev => ({ ...prev, driveThruActive: !prev.driveThruActive }))}
        />
        <ControlButton
          icon={<RotateIcon size={18} />}
          label="Rotate Sign"
          color="purple"
        />
      </div>
    </ModulePanel>
  );
}

// ========================================
// SMART HOME MODULE
// ========================================
interface SmartHomeModuleProps {
  locked?: boolean;
  onUnlock?: () => void;
}

export function SmartHomeModule({ locked = false, onUnlock }: SmartHomeModuleProps) {
  const [temperature, setTemperature] = useState(72);
  const [humidity] = useState(45);
  const [lights, setLights] = useState({
    frontPorch: false,
    backPorch: false,
    sidePorch: false,
    streetLamp: true,
    basement: true,
  });
  const [cars, setCars] = useState({
    car1: false,
    car2: true, // charging
    car3: false,
  });

  return (
    <ModulePanel
      title="Smart Home Control Center"
      icon={<HomeIcon size={20} />}
      themeColor="#a855f7"
      locked={locked}
      onUnlock={onUnlock}
      actions={
        <>
          <button className="p-1.5 rounded-lg hover:bg-white/10 text-yellow-400 transition-colors">
            <SunIcon size={18} />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-white/10 text-yellow-400 transition-colors">
            <SunIcon size={18} />
          </button>
        </>
      }
    >
      {/* Climate controls */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
          <ThermometerIcon size={18} className="text-red-400" />
          <button onClick={() => setTemperature(t => t - 1)} className="text-gray-400 hover:text-white">-</button>
          <span className="flex-1 text-center font-bold">{temperature}°F</span>
          <button onClick={() => setTemperature(t => t + 1)} className="text-gray-400 hover:text-white">+</button>
        </div>
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <HumidityIcon size={18} className="text-blue-400" />
          <span className="flex-1 text-center font-bold">{humidity}%</span>
        </div>
      </div>

      {/* House Preview */}
      <div className="relative h-44 rounded-xl bg-gradient-to-b from-sky-100 to-sky-200 mb-4 overflow-hidden">
        {/* Trees */}
        {[1,2,3,4].map(i => (
          <div key={i} className="absolute bottom-0 text-emerald-500" style={{ left: `${i * 22}%` }}>
            <TreeIcon size={28} />
          </div>
        ))}
        
        {/* Street lamp */}
        <div className="absolute left-6 bottom-4">
          <div className="w-0.5 h-14 bg-gray-400" />
          <div className={`w-2.5 h-2.5 rounded-full -ml-1 ${lights.streetLamp ? 'bg-yellow-300 shadow-[0_0_10px_rgba(253,224,71,0.8)]' : 'bg-gray-300'}`} />
        </div>
        
        {/* House */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {/* Roof */}
          <div className="w-40 h-14 bg-red-500 mx-auto" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}>
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-yellow-400" />
          </div>
          
          {/* Body */}
          <div className="w-36 h-24 bg-gray-100 border-2 border-gray-200 mx-auto -mt-1 flex flex-col items-center pt-2">
            <div className="flex gap-3 mb-2">
              <div className={`w-6 h-8 rounded-sm ${lights.frontPorch ? 'bg-amber-200' : 'bg-gray-300'}`} />
              <div className={`w-6 h-8 rounded-sm ${lights.frontPorch ? 'bg-amber-200' : 'bg-gray-300'}`} />
            </div>
            <div className="flex gap-1">
              <div className={`w-2 h-2 rounded-full ${lights.sidePorch ? 'bg-amber-300' : 'bg-gray-300'}`} />
              <div className={`w-2 h-2 rounded-full ${lights.backPorch ? 'bg-amber-300' : 'bg-gray-300'}`} />
            </div>
          </div>
          
          {/* Garage */}
          <div className="w-44 h-6 bg-gray-300 rounded-b flex items-center justify-center gap-4 mx-auto -mt-1">
            {Object.entries(cars).map(([key, charging]) => (
              <span key={key} className={charging ? 'text-emerald-500' : 'text-gray-400'}>
                <CarIcon size={14} />
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Light Controls */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {Object.entries(lights).map(([key, active]) => (
          <ControlButton
            key={key}
            icon={<LightbulbIcon size={18} />}
            label={key.replace(/([A-Z])/g, ' $1').trim()}
            active={active}
            color="yellow"
            onClick={() => setLights(prev => ({ ...prev, [key]: !prev[key as keyof typeof lights] }))}
          />
        ))}
        {Object.entries(cars).map(([key, charging]) => (
          <ControlButton
            key={key}
            icon={<CarIcon size={18} />}
            label={charging ? `${key.replace('car', 'Car ')} (Charging)` : key.replace('car', 'Car ')}
            active={charging}
            color="green"
            onClick={() => setCars(prev => ({ ...prev, [key]: !prev[key as keyof typeof cars] }))}
          />
        ))}
      </div>

      {/* All Lights Toggle */}
      <button 
        className="w-full py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-medium hover:bg-emerald-500/25 transition-colors flex items-center justify-center gap-2"
        onClick={() => {
          const allOn = Object.values(lights).every(v => v);
          setLights(Object.fromEntries(Object.keys(lights).map(k => [k, !allOn])) as typeof lights);
        }}
      >
        <LightbulbIcon size={18} />
        Turn All Lights {Object.values(lights).every(v => v) ? 'Off' : 'On'}
      </button>
    </ModulePanel>
  );
}

// ========================================
// CONSTRUCTION ZONE MODULE
// ========================================
interface ConstructionZoneModuleProps {
  locked?: boolean;
  onUnlock?: () => void;
}

export function ConstructionZoneModule({ locked = false, onUnlock }: ConstructionZoneModuleProps) {
  const [vehicles, setVehicles] = useState([
    { id: 'excavator', name: 'Excavator', section: 'Front', active: false, moving: false },
    { id: 'bulldozer', name: 'Bulldozer', section: 'Back', active: false, moving: true },
    { id: 'crane', name: 'Mobile Crane', section: 'Front', active: false, moving: false },
    { id: 'dumptruck', name: 'Dump Truck', section: 'Back', active: false, moving: true },
    { id: 'mixer', name: 'Cement Mixer', section: 'Front', active: false, moving: true },
  ]);

  const [towerLights, setTowerLights] = useState({
    front: [true, true, true, false, false, false],
    back: [false],
  });

  return (
    <ModulePanel
      title="Construction Zone Control"
      icon={<ConstructionIcon size={20} />}
      themeColor="#eab308"
      locked={locked}
      onUnlock={onUnlock}
      actions={
        <>
          <button className="p-1.5 rounded-lg hover:bg-white/10 text-yellow-400 transition-colors">
            <SunIcon size={18} />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition-colors">
            <AlertIcon size={18} />
          </button>
        </>
      }
    >
      {/* Sections Preview */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {['Front Section', 'Back Section'].map((section) => (
          <div key={section} className="relative rounded-xl overflow-hidden">
            <div className="h-28 bg-gradient-to-b from-sky-100 to-sky-200 relative">
              {/* Tower lights */}
              <div className="absolute top-0 left-0 right-0 flex justify-around px-2 pt-1">
                {(section === 'Front Section' ? towerLights.front : towerLights.back).map((on, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${on ? 'bg-yellow-400 shadow-[0_0_6px_rgba(253,224,71,0.8)]' : 'bg-gray-300'}`} />
                ))}
              </div>
              
              {/* Construction zone sign */}
              <div className="absolute left-1/2 top-4 -translate-x-1/2 px-2 py-0.5 bg-amber-500 text-[6px] font-bold text-black rounded">
                CONSTRUCTION<br/>ZONE
              </div>
              
              {/* Barrier */}
              <div className="absolute left-0 right-0 top-10 h-5 bg-amber-600 flex items-center justify-around mx-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-0.5 h-6 bg-gray-500 -mt-4" />
                ))}
              </div>
              
              {/* Pit */}
              <div className="absolute bottom-0 left-2 right-2 h-16 bg-amber-100 border-t-2 border-amber-300" />
            </div>
            
            {/* Road */}
            <div className="h-10 bg-amber-700" />
            
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-white font-medium">
              {section}
            </div>
          </div>
        ))}
      </div>

      {/* Vehicle Controls */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {vehicles.map(vehicle => (
          <div key={vehicle.id} className="p-3 rounded-xl bg-[#12121f] border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <TruckIcon size={16} className="text-amber-400" />
              <div>
                <div className="text-xs font-medium">{vehicle.name}</div>
                <div className="text-[10px] text-gray-500">{vehicle.section} Section</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <button className={`px-2 py-1 rounded text-[10px] font-medium ${vehicle.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                {vehicle.active ? 'Active' : 'Inactive'}
              </button>
              <button className={`px-2 py-1 rounded text-[10px] font-medium ${vehicle.active ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-500/20 text-gray-400'}`}>
                Lights
              </button>
              <button className="px-2 py-1 rounded text-[10px] font-medium bg-gray-500/20 text-gray-400">
                Idle
              </button>
              <button className={`px-2 py-1 rounded text-[10px] font-medium ${vehicle.moving ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'}`}>
                Move
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Light Controls */}
      <div className="p-3 rounded-xl bg-[#12121f] border border-white/5">
        <div className="text-sm font-medium mb-2">Light Controls</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">Front Tower Lights</div>
            <div className="grid grid-cols-3 gap-1">
              {towerLights.front.map((on, i) => (
                <button 
                  key={i}
                  onClick={() => setTowerLights(prev => ({
                    ...prev, 
                    front: prev.front.map((v, j) => j === i ? !v : v)
                  }))}
                  className={`p-2 rounded-lg ${on ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-500'}`}
                >
                  <LightbulbIcon size={14} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Back Tower Light</div>
            <div className="grid grid-cols-3 gap-1">
              {towerLights.back.map((on, i) => (
                <button 
                  key={i}
                  onClick={() => setTowerLights(prev => ({
                    ...prev, 
                    back: prev.back.map((v, j) => j === i ? !v : v)
                  }))}
                  className={`p-2 rounded-lg ${on ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-500'}`}
                >
                  <LightbulbIcon size={14} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ModulePanel>
  );
}

// ========================================
// DIAMOND CROSSING MODULE
// ========================================
interface DiamondCrossingModuleProps {
  locked?: boolean;
  onUnlock?: () => void;
}

export function DiamondCrossingModule({ locked = false, onUnlock }: DiamondCrossingModuleProps) {
  const [signals, setSignals] = useState({ ns: 'green', ew: 'red' });
  const [simulatingNS, setSimulatingNS] = useState(false);
  const [simulatingEW, setSimulatingEW] = useState(false);

  const toggleSignals = () => {
    setSignals(prev => ({
      ns: prev.ns === 'green' ? 'red' : 'green',
      ew: prev.ew === 'green' ? 'red' : 'green',
    }));
  };

  const simulateTrain = (direction: 'ns' | 'ew') => {
    if (direction === 'ns') {
      setSimulatingNS(true);
      setSignals({ ns: 'green', ew: 'red' });
      setTimeout(() => setSimulatingNS(false), 3000);
    } else {
      setSimulatingEW(true);
      setSignals({ ns: 'red', ew: 'green' });
      setTimeout(() => setSimulatingEW(false), 3000);
    }
  };

  return (
    <ModulePanel
      title="Diamond Crossing Control"
      icon={<CrossingIcon size={20} />}
      themeColor="#22c55e"
      locked={locked}
      onUnlock={onUnlock}
      actions={
        <button className="p-1.5 rounded-lg hover:bg-white/10 text-cyan-400 transition-colors">
          <ChartIcon size={18} />
        </button>
      }
    >
      {/* Crossing Visualization */}
      <div className="relative h-64 rounded-xl bg-slate-800 mb-4 overflow-hidden">
        {/* Track lines */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Vertical track */}
          <div className="absolute top-0 bottom-0 w-6 left-1/2 -translate-x-1/2 flex flex-col">
            <div className="flex-1 flex justify-between px-1">
              <div className="w-0.5 h-full bg-gray-500" />
              <div className="w-0.5 h-full bg-gray-500" />
            </div>
          </div>
          
          {/* Horizontal track */}
          <div className="absolute left-0 right-0 h-6 top-1/2 -translate-y-1/2 flex">
            <div className="flex-1 flex flex-col justify-between py-1">
              <div className="h-0.5 w-full bg-gray-500" />
              <div className="h-0.5 w-full bg-gray-500" />
            </div>
          </div>
          
          {/* Center X */}
          <div className="absolute w-8 h-8 flex items-center justify-center">
            <span className="text-gray-400 text-2xl font-bold">✕</span>
          </div>
          
          {/* N-S Signal */}
          <div className={`absolute top-8 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full ${
            signals.ns === 'green' 
              ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.8)]' 
              : 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)]'
          }`} />
          
          {/* E-W Signal */}
          <div className={`absolute right-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full ${
            signals.ew === 'green' 
              ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.8)]' 
              : 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)]'
          }`} />
          
          {/* Simulated trains */}
          {simulatingNS && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 text-cyan-400 animate-pulse">
              <TrainIcon size={24} />
            </div>
          )}
          {simulatingEW && (
            <div className="absolute left-16 top-1/2 -translate-y-1/2 text-purple-400 animate-pulse" style={{ transform: 'rotate(90deg) translateX(-50%)' }}>
              <TrainIcon size={24} />
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3">
        <button
          onClick={toggleSignals}
          className="w-full py-3 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400 font-medium hover:bg-blue-500/30 transition-colors"
        >
          Toggle Signals
        </button>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => simulateTrain('ns')}
            disabled={simulatingNS || simulatingEW}
            className="py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
          >
            Simulate N-S Train
          </button>
          <button
            onClick={() => simulateTrain('ew')}
            disabled={simulatingNS || simulatingEW}
            className="py-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
          >
            Simulate E-W Train
          </button>
        </div>
      </div>
    </ModulePanel>
  );
}
