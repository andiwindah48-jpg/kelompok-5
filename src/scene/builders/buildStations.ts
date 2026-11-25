import * as THREE from 'three';
import { InspectableId } from '../../types/pas';
import { RoomTextureSet } from '../textures';

export interface ExplodablePart {
  object: THREE.Object3D;
  basePos: THREE.Vector3;
  explodeOffset: THREE.Vector3;
}

export interface BuiltStations {
  group: THREE.Group;
  clickables: THREE.Object3D[];
  explodables: Record<'microphone' | 'mixer' | 'amplifier' | 'speakerA' | 'speakerB', ExplodablePart[]>;
  micLedMat: THREE.MeshStandardMaterial;
  priorityLedMat: THREE.MeshStandardMaterial;
  ampProtectLedMat: THREE.MeshStandardMaterial;
  ds18LedMat: THREE.MeshStandardMaterial;
  acsLedMat: THREE.MeshStandardMaterial;
  senLedMat: THREE.MeshStandardMaterial;
  vuBars: THREE.Mesh[];
  speakerWavesA: THREE.Mesh[];
  speakerWavesB: THREE.Mesh[];
  mixerKnobs: {
    gain: THREE.Object3D;
    bass: THREE.Object3D;
    mid: THREE.Object3D;
    treble: THREE.Object3D;
    master: THREE.Object3D;
  };
  highlightBox: THREE.LineSegments;
  setHighlightTarget: (id: InspectableId | null) => void;
}

function addContactShadow(
  parent: THREE.Group,
  textures: RoomTextureSet,
  w: number,
  d: number,
  x: number,
  z: number
): void {
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({
      map: textures.contactShadowMap,
      transparent: true,
      depthWrite: false,
      opacity: 0.52,
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(x, 0.008, z);
  parent.add(shadow);
}

function registerClickable(
  clickables: THREE.Object3D[],
  proxyParent: THREE.Object3D,
  inspectId: InspectableId,
  size: [number, number, number],
  offset: [number, number, number]
): THREE.Mesh {
  const proxy = new THREE.Mesh(
    new THREE.BoxGeometry(size[0], size[1], size[2]),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  proxy.position.set(offset[0], offset[1], offset[2]);
  proxy.layers.set(1);
  proxy.userData.inspectId = inspectId;
  proxyParent.add(proxy);
  clickables.push(proxy);
  return proxy;
}

function buildDesk(w: number, d: number, h: number, topMat: THREE.Material, frameMat: THREE.Material): THREE.Group {
  const desk = new THREE.Group();
  const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.045, d), topMat);
  top.position.y = h - 0.0225;
  top.castShadow = true;
  top.receiveShadow = true;
  desk.add(top);

  const legGeo = new THREE.BoxGeometry(0.055, h - 0.045, 0.055);
  const lx = w / 2 - 0.07;
  const lz = d / 2 - 0.07;
  [
    [-lx, -lz],
    [lx, -lz],
    [-lx, lz],
    [lx, lz],
  ].forEach(([x, z]) => {
    const leg = new THREE.Mesh(legGeo, frameMat);
    leg.position.set(x, (h - 0.045) / 2, z);
    leg.castShadow = true;
    desk.add(leg);
  });

  const modesty = new THREE.Mesh(new THREE.BoxGeometry(w - 0.16, 0.28, 0.02), frameMat);
  modesty.position.set(0, h - 0.22, -d / 2 + 0.08);
  desk.add(modesty);
  return desk;
}

export function buildStations(textures: RoomTextureSet): BuiltStations {
  const group = new THREE.Group();
  group.name = 'PAS_Stations';

  const clickables: THREE.Object3D[] = [];
  const proxyMap = new Map<InspectableId, THREE.Mesh>();

  const explodables: BuiltStations['explodables'] = {
    microphone: [],
    mixer: [],
    amplifier: [],
    speakerA: [],
    speakerB: [],
  };

  // Shared PBR Materials
  const deskTopMat = new THREE.MeshStandardMaterial({
    color: 0x222b3a,
    roughness: 0.58,
    metalness: 0.12,
  });
  const frameSteelMat = new THREE.MeshStandardMaterial({
    color: 0x3b475c,
    roughness: 0.35,
    metalness: 0.85,
  });
  const brushedAluminumMat = new THREE.MeshStandardMaterial({
    map: textures.brushedMetalMap,
    color: 0xb8c4d4,
    roughness: 0.24,
    metalness: 0.88,
  });
  const darkAnodizedMat = new THREE.MeshStandardMaterial({
    color: 0x18202c,
    roughness: 0.38,
    metalness: 0.72,
  });
  const pcbGreenMat = new THREE.MeshStandardMaterial({
    color: 0x0d6e4c,
    roughness: 0.45,
    metalness: 0.18,
  });
  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xd97742,
    roughness: 0.22,
    metalness: 0.94,
  });
  const goldPinMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.2,
    metalness: 0.95,
  });

  // ============================================================================
  // AREA 1: MICROPHONE STATION (-1.45, 0, 1.35)
  // ============================================================================
  const area1 = new THREE.Group();
  area1.position.set(-1.45, 0, 1.35);
  area1.rotation.y = Math.PI * 0.18;
  group.add(area1);

  addContactShadow(group, textures, 1.5, 1.1, -1.45, 1.35);
  area1.add(buildDesk(1.15, 0.72, 0.76, deskTopMat, frameSteelMat));

  // Operator Chair behind desk
  const chair = new THREE.Group();
  chair.position.set(0, 0, 0.62);
  const chairBase = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.05, 12), frameSteelMat);
  chairBase.position.y = 0.05;
  chair.add(chairBase);
  const chairStem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 10), frameSteelMat);
  chairStem.position.y = 0.25;
  chair.add(chairStem);
  const chairSeat = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.07, 0.44),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85, metalness: 0.05 })
  );
  chairSeat.position.y = 0.46;
  chair.add(chairSeat);
  const chairBack = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.48, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85, metalness: 0.05 })
  );
  chairBack.position.set(0, 0.72, 0.2);
  chair.add(chairBack);
  area1.add(chair);

  // Gooseneck Paging Microphone (10-part composite assembly)
  const micGroup = new THREE.Group();
  micGroup.position.set(0, 0.76, 0.04);
  area1.add(micGroup);

  const micBase = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.045, 0.22), darkAnodizedMat);
  micBase.position.y = 0.0225;
  micBase.castShadow = true;
  micGroup.add(micBase);

  const micTopCover = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.015, 0.2), brushedAluminumMat);
  micTopCover.position.y = 0.05;
  micGroup.add(micTopCover);
  explodables.microphone.push({
    object: micTopCover,
    basePos: micTopCover.position.clone(),
    explodeOffset: new THREE.Vector3(0, 0.14, 0.12),
  });

  // Internal FET Pre-Amp PCB inside mic base
  const micPcb = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.012, 0.14), pcbGreenMat);
  micPcb.position.set(0, 0.025, 0);
  micGroup.add(micPcb);
  explodables.microphone.push({
    object: micPcb,
    basePos: micPcb.position.clone(),
    explodeOffset: new THREE.Vector3(0, 0.08, 0),
  });

  // PTT Talk Switch + LED Indicator Ring
  const pttButton = new THREE.Mesh(
    new THREE.BoxGeometry(0.055, 0.016, 0.035),
    new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.35, metalness: 0.4 })
  );
  pttButton.position.set(0, 0.06, 0.06);
  micGroup.add(pttButton);

  const micLedMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.4,
    roughness: 0.2,
  });
  const micLedBar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.008, 0.012), micLedMat);
  micLedBar.position.set(0, 0.06, 0.025);
  micGroup.add(micLedBar);

  // XLR 3-Pin Connector at rear of mic base
  const xlrHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.04, 14), brushedAluminumMat);
  xlrHousing.rotation.x = Math.PI / 2;
  xlrHousing.position.set(0, 0.025, -0.125);
  micGroup.add(xlrHousing);
  explodables.microphone.push({
    object: xlrHousing,
    basePos: xlrHousing.position.clone(),
    explodeOffset: new THREE.Vector3(0, 0, -0.12),
  });

  // Gooseneck curved stem
  const neckCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.055, -0.05),
    new THREE.Vector3(0, 0.22, -0.06),
    new THREE.Vector3(0, 0.36, -0.01),
    new THREE.Vector3(0, 0.42, 0.07),
  ]);
  const gooseneck = new THREE.Mesh(new THREE.TubeGeometry(neckCurve, 24, 0.008, 10, false), darkAnodizedMat);
  gooseneck.castShadow = true;
  micGroup.add(gooseneck);

  // Condenser Capsule + Grille + Internal Diaphragm
  const micCapInner = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.03, 14), goldPinMat);
  micCapInner.rotation.x = Math.PI / 3;
  micCapInner.position.set(0, 0.43, 0.09);
  micGroup.add(micCapInner);
  explodables.microphone.push({
    object: micCapInner,
    basePos: micCapInner.position.clone(),
    explodeOffset: new THREE.Vector3(0, 0.08, 0.06),
  });

  const micGrille = new THREE.Mesh(
    new THREE.SphereGeometry(0.022, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.7, metalness: 0.4, wireframe: false })
  );
  micGrille.scale.set(1, 1.3, 1);
  micGrille.rotation.x = Math.PI / 3;
  micGrille.position.set(0, 0.44, 0.11);
  micGroup.add(micGrille);
  explodables.microphone.push({
    object: micGrille,
    basePos: micGrille.position.clone(),
    explodeOffset: new THREE.Vector3(0, 0.16, 0.14),
  });

  proxyMap.set('microphone', registerClickable(clickables, area1, 'microphone', [0.55, 0.65, 0.55], [0, 1.02, 0.05]));

  // ============================================================================
  // AREA 2: MIXER & PRE-AMPLIFIER STATION (-0.25, 0, -0.35)
  // ============================================================================
  const area2 = new THREE.Group();
  area2.position.set(-0.25, 0, -0.35);
  group.add(area2);

  addContactShadow(group, textures, 1.6, 1.0, -0.25, -0.35);
  area2.add(buildDesk(1.35, 0.78, 0.76, deskTopMat, frameSteelMat));

  const mixerGroup = new THREE.Group();
  mixerGroup.position.set(0, 0.76, 0.02);
  area2.add(mixerGroup);

  const mixerChassis = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.09, 0.44), darkAnodizedMat);
  mixerChassis.position.y = 0.045;
  mixerChassis.castShadow = true;
  mixerGroup.add(mixerChassis);

  // Internal Mixer PCBs (Pre-Amp, Tone Control EQ, Priority Relay, Output Buffer)
  const preampPcb = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.015, 0.34), pcbGreenMat);
  preampPcb.position.set(-0.18, 0.05, 0);
  mixerGroup.add(preampPcb);
  explodables.mixer.push({
    object: preampPcb,
    basePos: preampPcb.position.clone(),
    explodeOffset: new THREE.Vector3(-0.08, 0.12, 0),
  });

  const bufferPcb = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.015, 0.34), pcbGreenMat);
  bufferPcb.position.set(0.18, 0.05, 0);
  mixerGroup.add(bufferPcb);
  explodables.mixer.push({
    object: bufferPcb,
    basePos: bufferPcb.position.clone(),
    explodeOffset: new THREE.Vector3(0.08, 0.12, 0),
  });

  // Top Faceplate Assembly (Explodes upward to reveal internal Op-Amp/EQ boards)
  const mixerFaceplateGroup = new THREE.Group();
  mixerFaceplateGroup.position.y = 0.095;
  mixerGroup.add(mixerFaceplateGroup);
  explodables.mixer.push({
    object: mixerFaceplateGroup,
    basePos: mixerFaceplateGroup.position.clone(),
    explodeOffset: new THREE.Vector3(0, 0.26, 0.08),
  });

  const facePlate = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.014, 0.42), brushedAluminumMat);
  mixerFaceplateGroup.add(facePlate);

  // Rotary Knobs for Gain, Bass, Mid, Treble, Master
  const makeKnob = (x: number, z: number, capColor: number) => {
    const kGroup = new THREE.Group();
    kGroup.position.set(x, 0.016, z);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.024, 16), darkAnodizedMat);
    kGroup.add(body);
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.006, 16),
      new THREE.MeshStandardMaterial({ color: capColor, roughness: 0.35, metalness: 0.2 })
    );
    cap.position.y = 0.013;
    kGroup.add(cap);
    const pointer = new THREE.Mesh(
      new THREE.BoxGeometry(0.004, 0.008, 0.014),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, emissive: 0x38bdf8, emissiveIntensity: 0.3 })
    );
    pointer.position.set(0, 0.015, -0.008);
    kGroup.add(pointer);
    mixerFaceplateGroup.add(kGroup);
    return kGroup;
  };

  const knobGain = makeKnob(-0.24, -0.08, 0x0ea5e9);
  const knobBass = makeKnob(-0.1, -0.08, 0x64748b);
  const knobMid = makeKnob(0.02, -0.08, 0x64748b);
  const knobTreble = makeKnob(0.14, -0.08, 0x64748b);
  const knobMaster = makeKnob(0.26, 0.06, 0xf59e0b);

  // Priority Override illuminated switch
  const priorityLedMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.9,
    roughness: 0.2,
  });
  const prioritySwitch = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.016, 0.04), priorityLedMat);
  prioritySwitch.position.set(-0.24, 0.014, 0.1);
  mixerFaceplateGroup.add(prioritySwitch);

  // LED VU Meter Array (10 discrete segments)
  const vuBars: THREE.Mesh[] = [];
  for (let i = 0; i < 10; i += 1) {
    const segColor = i < 6 ? 0x10b981 : i < 8 ? 0xf59e0b : 0xef4444;
    const segMat = new THREE.MeshStandardMaterial({
      color: segColor,
      emissive: segColor,
      emissiveIntensity: 0.15,
      roughness: 0.3,
    });
    const seg = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.008, 0.024), segMat);
    seg.position.set(-0.08 + i * 0.022, 0.012, 0.1);
    mixerFaceplateGroup.add(seg);
    vuBars.push(seg);
  }

  proxyMap.set('mixer', registerClickable(clickables, area2, 'mixer', [0.85, 0.45, 0.55], [0, 0.92, 0.02]));

  // ============================================================================
  // AREA 3: POWER AMPLIFIER STATION & EQUIPMENT RACK (1.75, 0, -0.45)
  // ============================================================================
  const area3 = new THREE.Group();
  area3.position.set(1.75, 0, -0.45);
  area3.rotation.y = -Math.PI * 0.12;
  group.add(area3);

  addContactShadow(group, textures, 1.15, 1.05, 1.75, -0.45);

  // 19-inch Equipment Rack Frame
  const rackW = 0.72;
  const rackH = 1.85;
  const rackD = 0.68;
  const rackPostGeo = new THREE.BoxGeometry(0.05, rackH, 0.05);
  [
    [-rackW / 2 + 0.025, -rackD / 2 + 0.025],
    [rackW / 2 - 0.025, -rackD / 2 + 0.025],
    [-rackW / 2 + 0.025, rackD / 2 - 0.025],
    [rackW / 2 - 0.025, rackD / 2 - 0.025],
  ].forEach(([px, pz]) => {
    const post = new THREE.Mesh(rackPostGeo, frameSteelMat);
    post.position.set(px, rackH / 2, pz);
    post.castShadow = true;
    area3.add(post);
  });

  const rackTop = new THREE.Mesh(new THREE.BoxGeometry(rackW, 0.04, rackD), darkAnodizedMat);
  rackTop.position.y = rackH - 0.02;
  area3.add(rackTop);
  const rackBottom = new THREE.Mesh(new THREE.BoxGeometry(rackW, 0.06, rackD), darkAnodizedMat);
  rackBottom.position.y = 0.03;
  area3.add(rackBottom);

  // Lower Rack Patch / Power Conditioner Unit
  const lowerUnit = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.32, 0.54), darkAnodizedMat);
  lowerUnit.position.set(0, 0.34, 0);
  area3.add(lowerUnit);

  // Upper Rack Zone Matrix Unit
  const upperUnit = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.24, 0.54), darkAnodizedMat);
  upperUnit.position.set(0, 1.48, 0);
  area3.add(upperUnit);

  // HERO DEVICE: Power Amplifier (Center bay y = 0.85..1.18)
  const ampGroup = new THREE.Group();
  ampGroup.position.set(0, 0.85, 0);
  area3.add(ampGroup);

  const ampTray = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.03, 0.56), darkAnodizedMat);
  ampTray.position.y = 0.015;
  ampGroup.add(ampTray);

  // Front Brushed Aluminum Faceplate (slides forward on explode)
  const ampFace = new THREE.Group();
  ampFace.position.set(0, 0.14, 0.28);
  const ampPlate = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.24, 0.025), brushedAluminumMat);
  ampFace.add(ampPlate);
  const ampProtectLedMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x10b981,
    emissiveIntensity: 1.2,
  });
  const ampLed = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 10), ampProtectLedMat);
  ampLed.position.set(-0.22, 0.04, 0.016);
  ampFace.add(ampLed);
  ampGroup.add(ampFace);
  explodables.amplifier.push({
    object: ampFace,
    basePos: ampFace.position.clone(),
    explodeOffset: new THREE.Vector3(0, 0, 0.32),
  });

  // Top Ventilated Cover (lifts up on explode)
  const ampCover = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.02, 0.54), darkAnodizedMat);
  ampCover.position.set(0, 0.26, 0);
  ampGroup.add(ampCover);
  explodables.amplifier.push({
    object: ampCover,
    basePos: ampCover.position.clone(),
    explodeOffset: new THREE.Vector3(0, 0.28, 0),
  });

  // 1. Toroidal Power Transformer + Filter Capacitors
  const toroid = new THREE.Group();
  toroid.position.set(-0.15, 0.1, 0.06);
  const toroidCore = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.09, 24), copperMat);
  toroid.add(toroidCore);
  const toroidCap = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.095, 16), darkAnodizedMat);
  toroid.add(toroidCap);
  [-0.12, -0.05].forEach((cx) => {
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.09, 14),
      new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.35, metalness: 0.3 })
    );
    cap.position.set(cx + 0.08, 0, -0.14);
    toroid.add(cap);
  });
  ampGroup.add(toroid);
  explodables.amplifier.push({
    object: toroid,
    basePos: toroid.position.clone(),
    explodeOffset: new THREE.Vector3(-0.22, 0.08, 0.12),
  });

  // 2. Extruded Aluminum Heatsink + MOSFET Transistor Bank
  const heatsinkGroup = new THREE.Group();
  heatsinkGroup.position.set(0.16, 0.12, 0.02);
  const hsBase = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.32), brushedAluminumMat);
  heatsinkGroup.add(hsBase);
  for (let f = -4; f <= 4; f += 1) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.16, 0.32), brushedAluminumMat);
    fin.position.set(0.075, 0, 0);
    fin.position.x = f * 0.015;
    fin.position.y = 0.02;
    heatsinkGroup.add(fin);
  }
  for (let m = 0; m < 4; m += 1) {
    const mosfet = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.04, 0.03), darkAnodizedMat);
    mosfet.position.set(-0.078, 0, -0.1 + m * 0.065);
    heatsinkGroup.add(mosfet);
  }
  ampGroup.add(heatsinkGroup);
  explodables.amplifier.push({
    object: heatsinkGroup,
    basePos: heatsinkGroup.position.clone(),
    explodeOffset: new THREE.Vector3(0.24, 0.1, 0),
  });

  // 3. Protection Circuit PCB & 100V Output Transformer
  const ampOutputStage = new THREE.Group();
  ampOutputStage.position.set(0.02, 0.09, -0.17);
  const protPcb = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.016, 0.14), pcbGreenMat);
  ampOutputStage.add(protPcb);
  const outTrafo = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.11), frameSteelMat);
  outTrafo.position.set(-0.14, 0.04, 0);
  ampOutputStage.add(outTrafo);
  ampGroup.add(ampOutputStage);
  explodables.amplifier.push({
    object: ampOutputStage,
    basePos: ampOutputStage.position.clone(),
    explodeOffset: new THREE.Vector3(0, 0.14, -0.22),
  });

  proxyMap.set('amplifier', registerClickable(clickables, area3, 'amplifier', [0.72, 0.42, 0.68], [0, 0.99, 0]));

  // SENSOR 1: DS18B20 Temperature Sensor (Mounted directly on Amplifier Heatsink)
  const ds18Group = new THREE.Group();
  ds18Group.position.set(0.24, 1.02, 0.12);
  area3.add(ds18Group);
  const dsProbe = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 12), brushedAluminumMat);
  dsProbe.rotation.z = Math.PI / 2;
  ds18Group.add(dsProbe);
  const dsModule = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.03), pcbGreenMat);
  dsModule.position.set(0.05, 0, 0);
  ds18Group.add(dsModule);
  const ds18LedMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8, emissiveIntensity: 1.3 });
  const dsLed = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 8), ds18LedMat);
  dsLed.position.set(0.06, 0.022, 0.012);
  ds18Group.add(dsLed);
  proxyMap.set('ds18b20', registerClickable(clickables, area3, 'ds18b20', [0.22, 0.22, 0.22], [0.26, 1.02, 0.12]));

  // SENSOR 2: ACS758 Current Sensor (Mounted on Amplifier DC Supply Rail)
  const acsGroup = new THREE.Group();
  acsGroup.position.set(-0.24, 0.86, 0.22);
  area3.add(acsGroup);
  const acsBoard = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.045), pcbGreenMat);
  acsGroup.add(acsBoard);
  const acsBusbar = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.014, 0.02), copperMat);
  acsBusbar.position.set(0, 0.01, 0.02);
  acsGroup.add(acsBusbar);
  const acsLedMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 1.3 });
  const acsLed = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 8), acsLedMat);
  acsLed.position.set(0.015, 0.025, 0.02);
  acsGroup.add(acsLed);
  proxyMap.set('acs758', registerClickable(clickables, area3, 'acs758', [0.22, 0.22, 0.22], [-0.24, 0.86, 0.22]));

  // ============================================================================
  // AREA 4: SPEAKER STATION (Front Wall Z = -3.72) & SEN0232 (1m in front)
  // ============================================================================
  const buildSpeakerUnit = (
    x: number,
    y: number,
    z: number,
    id: 'speakerA' | 'speakerB',
    wavesOut: THREE.Mesh[]
  ) => {
    const spk = new THREE.Group();
    spk.position.set(x, y, z);
    spk.rotation.x = 0.18; // Angled slightly downward toward listener & SEN0232
    group.add(spk);

    // Enclosure Cabinet
    const cab = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.56, 0.24), darkAnodizedMat);
    cab.position.z = -0.12;
    cab.castShadow = true;
    spk.add(cab);

    // 1. 100V Matching Transformer (rear inside cabinet)
    const matchTrafo = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.09), frameSteelMat);
    matchTrafo.position.set(0.14, -0.12, -0.05);
    spk.add(matchTrafo);
    explodables[id].push({
      object: matchTrafo,
      basePos: matchTrafo.position.clone(),
      explodeOffset: new THREE.Vector3(0.12, 0, 0.12),
    });

    // 2. Permanent Magnet & Yoke
    const magnet = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.085, 0.055, 24),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.85 })
    );
    magnet.rotation.x = Math.PI / 2;
    magnet.position.z = 0.02;
    spk.add(magnet);
    explodables[id].push({
      object: magnet,
      basePos: magnet.position.clone(),
      explodeOffset: new THREE.Vector3(0, 0, 0.16),
    });

    // 3. Voice Coil
    const voiceCoil = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.06, 20, 1, true), copperMat);
    voiceCoil.rotation.x = Math.PI / 2;
    voiceCoil.position.z = 0.07;
    spk.add(voiceCoil);
    explodables[id].push({
      object: voiceCoil,
      basePos: voiceCoil.position.clone(),
      explodeOffset: new THREE.Vector3(0, 0, 0.28),
    });

    // 4. Spider & Cone Diaphragm
    const coneGroup = new THREE.Group();
    coneGroup.position.z = 0.11;
    const cone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.19, 0.045, 0.09, 28, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85, side: THREE.DoubleSide })
    );
    cone.rotation.x = Math.PI / 2;
    coneGroup.add(cone);

    const spider = new THREE.Mesh(
      new THREE.RingGeometry(0.042, 0.095, 24),
      new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8, side: THREE.DoubleSide })
    );
    spider.position.z = -0.02;
    coneGroup.add(spider);
    spk.add(coneGroup);
    explodables[id].push({
      object: coneGroup,
      basePos: coneGroup.position.clone(),
      explodeOffset: new THREE.Vector3(0, 0, 0.42),
    });

    // 5. Outer Acoustic Grille Bezel
    const grille = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.022, 12, 32), brushedAluminumMat);
    grille.position.z = 0.15;
    spk.add(grille);
    explodables[id].push({
      object: grille,
      basePos: grille.position.clone(),
      explodeOffset: new THREE.Vector3(0, 0, 0.56),
    });

    // Acoustic wave propagation rings (visible when active)
    for (let w = 0; w < 3; w += 1) {
      const wave = new THREE.Mesh(
        new THREE.RingGeometry(0.16, 0.185, 32),
        new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      );
      wave.position.z = 0.22 + w * 0.2;
      spk.add(wave);
      wavesOut.push(wave);
    }

    proxyMap.set(id, registerClickable(clickables, spk, id, [0.65, 0.65, 0.5], [0, 0, 0.05]));
  };

  const speakerWavesA: THREE.Mesh[] = [];
  const speakerWavesB: THREE.Mesh[] = [];
  buildSpeakerUnit(-1.35, 2.15, -3.72, 'speakerA', speakerWavesA);
  buildSpeakerUnit(1.35, 2.15, -3.72, 'speakerB', speakerWavesB);

  // SENSOR 3: SEN0232 Sound Level Meter (~1 meter in front of speakers at Z = -2.55, X = 0)
  const senGroup = new THREE.Group();
  senGroup.position.set(0, 0, -2.55);
  group.add(senGroup);
  addContactShadow(group, textures, 0.65, 0.65, 0, -2.55);

  const tripodHub = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.08, 12), darkAnodizedMat);
  tripodHub.position.y = 0.55;
  senGroup.add(tripodHub);
  for (let l = 0; l < 3; l += 1) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.01, 0.62, 8), frameSteelMat);
    const ang = (l * Math.PI * 2) / 3;
    leg.position.set(Math.cos(ang) * 0.14, 0.28, Math.sin(ang) * 0.14);
    leg.rotation.z = Math.cos(ang) * 0.42;
    leg.rotation.x = -Math.sin(ang) * 0.42;
    senGroup.add(leg);
  }
  const standPole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.018, 0.85, 12), brushedAluminumMat);
  standPole.position.y = 0.98;
  senGroup.add(standPole);

  const senModule = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.06, 0.14), pcbGreenMat);
  senModule.position.set(0, 1.42, 0);
  senGroup.add(senModule);

  // Condenser measurement capsule aimed at Speakers (-Z)
  const senCapsule = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.1, 14), brushedAluminumMat);
  senCapsule.rotation.x = Math.PI / 2;
  senCapsule.position.set(0, 1.44, -0.11);
  senGroup.add(senCapsule);

  const senLedMat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 1.4 });
  const senLed = new THREE.Mesh(new THREE.SphereGeometry(0.009, 8, 8), senLedMat);
  senLed.position.set(0.03, 1.455, 0.04);
  senGroup.add(senLed);

  proxyMap.set('sen0232', registerClickable(clickables, senGroup, 'sen0232', [0.35, 0.65, 0.35], [0, 1.35, -0.03]));

  // ============================================================================
  // AREA 5: MONITORING STATION & ESP32 (1.85, 0, 1.45)
  // ============================================================================
  const area5 = new THREE.Group();
  area5.position.set(1.85, 0, 1.45);
  area5.rotation.y = -Math.PI * 0.35;
  group.add(area5);

  addContactShadow(group, textures, 1.6, 1.0, 1.85, 1.45);
  area5.add(buildDesk(1.35, 0.74, 0.76, deskTopMat, frameSteelMat));

  // Monitoring Dual-Display PC
  const monitorStand = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 0.18), frameSteelMat);
  monitorStand.position.set(-0.08, 0.77, -0.12);
  area5.add(monitorStand);
  const monitorArm = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.28, 12), frameSteelMat);
  monitorArm.position.set(-0.08, 0.91, -0.16);
  area5.add(monitorArm);

  const monitorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.46, 0.03), darkAnodizedMat);
  monitorFrame.position.set(-0.08, 1.08, -0.14);
  monitorFrame.castShadow = true;
  area5.add(monitorFrame);

  const monitorScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.72, 0.42),
    new THREE.MeshStandardMaterial({
      map: textures.monitorTexture,
      emissive: 0xffffff,
      emissiveMap: textures.monitorTexture,
      emissiveIntensity: 0.72,
      roughness: 0.22,
    })
  );
  monitorScreen.position.set(-0.08, 1.08, -0.123);
  area5.add(monitorScreen);

  // Keyboard & Mouse
  const keyboard = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.015, 0.13), darkAnodizedMat);
  keyboard.position.set(-0.08, 0.768, 0.12);
  area5.add(keyboard);

  // ESP32 Microcontroller Acquisition Node on Desk (right side of monitor)
  const espBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.02, 0.16),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.3 })
  );
  espBase.position.set(0.42, 0.77, 0.04);
  area5.add(espBase);

  const espPcb = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.012, 0.08), darkAnodizedMat);
  espPcb.position.set(0.42, 0.79, 0.02);
  area5.add(espPcb);

  const espShield = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.01, 0.045), brushedAluminumMat);
  espShield.position.set(0.39, 0.8, 0.02);
  area5.add(espShield);

  const espOled = new THREE.Mesh(
    new THREE.PlaneGeometry(0.08, 0.045),
    new THREE.MeshStandardMaterial({
      map: textures.oledTexture,
      emissive: 0xffffff,
      emissiveMap: textures.oledTexture,
      emissiveIntensity: 0.9,
    })
  );
  espOled.rotation.x = -Math.PI / 4;
  espOled.position.set(0.42, 0.82, 0.08);
  area5.add(espOled);

  proxyMap.set('monitoring', registerClickable(clickables, area5, 'monitoring', [1.1, 0.65, 0.6], [0.1, 1.02, 0]));

  // Selection Highlight Wireframe Box (hidden until a device is selected/hovered)
  const highlightGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));
  const highlightBox = new THREE.LineSegments(
    highlightGeo,
    new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 })
  );
  highlightBox.visible = false;
  group.add(highlightBox);

  const tmpBox = new THREE.Box3();
  const tmpCenter = new THREE.Vector3();
  const tmpSize = new THREE.Vector3();

  const setHighlightTarget = (id: InspectableId | null) => {
    if (!id) {
      highlightBox.visible = false;
      return;
    }
    const proxy = proxyMap.get(id);
    if (!proxy) {
      highlightBox.visible = false;
      return;
    }
    proxy.updateWorldMatrix(true, false);
    tmpBox.setFromObject(proxy);
    tmpBox.getCenter(tmpCenter);
    tmpBox.getSize(tmpSize);
    highlightBox.position.copy(tmpCenter);
    highlightBox.scale.copy(tmpSize).multiplyScalar(1.06);
    highlightBox.visible = true;
  };

  return {
    group,
    clickables,
    explodables,
    micLedMat,
    priorityLedMat,
    ampProtectLedMat,
    ds18LedMat,
    acsLedMat,
    senLedMat,
    vuBars,
    speakerWavesA,
    speakerWavesB,
    mixerKnobs: {
      gain: knobGain,
      bass: knobBass,
      mid: knobMid,
      treble: knobTreble,
      master: knobMaster,
    },
    highlightBox,
    setHighlightTarget,
  };
}
