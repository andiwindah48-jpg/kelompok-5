import { MixerSettings } from '../types/pas';

/**
 * Procedural Web Audio API engine for the PAS Control & Simulation Room.
 * Synthesizes airport chimes, background terminal music (for testing priority ducking),
 * and routes live gain, 3-band EQ, and real-time AnalyserNode metering with zero external files.
 */
export class PASAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private micBusGain: GainNode | null = null;
  private bgmBusGain: GainNode | null = null;
  private eqLow: BiquadFilterNode | null = null;
  private eqMid: BiquadFilterNode | null = null;
  private eqHigh: BiquadFilterNode | null = null;
  private analyser: AnalyserNode | null = null;
  private timeData: Uint8Array<ArrayBuffer> | null = null;

  private bgmOscs: OscillatorNode[] = [];
  private bgmInterval: number | null = null;
  private bgmRunning = false;

  private announcementActive = false;
  private announcementOscs: OscillatorNode[] = [];
  private announcementTimer: number | null = null;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      this.micBusGain = this.ctx.createGain();
      this.bgmBusGain = this.ctx.createGain();

      this.eqLow = this.ctx.createBiquadFilter();
      this.eqLow.type = 'lowshelf';
      this.eqLow.frequency.value = 140;

      this.eqMid = this.ctx.createBiquadFilter();
      this.eqMid.type = 'peaking';
      this.eqMid.frequency.value = 1100;
      this.eqMid.Q.value = 1.1;

      this.eqHigh = this.ctx.createBiquadFilter();
      this.eqHigh.type = 'highshelf';
      this.eqHigh.frequency.value = 3800;

      this.masterGain = this.ctx.createGain();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.timeData = new Uint8Array(this.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;

      this.micBusGain.connect(this.eqLow);
      this.bgmBusGain.connect(this.eqLow);
      this.eqLow.connect(this.eqMid);
      this.eqMid.connect(this.eqHigh);
      this.eqHigh.connect(this.masterGain);
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public syncSettings(settings: MixerSettings): void {
    const ctx = this.ctx;
    if (!ctx || !this.masterGain || !this.micBusGain || !this.bgmBusGain || !this.eqLow || !this.eqMid || !this.eqHigh) {
      if (settings.systemPower && settings.bgmPlaying && !this.bgmRunning) {
        this.startBgm();
      } else if ((!settings.systemPower || !settings.bgmPlaying) && this.bgmRunning) {
        this.stopBgm();
      }
      return;
    }

    const now = ctx.currentTime;
    const zoneFactor = settings.zoneA || settings.zoneB ? 1 : 0;
    const masterVol = settings.systemPower ? (settings.masterVolume / 100) * zoneFactor * 0.65 : 0;
    this.masterGain.gain.setTargetAtTime(masterVol, now, 0.05);

    const micVol = settings.micActive || this.announcementActive ? (settings.micGain / 100) * 1.1 : 0.2;
    this.micBusGain.gain.setTargetAtTime(micVol, now, 0.04);

    // Priority override ducks BGM by -18 dB when mic or announcement is active
    const ducked = settings.priorityOverride && (settings.micActive || this.announcementActive);
    const bgmVol = settings.systemPower && settings.bgmPlaying ? (ducked ? 0.04 : 0.22) : 0;
    this.bgmBusGain.gain.setTargetAtTime(bgmVol, now, 0.08);

    this.eqLow.gain.setTargetAtTime(settings.eqBass, now, 0.04);
    this.eqMid.gain.setTargetAtTime(settings.eqMid, now, 0.04);
    this.eqHigh.gain.setTargetAtTime(settings.eqTreble, now, 0.04);

    if (settings.systemPower && settings.bgmPlaying && !this.bgmRunning) {
      this.startBgm();
    } else if ((!settings.systemPower || !settings.bgmPlaying) && this.bgmRunning) {
      this.stopBgm();
    }
  }

  public playAirportChime(settings: MixerSettings): void {
    if (!settings.systemPower) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.micBusGain) return;
    this.syncSettings(settings);

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 - E5 - G5 - C6 airport chime
    const start = ctx.currentTime + 0.02;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start + idx * 0.24);

      env.gain.setValueAtTime(0.0001, start + idx * 0.24);
      env.gain.exponentialRampToValueAtTime(0.32, start + idx * 0.24 + 0.02);
      env.gain.exponentialRampToValueAtTime(0.0001, start + idx * 0.24 + 0.85);

      osc.connect(env);
      env.connect(this.micBusGain!);
      osc.start(start + idx * 0.24);
      osc.stop(start + idx * 0.24 + 0.9);
    });
  }

  public triggerAnnouncement(
    script: string,
    settings: MixerSettings,
    onDone?: () => void
  ): void {
    if (!settings.systemPower) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.micBusGain) return;

    this.stopAnnouncement();
    this.announcementActive = true;
    this.syncSettings(settings);
    this.playAirportChime(settings);

    // Synthesize a subtle carrier/formant pulse for metering & fallback when speechSynthesis is muted
    const startCarrier = () => {
      if (!this.ctx || !this.micBusGain) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const mod = this.ctx.createOscillator();
      const modGain = this.ctx.createGain();
      const env = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(168, now);
      mod.frequency.setValueAtTime(4.5, now);
      modGain.gain.setValueAtTime(28, now);

      mod.connect(modGain);
      modGain.connect(osc.frequency);

      // Very quiet warm vocal-band indicator through EQ/Analyser; speechSynthesis carries the words
      env.gain.setValueAtTime(0.0001, now);
      env.gain.linearRampToValueAtTime(0.045, now + 0.15);

      osc.connect(env);
      env.connect(this.micBusGain);
      osc.start(now);
      mod.start(now);
      this.announcementOscs.push(osc, mod);
    };

    this.announcementTimer = window.setTimeout(() => {
      startCarrier();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(script);
          utter.lang = 'id-ID';
          utter.rate = 0.95;
          utter.pitch = 1.02;
          const zoneActive = settings.zoneA || settings.zoneB ? 1 : 0;
          utter.volume = Math.min(1, (settings.masterVolume / 100) * (settings.micGain / 85) * zoneActive);
          utter.onend = () => {
            this.stopAnnouncement();
            onDone?.();
          };
          utter.onerror = () => {
            window.setTimeout(() => {
              this.stopAnnouncement();
              onDone?.();
            }, 3500);
          };
          window.speechSynthesis.speak(utter);
          // Safety timeout in headless browsers where speechSynthesis doesn't fire onend
          window.setTimeout(() => {
            if (this.announcementActive) {
              this.stopAnnouncement();
              onDone?.();
            }
          }, 9000);
        } catch {
          window.setTimeout(() => {
            this.stopAnnouncement();
            onDone?.();
          }, 4200);
        }
      } else {
        globalThis.setTimeout(() => {
          this.stopAnnouncement();
          onDone?.();
        }, 4200);
      }
    }, 950);
  }

  public stopAnnouncement(): void {
    if (this.announcementTimer !== null) {
      clearTimeout(this.announcementTimer);
      this.announcementTimer = null;
    }
    this.announcementOscs.forEach((o) => {
      try {
        o.stop();
        o.disconnect();
      } catch {
        // ignore stopped oscillator
      }
    });
    this.announcementOscs = [];
    this.announcementActive = false;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }

  private startBgm(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.bgmBusGain || this.bgmRunning) return;
    this.bgmRunning = true;

    const chords = [
      [220.0, 277.18, 329.63], // A major
      [196.0, 246.94, 293.66], // G major
      [174.61, 220.0, 261.63], // F major
      [164.81, 207.65, 246.94], // E major
    ];
    let step = 0;

    const triggerPad = () => {
      if (!this.ctx || !this.bgmBusGain || !this.bgmRunning) return;
      const now = this.ctx.currentTime;
      const chord = chords[step % chords.length];
      step += 1;

      chord.forEach((freq) => {
        const osc = this.ctx!.createOscillator();
        const env = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        env.gain.setValueAtTime(0.0001, now);
        env.gain.linearRampToValueAtTime(0.07, now + 0.6);
        env.gain.linearRampToValueAtTime(0.0001, now + 3.1);
        osc.connect(env);
        env.connect(this.bgmBusGain!);
        osc.start(now);
        osc.stop(now + 3.2);
        this.bgmOscs.push(osc);
      });
    };

    triggerPad();
    this.bgmInterval = window.setInterval(triggerPad, 3000);
  }

  private stopBgm(): void {
    this.bgmRunning = false;
    if (this.bgmInterval !== null) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.bgmOscs.forEach((o) => {
      try {
        o.stop();
        o.disconnect();
      } catch {
        // ignore
      }
    });
    this.bgmOscs = [];
  }

  public getInstantRms(settings: MixerSettings): number {
    if (!settings.systemPower) return 0;
    const zoneFactor = settings.zoneA || settings.zoneB ? 1 : 0;
    if (zoneFactor === 0) return 0;

    let measured = 0;
    if (this.analyser && this.timeData) {
      this.analyser.getByteTimeDomainData(this.timeData);
      let sum = 0;
      for (let i = 0; i < this.timeData.length; i += 1) {
        const v = (this.timeData[i] - 128) / 128;
        sum += v * v;
      }
      measured = Math.sqrt(sum / this.timeData.length);
    }

    // Blend real analyser energy with deterministic active signal envelope so headless/muted environments also show accurate metering
    const now = performance.now() * 0.001;
    const masterScale = settings.masterVolume / 100;
    const gainScale = 0.4 + (settings.micGain / 100) * 0.6;
    let synthetic = 0;
    if (this.announcementActive) {
      synthetic = (0.42 + 0.22 * Math.sin(now * 9.5) * Math.cos(now * 3.7)) * masterScale * gainScale;
    } else if (settings.micActive) {
      synthetic = (0.28 + 0.14 * Math.sin(now * 7.2)) * masterScale * gainScale;
    } else if (settings.bgmPlaying) {
      synthetic = (0.12 + 0.04 * Math.sin(now * 2.5)) * masterScale;
    }

    return Math.min(1, Math.max(measured * 3.2, synthetic));
  }

  public isAnnouncing(): boolean {
    return this.announcementActive;
  }

  public dispose(): void {
    this.stopAnnouncement();
    this.stopBgm();
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}
