import React, { useState } from 'react';
import { X, Layers, Cpu } from 'lucide-react';
import { DEVICE_CATALOG } from '../data/pasCatalog';
import { InspectableId, SensorTelemetry } from '../types/pas';

interface InspectorDrawerProps {
  selectedId: InspectableId | null;
  onClose: () => void;
  explodeValue: number;
  onChangeExplode: (value: number) => void;
  telemetry: SensorTelemetry;
}

export const InspectorDrawer: React.FC<InspectorDrawerProps> = ({
  selectedId,
  onClose,
  explodeValue,
  onChangeExplode,
  telemetry,
}) => {
  const [activeCompId, setActiveCompId] = useState<string | null>(null);

  if (!selectedId) return null;
  const entry = DEVICE_CATALOG[selectedId];
  if (!entry) return null;

  const activeComp =
    entry.components.find((c) => c.id === activeCompId) ?? entry.components[0];

  return (
    <aside
      aria-label="Inspeksi Perangkat"
      className="fixed top-16 left-4 z-20 w-[340px] max-w-[92vw] max-h-[58vh] flex flex-col bg-[#0f172a]/95 border border-slate-700/90 rounded-xl shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-slate-800">
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-sky-400 truncate">
            {entry.areaLabel}
          </div>
          <h2 className="text-sm font-semibold text-slate-100 leading-snug mt-0.5">
            {entry.title}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 leading-snug">
            {entry.subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup inspeksi perangkat"
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md shrink-0 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 overflow-y-auto pas-scroll space-y-3.5 text-xs">
        <p className="text-slate-300 leading-relaxed">{entry.summary}</p>

        {/* Live Sensor Telemetry if inspecting a sensor or monitoring station */}
        {(selectedId === 'ds18b20' ||
          selectedId === 'acs758' ||
          selectedId === 'sen0232' ||
          selectedId === 'monitoring' ||
          selectedId === 'amplifier') && (
          <div className="grid grid-cols-3 gap-2 p-2.5 bg-[#090f1a] border border-slate-800 rounded-lg">
            <div>
              <div className="text-[10px] text-slate-400">DS18B20</div>
              <div className="font-mono-tabular text-sm font-semibold text-sky-400">
                {telemetry.temperatureC.toFixed(1)} °C
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">ACS758</div>
              <div className="font-mono-tabular text-sm font-semibold text-amber-400">
                {telemetry.currentA.toFixed(2)} A
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400">SEN0232</div>
              <div className="font-mono-tabular text-sm font-semibold text-emerald-400">
                {telemetry.soundDb.toFixed(1)} dBA
              </div>
            </div>
          </div>
        )}

        {/* Exploded / Cutaway Internal View Slider */}
        {entry.supportsExplode && (
          <div className="p-3 bg-[#090f1a] border border-slate-800 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium text-slate-200">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                <span>Buka Komponen Internal (Exploded)</span>
              </span>
              <span className="font-mono-tabular text-sky-400 font-semibold">
                {Math.round(explodeValue * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(explodeValue * 100)}
              onChange={(e) => onChangeExplode(Number(e.target.value) / 100)}
              className="w-full pas-slider"
              aria-label="Persentase bukaan komponen internal"
            />
          </div>
        )}

        {/* Internal Components Selector */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-sky-400" />
            <span>Komponen Internal &amp; Fungsi</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {entry.components.map((comp) => {
              const isSelected = comp.id === activeComp.id;
              return (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => setActiveCompId(comp.id)}
                  className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {comp.name}
                </button>
              );
            })}
          </div>

          <div className="p-3 bg-[#090f1a] border border-slate-800 rounded-lg space-y-1.5">
            <div className="font-semibold text-slate-100">{activeComp.name}</div>
            <div className="text-[11px] text-sky-400 font-medium">{activeComp.role}</div>
            <p className="text-slate-300 leading-relaxed">{activeComp.detail}</p>
            <div className="pt-1 font-mono-tabular text-[11px] text-slate-400 border-t border-slate-800/80">
              {activeComp.spec}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
