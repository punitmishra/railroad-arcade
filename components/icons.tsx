// Railroad Arcade - Custom SVG Icons (Zero Dependencies)
import { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };
const d = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

// === CRYPTO & PAYMENTS ===
export const BitcoinIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><circle cx="12" cy="12" r="10"/><path d="M9 8h4.5a2.5 2.5 0 010 5H9V8zM9 13h5a2.5 2.5 0 010 5H9v-5z"/><path d="M10 6v2M14 6v2M10 18v-2M14 18v-2"/></svg>
);
export const EthereumIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M12 2l8 10-8 4.5L4 12l8-10z"/><path d="M12 22l8-10-8 4.5-8-4.5 8 10z"/><path d="M12 12v4.5" opacity=".5"/></svg>
);
export const CryptoWalletIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M2 10h20"/><circle cx="17" cy="14" r="2"/><path d="M6 6V4a2 2 0 012-2h8a2 2 0 012 2v2"/></svg>
);
export const CreditCardIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 15h4"/></svg>
);
export const DollarIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
);
export const CoinsIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1110.34 18"/><path d="M7 6h2v4"/></svg>
);
export const ReceiptIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z"/><path d="M8 10h8M8 14h5"/></svg>
);
export const QRCodeIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="3" height="3"/><rect x="18" y="14" width="3" height="3"/><rect x="14" y="18" width="3" height="3"/><rect x="18" y="18" width="3" height="3"/></svg>
);

// === SENSORS ===
export const SensorIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
);
export const DistanceSensorIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="2" y="8" width="6" height="8" rx="1"/><path d="M8 12h3"/><path d="M14 8l4-2v12l-4-2V8z"/><path d="M18 10l3-1v6l-3-1"/></svg>
);
export const LightSensorIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><circle cx="12" cy="12" r="5"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>
);
export const TemperatureIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z"/><circle cx="11.5" cy="17.5" r="2" fill="currentColor"/><path d="M11.5 10v5"/></svg>
);
export const AccelerometerIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M12 8v8M8 12h8"/><circle cx="12" cy="12" r="2" fill="currentColor"/><path d="M12 4v2M12 18v2M4 12h2M18 12h2"/></svg>
);
export const MicrophoneIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0014 0"/><path d="M12 17v4M8 21h8"/></svg>
);
export const GPIOIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/><circle cx="12" cy="7" r="1.5" fill="currentColor"/><circle cx="17" cy="7" r="1.5" fill="currentColor"/><circle cx="7" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="17" cy="12" r="1.5" fill="currentColor"/><circle cx="7" cy="17" r="1.5" fill="currentColor"/><circle cx="12" cy="17" r="1.5" fill="currentColor"/><circle cx="17" cy="17" r="1.5" fill="currentColor"/></svg>
);
export const ChipIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="6" y="6" width="12" height="12" rx="1"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/></svg>
);
export const WaveformIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M2 12h2l2-6 3 12 3-8 3 6 2-4h5"/></svg>
);
export const GaugeIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><circle cx="12" cy="12" r="10"/><path d="M12 6v2M6 12H4M20 12h-2"/><path d="M12 12l3.5-3.5" strokeWidth="2.5"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>
);
export const CalibrationIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><circle cx="12" cy="12" r="10"/><path d="M12 6v12M6 12h12"/><circle cx="12" cy="12" r="3"/><path d="M12 9v6M9 12h6"/></svg>
);
export const AlertCircleIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
);
export const CheckCircleIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>
);
export const RefreshIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0115-6.7L21 8M3 22v-6h6"/><path d="M21 12a9 9 0 01-15 6.7L3 16"/></svg>
);
export const DownloadIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
);
export const UploadIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
);
export const HistoryIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
export const ShieldIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
);
export const LinkIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
);
export const ServerIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><circle cx="6" cy="6" r="1" fill="currentColor"/><circle cx="6" cy="18" r="1" fill="currentColor"/></svg>
);
export const TerminalIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
);
export const DatabaseIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
);
export const CPUIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/></svg>
);

// === TRAINS & RAILROAD ===
export const TrainIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="4" y="3" width="16" height="14" rx="2"/><path d="M9 21l-2-2M15 21l2-2M4 10h16"/><circle cx="8" cy="14" r="1" fill="currentColor"/><circle cx="16" cy="14" r="1" fill="currentColor"/><rect x="8" y="5" width="3" height="3" rx=".5" fill="currentColor" opacity=".4"/><rect x="13" y="5" width="3" height="3" rx=".5" fill="currentColor" opacity=".4"/></svg>
);
export const CrossingIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M4 4l16 16M20 4L4 20" strokeWidth="3"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>
);
export const JunctionIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M12 3v8M12 11L4 21M12 11l8 10"/><circle cx="12" cy="11" r="2" fill="currentColor"/></svg>
);

// === BUILDINGS ===
export const HomeIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M3 12l9-9 9 9"/><path d="M5 10v10a1 1 0 001 1h12a1 1 0 001-1V10"/><rect x="9" y="14" width="6" height="7" rx=".5"/></svg>
);
export const PoliceStationIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="3" y="8" width="18" height="13" rx="1"/><path d="M3 11h18M7 4h10l2 4H5l2-4z"/><rect x="9" y="14" width="6" height="7" rx=".5"/><circle cx="12" cy="6" r="1" fill="currentColor"/></svg>
);
export const FireStationIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="3" y="8" width="18" height="13" rx="1"/><path d="M5 8V5a1 1 0 011-1h12a1 1 0 011 1v3"/><rect x="6" y="14" width="5" height="7" rx=".5"/><rect x="13" y="14" width="5" height="7" rx=".5"/><path d="M12 4v-2M10 2h4" strokeWidth="1.5"/></svg>
);
export const CafeIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M17 8h1a3 3 0 110 6h-1"/><path d="M3 8h14v8a4 4 0 01-4 4H7a4 4 0 01-4-4V8z"/><path d="M6 1v3M10 1v3M14 1v3"/></svg>
);
export const ConstructionIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M2 20h20"/><path d="M6 20V10l3-7h6l3 7v10"/><rect x="9" y="3" width="6" height="4" rx=".5" fill="currentColor" opacity=".5"/><rect x="8" y="12" width="8" height="8" rx=".5"/></svg>
);

// === VEHICLES ===
export const CarIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M5 11l2-5h10l2 5"/><rect x="3" y="11" width="18" height="7" rx="1"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
);
export const PoliceCarIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M5 11l2-5h10l2 5"/><rect x="3" y="11" width="18" height="7" rx="1"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><rect x="9" y="6" width="6" height="2" rx=".5" fill="currentColor"/></svg>
);
export const FireTruckIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="1" y="10" width="17" height="8" rx="1"/><rect x="13" y="6" width="6" height="4" rx=".5"/><path d="M18 10h4l1 4v4h-5"/><circle cx="6" cy="18" r="2"/><circle cx="16" cy="18" r="2"/></svg>
);
export const TruckIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="1" y="8" width="14" height="10" rx="1"/><path d="M15 11h4l3 4v3h-7v-7z"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/></svg>
);
export const BoatIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M2 20s2 2 5 2 4-2 7-2 4 2 7 2 3-2 3-2"/><path d="M4 17l8-12 8 12H4z"/><path d="M12 5v7"/></svg>
);

// === ENVIRONMENT ===
export const LightbulbIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M9 21h6M12 3a6 6 0 016 6c0 2.22-1.21 4.16-3 5.2V17a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2.8c-1.79-1.04-3-2.98-3-5.2a6 6 0 016-6z"/></svg>
);
export const SunIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
);
export const MoonIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
);
export const WaterIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>
);
export const TreeIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M12 22v-6"/><path d="M12 2l7 14H5L12 2z" fill="currentColor" opacity=".3"/><path d="M12 2l7 14H5L12 2z"/></svg>
);

// === CONTROLS ===
export const PlayIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/></svg>
);
export const PauseIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/></svg>
);
export const StopIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor"/></svg>
);
export const EmergencyIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12" strokeWidth="2.5"/><circle cx="12" cy="16" r="1" fill="currentColor"/></svg>
);
export const GearIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
);
export const SettingsIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
);
export const GiftIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="3" y="8" width="18" height="4" rx="1"/><rect x="3" y="12" width="18" height="9" rx="1"/><path d="M12 8v13"/><path d="M19 8c-3 0-5-2-7-2s-4 2-7 2"/></svg>
);
export const RotateIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
);

// === TOKENS & PAYMENT ===
export const TokenIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><circle cx="12" cy="12" r="10"/><path d="M12 6v12M15 9.5c0-1.5-1.5-2.5-3-2.5s-3 1-3 2.5 1.5 2 3 2.5 3 1.5 3 3-1.5 2.5-3 2.5-3-1-3-2.5"/></svg>
);
export const CoinIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><circle cx="12" cy="12" r="10" fill="currentColor" opacity=".2"/><circle cx="12" cy="12" r="10"/><path d="M12 8v8M9 12h6"/></svg>
);
export const WalletIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="16" cy="12" r="1.5" fill="currentColor"/><path d="M2 10h20"/></svg>
);

// === GAMING ===
export const GamepadIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="2" y="6" width="20" height="12" rx="3"/><circle cx="17" cy="12" r="1.5" fill="currentColor"/><circle cx="14" cy="10" r="1" fill="currentColor"/><path d="M6 10v4M4 12h4"/></svg>
);
export const TrophyIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M6 9H4a2 2 0 01-2-2V5a2 2 0 012-2h2M18 9h2a2 2 0 002-2V5a2 2 0 00-2-2h-2"/><path d="M6 3h12v7a6 6 0 01-12 0V3z"/><path d="M12 17v4M8 21h8"/></svg>
);
export const SparklesIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" fill="currentColor"/><path d="M5 19l1 3 1-3 3-1-3-1-1-3-1 3-3 1 3 1z" fill="currentColor" opacity=".6"/></svg>
);

// === UI ===
export const ChevronUpIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><polyline points="18 15 12 9 6 15"/></svg>
);
export const ChevronDownIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><polyline points="6 9 12 15 18 9"/></svg>
);
export const PlusIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);
export const MinusIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><line x1="5" y1="12" x2="19" y2="12"/></svg>
);
export const ClockIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
export const CalendarIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);
export const AlertIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg>
);
export const ChartIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
);
export const CameraIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
);
export const LockIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
);
export const UnlockIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 019.9-1"/></svg>
);
export const VolumeIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14"/></svg>
);
export const GridIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
);
export const ThermometerIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z"/></svg>
);
export const HumidityIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/><path d="M8 14a4 4 0 008 0"/></svg>
);
export const CloseIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);
export const MenuIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
);
export const ShareIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>
);
export const MessageIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
);
export const SendIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
);
export const TrashIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
);
export const ZoomInIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M11 8v6M8 11h6"/></svg>
);
export const ImageIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M21 15l-5-5L5 21"/></svg>
);
export const UsersIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
);
export const HeartIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
);
export const StarIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
);
export const FilterIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
);

// === SCENERY & ENVIRONMENT ===
export const WaterfallIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M7 2v4c0 2-2 4-2 6s2 4 2 6v4"/><path d="M12 2v4c0 2-2 4-2 6s2 4 2 6v4"/><path d="M17 2v4c0 2-2 4-2 6s2 4 2 6v4"/><circle cx="5" cy="20" r="1" fill="currentColor" opacity=".5"/><circle cx="19" cy="18" r="1" fill="currentColor" opacity=".5"/></svg>
);
export const MountainIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M8 3l4 8 5-3 5 13H2L8 3z"/><path d="M4.14 21l6.36-10.5 2.5 4.5" opacity=".5"/></svg>
);
export const BridgeIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M2 18h20"/><path d="M4 18v-4a8 8 0 0116 0v4"/><path d="M8 18v-2a4 4 0 018 0v2"/><rect x="3" y="18" width="2" height="3" rx=".5"/><rect x="19" y="18" width="2" height="3" rx=".5"/></svg>
);
export const TunnelIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M4 21V10a8 8 0 0116 0v11"/><path d="M4 21h16"/><ellipse cx="12" cy="14" rx="4" ry="5" fill="currentColor" opacity=".2"/><path d="M8 21v-7a4 4 0 018 0v7"/></svg>
);
export const LakeIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><ellipse cx="12" cy="14" rx="10" ry="6" fill="currentColor" opacity=".15"/><ellipse cx="12" cy="14" rx="10" ry="6"/><path d="M5 14c1.5-1 3-1.5 4.5-1s3 1.5 5 1.5 3.5-1 5-1.5"/></svg>
);
export const FountainIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M12 3v5"/><path d="M9 5c0-1.5 1.5-3 3-3s3 1.5 3 3"/><path d="M6 8h12"/><path d="M8 8c-2 4-2 8 0 12h8c2-4 2-8 0-12"/><path d="M6 20h12"/><circle cx="12" cy="5" r="1" fill="currentColor"/></svg>
);
export const WindmillIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><circle cx="12" cy="8" r="2"/><path d="M12 6V2M12 10l4 4M12 10l-4 4M12 6l3-3M12 6l-3-3"/><path d="M10 10h4v12H10z"/><path d="M8 22h8"/></svg>
);
export const ParkIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><circle cx="12" cy="8" r="5" fill="currentColor" opacity=".2"/><circle cx="12" cy="8" r="5"/><path d="M12 13v8"/><path d="M8 21h8"/><circle cx="6" cy="12" r="3" fill="currentColor" opacity=".15"/><circle cx="18" cy="12" r="3" fill="currentColor" opacity=".15"/></svg>
);
export const BenchIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="3" y="10" width="18" height="3" rx="1"/><path d="M5 13v5M19 13v5M7 10V7a2 2 0 012-2h6a2 2 0 012 2v3"/></svg>
);
export const StreetLampIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M12 2v4"/><circle cx="12" cy="8" r="3"/><path d="M12 11v11"/><path d="M9 22h6"/><path d="M9 8l-3 3M15 8l3 3"/></svg>
);
export const FerrisWheelIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><circle cx="12" cy="10" r="8"/><circle cx="12" cy="10" r="2"/><path d="M12 2v6M12 12v6M4 10h6M14 10h6M6.34 4.34l4.24 4.24M13.42 11.42l4.24 4.24M6.34 15.66l4.24-4.24M13.42 8.58l4.24-4.24"/><path d="M8 22h8l-4-4-4 4z"/></svg>
);
export const RollercoasterIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M2 18c2-8 6-14 10-14s8 6 10 14"/><path d="M4 18c1.5-5 4-9 8-9s6.5 4 8 9"/><circle cx="6" cy="18" r="2"/><circle cx="12" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>
);

// === TRACK & SIGNALS ===
export const SignalGreenIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="8" y="2" width="8" height="20" rx="2"/><circle cx="12" cy="7" r="2" fill="#374151"/><circle cx="12" cy="12" r="2" fill="#374151"/><circle cx="12" cy="17" r="2" fill="#22c55e"/></svg>
);
export const SignalYellowIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="8" y="2" width="8" height="20" rx="2"/><circle cx="12" cy="7" r="2" fill="#374151"/><circle cx="12" cy="12" r="2" fill="#eab308"/><circle cx="12" cy="17" r="2" fill="#374151"/></svg>
);
export const SignalRedIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="8" y="2" width="8" height="20" rx="2"/><circle cx="12" cy="7" r="2" fill="#ef4444"/><circle cx="12" cy="12" r="2" fill="#374151"/><circle cx="12" cy="17" r="2" fill="#374151"/></svg>
);
export const SwitchLeftIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M4 12h8"/><path d="M12 12l8-6"/><path d="M12 12l8 6" opacity=".3"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>
);
export const SwitchRightIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M4 12h8"/><path d="M12 12l8-6" opacity=".3"/><path d="M12 12l8 6"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>
);
export const TrackStraightIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M2 8h20M2 16h20"/><path d="M5 8v8M9 8v8M13 8v8M17 8v8M21 8v8" strokeWidth="1" opacity=".5"/></svg>
);
export const TrackCurveIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M2 20C2 10 10 2 20 2"/><path d="M6 20C6 12 12 6 20 6" opacity=".5"/></svg>
);
export const StationIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="2" y="10" width="20" height="11" rx="1"/><path d="M4 10V8a2 2 0 012-2h12a2 2 0 012 2v2"/><path d="M12 3v3"/><path d="M8 3h8"/><rect x="5" y="13" width="4" height="4" rx=".5" fill="currentColor" opacity=".3"/><rect x="15" y="13" width="4" height="4" rx=".5" fill="currentColor" opacity=".3"/><path d="M2 17h20"/></svg>
);

// === SPEED & DIRECTION ===
export const SpeedometerIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M12 2a10 10 0 00-7.07 17.07"/><path d="M12 2a10 10 0 017.07 17.07"/><path d="M12 12l4-6"/><circle cx="12" cy="12" r="2" fill="currentColor"/><path d="M6 18h12" strokeWidth="1.5"/></svg>
);
export const ArrowUpIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M12 19V5M5 12l7-7 7 7"/></svg>
);
export const ArrowDownIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M12 5v14M5 12l7 7 7-7"/></svg>
);
export const ArrowLeftIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
);
export const ArrowRightIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M5 12h14M12 5l7 7-7 7"/></svg>
);

// === WEATHER & TIME ===
export const CloudIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></svg>
);
export const RainIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M16 13h-1.26A6 6 0 107 13h9a4 4 0 010 8H7"/><path d="M8 19v2M12 19v2M16 19v2"/></svg>
);
export const SunriseIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M17 18a5 5 0 00-10 0"/><line x1="12" y1="2" x2="12" y2="9"/><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/><line x1="1" y1="18" x2="3" y2="18"/><line x1="21" y1="18" x2="23" y2="18"/><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/><line x1="23" y1="22" x2="1" y2="22"/><polyline points="8 6 12 2 16 6"/></svg>
);
export const SunsetIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M17 18a5 5 0 00-10 0"/><line x1="12" y1="9" x2="12" y2="2"/><line x1="4.22" y1="10.22" x2="5.64" y2="11.64"/><line x1="1" y1="18" x2="3" y2="18"/><line x1="21" y1="18" x2="23" y2="18"/><line x1="18.36" y1="11.64" x2="19.78" y2="10.22"/><line x1="23" y1="22" x2="1" y2="22"/><polyline points="16 6 12 10 8 6"/></svg>
);

// === UTILITIES ===
export const PowerIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M18.36 6.64a9 9 0 11-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
);
export const WifiIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M5 12.55a11 11 0 0114.08 0"/><path d="M1.42 9a16 16 0 0121.16 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg>
);
export const BatteryIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 11v2"/><rect x="4" y="9" width="6" height="6" rx="1" fill="currentColor" opacity=".5"/></svg>
);
export const SliderIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><circle cx="4" cy="12" r="2"/><circle cx="12" cy="10" r="2"/><circle cx="20" cy="14" r="2"/></svg>
);
export const ZapIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" opacity=".2"/><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
);
export const EyeIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
);
export const LayersIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
);
export const MapIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
);
export const ActivityIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
);
export const HashIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>
);

// === ENTERTAINMENT & ATTRACTIONS ===
export const CarouselIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 4v3M12 17v3M4 12h3M17 12h3"/><circle cx="12" cy="7" r="1" fill="currentColor"/><circle cx="17" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="17" r="1" fill="currentColor"/><circle cx="7" cy="12" r="1" fill="currentColor"/></svg>
);
export const BumperCarsIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><ellipse cx="12" cy="16" rx="9" ry="4"/><ellipse cx="8" cy="12" rx="3" ry="2" fill="currentColor" opacity=".3"/><ellipse cx="16" cy="12" rx="3" ry="2" fill="currentColor" opacity=".3"/><path d="M6 10l2 2M18 10l-2 2"/></svg>
);
export const TicketIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M2 9a3 3 0 003 3v0a3 3 0 00-3 3v4h20v-4a3 3 0 00-3-3v0a3 3 0 003-3V5H2v4z"/><path d="M9 5v14" strokeDasharray="2 2"/><circle cx="14" cy="10" r="1" fill="currentColor"/><circle cx="16" cy="14" r="1" fill="currentColor"/></svg>
);
export const PopcornIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M7 22l2-14h6l2 14H7z" fill="currentColor" opacity=".2"/><path d="M7 22l2-14h6l2 14H7z"/><circle cx="8" cy="6" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="8" r="2"/><circle cx="14" cy="8" r="2"/></svg>
);

// === NATURE & LANDSCAPE ===
export const RiverIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M3 6c2 0 4 2 6 2s4-2 6-2 4 2 6 2"/><path d="M3 12c2 0 4 2 6 2s4-2 6-2 4 2 6 2"/><path d="M3 18c2 0 4 2 6 2s4-2 6-2 4 2 6 2"/></svg>
);
export const PondIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><ellipse cx="12" cy="14" rx="9" ry="5" fill="currentColor" opacity=".1"/><ellipse cx="12" cy="14" rx="9" ry="5"/><path d="M6 12c1 .5 2 1 3 1s2-.5 3-1 2-.5 3 0"/><path d="M7 8c0-2 2-4 5-4"/></svg>
);
export const DuckIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><ellipse cx="14" cy="15" rx="7" ry="4" fill="currentColor" opacity=".2"/><ellipse cx="14" cy="15" rx="7" ry="4"/><circle cx="7" cy="10" r="4"/><path d="M3 11h2"/><circle cx="6" cy="9" r="1" fill="currentColor"/></svg>
);
export const FlowerIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><circle cx="12" cy="10" r="3" fill="currentColor"/><circle cx="12" cy="5" r="3" fill="currentColor" opacity=".3"/><circle cx="17" cy="10" r="3" fill="currentColor" opacity=".3"/><circle cx="15" cy="15" r="3" fill="currentColor" opacity=".3"/><circle cx="9" cy="15" r="3" fill="currentColor" opacity=".3"/><circle cx="7" cy="10" r="3" fill="currentColor" opacity=".3"/><path d="M12 13v9"/></svg>
);
export const BushIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><circle cx="8" cy="14" r="5" fill="currentColor" opacity=".2"/><circle cx="16" cy="14" r="5" fill="currentColor" opacity=".2"/><circle cx="12" cy="10" r="5" fill="currentColor" opacity=".3"/><circle cx="8" cy="14" r="5"/><circle cx="16" cy="14" r="5"/><circle cx="12" cy="10" r="5"/><path d="M12 19v3"/></svg>
);
export const RockIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M3 18L7 8l5 4 5-6 4 12H3z" fill="currentColor" opacity=".2"/><path d="M3 18L7 8l5 4 5-6 4 12H3z"/></svg>
);

// === PEOPLE & FIGURES ===
export const PersonIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><circle cx="12" cy="5" r="3"/><path d="M12 8v6M8 22v-6l4-2 4 2v6"/><path d="M9 12l-3 4M15 12l3 4"/></svg>
);
export const CrowdIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><circle cx="6" cy="6" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="18" cy="6" r="2"/><path d="M4 22v-4a3 3 0 013-3h0M12 22v-5a3 3 0 013-3h0a3 3 0 013 3v5M9 22v-4a3 3 0 013-3"/></svg>
);

// === INFRASTRUCTURE ===
export const ParkingIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 17V7h4a3 3 0 010 6H9"/></svg>
);
export const GasPumpIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="3" y="6" width="12" height="15" rx="1"/><path d="M6 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/><path d="M15 10h2a2 2 0 012 2v6a2 2 0 002 2"/><path d="M18 8l3-3"/><rect x="5" y="9" width="8" height="5" rx=".5" fill="currentColor" opacity=".3"/></svg>
);
export const ATMIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="3" y="4" width="18" height="16" rx="2"/><rect x="6" y="7" width="12" height="6" rx="1" fill="currentColor" opacity=".2"/><path d="M6 16h2M10 16h2M14 16h2"/></svg>
);
export const BenchIcon2 = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M4 12h16"/><path d="M4 16h16"/><path d="M6 12v-2a2 2 0 012-2h8a2 2 0 012 2v2"/><path d="M5 16v4M19 16v4"/></svg>
);
export const TrashCanIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M4 6h16M6 6v14a2 2 0 002 2h8a2 2 0 002-2V6"/><path d="M9 3h6a1 1 0 011 1v2H8V4a1 1 0 011-1z"/><path d="M10 10v8M14 10v8"/></svg>
);
export const MailboxIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M3 9a4 4 0 014-4h10a4 4 0 014 4v6a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path d="M3 9h8M21 9h-4M17 5v12"/><path d="M22 10l-4 3"/></svg>
);

// === TRACK ELEMENTS ===
export const BufferIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="4" y="8" width="4" height="12" rx="1"/><rect x="10" y="8" width="4" height="12" rx="1"/><rect x="16" y="8" width="4" height="12" rx="1"/><path d="M2 8h20"/></svg>
);
export const TurntableIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6" fill="currentColor" opacity=".1"/><path d="M6 12h12"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>
);
export const SemaphoreIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M12 3v18"/><path d="M12 6l6 3-6 3" fill="currentColor" opacity=".3"/><path d="M12 6l6 3-6 3"/><circle cx="12" cy="18" r="2" fill="currentColor"/></svg>
);
export const PlatformIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="2" y="14" width="20" height="4" rx="1" fill="currentColor" opacity=".2"/><rect x="2" y="14" width="20" height="4" rx="1"/><path d="M4 14v-4a2 2 0 012-2h12a2 2 0 012 2v4"/><path d="M8 8v6M16 8v6"/></svg>
);

// === AUDIO & EFFECTS ===
export const SpeakerIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" opacity=".2"/><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14"/></svg>
);
export const MusicNoteIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><path d="M9 18V5l12-2v13"/></svg>
);
export const BellIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
);
export const WhistleIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><ellipse cx="10" cy="14" rx="8" ry="5" fill="currentColor" opacity=".2"/><ellipse cx="10" cy="14" rx="8" ry="5"/><path d="M18 12l4-4"/><path d="M15 6c1-2 3-3 5-2"/></svg>
);
export const SmokeIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M4 16c0-2 2-3 2-5s-1-3 1-5M10 16c0-2 2-3 2-5s-1-3 1-5M16 16c0-2 2-3 2-5s-1-3 1-5"/></svg>
);

// === STATUS & INDICATORS ===
export const XCircleIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><circle cx="12" cy="12" r="10" fill="currentColor" opacity=".1"/><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
);
export const InfoIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
);
export const SignalIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M2 20h.01M7 20v-4M12 20v-8M17 20v-12M22 20V8"/></svg>
);
export const RadarIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="currentColor"/><path d="M12 2v4M12 18v4"/></svg>
);

// === VEHICLES EXTENDED ===
export const AmbulanceIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="1" y="10" width="17" height="8" rx="1"/><path d="M18 10h4l2 4v4h-6v-8z"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 6h4M10 4v4"/></svg>
);
export const TaxiIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M5 11l2-5h10l2 5"/><rect x="3" y="11" width="18" height="7" rx="1"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><rect x="9" y="5" width="6" height="2" rx=".5" fill="currentColor"/></svg>
);
export const BusIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M8 19v2M16 19v2"/><circle cx="7" cy="16" r="1" fill="currentColor"/><circle cx="17" cy="16" r="1" fill="currentColor"/><rect x="5" y="7" width="4" height="3" rx=".5" fill="currentColor" opacity=".3"/><rect x="10" y="7" width="4" height="3" rx=".5" fill="currentColor" opacity=".3"/><rect x="15" y="7" width="4" height="3" rx=".5" fill="currentColor" opacity=".3"/></svg>
);
export const HelicopterIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M3 6h18"/><ellipse cx="12" cy="14" rx="6" ry="4" fill="currentColor" opacity=".2"/><ellipse cx="12" cy="14" rx="6" ry="4"/><path d="M12 6v4M18 14h3l1 2v2h-4M6 14H3l-1 2v2h4"/></svg>
);

// === CONTROLS EXTENDED ===
export const DialIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6" fill="currentColor" opacity=".1"/><path d="M12 12l4-4"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="5" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="12" cy="5" r="1"/></svg>
);
export const ToggleOnIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="2" y="6" width="20" height="12" rx="6" fill="currentColor" opacity=".2"/><rect x="2" y="6" width="20" height="12" rx="6"/><circle cx="16" cy="12" r="4" fill="currentColor"/></svg>
);
export const ToggleOffIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><rect x="2" y="6" width="20" height="12" rx="6"/><circle cx="8" cy="12" r="4" fill="currentColor" opacity=".3"/></svg>
);
export const MaximizeIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M8 3H5a2 2 0 00-2 2v3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M16 21h3a2 2 0 002-2v-3"/></svg>
);
export const MinimizeIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/></svg>
);
export const FocusIcon = ({ size = 24, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...d} {...p}><circle cx="12" cy="12" r="3"/><path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/></svg>
);
