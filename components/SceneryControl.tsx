'use client';

import { useState } from 'react';
import { 
  SunIcon, MoonIcon, SunriseIcon, SunsetIcon, CloudIcon,
  WaterfallIcon, LakeIcon, FountainIcon, BoatIcon,
  MountainIcon, TreeIcon, ParkIcon, WindmillIcon,
  LightbulbIcon, StreetLampIcon, HomeIcon, 
  FerrisWheelIcon, RollercoasterIcon, StarIcon,
  PowerIcon, SliderIcon, LayersIcon
} from './icons';

interface LightZone {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  intensity: number;
  active: boolean;
  category: 'residential' | 'commercial' | 'entertainment' | 'infrastructure';
}

interface WaterFeature {
  id: string;
  name: string;
  type: 'waterfall' | 'lake' | 'fountain' | 'river';
  active: boolean;
  speed?: number;
  color?: string;
}

interface SceneryControlProps {
  locked?: boolean;
  onUnlock?: () => void;
}

export function SceneryControl({ locked = false }: SceneryControlProps) {
  const [timeOfDay, setTimeOfDay] = useState<'dawn' | 'day' | 'sunset' | 'night'>('day');
  const [masterBrightness, setMasterBrightness] = useState(80);
  const [ambientSound, setAmbientSound] = useState(true);
  
  const [lightZones, setLightZones] = useState<LightZone[]>([
    { id: 'residential-1', name: 'Hillside Homes', icon: <HomeIcon size={16} />, color: '#fbbf24', intensity: 70, active: true, category: 'residential' },
    { id: 'residential-2', name: 'Valley Houses', icon: <HomeIcon size={16} />, color: '#fbbf24', intensity: 85, active: true, category: 'residential' },
    { id: 'residential-3', name: 'Lake Cottages', icon: <HomeIcon size={16} />, color: '#fbbf24', intensity: 60, active: false, category: 'residential' },
    { id: 'commercial-1', name: 'Main Street', icon: <StreetLampIcon size={16} />, color: '#f97316', intensity: 100, active: true, category: 'commercial' },
    { id: 'commercial-2', name: 'Town Square', icon: <StreetLampIcon size={16} />, color: '#f97316', intensity: 90, active: true, category: 'commercial' },
    { id: 'entertainment-1', name: 'Ferris Wheel', icon: <FerrisWheelIcon size={16} />, color: '#ec4899', intensity: 100, active: true, category: 'entertainment' },
    { id: 'entertainment-2', name: 'Carousel', icon: <StarIcon size={16} />, color: '#8b5cf6', intensity: 80, active: true, category: 'entertainment' },
    { id: 'entertainment-3', name: 'Coaster', icon: <RollercoasterIcon size={16} />, color: '#06b6d4', intensity: 75, active: false, category: 'entertainment' },
    { id: 'infrastructure-1', name: 'Station Lights', icon: <LightbulbIcon size={16} />, color: '#22c55e', intensity: 100, active: true, category: 'infrastructure' },
    { id: 'infrastructure-2', name: 'Track Signals', icon: <LightbulbIcon size={16} />, color: '#ef4444', intensity: 100, active: true, category: 'infrastructure' },
    { id: 'park-1', name: 'Central Park', icon: <ParkIcon size={16} />, color: '#22c55e', intensity: 50, active: true, category: 'infrastructure' },
  ]);

  const [waterFeatures, setWaterFeatures] = useState<WaterFeature[]>([
    { id: 'waterfall-1', name: 'Mountain Falls', type: 'waterfall', active: true, speed: 70 },
    { id: 'waterfall-2', name: 'Hidden Falls', type: 'waterfall', active: false, speed: 50 },
    { id: 'lake-1', name: 'Crystal Lake', type: 'lake', active: true, color: '#0ea5e9' },
    { id: 'fountain-1', name: 'Town Fountain', type: 'fountain', active: true, speed: 60 },
    { id: 'fountain-2', name: 'Park Fountain', type: 'fountain', active: false, speed: 40 },
    { id: 'river-1', name: 'Valley River', type: 'river', active: true, speed: 30 },
  ]);

  const [boats, setBoats] = useState([
    { id: 'boat-1', name: 'SS Explorer', active: true, speed: 40, lights: true },
    { id: 'boat-2', name: 'Fishing Boat', active: false, speed: 0, lights: false },
    { id: 'boat-3', name: 'Sailboat', active: true, speed: 25, lights: true },
  ]);

  const [sceneryElements, setSceneryElements] = useState({
    windmill: true,
    windmillSpeed: 60,
    smokestacks: true,
    flagPoles: true,
    clockTower: true,
    churchBells: false,
  });

  const toggleZone = (id: string) => {
    setLightZones(prev => prev.map(z => z.id === id ? { ...z, active: !z.active } : z));
  };

  const setZoneIntensity = (id: string, intensity: number) => {
    setLightZones(prev => prev.map(z => z.id === id ? { ...z, intensity } : z));
  };

  const toggleWater = (id: string) => {
    setWaterFeatures(prev => prev.map(w => w.id === id ? { ...w, active: !w.active } : w));
  };

  const getWaterIcon = (type: WaterFeature['type']) => {
    switch (type) {
      case 'waterfall': return <WaterfallIcon size={18} />;
      case 'lake': return <LakeIcon size={18} />;
      case 'fountain': return <FountainIcon size={18} />;
      case 'river': return <WaterfallIcon size={18} style={{ transform: 'rotate(90deg)' }} />;
    }
  };

  const timeSettings = {
    dawn: { bg: 'from-orange-900/30 via-pink-900/20 to-blue-900/30', icon: <SunriseIcon size={20} />, label: 'Dawn', brightness: 40 },
    day: { bg: 'from-cyan-900/20 via-blue-900/10 to-sky-900/20', icon: <SunIcon size={20} />, label: 'Day', brightness: 100 },
    sunset: { bg: 'from-orange-900/40 via-red-900/30 to-purple-900/30', icon: <SunsetIcon size={20} />, label: 'Sunset', brightness: 60 },
    night: { bg: 'from-indigo-950/50 via-slate-900/40 to-purple-950/50', icon: <MoonIcon size={20} />, label: 'Night', brightness: 20 },
  };

  const groupedZones = {
    residential: lightZones.filter(z => z.category === 'residential'),
    commercial: lightZones.filter(z => z.category === 'commercial'),
    entertainment: lightZones.filter(z => z.category === 'entertainment'),
    infrastructure: lightZones.filter(z => z.category === 'infrastructure'),
  };

  return (
    <div className="space-y-6">
      {/* Time of Day Control */}
      <div className={`rounded-2xl border border-white/10 overflow-hidden bg-gradient-to-br ${timeSettings[timeOfDay].bg}`}>
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-400">
                {timeSettings[timeOfDay].icon}
              </div>
              <div>
                <h3 className="font-semibold" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  Time of Day
                </h3>
                <p className="text-xs text-gray-400">Current: {timeSettings[timeOfDay].label}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setAmbientSound(!ambientSound)}
                className={`p-2 rounded-lg transition-colors ${ambientSound ? 'bg-white/10 text-white' : 'text-gray-500'}`}
              >
                🔊
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-4 gap-2 mb-4">
            {(Object.keys(timeSettings) as Array<keyof typeof timeSettings>).map(time => (
              <button
                key={time}
                onClick={() => setTimeOfDay(time)}
                className={`
                  flex flex-col items-center gap-2 p-3 rounded-xl border transition-all
                  ${timeOfDay === time 
                    ? 'bg-white/15 border-white/30 shadow-lg' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }
                `}
              >
                <span className={timeOfDay === time ? 'text-amber-400' : 'text-gray-400'}>
                  {timeSettings[time].icon}
                </span>
                <span className="text-xs font-medium">{timeSettings[time].label}</span>
              </button>
            ))}
          </div>

          {/* Master Brightness */}
          <div className="p-3 rounded-xl bg-black/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Master Brightness</span>
              <span className="text-sm font-medium text-amber-400">{masterBrightness}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={masterBrightness}
              onChange={e => setMasterBrightness(Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Lighting Zones */}
      <div className="rounded-2xl border border-white/10 bg-[#0c0c14] overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <LightbulbIcon size={20} className="text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold" style={{ fontFamily: 'Orbitron, sans-serif' }}>Lighting Zones</h3>
                <p className="text-xs text-gray-400">{lightZones.filter(z => z.active).length} of {lightZones.length} active</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setLightZones(prev => prev.map(z => ({ ...z, active: true })))}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/30"
              >
                All On
              </button>
              <button 
                onClick={() => setLightZones(prev => prev.map(z => ({ ...z, active: false })))}
                className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/30"
              >
                All Off
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          {Object.entries(groupedZones).map(([category, zones]) => (
            <div key={category}>
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <LayersIcon size={12} />
                {category}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {zones.map(zone => (
                  <div 
                    key={zone.id}
                    className={`
                      p-3 rounded-xl border transition-all
                      ${zone.active 
                        ? 'bg-white/5 border-white/20' 
                        : 'bg-transparent border-white/5 opacity-60'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleZone(zone.id)}
                        className={`
                          w-10 h-10 rounded-lg flex items-center justify-center transition-all
                          ${zone.active 
                            ? 'shadow-lg' 
                            : 'bg-white/5'
                          }
                        `}
                        style={{ 
                          backgroundColor: zone.active ? `${zone.color}30` : undefined,
                          color: zone.active ? zone.color : '#6b7280',
                          boxShadow: zone.active ? `0 0 20px ${zone.color}40` : undefined
                        }}
                      >
                        {zone.icon}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{zone.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={zone.intensity}
                            onChange={e => setZoneIntensity(zone.id, Number(e.target.value))}
                            disabled={!zone.active}
                            className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white disabled:opacity-30"
                          />
                          <span className="text-xs text-gray-500 w-8">{zone.intensity}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Water Features */}
      <div className="rounded-2xl border border-white/10 bg-[#0c0c14] overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <WaterfallIcon size={20} className="text-cyan-400" />
            </div>
            <div>
              <h3 className="font-semibold" style={{ fontFamily: 'Orbitron, sans-serif' }}>Water Features</h3>
              <p className="text-xs text-gray-400">{waterFeatures.filter(w => w.active).length} active</p>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {waterFeatures.map(feature => (
              <button
                key={feature.id}
                onClick={() => toggleWater(feature.id)}
                className={`
                  p-4 rounded-xl border transition-all text-left
                  ${feature.active 
                    ? 'bg-cyan-500/10 border-cyan-500/30' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }
                `}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={feature.active ? 'text-cyan-400' : 'text-gray-500'}>
                    {getWaterIcon(feature.type)}
                  </span>
                  <span className="text-sm font-medium">{feature.name}</span>
                </div>
                {feature.speed !== undefined && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-cyan-400 rounded-full transition-all"
                        style={{ width: `${feature.speed}%`, opacity: feature.active ? 1 : 0.3 }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{feature.speed}%</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Boats */}
        <div className="p-4 border-t border-white/10">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <BoatIcon size={14} />
            Boats
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {boats.map(boat => (
              <div 
                key={boat.id}
                className={`
                  p-3 rounded-xl border transition-all
                  ${boat.active 
                    ? 'bg-blue-500/10 border-blue-500/30' 
                    : 'bg-white/5 border-white/10'
                  }
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <BoatIcon size={16} className={boat.active ? 'text-blue-400' : 'text-gray-500'} />
                    <span className="text-sm font-medium">{boat.name}</span>
                  </div>
                  <button
                    onClick={() => setBoats(prev => prev.map(b => b.id === boat.id ? { ...b, lights: !b.lights } : b))}
                    className={`p-1 rounded ${boat.lights ? 'text-amber-400' : 'text-gray-600'}`}
                  >
                    💡
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setBoats(prev => prev.map(b => b.id === boat.id ? { ...b, active: !b.active } : b))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${
                      boat.active 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-white/10 text-gray-400'
                    }`}
                  >
                    {boat.active ? 'Running' : 'Start'}
                  </button>
                  <button className="px-3 py-1.5 rounded-lg bg-white/10 text-gray-400 text-xs">
                    ⚙️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Scenery */}
      <div className="rounded-2xl border border-white/10 bg-[#0c0c14] overflow-hidden">
        <div className="p-4 border-b border-white/10 bg-gradient-to-r from-emerald-500/10 to-green-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <TreeIcon size={20} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold" style={{ fontFamily: 'Orbitron, sans-serif' }}>Animated Scenery</h3>
              <p className="text-xs text-gray-400">Moving elements & decorations</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          {/* Windmill */}
          <div className={`p-4 rounded-xl border transition-all ${sceneryElements.windmill ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10'}`}>
            <div className="flex items-center gap-2 mb-3">
              <WindmillIcon size={20} className={sceneryElements.windmill ? 'text-emerald-400' : 'text-gray-500'} />
              <span className="text-sm font-medium">Windmill</span>
            </div>
            <button
              onClick={() => setSceneryElements(prev => ({ ...prev, windmill: !prev.windmill }))}
              className={`w-full py-2 rounded-lg text-xs font-medium mb-2 ${
                sceneryElements.windmill ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-gray-400'
              }`}
            >
              {sceneryElements.windmill ? 'Spinning' : 'Start'}
            </button>
            {sceneryElements.windmill && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Speed</span>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={sceneryElements.windmillSpeed}
                  onChange={e => setSceneryElements(prev => ({ ...prev, windmillSpeed: Number(e.target.value) }))}
                  className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400"
                />
              </div>
            )}
          </div>

          {/* Smokestacks */}
          <div className={`p-4 rounded-xl border transition-all ${sceneryElements.smokestacks ? 'bg-gray-500/10 border-gray-500/30' : 'bg-white/5 border-white/10'}`}>
            <div className="flex items-center gap-2 mb-3">
              <CloudIcon size={20} className={sceneryElements.smokestacks ? 'text-gray-400' : 'text-gray-600'} />
              <span className="text-sm font-medium">Smokestacks</span>
            </div>
            <button
              onClick={() => setSceneryElements(prev => ({ ...prev, smokestacks: !prev.smokestacks }))}
              className={`w-full py-2 rounded-lg text-xs font-medium ${
                sceneryElements.smokestacks ? 'bg-gray-500/20 text-gray-400' : 'bg-white/10 text-gray-500'
              }`}
            >
              {sceneryElements.smokestacks ? 'Active' : 'Inactive'}
            </button>
          </div>

          {/* Flag Poles */}
          <div className={`p-4 rounded-xl border transition-all ${sceneryElements.flagPoles ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/10'}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className={sceneryElements.flagPoles ? 'text-red-400' : 'text-gray-600'}>🚩</span>
              <span className="text-sm font-medium">Flag Poles</span>
            </div>
            <button
              onClick={() => setSceneryElements(prev => ({ ...prev, flagPoles: !prev.flagPoles }))}
              className={`w-full py-2 rounded-lg text-xs font-medium ${
                sceneryElements.flagPoles ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-gray-500'
              }`}
            >
              {sceneryElements.flagPoles ? 'Waving' : 'Still'}
            </button>
          </div>

          {/* Clock Tower */}
          <div className={`p-4 rounded-xl border transition-all ${sceneryElements.clockTower ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-white/10'}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className={sceneryElements.clockTower ? 'text-amber-400' : 'text-gray-600'}>🕐</span>
              <span className="text-sm font-medium">Clock Tower</span>
            </div>
            <button
              onClick={() => setSceneryElements(prev => ({ ...prev, clockTower: !prev.clockTower }))}
              className={`w-full py-2 rounded-lg text-xs font-medium ${
                sceneryElements.clockTower ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-gray-500'
              }`}
            >
              {sceneryElements.clockTower ? 'Lit' : 'Dark'}
            </button>
          </div>

          {/* Church Bells */}
          <div className={`p-4 rounded-xl border transition-all ${sceneryElements.churchBells ? 'bg-purple-500/10 border-purple-500/30' : 'bg-white/5 border-white/10'}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className={sceneryElements.churchBells ? 'text-purple-400' : 'text-gray-600'}>🔔</span>
              <span className="text-sm font-medium">Church Bells</span>
            </div>
            <button
              onClick={() => setSceneryElements(prev => ({ ...prev, churchBells: !prev.churchBells }))}
              className={`w-full py-2 rounded-lg text-xs font-medium ${
                sceneryElements.churchBells ? 'bg-purple-500/20 text-purple-400' : 'bg-white/10 text-gray-500'
              }`}
            >
              {sceneryElements.churchBells ? 'Ringing' : 'Silent'}
            </button>
          </div>

          {/* Mountain Lights */}
          <div className="p-4 rounded-xl border bg-white/5 border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <MountainIcon size={20} className="text-slate-400" />
              <span className="text-sm font-medium">Mountain LEDs</span>
            </div>
            <button className="w-full py-2 rounded-lg text-xs font-medium bg-slate-500/20 text-slate-400">
              Configure
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
