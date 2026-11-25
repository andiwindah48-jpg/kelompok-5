import * as THREE from 'three';
import { RoomTextureSet } from '../textures';

export interface SignalPulseTrack {
  curve: THREE.CatmullRomCurve3;
  kind: 'audio' | 'sensor';
  mesh: THREE.Mesh;
  phaseOffset: number;
}

export interface BuiltRoom {
  group: THREE.Group;
  beaconLightMat: THREE.MeshStandardMaterial;
  acFanGroup: THREE.Group;
  pulseTracks: SignalPulseTrack[];
}

export function buildRoom(textures: RoomTextureSet): BuiltRoom {
  const group = new THREE.Group();
  group.name = 'PAS_Control_Room';

  const W = 6.0; // X: -3.0 to +3.0
  const D = 8.0; // Z: -4.0 to +4.0
  const H = 3.2; // Y: 0 to 3.2

  // Materials
  const floorMat = new THREE.MeshStandardMaterial({
    map: textures.floorMap,
    roughness: 0.62,
    metalness: 0.14,
  });

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x1a2230,
    roughness: 0.82,
    metalness: 0.08,
  });

  const lowerWallMat = new THREE.MeshStandardMaterial({
    color: 0x121824,
    roughness: 0.72,
    metalness: 0.15,
  });

  const ceilingMat = new THREE.MeshStandardMaterial({
    color: 0x101622,
    roughness: 0.88,
    metalness: 0.06,
  });

  const acousticMat = new THREE.MeshStandardMaterial({
    map: textures.acousticWallMap,
    roughness: 0.92,
    metalness: 0.04,
  });

  const trimMetalMat = new THREE.MeshStandardMaterial({
    color: 0x3b475c,
    roughness: 0.35,
    metalness: 0.82,
  });

  // Floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  // Ceiling
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(W, D), ceilingMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = H;
  group.add(ceiling);

  // Walls (Front, Back, Left, Right)
  const frontWall = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.12), wallMat);
  frontWall.position.set(0, H / 2, -D / 2 - 0.06);
  frontWall.receiveShadow = true;
  group.add(frontWall);

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.12), wallMat);
  backWall.position.set(0, H / 2, D / 2 + 0.06);
  backWall.receiveShadow = true;
  group.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.12, H, D), wallMat);
  leftWall.position.set(-W / 2 - 0.06, H / 2, 0);
  leftWall.receiveShadow = true;
  group.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.12, H, D), wallMat);
  rightWall.position.set(W / 2 + 0.06, H / 2, 0);
  rightWall.receiveShadow = true;
  group.add(rightWall);

  // Dado / Wainscoting bands along walls (offset 0.015 from wall face)
  const dadoBack = new THREE.Mesh(new THREE.BoxGeometry(W, 0.95, 0.03), lowerWallMat);
  dadoBack.position.set(0, 0.475, -D / 2 + 0.015);
  group.add(dadoBack);

  const dadoLeft = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.95, D), lowerWallMat);
  dadoLeft.position.set(-W / 2 + 0.015, 0.475, 0);
  group.add(dadoLeft);

  const dadoRight = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.95, D), lowerWallMat);
  dadoRight.position.set(W / 2 - 0.015, 0.475, 0);
  group.add(dadoRight);

  // Front Wall Signage Plaque ("PUBLIC ADDRESS SYSTEM CONTROL & SIMULATION ROOM")
  const signFrame = new THREE.Mesh(new THREE.BoxGeometry(3.12, 0.82, 0.04), trimMetalMat);
  signFrame.position.set(0, 2.55, -D / 2 + 0.02);
  group.add(signFrame);

  const signFace = new THREE.Mesh(
    new THREE.PlaneGeometry(3.04, 0.74),
    new THREE.MeshStandardMaterial({
      map: textures.signageMap,
      roughness: 0.35,
      metalness: 0.1,
      emissive: 0x0c1e32,
      emissiveIntensity: 0.45,
    })
  );
  signFace.position.set(0, 2.55, -D / 2 + 0.042);
  group.add(signFace);

  // Acoustic Absorber Panels on Front Wall (flanking speakers) and Side Walls
  const frontAcousticPositions = [-2.35, 0, 2.35];
  frontAcousticPositions.forEach((px) => {
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.35, 0.05), acousticMat);
    panel.position.set(px, 1.45, -D / 2 + 0.03);
    panel.castShadow = true;
    panel.receiveShadow = true;
    group.add(panel);
  });

  [-2.2, -0.6, 1.0].forEach((pz) => {
    const panelL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.35, 1.1), acousticMat);
    panelL.position.set(-W / 2 + 0.03, 1.75, pz);
    group.add(panelL);

    const panelR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.35, 1.1), acousticMat);
    panelR.position.set(W / 2 - 0.03, 1.75, pz);
    group.add(panelR);
  });

  // Ceiling LED Light Panels (4 architectural studio light strips)
  const ledPanelMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    emissive: 0xe0f2fe,
    emissiveIntensity: 1.35,
    roughness: 0.2,
  });
  [
    [-1.4, -2.0],
    [1.4, -2.0],
    [-1.4, 1.3],
    [1.4, 1.3],
  ].forEach(([lx, lz]) => {
    const housing = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.05, 0.36), trimMetalMat);
    housing.position.set(lx, H - 0.025, lz);
    group.add(housing);

    const diffuser = new THREE.Mesh(new THREE.PlaneGeometry(1.06, 0.28), ledPanelMat);
    diffuser.rotation.x = Math.PI / 2;
    diffuser.position.set(lx, H - 0.052, lz);
    group.add(diffuser);
  });

  // Access Door on Back Wall (Z = +4.0, X = -1.9) + Keycard Reader + Status Beacon
  const doorGroup = new THREE.Group();
  doorGroup.position.set(-1.9, 0, D / 2 - 0.02);
  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.12, 2.25, 0.08), trimMetalMat);
  doorFrame.position.set(0, 1.125, 0);
  doorGroup.add(doorFrame);

  const doorLeaf = new THREE.Mesh(
    new THREE.BoxGeometry(0.98, 2.15, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x263142, roughness: 0.55, metalness: 0.25 })
  );
  doorLeaf.position.set(0, 1.075, -0.02);
  doorGroup.add(doorLeaf);

  // Door glass vision panel
  const doorGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.65, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.32 })
  );
  doorGlass.position.set(0.22, 1.48, -0.02);
  doorGroup.add(doorGlass);

  // Door handle
  const doorHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.18, 12), trimMetalMat);
  doorHandle.rotation.z = Math.PI / 2;
  doorHandle.position.set(0.36, 1.02, -0.07);
  doorGroup.add(doorHandle);

  // Keycard Access Pad
  const keycardPad = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.15, 0.03),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4, metalness: 0.5 })
  );
  keycardPad.position.set(0.68, 1.25, -0.02);
  doorGroup.add(keycardPad);

  // System Indicator Beacon above door
  const beaconBase = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.04, 16), trimMetalMat);
  beaconBase.rotation.x = Math.PI / 2;
  beaconBase.position.set(0, 2.42, -0.03);
  doorGroup.add(beaconBase);

  const beaconLightMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x10b981,
    emissiveIntensity: 1.5,
    roughness: 0.2,
  });
  const beaconDome = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), beaconLightMat);
  beaconDome.position.set(0, 2.42, -0.06);
  doorGroup.add(beaconDome);
  group.add(doorGroup);

  // Electrical Distribution Panel (Left Wall, X = -2.92, Z = 2.15)
  const panelGroup = new THREE.Group();
  panelGroup.position.set(-W / 2 + 0.08, 1.45, 2.15);
  const panelBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.85, 0.56),
    new THREE.MeshStandardMaterial({ color: 0x2c3647, roughness: 0.45, metalness: 0.65 })
  );
  panelBox.castShadow = true;
  panelGroup.add(panelBox);
  const breakerStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 0.42, 0.36),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.2 })
  );
  breakerStrip.position.set(0.085, 0.02, 0);
  panelGroup.add(breakerStrip);
  const panelWarning = new THREE.Mesh(
    new THREE.BoxGeometry(0.015, 0.08, 0.14),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0x78350f, emissiveIntensity: 0.5, roughness: 0.3 })
  );
  panelWarning.position.set(0.085, 0.3, 0);
  panelGroup.add(panelWarning);
  group.add(panelGroup);

  // AC / Ventilation Unit (Right Wall Upper, X = +2.84, Y = 2.68, Z = -0.3)
  const acGroup = new THREE.Group();
  acGroup.position.set(W / 2 - 0.14, 2.68, -0.3);
  const acBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.34, 1.25),
    new THREE.MeshStandardMaterial({ color: 0xdbe4f0, roughness: 0.42, metalness: 0.18 })
  );
  acBody.castShadow = true;
  acGroup.add(acBody);
  const acVent = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.08, 1.08),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 })
  );
  acVent.position.set(-0.14, -0.09, 0);
  acGroup.add(acVent);

  const acFanGroup = new THREE.Group();
  acFanGroup.position.set(-0.15, 0.04, 0.45);
  const fanLed = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 0.025, 0.07),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 1.4 })
  );
  acFanGroup.add(fanLed);
  acGroup.add(acFanGroup);
  group.add(acGroup);

  // Cable Trays (Overhead Steel Ladder Trays for Separated Audio, Power, Sensor Routing)
  const trayMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.78 });
  const trayFront = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.03, 0.22), trayMat);
  trayFront.position.set(0.2, 2.86, -1.65);
  group.add(trayFront);

  const traySpine = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 3.6), trayMat);
  traySpine.position.set(1.75, 2.86, -0.05);
  group.add(traySpine);

  // Separated Color-Coded Conduit Tubes & Curves
  const audioCurve1 = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.45, 0.74, 1.35), // Mic station
    new THREE.Vector3(-1.45, 0.18, 1.35),
    new THREE.Vector3(-0.75, 0.14, 0.45),
    new THREE.Vector3(-0.25, 0.74, -0.35), // Mixer station
  ]);
  const audioCurve2 = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.05, 0.84, -0.35), // Mixer out
    new THREE.Vector3(0.85, 0.25, -0.45),
    new THREE.Vector3(1.55, 0.96, -0.45), // Power Amplifier in
  ]);
  const audioCurve3A = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.75, 1.15, -0.48), // Amp 100V out
    new THREE.Vector3(1.75, 2.86, -0.48),
    new THREE.Vector3(1.75, 2.86, -1.65),
    new THREE.Vector3(-1.35, 2.86, -1.65),
    new THREE.Vector3(-1.35, 2.32, -3.72), // Speaker A
  ]);
  const audioCurve3B = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.75, 2.86, -1.65),
    new THREE.Vector3(1.35, 2.86, -1.65),
    new THREE.Vector3(1.35, 2.32, -3.72), // Speaker B
  ]);

  const powerCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.85, 1.05, 2.15), // Electrical panel
    new THREE.Vector3(-2.85, 0.08, 2.15),
    new THREE.Vector3(-2.85, 0.08, -1.1),
    new THREE.Vector3(1.75, 0.08, -1.1),
    new THREE.Vector3(1.75, 0.75, -0.55), // Amplifier rack power
  ]);

  const sensorCurve1 = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.86, 1.06, -0.45), // DS18B20 + ACS758 on amp
    new THREE.Vector3(2.25, 0.22, -0.45),
    new THREE.Vector3(2.25, 0.22, 1.45),
    new THREE.Vector3(1.85, 0.82, 1.45), // ESP32 at monitoring desk
  ]);
  const sensorCurve2 = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.0, 0.05, -2.55), // SEN0232 stand base (1m in front of speakers)
    new THREE.Vector3(2.38, 0.05, -2.55),
    new THREE.Vector3(2.38, 0.05, 1.45),
    new THREE.Vector3(1.85, 0.82, 1.45), // ESP32
  ]);

  const audioTubeMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    emissive: 0x0369a1,
    emissiveIntensity: 0.35,
    roughness: 0.4,
    metalness: 0.2,
  });
  const powerTubeMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    emissive: 0x78350f,
    emissiveIntensity: 0.25,
    roughness: 0.45,
    metalness: 0.2,
  });
  const sensorTubeMat = new THREE.MeshStandardMaterial({
    color: 0x059669,
    emissive: 0x064e3b,
    emissiveIntensity: 0.3,
    roughness: 0.42,
    metalness: 0.2,
  });

  [audioCurve1, audioCurve2, audioCurve3A, audioCurve3B].forEach((curve) => {
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 36, 0.014, 8, false), audioTubeMat);
    group.add(tube);
  });
  group.add(new THREE.Mesh(new THREE.TubeGeometry(powerCurve, 36, 0.018, 8, false), powerTubeMat));
  [sensorCurve1, sensorCurve2].forEach((curve) => {
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.011, 8, false), sensorTubeMat);
    group.add(tube);
  });

  // Animated Signal Pulse Spheres along Audio and Sensor paths
  const pulseTracks: SignalPulseTrack[] = [];
  const audioPulseMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const sensorPulseMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
  const pulseGeo = new THREE.SphereGeometry(0.028, 10, 10);

  [audioCurve1, audioCurve2, audioCurve3A, audioCurve3B].forEach((curve, idx) => {
    const m = new THREE.Mesh(pulseGeo, audioPulseMat);
    group.add(m);
    pulseTracks.push({ curve, kind: 'audio', mesh: m, phaseOffset: idx * 0.23 });
  });

  [sensorCurve1, sensorCurve2].forEach((curve, idx) => {
    const m = new THREE.Mesh(pulseGeo, sensorPulseMat);
    group.add(m);
    pulseTracks.push({ curve, kind: 'sensor', mesh: m, phaseOffset: idx * 0.45 });
  });

  return { group, beaconLightMat, acFanGroup, pulseTracks };
}
