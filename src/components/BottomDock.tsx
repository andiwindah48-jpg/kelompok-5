import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Volume2,
  Mic,
  Activity,
  Layers,
  Compass,
  Bell,
  Play,
  Square,
  Wind,
  Map as MapIcon,
} from 'lucide-react';
import { ANNOUNCEMENT_PRESETS, STATION_CAMERAS } from '../data/pasCatalog';
import {
  InspectableId,
  MixerSettings,
  NavigationMode,
  SensorTelemetry,
  StationAreaId,
} from '../types/pas';

type DockTab = 'nav' | 'mixer' | 'sensors' | 'learning';

interface BottomDockProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  navMode: NavigationMode;
  onChangeNavMode: (mode: NavigationMode) => void;
  onSelectCameraPreset: (id: StationAreaId | 'overview') => void;
  onWalkStep: (forward: number, strafe: number) => void;
  onOpenDenah: () => void;
  mixer: MixerSettings;
  onUpdateMixer: (patch: Partial<MixerSettings>) => void;
  announcing: boolean;
  selectedAnnouncementId: string;
  onSelectAnnouncementId: (id: string) => void;
  onPlayChime: () => void;
  onTriggerAnnouncement: () => void;
  onStopAnnouncement: () => void;
  telemetry: SensorTelemetry;
  selectedDevice: InspectableId | null;
  onSelectDevice: (id: InspectableId) => void;
  explodeValues: Record<'microphone' | 'mixer' | 'amplifier' | 'speakerA' | 'speakerB', number>;
  onChangeExplode: (
    device: 'microphone' | 'mixer' | 'amplifier' | 'speakerA' | 'speakerB',
    value: number
  ) => void;
}

export const BottomDock: React.FC<BottomDockProps> = ({
  collapsed,
  onToggleCollapse,
  navMode,
  onChangeNavMode,
  onSelectCameraPreset,
  onWalkStep,
  onOpenDenah,
  mixer,
  onUpdateMixer,
  announcing,
  selectedAnnouncementId,
  onSelectAnnouncementId,
  onPlayChime,
  onTriggerAnnouncement,
  onStopAnnouncement,
  telemetry,
  selectedDevice,
  onSelectDevice,
  explodeValues,
  onChangeExplode,
}) => {
  const [activeTab, setActiveTab] = useState<DockTab>('mixer');

  const activeExplodeDevice: 'microphone' | 'mixer' | 'amplifier' | 'speakerA' | 'speakerB' =
    selectedDevice === 'microphone' ||
    selectedDevice === 'mixer' ||
    selectedDevice === 'amplifier' ||
    selectedDevice === 'speakerA' ||
    selectedDevice === 'speakerB'
      ? selectedDevice
      : 'amplifier';

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-20 w-[min(940px,95vw)] transition-transform duration-200 ${
        collapsed ? 'translate-y-[calc(100%-36px)]' : 'translate-y-0'
      }`}
    >
      {/* Collapse / Expand Handle */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-slate-200 bg-[#0f172a]/95 border border-b-0 border-slate-700 rounded-t-lg hover:text-sky-400 transition-colors cursor-pointer"
        >
          {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{collapsed ? 'Tampilkan Kontrol (H)' : 'Sembunyikan Kontrol (H)'}</span>
        </button>
      </div>

      {/* Main Dock Surface */}
      <div className="bg-[#0f172a]/95 border border-slate-700/90 rounded-xl shadow-2xl overflow-hidden">
        {/* Dock Tab Bar + Compact Telemetry Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-slate-800 bg-[#0b111c]/80">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('nav')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'nav'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Ruangan &amp; Navigasi</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('mixer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'mixer'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Mixer &amp; Pengumuman</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sensors')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'sensors'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Sensor ESP32</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('learning')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'learning'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Komponen Internal</span>
            </button>
          </div>

          {/* Unboxed Clean Telemetry Readout */}
          <div className="hidden sm:flex items-center gap-3 text-xs font-mono-tabular text-slate-300">
            <span>{telemetry.temperatureC.toFixed(1)} °C</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>{telemetry.currentA.toFixed(2)} A</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-emerald-400">{telemetry.soundDb.toFixed(1)} dBA</span>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {/* TAB 1: NAVIGATION & 5 AREAS */}
          {activeTab === 'nav' && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onChangeNavMode('orbit')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      navMode === 'orbit'
                        ? 'bg-slate-100 text-slate-900'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Mode Orbit
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeNavMode('walk')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      navMode === 'walk'
                        ? 'bg-slate-100 text-slate-900'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Jalan Orang Pertama (WASD)
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeNavMode('topdown')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      navMode === 'topdown'
                        ? 'bg-slate-100 text-slate-900'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Tampak Atas 3D
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onOpenDenah}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white rounded-md transition-colors cursor-pointer"
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>Buka Denah &amp; Jalur Kabel</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {STATION_CAMERAS.map((cam) => (
                  <button
                    key={cam.id}
                    type="button"
                    onClick={() => onSelectCameraPreset(cam.id)}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {cam.shortLabel}
                  </button>
                ))}
              </div>

              {navMode === 'walk' && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs text-slate-300">
                  <span>
                    Gunakan tombol <strong className="text-slate-100">W A S D</strong> atau panah untuk berjalan, seret layar untuk menoleh ke sekitar ruangan.
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onWalkStep(0, -1)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded cursor-pointer"
                    >
                      Kiri
                    </button>
                    <button
                      type="button"
                      onClick={() => onWalkStep(1, 0)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded cursor-pointer"
                    >
                      Maju
                    </button>
                    <button
                      type="button"
                      onClick={() => onWalkStep(-1, 0)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded cursor-pointer"
                    >
                      Mundur
                    </button>
                    <button
                      type="button"
                      onClick={() => onWalkStep(0, 1)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded cursor-pointer"
                    >
                      Kanan
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MIXER & AIRPORT ANNOUNCEMENT */}
          {activeTab === 'mixer' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Left: Airport Announcement Simulator */}
              <div className="md:col-span-5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="announcement-select" className="text-xs font-semibold text-slate-200">
                    Simulasi Pengumuman Bandara
                  </label>
                  <button
                    type="button"
                    onClick={onPlayChime}
                    disabled={!mixer.systemPower}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded transition-colors cursor-pointer"
                  >
                    <Bell className="w-3 h-3 text-amber-400" />
                    <span>Chime</span>
                  </button>
                </div>

                <select
                  id="announcement-select"
                  value={selectedAnnouncementId}
                  onChange={(e) => onSelectAnnouncementId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#090f1a] border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
                >
                  {ANNOUNCEMENT_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>

                <div className="flex flex-wrap items-center gap-2">
                  {announcing ? (
                    <button
                      type="button"
                      onClick={onStopAnnouncement}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors cursor-pointer"
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>Hentikan Siaran</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!mixer.systemPower}
                      onClick={onTriggerAnnouncement}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded-lg transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Siarkan Pengumuman</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={!mixer.systemPower}
                    onClick={() => onUpdateMixer({ micActive: !mixer.micActive })}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                      mixer.micActive
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>{mixer.micActive ? 'Mic PTT ON' : 'Mic PTT OFF'}</span>
                  </button>
                </div>
              </div>

              {/* Right: Mixer Gain, Master, 3-Band EQ & Zone Routing */}
              <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Gain Pre-Amp</span>
                    <span className="font-mono-tabular text-sky-400">{mixer.micGain}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={mixer.micGain}
                    onChange={(e) => onUpdateMixer({ micGain: Number(e.target.value) })}
                    className="w-full pas-slider"
                    aria-label="Gain Pre-Amp"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Master Volume</span>
                    <span className="font-mono-tabular text-amber-400">{mixer.masterVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={mixer.masterVolume}
                    onChange={(e) => onUpdateMixer({ masterVolume: Number(e.target.value) })}
                    className="w-full pas-slider"
                    aria-label="Master Volume"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>EQ Mid (Vokal)</span>
                    <span className="font-mono-tabular text-slate-200">
                      {mixer.eqMid > 0 ? `+${mixer.eqMid}` : mixer.eqMid} dB
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    value={mixer.eqMid}
                    onChange={(e) => onUpdateMixer({ eqMid: Number(e.target.value) })}
                    className="w-full pas-slider"
                    aria-label="EQ Mid"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>EQ Bass</span>
                    <span className="font-mono-tabular text-slate-200">
                      {mixer.eqBass > 0 ? `+${mixer.eqBass}` : mixer.eqBass} dB
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    value={mixer.eqBass}
                    onChange={(e) => onUpdateMixer({ eqBass: Number(e.target.value) })}
                    className="w-full pas-slider"
                    aria-label="EQ Bass"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>EQ Treble</span>
                    <span className="font-mono-tabular text-slate-200">
                      {mixer.eqTreble > 0 ? `+${mixer.eqTreble}` : mixer.eqTreble} dB
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    value={mixer.eqTreble}
                    onChange={(e) => onUpdateMixer({ eqTreble: Number(e.target.value) })}
                    className="w-full pas-slider"
                    aria-label="EQ Treble"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5 col-span-2 sm:col-span-1">
                  <button
                    type="button"
                    onClick={() => onUpdateMixer({ zoneA: !mixer.zoneA })}
                    className={`px-2 py-1 rounded text-[11px] font-medium cursor-pointer ${
                      mixer.zoneA ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Spk A
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateMixer({ zoneB: !mixer.zoneB })}
                    className={`px-2 py-1 rounded text-[11px] font-medium cursor-pointer ${
                      mixer.zoneB ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Spk B
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateMixer({ priorityOverride: !mixer.priorityOverride })}
                    className={`px-2 py-1 rounded text-[11px] font-medium cursor-pointer ${
                      mixer.priorityOverride
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    Priority
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateMixer({ bgmPlaying: !mixer.bgmPlaying })}
                    className={`px-2 py-1 rounded text-[11px] font-medium cursor-pointer ${
                      mixer.bgmPlaying
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    BGM
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ESP32 & 3 SENSOR MONITORING */}
          {activeTab === 'sensors' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-stretch">
              <button
                type="button"
                onClick={() => onSelectDevice('ds18b20')}
                className="text-left p-3 rounded-lg bg-[#090f1a] border border-slate-800 hover:border-sky-500 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>DS18B20 · Suhu Heatsink</span>
                  <span className={telemetry.thermalWarning ? 'text-amber-400 font-semibold' : 'text-sky-400'}>
                    {telemetry.thermalWarning ? 'HANGAT' : 'NORMAL'}
                  </span>
                </div>
                <div className="font-mono-tabular text-xl font-semibold text-slate-100 mt-1">
                  {telemetry.temperatureC.toFixed(1)} °C
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Menempel di heatsink amplifier
                </div>
              </button>

              <button
                type="button"
                onClick={() => onSelectDevice('acs758')}
                className="text-left p-3 rounded-lg bg-[#090f1a] border border-slate-800 hover:border-amber-500 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>ACS758 · Arus Suplai DC</span>
                  <span className="text-amber-400 font-mono-tabular">{telemetry.powerWatts.toFixed(0)} W</span>
                </div>
                <div className="font-mono-tabular text-xl font-semibold text-slate-100 mt-1">
                  {telemetry.currentA.toFixed(2)} A
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Rel suplai DC {telemetry.voltageV.toFixed(0)}V amplifier
                </div>
              </button>

              <button
                type="button"
                onClick={() => onSelectDevice('sen0232')}
                className="text-left p-3 rounded-lg bg-[#090f1a] border border-slate-800 hover:border-emerald-500 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>SEN0232 · Tingkat Suara</span>
                  <span className="text-emerald-400">Jarak 1.0 m</span>
                </div>
                <div className="font-mono-tabular text-xl font-semibold text-slate-100 mt-1">
                  {telemetry.soundDb.toFixed(1)} dBA
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Menghadap Speaker A &amp; B
                </div>
              </button>

              <div className="flex flex-col justify-between p-3 rounded-lg bg-[#090f1a] border border-slate-800">
                <div className="text-[11px] text-slate-400">Kontrol Pendingin &amp; Node</div>
                <button
                  type="button"
                  onClick={() => onUpdateMixer({ acVentilation: !mixer.acVentilation })}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    mixer.acVentilation
                      ? 'bg-sky-600 text-white hover:bg-sky-500'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Wind className="w-3.5 h-3.5" />
                  <span>{mixer.acVentilation ? 'AC Ruangan ON' : 'AC Ruangan OFF'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectDevice('monitoring')}
                  className="text-[11px] text-sky-400 hover:text-sky-300 text-left mt-1 cursor-pointer"
                >
                  Lihat Komputer &amp; ESP32 →
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: LEARNING & EXPLODED VIEW */}
          {activeTab === 'learning' && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: 'microphone', label: 'Mikrofon' },
                    { id: 'mixer', label: 'Mixer & Pre-Amp' },
                    { id: 'amplifier', label: 'Power Amplifier' },
                    { id: 'speakerA', label: 'Speaker A' },
                    { id: 'speakerB', label: 'Speaker B' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectDevice(item.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      activeExplodeDevice === item.id && selectedDevice === item.id
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 min-w-[240px]">
                <span className="text-xs text-slate-300 whitespace-nowrap">
                  Buka Internal:
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(explodeValues[activeExplodeDevice] * 100)}
                  onChange={(e) => onChangeExplode(activeExplodeDevice, Number(e.target.value) / 100)}
                  className="w-full pas-slider"
                  aria-label="Slider buka komponen internal"
                />
                <span className="font-mono-tabular text-xs font-semibold text-sky-400 w-10 text-right">
                  {Math.round(explodeValues[activeExplodeDevice] * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
