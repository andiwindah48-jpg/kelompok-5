import { AnnouncementPreset, DeviceCatalogEntry, InspectableId, StationAreaId } from '../types/pas';

export interface StationCameraPreset {
  id: StationAreaId | 'overview';
  shortLabel: string;
  title: string;
  position: [number, number, number];
  target: [number, number, number];
}

export const ROOM_OVERVIEW_CAMERA: StationCameraPreset = {
  id: 'overview',
  shortLabel: 'Tinjauan Ruangan',
  title: 'PAS Control & Simulation Room (6 × 8 m)',
  position: [-2.4, 2.35, 3.35],
  target: [0.15, 1.05, -0.8],
};

export const STATION_CAMERAS: StationCameraPreset[] = [
  ROOM_OVERVIEW_CAMERA,
  {
    id: 'area1',
    shortLabel: '1. Mikrofon',
    title: 'Area 1 – Microphone Station',
    position: [-0.85, 1.48, 2.55],
    target: [-1.45, 0.96, 1.35],
  },
  {
    id: 'area2',
    shortLabel: '2. Mixer',
    title: 'Area 2 – Mixer & Pre-Amplifier Station',
    position: [0.05, 1.55, 0.85],
    target: [-0.25, 0.96, -0.35],
  },
  {
    id: 'area3',
    shortLabel: '3. Amplifier',
    title: 'Area 3 – Power Amplifier Station',
    position: [0.75, 1.52, 0.85],
    target: [1.75, 1.05, -0.45],
  },
  {
    id: 'area4',
    shortLabel: '4. Speaker',
    title: 'Area 4 – Speaker & Acoustic Test Station',
    position: [0.0, 1.75, -0.85],
    target: [0.0, 2.05, -3.75],
  },
  {
    id: 'area5',
    shortLabel: '5. Monitoring',
    title: 'Area 5 – Monitoring & ESP32 Station',
    position: [0.85, 1.65, 2.75],
    target: [1.85, 1.12, 1.45],
  },
];

export const DEVICE_CATALOG: Record<InspectableId, DeviceCatalogEntry> = {
  microphone: {
    id: 'microphone',
    areaId: 'area1',
    areaLabel: 'Area 1 · Microphone Station',
    title: 'Mikrofon Paging Gooseneck Condenser',
    subtitle: 'Transduser akustik ke sinyal elektrik seimbang (Balanced XLR)',
    summary:
      'Stasiun operator untuk membangkitkan sinyal suara pengumuman bandara. Dilengkapi tombol Talk ON/OFF, cincin indikator LED aktif, dan pre-amp phantom power.',
    supportsExplode: true,
    cameraPosition: [-0.95, 1.35, 2.15],
    cameraTarget: [-1.45, 0.98, 1.35],
    components: [
      {
        id: 'mic-capsule',
        name: 'Kapsul Condenser & Diafragma',
        role: 'Transduser Tekanan Suara',
        detail:
          'Membran tipis bermuatan elektrostatik yang bergetar oleh gelombang suara dan mengubah perubahan kapasitansi menjadi sinyal listrik mikro-volt.',
        spec: 'Pola Cardioid · Sensitivitas -38 dBV/Pa',
      },
      {
        id: 'mic-fet',
        name: 'Rangkaian Impedansi & FET Pre-Amp',
        role: 'Penyesuai Impedansi',
        detail:
          'Transistor JFET internal menurunkan impedansi keluaran tinggi dari kapsul agar sinyal stabil melewati kabel panjang menuju mixer.',
        spec: 'Phantom +48V / DC 12V · SNR 72 dB',
      },
      {
        id: 'mic-switch',
        name: 'Saklar PTT ON/OFF & Cincin LED',
        role: 'Kontrol Operator & Priority Trigger',
        detail:
          'Mengaktifkan jalur mikrofon sekaligus mengirim sinyal pemicu prioritas (chime & ducking BGM) ke unit mixer.',
        spec: 'Latch / Momentary Contact · Status LED Merah/Biru',
      },
      {
        id: 'mic-xlr',
        name: 'Konektor Audio XLR 3-Pin',
        role: 'Keluaran Balanced (Hot, Cold, Ground)',
        detail:
          'Menyalurkan sinyal audio diferensial melalui kabel audio terpisah ke Mixer Station untuk menekan derau elektromagnetik.',
        spec: 'Pin 1 GND · Pin 2 (+) · Pin 3 (-)',
      },
    ],
  },
  mixer: {
    id: 'mixer',
    areaId: 'area2',
    areaLabel: 'Area 2 · Mixer & Pre-Amplifier Station',
    title: 'Mixer & Pre-Amplifier PAS 4-Kanal',
    subtitle: 'Pengolahan sinyal, Equalizer 3-Band, Priority Override, dan Output Buffer',
    summary:
      'Menguatkan sinyal level mikrofon ke level garis (Line Level 0 dBu), membentuk karakter frekuensi suara pengumuman agar artikulasi jelas di ruang terminal, serta mengatur prioritas.',
    supportsExplode: true,
    cameraPosition: [-0.15, 1.48, 0.62],
    cameraTarget: [-0.25, 0.94, -0.35],
    components: [
      {
        id: 'mix-preamp',
        name: 'Gain / Pre-Amplifier Stage',
        role: 'Penguat Awal Low-Noise',
        detail:
          'Menaikkan sinyal lemah dari mikrofon (-50 dBV) ke level operasional internal (+4 dBu) menggunakan Op-Amp presisi.',
        spec: 'Rentang Gain 0–60 dB · THD < 0.01%',
      },
      {
        id: 'mix-eq',
        name: 'Tone Control / EQ 3-Band',
        role: 'Pembentuk Respon Frekuensi (Bass, Mid, Treble)',
        detail:
          'Menyeimbangkan kejernihan vokal pengumuman di area terminal bergema dengan memangkas frekuensi rendah berlebih dan menegaskan pita vokal 1–4 kHz.',
        spec: 'Low 100 Hz · Mid 1 kHz · High 10 kHz (±12 dB)',
      },
      {
        id: 'mix-priority',
        name: 'Sirkuit Priority Override (Voice Ducking)',
        role: 'Penentu Prioritas Pengumuman',
        detail:
          'Ketika mikrofon paging atau tombol prioritas aktif, relai/VCA meredam musik latar (BGM) sebesar -20 dB secara otomatis agar pengumuman terdengar dominan.',
        spec: 'Attenuation -20 dB · Attack 15 ms',
      },
      {
        id: 'mix-buffer',
        name: 'Mixing Bus & Output Buffer',
        role: 'Penjumlah Kanal & Penggerak Kabel Line',
        detail:
          'Menggabungkan sumber mikrofon dan BGM lalu mendorong sinyal stabil ke Power Amplifier Station.',
        spec: 'Output Nominal +4 dBu · Impedansi 100 Ω',
      },
    ],
  },
  amplifier: {
    id: 'amplifier',
    areaId: 'area3',
    areaLabel: 'Area 3 · Power Amplifier Station',
    title: 'Power Amplifier PAS 2×240W (100V Line)',
    subtitle: 'Penguatan daya tinggi dengan Catu Daya Toroidal, MOSFET, Heatsink & Proteksi',
    summary:
      'Ditempatkan di dalam rak perangkat 19 inci untuk memperkuat sinyal line dari mixer menjadi daya tinggi penggerak speaker distribusi 100V.',
    supportsExplode: true,
    cameraPosition: [0.85, 1.45, 0.45],
    cameraTarget: [1.75, 1.04, -0.45],
    components: [
      {
        id: 'amp-psu',
        name: 'Catu Daya & Trafo Toroidal',
        role: 'Konverter AC 220V ke DC Simetris',
        detail:
          'Menurunkan tegangan PLN dan menyearahkannya melalui bank kapasitor besar menjadi rel suplai ±48V DC yang dipantau sensor arus ACS758.',
        spec: 'Toroid 600 VA · Bank Kapasitor 2×10.000 µF',
      },
      {
        id: 'amp-mosfet',
        name: 'Transistor Daya / Pasangan MOSFET',
        role: 'Tingkat Penguat Akhir (Class-AB)',
        detail:
          'Mengatur aliran arus besar dari rel catu daya mengikuti bentuk gelombang sinyal audio dari driver stage.',
        spec: 'Complimentary MOSFET · Peak 240 W RMS',
      },
      {
        id: 'amp-heatsink',
        name: 'Heatsink Sirip Aluminium',
        role: 'Pembuang Panas Termal',
        detail:
          'Menyerap panas disipasi transistor daya ke udara ruangan. Sensor suhu DS18B20 menempel langsung pada sirip ini.',
        spec: 'Resistansi Termal 0.65 °C/W',
      },
      {
        id: 'amp-prot',
        name: 'Sirkuit Proteksi & Trafo Output 100V',
        role: 'Pengaman Beban & Step-Up Tegangan Audio',
        detail:
          'Melindungi speaker dari DC offset/hubung singkat dan menaikkan tegangan keluaran ke jalur 100V untuk meminimalkan rugi kabel jarak jauh.',
        spec: 'Line 100V / 70V · Thermal Cutoff 85 °C',
      },
    ],
  },
  speakerA: {
    id: 'speakerA',
    areaId: 'area4',
    areaLabel: 'Area 4 · Speaker Station',
    title: 'Ceiling / Acoustic Speaker A (Zona Terminal Barat)',
    subtitle: 'Konversi daya listrik 100V menjadi gelombang akustik pengumuman',
    summary:
      'Dipasang pada dinding/plafon depan ruang uji untuk mereproduksi suara pengumuman bandara. Diukur langsung oleh sensor suara SEN0232 pada jarak 1 meter.',
    supportsExplode: true,
    cameraPosition: [-1.05, 2.02, -2.05],
    cameraTarget: [-1.35, 2.15, -3.72],
    components: [
      {
        id: 'spk-trafo',
        name: 'Matching Transformer 100V',
        role: 'Penurun Tegangan & Penyesuai Impedansi',
        detail:
          'Mengubah sinyal jalur tegangan tinggi 100V dari power amplifier menjadi tegangan rendah berarus tinggi untuk voice coil (tapping 6W / 15W / 30W).',
        spec: 'Primary 100V · Tap 6W / 15W / 30W',
      },
      {
        id: 'spk-magnet',
        name: 'Magnet Permanen & Yoke Besi',
        role: 'Sumber Medan Magnet Statis',
        detail:
          'Membentuk celah medan magnet radial yang kuat tempat voice coil bergerak maju-mundur.',
        spec: 'Ferrite / Neodymium Flux 1.1 Tesla',
      },
      {
        id: 'spk-coil',
        name: 'Voice Coil (Kumparan Suara)',
        role: 'Penggerak Gaya Lorentz',
        detail:
          'Arus audio bolak-balik pada lilitan tembaga berinteraksi dengan medan magnet permanen sehingga menghasilkan gaya gerak mekanis.',
        spec: 'Impedansi 8 Ω · Kapton Former',
      },
      {
        id: 'spk-cone',
        name: 'Cone (Diafragma) & Spider Damper',
        role: 'Radiator Gelombang Udara & Suspensi',
        detail:
          'Cone mendorong molekul udara menjadi gelombang suara, sementara spider menjaga posisi kumparan tetap terpusat dan memulihkan posisi netral.',
        spec: 'Diameter 6.5 inci · Sensitivitas 92 dB/W/m',
      },
    ],
  },
  speakerB: {
    id: 'speakerB',
    areaId: 'area4',
    areaLabel: 'Area 4 · Speaker Station',
    title: 'Ceiling / Acoustic Speaker B (Zona Gate Keberangkatan)',
    subtitle: 'Unit speaker sekunder untuk pengujian distribusi zona ganda',
    summary:
      'Bekerja paralel pada jalur 100V Zona B untuk mendemonstrasikan perutean pengumuman antar-zona serta penambahan energi akustik ruangan.',
    supportsExplode: true,
    cameraPosition: [1.05, 2.02, -2.05],
    cameraTarget: [1.35, 2.15, -3.72],
    components: [
      {
        id: 'spk-b-trafo',
        name: 'Matching Transformer 100V',
        role: 'Penyesuai Daya Zona B',
        detail:
          'Mengisolasi dan menyesuaikan beban impedansi speaker agar beberapa speaker dapat dipasang paralel pada satu saluran amplifier.',
        spec: 'Primary 100V · Secondary 8 Ω',
      },
      {
        id: 'spk-b-magnet',
        name: 'Magnet Permanen',
        role: 'Stator Medan Magnet',
        detail:
          'Menyediakan fluks magnet konstan pada celah udara di sekitar voice coil.',
        spec: 'Kerapatan Fluks 1.1 Tesla',
      },
      {
        id: 'spk-b-coil',
        name: 'Voice Coil',
        role: 'Aktuator Elektromagnetik',
        detail:
          'Mengubah arus audio menjadi osilasi aksial sesuai frekuensi suara pengumuman.',
        spec: 'Lilitan Tembaga 8 Ω',
      },
      {
        id: 'spk-b-cone',
        name: 'Cone & Spider',
        role: 'Membran Akustik & Penstabil',
        detail:
          'Menghasilkan tekanan suara ke ruang uji dan menjaga linearitas gerak kumparan.',
        spec: 'Respon Frekuensi 90 Hz – 16 kHz',
      },
    ],
  },
  ds18b20: {
    id: 'ds18b20',
    areaId: 'area3',
    areaLabel: 'Sensor 1 · Menempel pada Heatsink Amplifier',
    title: 'Sensor Suhu Digital DS18B20',
    subtitle: 'Memantau temperatur heatsink Power Amplifier secara real-time',
    summary:
      'Dipasang menempel langsung pada sirip aluminium heatsink amplifier menggunakan probe tahan panas, mengirimkan data digital 1-Wire menuju ESP32.',
    supportsExplode: false,
    cameraPosition: [1.05, 1.35, 0.25],
    cameraTarget: [1.82, 1.06, -0.45],
    components: [
      {
        id: 'ds-probe',
        name: 'Kapsul Probe Stainless & Elemen Semikonduktor',
        role: 'Deteksi Suhu Kontak Langsung',
        detail:
          'Mengukur suhu permukaan heatsink amplifier tempat panas MOSFET terakumulasi selama penguatan daya tinggi.',
        spec: 'Rentang -55 °C s.d. +125 °C · Akurasi ±0.5 °C',
      },
      {
        id: 'ds-bus',
        name: 'Antarmuka 1-Wire ke ESP32',
        role: 'Transmisi Data Digital Terisolasi',
        detail:
          'Mengirim pembacaan suhu resolusi 12-bit melalui jalur kabel sensor terpisah (hijau) ke pin GPIO4 ESP32.',
        spec: 'Resolusi 12-bit (0.0625 °C) · Pull-up 4.7 kΩ',
      },
    ],
  },
  acs758: {
    id: 'acs758',
    areaId: 'area3',
    areaLabel: 'Sensor 2 · Jalur Suplai DC Amplifier',
    title: 'Sensor Arus Hall-Effect ACS758',
    subtitle: 'Mengukur arus suplai DC Power Amplifier hingga 50A',
    summary:
      'Ditempatkan secara seri pada jalur busbar suplai DC power amplifier untuk memantau konsumsi arus saat diam (quiescent) maupun puncak suara pengumuman.',
    supportsExplode: false,
    cameraPosition: [1.05, 1.18, 0.25],
    cameraTarget: [1.82, 0.85, -0.45],
    components: [
      {
        id: 'acs-hall',
        name: 'Konduktor Tembaga & IC Hall-Effect',
        role: 'Penginderaan Medan Magnet Arus DC',
        detail:
          'Arus DC menuju tingkat akhir amplifier mengalir lewat jalur tembaga resistansi rendah dan menghasilkan tegangan proporsional tanpa rugi daya besar.',
        spec: 'Sensitivitas 40 mV/A · Isolasi 4.8 kVrms',
      },
      {
        id: 'acs-adc',
        name: 'Sinyal Analog ke ADC ESP32',
        role: 'Telemetri Arus Real-Time',
        detail:
          'Tegangan keluaran 2.5V + (I × 40mV) dibaca ADC ESP32 melalui kabel sensor terpisah untuk mendeteksi beban berlebih atau hubung singkat.',
        spec: 'Bandwidth 120 kHz · Pin ADC GPIO34',
      },
    ],
  },
  sen0232: {
    id: 'sen0232',
    areaId: 'area4',
    areaLabel: 'Sensor 3 · Berjarak 1 Meter di Depan Speaker',
    title: 'Sensor Tingkat Suara SEN0232 (Sound Level Meter)',
    subtitle: 'Posisi pengukuran akustik ±1 meter menghadap Speaker Station',
    summary:
      'Diletakkan di atas tripod kalibrasi sekitar 1 meter di depan speaker agar mengukur tingkat tekanan suara (dBA) yang benar-benar diterima pendengar di ruangan.',
    supportsExplode: false,
    cameraPosition: [0.85, 1.65, -1.35],
    cameraTarget: [0.0, 1.42, -2.55],
    components: [
      {
        id: 'sen-mic',
        name: 'Kapsul Kalibrasi & Penguat Logaritmik',
        role: 'Konversi Tekanan Akustik ke Desibel (dBA)',
        detail:
          'Menangkap energi gelombang suara dari Speaker A dan B pada jarak standar 1 meter, bukan menempel di speaker, untuk pembacaan SPL akurat.',
        spec: 'Rentang 30–130 dBA · Akurasi ±1.5 dB',
      },
      {
        id: 'sen-out',
        name: 'Keluaran Analog ke ESP32',
        role: 'Umpan Balik Tingkat Kekerasan Ruangan',
        detail:
          'Mengirim nilai tegangan linier terhadap dBA menuju ESP32 untuk diverifikasi pada dashboard komputer monitoring.',
        spec: '0.6–2.6 V DC · Pin ADC GPIO35',
      },
    ],
  },
  monitoring: {
    id: 'monitoring',
    areaId: 'area5',
    areaLabel: 'Area 5 · Monitoring Station',
    title: 'Komputer Monitoring & Mikrokontroler ESP32',
    subtitle: 'Pusat akuisisi data sensor DS18B20, ACS758, SEN0232 dan dashboard PAS',
    summary:
      'ESP32 mengumpulkan seluruh pembacaan sensor melalui kabel telemetry terpisah lalu mengirimkannya ke komputer monitoring untuk visualisasi real-time dan alarm proteksi.',
    supportsExplode: false,
    cameraPosition: [0.92, 1.58, 2.48],
    cameraTarget: [1.85, 1.12, 1.45],
    components: [
      {
        id: 'mon-esp32',
        name: 'Mikrokontroler ESP32 Dual-Core',
        role: 'Node Akuisisi Sensor & WiFi Telemetry',
        detail:
          'Membaca protokol 1-Wire (DS18B20) serta kanal ADC presisi (ACS758 & SEN0232) dan memformat paket data setiap 100 ms.',
        spec: '240 MHz Dual-Core · ADC 12-bit · OLED 0.96"',
      },
      {
        id: 'mon-pc',
        name: 'Workstation & Dashboard Monitoring',
        role: 'Antarmuka Pemantauan & Diagnostik PAS',
        detail:
          'Menampilkan grafik tren suhu amplifier, arus DC, tingkat kebisingan dBA, status zona speaker, dan peringatan dini.',
        spec: 'Dual Display 1080p · Refresh Rate 10 Hz',
      },
    ],
  },
};

export const ANNOUNCEMENT_PRESETS: AnnouncementPreset[] = [
  {
    id: 'ga402',
    flightCode: 'GA-402',
    gate: 'Gate A4',
    destination: 'Jakarta (CGK)',
    category: 'boarding',
    label: 'Boarding GA-402 · Jakarta',
    script:
      'Perhatian. Panggilan boarding bagi penumpang Garuda Indonesia nomor penerbangan GA-402 tujuan Jakarta. Silakan menuju pintu keberangkatan A4 sekarang. Terima kasih.',
  },
  {
    id: 'qz751',
    flightCode: 'QZ-751',
    gate: 'Gate B2',
    destination: 'Surabaya (SUB)',
    category: 'delay',
    label: 'Perubahan Gate QZ-751 · Surabaya',
    script:
      'Informasi bandara. Penumpang AirAsia penerbangan QZ-751 tujuan Surabaya harap memperhatikan bahwa pintu keberangkatan dipindahkan ke Gate B2. Mohon segera menuju Gate B2.',
  },
  {
    id: 'safety',
    flightCode: 'TEST-PAS',
    gate: 'All Zones',
    destination: 'Uji Sistem',
    category: 'safety',
    label: 'Uji Sistem & Keamanan PAS',
    script:
      'Perhatian seluruh staf terminal. Ini adalah pengujian rutin Public Address System dari ruang kontrol PAS. Mohon perhatikan kejernihan suara di Zona A dan Zona B.',
  },
];
