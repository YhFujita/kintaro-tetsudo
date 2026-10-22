/**
 * きんたろうてつどう - お助けカード＆妨害カード全データ
 */
window.KT = window.KT || {};

(function () {
  const CARDS = [
    // === サイコロ増加（急行系）カード ===
    {
      id: 'kyuko',
      name: 'きゅうこうカード',
      icon: '🚃',
      category: 'move',
      price: 80,
      rarity: 10,
      diceCount: 2,
      desc: 'サイコロを 2個 ふって 進むことが できるよ！'
    },
    {
      id: 'tokkyu',
      name: 'とっきゅうカード',
      icon: '🚄',
      category: 'move',
      price: 200,
      rarity: 8,
      diceCount: 3,
      desc: 'サイコロを 3個 ふって グングン 進めるよ！'
    },
    {
      id: 'shinkansen',
      name: 'しんかんせんカード',
      icon: '🚅',
      category: 'move',
      price: 450,
      rarity: 5,
      diceCount: 4,
      desc: 'サイコロを 4個 ふって 一気に 遠くへ 進めるよ！'
    },
    {
      id: 'linear',
      name: 'リニアカード',
      icon: '⚡',
      category: 'move',
      price: 900,
      rarity: 3,
      diceCount: 6,
      desc: '超高速！サイコロを 6個も ふって 大移動 できるよ！'
    },
    {
      id: 'saikoro10',
      name: '超音速ジェットカード',
      icon: '🚀',
      category: 'move',
      price: 1500,
      rarity: 1,
      diceCount: 8,
      desc: '夢の超特急！サイコロを 8個 ふって 日本縦断！'
    },

    // === 特殊移動・ワープ系カード ===
    {
      id: 'special',
      name: 'スペシャルカード',
      icon: '⭐',
      category: 'special_move',
      price: 400,
      rarity: 5,
      desc: '1〜6の 好きな 数字を えらんで ピッタリ 進めるよ！目的地 の すぐ近くで 大活躍！'
    },
    {
      id: 'buttobi',
      name: 'ぶっとびカード',
      icon: '🎈',
      category: 'warp',
      price: 150,
      rarity: 7,
      desc: '全国の どこかの 駅へ びゅーんと ランダムで 飛んでいくよ！'
    },
    {
      id: 'pittari',
      name: 'ぴったりカード',
      icon: '🎯',
      category: 'warp',
      price: 350,
      rarity: 4,
      desc: 'ライバル社長 1人と おなじ駅へ ピタッと ワープするよ！びんぼう神を なすりつけよう！'
    },
    {
      id: 'summit',
      name: 'サミットカード',
      icon: '✈️',
      category: 'warp',
      price: 600,
      rarity: 3,
      desc: 'ほかの 社長たち 全員を 自分が いる 駅へ 呼び寄せるよ！'
    },
    {
      id: 'chikamichi',
      name: '目的地ちかづきカード',
      icon: '🧭',
      category: 'warp',
      price: 850,
      rarity: 2,
      desc: '目的地の 近く（3〜6マス圏内）の 駅へ ひとっとび できるよ！'
    },

    // === お金・物件・ラッキー系カード ===
    {
      id: 'ikkaku',
      name: '一攫千金カード',
      icon: '💴',
      category: 'money',
      price: 300,
      rarity: 5,
      desc: '使うだけで 臨時収入が もらえる ラッキーな カード！'
    },
    {
      id: 'fukubukuro',
      name: 'わくわく福袋カード',
      icon: '🛍️',
      category: 'money',
      price: 320,
      rarity: 5,
      desc: '袋の 中から カードが 2〜3枚 飛び出してくる 楽しい 福袋！'
    },
    {
      id: 'cinderella',
      name: 'シンデレラカード',
      icon: '👠',
      category: 'property',
      price: 950,
      rarity: 2,
      desc: '今いる 物件駅の いちばん 高い アトラクションや 物件を 1つ 無料（タダ）で もらえるよ！（12月に 使うと 消えちゃうので 注意）'
    },
    {
      id: 'tokuseirei',
      name: '徳政令カード',
      icon: '📜',
      category: 'money',
      price: 50,
      rarity: 4,
      desc: '借金（マイナス）が ある 社長 全員の 借金を チャラ（0円）に してくれるよ！'
    },
    {
      id: 'gold',
      name: 'プラチナ割引カード',
      icon: '💳',
      category: 'money',
      price: 500,
      rarity: 3,
      desc: '今いる 物件駅の まだ 買われていない 物件を 1つ 半額で 買えるよ！'
    },

    // === 妨害・お邪魔・防御系カード ===
    {
      id: 'oharai',
      name: 'おはらいカード',
      icon: '🧹',
      category: 'defense',
      price: 400,
      rarity: 4,
      desc: '取り憑いた ポンコツびんぼう神を ほかの 誰かの ところへ 飛ばしちゃうよ！'
    },
    {
      id: 'mecha',
      name: 'メカ金太郎カード',
      icon: '🤖',
      category: 'defense',
      price: 700,
      rarity: 3,
      desc: '持っていると 大魔王ドカン神の 悪行を ロボットパンチで 防いでくれるよ！（使うと おはらい効果）'
    },
    {
      id: 'pato',
      name: 'パトカード',
      icon: '🚓',
      category: 'defense',
      price: 250,
      rarity: 4,
      desc: '手札に 持っていると 怪盗ニャンコ仮面から お金を 守ってくれるよ！'
    },
    {
      id: 'ushipo',
      name: 'うし歩カード',
      icon: '🐂',
      category: 'attack',
      price: 380,
      rarity: 4,
      desc: 'ライバル 1人を モ〜モ〜牛歩（2ターンのあいだ 1マスしか 進めない）に するよ！'
    },
    {
      id: 'fuuin',
      name: 'ふういんカード',
      icon: '💤',
      category: 'attack',
      price: 360,
      rarity: 4,
      desc: 'ライバル 1人を 2ターンの あいだ カードが 使えない 状態に するよ！'
    },
    {
      id: 'kaze',
      name: 'たいふう吹き飛ばしカード',
      icon: '🌪️',
      category: 'attack',
      price: 450,
      rarity: 3,
      desc: 'ライバル 1人を 大風で どこか 遠くの 駅へ 吹き飛ばしちゃうよ！'
    }
  ];

  const CARD_MAP = new Map();
  CARDS.forEach(c => CARD_MAP.set(c.id, c));

  /**
   * レアリティ重み付きでランダムなカードを1枚抽選
   */
  function drawRandomCard() {
    const totalWeight = CARDS.reduce((sum, c) => sum + c.rarity, 0);
    let r = Math.random() * totalWeight;
    for (const c of CARDS) {
      r -= c.rarity;
      if (r <= 0) return { ...c };
    }
    return { ...CARDS[0] };
  }

  function getCardById(id) {
    const c = CARD_MAP.get(id);
    return c ? { ...c } : null;
  }

  KT.CARDS = CARDS;
  KT.CARD_MAP = CARD_MAP;
  KT.drawRandomCard = drawRandomCard;
  KT.getCardById = getCardById;
})();
