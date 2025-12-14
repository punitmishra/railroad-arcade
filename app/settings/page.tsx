'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  SettingsIcon, ArrowLeftIcon, BellIcon, SunIcon, MoonIcon,
  VolumeIcon, UserIcon, ShieldIcon, TrashIcon
} from '@/components/icons';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState({
    notifications: true,
    soundEffects: true,
    darkMode: true,
    autoplay: false,
    showTutorials: true,
    emailUpdates: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In a real app, save to API
      await new Promise(resolve => setTimeout(resolve, 500));
      setSaveMessage('Settings saved!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (status === 'loading') {
    return <LoadingState />;
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#050508]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-400"
            >
              <ArrowLeftIcon size={20} />
            </button>
            <div>
              <h1
                className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                Settings
              </h1>
              <p className="text-xs text-gray-500">Customize your experience</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Account Section */}
        <SettingsSection title="Account" icon={<UserIcon size={18} />}>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-4">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                  <span className="text-lg font-bold text-white">
                    {session.user.name?.charAt(0) || session.user.email?.charAt(0) || '?'}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <div className="font-medium text-white">{session.user.name || 'User'}</div>
                <div className="text-sm text-gray-500">{session.user.email}</div>
              </div>
              <a
                href="/profile"
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-400 hover:bg-white/10 transition-all"
              >
                Edit Profile
              </a>
            </div>
          </div>
        </SettingsSection>

        {/* Preferences Section */}
        <SettingsSection title="Preferences" icon={<SettingsIcon size={18} />}>
          <ToggleSetting
            label="Dark Mode"
            description="Use dark theme throughout the app"
            icon={settings.darkMode ? <MoonIcon size={18} /> : <SunIcon size={18} />}
            enabled={settings.darkMode}
            onChange={() => handleToggle('darkMode')}
          />
          <ToggleSetting
            label="Sound Effects"
            description="Play sounds for train movements and actions"
            icon={<VolumeIcon size={18} />}
            enabled={settings.soundEffects}
            onChange={() => handleToggle('soundEffects')}
          />
          <ToggleSetting
            label="Auto-play Demo"
            description="Automatically start demo mode on page load"
            icon={<SunIcon size={18} />}
            enabled={settings.autoplay}
            onChange={() => handleToggle('autoplay')}
          />
          <ToggleSetting
            label="Show Tutorials"
            description="Display helpful tips for new features"
            icon={<BellIcon size={18} />}
            enabled={settings.showTutorials}
            onChange={() => handleToggle('showTutorials')}
          />
        </SettingsSection>

        {/* Notifications Section */}
        <SettingsSection title="Notifications" icon={<BellIcon size={18} />}>
          <ToggleSetting
            label="Push Notifications"
            description="Receive notifications about your sessions"
            icon={<BellIcon size={18} />}
            enabled={settings.notifications}
            onChange={() => handleToggle('notifications')}
          />
          <ToggleSetting
            label="Email Updates"
            description="Get updates about new features and promotions"
            icon={<BellIcon size={18} />}
            enabled={settings.emailUpdates}
            onChange={() => handleToggle('emailUpdates')}
          />
        </SettingsSection>

        {/* Privacy Section */}
        <SettingsSection title="Privacy & Security" icon={<ShieldIcon size={18} />}>
          <div className="space-y-3">
            <button className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-left hover:bg-white/10 transition-all">
              <div className="font-medium text-white">Change Password</div>
              <div className="text-sm text-gray-500">Update your account password</div>
            </button>
            <button className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-left hover:bg-white/10 transition-all">
              <div className="font-medium text-white">Download My Data</div>
              <div className="text-sm text-gray-500">Export all your account data</div>
            </button>
          </div>
        </SettingsSection>

        {/* Danger Zone */}
        <SettingsSection title="Danger Zone" icon={<TrashIcon size={18} />} danger>
          <button className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-left hover:bg-red-500/20 transition-all">
            <div className="font-medium text-red-400">Delete Account</div>
            <div className="text-sm text-red-400/60">Permanently delete your account and all data</div>
          </button>
        </SettingsSection>

        {/* Save Button */}
        <div className="mt-8 flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-medium hover:from-cyan-400 hover:to-purple-500 transition-all disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          {saveMessage && (
            <span className={`text-sm ${saveMessage.includes('Failed') ? 'text-red-400' : 'text-emerald-400'}`}>
              {saveMessage}
            </span>
          )}
        </div>
      </main>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center animate-pulse">
          <SettingsIcon size={32} className="text-white" />
        </div>
        <p className="text-gray-400">Loading settings...</p>
      </div>
    </div>
  );
}

function SettingsSection({
  title,
  icon,
  children,
  danger = false,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="mb-8">
      <h2 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${danger ? 'text-red-400' : 'text-gray-400'}`}>
        {icon}
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function ToggleSetting({
  label,
  description,
  icon,
  enabled,
  onChange,
}: {
  label: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-3">
        <div className="text-gray-400">{icon}</div>
        <div>
          <div className="font-medium text-white">{label}</div>
          <div className="text-sm text-gray-500">{description}</div>
        </div>
      </div>
      <button
        onClick={onChange}
        className={`relative w-12 h-6 rounded-full transition-all ${
          enabled ? 'bg-cyan-500' : 'bg-white/10'
        }`}
      >
        <div
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
            enabled ? 'left-7' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}
