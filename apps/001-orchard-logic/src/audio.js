/* ============================================================================
 * Orchard Logic — Studio-Grade Procedural Web Audio Soundtrack & SFX Engine (v2)
 * - Sample-accurate Web Audio lookahead scheduler (zero setInterval jitter)
 * - 4-section (A -> B -> C -> D) ~64-second evolving acoustic soundtrack
 * - Warm stereo delay/reverb tail for felt piano pads, marimba & kalimba
 * - Ascending 1..10 combo pentatonic fruit scale + locked/resolve/victory SFX
 * - 100% offline, zero external audio files, iOS WKWebView safe
 * ============================================================================ */

const N = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, Bb3: 233.08,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, Bb4: 466.16,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, C6: 1046.50
};

// 10-step ascending pentatonic combo scale (builds musical joy from 1st -> 10th fruit!)
const COMBO_SCALE = [
  N.F4, N.G4, N.A4, N.C5, N.D5, N.E5, N.F5, N.G5, N.A5, N.C6
];

// 4-Section Evolving Menu Soundtrack (16 bars = 128 eighth-notes ≈ 51s loop)
const MENU_SECTIONS = [
  // Section A: Sunny Orchard Opening (Fmaj7 - Dm7 - Bbmaj7 - C9)
  {
    chords: [
      [N.F3, N.A3, N.C4, N.E4],
      [N.D3, N.F3, N.A3, N.C4],
      [N.Bb3 * 0.5, N.D3, N.F3, N.A3],
      [N.C3, N.G3, N.Bb3, N.D4]
    ],
    melody: [
      N.A4, null, N.C5, N.F5, N.E5, null, N.C5, null,
      N.F4, N.A4, N.D5, null, N.C5, N.A4, N.G4, null,
      N.D4, null, N.F4, N.A4, N.Bb4, null, N.A4, N.F4,
      N.G4, null, N.C5, N.D5, N.C5, null, N.A4, null
    ]
  },
  // Section B: Brighter Canopy Lift (Am7 - Dm9 - Gm7 - C7sus4)
  {
    chords: [
      [N.A3 * 0.5, N.E3, N.G3, N.C4],
      [N.D3, N.F3, N.A3, N.E4],
      [N.G3 * 0.5, N.D3, N.F3, N.Bb3],
      [N.C3, N.F3, N.G3, N.C4]
    ],
    melody: [
      N.E5, null, N.C5, N.A4, N.G4, null, N.C5, null,
      N.F5, null, N.E5, N.D5, N.A4, null, null, null,
      N.D5, N.Bb4, N.A4, null, N.G4, N.A4, N.Bb4, null,
      N.C5, null, N.A4, N.G4, N.F4, null, null, null
    ]
  },
  // Section C: Gentle Breathing Interlude (sparse, airy pads)
  {
    chords: [
      [N.Bb3 * 0.5, N.F3, N.A3, N.D4],
      [N.F3, N.A3, N.C4],
      [N.G3 * 0.5, N.D3, N.F3, N.A3],
      [N.C3, N.E3, N.G3, N.Bb3]
    ],
    melody: [
      N.D5, null, null, N.A4, null, null, N.F4, null,
      N.C5, null, null, null, N.A4, null, null, null,
      N.Bb4, null, N.A4, null, N.G4, null, N.F4, null,
      N.G4, null, null, N.C5, null, null, null, null
    ]
  },
  // Section D: Warm Resolution (Dm7 - Bbmaj7 - Fmaj7/C - C9)
  {
    chords: [
      [N.D3, N.A3, N.C4, N.F4],
      [N.Bb3 * 0.5, N.D3, N.F3, N.A3],
      [N.C3, N.F3, N.A3, N.E4],
      [N.C3, N.G3, N.Bb3, N.E4]
    ],
    melody: [
      N.A4, N.D5, N.F5, null, N.E5, N.C5, N.A4, null,
      N.F4, null, N.A4, N.D5, N.C5, null, N.Bb4, null,
      N.A4, null, N.C5, N.E5, N.F5, null, N.C5, null,
      N.G4, null, N.A4, null, N.G4, null, null, null
    ]
  }
];

// 4-Section Calm In-Game Focus Soundtrack (128 steps * 0.50s = 64 seconds!)
const GAME_SECTIONS = [
  // Section A: Meditative Kalimba Pulse
  {
    chords: [
      [N.D3, N.A3, N.F4],
      [N.Bb3 * 0.5, N.F3, N.D4],
      [N.F3, N.C4, N.A4],
      [N.C3, N.G3, N.E4]
    ],
    melody: [
      N.A4, null, N.F4, null, N.G4, null, N.A4, null,
      N.D5, null, N.Bb4, null, N.A4, null, N.F4, null,
      N.C5, null, N.A4, null, N.G4, null, N.F4, null,
      N.G4, null, null, N.E4, N.G4, null, null, null
    ]
  },
  // Section B: Quiet Reflection (spacious rest bars to avoid fatigue!)
  {
    chords: [
      [N.G3 * 0.5, N.D3, N.Bb3],
      [N.D3, N.A3, N.F4],
      [N.Bb3 * 0.5, N.F3, N.A3],
      [N.A3 * 0.5, N.E3, N.C4]
    ],
    melody: [
      N.Bb4, null, null, N.G4, null, null, N.D4, null,
      N.F4, null, null, null, N.A4, null, null, null,
      N.D5, null, N.C5, null, N.A4, null, null, null,
      N.E4, null, null, N.A4, null, null, null, null
    ]
  },
  // Section C: Sunlit Deduction Flow (gentle melodic rise)
  {
    chords: [
      [N.F3, N.A3, N.E4],
      [N.C3, N.G3, N.D4],
      [N.D3, N.A3, N.F4],
      [N.Bb3 * 0.5, N.F3, N.D4]
    ],
    melody: [
      N.C5, null, N.A4, N.C5, N.E5, null, N.C5, null,
      N.D5, null, N.G4, null, N.A4, null, null, null,
      N.F5, null, N.D5, null, N.A4, null, N.F4, null,
      N.D4, null, N.F4, null, N.A4, null, null, null
    ]
  },
  // Section D: Soft Breathing Horizon (minimalist calm before cycling)
  {
    chords: [
      [N.D3, N.F3, N.C4],
      [N.G3 * 0.5, N.D3, N.A3],
      [N.Bb3 * 0.5, N.F3, N.C4],
      [N.C3, N.G3, N.E4]
    ],
    melody: [
      null, null, N.A4, null, null, null, N.F4, null,
      null, null, N.G4, null, N.D4, null, null, null,
      N.F4, null, null, N.A4, null, null, N.C5, null,
      null, null, N.G4, null, null, null, null, null
    ]
  }
];

class OrchardAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.delayNode = null;
    this.musicEnabled = true;
    this.sfxEnabled = true;
    this.mode = 'menu';
    this.stepIndex = 0;
    this.nextNoteTime = 0;
    this.schedulerTimer = null;
    this.unlocked = false;
    this.listeners = new Set();
    this._boundUnlock = null;
    this._boundVis = null;
  }

  init({ musicEnabled = true, sfxEnabled = true } = {}) {
    this.musicEnabled = Boolean(musicEnabled);
    this.sfxEnabled = Boolean(sfxEnabled);

    if (!this._boundUnlock) {
      this._boundUnlock = () => this.unlock();
      window.addEventListener('pointerdown', this._boundUnlock, { passive: true });
      window.addEventListener('keydown', this._boundUnlock, { passive: true });
    }

    if (!this._boundVis) {
      this._boundVis = () => {
        if (!this.ctx) return;
        if (document.hidden) {
          this.ctx.suspend().catch(() => {});
        } else if (this.unlocked && (this.musicEnabled || this.sfxEnabled)) {
          this.ctx.resume().then(() => {
            if (this.musicEnabled) {
              this.nextNoteTime = this.ctx.currentTime + 0.08;
              this._startScheduler();
            }
          }).catch(() => {});
        }
      };
      document.addEventListener('visibilitychange', this._boundVis);
    }

    this._notify();
  }

  _ensureContext() {
    if (this.ctx) return true;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;
    try {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.88;
      this.masterGain.connect(this.ctx.destination);

      // Music bus with warm TRUE STEREO cross-fed ping-pong delay tail
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicEnabled ? this._targetMusicVolume() : 0.0001;
      this.musicGain.connect(this.masterGain);

      this.delayNode = this.ctx.createDelay(1.0);
      this.delayNode.delayTime.value = 0.29;
      this.delayRight = this.ctx.createDelay(1.0);
      this.delayRight.delayTime.value = 0.41;

      const filterL = this.ctx.createBiquadFilter();
      filterL.type = 'lowpass';
      filterL.frequency.value = 1150;
      const filterR = this.ctx.createBiquadFilter();
      filterR.type = 'lowpass';
      filterR.frequency.value = 1050;

      const fbL = this.ctx.createGain();
      fbL.gain.value = 0.22;
      const fbR = this.ctx.createGain();
      fbR.gain.value = 0.22;

      const merger = this.ctx.createChannelMerger(2);
      const wetGain = this.ctx.createGain();
      wetGain.gain.value = 0.30;

      this.musicGain.connect(this.delayNode);
      this.musicGain.connect(this.delayRight);
      this.delayNode.connect(filterL);
      this.delayRight.connect(filterR);
      // Cross-feed Left <-> Right for organic stereo width
      filterL.connect(fbL);
      fbL.connect(this.delayRight);
      filterR.connect(fbR);
      fbR.connect(this.delayNode);

      filterL.connect(merger, 0, 0);
      filterR.connect(merger, 0, 1);
      merger.connect(wetGain);
      wetGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxEnabled ? 0.56 : 0.0001;
      this.sfxGain.connect(this.masterGain);
      return true;
    } catch {
      return false;
    }
  }

  _targetMusicVolume() {
    return this.mode === 'game' ? 0.20 : 0.26;
  }

  _stepDurationSec() {
    return this.mode === 'game' ? 0.50 : 0.40; // 64s game cycle, 51.2s menu cycle
  }

  unlock() {
    if (!this._ensureContext()) return;
    this.unlocked = true;
    const boot = () => {
      if (this.musicEnabled && !this.schedulerTimer) {
        this.nextNoteTime = this.ctx.currentTime + 0.06;
        this._startScheduler();
      }
    };
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().then(boot).catch(() => {});
    } else {
      boot();
    }
  }

  setMode(nextMode) {
    const normalized = nextMode === 'game' ? 'game' : 'menu';
    if (this.mode === normalized) return;
    this.mode = normalized;
    this.stepIndex = 0;

    if (this.ctx && this.musicGain && this.musicEnabled) {
      const now = this.ctx.currentTime;
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setTargetAtTime(this._targetMusicVolume(), now, 0.35);
      this.nextNoteTime = now + 0.08;
    }
  }

  setMusicEnabled(enabled) {
    this.musicEnabled = Boolean(enabled);
    if (this.musicEnabled) {
      this.unlock();
      if (this.ctx && this.musicGain) {
        const now = this.ctx.currentTime;
        this.musicGain.gain.cancelScheduledValues(now);
        this.musicGain.gain.setTargetAtTime(this._targetMusicVolume(), now, 0.22);
        this.nextNoteTime = now + 0.06;
      }
      this._startScheduler();
    } else {
      if (this.ctx && this.musicGain) {
        const now = this.ctx.currentTime;
        this.musicGain.gain.cancelScheduledValues(now);
        this.musicGain.gain.setTargetAtTime(0.0001, now, 0.14);
      }
      this._stopScheduler();
    }
    this._notify();
  }

  setSfxEnabled(enabled) {
    this.sfxEnabled = Boolean(enabled);
    if (this.ctx && this.sfxGain) {
      const now = this.ctx.currentTime;
      this.sfxGain.gain.cancelScheduledValues(now);
      this.sfxGain.gain.setTargetAtTime(this.sfxEnabled ? 0.56 : 0.0001, now, 0.05);
    }
    this._notify();
  }

  isMusicEnabled() {
    return this.musicEnabled;
  }

  isSfxEnabled() {
    return this.sfxEnabled;
  }

  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  _notify() {
    this.listeners.forEach((fn) => fn({ music: this.musicEnabled, sfx: this.sfxEnabled, mode: this.mode }));
  }

  _startScheduler() {
    if (this.schedulerTimer || !this.musicEnabled || !this.ctx) return;
    this.schedulerTimer = setInterval(() => this._scheduleAhead(), 50);
    this._scheduleAhead();
  }

  _stopScheduler() {
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
  }

  _scheduleAhead() {
    if (!this.musicEnabled || !this.ctx || this.ctx.state !== 'running' || document.hidden) return;
    const lookahead = 0.16;
    // Recover cleanly if tab resumed after a long gap
    if (this.nextNoteTime < this.ctx.currentTime - 0.5) {
      this.nextNoteTime = this.ctx.currentTime + 0.05;
    }
    while (this.nextNoteTime < this.ctx.currentTime + lookahead) {
      this._scheduleStep(this.stepIndex, this.nextNoteTime);
      this.nextNoteTime += this._stepDurationSec();
      this.stepIndex = (this.stepIndex + 1) % 128;
    }
  }

  _scheduleStep(globalStep, time) {
    const isGame = this.mode === 'game';
    const sections = isGame ? GAME_SECTIONS : MENU_SECTIONS;
    const secIdx = Math.floor(globalStep / 32) % sections.length;
    const localStep = globalStep % 32;
    const section = sections[secIdx];
    const chordIdx = Math.floor(localStep / 8) % section.chords.length;

    // Warm breathing felt-pad chord on every bar downbeat
    if (localStep % 8 === 0) {
      const chord = section.chords[chordIdx];
      chord.forEach((freq, i) => {
        this._playPadVoice(freq, time + i * 0.035, isGame ? 3.8 : 3.0, isGame ? 0.085 : 0.10);
      });
    }

    // Soft bass root pulse on beat 5 (middle of bar) in sections A & D
    if (localStep % 8 === 4 && (secIdx === 0 || secIdx === 3)) {
      const root = section.chords[chordIdx][0];
      this._playPadVoice(root, time, 1.4, 0.055);
    }

    // Acoustic marimba / kalimba melody pluck
    const noteFreq = section.melody[localStep];
    if (noteFreq) {
      this._playMarimbaVoice(noteFreq, time, isGame ? 0.72 : 0.58, isGame ? 0.13 : 0.16);
    }
  }

  _playPadVoice(freq, startTime, duration, peakGain) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(860, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.55);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  _playMarimbaVoice(freq, startTime, duration, peakGain) {
    const osc = this.ctx.createOscillator();
    const overtone = this.ctx.createOscillator();
    const overGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);
    overtone.type = 'sine';
    overtone.frequency.setValueAtTime(freq * 2, startTime);
    overGain.gain.setValueAtTime(0.16, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1550, startTime);
    filter.frequency.exponentialRampToValueAtTime(480, startTime + duration);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(filter);
    overtone.connect(overGain);
    overGain.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(startTime);
    overtone.start(startTime);
    osc.stop(startTime + duration + 0.04);
    overtone.stop(startTime + duration + 0.04);
  }

  _playSfxTone({ freq, endFreq = null, type = 'triangle', duration = 0.14, gainPeak = 0.28, delay = 0 }) {
    if (!this.sfxEnabled) return;
    if (!this._ensureContext()) return;
    const trigger = () => {
      if (!this.ctx || !this.sfxGain) return;
      const now = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(gainPeak, now + 0.009);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + duration + 0.03);
    };

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().then(trigger).catch(() => {});
    } else {
      trigger();
    }
  }

  sfx = {
    uiTap: () => {
      this._playSfxTone({ freq: 520, endFreq: 420, type: 'sine', duration: 0.06, gainPeak: 0.15 });
    },
    markX: () => {
      this._playSfxTone({ freq: 380, endFreq: 315, type: 'triangle', duration: 0.052, gainPeak: 0.14 });
    },
    clearCell: () => {
      this._playSfxTone({ freq: 310, endFreq: 215, type: 'sine', duration: 0.08, gainPeak: 0.16 });
    },
    locked: () => {
      // Soft muted wood knock indicating cell is locked by an active fruit
      this._playSfxTone({ freq: 240, endFreq: 195, type: 'sine', duration: 0.055, gainPeak: 0.18 });
    },
    placeFruit: (placedCount = 1, totalNeeded = 10) => {
      // Ascending pentatonic combo pitch as board fills toward victory!
      const ratio = Math.max(0, Math.min(1, (Math.max(1, placedCount) - 1) / Math.max(1, totalNeeded - 1)));
      const idx = Math.min(COMBO_SCALE.length - 1, Math.round(ratio * (COMBO_SCALE.length - 1)));
      const base = COMBO_SCALE[idx];
      this._playSfxTone({ freq: base, type: 'triangle', duration: 0.21, gainPeak: 0.25 });
      this._playSfxTone({ freq: base * 1.5, type: 'sine', duration: 0.24, gainPeak: 0.14, delay: 0.045 });
    },
    conflict: () => {
      this._playSfxTone({ freq: 205, endFreq: 160, type: 'triangle', duration: 0.13, gainPeak: 0.25 });
      this._playSfxTone({ freq: 170, endFreq: 132, type: 'triangle', duration: 0.15, gainPeak: 0.21, delay: 0.085 });
    },
    conflictResolved: () => {
      this._playSfxTone({ freq: N.C5, type: 'sine', duration: 0.12, gainPeak: 0.14 });
      this._playSfxTone({ freq: N.F5, type: 'sine', duration: 0.16, gainPeak: 0.14, delay: 0.05 });
    },
    undo: () => {
      this._playSfxTone({ freq: 440, endFreq: 310, type: 'sine', duration: 0.085, gainPeak: 0.16 });
    },
    hint: () => {
      this._playSfxTone({ freq: N.C5, type: 'sine', duration: 0.18, gainPeak: 0.20, delay: 0 });
      this._playSfxTone({ freq: N.E5, type: 'sine', duration: 0.18, gainPeak: 0.20, delay: 0.07 });
      this._playSfxTone({ freq: N.G5, type: 'triangle', duration: 0.28, gainPeak: 0.22, delay: 0.14 });
    },
    victory: () => {
      const fanfare = [N.F4, N.A4, N.C5, N.E5, N.F5, N.A5, N.C6];
      fanfare.forEach((f, idx) => {
        this._playSfxTone({
          freq: f,
          type: idx % 2 === 0 ? 'triangle' : 'sine',
          duration: idx === fanfare.length - 1 ? 0.85 : 0.24,
          gainPeak: 0.24,
          delay: idx * 0.08
        });
      });
    }
  };
}

export const gameAudio = new OrchardAudioEngine();
