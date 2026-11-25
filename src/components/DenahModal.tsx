import React from 'react';
import { X } from 'lucide-react';
import { InspectableId, SensorTelemetry } from '../types/pas';

interface DenahModalProps {
  open: boolean;
  onClose: () => void;
  onJumpToDevice: (id: InspectableId) => void;
  telemetry: SensorTelemetry;
}

export const DenahModal: React.FC<DenahModalProps> = ({
  open,
  onClose,
  onJumpToDevice,
  telemetry,
}) => {
  if (!open) return null;

  const jump = (id: InspectableId) => {
    onJumpToDevice(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/75">
      <div className="w-full max-w-4xl bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              Denah PAS Control &amp; Simulation Room (6 × 8 m)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Klik area perangkat atau sensor pada denah untuk memindahkan kamera 3D langsung ke titik tersebut
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup denah"
            className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top-Down Architectural Blueprint SVG */}
          <div className="lg:col-span-2 bg-[#090f1a] border border-slate-800 rounded-lg p-4">
            <svg viewBox="0 0 600 780" className="w-full h-auto max-h-[62vh]">
              {/* Room Outer Wall */}
              <rect
                x="40"
                y="30"
                width="520"
                height="710"
                fill="#0f172a"
                stroke="#475569"
                strokeWidth="6"
              />
              {/* Subtle Floor Tile Grid */}
              <g stroke="#1e293b" strokeWidth="1">
                {[120, 200, 280, 360, 440, 520].map((x) => (
                  <line key={`vx-${x}`} x1={x} y1="30" x2={x} y2="740" />
                ))}
                {[110, 190, 270, 350, 430, 510, 590, 670].map((y) => (
                  <line key={`hy-${y}`} x1="40" y1={y} x2="560" y2={y} />
                ))}
              </g>

              {/* Wall Labels */}
              <text x="300" y="20" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="600">
                DINDING DEPAN (AREA UJI AKUSTIK SPEAKER)
              </text>
              <text x="300" y="764" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="600">
                DINDING BELAKANG · PINTU AKSES
              </text>

              {/* Separated Cable Routing Paths */}
              {/* 1. Audio Path (Sky Blue) */}
              <path
                d="M 180 510 L 180 410 L 275 360 L 445 360 L 445 190 L 180 190 L 180 85 M 445 190 L 420 190 L 420 85"
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="3.5"
                strokeDasharray="6 3"
              />
              {/* 2. Power Path (Amber) */}
              <path
                d="M 55 585 L 55 310 L 445 310 L 445 340"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="3.5"
              />
              {/* 3. Sensor Telemetry Path (Emerald) */}
              <path
                d="M 465 375 L 505 375 L 505 520 L 465 520 M 300 175 L 520 175 L 520 520 L 465 520"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeDasharray="4 3"
              />

              {/* Speaker A & B (Area 4) */}
              <g onClick={() => jump('speakerA')} className="cursor-pointer">
                <rect x="135" y="55" width="90" height="50" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                <text x="180" y="78" textAnchor="middle" fill="#f8fafc" fontSize="12" fontWeight="600">Speaker A</text>
                <text x="180" y="95" textAnchor="middle" fill="#7dd3fc" fontSize="10">Zona Barat</text>
              </g>

              <g onClick={() => jump('speakerB')} className="cursor-pointer">
                <rect x="375" y="55" width="90" height="50" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                <text x="420" y="78" textAnchor="middle" fill="#f8fafc" fontSize="12" fontWeight="600">Speaker B</text>
                <text x="420" y="95" textAnchor="middle" fill="#7dd3fc" fontSize="10">Zona Gate</text>
              </g>

              {/* SEN0232 Sound Sensor 1m in front of Speakers */}
              <g onClick={() => jump('sen0232')} className="cursor-pointer">
                <circle cx="300" cy="175" r="24" fill="#064e3b" stroke="#10b981" strokeWidth="2" />
                <text x="300" y="172" textAnchor="middle" fill="#ecfdf5" fontSize="11" fontWeight="600">SEN0232</text>
                <text x="300" y="187" textAnchor="middle" fill="#6ee7b7" fontSize="10">
                  {telemetry.soundDb.toFixed(0)} dBA
                </text>
                <line x1="300" y1="105" x2="300" y2="148" stroke="#64748b" strokeWidth="1" strokeDasharray="3 3" />
                <text x="300" y="130" textAnchor="middle" fill="#94a3b8" fontSize="10">± 1.0 m</text>
              </g>

              {/* Area 2: Mixer & Pre-Amplifier */}
              <g onClick={() => jump('mixer')} className="cursor-pointer">
                <rect x="215" y="330" width="120" height="72" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                <text x="275" y="362" textAnchor="middle" fill="#f8fafc" fontSize="12" fontWeight="600">Area 2 · Mixer</text>
                <text x="275" y="380" textAnchor="middle" fill="#94a3b8" fontSize="10">Pre-Amp &amp; EQ</text>
              </g>

              {/* Area 3: Power Amplifier Rack + DS18B20 + ACS758 */}
              <g onClick={() => jump('amplifier')} className="cursor-pointer">
                <rect x="400" y="325" width="95" height="82" rx="6" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
                <text x="447" y="355" textAnchor="middle" fill="#f8fafc" fontSize="12" fontWeight="600">Area 3</text>
                <text x="447" y="372" textAnchor="middle" fill="#fcd34d" fontSize="10">Power Amp</text>
              </g>

              <g onClick={() => jump('ds18b20')} className="cursor-pointer">
                <rect x="460" y="378" width="66" height="26" rx="4" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
                <text x="493" y="395" textAnchor="middle" fill="#ecfdf5" fontSize="9.5" fontWeight="600">DS18B20</text>
              </g>

              <g onClick={() => jump('acs758')} className="cursor-pointer">
                <rect x="372" y="378" width="62" height="26" rx="4" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
                <text x="403" y="395" textAnchor="middle" fill="#ecfdf5" fontSize="9.5" fontWeight="600">ACS758</text>
              </g>

              {/* Area 1: Microphone Station */}
              <g onClick={() => jump('microphone')} className="cursor-pointer">
                <rect x="115" y="485" width="130" height="75" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
                <text x="180" y="518" textAnchor="middle" fill="#f8fafc" fontSize="12" fontWeight="600">Area 1 · Mikrofon</text>
                <text x="180" y="536" textAnchor="middle" fill="#94a3b8" fontSize="10">Meja Operator</text>
              </g>

              {/* Area 5: Monitoring Station */}
              <g onClick={() => jump('monitoring')} className="cursor-pointer">
                <rect x="385" y="485" width="135" height="80" rx="6" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
                <text x="452" y="518" textAnchor="middle" fill="#f8fafc" fontSize="12" fontWeight="600">Area 5 · Monitoring</text>
                <text x="452" y="536" textAnchor="middle" fill="#6ee7b7" fontSize="10">PC + ESP32 Node</text>
              </g>

              {/* Electrical Distribution Panel & AC Unit & Access Door */}
              <rect x="44" y="555" width="22" height="65" fill="#78350f" stroke="#f59e0b" strokeWidth="1.5" />
              <text x="74" y="592" fill="#fcd34d" fontSize="10">Panel Listrik</text>

              <rect x="536" y="310" width="20" height="100" fill="#1e293b" stroke="#7dd3fc" strokeWidth="1.5" />
              <text x="528" y="298" textAnchor="end" fill="#7dd3fc" fontSize="10">AC / Ventilasi</text>

              <rect x="95" y="728" width="90" height="14" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
              <text x="140" y="718" textAnchor="middle" fill="#cbd5e1" fontSize="10">Pintu Masuk</text>
            </svg>
          </div>

          {/* Legend & Sensor Placement Summary */}
          <div className="flex flex-col justify-between gap-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 mb-2">
                  Jalur Kabel Terpisah (Anti-EMI)
                </h3>
                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-1 bg-sky-400 inline-block shrink-0" />
                    <span>Kabel Audio (Mikrofon → Mixer → Amplifier → Speaker)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-1 bg-amber-500 inline-block shrink-0" />
                    <span>Kabel Daya (Panel Distribusi → Power Amplifier)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-1 bg-emerald-500 inline-block shrink-0" />
                    <span>Kabel Sensor (DS18B20, ACS758, SEN0232 → ESP32)</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4">
                <h3 className="text-sm font-semibold text-slate-100 mb-2">
                  Posisi Fisik Tiga Sensor
                </h3>
                <div className="space-y-2.5 text-xs">
                  <button
                    type="button"
                    onClick={() => jump('ds18b20')}
                    className="w-full text-left p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-sky-500 transition-colors cursor-pointer"
                  >
                    <div className="flex justify-between font-medium text-slate-200">
                      <span>DS18B20 · Heatsink Amplifier</span>
                      <span className="font-mono-tabular text-sky-400">
                        {telemetry.temperatureC.toFixed(1)} °C
                      </span>
                    </div>
                    <p className="text-slate-400 mt-0.5">Mengukur panas sirip pendingin transistor daya</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => jump('acs758')}
                    className="w-full text-left p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500 transition-colors cursor-pointer"
                  >
                    <div className="flex justify-between font-medium text-slate-200">
                      <span>ACS758 · Jalur Suplai DC</span>
                      <span className="font-mono-tabular text-amber-400">
                        {telemetry.currentA.toFixed(2)} A
                      </span>
                    </div>
                    <p className="text-slate-400 mt-0.5">Mengukur arus beban DC amplifier secara real-time</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => jump('sen0232')}
                    className="w-full text-left p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500 transition-colors cursor-pointer"
                  >
                    <div className="flex justify-between font-medium text-slate-200">
                      <span>SEN0232 · 1 m Depan Speaker</span>
                      <span className="font-mono-tabular text-emerald-400">
                        {telemetry.soundDb.toFixed(1)} dBA
                      </span>
                    </div>
                    <p className="text-slate-400 mt-0.5">Mengukur tekanan suara akustik yang diterima ruangan</p>
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Kembali ke Ruang 3D
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
