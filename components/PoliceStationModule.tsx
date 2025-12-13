'use client';

import { useState } from 'react';
import { ModulePanel, ControlButton, VehicleCard } from './ui';
import { PoliceStationIcon, SunIcon, AlertIcon, LightbulbIcon, PoliceCarIcon } from './icons';

interface PoliceStationModuleProps {
  locked?: boolean;
  onUnlock?: () => void;
}

export function PoliceStationModule({ locked = false, onUnlock }: PoliceStationModuleProps) {
  const [lights, setLights] = useState({
    indoor: true,
    street: true,
    basement: false,
    emergency: true,
    dispatch: true,
    parking: false,
  });

  const [vehicles, setVehicles] = useState([
    { id: 'patrol', name: 'Patrol Car', status: 'active' as const, lights: false },
    { id: 'k9', name: 'K-9 Unit', status: 'idle' as const, lights: true },
    { id: 'detective', name: 'Detective Car', status: 'deployed' as const, lights: true },
    { id: 'swat', name: 'SWAT Van', status: 'idle' as const, lights: true },
  ]);

  const toggleLight = (key: keyof typeof lights) => {
    setLights(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ModulePanel
      title="Police Station Control"
      icon={<PoliceStationIcon size={20} />}
      themeColor="#3b82f6"
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
      {/* Building Preview */}
      <div className="relative h-48 rounded-xl bg-gradient-to-b from-sky-100 to-sky-200 mb-4 overflow-hidden">
        {/* Street lamp */}
        <div className="absolute left-8 top-1/2">
          <div className="w-1 h-20 bg-gray-400 rounded-full" />
          <div className={`w-3 h-3 rounded-full -ml-1 ${lights.street ? 'bg-yellow-300 shadow-[0_0_10px_rgba(253,224,71,0.8)]' : 'bg-gray-300'}`} />
        </div>
        
        {/* Building */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {/* Roof */}
          <div className="relative">
            <div className="w-44 h-16 bg-slate-700 rounded-t-sm" style={{ clipPath: 'polygon(0 100%, 10% 0, 90% 0, 100% 100%)' }}>
              <div className="flex justify-center gap-3 pt-2">
                <div className={`w-2 h-2 rounded-full ${lights.dispatch ? 'bg-gray-200' : 'bg-gray-500'}`} />
                <div className={`w-2 h-2 rounded-full ${lights.dispatch ? 'bg-gray-200' : 'bg-gray-500'}`} />
              </div>
            </div>
          </div>
          
          {/* Main building */}
          <div className="w-40 h-28 bg-sky-100 border-2 border-sky-200 mx-auto">
            {/* Windows */}
            <div className="flex justify-center gap-4 pt-4">
              {[1,2,3,4].map(i => (
                <div key={i} className={`w-6 h-8 rounded-sm ${lights.indoor ? 'bg-amber-200' : 'bg-gray-300'}`} />
              ))}
            </div>
          </div>
          
          {/* Parking area */}
          <div className="w-48 h-8 bg-slate-600 rounded-b-lg flex items-center justify-center gap-4 -mt-1 mx-auto">
            {vehicles.slice(0, 3).map((v, i) => (
              <div key={i} className={`text-xs ${v.status === 'deployed' ? 'text-cyan-400' : v.lights ? 'text-emerald-400' : 'text-gray-400'}`}>
                <PoliceCarIcon size={16} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Light Controls */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {Object.entries({
          indoor: 'Indoor Lights',
          street: 'Street Lamp',
          basement: 'Basement Lights',
          emergency: 'Emergency Lights',
          dispatch: 'Dispatch Lights',
          parking: 'Parking Lights',
        }).map(([key, label]) => (
          <ControlButton
            key={key}
            icon={<LightbulbIcon size={18} />}
            label={label}
            active={lights[key as keyof typeof lights]}
            color="yellow"
            onClick={() => toggleLight(key as keyof typeof lights)}
          />
        ))}
      </div>

      {/* Vehicle Controls */}
      <div className="grid grid-cols-2 gap-3">
        {vehicles.map(vehicle => (
          <VehicleCard
            key={vehicle.id}
            name={vehicle.name}
            icon={<PoliceCarIcon size={18} />}
            status={vehicle.status}
            themeColor="#3b82f6"
            lightsOn={vehicle.lights}
            onToggle={() => setVehicles(prev => prev.map(v => 
              v.id === vehicle.id 
                ? { ...v, status: v.status === 'deployed' ? 'idle' as const : 'deployed' as const }
                : v
            ))}
            onLights={() => setVehicles(prev => prev.map(v => 
              v.id === vehicle.id ? { ...v, lights: !v.lights } : v
            ))}
          />
        ))}
      </div>
    </ModulePanel>
  );
}
