/**
 * きんたろうてつどう - オリジナルパロディSVGキャラクター＆列車・サイコロ描画エンジン (Ver 3.2 ポップ＆カワイイ絵本・マスコット風デザイン)
 * ・お子様も思わず笑顔になる、ぷっくり丸くてカラフル・ポップなマスコット風デザイン！
 * ・「きんたろう社長」は車掌さんキャップ・可愛いぬいぐるみ子グマ・キラキラ星ステッキまさかりを持った愛嬌満点のデザイン！
 */
window.KT = window.KT || {};

(function () {
  /**
   * キャラクターSVGを返す
   * @param {string} type - 'kintaro' | 'player1' | 'player2' | 'player3' | 'player4' | 'mame_oni' | 'aka_oni' | 'mecha_oni' | 'binbo' | 'chibi' | 'king' | 'angel' | 'nyanko' | 'namahage' | 'dino' | 'takoyaki' | 'shisa'
   * @param {string} mood - 'normal' | 'happy' | 'sad' | 'shock'
   * @param {number} size - ピクセルサイズ
   */
  function getCharacterSVG(type, mood = 'normal', size = 80) {
    // 共通のポップ＆カワイイ目・口パーツ（怖い白目や歯の線をなくし、ぷるんと可愛い瞳に！）
    const renderEyes = (m, color = '#3e2723') => {
      if (m === 'happy') {
        return `
          <!-- にっこり笑顔のアーチ目 (＾ ＾) -->
          <path d="M31 46 Q37 37 43 46" stroke="${color}" stroke-width="3.6" fill="none" stroke-linecap="round"/>
          <path d="M57 46 Q63 37 69 46" stroke="${color}" stroke-width="3.6" fill="none" stroke-linecap="round"/>
        `;
      }
      if (m === 'sad' || m === 'shock') {
        return `
          <!-- ポップで可愛い「＞ ＜」うるうる目＆丸い涙粒 -->
          <path d="M31 41 L41 45 L31 49" stroke="${color}" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M69 41 L59 45 L69 49" stroke="${color}" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="29" cy="51" r="3.5" fill="#4fc3f7"/>
          <circle cx="71" cy="51" r="3.5" fill="#4fc3f7"/>
        `;
      }
      return `
        <!-- ぷるぷるキラキラの大きな黒目（ダブルハイライト入り） -->
        <ellipse cx="37" cy="45" rx="5.2" ry="6.8" fill="${color}"/>
        <circle cx="35.2" cy="42.2" r="2.4" fill="#ffffff"/>
        <circle cx="38.8" cy="47.5" r="1.2" fill="#ffffff"/>
        <ellipse cx="63" cy="45" rx="5.2" ry="6.8" fill="${color}"/>
        <circle cx="61.2" cy="42.2" r="2.4" fill="#ffffff"/>
        <circle cx="64.8" cy="47.5" r="1.2" fill="#ffffff"/>
      `;
    };

    const renderMouth = (m) => {
      if (m === 'happy') {
        return `
          <!-- 元気いっぱいの可愛いオープンマウス -->
          <path d="M39 55 Q50 69 61 55 Z" fill="#ff5252" stroke="#4e342e" stroke-width="2.4" stroke-linejoin="round"/>
          <path d="M43 60 Q50 66 57 60 Z" fill="#ff8a80"/>
        `;
      }
      if (m === 'sad' || m === 'shock') {
        return `
          <!-- むにゅっとした困り口 -->
          <path d="M41 61 Q45.5 56 50 60 Q54.5 56 59 61" stroke="#4e342e" stroke-width="3" fill="none" stroke-linecap="round"/>
        `;
      }
      return `
        <!-- にっこり可愛いスマイル -->
        <path d="M40 55 Q50 65 60 55 Z" fill="#ff5252" stroke="#4e342e" stroke-width="2.2" stroke-linejoin="round"/>
      `;
    };

    switch (type) {
      // ==================== 主役：きんたろう社長（ポップ＆カワイイ鉄道マスコット版） ====================
      case 'kintaro':
      case 'player1': {
        const isSad = mood === 'sad' || mood === 'shock';
        const isHappy = mood === 'happy';

        // きんたろう社長のポップで愛らしい表情
        const kintaroFaceExpr = isSad
          ? `
            <!-- 可愛い困り眉 -->
            <path d="M30 37 Q36 34 42 38" stroke="#4e342e" stroke-width="3" fill="none" stroke-linecap="round"/>
            <path d="M70 37 Q64 34 58 38" stroke="#4e342e" stroke-width="3" fill="none" stroke-linecap="round"/>
            <!-- ＞＜ うるうる目＆ぷっくり涙 -->
            <path d="M31 42 L41 46 L31 50" stroke="#4e342e" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M69 42 L59 46 L69 50" stroke="#4e342e" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="28" cy="52" r="4" fill="#4fc3f7" stroke="#fff" stroke-width="1"/>
            <circle cx="72" cy="52" r="4" fill="#4fc3f7" stroke="#fff" stroke-width="1"/>
            <!-- ふぇ〜ん口 -->
            <path d="M41 61 Q50 54 59 61" stroke="#4e342e" stroke-width="3" fill="none" stroke-linecap="round"/>
          `
          : isHappy
          ? `
            <!-- 元気なアーチ眉 -->
            <path d="M31 35 Q37 31 43 35" stroke="#4e342e" stroke-width="3" fill="none" stroke-linecap="round"/>
            <path d="M57 35 Q63 31 69 35" stroke="#4e342e" stroke-width="3" fill="none" stroke-linecap="round"/>
            <!-- キラキラ輝く大きな瞳（中に可愛い黄色い星★） -->
            <ellipse cx="37" cy="46" rx="5.8" ry="7.2" fill="#3e2723"/>
            <ellipse cx="63" cy="46" rx="5.8" ry="7.2" fill="#3e2723"/>
            <circle cx="35" cy="43" r="2.6" fill="#ffffff"/>
            <circle cx="61" cy="43" r="2.6" fill="#ffffff"/>
            <circle cx="39" cy="48.5" r="1.4" fill="#ffd54f"/>
            <circle cx="65" cy="48.5" r="1.4" fill="#ffd54f"/>
            <!-- わーい！と喜ぶ可愛い笑顔 -->
            <path d="M38 55 Q50 70 62 55 Z" fill="#ff5252" stroke="#4e342e" stroke-width="2.4" stroke-linejoin="round"/>
            <path d="M42 60 Q50 67 58 60 Z" fill="#ff8a80"/>
          `
          : `
            <!-- 元気なアーチ眉 -->
            <path d="M31 36 Q37 33 43 36" stroke="#4e342e" stroke-width="3" fill="none" stroke-linecap="round"/>
            <path d="M57 36 Q63 33 69 36" stroke="#4e342e" stroke-width="3" fill="none" stroke-linecap="round"/>
            <!-- ぷるぷる大きな瞳 -->
            <ellipse cx="37" cy="46" rx="5.5" ry="7" fill="#3e2723"/>
            <ellipse cx="63" cy="46" rx="5.5" ry="7" fill="#3e2723"/>
            <circle cx="35" cy="43" r="2.5" fill="#ffffff"/>
            <circle cx="61" cy="43" r="2.5" fill="#ffffff"/>
            <circle cx="39" cy="48.5" r="1.2" fill="#ffffff"/>
            <circle cx="65" cy="48.5" r="1.2" fill="#ffffff"/>
            <!-- にっこりスマイル -->
            <path d="M40 55 Q50 66 60 55 Z" fill="#ff5252" stroke="#4e342e" stroke-width="2.3" stroke-linejoin="round"/>
            <path d="M43 59 Q50 64 57 59 Z" fill="#ff8a80"/>
          `;

        return `
        <svg class="char-svg char-kintaro" width="${size}" height="${size}" viewBox="0 0 100 100" style="overflow:visible;" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="popSkin" cx="50%" cy="45%" r="50%">
              <stop offset="0%" stop-color="#fff3e0"/>
              <stop offset="80%" stop-color="#ffe0bd"/>
              <stop offset="100%" stop-color="#ffcc99"/>
            </radialGradient>
            <linearGradient id="popGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#fff59d"/>
              <stop offset="50%" stop-color="#ffd54f"/>
              <stop offset="100%" stop-color="#ffb300"/>
            </linearGradient>
          </defs>

          <!-- ① 背景：パステルイエロー＆ポップスターの明るいメダル -->
          <circle cx="50" cy="52" r="45" fill="#fffde7" stroke="#ff5252" stroke-width="4.5"/>
          <circle cx="50" cy="52" r="41" fill="none" stroke="#ffd54f" stroke-width="2.5" stroke-dasharray="6,4"/>
          <!-- 背景のキラキラお星さま -->
          <text x="16" y="26" font-size="11" fill="#ffd54f">★</text>
          <text x="79" y="24" font-size="10" fill="#ff8a80">♪</text>

          <!-- ② 左肩の仲良しマスコット：「にっこり子グマちゃん」🐻 -->
          <g transform="translate(17, 63) rotate(-8)">
            <circle cx="-7" cy="-8" r="5" fill="#a1887f" stroke="#4e342e" stroke-width="2"/>
            <circle cx="-7" cy="-8" r="2.5" fill="#ffccbc"/>
            <circle cx="9" cy="-8" r="5" fill="#a1887f" stroke="#4e342e" stroke-width="2"/>
            <circle cx="9" cy="-8" r="2.5" fill="#ffccbc"/>
            <ellipse cx="1" cy="0" rx="11" ry="9.5" fill="#bcaaa4" stroke="#4e342e" stroke-width="2.2"/>
            <ellipse cx="1" cy="2.5" rx="4.8" ry="3.5" fill="#fff8e1"/>
            <!-- 子グマちゃんの可愛い目とピンクほっぺ -->
            <circle cx="-3.5" cy="-1.5" r="1.8" fill="#3e2723"/>
            <circle cx="5.5" cy="-1.5" r="1.8" fill="#3e2723"/>
            <circle cx="1" cy="1" r="1.8" fill="#5d4037"/>
            <ellipse cx="-6.5" cy="1.5" rx="2.5" ry="1.5" fill="#ff8a80"/>
            <ellipse cx="8.5" cy="1.5" rx="2.5" ry="1.5" fill="#ff8a80"/>
          </g>

          <!-- ③ 右手のポップな「お星さま付きキラキラ金まさかりステッキ」✨ -->
          <g transform="translate(82, 57) rotate(15)">
            <rect x="-3" y="-16" width="6" height="44" rx="3" fill="#ffb74d" stroke="#4e342e" stroke-width="2.2"/>
            <path d="M-1 -14 C14 -24, 23 -10, 19 6 C16 18, 10 20, -1 10 Z" fill="url(#popGold)" stroke="#4e342e" stroke-width="2.4" stroke-linejoin="round"/>
            <text x="8" y="2" font-size="10" fill="#ff5252" text-anchor="middle">★</text>
          </g>

          <!-- ④ ボディ：水色の爽やかシャツ × 黄色いリボン × 真っ赤な「金」前掛け -->
          <path d="M20 92 Q24 66 50 66 Q76 66 80 92 Z" fill="#29b6f6" stroke="#4e342e" stroke-width="2.6"/>
          <!-- ポップな真っ赤な「金」前掛け -->
          <polygon points="50,63 70,80 50,96 30,80" fill="#ff5252" stroke="#ffd54f" stroke-width="3" stroke-linejoin="round"/>
          <text x="50" y="86" font-size="16" font-weight="900" fill="#fff9c4" text-anchor="middle" font-family="sans-serif">金</text>
          <!-- 首元の可愛い黄色い蝶ネクタイ -->
          <polygon points="50,66 40,61 40,71" fill="#ffd54f" stroke="#4e342e" stroke-width="1.8" stroke-linejoin="round"/>
          <polygon points="50,66 60,61 60,71" fill="#ffd54f" stroke="#4e342e" stroke-width="1.8" stroke-linejoin="round"/>
          <circle cx="50" cy="66" r="3.5" fill="#ffca28" stroke="#4e342e" stroke-width="1.8"/>

          <!-- ⑤ ぷっくり丸い可愛いお顔輪郭 -->
          <circle cx="23" cy="49" r="5.5" fill="url(#popSkin)" stroke="#4e342e" stroke-width="2.3"/>
          <circle cx="77" cy="49" r="5.5" fill="url(#popSkin)" stroke="#4e342e" stroke-width="2.3"/>
          <ellipse cx="50" cy="47" rx="26" ry="23.5" fill="url(#popSkin)" stroke="#4e342e" stroke-width="2.6"/>

          <!-- ⑥ ツヤツヤの丸いおかっぱ髪 -->
          <path d="M23 44 C21 17, 79 17, 77 44 C74 33, 67 34, 63 28 C58 34, 42 34, 37 28 C33 34, 26 33, 23 44 Z" fill="#3e2723" stroke="#4e342e" stroke-width="2.4" stroke-linejoin="round"/>
          <!-- 髪のポップなツヤハイライト -->
          <path d="M33 26 Q50 20 67 26" stroke="#8d6e63" stroke-width="3" fill="none" stroke-linecap="round"/>

          <!-- ⑦ 頭の上の可愛い「赤い鉄道社長さんキャップ（★バッジ付き）」🧢 -->
          <g transform="translate(50, 17) rotate(-4)">
            <!-- 帽子のクラウン（赤い丸帽子） -->
            <path d="M-22 4 C-22 -12, 22 -12, 22 4 Z" fill="#ff5252" stroke="#4e342e" stroke-width="2.4"/>
            <!-- 帽子のゴールドライン＆つば -->
            <rect x="-23" y="1" width="46" height="5" rx="2.5" fill="#ffd54f" stroke="#4e342e" stroke-width="2"/>
            <path d="M-18 5 Q0 10 18 5" fill="#3e2723" stroke="#4e342e" stroke-width="2"/>
            <!-- 中央の丸い「★」エンブレム -->
            <circle cx="0" cy="-2" r="6.5" fill="#fff9c4" stroke="#4e342e" stroke-width="2"/>
            <text x="0" y="1.5" font-size="9.5" font-weight="900" fill="#ff6f00" text-anchor="middle">★</text>
          </g>

          <!-- ⑧ ぷっくりピンクのツヤほっぺ（怖くない可愛い楕円チーク！） -->
          <ellipse cx="28" cy="52" rx="5.5" ry="3.5" fill="#ff8a80" opacity="0.85"/>
          <circle cx="26.5" cy="51" r="1.2" fill="#ffffff"/>
          <ellipse cx="72" cy="52" rx="5.5" ry="3.5" fill="#ff8a80" opacity="0.85"/>
          <circle cx="70.5" cy="51" r="1.2" fill="#ffffff"/>

          <!-- ⑨ 表情（キラキラおめめ＆スマイル）とちょこんと小さな鼻 -->
          ${kintaroFaceExpr}
          <ellipse cx="50" cy="49.5" rx="2" ry="1.4" fill="#ffb74d"/>
        </svg>`;
      }

      // ==================== 2P：うらしま社長（青・頭の上に可愛いカメちゃん＆竜宮衣装） ====================
      case 'player2': {
        return `
        <svg class="char-svg char-player2" width="${size}" height="${size}" viewBox="0 0 100 100" style="overflow:visible;" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="52" r="45" fill="#e1f5fe" stroke="#29b6f6" stroke-width="4.5"/>
          <path d="M20 92 Q25 66 50 66 Q75 66 80 92 Z" fill="#1e88e5" stroke="#4e342e" stroke-width="2.5"/>
          <polygon points="50,65 64,79 50,94 36,79" fill="#4dd0e1" stroke="#ffd54f" stroke-width="2.5"/>
          <text x="50" y="84" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">竜</text>
          <!-- 顔 -->
          <circle cx="50" cy="47" r="24" fill="#ffe0bd" stroke="#4e342e" stroke-width="2.5"/>
          <path d="M26 42 C26 22, 74 22, 74 42 C66 32, 34 32, 26 42 Z" fill="#4e342e"/>
          <!-- 頭の上のニコニコ子ガメちゃん 🐢 -->
          <ellipse cx="50" cy="20" rx="16" ry="9" fill="#66bb6a" stroke="#4e342e" stroke-width="2.2"/>
          <circle cx="66" cy="20" r="5.5" fill="#a5d6a7" stroke="#4e342e" stroke-width="2"/>
          <circle cx="67.5" cy="19" r="1.4" fill="#3e2723"/>
          <!-- ほっぺ＆目＆口 -->
          <ellipse cx="29" cy="52" rx="5" ry="3" fill="#ff8a80" opacity="0.8"/>
          <ellipse cx="71" cy="52" rx="5" ry="3" fill="#ff8a80" opacity="0.8"/>
          ${renderEyes(mood)}
          ${renderMouth(mood)}
        </svg>`;
      }

      // ==================== 3P：かぐや姫社長（黄・うさ耳ティアラ＆お姫様スマイル） ====================
      case 'player3': {
        return `
        <svg class="char-svg char-player3" width="${size}" height="${size}" viewBox="0 0 100 100" style="overflow:visible;" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="52" r="45" fill="#fffde7" stroke="#ffca28" stroke-width="4.5"/>
          <path d="M18 92 Q24 66 50 66 Q76 66 82 92 Z" fill="#ff7043" stroke="#4e342e" stroke-width="2.5"/>
          <polygon points="50,65 65,79 50,94 35,79" fill="#ffee58" stroke="#ff5252" stroke-width="2.5"/>
          <text x="50" y="84" font-size="14" font-weight="900" fill="#d84315" text-anchor="middle">月</text>
          <!-- 顔＆姫カット髪 -->
          <circle cx="50" cy="47" r="23.5" fill="#ffe8d6" stroke="#4e342e" stroke-width="2.5"/>
          <path d="M26 42 C26 23, 74 23, 74 42 C66 32, 34 32, 26 42 Z" fill="#3e2723" stroke="#4e342e" stroke-width="2.2"/>
          <!-- 可愛い月のうさ耳＆ティアラ -->
          <ellipse cx="38" cy="15" rx="4.8" ry="11" fill="#ffffff" stroke="#4e342e" stroke-width="2" transform="rotate(-10 38 15)"/>
          <ellipse cx="38" cy="15" rx="2.2" ry="6" fill="#f8bbd0" transform="rotate(-10 38 15)"/>
          <ellipse cx="62" cy="15" rx="4.8" ry="11" fill="#ffffff" stroke="#4e342e" stroke-width="2" transform="rotate(10 62 15)"/>
          <ellipse cx="62" cy="15" rx="2.2" ry="6" fill="#f8bbd0" transform="rotate(10 62 15)"/>
          <polygon points="36,28 43,18 50,24 57,18 64,28" fill="#ffd54f" stroke="#4e342e" stroke-width="2" stroke-linejoin="round"/>
          <ellipse cx="29" cy="52" rx="5" ry="3" fill="#ff8a80" opacity="0.8"/>
          <ellipse cx="71" cy="52" rx="5" ry="3" fill="#ff8a80" opacity="0.8"/>
          ${renderEyes(mood)}
          ${renderMouth(mood)}
        </svg>`;
      }

      // ==================== 4P：いっすん社長（緑・可愛いお椀ぼうし＆打ち出の小槌） ====================
      case 'player4': {
        return `
        <svg class="char-svg char-player4" width="${size}" height="${size}" viewBox="0 0 100 100" style="overflow:visible;" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="52" r="45" fill="#e8f5e9" stroke="#66bb6a" stroke-width="4.5"/>
          <path d="M20 92 Q25 66 50 66 Q75 66 80 92 Z" fill="#43a047" stroke="#4e342e" stroke-width="2.5"/>
          <polygon points="50,65 64,79 50,94 36,79" fill="#b9f6ca" stroke="#4e342e" stroke-width="2.2"/>
          <text x="50" y="84" font-size="14" font-weight="900" fill="#1b5e20" text-anchor="middle">一</text>
          <!-- 顔 -->
          <circle cx="50" cy="48" r="23.5" fill="#ffe0bd" stroke="#4e342e" stroke-width="2.5"/>
          <!-- 頭の上の可愛い赤いお椀ぼうし -->
          <path d="M24 35 Q50 10 76 35 Z" fill="#ff5252" stroke="#4e342e" stroke-width="2.4" stroke-linejoin="round"/>
          <rect x="42" y="13" width="16" height="5" rx="2" fill="#ff5252" stroke="#4e342e" stroke-width="2"/>
          <path d="M27 33 L73 33" stroke="#ffd54f" stroke-width="3.5" stroke-linecap="round"/>
          <ellipse cx="29" cy="52" rx="5" ry="3" fill="#ff8a80" opacity="0.8"/>
          <ellipse cx="71" cy="52" rx="5" ry="3" fill="#ff8a80" opacity="0.8"/>
          ${renderEyes(mood)}
          ${renderMouth(mood)}
        </svg>`;
      }

      // ==================== ポンコツびんぼう神（パロディ貧乏神・おちゃめで憎めないデザイン） ====================
      case 'binbo':
        return `
        <svg class="char-svg char-binbo" width="${size}" height="${size}" viewBox="0 0 100 100" style="overflow:visible;" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="52" r="44" fill="#f3e5f5" stroke="#ab47bc" stroke-width="4" stroke-dasharray="7,3"/>
          <path d="M22 92 Q26 66 50 66 Q74 66 78 92 Z" fill="#4db6ac" stroke="#4e342e" stroke-width="2.4"/>
          <rect x="54" y="73" width="11" height="11" rx="2" fill="#ffb74d" stroke="#4e342e" stroke-width="1.8"/>
          <line x1="18" y1="76" x2="9" y2="54" stroke="#8d6e63" stroke-width="3.8" stroke-linecap="round"/>
          <circle cx="12" cy="48" r="11.5" fill="#fff9c4" stroke="#ff5252" stroke-width="2.4"/>
          <text x="12" y="53" font-size="12" font-weight="900" fill="#ff5252" text-anchor="middle">ぽ</text>
          <ellipse cx="50" cy="48" rx="23.5" ry="21.5" fill="#ffe0b2" stroke="#4e342e" stroke-width="2.5"/>
          <!-- 頭の上の黄色いアヒルちゃん -->
          <ellipse cx="50" cy="21" rx="10.5" ry="7" fill="#ffee58" stroke="#4e342e" stroke-width="2"/>
          <circle cx="57" cy="15" r="5.5" fill="#ffee58" stroke="#4e342e" stroke-width="2"/>
          <polygon points="62,14 68,16 62,18" fill="#ffa726"/>
          <circle cx="58" cy="14" r="1.4" fill="#3e2723"/>
          <!-- のんびり困り眉＆にっこり目 -->
          <path d="M31 37 L42 40" stroke="#6d4c41" stroke-width="3" stroke-linecap="round"/>
          <path d="M69 37 L58 40" stroke="#6d4c41" stroke-width="3" stroke-linecap="round"/>
          <circle cx="38" cy="46" r="4.2" fill="#3e2723"/>
          <circle cx="36.5" cy="44.5" r="1.6" fill="#fff"/>
          <circle cx="62" cy="46" r="4.2" fill="#3e2723"/>
          <circle cx="60.5" cy="44.5" r="1.6" fill="#fff"/>
          <ellipse cx="30" cy="53" rx="4.5" ry="2.8" fill="#f48fb1"/>
          <ellipse cx="70" cy="53" rx="4.5" ry="2.8" fill="#f48fb1"/>
          <path d="M40 57 Q50 66 60 57" stroke="#4e342e" stroke-width="2.8" fill="none" stroke-linecap="round"/>
        </svg>`;

      // ==================== ちびポコ神（ミニボンビー風赤ちゃん） ====================
      case 'chibi':
        return `
        <svg class="char-svg char-chibi" width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="52" r="43" fill="#fce4ec" stroke="#f06292" stroke-width="4"/>
          <path d="M28 70 Q50 86 72 70 L68 92 L32 92 Z" fill="#fff" stroke="#f06292" stroke-width="2.5"/>
          <text x="50" y="85" font-size="10" font-weight="900" fill="#ec407a" text-anchor="middle">ばぶ</text>
          <circle cx="50" cy="48" r="23" fill="#ffecb3" stroke="#111" stroke-width="2.4"/>
          <path d="M50 25 Q56 13 46 14 Q40 15 48 23" stroke="#111" stroke-width="3" fill="none" stroke-linecap="round"/>
          <circle cx="39" cy="46" r="5" fill="#111"/>
          <circle cx="37" cy="44" r="2" fill="#fff"/>
          <circle cx="61" cy="46" r="5" fill="#111"/>
          <circle cx="59" cy="44" r="2" fill="#fff"/>
          <circle cx="50" cy="57" r="6.5" fill="#4fc3f7" stroke="#111" stroke-width="2"/>
          <circle cx="50" cy="59" r="4.5" fill="none" stroke="#fff" stroke-width="2.2"/>
          <ellipse cx="30" cy="53" rx="4.5" ry="3" fill="#f48fb1"/>
          <ellipse cx="70" cy="53" rx="4.5" ry="3" fill="#f48fb1"/>
        </svg>`;

      // ==================== 大魔王ドカン神（キングボンビー風・ポップでコミカルな魔王） ====================
      case 'king':
        return `
        <svg class="char-svg char-king" width="${size}" height="${size}" viewBox="0 0 100 100" style="overflow:visible;" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" fill="#ede7f6" stroke="#7e57c2" stroke-width="4.5"/>
          <polygon points="14,24 26,34 18,40 30,52" fill="#ffd54f"/>
          <polygon points="86,24 74,34 82,40 70,52" fill="#ffd54f"/>
          <path d="M16 92 Q24 64 50 64 Q76 64 84 92 Z" fill="#ec407a" stroke="#4e342e" stroke-width="2.5"/>
          <!-- 丸っこい黄金のツノ＆王冠 -->
          <polygon points="28,32 18,10 40,24" fill="#ffd54f" stroke="#4e342e" stroke-width="2.2" stroke-linejoin="round"/>
          <polygon points="72,32 82,10 60,24" fill="#ffd54f" stroke="#4e342e" stroke-width="2.2" stroke-linejoin="round"/>
          <circle cx="50" cy="48" r="24" fill="#b39ddb" stroke="#4e342e" stroke-width="2.6"/>
          <!-- いたずらっ子風の可愛い目と小さな八重歯 -->
          <path d="M30 37 L44 41" stroke="#4e342e" stroke-width="3.2" stroke-linecap="round"/>
          <path d="M70 37 L56 41" stroke="#4e342e" stroke-width="3.2" stroke-linecap="round"/>
          <circle cx="38" cy="46" r="4.8" fill="#3e2723"/>
          <circle cx="36.5" cy="44" r="1.8" fill="#fff"/>
          <circle cx="62" cy="46" r="4.8" fill="#3e2723"/>
          <circle cx="60.5" cy="44" r="1.8" fill="#fff"/>
          <path d="M36 56 Q50 69 64 56 Z" fill="#ff5252" stroke="#4e342e" stroke-width="2.4" stroke-linejoin="round"/>
          <polygon points="39,56 42,61 45,56" fill="#fff"/>
          <polygon points="55,56 58,61 61,56" fill="#fff"/>
        </svg>`;

      // ==================== キラキラ福の神（エンジェル） ====================
      case 'angel':
        return `
        <svg class="char-svg char-angel" width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="52" r="44" fill="#fffde7" stroke="#fbc02d" stroke-width="4"/>
          <path d="M24 55 Q4 38 14 68 Q22 74 28 65" fill="#fff" stroke="#90caf9" stroke-width="2.2"/>
          <path d="M76 55 Q96 38 86 68 Q78 74 72 65" fill="#fff" stroke="#90caf9" stroke-width="2.2"/>
          <ellipse cx="50" cy="15" rx="17" ry="4.5" fill="none" stroke="#ffd600" stroke-width="4"/>
          <circle cx="50" cy="48" r="22" fill="#ffe0bd" stroke="#4e342e" stroke-width="2.4"/>
          <path d="M28 44 Q50 22 72 44" fill="#fff59d" stroke="#4e342e" stroke-width="2.2"/>
          ${renderEyes('happy')}
          ${renderMouth('happy')}
          <ellipse cx="31" cy="52" rx="4.5" ry="2.8" fill="#ff8a80"/>
          <ellipse cx="69" cy="52" rx="4.5" ry="2.8" fill="#ff8a80"/>
        </svg>`;

      // ==================== 怪盗ニャンコ仮面（スリ銀次パロディ） ====================
      case 'nyanko':
        return `
        <svg class="char-svg char-nyanko" width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="52" r="44" fill="#ede7f6" stroke="#7e57c2" stroke-width="4"/>
          <polygon points="28,32 20,10 41,24" fill="#5c6bc0" stroke="#4e342e" stroke-width="2.2" stroke-linejoin="round"/>
          <polygon points="72,32 80,10 59,24" fill="#5c6bc0" stroke="#4e342e" stroke-width="2.2" stroke-linejoin="round"/>
          <circle cx="50" cy="50" r="23" fill="#ffe0bd" stroke="#4e342e" stroke-width="2.4"/>
          <path d="M27 39 Q40 34 50 43 Q60 34 73 39 L71 52 Q58 55 50 47 Q42 55 29 52 Z" fill="#5e35b1" stroke="#ffd54f" stroke-width="2" stroke-linejoin="round"/>
          <circle cx="39" cy="45" r="3.2" fill="#fff"/>
          <circle cx="61" cy="45" r="3.2" fill="#fff"/>
          <path d="M40 58 Q45 63 50 58 Q55 63 60 58" stroke="#4e342e" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        </svg>`;

      // ==================== CPU: まめオニ社長 / あかオニ社長 / メカオニ社長（ポップで可愛い小鬼ちゃん） ====================
      case 'mame_oni':
      case 'aka_oni':
      case 'mecha_oni': {
        const isMame = type === 'mame_oni';
        const isAka = type === 'aka_oni';
        const skin = isMame ? '#c5e1a5' : isAka ? '#ffab91' : '#b0bec5';
        const ring = isMame ? '#66bb6a' : isAka ? '#ff7043' : '#26c6da';
        return `
        <svg class="char-svg char-${type}" width="${size}" height="${size}" viewBox="0 0 100 100" style="overflow:visible;" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" fill="#fffde7" stroke="${ring}" stroke-width="4.5"/>
          <path d="M20 90 Q24 65 50 65 Q76 65 80 90 Z" fill="#ffd54f" stroke="#4e342e" stroke-width="2.5"/>
          <path d="M30 75 L38 78 M62 78 L70 75" stroke="#4e342e" stroke-width="3" stroke-linecap="round"/>
          <!-- もこもこ可愛いパステルアフロ髪 -->
          <circle cx="33" cy="26" r="9.5" fill="${ring}" stroke="#4e342e" stroke-width="2"/>
          <circle cx="50" cy="22" r="10.5" fill="${ring}" stroke="#4e342e" stroke-width="2"/>
          <circle cx="67" cy="26" r="9.5" fill="${ring}" stroke="#4e342e" stroke-width="2"/>
          <!-- ぷっくり丸いツノ -->
          ${isMame
            ? `<polygon points="44,24 50,8 56,24" fill="#ffee58" stroke="#4e342e" stroke-width="2.2" stroke-linejoin="round"/>`
            : `<polygon points="30,26 22,10 40,22" fill="#ffee58" stroke="#4e342e" stroke-width="2.2" stroke-linejoin="round"/>
               <polygon points="70,26 78,10 60,22" fill="#ffee58" stroke="#4e342e" stroke-width="2.2" stroke-linejoin="round"/>`
          }
          <circle cx="50" cy="48" r="23.5" fill="${skin}" stroke="#4e342e" stroke-width="2.5"/>
          <ellipse cx="29" cy="52" rx="4.8" ry="2.8" fill="#ff8a80" opacity="0.8"/>
          <ellipse cx="71" cy="52" rx="4.8" ry="2.8" fill="#ff8a80" opacity="0.8"/>
          ${type === 'mecha_oni'
            ? `<rect x="28" y="39" width="44" height="11" rx="5.5" fill="#4dd0e1" stroke="#4e342e" stroke-width="2.2"/>
               <line x1="34" y1="44.5" x2="66" y2="44.5" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>`
            : renderEyes(mood)
          }
          ${renderMouth(mood)}
        </svg>`;
      }

      // ==================== ご当地イベント怪獣・ヒーロー（ポップ＆キュート版） ====================
      case 'namahage':
        return `
        <svg class="char-svg char-namahage" width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" fill="#ffebee" stroke="#ff5252" stroke-width="4.5"/>
          <polygon points="28,28 20,10 40,22" fill="#ffd54f" stroke="#4e342e" stroke-width="2.2" stroke-linejoin="round"/>
          <polygon points="72,28 80,10 60,22" fill="#ffd54f" stroke="#4e342e" stroke-width="2.2" stroke-linejoin="round"/>
          <circle cx="50" cy="48" r="24" fill="#ff8a80" stroke="#4e342e" stroke-width="2.5"/>
          ${renderEyes('happy')}
          ${renderMouth('happy')}
        </svg>`;

      case 'dino':
        return `
        <svg class="char-svg char-dino" width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" fill="#e8f5e9" stroke="#66bb6a" stroke-width="4.5"/>
          <polygon points="44,20 50,8 56,20" fill="#ffb74d" stroke="#4e342e" stroke-width="2" stroke-linejoin="round"/>
          <circle cx="50" cy="48" r="24" fill="#a5d6a7" stroke="#4e342e" stroke-width="2.5"/>
          ${renderEyes('happy')}
          ${renderMouth('happy')}
        </svg>`;

      case 'takoyaki':
        return `
        <svg class="char-svg char-takoyaki" width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" fill="#fff3e0" stroke="#ef6c00" stroke-width="4.5"/>
          <circle cx="50" cy="50" r="27" fill="#ffb74d" stroke="#111" stroke-width="2.8"/>
          <path d="M26 42 Q38 22 50 38 Q62 22 74 42 Q64 50 50 42 Q36 50 26 42 Z" fill="#8d4004" stroke="#111" stroke-width="2"/>
          <circle cx="40" cy="34" r="2.2" fill="#4caf50"/>
          <circle cx="52" cy="31" r="2.2" fill="#4caf50"/>
          <circle cx="61" cy="35" r="2.2" fill="#4caf50"/>
          ${renderEyes('happy')}
          <circle cx="50" cy="58" r="7" fill="#e53935" stroke="#111" stroke-width="2.2"/>
        </svg>`;

      case 'shisa':
      default:
        return `
        <svg class="char-svg" width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" fill="#fff8e1" stroke="#ff6f00" stroke-width="4.5"/>
          <circle cx="24" cy="40" r="9" fill="#fbc02d" stroke="#111" stroke-width="2"/>
          <circle cx="76" cy="40" r="9" fill="#fbc02d" stroke="#111" stroke-width="2"/>
          <circle cx="50" cy="48" r="24" fill="#ff7043" stroke="#111" stroke-width="2.6"/>
          ${renderEyes('happy')}
          ${renderMouth('happy')}
        </svg>`;
    }
  }

  /**
   * プレイヤーの列車（新幹線/SL風）SVGアイコンを返す
   */
  function getTrainSVG(color = '#e53935', size = 44, hasBinbo = null) {
    let badge = '';
    if (hasBinbo === 'binbo') {
      badge = `<circle cx="48" cy="12" r="10" fill="#8e24aa" stroke="#fff" stroke-width="2"/><text x="48" y="16" font-size="11" fill="#fff" text-anchor="middle">🦆</text>`;
    } else if (hasBinbo === 'chibi') {
      badge = `<circle cx="48" cy="12" r="10" fill="#ec407a" stroke="#fff" stroke-width="2"/><text x="48" y="16" font-size="11" fill="#fff" text-anchor="middle">🍼</text>`;
    } else if (hasBinbo === 'king') {
      badge = `<circle cx="48" cy="12" r="11" fill="#d50000" stroke="#ffd600" stroke-width="2"/><text x="48" y="16" font-size="12" fill="#ffd600" text-anchor="middle">⚡</text>`;
    }
    return `
      <svg class="train-svg" width="${size}" height="${size}" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <!-- 煙のもくもく -->
        <circle cx="18" cy="13" r="5" fill="#ffffff" opacity="0.9"/>
        <circle cx="26" cy="9" r="6.5" fill="#ffffff" opacity="0.85"/>
        <!-- 車体ボディ -->
        <rect x="8" y="22" width="44" height="24" rx="8" fill="${color}" stroke="#ffffff" stroke-width="3"/>
        <rect x="8" y="22" width="44" height="24" rx="8" fill="none" stroke="#222222" stroke-width="1.5"/>
        <!-- 先頭ノーズ＆窓 -->
        <rect x="14" y="26" width="16" height="9" rx="3" fill="#e1f5fe" stroke="#222" stroke-width="1.5"/>
        <rect x="34" y="26" width="12" height="9" rx="2" fill="#fff9c4" stroke="#222" stroke-width="1.5"/>
        <!-- ゴールドライン -->
        <line x1="10" y1="39" x2="50" y2="39" stroke="#ffd54f" stroke-width="3"/>
        <!-- 車輪 -->
        <circle cx="18" cy="47" r="5.5" fill="#37474f" stroke="#ffd54f" stroke-width="2"/>
        <circle cx="30" cy="47" r="5.5" fill="#37474f" stroke="#ffd54f" stroke-width="2"/>
        <circle cx="42" cy="47" r="5.5" fill="#37474f" stroke="#ffd54f" stroke-width="2"/>
        ${badge}
      </svg>
    `;
  }

  /**
   * 3D風SVGサイコロ（1〜6の目）を返す
   */
  function getDiceSVG(value = 1, size = 76, isRolling = false) {
    const pipPositions = {
      1: [[50, 50]],
      2: [[28, 28], [72, 72]],
      3: [[26, 26], [50, 50], [74, 74]],
      4: [[28, 28], [72, 28], [28, 72], [72, 72]],
      5: [[26, 26], [74, 26], [50, 50], [26, 74], [74, 74]],
      6: [[28, 24], [72, 24], [28, 50], [72, 50], [28, 76], [72, 76]]
    };
    const pips = pipPositions[value] || pipPositions[1];
    const pipsSvg = pips
      .map(([cx, cy]) => {
        const isOne = value === 1;
        const r = isOne ? 13 : 8.5;
        const fill = isOne ? '#e53935' : '#263238';
        return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>
                <circle cx="${cx - 2}" cy="${cy - 2}" r="${r * 0.3}" fill="#ffffff" opacity="0.5"/>`;
      })
      .join('');

    return `
      <svg class="dice-svg ${isRolling ? 'rolling' : 'landed'}" width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="diceBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="70%" stop-color="#f5f7fa"/>
            <stop offset="100%" stop-color="#cfd8dc"/>
          </linearGradient>
        </defs>
        <!-- 立体シャドウベース -->
        <rect x="8" y="10" width="86" height="86" rx="18" fill="#78909c"/>
        <!-- サイコロ本体 -->
        <rect x="6" y="6" width="86" height="86" rx="18" fill="url(#diceBodyGrad)" stroke="#37474f" stroke-width="3.5"/>
        <!-- 内側ハイライト -->
        <rect x="12" y="12" width="74" height="74" rx="13" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.8"/>
        ${pipsSvg}
      </svg>
    `;
  }

  /**
   * マップ上の駅の上に表示する「社長キャラクター顔アイコン＋列車＋現在地スポットライト」一体型コマSVG
   * @param {Object} player - プレイヤーオブジェクト
   * @param {boolean} isCurrent - 現在手番のプレイヤーかどうか
   * @param {string|null} hasBinbo - 'binbo' | 'chibi' | 'king' | null
   * @param {number|null} remainingSteps - 移動中の残り歩数（非移動時はnull）
   */
  function getPlayerPieceSVG(player, isCurrent = false, hasBinbo = null, remainingSteps = null) {
    const color = player.color || '#e53935';
    const avatar = player.avatar || 'kintaro';

    if (isCurrent) {
      const topLabel = (remainingSteps !== null && remainingSteps !== undefined)
        ? `🚂 のこり ${remainingSteps} マス`
        : `▼ ${player.name}`;
      const badgeBg = (remainingSteps !== null && remainingSteps !== undefined) ? '#d50000' : '#ff6f00';
      const badgeW = Math.max(132, topLabel.length * 14 + 24);

      const binboCompanion = hasBinbo ? `
        <g transform="translate(14, -76)">
          ${getCharacterSVG(hasBinbo, 'normal', 42)}
        </g>
      ` : '';

      return `
        <g class="train-bob-inner">
          <!-- 足元の現在地キラキラ・スポットライトリング -->
          <ellipse cx="0" cy="-6" rx="46" ry="20" fill="rgba(255, 235, 59, 0.38)" stroke="#ff1744" stroke-width="4" stroke-dasharray="10,6" class="player-spotlight-ring"/>
          <!-- 列車ボディ（駅プレートの上部に堂々と配置） -->
          <g transform="translate(-38, -58)">
            <!-- 煙のもくもく -->
            <circle cx="14" cy="4" r="6" fill="#ffffff" opacity="0.92"/>
            <circle cx="24" cy="-2" r="8" fill="#ffffff" opacity="0.88"/>
            <!-- 車体 -->
            <rect x="6" y="14" width="64" height="30" rx="10" fill="${color}" stroke="#ffffff" stroke-width="4"/>
            <rect x="6" y="14" width="64" height="30" rx="10" fill="none" stroke="#212121" stroke-width="2"/>
            <!-- 運転席窓 -->
            <rect x="12" y="19" width="20" height="11" rx="4" fill="#e1f5fe" stroke="#212121" stroke-width="1.8"/>
            <rect x="38" y="19" width="24" height="11" rx="3" fill="#fff9c4" stroke="#212121" stroke-width="1.8"/>
            <!-- ゴールド帯 -->
            <line x1="8" y1="35" x2="68" y2="35" stroke="#ffd600" stroke-width="4"/>
            <!-- 車輪 -->
            <circle cx="20" cy="45" r="7" fill="#263238" stroke="#ffd600" stroke-width="2.5"/>
            <circle cx="38" cy="45" r="7" fill="#263238" stroke="#ffd600" stroke-width="2.5"/>
            <circle cx="56" cy="45" r="7" fill="#263238" stroke="#ffd600" stroke-width="2.5"/>
          </g>
          <!-- 列車の上に乗っている社長キャラクターの顔アイコン -->
          <g transform="translate(-31, -94)">
            ${getCharacterSVG(avatar, 'happy', 62)}
          </g>
          ${binboCompanion}
          <!-- 頭上の「現在地 / のこり歩数」吹き出しプレート -->
          <g transform="translate(0, -112)">
            <polygon points="0,14 -9,2 9,2" fill="#ffffff"/>
            <rect x="${-badgeW / 2}" y="-24" width="${badgeW}" height="28" rx="14" fill="${badgeBg}" stroke="#ffffff" stroke-width="3.5"/>
            <text x="0" y="-5" font-size="14.5" font-weight="900" fill="#ffffff" text-anchor="middle">${topLabel}</text>
          </g>
        </g>
      `;
    }

    // 待機中（手番外）のライバル社長コマ
    const binboMini = hasBinbo ? `
      <circle cx="22" cy="-36" r="11" fill="#8e24aa" stroke="#fff" stroke-width="2"/>
      <text x="22" y="-32" font-size="12" text-anchor="middle">${hasBinbo === 'king' ? '⚡' : hasBinbo === 'chibi' ? '🍼' : '🦆'}</text>
    ` : '';

    return `
      <g class="train-bob-inner">
        <g transform="translate(-22, -32)">
          ${getTrainSVG(color, 44, null)}
        </g>
        <g transform="translate(-18, -56)">
          ${getCharacterSVG(avatar, 'normal', 36)}
        </g>
        ${binboMini}
        <rect x="-32" y="10" width="64" height="16" rx="8" fill="${color}" stroke="#fff" stroke-width="2"/>
        <text x="0" y="21" font-size="10" font-weight="900" fill="#fff" text-anchor="middle">${player.name.slice(0, 5)}</text>
      </g>
    `;
  }

  KT.svg = {
    getCharacterSVG,
    getTrainSVG,
    getDiceSVG,
    getPlayerPieceSVG
  };
})();
