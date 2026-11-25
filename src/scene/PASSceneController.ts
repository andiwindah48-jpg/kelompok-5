import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ROOM_OVERVIEW_CAMERA } from '../data/pasCatalog';
import { InspectableId, MixerSettings, NavigationMode, SensorTelemetry } from '../types/pas';
import { buildRoom, BuiltRoom } from './builders/buildRoom';
import { buildStations, BuiltStations, ExplodablePart } from './builders/buildStations';
import { createRoomTextures, RoomTextureSet, updateMonitoringCanvas } from './textures';

export interface SceneCallbacks {
  onSelectDevice: (id: InspectableId | null) => void;
  onHoverDevice: (id: InspectableId | null) => void;
  onContextLost: (lost: boolean) => void;
}

const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _euler = new THREE.Euler(0, 0, 0, 'YXZ');

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export class PASSceneController {
  private container: HTMLElement;
  private callbacks: SceneCallbacks;
  private isSoftwareGl: boolean;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private textures: RoomTextureSet;
  private room: BuiltRoom;
  private stations: BuiltStations;
  private ceilingMeshRef: THREE.Object3D | null = null;

  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private clock = new THREE.Clock();
  private frameId = 0;
  private disposed = false;

  // Navigation & camera transition state
  private navMode: NavigationMode = 'orbit';
  private transitionActive = false;
  private targetCamPos = new THREE.Vector3(...ROOM_OVERVIEW_CAMERA.position);
  private targetLookAt = new THREE.Vector3(...ROOM_OVERVIEW_CAMERA.target);

  // First-person walk state
  private keysPressed: Record<string, boolean> = {};
  private walkYaw = 0;
  private walkPitch = -0.05;
  private isDraggingLook = false;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private pointerDownPos = { x: 0, y: 0 };
  private lastHoverCheck = 0;

  // Live simulation state synced from React
  private selectedId: InspectableId | null = null;
  private explodeTargets: Record<'microphone' | 'mixer' | 'amplifier' | 'speakerA' | 'speakerB', number> = {
    microphone: 0,
    mixer: 0,
    amplifier: 0,
    speakerA: 0,
    speakerB: 0,
  };
  private explodeCurrent: Record<'microphone' | 'mixer' | 'amplifier' | 'speakerA' | 'speakerB', number> = {
    microphone: 0,
    mixer: 0,
    amplifier: 0,
    speakerA: 0,
    speakerB: 0,
  };

  private latestMixer: MixerSettings = {
    systemPower: true,
    micActive: false,
    priorityOverride: true,
    bgmPlaying: false,
    acVentilation: true,
    micGain: 65,
    masterVolume: 72,
    eqBass: 0,
    eqMid: 3,
    eqTreble: 2,
    zoneA: true,
    zoneB: true,
  };

  private latestTelemetry: SensorTelemetry = {
    temperatureC: 34.2,
    currentA: 1.15,
    voltageV: 48.0,
    soundDb: 42.0,
    audioRms: 0,
    powerWatts: 55.2,
    thermalWarning: false,
    overcurrentWarning: false,
    signalPathActive: false,
    history: [],
  };

  private announcing = false;
  private lastCanvasRefresh = 0;
  private wavePhase = 0;

  // Bound event listeners for clean disposal
  private handleResizeBound: () => void;
  private handlePointerDownBound: (e: PointerEvent) => void;
  private handlePointerMoveBound: (e: PointerEvent) => void;
  private handlePointerUpBound: (e: PointerEvent) => void;
  private handleKeyDownBound: (e: KeyboardEvent) => void;
  private handleKeyUpBound: (e: KeyboardEvent) => void;
  private handleContextLostBound: (e: Event) => void;
  private handleContextRestoredBound: () => void;

  constructor(container: HTMLElement, callbacks: SceneCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.isSoftwareGl = detectSoftwareWebGL();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b111c);
    this.scene.fog = new THREE.FogExp2(0x0b111c, 0.032);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.camera = new THREE.PerspectiveCamera(58, width / height, 0.08, 45);
    this.camera.position.copy(this.targetCamPos);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.07;
    this.controls.minDistance = 0.55;
    this.controls.maxDistance = 10.5;
    this.controls.maxPolarAngle = Math.PI * 0.495;
    this.controls.target.copy(this.targetLookAt);
    this.controls.update();

    this.controls.addEventListener('start', () => {
      this.transitionActive = false;
    });

    // Studio & Control Room 3-Point Lighting
    const hemi = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 0.72);
    this.scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff4e6, 1.55);
    keyLight.position.set(-2.4, 3.1, 2.8);
    keyLight.castShadow = !this.isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.4;
    keyLight.shadow.camera.far = 14;
    keyLight.shadow.camera.left = -4.5;
    keyLight.shadow.camera.right = 4.5;
    keyLight.shadow.camera.top = 4.5;
    keyLight.shadow.camera.bottom = -4.5;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x7dd3fc, 0.65);
    rimLight.position.set(2.5, 2.7, -3.2);
    this.scene.add(rimLight);

    const frontAccent = new THREE.PointLight(0xe0f2fe, 1.1, 7, 1.6);
    frontAccent.position.set(0, 2.75, -1.9);
    this.scene.add(frontAccent);

    // Build Textures, Room, and Stations
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.textures = createRoomTextures(maxAniso);
    this.room = buildRoom(this.textures);
    this.scene.add(this.room.group);
    // Keep reference to ceiling mesh (second child in buildRoom) so top-down mode can see inside
    this.ceilingMeshRef = this.room.group.children[1] ?? null;

    this.stations = buildStations(this.textures);
    this.scene.add(this.stations.group);

    this.raycaster.layers.set(1);

    updateMonitoringCanvas(this.textures, this.latestTelemetry, this.latestMixer, false);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    // Bind events
    this.handleResizeBound = this.onResize.bind(this);
    this.handlePointerDownBound = this.onPointerDown.bind(this);
    this.handlePointerMoveBound = this.onPointerMove.bind(this);
    this.handlePointerUpBound = this.onPointerUp.bind(this);
    this.handleKeyDownBound = this.onKeyDown.bind(this);
    this.handleKeyUpBound = this.onKeyUp.bind(this);
    this.handleContextLostBound = (e: Event) => {
      e.preventDefault();
      this.callbacks.onContextLost(true);
    };
    this.handleContextRestoredBound = () => {
      this.callbacks.onContextLost(false);
    };

    window.addEventListener('resize', this.handleResizeBound);
    window.addEventListener('keydown', this.handleKeyDownBound);
    window.addEventListener('keyup', this.handleKeyUpBound);
    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', this.handlePointerDownBound);
    dom.addEventListener('pointermove', this.handlePointerMoveBound);
    dom.addEventListener('pointerup', this.handlePointerUpBound);
    dom.addEventListener('webglcontextlost', this.handleContextLostBound);
    dom.addEventListener('webglcontextrestored', this.handleContextRestoredBound);

    this.tick();
  }

  public setNavigationMode(mode: NavigationMode): void {
    this.navMode = mode;
    if (this.ceilingMeshRef) {
      this.ceilingMeshRef.visible = mode !== 'topdown';
    }

    if (mode === 'orbit') {
      this.controls.enabled = true;
      this.camera.up.set(0, 1, 0);
    } else if (mode === 'walk') {
      this.controls.enabled = false;
      this.transitionActive = false;
      this.camera.up.set(0, 1, 0);
      // Place user inside the room at eye level if currently outside or too high
      this.camera.position.set(
        THREE.MathUtils.clamp(this.camera.position.x, -2.4, 2.4),
        1.62,
        THREE.MathUtils.clamp(this.camera.position.z, -2.8, 3.2)
      );
      _euler.setFromQuaternion(this.camera.quaternion, 'YXZ');
      this.walkYaw = _euler.y;
      this.walkPitch = THREE.MathUtils.clamp(_euler.x, -0.55, 0.55);
    } else if (mode === 'topdown') {
      this.controls.enabled = true;
      this.glideTo([0, 7.8, 0.35], [0, 0, -0.15]);
    }
  }

  public glideTo(pos: [number, number, number], target: [number, number, number]): void {
    if (this.navMode === 'walk') {
      // In walk mode, teleport smoothly at eye level facing target
      this.camera.position.set(
        THREE.MathUtils.clamp(pos[0], -2.5, 2.5),
        1.62,
        THREE.MathUtils.clamp(pos[2], -3.3, 3.5)
      );
      _vec3A.set(target[0], target[1], target[2]);
      this.camera.lookAt(_vec3A);
      _euler.setFromQuaternion(this.camera.quaternion, 'YXZ');
      this.walkYaw = _euler.y;
      this.walkPitch = _euler.x;
      return;
    }
    this.targetCamPos.set(pos[0], pos[1], pos[2]);
    this.targetLookAt.set(target[0], target[1], target[2]);
    this.transitionActive = true;
  }

  public setSelectedDevice(id: InspectableId | null): void {
    this.selectedId = id;
    this.stations.setHighlightTarget(id);
  }

  public setExplodeLevel(
    device: 'microphone' | 'mixer' | 'amplifier' | 'speakerA' | 'speakerB',
    amount: number
  ): void {
    this.explodeTargets[device] = THREE.MathUtils.clamp(amount, 0, 1);
  }

  public syncSimulationState(
    mixer: MixerSettings,
    telemetry: SensorTelemetry,
    announcing: boolean
  ): void {
    this.latestMixer = mixer;
    this.latestTelemetry = telemetry;
    this.announcing = announcing;
  }

  public moveWalkStep(forward: number, strafe: number): void {
    if (this.navMode !== 'walk') return;
    this.applyWalkMovement(forward * 0.45, strafe * 0.45);
  }

  private applyWalkMovement(forwardAmount: number, rightAmount: number): void {
    _vec3A.set(-Math.sin(this.walkYaw), 0, -Math.cos(this.walkYaw)).normalize();
    _vec3B.set(Math.cos(this.walkYaw), 0, -Math.sin(this.walkYaw)).normalize();

    const nextX = this.camera.position.x + _vec3A.x * forwardAmount + _vec3B.x * rightAmount;
    const nextZ = this.camera.position.z + _vec3A.z * forwardAmount + _vec3B.z * rightAmount;

    // Room bounds clamping (6m x 8m interior)
    this.camera.position.x = THREE.MathUtils.clamp(nextX, -2.55, 2.55);
    this.camera.position.z = THREE.MathUtils.clamp(nextZ, -3.45, 3.55);
    this.camera.position.y = 1.62;
  }

  private onResize(): void {
    if (this.disposed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private updatePointer(e: PointerEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private onPointerDown(e: PointerEvent): void {
    this.pointerDownPos = { x: e.clientX, y: e.clientY };
    if (this.navMode === 'walk') {
      this.isDraggingLook = true;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
    }
  }

  private onPointerMove(e: PointerEvent): void {
    if (this.navMode === 'walk' && this.isDraggingLook) {
      const dx = e.clientX - this.lastPointerX;
      const dy = e.clientY - this.lastPointerY;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
      this.walkYaw -= dx * 0.0042;
      this.walkPitch = THREE.MathUtils.clamp(this.walkPitch - dy * 0.0038, -0.75, 0.75);
      return;
    }

    const now = performance.now();
    if (now - this.lastHoverCheck < 55) return;
    this.lastHoverCheck = now;

    this.updatePointer(e);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.stations.clickables, false);
    if (hits.length > 0) {
      const id = hits[0].object.userData.inspectId as InspectableId | undefined;
      this.renderer.domElement.style.cursor = 'pointer';
      this.callbacks.onHoverDevice(id ?? null);
    } else {
      this.renderer.domElement.style.cursor = this.navMode === 'walk' ? 'grab' : 'default';
      this.callbacks.onHoverDevice(null);
    }
  }

  private onPointerUp(e: PointerEvent): void {
    this.isDraggingLook = false;
    const dist = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y);
    if (dist > 6) return; // Dragged camera, not a click

    this.updatePointer(e);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.stations.clickables, false);
    if (hits.length > 0) {
      const id = hits[0].object.userData.inspectId as InspectableId | undefined;
      if (id) {
        this.callbacks.onSelectDevice(id);
      }
    }
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (
      document.activeElement &&
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)
    ) {
      return;
    }
    this.keysPressed[e.code] = true;
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keysPressed[e.code] = false;
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick = (): void => {
    if (this.disposed) return;

    const dt = Math.min(this.clock.getDelta(), 0.08);
    const elapsed = this.clock.elapsedTime;

    // 1. Camera updates (Glide / Orbit / Walk)
    if (this.navMode === 'walk') {
      const speed = 2.4 * dt;
      let fwd = 0;
      let right = 0;
      if (this.keysPressed['KeyW'] || this.keysPressed['ArrowUp']) fwd += 1;
      if (this.keysPressed['KeyS'] || this.keysPressed['ArrowDown']) fwd -= 1;
      if (this.keysPressed['KeyD'] || this.keysPressed['ArrowRight']) right += 1;
      if (this.keysPressed['KeyA'] || this.keysPressed['ArrowLeft']) right -= 1;
      if (fwd !== 0 || right !== 0) {
        this.applyWalkMovement(fwd * speed, right * speed);
      }
      _euler.set(this.walkPitch, this.walkYaw, 0, 'YXZ');
      this.camera.quaternion.setFromEuler(_euler);
    } else {
      if (this.transitionActive) {
        this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, this.targetCamPos.x, 6.5, dt);
        this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, this.targetCamPos.y, 6.5, dt);
        this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, this.targetCamPos.z, 6.5, dt);

        this.controls.target.x = THREE.MathUtils.damp(this.controls.target.x, this.targetLookAt.x, 6.5, dt);
        this.controls.target.y = THREE.MathUtils.damp(this.controls.target.y, this.targetLookAt.y, 6.5, dt);
        this.controls.target.z = THREE.MathUtils.damp(this.controls.target.z, this.targetLookAt.z, 6.5, dt);

        if (
          this.camera.position.distanceTo(this.targetCamPos) < 0.02 &&
          this.controls.target.distanceTo(this.targetLookAt) < 0.02
        ) {
          this.transitionActive = false;
        }
      }
      this.controls.update();
    }

    // 2. Smooth Exploded View Interpolation
    (['microphone', 'mixer', 'amplifier', 'speakerA', 'speakerB'] as const).forEach((key) => {
      const target = this.explodeTargets[key];
      const curr = THREE.MathUtils.damp(this.explodeCurrent[key], target, 7.5, dt);
      this.explodeCurrent[key] = curr;
      const parts: ExplodablePart[] = this.stations.explodables[key];
      for (let i = 0; i < parts.length; i += 1) {
        const p = parts[i];
        p.object.position.set(
          p.basePos.x + p.explodeOffset.x * curr,
          p.basePos.y + p.explodeOffset.y * curr,
          p.basePos.z + p.explodeOffset.z * curr
        );
      }
    });

    // Keep highlight box snapped cleanly to selected object
    if (this.selectedId) {
      this.stations.setHighlightTarget(this.selectedId);
    }

    // 3. Hardware LEDs, Mixer Knobs & VU Meter Updates
    const m = this.latestMixer;
    const t = this.latestTelemetry;
    const active = m.systemPower;

    this.room.beaconLightMat.color.setHex(active ? (this.announcing ? 0x38bdf8 : 0x10b981) : 0x475569);
    this.room.beaconLightMat.emissive.setHex(active ? (this.announcing ? 0x0ea5e9 : 0x059669) : 0x0f172a);
    this.room.beaconLightMat.emissiveIntensity = active ? 1.5 : 0.2;

    this.stations.micLedMat.color.setHex(active && (m.micActive || this.announcing) ? 0xef4444 : 0x38bdf8);
    this.stations.micLedMat.emissive.setHex(active && (m.micActive || this.announcing) ? 0xdc2626 : 0x0284c7);
    this.stations.micLedMat.emissiveIntensity = active ? (m.micActive || this.announcing ? 2.1 : 0.45) : 0.05;

    this.stations.priorityLedMat.emissiveIntensity = active && m.priorityOverride ? 1.2 : 0.12;
    this.stations.ampProtectLedMat.color.setHex(t.thermalWarning || t.overcurrentWarning ? 0xf59e0b : 0x10b981);
    this.stations.ampProtectLedMat.emissive.setHex(t.thermalWarning || t.overcurrentWarning ? 0xd97706 : 0x059669);
    this.stations.ampProtectLedMat.emissiveIntensity = active ? 1.35 : 0.08;

    this.stations.ds18LedMat.emissiveIntensity = active ? 1.2 : 0.1;
    this.stations.acsLedMat.emissiveIntensity = active ? 1.2 : 0.1;
    this.stations.senLedMat.emissiveIntensity = active ? 1.3 : 0.1;

    // Rotate 3D mixer knobs to match slider values
    this.stations.mixerKnobs.gain.rotation.y = ((50 - m.micGain) / 50) * 2.1;
    this.stations.mixerKnobs.master.rotation.y = ((50 - m.masterVolume) / 50) * 2.1;
    this.stations.mixerKnobs.bass.rotation.y = (-m.eqBass / 12) * 1.8;
    this.stations.mixerKnobs.mid.rotation.y = (-m.eqMid / 12) * 1.8;
    this.stations.mixerKnobs.treble.rotation.y = (-m.eqTreble / 12) * 1.8;

    // Update 10-segment VU bar on 3D Mixer
    const levelSegments = active ? Math.round(t.audioRms * 10) : 0;
    for (let i = 0; i < this.stations.vuBars.length; i += 1) {
      const mat = this.stations.vuBars[i].material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = i < levelSegments ? 1.6 : 0.08;
    }

    // 4. Signal Flow Pulses along separated Audio & Sensor conduits
    const audioFlowSpeed = active ? (t.audioRms > 0.04 ? 0.55 : 0.18) : 0;
    for (let i = 0; i < this.room.pulseTracks.length; i += 1) {
      const track = this.room.pulseTracks[i];
      if (track.kind === 'audio') {
        track.mesh.visible = active && t.audioRms > 0.03;
        if (track.mesh.visible) {
          const u = (elapsed * audioFlowSpeed + track.phaseOffset) % 1;
          track.curve.getPointAt(u, _vec3A);
          track.mesh.position.copy(_vec3A);
        }
      } else {
        track.mesh.visible = active;
        if (track.mesh.visible) {
          const u = (elapsed * 0.28 + track.phaseOffset) % 1;
          track.curve.getPointAt(u, _vec3A);
          track.mesh.position.copy(_vec3A);
        }
      }
    }

    // 5. Speaker Acoustic Wave Propagation Rings
    this.wavePhase += dt * (1.8 + t.audioRms * 3.5);
    const updateWaves = (waves: THREE.Mesh[], enabled: boolean) => {
      for (let i = 0; i < waves.length; i += 1) {
        const w = waves[i];
        const mat = w.material as THREE.MeshBasicMaterial;
        if (!active || !enabled || t.audioRms < 0.04) {
          mat.opacity = 0;
          continue;
        }
        const phase = (this.wavePhase + i * 0.33) % 1;
        const scale = 0.7 + phase * 1.6;
        w.scale.set(scale, scale, 1);
        w.position.z = 0.2 + phase * 0.95;
        mat.opacity = (1 - phase) * Math.min(0.65, 0.2 + t.audioRms * 0.6);
      }
    };
    updateWaves(this.stations.speakerWavesA, m.zoneA);
    updateWaves(this.stations.speakerWavesB, m.zoneB);

    // 6. Refresh 3D Monitoring PC & ESP32 OLED CanvasTextures (~8 Hz)
    if (elapsed - this.lastCanvasRefresh > 0.12) {
      this.lastCanvasRefresh = elapsed;
      updateMonitoringCanvas(this.textures, this.latestTelemetry, this.latestMixer, this.announcing);
    }

    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('resize', this.handleResizeBound);
    window.removeEventListener('keydown', this.handleKeyDownBound);
    window.removeEventListener('keyup', this.handleKeyUpBound);

    const dom = this.renderer.domElement;
    dom.removeEventListener('pointerdown', this.handlePointerDownBound);
    dom.removeEventListener('pointermove', this.handlePointerMoveBound);
    dom.removeEventListener('pointerup', this.handlePointerUpBound);
    dom.removeEventListener('webglcontextlost', this.handleContextLostBound);
    dom.removeEventListener('webglcontextrestored', this.handleContextRestoredBound);

    this.controls.dispose();
    this.textures.dispose();

    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });

    this.renderer.dispose();
    if (dom.parentNode === this.container) {
      this.container.removeChild(dom);
    }
  }
}
