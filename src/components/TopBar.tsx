import React from 'react';
import { Power, Compass, Footprints, Map as MapIcon } from 'lucide-react';
import { NavigationMode } from '../types/pas';

interface TopBarProps {
  navMode: NavigationMode;
  onChangeNavMode: (mode: NavigationMode) => void;
  onOpenDenah: () => void;
  systemPower: boolean;
  onTogglePower: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  navMode,
  onChangeNavMode,
  onOpenDenah,
  systemPower,
  onTogglePower,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between gap-8 px-6 py-3.5 bg-[#0b111c]/90 border-b border-slate-800">
      {/* Zone 1: Single text element wordmark */}
      <span className="text-base font-semibold tracking-tight text-slate-100 whitespace-nowrap shrink-0">
        PAS Control &amp; Simulation Room
      </span>

      {/* Zone 2: Concise single-line navigation links/modes */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          type="button"
          onClick={() => onChangeNavMode('orbit')}
          className={`flex items-center gap-1.5 py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            navMode === 'orbit'
              ? 'text-sky-400 border-sky-400'
              : 'border-transparent hover:text-slate-100'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Orbit 3D</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeNavMode('walk')}
          className={`flex items-center gap-1.5 py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            navMode === 'walk'
              ? 'text-sky-400 border-sky-400'
              : 'border-transparent hover:text-slate-100'
          }`}
        >
          <Footprints className="w-4 h-4" />
          <span>Jalan Orang Pertama</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeNavMode('topdown')}
          className={`flex items-center gap-1.5 py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            navMode === 'topdown'
              ? 'text-sky-400 border-sky-400'
              : 'border-transparent hover:text-slate-100'
          }`}
        >
          <MapIcon className="w-4 h-4" />
          <span>Tampak Atas</span>
        </button>

        <button
          type="button"
          onClick={onOpenDenah}
          className="py-1 border-b-2 border-transparent hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Denah Interaktif
        </button>
      </nav>

      {/* Zone 3: 1 primary system power action */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onTogglePower}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            systemPower
              ? 'bg-emerald-600 text-white hover:bg-emerald-500'
              : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          <span>{systemPower ? 'Sistem PAS Aktif' : 'Nyalakan Sistem'}</span>
        </button>
      </div>
    </header>
  );
};
