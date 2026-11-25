import { useCallback, useEffect, useRef, useState } from 'react';
import { PASAudioEngine } from './audio/pasAudioEngine';
import { BottomDock } from './components/BottomDock';
import { DenahModal } from './components/DenahModal';
import { InspectorDrawer } from './components/InspectorDrawer';
import { TopBar } from './components/TopBar';
import { ANNOUNCEMENT_PRESETS, DEVICE_CATALOG, STATION_CAMERAS } from './data/pasCatalog';
import { PASSceneController } from './scene/PASSceneController';
import {
  InspectableId,
  MixerSettings,
  NavigationMode,
  SensorTelemetry,
  StationAreaId,
} from './types/pas';

const INITIAL_MIXER: MixerSettings = {
  systemPower: true,
  micActive: false,
  priorityOverride: true,
  bgmPlaying: false,
  acVentilation: true,
  micGain: 68,
  masterVolume: 74,
  eqBass: 0,
  eqMid: 3,
  eqTreble: 2,
  zoneA: true,
  zoneB: true,
};

const INITIAL_TELEMETRY: SensorTelemetry = {
  temperatureC: 31.8,
  currentA: 0.92,
  voltageV: 48.0,
  soundDb: 41.5,
  audioRms: 0,
  powerWatts: 44.2,
  thermalWarning: false,
  overcurrentWarning: false,
  signalPathActive: false,
  history: [],
};

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<PASSceneController | null>(null);
  const audioRef = useRef<PASAudioEngine | null>(null);

  const [navMode, setNavMode] = useState<NavigationMode>('orbit');
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [denahOpen, setDenahOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<InspectableId | null>(null);
  const [hoveredDevice, setHoveredDevice] = useState<InspectableId | null>(null);
  const [contextLost, setContextLost] = useState(false);

  const [mixer, setMixer] = useState<MixerSettings>(INITIAL_MIXER);
  const [announcing, setAnnouncing] = useState(false);
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<string>(
    ANNOUNCEMENT_PRESETS[0].id
  );
  const [telemetry, setTelemetry] = useState<SensorTelemetry>(INITIAL_TELEMETRY);

  const [explodeValues, setExplodeValues] = useState<
    Record<'microphone' | 'mixer' | 'amplifier' | 'speakerA' | 'speakerB', number>
  >({
    microphone: 0,
    mixer: 0,
    amplifier: 0,
    speakerA: 0,
    speakerB: 0,
  });

  // Mutable refs for simulation loop
  const mixerRef = useRef<MixerSettings>(mixer);
  mixerRef.current = mixer;
  const announcingRef = useRef<boolean>(announcing);
  announcingRef.current = announcing;
  const tempRef = useRef<number>(INITIAL_TELEMETRY.temperatureC);

  const handleSelectDevice = useCallback((id: InspectableId | null) => {
    setSelectedDevice(id);
    controllerRef.current?.setSelectedDevice(id);
    if (id) {
      const entry = DEVICE_CATALOG[id];
      if (entry) {
        controllerRef.current?.glideTo(entry.cameraPosition, entry.cameraTarget);
      }
    }
  }, []);

  const selectDeviceRef = useRef(handleSelectDevice);
  selectDeviceRef.current = handleSelectDevice;

  // Initialize Three.js Scene & Web Audio Engine once
  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    const audio = new PASAudioEngine();
    audioRef.current = audio;

    const ctrl = new PASSceneController(mount, {
      onSelectDevice: (id) => selectDeviceRef.current(id),
      onHoverDevice: (id) => setHoveredDevice(id),
      onContextLost: (lost) => setContextLost(lost),
    });
    controllerRef.current = ctrl;

    const onKey = (e: KeyboardEvent) => {
      if (
        document.activeElement &&
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)
      ) {
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        setDockCollapsed((prev) => !prev);
      } else if (e.key === 'Escape') {
        setDenahOpen(false);
        selectDeviceRef.current(null);
      }
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      ctrl.dispose();
      audio.dispose();
      controllerRef.current = null;
      audioRef.current = null;
    };
  }, []);

  // Sync audio mixer settings whenever mixer state changes
  useEffect(() => {
    audioRef.current?.syncSettings(mixer);
  }, [mixer]);

  // Coupled Physics & Sensor Simulation Loop (10 Hz)
  useEffect(() => {
    const interval = window.setInterval(() => {
      const m = mixerRef.current;
      const isAnn = announcingRef.current || (audioRef.current?.isAnnouncing() ?? false);
      const rms = audioRef.current ? audioRef.current.getInstantRms(m) : 0;

      // Coupled electrical, acoustic, and thermal physics
      const activeZones = (m.zoneA ? 1 : 0) + (m.zoneB ? 1 : 0);
      const voltageV = m.systemPower ? 48.0 : 0.0;
      const quiescentA = m.systemPower ? 0.85 : 0.0;
      const loadFactor = activeZones * 0.5;
      const dynamicA = m.systemPower ? rms * 5.8 * (0.35 + loadFactor) : 0;
      const currentA = Math.max(0, quiescentA + dynamicA);
      const powerWatts = voltageV * currentA;

      // DS18B20 Heatsink Temperature integration
      const ambientC = m.acVentilation ? 23.5 : 30.5;
      const thermalRise = m.systemPower ? 7.5 + powerWatts * 0.145 : 0;
      const targetTemp = ambientC + thermalRise;
      const tau = m.acVentilation ? 0.05 : 0.025;
      tempRef.current = tempRef.current + (targetTemp - tempRef.current) * tau;

      // SEN0232 Sound Pressure Level at 1 meter in front of speakers
      const roomNoiseFloor = m.acVentilation ? 42.0 : 38.5;
      let acousticDb = roomNoiseFloor;
      if (m.systemPower && activeZones > 0 && rms > 0.015) {
        const acousticWatts = Math.max(0.01, rms * rms * 28 * activeZones);
        // 92 dB/W/m ceiling speaker sensitivity at 1m distance
        const speakerSpl = 92 + 10 * Math.log10(acousticWatts);
        acousticDb = Math.max(roomNoiseFloor, Math.min(112, speakerSpl));
      }

      const nextTelemetry: SensorTelemetry = {
        temperatureC: tempRef.current,
        currentA,
        voltageV,
        soundDb: acousticDb,
        audioRms: rms,
        powerWatts,
        thermalWarning: tempRef.current >= 58,
        overcurrentWarning: currentA >= 6.5,
        signalPathActive: m.systemPower && rms > 0.03,
        history: [],
      };

      setTelemetry(nextTelemetry);
      controllerRef.current?.syncSimulationState(m, nextTelemetry, isAnn);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleChangeNavMode = (mode: NavigationMode) => {
    setNavMode(mode);
    controllerRef.current?.setNavigationMode(mode);
  };

  const handleSelectCameraPreset = (id: StationAreaId | 'overview') => {
    const preset = STATION_CAMERAS.find((c) => c.id === id);
    if (!preset) return;
    if (navMode === 'topdown') {
      setNavMode('orbit');
      controllerRef.current?.setNavigationMode('orbit');
    }
    controllerRef.current?.glideTo(preset.position, preset.target);
  };

  const handleUpdateMixer = (patch: Partial<MixerSettings>) => {
    setMixer((prev) => {
      const next = { ...prev, ...patch };
      if (!next.systemPower) {
        next.micActive = false;
        next.bgmPlaying = false;
        audioRef.current?.stopAnnouncement();
        setAnnouncing(false);
      }
      return next;
    });
  };

  const handlePlayChime = () => {
    audioRef.current?.playAirportChime(mixer);
  };

  const handleTriggerAnnouncement = () => {
    if (!mixer.systemPower) return;
    const preset =
      ANNOUNCEMENT_PRESETS.find((p) => p.id === selectedAnnouncementId) ??
      ANNOUNCEMENT_PRESETS[0];
    setAnnouncing(true);
    audioRef.current?.triggerAnnouncement(preset.script, mixer, () => {
      setAnnouncing(false);
    });
  };

  const handleStopAnnouncement = () => {
    audioRef.current?.stopAnnouncement();
    setAnnouncing(false);
  };

  const handleChangeExplode = (
    device: 'microphone' | 'mixer' | 'amplifier' | 'speakerA' | 'speakerB',
    value: number
  ) => {
    setExplodeValues((prev) => ({ ...prev, [device]: value }));
    controllerRef.current?.setExplodeLevel(device, value);
  };

  const activeExplodeValue =
    selectedDevice === 'microphone' ||
    selectedDevice === 'mixer' ||
    selectedDevice === 'amplifier' ||
    selectedDevice === 'speakerA' ||
    selectedDevice === 'speakerB'
      ? explodeValues[selectedDevice]
      : 0;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0b111c] select-none">
      {/* Isolated WebGL Viewport Container */}
      <div
        ref={canvasMountRef}
        className="fixed inset-0 w-full h-full"
        aria-label="Ruang 3D Public Address System Control & Simulation Room"
      />

      {/* WebGL Context Lost Fallback */}
      {contextLost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b111c]/95 p-6 text-center">
          <div className="max-w-md space-y-2 border border-slate-700 rounded-xl p-6 bg-[#0f172a]">
            <h2 className="text-base font-semibold text-slate-100">
              Konteks WebGL Terputus Sementara
            </h2>
            <p className="text-xs text-slate-400">
              Perangkat grafis sedang memulihkan tampilan 3D ruangan PAS. Silakan muat ulang halaman jika tampilan tidak kembali otomatis.
            </p>
          </div>
        </div>
      )}

      {/* Top Navigation Bar */}
      <TopBar
        navMode={navMode}
        onChangeNavMode={handleChangeNavMode}
        onOpenDenah={() => setDenahOpen(true)}
        systemPower={mixer.systemPower}
        onTogglePower={() => handleUpdateMixer({ systemPower: !mixer.systemPower })}
      />

      {/* Hover Hint Label (Top-Right discrete text when hovering interactive 3D object) */}
      {hoveredDevice && (
        <div className="fixed top-16 right-4 z-10 pointer-events-none px-3 py-1.5 bg-[#0f172a]/90 border border-slate-700 rounded-md text-xs text-slate-200">
          Klik untuk inspeksi: <strong className="text-sky-400">{DEVICE_CATALOG[hoveredDevice].title}</strong>
        </div>
      )}

      {/* Contextual Device / Sensor Component Inspector */}
      <InspectorDrawer
        selectedId={selectedDevice}
        onClose={() => handleSelectDevice(null)}
        explodeValue={activeExplodeValue}
        onChangeExplode={(val) => {
          if (
            selectedDevice === 'microphone' ||
            selectedDevice === 'mixer' ||
            selectedDevice === 'amplifier' ||
            selectedDevice === 'speakerA' ||
            selectedDevice === 'speakerB'
          ) {
            handleChangeExplode(selectedDevice, val);
          }
        }}
        telemetry={telemetry}
      />

      {/* Collapsible Unified Bottom Control Dock */}
      <BottomDock
        collapsed={dockCollapsed}
        onToggleCollapse={() => setDockCollapsed((c) => !c)}
        navMode={navMode}
        onChangeNavMode={handleChangeNavMode}
        onSelectCameraPreset={handleSelectCameraPreset}
        onWalkStep={(fwd, strafe) => controllerRef.current?.moveWalkStep(fwd, strafe)}
        onOpenDenah={() => setDenahOpen(true)}
        mixer={mixer}
        onUpdateMixer={handleUpdateMixer}
        announcing={announcing}
        selectedAnnouncementId={selectedAnnouncementId}
        onSelectAnnouncementId={setSelectedAnnouncementId}
        onPlayChime={handlePlayChime}
        onTriggerAnnouncement={handleTriggerAnnouncement}
        onStopAnnouncement={handleStopAnnouncement}
        telemetry={telemetry}
        selectedDevice={selectedDevice}
        onSelectDevice={handleSelectDevice}
        explodeValues={explodeValues}
        onChangeExplode={handleChangeExplode}
      />

      {/* Interactive Top-Down Architectural Floorplan (Denah) */}
      <DenahModal
        open={denahOpen}
        onClose={() => setDenahOpen(false)}
        onJumpToDevice={(id) => {
          if (navMode === 'topdown') {
            handleChangeNavMode('orbit');
          }
          handleSelectDevice(id);
        }}
        telemetry={telemetry}
      />
    </div>
  );
}
