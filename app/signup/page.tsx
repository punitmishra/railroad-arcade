import { SignupForm } from '@/components/auth/SignupForm';
import { TrainIcon } from '@/components/icons';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#050508]">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      {/* Logo */}
      <a href="/" className="flex items-center gap-3 mb-8 relative z-10">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
          <TrainIcon size={28} className="text-white" />
        </div>
        <span
          className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400"
          style={{ fontFamily: 'Orbitron, sans-serif' }}
        >
          RAILROAD ARCADE
        </span>
      </a>

      {/* Signup Form */}
      <div className="relative z-10 w-full">
        <SignupForm />
      </div>
    </div>
  );
}
