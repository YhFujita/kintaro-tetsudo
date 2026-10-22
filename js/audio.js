/**
 * きんたろうてつどう - Web Audio API サウンド＆BGMシンセサイザー
 * 外部音声ファイル不要で、サイコロ・汽車移動・目的地ファンファーレ・貧乏神テーマ等を演奏します。
 */
window.KT = window.KT || {};

(function () {
  let ctx = null;
  let muted = false;
  let bgmPlaying = false;
  let bgmTimer = null;
  let currentBgmMode = 'normal'; // 'normal', 'binbo', 'king', 'kessan'

  function getContext() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) ctx = new AudioCtx();
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function playTone(freq, duration = 0.12, type = 'triangle', volume = 0.16, delay = 0) {
    if (muted) return;
    const audio = getContext();
    if (!audio) return;

    const startTime = audio.currentTime + delay;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  const SE = {
    // ボタンクリック音
    click() {
      playTone(660, 0.07, 'sine', 0.14);
      playTone(880, 0.08, 'triangle', 0.12, 0.04);
    },
    // キャンセル音
    cancel() {
      playTone(440, 0.08, 'triangle', 0.14);
      playTone(330, 0.1, 'triangle', 0.14, 0.05);
    },
    // サイコロ回転音（コロコロ）
    diceTick() {
      const notes = [523, 587, 659, 698, 784, 880, 987, 1046];
      const f = notes[Math.floor(Math.random() * notes.length)];
      playTone(f, 0.05, 'square', 0.08);
    },
    // サイコロ出目決定音（ジャン！）
    diceDecide() {
      playTone(523.25, 0.18, 'triangle', 0.18, 0);
      playTone(659.25, 0.18, 'triangle', 0.18, 0.04);
      playTone(783.99, 0.25, 'triangle', 0.2, 0.08);
      playTone(1046.5, 0.35, 'sine', 0.2, 0.12);
    },
    // 汽車が1マス進む音（シュッシュッ・ポッポー風）
    step() {
      playTone(392, 0.07, 'triangle', 0.14, 0);
      playTone(523.25, 0.09, 'triangle', 0.14, 0.04);
    },
    // 汽笛（出発時）
    whistle() {
      playTone(587.33, 0.35, 'sawtooth', 0.09, 0);
      playTone(783.99, 0.4, 'triangle', 0.14, 0.02);
    },
    // プラス駅・お金獲得（チャリン♪）
    coin() {
      playTone(987.77, 0.09, 'sine', 0.18, 0);
      playTone(1318.51, 0.28, 'sine', 0.2, 0.08);
    },
    // マイナス駅・お金減少（ガーン…）
    minus() {
      playTone(311.13, 0.18, 'sawtooth', 0.14, 0);
      playTone(277.18, 0.18, 'sawtooth', 0.14, 0.16);
      playTone(233.08, 0.4, 'sawtooth', 0.16, 0.32);
    },
    // カード獲得・使用
    card() {
      playTone(523.25, 0.08, 'sine', 0.15, 0);
      playTone(659.25, 0.08, 'sine', 0.15, 0.06);
      playTone(783.99, 0.08, 'sine', 0.15, 0.12);
      playTone(1046.5, 0.22, 'triangle', 0.18, 0.18);
    },
    // 物件購入（お買い上げ♪）
    buy() {
      playTone(523.25, 0.1, 'triangle', 0.16, 0);
      playTone(659.25, 0.1, 'triangle', 0.16, 0.09);
      playTone(783.99, 0.12, 'triangle', 0.18, 0.18);
      playTone(1046.5, 0.3, 'triangle', 0.2, 0.27);
    },
    // 都市独占ファンファーレ！
    monopoly() {
      const notes = [
        [523.25, 0.12, 0],
        [523.25, 0.12, 0.13],
        [523.25, 0.12, 0.26],
        [659.25, 0.25, 0.39],
        [783.99, 0.25, 0.65],
        [1046.5, 0.5, 0.92]
      ];
      notes.forEach(([f, d, t]) => playTone(f, d, 'triangle', 0.2, t));
    },
    // 目的地到着大ファンファーレ！
    goalFanfare() {
      const melody = [
        [523.25, 0.14, 0.0],
        [659.25, 0.14, 0.15],
        [783.99, 0.14, 0.3],
        [1046.5, 0.28, 0.45],
        [783.99, 0.14, 0.75],
        [1046.5, 0.55, 0.92]
      ];
      melody.forEach(([f, d, t]) => {
        playTone(f, d, 'triangle', 0.22, t);
        playTone(f * 0.5, d, 'sine', 0.15, t);
      });
    },
    // ポンコツびんぼう神登場・いたずら音
    binbo() {
      const notes = [
        [261.63, 0.16, 0],
        [246.94, 0.16, 0.18],
        [233.08, 0.16, 0.36],
        [220.0, 0.38, 0.54]
      ];
      notes.forEach(([f, d, t]) => playTone(f, d, 'sawtooth', 0.15, t));
    },
    // 大魔王ドカン神の雷ドカン音
    kingShock() {
      const notes = [
        [146.83, 0.2, 0],
        [138.59, 0.2, 0.18],
        [110.0, 0.45, 0.36],
        [98.0, 0.6, 0.6]
      ];
      notes.forEach(([f, d, t]) => playTone(f, d, 'sawtooth', 0.22, t));
    },
    // 決算グラフ上昇音
    graphTick(pitchIndex = 0) {
      const f = 330 + Math.min(pitchIndex * 25, 900);
      playTone(f, 0.06, 'sine', 0.1);
    }
  };

  // ポップで楽しいBGMループ（外部音源不要）
  const BGM_PATTERNS = {
    normal: [
      523.25, 659.25, 783.99, 659.25,
      587.33, 698.46, 880.0, 698.46,
      523.25, 659.25, 783.99, 1046.5,
      783.99, 659.25, 587.33, 523.25
    ],
    binbo: [
      220.0, 261.63, 246.94, 220.0,
      196.0, 233.08, 220.0, 196.0
    ],
    king: [
      146.83, 155.56, 146.83, 130.81,
      146.83, 174.61, 164.81, 130.81
    ],
    kessan: [
      523.25, 587.33, 659.25, 783.99,
      880.0, 783.99, 659.25, 1046.5
    ]
  };

  let bgmStep = 0;

  function startBgm(mode = 'normal') {
    currentBgmMode = mode;
    if (bgmPlaying) return;
    bgmPlaying = true;
    bgmStep = 0;
    bgmTimer = setInterval(() => {
      if (muted) return;
      const pattern = BGM_PATTERNS[currentBgmMode] || BGM_PATTERNS.normal;
      const freq = pattern[bgmStep % pattern.length];
      const wave = currentBgmMode === 'king' ? 'sawtooth' : 'triangle';
      playTone(freq, 0.22, wave, 0.045, 0);
      bgmStep++;
    }, 320);
  }

  function setBgmMode(mode) {
    currentBgmMode = mode;
  }

  function stopBgm() {
    bgmPlaying = false;
    if (bgmTimer) {
      clearInterval(bgmTimer);
      bgmTimer = null;
    }
  }

  function toggleMute() {
    muted = !muted;
    return muted;
  }

  KT.audio = {
    SE,
    startBgm,
    stopBgm,
    setBgmMode,
    toggleMute,
    isMuted: () => muted
  };
})();
