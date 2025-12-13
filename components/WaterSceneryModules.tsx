'use client';

import { useState, useEffect } from 'react';
import { ModulePanel, ControlButton, ArcadeButton } from './ui';
import { WaterIcon, BoatIcon, LightbulbIcon, SunIcon, MoonIcon, TreeIcon } from './icons';

// ========================================
// WATER FEATURES MODULE
// ========================================
interface WaterFeaturesModuleProps {
  locked?: boolean;
  onUnlock?: () => void;
}

export function WaterFeaturesModule({ locked = false, onUnlock }: WaterFeaturesModuleProps) {
  const [waterfall, setWaterfall] = useState(true);
  const [pond, setPond] = useState(true);
  const [fountain, setFountain] = useState(false);
  const [boats, setBoats] = useState([
    { id: 'sailboat', name: 'Sailboat', moving: true, lights: false },
    { id: 'rowboat', name: 'Rowboat', moving: false, lights: false },
    { id: 'ferry', name: 'Mini Ferry', moving: true, lights: true },
  ]);
  const [pondLights, setPondLights] = useState({ blue: true, green: false, rainbow: false });

  return (
    <ModulePanel
      title="Water Features Control"
      icon={<WaterIcon size={20} />}
      themeColor="#0ea5e9"
      locked={locked}
      onUnlock={onUnlock}
    >
      {/* Water Visualization */}
      <div className="relative h-48 rounded-xl overflow-hidden mb-4">
        {/* Sky gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-200 to-sky-100" />
        
        {/* Mountains background */}
        <div className="absolute bottom-20 left-0 right-0">
          <svg viewBox="0 0 200 60" className="w-full h-16 text-slate-400/50">
            <path d="M0 60 L30 20 L50 40 L80 10 L110 35 L140 15 L170 30 L200 20 L200 60 Z" fill="currentColor" />
          </svg>
        </div>
        
        {/* Trees */}
        <div className="absolute bottom-16 left-4 text-emerald-600">
          <TreeIcon size={24} />
        </div>
        <div className="absolute bottom-16 right-6 text-emerald-600">
          <TreeIcon size={20} />
        </div>
        
        {/* Waterfall */}
        {waterfall && (
          <div className="absolute right-8 top-8 bottom-20 w-4">
            <div className="w-full h-full bg-gradient-to-b from-white/80 via-cyan-200/60 to-cyan-300/40 rounded-full animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/50 animate-[pulse_0.5s_ease-in-out_infinite]" />
          </div>
        )}
        
        {/* Water/Pond */}
        <div className={`absolute bottom-0 left-0 right-0 h-20 ${pond ? 'bg-gradient-to-b from-cyan-400/80 to-blue-500/90' : 'bg-slate-300'} transition-colors`}>
          {/* Water ripples */}
          {pond && (
            <>
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-2 left-1/4 w-16 h-2 bg-white/40 rounded-full animate-pulse" />
                <div className="absolute top-6 left-1/2 w-12 h-1.5 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                <div className="absolute top-4 right-1/4 w-10 h-1 bg-white/35 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
              </div>
              
              {/* Pond lights glow */}
              {pondLights.blue && (
                <div className="absolute bottom-0 left-1/4 w-20 h-10 bg-blue-400/30 rounded-full blur-xl" />
              )}
              {pondLights.green && (
                <div className="absolute bottom-0 right-1/4 w-20 h-10 bg-emerald-400/30 rounded-full blur-xl" />
              )}
              {pondLights.rainbow && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-10 bg-gradient-to-r from-red-400/20 via-yellow-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse" />
              )}
            </>
          )}
          
          {/* Boats */}
          {boats.map((boat, i) => (
            <div
              key={boat.id}
              className={`absolute bottom-4 transition-all duration-1000 ${boat.moving ? 'animate-[float_3s_ease-in-out_infinite]' : ''}`}
              style={{ 
                left: `${20 + i * 25}%`,
                animationDelay: `${i * 0.5}s`
              }}
            >
              <div className="relative">
                <BoatIcon size={20} className={boat.lights ? 'text-amber-300' : 'text-slate-600'} />
                {boat.lights && (
                  <div className="absolute -top-1 left-1/2 w-2 h-2 bg-amber-300 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Fountain */}
        {fountain && pond && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2">
            <div className="relative">
              <div className="w-1 h-12 bg-gradient-to-t from-cyan-300 to-white/80 rounded-full mx-auto" />
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-6 bg-white/40 rounded-full animate-ping" />
            </div>
          </div>
        )}
      </div>

      {/* Water Controls */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <ControlButton
          icon={<WaterIcon size={18} />}
          label="Waterfall"
          active={waterfall}
          color="blue"
          onClick={() => setWaterfall(!waterfall)}
        />
        <ControlButton
          icon="🌊"
          label="Pond Pump"
          active={pond}
          color="blue"
          onClick={() => setPond(!pond)}
        />
        <ControlButton
          icon="⛲"
          label="Fountain"
          active={fountain}
          color="blue"
          onClick={() => setFountain(!fountain)}
        />
      </div>

      {/* Boat Controls */}
      <div className="p-3 rounded-xl bg-[#12121f] border border-white/5 mb-4">
        <div className="text-sm font-medium mb-3 flex items-center gap-2">
          <BoatIcon size={16} className="text-cyan-400" />
          Boat Controls
        </div>
        <div className="grid grid-cols-3 gap-2">
          {boats.map(boat => (
            <div key={boat.id} className="p-2 rounded-lg bg-white/5 border border-white/10">
              <div className="text-xs font-medium mb-2">{boat.name}</div>
              <div className="flex gap-1">
                <button
                  onClick={() => setBoats(prev => prev.map(b => b.id === boat.id ? { ...b, moving: !b.moving } : b))}
                  className={`flex-1 py-1 rounded text-[10px] ${boat.moving ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-500/20 text-gray-400'}`}
                >
                  {boat.moving ? 'Stop' : 'Move'}
                </button>
                <button
                  onClick={() => setBoats(prev => prev.map(b => b.id === boat.id ? { ...b, lights: !b.lights } : b))}
                  className={`flex-1 py-1 rounded text-[10px] ${boat.lights ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-500/20 text-gray-400'}`}
                >
                  Lights
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pond Lighting */}
      <div className="p-3 rounded-xl bg-[#12121f] border border-white/5">
        <div className="text-sm font-medium mb-3 flex items-center gap-2">
          <LightbulbIcon size={16} className="text-amber-400" />
          Underwater Lights
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setPondLights(prev => ({ ...prev, blue: !prev.blue }))}
            className={`py-2 rounded-lg text-xs font-medium transition-all ${pondLights.blue ? 'bg-blue-500/30 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-gray-500/20 text-gray-400'}`}
          >
            Blue
          </button>
          <button
            onClick={() => setPondLights(prev => ({ ...prev, green: !prev.green }))}
            className={`py-2 rounded-lg text-xs font-medium transition-all ${pondLights.green ? 'bg-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-gray-500/20 text-gray-400'}`}
          >
            Green
          </button>
          <button
            onClick={() => setPondLights(prev => ({ ...prev, rainbow: !prev.rainbow }))}
            className={`py-2 rounded-lg text-xs font-medium transition-all ${pondLights.rainbow ? 'bg-gradient-to-r from-red-500/30 via-yellow-500/30 to-purple-500/30 text-white' : 'bg-gray-500/20 text-gray-400'}`}
          >
            Rainbow
          </button>
        </div>
      </div>
    </ModulePanel>
  );
}

// ========================================
// DAY/NIGHT SCENERY MODULE
// ========================================
interface SceneryModuleProps {
  locked?: boolean;
  onUnlock?: () => void;
}

export function SceneryModule({ locked = false, onUnlock }: SceneryModuleProps) {
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'sunset' | 'night'>('day');
  const [autoMode, setAutoMode] = useState(false);
  const [streetLights, setStreetLights] = useState(false);
  const [buildingLights, setBuildingLights] = useState(false);
  const [starField, setStarField] = useState(false);

  // Auto mode simulation
  useEffect(() => {
    if (autoMode) {
      const interval = setInterval(() => {
        setTimeOfDay(prev => {
          if (prev === 'day') return 'sunset';
          if (prev === 'sunset') return 'night';
          return 'day';
        });
      }, 10000); // Change every 10 seconds in demo
      return () => clearInterval(interval);
    }
  }, [autoMode]);

  // Auto lights based on time
  useEffect(() => {
    if (timeOfDay === 'night') {
      setStreetLights(true);
      setBuildingLights(true);
      setStarField(true);
    } else if (timeOfDay === 'day') {
      setStreetLights(false);
      setBuildingLights(false);
      setStarField(false);
    }
  }, [timeOfDay]);

  const skyGradients = {
    day: 'from-sky-400 via-sky-300 to-sky-200',
    sunset: 'from-orange-400 via-pink-400 to-purple-500',
    night: 'from-slate-900 via-indigo-900 to-slate-800',
  };

  return (
    <ModulePanel
      title="Scenery & Atmosphere"
      icon={timeOfDay === 'night' ? <MoonIcon size={20} /> : <SunIcon size={20} />}
      themeColor={timeOfDay === 'night' ? '#6366f1' : '#f59e0b'}
      locked={locked}
      onUnlock={onUnlock}
    >
      {/* Sky Preview */}
      <div className={`relative h-32 rounded-xl overflow-hidden mb-4 bg-gradient-to-b ${skyGradients[timeOfDay]} transition-all duration-1000`}>
        {/* Sun/Moon */}
        <div className={`absolute transition-all duration-1000 ${
          timeOfDay === 'day' ? 'top-4 right-8' : 
          timeOfDay === 'sunset' ? 'top-12 right-4' : 
          'top-4 left-8'
        }`}>
          {timeOfDay === 'night' ? (
            <div className="w-8 h-8 bg-gray-200 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
          ) : (
            <div className={`w-10 h-10 rounded-full shadow-[0_0_30px_rgba(251,191,36,0.8)] ${
              timeOfDay === 'sunset' ? 'bg-orange-500' : 'bg-yellow-300'
            }`} />
          )}
        </div>
        
        {/* Stars */}
        {starField && timeOfDay === 'night' && (
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 60}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  opacity: Math.random() * 0.5 + 0.5,
                }}
              />
            ))}
          </div>
        )}
        
        {/* Horizon line with buildings silhouette */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 200 40" className={`w-full h-12 ${timeOfDay === 'night' ? 'text-slate-950' : 'text-slate-600/30'}`}>
            <path d="M0 40 L0 30 L20 30 L20 20 L30 20 L30 25 L40 25 L40 15 L50 15 L50 25 L60 25 L60 30 L80 30 L80 10 L90 10 L90 20 L100 20 L100 30 L120 30 L120 18 L130 18 L130 25 L140 25 L140 30 L160 30 L160 22 L170 22 L170 28 L180 28 L180 30 L200 30 L200 40 Z" fill="currentColor" />
          </svg>
          
          {/* Building lights */}
          {buildingLights && timeOfDay === 'night' && (
            <div className="absolute inset-0">
              {[15, 42, 85, 125, 165].map((pos, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-amber-300 rounded-full"
                  style={{ left: `${pos / 2}%`, bottom: `${12 + Math.random() * 15}px` }}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Street lights */}
        {streetLights && (
          <div className="absolute bottom-0 left-0 right-0 flex justify-around px-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="relative">
                <div className="w-0.5 h-8 bg-gray-500" />
                <div className={`absolute -top-1 -left-1 w-3 h-3 rounded-full ${
                  timeOfDay === 'night' 
                    ? 'bg-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.8)]' 
                    : 'bg-gray-400'
                }`} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Time Controls */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {(['day', 'sunset', 'night'] as const).map(time => (
          <button
            key={time}
            onClick={() => { setTimeOfDay(time); setAutoMode(false); }}
            className={`py-3 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-1 ${
              timeOfDay === time
                ? time === 'day' 
                  ? 'bg-amber-500/20 text-amber-400 border-2 border-amber-500/50'
                  : time === 'sunset'
                    ? 'bg-orange-500/20 text-orange-400 border-2 border-orange-500/50'
                    : 'bg-indigo-500/20 text-indigo-400 border-2 border-indigo-500/50'
                : 'bg-white/5 text-gray-400 border-2 border-transparent hover:bg-white/10'
            }`}
          >
            {time === 'day' && <SunIcon size={20} />}
            {time === 'sunset' && '🌅'}
            {time === 'night' && <MoonIcon size={20} />}
            <span className="capitalize">{time}</span>
          </button>
        ))}
      </div>

      {/* Auto Mode */}
      <button
        onClick={() => setAutoMode(!autoMode)}
        className={`w-full py-3 rounded-xl text-sm font-medium mb-4 transition-all flex items-center justify-center gap-2 ${
          autoMode
            ? 'bg-purple-500/20 text-purple-400 border-2 border-purple-500/50'
            : 'bg-white/5 text-gray-400 border-2 border-transparent hover:bg-white/10'
        }`}
      >
        <span className={autoMode ? 'animate-spin' : ''}>⟳</span>
        Auto Day/Night Cycle {autoMode && '(Active)'}
      </button>

      {/* Light Controls */}
      <div className="grid grid-cols-3 gap-2">
        <ControlButton
          icon={<LightbulbIcon size={18} />}
          label="Street Lights"
          active={streetLights}
          color="yellow"
          onClick={() => setStreetLights(!streetLights)}
        />
        <ControlButton
          icon="🏢"
          label="Building Lights"
          active={buildingLights}
          color="yellow"
          onClick={() => setBuildingLights(!buildingLights)}
        />
        <ControlButton
          icon="⭐"
          label="Star Field"
          active={starField}
          color="purple"
          onClick={() => setStarField(!starField)}
          disabled={timeOfDay !== 'night'}
        />
      </div>
    </ModulePanel>
  );
}
