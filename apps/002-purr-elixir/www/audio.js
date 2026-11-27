/* ============================================================================
 * Purr Elixir — Procedural Sunlit Apothecary Music Box & Crystal SFX Engine
 * - 100% offline Web Audio API (zero external audio files, iOS WKWebView safe)
 * - Bright C Major / A Minor / G Lydian music-box celesta + warm harp pad
 * - Pitch-rising liquid pour cascade, hollow cork pop, ascending combo bells,
 *   and expressive cat meow / purr synthesis
 * ============================================================================ */

const NOTE = {
  G2: 98.0, A2: 110.0, C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77, C6: 1046.5, D6: 1174.66, E6: 1318.5
};

const COMBO_ARPEGGIO = [
  NOTE.C5, NOTE.D5, NOTE.E5, NOTE.G5, NOTE.A5, NOTE.B5, NOTE.C6, NOTE.E6
];

// Breezy sunlit lavender apothecary music box (4 evolving sections, ~54s full cycle)
const MENU_SECTIONS = [
  {
    chords: [
      [NOTE.C3, NOTE.G3, NOTE.B3, NOTE.E4],
      [NOTE.A2, NOTE.E3, NOTE.G3, NOTE.C4],
      [NOTE.F3, NOTE.C4, NOTE.E4, NOTE.A4],
      [NOTE.G2, NOTE.D3, NOTE.B3, NOTE.D4]
    ],
    melody: [
      NOTE.E5, null, NOTE.G5, NOTE.C6, NOTE.B5, null, NOTE.G5, null,
      NOTE.E5, NOTE.G5, NOTE.A5, null, NOTE.G5, NOTE.E5, NOTE.D5, null,
      NOTE.C5, null, NOTE.E5, NOTE.A5, NOTE.G5, null, NOTE.E5, NOTE.C5,
      NOTE.D5, null, NOTE.G5, NOTE.B5, NOTE.A5, null, NOTE.G5, null
    ]
  },
  {
    chords: [
      [NOTE.E3, NOTE.B3, NOTE.D4, NOTE.G4],
      [NOTE.A2, NOTE.E3, NOTE.B3, NOTE.C4],
      [NOTE.D3, NOTE.A3, NOTE.C4, NOTE.F4],
      [NOTE.G2, NOTE.D3, NOTE.A3, NOTE.B3]
    ],
    melody: [
      NOTE.B5, null, NOTE.G5, NOTE.E5, NOTE.D5, null, NOTE.G5, null,
      NOTE.C6, null, NOTE.B5, NOTE.A5, NOTE.E5, null, null, null,
      NOTE.A5, NOTE.F5, NOTE.E5, null, NOTE.D5, NOTE.E5, NOTE.F5, null,
      NOTE.G5, null, NOTE.E5, NOTE.D5, NOTE.C5, null, null, null
    ]
  },
  {
    chords: [
      [NOTE.F3, NOTE.C4, NOTE.E4, NOTE.A4],
      [NOTE.G2, NOTE.D3, NOTE.B3, NOTE.F4],
      [NOTE.E3, NOTE.B3, NOTE.D4, NOTE.G4],
      [NOTE.A2, NOTE.E3, NOTE.G3, NOTE.C4]
    ],
    melody: [
      NOTE.A5, null, NOTE.C6, NOTE.D6, NOTE.C6, null, NOTE.A5, NOTE.G5,
      NOTE.B5, null, NOTE.G5, NOTE.D5, NOTE.G5, null, NOTE.A5, null,
      NOTE.G5, NOTE.B5, NOTE.D6, null, NOTE.B5, null, NOTE.G5, NOTE.E5,
      NOTE.A5, null, NOTE.E5, NOTE.C5, NOTE.E5, null, null, null
    ]
  },
  {
    chords: [
      [NOTE.D3, NOTE.A3, NOTE.C4, NOTE.F4],
      [NOTE.F3, NOTE.C4, NOTE.E4, NOTE.A4],
      [NOTE.G2, NOTE.D3, NOTE.A3, NOTE.B3],
      [NOTE.C3, NOTE.G3, NOTE.D4, NOTE.E4]
    ],
    melody: [
      NOTE.F5, null, NOTE.A5, NOTE.C6, NOTE.A5, null, NOTE.F5, null,
      NOTE.E5, NOTE.G5, NOTE.A5, NOTE.C6, NOTE.B5, null, NOTE.A5, null,
      NOTE.G5, null, NOTE.D5, NOTE.G5, NOTE.A5, NOTE.B5, NOTE.G5, null,
      NOTE.E5, null, NOTE.G5, NOTE.E5, NOTE.C5, null, null, null
    ]
  }
];

// Calm glass-harp & celesta focus ambience for puzzle play (4 evolving sections, ~66s full cycle)
const GAME_SECTIONS = [
  {
    chords: [
      [NOTE.C3, NOTE.G3, NOTE.E4],
      [NOTE.F3, NOTE.C4, NOTE.A4],
      [NOTE.A2, NOTE.E3, NOTE.C4],
      [NOTE.G2, NOTE.D3, NOTE.B3]
    ],
    melody: [
      NOTE.G5, null, NOTE.E5, null, NOTE.C5, null, NOTE.E5, null,
      NOTE.A5, null, NOTE.F5, null, NOTE.E5, null, null, null,
      NOTE.E5, null, NOTE.C5, null, NOTE.D5, null, NOTE.G5, null,
      NOTE.D5, null, null, NOTE.B4, null, null, null, null
    ]
  },
  {
    chords: [
      [NOTE.D3, NOTE.A3, NOTE.F4],
      [NOTE.G2, NOTE.D3, NOTE.B3],
      [NOTE.C3, NOTE.G3, NOTE.E4],
      [NOTE.A2, NOTE.E3, NOTE.G3]
    ],
    melody: [
      NOTE.F5, null, null, NOTE.D5, null, null, NOTE.A4, null,
      NOTE.G5, null, NOTE.D5, null, NOTE.B4, null, null, null,
      NOTE.E5, null, NOTE.G5, null, NOTE.C6, null, NOTE.G5, null,
      NOTE.E5, null, null, null, NOTE.D5, null, null, null
    ]
  },
  {
    chords: [
      [NOTE.F3, NOTE.C4, NOTE.E4],
      [NOTE.E3, NOTE.B3, NOTE.G4],
      [NOTE.D3, NOTE.A3, NOTE.F4],
      [NOTE.C3, NOTE.G3, NOTE.E4]
    ],
    melody: [
      NOTE.A5, null, NOTE.G5, null, NOTE.E5, null, null, null,
      NOTE.B5, null, NOTE.G5, null, NOTE.E5, null, NOTE.D5, null,
      NOTE.F5, null, NOTE.A5, null, NOTE.G5, null, NOTE.F5, null,
      NOTE.E5, null, NOTE.C5, null, null, null, null, null
    ]
  },
  {
    chords: [
      [NOTE.A2, NOTE.E3, NOTE.C4],
      [NOTE.F3, NOTE.C4, NOTE.A4],
      [NOTE.D3, NOTE.A3, NOTE.C4],
      [NOTE.G2, NOTE.D3, NOTE.B3]
    ],
    melody: [
      NOTE.C6, null, NOTE.A5, null, NOTE.E5, null, null, null,
      NOTE.A5, null, NOTE.F5, null, NOTE.C5, null, NOTE.E5, null,
      NOTE.F5, null, NOTE.E5, null, NOTE.D5, null, NOTE.A4, null,
      NOTE.B4, null, NOTE.D5, null, NOTE.G5, null, null, null
    ]
  }
];

const MEOW_PITCH_BY_TONE = Object.freeze({
  cheerful: [640, 880, 590],
  playful: [700, 960, 640],
  mystic: [520, 690, 480],
  serene: [560, 720, 520],
  wise: [480, 620, 450],
  regal: [620, 820, 560]
});

class PurrAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
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

    if (!this._boundUnlock && typeof window !== 'undefined') {
      this._boundUnlock = () => this.unlock();
      window.addEventListener('pointerdown', this._boundUnlock, { passive: true });
      window.addEventListener('keydown', this._boundUnlock, { passive: true });
    }

    if (!this._boundVis && typeof document !== 'undefined') {
      this._boundVis = () => {
        if (!this.ctx) return;
        if (document.hidden) {
          this.ctx.suspend().catch(() => {});
        } else if (this.unlocked && (this.musicEnabled || this.sfxEnabled)) {
          this.ctx
            .resume()
            .then(() => {
              if (this.musicEnabled) {
                this.nextNoteTime = this.ctx.currentTime + 0.08;
                this._startScheduler();
              }
            })
            .catch(() => {});
        }
      };
      document.addEventListener('visibilitychange', this._boundVis);
    }

    this._notify();
  }

  _ensureContext() {
    if (this.ctx) return true;
    const AudioCtx = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
    if (!AudioCtx) return false;
    try {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.85;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicEnabled ? this._targetMusicVolume() : 0.0001;
      this.musicGain.connect(this.masterGain);

      // Gentle crystalline delay shimmer for music box
      const delay = this.ctx.createDelay(1.0);
      delay.delayTime.value = 0.34;
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1800;
      const wet = this.ctx.createGain();
      wet.gain.value = 0.24;
      const fb = this.ctx.createGain();
      fb.gain.value = 0.22;

      this.musicGain.connect(delay);
      delay.connect(lp);
      lp.connect(fb);
      fb.connect(delay);
      lp.connect(wet);
      wet.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxEnabled ? 0.56 : 0.0001;
      this.sfxGain.connect(this.masterGain);
      return true;
    } catch {
      return false;
    }
  }

  _targetMusicVolume() {
    return this.mode === 'game' ? 0.17 : 0.22;
  }

  _stepDurationSec() {
    return this.mode === 'game' ? 0.52 : 0.42;
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
      this.musicGain.gain.setTargetAtTime(this._targetMusicVolume(), now, 0.3);
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
        this.musicGain.gain.setTargetAtTime(this._targetMusicVolume(), now, 0.2);
        this.nextNoteTime = now + 0.06;
      }
      this._startScheduler();
    } else {
      if (this.ctx && this.musicGain) {
        const now = this.ctx.currentTime;
        this.musicGain.gain.cancelScheduledValues(now);
        this.musicGain.gain.setTargetAtTime(0.0001, now, 0.12);
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
    if (this.nextNoteTime < this.ctx.currentTime - 0.5) {
      this.nextNoteTime = this.ctx.currentTime + 0.05;
    }
    while (this.nextNoteTime < this.ctx.currentTime + 0.16) {
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

    if (localStep % 8 === 0) {
      const chord = section.chords[chordIdx];
      chord.forEach((freq, i) => {
        this._playHarpPad(freq, time + i * 0.04, isGame ? 3.5 : 2.7, isGame ? 0.075 : 0.09);
      });
    }

    const noteFreq = section.melody[localStep];
    if (noteFreq) {
      this._playCelestaVoice(noteFreq, time, isGame ? 0.85 : 0.65, isGame ? 0.11 : 0.14);
    }
  }

  _playHarpPad(freq, startTime, duration, peakGain) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1100, startTime);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.32);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  _playCelestaVoice(freq, startTime, duration, peakGain) {
    const osc = this.ctx.createOscillator();
    const bell = this.ctx.createOscillator();
    const bellGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);
    bell.type = 'triangle';
    bell.frequency.setValueAtTime(freq * 2, startTime);
    bellGain.gain.setValueAtTime(0.18, startTime);
    bellGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.45);

    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    bell.connect(bellGain);
    bellGain.connect(gain);
    gain.connect(this.musicGain);

    osc.start(startTime);
    bell.start(startTime);
    osc.stop(startTime + duration + 0.04);
    bell.stop(startTime + duration + 0.04);
  }

  _runSfx(fn) {
    if (!this.sfxEnabled) return;
    if (!this._ensureContext()) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        if (this.ctx && this.sfxGain) fn(this.ctx.currentTime);
      }).catch(() => {});
    } else if (this.ctx && this.sfxGain) {
      fn(this.ctx.currentTime);
    }
  }

  _tone(now, { freq, endFreq = null, type = 'sine', duration = 0.14, gainPeak = 0.24, delay = 0 }) {
    const start = now + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, start + duration);

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(gainPeak, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(start);
    osc.stop(start + duration + 0.03);
  }

  sfx = {
    uiTap: () => {
      this._runSfx((now) => {
        this._tone(now, { freq: 620, endFreq: 480, type: 'sine', duration: 0.055, gainPeak: 0.14 });
      });
    },
    select: () => {
      // Bright crystal vial lift clink
      this._runSfx((now) => {
        this._tone(now, { freq: 880, endFreq: 960, type: 'sine', duration: 0.09, gainPeak: 0.17 });
        this._tone(now, { freq: 1320, type: 'triangle', duration: 0.07, gainPeak: 0.08, delay: 0.015 });
      });
    },
    deselect: () => {
      this._runSfx((now) => {
        this._tone(now, { freq: 640, endFreq: 490, type: 'sine', duration: 0.07, gainPeak: 0.13 });
      });
    },
    pour: (layersCount = 1) => {
      // Pitch-rising bubbly liquid pour cascade
      const drops = Math.max(2, Math.min(5, layersCount + 1));
      this._runSfx((now) => {
        for (let i = 0; i < drops; i++) {
          const base = 360 + i * 95;
          this._tone(now, {
            freq: base,
            endFreq: base * 1.42,
            type: 'sine',
            duration: 0.085,
            gainPeak: 0.19,
            delay: i * 0.052
          });
        }
      });
    },
    corkPop: () => {
      // Hollow cork "pop!" + sparkling seal chime
      this._runSfx((now) => {
        this._tone(now, { freq: 240, endFreq: 690, type: 'triangle', duration: 0.07, gainPeak: 0.30 });
        this._tone(now, { freq: NOTE.G5, type: 'sine', duration: 0.18, gainPeak: 0.20, delay: 0.06 });
        this._tone(now, { freq: NOTE.C6, type: 'sine', duration: 0.26, gainPeak: 0.22, delay: 0.12 });
        this._tone(now, { freq: NOTE.E6, type: 'triangle', duration: 0.32, gainPeak: 0.15, delay: 0.18 });
      });
    },
    combo: (comboCount = 2) => {
      const idx = Math.min(COMBO_ARPEGGIO.length - 1, Math.max(0, comboCount - 1));
      const f = COMBO_ARPEGGIO[idx];
      this._runSfx((now) => {
        this._tone(now, { freq: f, type: 'triangle', duration: 0.18, gainPeak: 0.20 });
        this._tone(now, { freq: f * 1.25, type: 'sine', duration: 0.24, gainPeak: 0.16, delay: 0.055 });
      });
    },
    meow: (toneKey = 'cheerful') => {
      const [startF, peakF, endF] = MEOW_PITCH_BY_TONE[toneKey] || MEOW_PITCH_BY_TONE.cheerful;
      this._runSfx((now) => {
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(startF, now);
        osc.frequency.exponentialRampToValueAtTime(peakF, now + 0.09);
        osc.frequency.exponentialRampToValueAtTime(endF, now + 0.26);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1100, now);
        filter.Q.value = 1.6;

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.24, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.30);
      });
    },
    purr: () => {
      this._runSfx((now) => {
        this._tone(now, { freq: 145, endFreq: 168, type: 'sine', duration: 0.22, gainPeak: 0.12 });
      });
    },
    undo: () => {
      this._runSfx((now) => {
        this._tone(now, { freq: 480, endFreq: 320, type: 'sine', duration: 0.09, gainPeak: 0.16 });
      });
    },
    hint: () => {
      this._runSfx((now) => {
        this._tone(now, { freq: NOTE.E5, type: 'sine', duration: 0.16, gainPeak: 0.18, delay: 0 });
        this._tone(now, { freq: NOTE.G5, type: 'sine', duration: 0.18, gainPeak: 0.20, delay: 0.07 });
        this._tone(now, { freq: NOTE.C6, type: 'triangle', duration: 0.28, gainPeak: 0.22, delay: 0.14 });
      });
    },
    extraFlask: () => {
      this._runSfx((now) => {
        [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6].forEach((f, i) => {
          this._tone(now, { freq: f, type: 'sine', duration: 0.22, gainPeak: 0.18, delay: i * 0.055 });
        });
      });
    },
    invalid: () => {
      this._runSfx((now) => {
        this._tone(now, { freq: 210, endFreq: 165, type: 'triangle', duration: 0.09, gainPeak: 0.18 });
      });
    },
    deadlock: () => {
      this._runSfx((now) => {
        this._tone(now, { freq: 340, endFreq: 260, type: 'triangle', duration: 0.14, gainPeak: 0.20 });
        this._tone(now, { freq: 250, endFreq: 195, type: 'sine', duration: 0.18, gainPeak: 0.18, delay: 0.11 });
      });
    },
    victory: () => {
      const notes = [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.B5, NOTE.C6, NOTE.E6];
      this._runSfx((now) => {
        notes.forEach((f, idx) => {
          this._tone(now, {
            freq: f,
            type: idx % 2 === 0 ? 'triangle' : 'sine',
            duration: idx === notes.length - 1 ? 0.85 : 0.24,
            gainPeak: 0.22,
            delay: idx * 0.075
          });
        });
      });
    }
  };
}

export const gameAudio = new PurrAudioEngine();
