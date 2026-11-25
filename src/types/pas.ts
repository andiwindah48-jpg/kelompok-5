export type NavigationMode = 'orbit' | 'walk' | 'topdown';

export type InspectableId =
  | 'microphone'
  | 'mixer'
  | 'amplifier'
  | 'speakerA'
  | 'speakerB'
  | 'ds18b20'
  | 'acs758'
  | 'sen0232'
  | 'monitoring';

export type StationAreaId = 'area1' | 'area2' | 'area3' | 'area4' | 'area5';

export interface InternalComponentSpec {
  id: string;
  name: string;
  role: string;
  detail: string;
  spec: string;
}

export interface DeviceCatalogEntry {
  id: InspectableId;
  areaId: StationAreaId;
  areaLabel: string;
  title: string;
  subtitle: string;
  summary: string;
  supportsExplode: boolean;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  components: InternalComponentSpec[];
}

export interface MixerSettings {
  systemPower: boolean;
  micActive: boolean;
  priorityOverride: boolean;
  bgmPlaying: boolean;
  acVentilation: boolean;
  micGain: number; // 0 - 100
  masterVolume: number; // 0 - 100
  eqBass: number; // -12 to +12 dB
  eqMid: number; // -12 to +12 dB
  eqTreble: number; // -12 to +12 dB
  zoneA: boolean;
  zoneB: boolean;
}

export interface SensorTelemetry {
  temperatureC: number; // DS18B20 heatsink temperature
  currentA: number; // ACS758 DC supply current
  voltageV: number; // DC bus voltage
  soundDb: number; // SEN0232 SPL at 1m in front of speaker
  audioRms: number; // 0 - 1 normalized signal level
  powerWatts: number; // Calculated DC power draw
  thermalWarning: boolean;
  overcurrentWarning: boolean;
  signalPathActive: boolean;
  history: {
    t: string;
    temp: number;
    curr: number;
    db: number;
  }[];
}

export interface AnnouncementPreset {
  id: string;
  flightCode: string;
  gate: string;
  destination: string;
  category: 'boarding' | 'delay' | 'safety';
  label: string;
  script: string;
}
