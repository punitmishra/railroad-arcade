'use client';

import { useState } from 'react';
import { ModulePanel, TrackSection, ArcadeButton } from './ui';
import { TrainIcon, GearIcon, CalendarIcon, ChartIcon } from './icons';

interface Train {
  id: string;
  name: string;
  speed: number;
  section: string;
  color: string;
  status: 'running' | 'stationed' | 'approaching';
}

interface TrainTrackingModuleProps {
  locked?: boolean;
  onUnlock?: () => void;
}

export function TrainTrackingModule({ locked = false, onUnlock }: TrainTrackingModuleProps) {
  const [trains] = useState<Train[]>([
    { id: '1', name: 'Valley Runner', speed: 30, section: 'L2-S1', color: '#22c55e', status: 'running' },
    { id: '2', name: 'City Limited', speed: 0, section: 'L2-S6', color: '#3b82f6', status: 'stationed' },
    { id: '3', name: 'Mountain Express', speed: 45, section: 'L1-S3', color: '#a855f7', status: 'running' },
  ]);

  const level2Sections = ['L2-S1', 'L2-S2', 'L2-S3', 'L2-S4', 'L2-S5', 'L2-S6', 'L2-S7', 'L2-S8'];
  const level1Sections = ['L1-S1', 'L1-S2', 'L1-S3', 'L1-S4', 'L1-S5', 'L1-S6'];

  const getTrainAtSection = (section: string) => trains.find(t => t.section === section);

  return (
    <ModulePanel
      title="Train Tracking System"
      icon={<TrainIcon size={20} />}
      themeColor="#00f0ff"
      locked={locked}
      onUnlock={onUnlock}
      actions={
        <>
          <button className="p-1.5 rounded-lg hover:bg-white/10 text-cyan-400 transition-colors">
            <ChartIcon size={18} />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition-colors">
            <GearIcon size={18} />
          </button>
        </>
      }
    >
      {/* Level 2 */}
      <div className="mb-4 p-3 rounded-xl bg-[#12121f] border border-white/5">
        <div className="flex items-center gap-3 mb-2">
          {/* Train indicators for L2 */}
          {trains.filter(t => t.section.startsWith('L2')).map(train => (
            <div 
              key={train.id}
              className="flex items-center gap-2 px-2 py-1 rounded-lg text-xs"
              style={{ 
                backgroundColor: `${train.color}15`,
                border: `1px solid ${train.color}40`
              }}
            >
              <span style={{ color: train.color }}>◉</span>
              <span className="font-medium">{train.name}</span>
              <span className="text-gray-400">{train.speed} km/h</span>
              {train.status === 'stationed' && (
                <span className="text-gray-500 text-[10px]">stationed</span>
              )}
              {train.status === 'approaching' && (
                <span className="text-amber-400 text-[10px]">@ junction</span>
              )}
            </div>
          ))}
          <div className="ml-auto flex gap-1">
            <button className="p-1 rounded hover:bg-white/10 text-gray-400">
              <GearIcon size={14} />
            </button>
            <button className="p-1 rounded hover:bg-white/10 text-gray-400">
              <CalendarIcon size={14} />
            </button>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {level2Sections.map(section => {
            const train = getTrainAtSection(section);
            return (
              <TrackSection 
                key={section} 
                id={section} 
                occupied={!!train}
                trainName={train?.name}
                speed={train?.speed}
              />
            );
          })}
        </div>
      </div>

      {/* Level 1 */}
      <div className="mb-4 p-3 rounded-xl bg-[#12121f] border border-white/5">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs text-gray-500 font-medium">Level 1</span>
          {trains.filter(t => t.section.startsWith('L1')).map(train => (
            <div 
              key={train.id}
              className="flex items-center gap-2 px-2 py-1 rounded-lg text-xs"
              style={{ 
                backgroundColor: `${train.color}15`,
                border: `1px solid ${train.color}40`
              }}
            >
              <span style={{ color: train.color }}>◉</span>
              <span className="font-medium">{train.name}</span>
              <span className="text-gray-400">{train.speed} km/h</span>
            </div>
          ))}
          <div className="ml-auto flex gap-1">
            <button className="p-1 rounded hover:bg-white/10 text-gray-400">
              <GearIcon size={14} />
            </button>
            <button className="p-1 rounded hover:bg-white/10 text-gray-400">
              <CalendarIcon size={14} />
            </button>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {level1Sections.map(section => {
            const train = getTrainAtSection(section);
            return (
              <TrackSection 
                key={section} 
                id={section} 
                occupied={!!train}
                trainName={train?.name}
                speed={train?.speed}
              />
            );
          })}
        </div>
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-2 gap-3">
        {/* Scheduled Maintenance */}
        <div className="p-3 rounded-xl bg-[#12121f] border border-white/5">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
            <GearIcon size={16} />
            <span className="font-medium">Scheduled Maintenance</span>
          </div>
          <div className="space-y-2">
            {[
              { train: 'Valley Runner', type: 'Regular Inspection', date: '2024-01-12' },
              { train: 'Mountain Express', type: 'Brake Check', date: '2024-01-15' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <span className="text-cyan-400 text-xs">◉</span>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{item.train}</div>
                  <div className="text-xs text-gray-500">{item.type}</div>
                </div>
                <div className="text-xs text-gray-500">{item.date}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Events */}
        <div className="p-3 rounded-xl bg-[#12121f] border border-white/5">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
            <span className="text-purple-400">◷</span>
            <span className="font-medium">Recent Events</span>
          </div>
          <div className="space-y-2">
            {[
              { time: '14:30', event: 'Mountain Express entered tunnel section' },
              { time: '14:28', event: 'Valley Runner approaching junction point' },
              { time: '14:25', event: 'City Limited arrived at station' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-xs text-gray-500 font-mono w-10">{item.time}</span>
                <span className="text-xs text-gray-400">{item.event}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ModulePanel>
  );
}
