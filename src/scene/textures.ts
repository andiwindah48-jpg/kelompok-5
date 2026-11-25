import * as THREE from 'three';
import { MixerSettings, SensorTelemetry } from '../types/pas';

export interface RoomTextureSet {
  floorMap: THREE.CanvasTexture;
  acousticWallMap: THREE.CanvasTexture;
  brushedMetalMap: THREE.CanvasTexture;
  signageMap: THREE.CanvasTexture;
  monitorTexture: THREE.CanvasTexture;
  monitorCanvas: HTMLCanvasElement;
  monitorCtx: CanvasRenderingContext2D;
  oledTexture: THREE.CanvasTexture;
  oledCanvas: HTMLCanvasElement;
  oledCtx: CanvasRenderingContext2D;
  contactShadowMap: THREE.CanvasTexture;
  dispose: () => void;
}

export function createRoomTextures(maxAnisotropy: number): RoomTextureSet {
  // 1. Raised Antistatic Control-Room Floor Tiles (600x600mm aesthetic)
  const floorCanvas = document.createElement('canvas');
  floorCanvas.width = 512;
  floorCanvas.height = 512;
  const fctx = floorCanvas.getContext('2d')!;
  fctx.fillStyle = '#1b2330';
  fctx.fillRect(0, 0, 512, 512);
  // Subtle micro-speckle
  for (let i = 0; i < 1600; i += 1) {
    const x = (i * 73) % 512;
    const y = (i * 137) % 512;
    fctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.08)';
    fctx.fillRect(x, y, 2, 2);
  }
  fctx.strokeStyle = '#0e141d';
  fctx.lineWidth = 4;
  fctx.strokeRect(2, 2, 508, 508);
  fctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
  fctx.lineWidth = 1;
  fctx.strokeRect(10, 10, 492, 492);

  const floorMap = new THREE.CanvasTexture(floorCanvas);
  floorMap.colorSpace = THREE.SRGBColorSpace;
  floorMap.wrapS = THREE.RepeatWrapping;
  floorMap.wrapT = THREE.RepeatWrapping;
  floorMap.repeat.set(8, 10);
  floorMap.anisotropy = maxAnisotropy;

  // 2. Acoustic Slatted Wood / Felt Panel Texture
  const acCanvas = document.createElement('canvas');
  acCanvas.width = 256;
  acCanvas.height = 256;
  const actx = acCanvas.getContext('2d')!;
  actx.fillStyle = '#141a24';
  actx.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 16) {
    actx.fillStyle = '#252f3f';
    actx.fillRect(x + 2, 0, 10, 256);
    actx.fillStyle = '#334155';
    actx.fillRect(x + 2, 0, 2, 256);
  }
  const acousticWallMap = new THREE.CanvasTexture(acCanvas);
  acousticWallMap.colorSpace = THREE.SRGBColorSpace;
  acousticWallMap.wrapS = THREE.RepeatWrapping;
  acousticWallMap.wrapT = THREE.RepeatWrapping;
  acousticWallMap.repeat.set(4, 2);
  acousticWallMap.anisotropy = maxAnisotropy;

  // 3. Brushed Anodized Metal Texture
  const metalCanvas = document.createElement('canvas');
  metalCanvas.width = 256;
  metalCanvas.height = 256;
  const mctx = metalCanvas.getContext('2d')!;
  mctx.fillStyle = '#2c3545';
  mctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 2) {
    const shade = 40 + ((y * 19) % 16);
    mctx.fillStyle = `rgb(${shade}, ${shade + 8}, ${shade + 18})`;
    mctx.fillRect(0, y, 256, 1);
  }
  const brushedMetalMap = new THREE.CanvasTexture(metalCanvas);
  brushedMetalMap.colorSpace = THREE.SRGBColorSpace;
  brushedMetalMap.wrapS = THREE.RepeatWrapping;
  brushedMetalMap.wrapT = THREE.RepeatWrapping;
  brushedMetalMap.anisotropy = maxAnisotropy;

  // 4. Airport PAS Room Front Wall Header Plaque
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 1024;
  signCanvas.height = 256;
  const sctx = signCanvas.getContext('2d')!;
  sctx.fillStyle = '#0f172a';
  sctx.fillRect(0, 0, 1024, 256);
  sctx.strokeStyle = '#38bdf8';
  sctx.lineWidth = 4;
  sctx.strokeRect(12, 12, 1000, 232);
  sctx.fillStyle = '#38bdf8';
  sctx.fillRect(36, 48, 8, 160);
  sctx.fillStyle = '#f8fafc';
  sctx.font = '700 44px "Plus Jakarta Sans", sans-serif';
  sctx.fillText('PUBLIC ADDRESS SYSTEM', 68, 106);
  sctx.fillStyle = '#94a3b8';
  sctx.font = '500 28px "Plus Jakarta Sans", sans-serif';
  sctx.fillText('CONTROL & SIMULATION ROOM · AIRPORT TERMINAL LAB (6 × 8 m)', 68, 158);
  sctx.fillStyle = '#38bdf8';
  sctx.font = '500 20px "IBM Plex Mono", monospace';
  sctx.fillText('100V LINE PA · DS18B20 THERMAL · ACS758 CURRENT · SEN0232 ACOUSTIC', 68, 198);

  const signageMap = new THREE.CanvasTexture(signCanvas);
  signageMap.colorSpace = THREE.SRGBColorSpace;
  signageMap.anisotropy = maxAnisotropy;

  // 5. Dynamic Monitoring Computer Canvas
  const monitorCanvas = document.createElement('canvas');
  monitorCanvas.width = 512;
  monitorCanvas.height = 320;
  const monitorCtx = monitorCanvas.getContext('2d')!;
  const monitorTexture = new THREE.CanvasTexture(monitorCanvas);
  monitorTexture.colorSpace = THREE.SRGBColorSpace;
  monitorTexture.anisotropy = maxAnisotropy;

  // 6. Dynamic ESP32 OLED Canvas
  const oledCanvas = document.createElement('canvas');
  oledCanvas.width = 256;
  oledCanvas.height = 128;
  const oledCtx = oledCanvas.getContext('2d')!;
  const oledTexture = new THREE.CanvasTexture(oledCanvas);
  oledTexture.colorSpace = THREE.SRGBColorSpace;
  oledTexture.anisotropy = maxAnisotropy;

  // 7. Radial Soft Contact Shadow Texture
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const shctx = shadowCanvas.getContext('2d')!;
  const grad = shctx.createRadialGradient(64, 64, 8, 64, 64, 62);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
  grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.25)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  shctx.fillStyle = grad;
  shctx.fillRect(0, 0, 128, 128);
  const contactShadowMap = new THREE.CanvasTexture(shadowCanvas);

  return {
    floorMap,
    acousticWallMap,
    brushedMetalMap,
    signageMap,
    monitorTexture,
    monitorCanvas,
    monitorCtx,
    oledTexture,
    oledCanvas,
    oledCtx,
    contactShadowMap,
    dispose: () => {
      floorMap.dispose();
      acousticWallMap.dispose();
      brushedMetalMap.dispose();
      signageMap.dispose();
      monitorTexture.dispose();
      oledTexture.dispose();
      contactShadowMap.dispose();
    },
  };
}

export function updateMonitoringCanvas(
  textures: RoomTextureSet,
  telemetry: SensorTelemetry,
  mixer: MixerSettings,
  announcing: boolean
): void {
  const { monitorCtx: ctx, monitorCanvas: c, monitorTexture } = textures;
  ctx.fillStyle = '#070c14';
  ctx.fillRect(0, 0, c.width, c.height);

  // Header bar
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, c.width, 40);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '600 15px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('PAS TELEMETRY · ESP32 LIVE MONITOR', 16, 25);

  ctx.fillStyle = mixer.systemPower ? '#10b981' : '#64748b';
  ctx.font = '600 13px "IBM Plex Mono", monospace';
  ctx.fillText(mixer.systemPower ? (announcing ? 'PAGING ACTIVE' : 'SYSTEM ON') : 'STANDBY', 385, 25);

  // 3 Sensor Cards
  const cards = [
    {
      label: 'DS18B20 TEMP',
      val: `${telemetry.temperatureC.toFixed(1)} °C`,
      sub: telemetry.thermalWarning ? 'WARM HEATSINK' : 'HEATSINK OK',
      color: telemetry.thermalWarning ? '#f59e0b' : '#38bdf8',
      x: 16,
    },
    {
      label: 'ACS758 CURRENT',
      val: `${telemetry.currentA.toFixed(2)} A`,
      sub: `${telemetry.powerWatts.toFixed(0)} W DC RAIL`,
      color: telemetry.overcurrentWarning ? '#ef4444' : '#f59e0b',
      x: 180,
    },
    {
      label: 'SEN0232 SOUND',
      val: `${telemetry.soundDb.toFixed(1)} dBA`,
      sub: 'DIST 1.0m FRONT',
      color: '#10b981',
      x: 344,
    },
  ];

  cards.forEach((card) => {
    ctx.fillStyle = '#111927';
    ctx.fillRect(card.x, 54, 152, 86);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.strokeRect(card.x, 54, 152, 86);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 11px "IBM Plex Mono", monospace';
    ctx.fillText(card.label, card.x + 10, 74);
    ctx.fillStyle = card.color;
    ctx.font = '600 22px "IBM Plex Mono", monospace';
    ctx.fillText(card.val, card.x + 10, 106);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '400 10px "IBM Plex Mono", monospace';
    ctx.fillText(card.sub, card.x + 10, 128);
  });

  // Waveform / Trend Box
  ctx.fillStyle = '#0c1320';
  ctx.fillRect(16, 154, 480, 118);
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
  ctx.strokeRect(16, 154, 480, 118);

  // Grid lines
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
  for (let y = 184; y < 270; y += 30) {
    ctx.beginPath();
    ctx.moveTo(16, y);
    ctx.lineTo(496, y);
    ctx.stroke();
  }

  // Audio / SPL waveform trace
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const phase = performance.now() * 0.008;
  const amp = mixer.systemPower ? Math.max(4, telemetry.audioRms * 44) : 1;
  for (let i = 0; i <= 80; i += 1) {
    const px = 22 + (i / 80) * 468;
    const py =
      213 +
      Math.sin(i * 0.35 + phase) * amp * Math.sin((i / 80) * Math.PI) +
      Math.cos(i * 0.7 - phase * 1.3) * (amp * 0.35);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Footer Zone Status
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 12px "IBM Plex Mono", monospace';
  ctx.fillText(
    `ZONE A: ${mixer.zoneA ? 'ON' : 'OFF'}  |  ZONE B: ${mixer.zoneB ? 'ON' : 'OFF'}  |  PRIORITY: ${mixer.priorityOverride ? 'AUTO' : 'MAN'}`,
    16,
    298
  );

  monitorTexture.needsUpdate = true;

  // Also update ESP32 OLED
  const { oledCtx: octx, oledCanvas: oc, oledTexture } = textures;
  octx.fillStyle = '#020617';
  octx.fillRect(0, 0, oc.width, oc.height);
  octx.strokeStyle = '#0ea5e9';
  octx.lineWidth = 2;
  octx.strokeRect(4, 4, oc.width - 8, oc.height - 8);
  octx.fillStyle = '#38bdf8';
  octx.font = '600 15px "IBM Plex Mono", monospace';
  octx.fillText('ESP32 PAS NODE', 14, 24);
  octx.fillStyle = '#e2e8f0';
  octx.font = '500 16px "IBM Plex Mono", monospace';
  octx.fillText(`T: ${telemetry.temperatureC.toFixed(1)} C`, 14, 52);
  octx.fillText(`I: ${telemetry.currentA.toFixed(2)} A`, 14, 78);
  octx.fillStyle = '#34d399';
  octx.fillText(`S: ${telemetry.soundDb.toFixed(1)} dBA`, 14, 104);
  oledTexture.needsUpdate = true;
}
