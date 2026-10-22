/**
 * きんたろうてつどう - 全国47都道府県 完全縦横（オーソゴナル）グリッド路線データ (Ver 3.0 本家桃鉄グリッド方式)
 * ・すべての線路が100%「縦（上下・南北）」または「横（左右・東西）」のみで接続された碁盤の目マップ！
 * ・斜め線が一切ないため、矢印キー（↑↓←→）と進行方向が1対1で完全に一致し、直感的に進んだり戻ったりできます。
 */
window.KT = window.KT || {};

(function () {
  const GRID_STEP_X = 230;
  const GRID_STEP_Y = 155;

  // gx: 1〜17 (西→東), gy: 1〜21 (北→南)
  const RAW_STATIONS = [
    // ==================== 北海道エリア (gx: 14〜17, gy: 1〜7) ====================
    {
      id: 'wakkanai', name: '稚内', kana: 'わっかない', pref: '北海道', region: '北海道', type: 'property',
      gx: 15, gy: 1, links: ['plus_hokkaido_n'],
      properties: [
        { name: 'ノシャップ寒流水族館', icon: '🐧', cat: 'attraction', price: 150, rate: 30, desc: 'アザラシやペンギンに会える最北の水族館！' },
        { name: '宗谷岬ウインド牧場', icon: '🐄', cat: 'farm', price: 200, rate: 25, desc: '風車が回る日本最北端の広大な牧場。' },
        { name: 'タコしゃぶ鍋屋', icon: '🐙', cat: 'food', price: 80, rate: 40, desc: '稚内名物のぷりぷりタコしゃぶ。' }
      ]
    },
    {
      id: 'plus_hokkaido_n', name: '名寄', kana: 'なよろ', pref: '北海道', region: '北海道', type: 'plus',
      gx: 15, gy: 2, links: ['wakkanai', 'asahikawa', 'abashiri']
    },
    {
      id: 'abashiri', name: '網走', kana: 'あばしり', pref: '北海道', region: '北海道', type: 'property',
      gx: 17, gy: 2, links: ['plus_hokkaido_n', 'kushiro'],
      properties: [
        { name: '流氷砕氷おーろら船', icon: '🚢', cat: 'attraction', price: 300, rate: 30, desc: 'バリバリ氷を割って進む大迫力の流氷クルーズ！' },
        { name: 'オホーツク流氷科学館', icon: '❄️', cat: 'attraction', price: 180, rate: 25, desc: 'マイナス15度の体験室でクリオネを見よう！' },
        { name: '毛ガニ漁船団', icon: '🦀', cat: 'marine', price: 400, rate: 25, desc: 'オホーツク海の甘い毛ガニを水揚げ！' }
      ]
    },
    {
      id: 'asahikawa', name: '旭川', kana: 'あさひかわ', pref: '北海道', region: '北海道', type: 'property',
      gx: 15, gy: 3, links: ['plus_hokkaido_n', 'n_hokkaido_1', 'sapporo'],
      properties: [
        { name: 'ぺんぎんお散歩動物園', icon: '🐧', cat: 'attraction', price: 600, rate: 30, desc: 'ペンギンの行進やアザラシの円柱水槽が大人気！' },
        { name: '雪の結晶ミュージアム', icon: '❄️', cat: 'attraction', price: 240, rate: 25, desc: 'お城のような建物で雪と氷の不思議を体験。' },
        { name: '旭川しょうゆラーメン店', icon: '🍜', cat: 'food', price: 100, rate: 50, desc: 'あったかラードで冷めない絶品ラーメン。' },
        { name: '富良野メロン農園', icon: '🍈', cat: 'farm', price: 320, rate: 25, desc: '甘くてジューシーな赤肉メロン畑。' }
      ]
    },
    {
      id: 'n_hokkaido_1', name: '富良野', kana: 'ふらの', pref: '北海道', region: '北海道', type: 'plus',
      gx: 16, gy: 3, links: ['asahikawa', 'kushiro', 'card_tokachi']
    },
    {
      id: 'kushiro', name: '釧路', kana: 'くしろ', pref: '北海道', region: '北海道', type: 'property',
      gx: 17, gy: 3, links: ['abashiri', 'n_hokkaido_1', 'plus_nemuro'],
      properties: [
        { name: '釧路湿原トロッコ列車', icon: '🚂', cat: 'attraction', price: 280, rate: 25, desc: 'タンチョウヅルやエゾシカに出会える展望列車！' },
        { name: 'まりも観察ボート', icon: '🟢', cat: 'attraction', price: 150, rate: 30, desc: '阿寒湖のまんまるマリモを見に行こう。' },
        { name: '勝手丼海鮮市場', icon: '🍚', cat: 'food', price: 220, rate: 35, desc: '好きな魚介を自分で乗せて作る海鮮丼！' }
      ]
    },
    {
      id: 'shop_otaru', name: '小樽売場', kana: 'おたる', pref: '北海道', region: '北海道', type: 'shop',
      gx: 14, gy: 4, links: ['sapporo', 'hakodate']
    },
    {
      id: 'sapporo', name: '札幌', kana: 'さっぽろ', pref: '北海道', region: '北海道', type: 'property',
      gx: 15, gy: 4, links: ['asahikawa', 'shop_otaru', 'card_tokachi', 'minus_muroran'],
      properties: [
        { name: '白い恋人おかしパーク', icon: '🍫', cat: 'attraction', price: 800, rate: 30, desc: 'からくり時計とチョコレート工場見学が楽しいお菓子の城！' },
        { name: 'のぼりべつクマ牧場', icon: '🐻', cat: 'attraction', price: 500, rate: 25, desc: 'ロープウェイで行くヒグマたちのテーマパーク。' },
        { name: '札幌みそラーメン横丁', icon: '🍜', cat: 'food', price: 150, rate: 50, desc: 'バターとコーンがたっぷり乗った名物味噌ラーメン。' },
        { name: 'ジンギスカン大食堂', icon: '🥩', cat: 'food', price: 300, rate: 35, desc: 'みんなで囲む兜型鍋のジンギスカン！' }
      ]
    },
    {
      id: 'card_tokachi', name: '帯広', kana: 'おびひろ', pref: '北海道', region: '北海道', type: 'card',
      gx: 16, gy: 4, links: ['n_hokkaido_1', 'sapporo', 'plus_nemuro']
    },
    {
      id: 'plus_nemuro', name: '根室', kana: 'ねむろ', pref: '北海道', region: '北海道', type: 'plus',
      gx: 17, gy: 4, links: ['kushiro', 'card_tokachi']
    },
    {
      id: 'minus_muroran', name: '室蘭', kana: 'むろらん', pref: '北海道', region: '北海道', type: 'minus',
      gx: 15, gy: 5, links: ['sapporo', 'plus_tomakomai']
    },
    {
      id: 'hakodate', name: '函館', kana: 'はこだて', pref: '北海道', region: '北海道', type: 'property',
      gx: 14, gy: 6, links: ['shop_otaru', 'plus_tomakomai', 'ferry_seikan'],
      properties: [
        { name: '五稜郭スタータワー', icon: '⭐', cat: 'attraction', price: 450, rate: 25, desc: '星形のお城跡を上から見下ろす大展望台！' },
        { name: '函館山キラキラロープウェイ', icon: '🚡', cat: 'attraction', price: 400, rate: 30, desc: '100万ドルの夜景へ一気に空中散歩！' },
        { name: 'ラッキーピエロ風バーガー店', icon: '🍔', cat: 'food', price: 120, rate: 50, desc: 'ブランコ席もある遊園地みたいなご当地バーガー店。' },
        { name: '朝市イカ釣り体験船', icon: '🦑', cat: 'marine', price: 250, rate: 35, desc: '自分で釣ったイカをその場でパクリ！' }
      ]
    },
    {
      id: 'plus_tomakomai', name: '苫小牧', kana: 'とまこまい', pref: '北海道', region: '北海道', type: 'plus',
      gx: 15, gy: 6, links: ['minus_muroran', 'hakodate']
    },
    {
      id: 'ferry_seikan', name: '青函トンネル', kana: 'せいかん', pref: '青森', region: '東北', type: 'plus',
      gx: 14, gy: 7, links: ['hakodate', 'aomori']
    },

    // ==================== 東北エリア (gx: 13〜15, gy: 8〜12) ====================
    {
      id: 'plus_hirosaki', name: '弘前', kana: 'ひろさき', pref: '青森', region: '東北', type: 'plus',
      gx: 13, gy: 8, links: ['aomori', 'akita']
    },
    {
      id: 'aomori', name: '青森', kana: 'あおもり', pref: '青森', region: '東北', type: 'property',
      gx: 14, gy: 8, links: ['ferry_seikan', 'plus_hirosaki', 'n_tohoku_1', 'morioka'],
      properties: [
        { name: 'ねぶた体験ワンダー館', icon: '🏮', cat: 'attraction', price: 450, rate: 30, desc: '巨大なねぶた山車とお囃子太鼓を一年中体験！' },
        { name: '浅虫イルカ水族館', icon: '🐬', cat: 'attraction', price: 320, rate: 25, desc: '津軽三味線とイルカジャンプのコラボショー！' },
        { name: '蜜たっぷりリンゴ果樹園', icon: '🍎', cat: 'farm', price: 200, rate: 35, desc: '真っ赤な青森リンゴが食べ放題の果樹園。' },
        { name: '大間のマグロ一本釣り船', icon: '🐟', cat: 'marine', price: 650, rate: 30, desc: '黒いダイヤと呼ばれる超高級本マグロ漁船！' }
      ]
    },
    {
      id: 'n_tohoku_1', name: '八戸', kana: 'はちのへ', pref: '青森', region: '東北', type: 'plus',
      gx: 15, gy: 8, links: ['aomori', 'card_sanriku']
    },
    {
      id: 'akita', name: '秋田', kana: 'あきた', pref: '秋田', region: '東北', type: 'property',
      gx: 13, gy: 9, links: ['plus_hirosaki', 'morioka', 'plus_sakata'],
      properties: [
        { name: 'なまはげ変身ミュージアム', icon: '👹', cat: 'attraction', price: 300, rate: 30, desc: '「泣ぐ子はいねがー！」大迫力のなまはげ体験館！' },
        { name: '秋田犬もふもふパーク', icon: '🐕', cat: 'attraction', price: 250, rate: 35, desc: 'ふわふわで可愛い秋田犬たちとふれあえる広場。' },
        { name: 'きりたんぽ鍋茶屋', icon: '🍲', cat: 'food', price: 120, rate: 40, desc: '比内地鶏のスープが染みた焼ききりたんぽ。' },
        { name: 'ババヘラアイス屋台', icon: '🍦', cat: 'food', price: 60, rate: 50, desc: 'バラのお花みたいに盛り付けてくれる名物アイス！' }
      ]
    },
    {
      id: 'morioka', name: '盛岡', kana: 'もりおか', pref: '岩手', region: '東北', type: 'property',
      gx: 14, gy: 9, links: ['aomori', 'akita', 'card_sanriku', 'n_tohoku_2'],
      properties: [
        { name: '小岩井まきばトロッコ農園', icon: '🐄', cat: 'attraction', price: 550, rate: 30, desc: '羊ショーやバター作り、水上ハムスターボールで大はしゃぎ！' },
        { name: '龍泉洞ドラゴン探検ツアー', icon: '🦇', cat: 'attraction', price: 350, rate: 25, desc: 'ドラゴンブルーに輝く神秘の地底湖を探検！' },
        { name: 'わんこそば100杯道場', icon: '🥢', cat: 'food', price: 150, rate: 45, desc: '「はい、じゃんじゃん！」お椀を重ねるわんこそば対決。' },
        { name: '南部せんべい手焼き工房', icon: '🍘', cat: 'craft', price: 100, rate: 35, desc: 'ピーナッツやゴマが香ばしい伝統せんべい。' }
      ]
    },
    {
      id: 'card_sanriku', name: '三陸', kana: 'さんりく', pref: '岩手', region: '東北', type: 'card',
      gx: 15, gy: 9, links: ['n_tohoku_1', 'morioka', 'sendai']
    },
    {
      id: 'plus_sakata', name: '酒田', kana: 'さかた', pref: '山形', region: '東北', type: 'plus',
      gx: 13, gy: 10, links: ['akita', 'n_tohoku_2', 'niigata']
    },
    {
      id: 'n_tohoku_2', name: '平泉', kana: 'ひらいずみ', pref: '岩手', region: '東北', type: 'card',
      gx: 14, gy: 10, links: ['morioka', 'plus_sakata', 'yamagata']
    },
    {
      id: 'yamagata', name: '山形', kana: 'やまがた', pref: '山形', region: '東北', type: 'property',
      gx: 14, gy: 11, links: ['n_tohoku_2', 'sendai', 'fukushima'],
      properties: [
        { name: 'リナワールド遊園地', icon: '🎡', cat: 'attraction', price: 420, rate: 30, desc: '東北最大級のジェットコースターと観覧車がある遊園地！' },
        { name: '蔵王樹氷モンスターロープウェイ', icon: '⛄', cat: 'attraction', price: 380, rate: 25, desc: '雪の怪物「アイスモンスター」を見に行く空中探検。' },
        { name: '佐藤錦さくらんぼ果樹園', icon: '🍒', cat: 'farm', price: 300, rate: 35, desc: 'ルビーのように輝く甘いさくらんぼ狩り！' },
        { name: '日本一の大鍋芋煮フェスタ', icon: '🥘', cat: 'food', price: 180, rate: 40, desc: 'クレーン車で作る直径6メートルの大鍋芋煮！' }
      ]
    },
    {
      id: 'sendai', name: '仙台', kana: 'せんだい', pref: '宮城', region: '東北', type: 'property',
      gx: 15, gy: 11, links: ['card_sanriku', 'yamagata', 'n_tohoku_5'],
      properties: [
        { name: '八木山ベニー遊園地', icon: '🎢', cat: 'attraction', price: 480, rate: 30, desc: '「ヤンヤンヤヤーン♪」の歌でおなじみの楽しい遊園地！' },
        { name: 'うみの杜イルカ水族館', icon: '🐬', cat: 'attraction', price: 520, rate: 30, desc: '大迫力のイワシトルネードとアシカ・イルカショー！' },
        { name: '厚切り牛タン専門店', icon: '🥩', cat: 'food', price: 280, rate: 40, desc: '炭火でジューシーに焼き上げた仙台名物牛タン。' },
        { name: 'ずんだシェイクスタンド', icon: '🥤', cat: 'food', price: 90, rate: 55, desc: '枝豆のつぶつぶ食感がたまらない大人気シェイク！' }
      ]
    },
    {
      id: 'fukushima', name: '会津・福島', kana: 'あいづ・ふくしま', pref: '福島', region: '東北', type: 'property',
      gx: 14, gy: 12, links: ['yamagata', 'niigata', 'n_tohoku_5', 'utsunomiya'],
      properties: [
        { name: 'スパリゾート常夏ハワイアンズ', icon: '🌺', cat: 'attraction', price: 850, rate: 30, desc: '巨大ウォータースライダーとフラダンスショーの常夏楽園！' },
        { name: 'アクアマリンふくしま水族館', icon: '🐠', cat: 'attraction', price: 460, rate: 25, desc: '三角トンネル水槽と釣り体験ができる環境水族館！' },
        { name: '喜多方ちぢれラーメン館', icon: '🍜', cat: 'food', price: 120, rate: 45, desc: '朝から食べたくなるモチモチ太麺ラーメン。' },
        { name: 'あかつきモモ果樹園', icon: '🍑', cat: 'farm', price: 240, rate: 35, desc: '果汁があふれ出す福島自慢の甘い桃！' }
      ]
    },
    {
      id: 'n_tohoku_5', name: 'いわき', kana: 'いわき', pref: '福島', region: '東北', type: 'plus',
      gx: 15, gy: 12, links: ['sendai', 'fukushima', 'mito']
    },

    // ==================== 関東・甲信越・北陸・中部エリア (gx: 10〜16, gy: 12〜16) ====================
    {
      id: 'plus_noto', name: '輪島', kana: 'わじま', pref: '石川', region: '中部', type: 'plus',
      gx: 10, gy: 12, links: ['kanazawa']
    },
    {
      id: 'n_chubu_3', name: '黒部', kana: 'くろべ', pref: '富山', region: '中部', type: 'minus',
      gx: 12, gy: 12, links: ['niigata', 'n_warp_1']
    },
    {
      id: 'niigata', name: '新潟', kana: 'にいがた', pref: '新潟', region: '中部', type: 'property',
      gx: 13, gy: 12, links: ['plus_sakata', 'n_chubu_3', 'fukushima', 'takasaki'],
      properties: [
        { name: 'マリンピア日本海水族館', icon: '🐬', cat: 'attraction', price: 420, rate: 25, desc: '日本海の大水槽とイルカショーが人気の水族館！' },
        { name: '佐渡金山砂金採りパーク', icon: '🪙', cat: 'attraction', price: 480, rate: 30, desc: '江戸時代の坑道探検と本物の砂金すくい体験！' },
        { name: '魚沼産コシヒカリおにぎり屋', icon: '🍙', cat: 'farm', price: 250, rate: 40, desc: 'ツヤツヤで甘い日本一のお米で作る極上おにぎり。' },
        { name: '柿の種あられ工場', icon: '🍘', cat: 'food', price: 180, rate: 40, desc: 'ピリ辛サクサクの米菓を全国へ出荷！' }
      ]
    },
    {
      id: 'kanazawa', name: '金沢', kana: 'かなざわ', pref: '石川', region: '中部', type: 'property',
      gx: 10, gy: 13, links: ['plus_noto', 'toyama', 'fukui'],
      properties: [
        { name: '忍者からくり屋敷（妙立寺風）', icon: '🥷', cat: 'attraction', price: 400, rate: 30, desc: '落とし穴や隠し階段がいっぱい！びっくり忍者寺探検！' },
        { name: 'のとじまジンベエザメ水族館', icon: '🦈', cat: 'attraction', price: 480, rate: 25, desc: 'プロジェクションマッピングとジンベエザメが泳ぐ水族館！' },
        { name: 'キラキラ金箔ソフトクリーム店', icon: '🍦', cat: 'food', price: 150, rate: 50, desc: '金箔をまるごと1枚ペタッと貼った豪華ソフトクリーム！' },
        { name: '加賀友禅手染め工房', icon: '👘', cat: 'craft', price: 350, rate: 25, desc: '華やかで美しい伝統の着物染め工房。' }
      ]
    },
    {
      id: 'toyama', name: '富山', kana: 'とやま', pref: '富山', region: '中部', type: 'property',
      gx: 11, gy: 13, links: ['kanazawa', 'n_warp_1', 'gifu'],
      properties: [
        { name: '立山黒部雪の大谷＆トロリーバス', icon: '🏔️', cat: 'attraction', price: 650, rate: 30, desc: '高さ20メートルの雪の壁と巨大黒部ダムの放水を見学！' },
        { name: 'ミラージュランド大観覧車', icon: '🎡', cat: 'attraction', price: 300, rate: 25, desc: '富山湾の蜃気楼が見える海辺の遊園地。' },
        { name: 'ますの寿司本舗', icon: '🍣', cat: 'food', price: 160, rate: 40, desc: '笹の葉の香りが爽やかな丸い押し寿司。' },
        { name: 'ホタルイカ発光クルーズ船', icon: '🦑', cat: 'marine', price: 220, rate: 35, desc: '夜の海が青白く光る神秘のホタルイカ漁！' }
      ]
    },
    {
      id: 'n_warp_1', name: '銀河ワープ', kana: 'ぎんがわーぷ', pref: '長野', region: '中部', type: 'warp',
      gx: 12, gy: 13, links: ['n_chubu_3', 'toyama', 'takasaki', 'nagano']
    },
    {
      id: 'takasaki', name: '高崎・草津', kana: 'たかさき・くさつ', pref: '群馬', region: '関東', type: 'property',
      gx: 13, gy: 13, links: ['niigata', 'n_warp_1', 'utsunomiya', 'saitama'],
      properties: [
        { name: '群馬サファリ探検パーク', icon: '🦁', cat: 'attraction', price: 520, rate: 30, desc: 'エサやりバスでライオンやホワイトタイガーに大接近！' },
        { name: '碓氷峠鉄道文化むら', icon: '🚂', cat: 'attraction', price: 350, rate: 30, desc: '本物の電気機関車やミニSLを運転できる鉄道テーマパーク！' },
        { name: 'こんにゃくバイキングパーク', icon: '🍢', cat: 'attraction', price: 220, rate: 40, desc: '工場見学とこんにゃく料理バイキングが無料で大人気！' },
        { name: '高崎だるま絵付け工房', icon: '🏮', cat: 'craft', price: 100, rate: 40, desc: '願いを込めて目を入れる縁起だるま。' },
        { name: '焼きまんじゅう屋台', icon: '🍡', cat: 'food', price: 70, rate: 50, desc: '甘い味噌だれを塗って焼いたふわふわまんじゅう。' }
      ]
    },
    {
      id: 'utsunomiya', name: '宇都宮・那須', kana: 'うつのみや・なす', pref: '栃木', region: '関東', type: 'property',
      gx: 14, gy: 13, links: ['fukushima', 'takasaki', 'mito', 'tokyo'],
      properties: [
        { name: 'りんどう湖ファミリー牧場', icon: '🐄', cat: 'attraction', price: 680, rate: 35, desc: '湖上を飛ぶジップラインやアルパカ牧場、観覧車が大人気の那須の楽園！' },
        { name: '日光おさる軍団シアター', icon: '🐒', cat: 'attraction', price: 400, rate: 30, desc: 'おさるさんのサッカーやコントに子供たちが大爆笑！' },
        { name: '東武ミニチュアワールド', icon: '🏰', cat: 'attraction', price: 450, rate: 25, desc: '世界中の有名建築が1/25サイズで並ぶ不思議の国！' },
        { name: '宇都宮パリパリ餃子館', icon: '🥟', cat: 'food', price: 140, rate: 50, desc: '焼き餃子・水餃子・揚げ餃子を食べ比べ！' },
        { name: 'とちおとめイチゴ農園', icon: '🍓', cat: 'farm', price: 260, rate: 35, desc: '真っ赤で大きなイチゴ狩り体験ハウス！' }
      ]
    },
    {
      id: 'mito', name: '水戸・ひたち', kana: 'みと・ひたち', pref: '茨城', region: '関東', type: 'property',
      gx: 15, gy: 13, links: ['n_tohoku_5', 'utsunomiya', 'chiba'],
      properties: [
        { name: 'ひたち海浜ネモフィラ遊園地', icon: '🌷', cat: 'attraction', price: 550, rate: 30, desc: '青い花の丘と大観覧車・アスレチックで一日中遊べる！' },
        { name: '大洗サメ＆マンボウ水族館', icon: '🦈', cat: 'attraction', price: 480, rate: 25, desc: 'サメの種類日本一！オーシャンライブも大迫力！' },
        { name: 'ミュージアムパーク恐竜館', icon: '🦖', cat: 'attraction', price: 320, rate: 25, desc: '巨大マンモスや動く恐竜ロボットに大興奮！' },
        { name: '水戸ねばねば納豆工場', icon: '🫘', cat: 'food', price: 80, rate: 50, desc: 'わら包み納豆から納豆スナックまで製造。' },
        { name: '黄金の干し芋ファーム', icon: '🍠', cat: 'farm', price: 150, rate: 40, desc: '甘くてねっとり美味しい日本一の干し芋畑。' }
      ]
    },
    {
      id: 'fukui', name: '福井', kana: 'ふくい', pref: '福井', region: '中部', type: 'property',
      gx: 10, gy: 14, links: ['kanazawa', 'n_chubu_4', 'gifu', 'otsu'],
      properties: [
        { name: '恐竜発掘フィールド＆大博物館', icon: '🦖', cat: 'attraction', price: 780, rate: 35, desc: '動くティラノサウルスと本物の化石発掘体験ができる世界三大恐竜博物館！' },
        { name: '芝政スーパーウォータープール', icon: '🌊', cat: 'attraction', price: 520, rate: 25, desc: 'ギネス級の巨大ウォータースライダーが並ぶ海辺の楽園！' },
        { name: '越前ガニ漁船団', icon: '🦀', cat: 'marine', price: 500, rate: 30, desc: '黄色いタグが目印の冬の味覚の王様！' },
        { name: '羽二重餅おかし本舗', icon: '🍡', cat: 'food', price: 100, rate: 45, desc: 'シルクのようにふわっふわで柔らかいお餅。' }
      ]
    },
    {
      id: 'gifu', name: '岐阜・高山', kana: 'ぎふ・たかやま', pref: '岐阜', region: '中部', type: 'property',
      gx: 11, gy: 14, links: ['toyama', 'fukui', 'nagano', 'nagoya'],
      properties: [
        { name: '金華山リス村＆ロープウェイ', icon: '🐿️', cat: 'attraction', price: 300, rate: 35, desc: '手袋の上にちょこんと乗ってくる可愛いリスたちにエサやり！' },
        { name: '白川郷合掌造り探検村', icon: '🏡', cat: 'attraction', price: 450, rate: 25, desc: '三角屋根の昔話みたいな家が並ぶ世界遺産の村。' },
        { name: '長良川うかい観覧船', icon: '🐦', cat: 'attraction', price: 280, rate: 25, desc: 'かがり火の中で鵜（う）が魚を捕る伝統ショー！' },
        { name: '飛騨牛にぎり寿司＆ステーキ館', icon: '🥩', cat: 'food', price: 420, rate: 35, desc: 'とろける霜降りの飛騨牛グルメ！' }
      ]
    },
    {
      id: 'nagano', name: '長野・軽井沢', kana: 'ながの・かるいざわ', pref: '長野', region: '中部', type: 'property',
      gx: 12, gy: 14, links: ['n_warp_1', 'gifu', 'saitama', 'kofu'],
      properties: [
        { name: '戸隠チビッ子忍者村', icon: '🥷', cat: 'attraction', price: 380, rate: 35, desc: '忍者服を着て水上術や手裏剣、からくり迷路に挑戦！' },
        { name: '軽井沢おもちゃ王国パーク', icon: '🧸', cat: 'attraction', price: 450, rate: 30, desc: 'おもちゃのお部屋と森のアスレチックで大冒険！' },
        { name: '地獄谷おさる温泉パーク', icon: '🐒', cat: 'attraction', price: 300, rate: 30, desc: '雪の中で気持ちよさそうに温泉に入るニホンザルたち！' },
        { name: '信州そば手打ち道場', icon: '🥢', cat: 'food', price: 140, rate: 40, desc: '自分で打った香り高い信州そばをツルッと堪能。' },
        { name: 'あつあつ野沢菜おやき工房', icon: '🥟', cat: 'food', price: 90, rate: 50, desc: '具がぎっしり詰まった信州名物おやき。' }
      ]
    },
    {
      id: 'saitama', name: 'さいたま・秩父', kana: 'さいたま・ちちぶ', pref: '埼玉', region: '関東', type: 'property',
      gx: 13, gy: 14, links: ['takasaki', 'nagano', 'tokyo', 'shinjuku'],
      properties: [
        { name: '大宮鉄道ジオラマ博物館', icon: '🚅', cat: 'attraction', price: 650, rate: 30, desc: '歴代の新幹線やSL展示、運転シミュレーターに大興奮！' },
        { name: '東武ハイブリッド動物公園', icon: '🎢', cat: 'attraction', price: 580, rate: 25, desc: 'ホワイトタイガーと水上木製コースターが両方楽しめる！' },
        { name: '長瀞わくわくラインくだり', icon: '🛶', cat: 'attraction', price: 260, rate: 30, desc: '船頭さんの竿さばきで急流をスリル満点に下る！' },
        { name: '草加せんべい手焼き体験館', icon: '🍘', cat: 'food', price: 110, rate: 45, desc: 'パリッと醤油が香る本場の草加せんべい。' }
      ]
    },
    {
      id: 'tokyo', name: '東京', kana: 'とうきょう', pref: '東京', region: '関東', type: 'property',
      gx: 14, gy: 14, links: ['utsunomiya', 'saitama', 'chiba', 'yokohama'],
      properties: [
        { name: '東京スカイツリー展望台', icon: '🗼', cat: 'attraction', price: 1800, rate: 30, desc: '高さ634メートル！雲の上から関東を一望する電波塔！' },
        { name: '上野パンダ動物園', icon: '🐼', cat: 'attraction', price: 600, rate: 30, desc: 'かわいいジャイアントパンダやハシビロコウに会える！' },
        { name: '浅草花やしき遊園地', icon: '🎢', cat: 'attraction', price: 450, rate: 25, desc: '日本最古のローラーコースターが民家のすぐ横を走る！' },
        { name: '月島もんじゃ焼きストリート', icon: '🥞', cat: 'food', price: 180, rate: 45, desc: '小さなヘラでジュージュー焼いて食べる下町グルメ。' },
        { name: '東京バナナケーキ工房', icon: '🍌', cat: 'food', price: 250, rate: 40, desc: 'バナナカスタードがたっぷり入ったお土産の王様。' }
      ]
    },
    {
      id: 'chiba', name: '舞浜・鴨川', kana: 'まいはま・かもがわ', pref: '千葉', region: '関東', type: 'property',
      gx: 15, gy: 14, links: ['mito', 'tokyo', 'airport_narita'],
      properties: [
        { name: '夢と魔法のファンタジーランド', icon: '🏰', cat: 'attraction', price: 2500, rate: 30, desc: 'パレードとアトラクションがいっぱいの日本最大の夢の王国！' },
        { name: '鴨川シャチジャンプシーワールド', icon: '🐋', cat: 'attraction', price: 620, rate: 30, desc: '海の王者シャチの大迫力水しぶきジャンプショー！' },
        { name: '市原ぞうさん王国', icon: '🐘', cat: 'attraction', price: 380, rate: 25, desc: 'ゾウさんが絵を描いたりサッカーをする動物公園。' },
        { name: '落花生ピーナッツ工場', icon: '🥜', cat: 'food', price: 140, rate: 40, desc: '千葉県産の香ばしいピーナッツ＆ソフトクリーム。' }
      ]
    },
    {
      id: 'airport_narita', name: '成田空港', kana: 'なりたくうこう', pref: '千葉', region: '関東', type: 'card',
      gx: 16, gy: 14, links: ['chiba']
    },
    {
      id: 'otsu', name: '大津・彦根', kana: 'おおつ・ひこね', pref: '滋賀', region: '近畿', type: 'property',
      gx: 10, gy: 15, links: ['fukui', 'kyoto', 'nagoya', 'nara'],
      properties: [
        { name: '琵琶湖ミシガン外輪船クルーズ', icon: '🚢', cat: 'attraction', price: 420, rate: 25, desc: '赤いパドルが回る陽気な遊覧船で日本一の湖をクルーズ！' },
        { name: '甲賀の里忍術村パーク', icon: '🥷', cat: 'attraction', price: 350, rate: 35, desc: '水ぐもの術や石垣登りなど本物の忍者修行にチャレンジ！' },
        { name: '焼きたてバウムクーヘン森の工房', icon: '🍩', cat: 'food', price: 320, rate: 40, desc: '草屋根のまるでおとぎ話のようなお店で食べるふわふわバウム！' },
        { name: '近江牛ハンバーグ館', icon: '🥩', cat: 'food', price: 380, rate: 30, desc: '肉汁があふれる滋賀自慢のブランド和牛。' }
      ]
    },
    {
      id: 'nagoya', name: '名古屋', kana: 'なごや', pref: '愛知', region: '中部', type: 'property',
      gx: 11, gy: 15, links: ['gifu', 'otsu', 'kofu', 'n_chubu_2'],
      properties: [
        { name: 'ブロックランド・ジャパン', icon: '🧱', cat: 'attraction', price: 1400, rate: 30, desc: 'カラフルなブロックで作られた街やドラゴンコースターで大冒険！' },
        { name: 'ジブリ風モリコロ大倉庫パーク', icon: '🌳', cat: 'attraction', price: 1100, rate: 30, desc: '不思議な生き物の森やネコ型バスに出会えるファンタジー公園！' },
        { name: '名古屋港シャチ＆ベルーガ水族館', icon: '🐋', cat: 'attraction', price: 650, rate: 25, desc: '日本最大級のプールでシャチとシロイルカが泳ぐ！' },
        { name: 'ひつまぶし老舗料亭', icon: '🍱', cat: 'food', price: 350, rate: 35, desc: '1杯で3通りの食べ方が楽しめる名古屋名物。' },
        { name: '黄金のシャチホコみそカツ店', icon: '🐷', cat: 'food', price: 180, rate: 45, desc: '濃厚な赤みそダレがたっぷりかかったトンカツ！' }
      ]
    },
    {
      id: 'kofu', name: '甲府・富士吉田', kana: 'こうふ・ふじよしだ', pref: '山梨', region: '中部', type: 'property',
      gx: 12, gy: 15, links: ['nagano', 'nagoya', 'shinjuku', 'shizuoka'],
      properties: [
        { name: '富士急絶叫ハイランド', icon: '🎢', cat: 'attraction', price: 950, rate: 30, desc: '富士山に向かって飛び出す世界最大級の絶叫コースターとトーマスランド！' },
        { name: '笛吹川フルーツわんぱく公園', icon: '🍇', cat: 'attraction', price: 350, rate: 30, desc: 'ガラスドームの遊具とロードトレイン、果物狩りが楽しめる！' },
        { name: 'かぼちゃほうとう鍋茶屋', icon: '🍲', cat: 'food', price: 130, rate: 45, desc: '幅広のモチモチ麺とかぼちゃが煮込まれた郷土鍋。' },
        { name: 'シャインマスカット果樹園', icon: '🍇', cat: 'farm', price: 320, rate: 35, desc: '皮ごとパリッと食べられる宝石のようなぶどう園！' }
      ]
    },
    {
      id: 'shinjuku', name: '新宿・お台場', kana: 'しんじゅく', pref: '東京', region: '関東', type: 'property',
      gx: 13, gy: 15, links: ['saitama', 'kofu', 'yokohama', 'shop_shibuya'],
      properties: [
        { name: 'お台場巨大ロボ基地', icon: '🤖', cat: 'attraction', price: 1200, rate: 30, desc: '実物大の巨大ロボットが光って変形する夢の広場！' },
        { name: '日本未来科学ミュージアム', icon: '🔬', cat: 'attraction', price: 550, rate: 25, desc: '宇宙ステーションや先端ロボットを体験できる科学館。' },
        { name: 'ドームシティ絶叫コースター', icon: '🎡', cat: 'attraction', price: 850, rate: 25, desc: 'ビルの壁や観覧車の真ん中を突き抜けるジェットコースター！' },
        { name: '江戸前寿司タワー店', icon: '🍣', cat: 'food', price: 400, rate: 35, desc: '特急レーンでお寿司が新幹線に乗って届く楽しいお寿司屋さん。' }
      ]
    },
    {
      id: 'yokohama', name: '横浜・箱根', kana: 'よこはま・はこね', pref: '神奈川', region: '関東', type: 'property',
      gx: 14, gy: 15, links: ['tokyo', 'shinjuku', 'card_izu'],
      properties: [
        { name: 'カップ麺発明ミュージアム', icon: '🍜', cat: 'attraction', price: 500, rate: 35, desc: '世界に一つだけのマイカップヌードルを作れる体験館！' },
        { name: '八景島シーパラダイス遊園地', icon: '🐬', cat: 'attraction', price: 900, rate: 30, desc: 'ジンベエザメも海上コースターも楽しめる海の遊園地！' },
        { name: '箱根芦ノ湖海賊船クルーズ', icon: '🏴‍☠️', cat: 'attraction', price: 480, rate: 25, desc: '富士山を眺めながら豪華な海賊船で湖を大航海！' },
        { name: '横浜中華街ジャンボ肉まん店', icon: '🥟', cat: 'food', price: 200, rate: 45, desc: '顔くらい大きいホカホカの肉まんとパンダまん！' },
        { name: '鎌倉ハトサブレ本舗', icon: '🕊️', cat: 'craft', price: 150, rate: 40, desc: 'サクサク甘いハトの形のバターサブレ。' }
      ]
    },
    {
      id: 'n_chubu_2', name: '浜名湖', kana: 'はまなこ', pref: '静岡', region: '中部', type: 'plus',
      gx: 11, gy: 16, links: ['nagoya', 'nara', 'shizuoka']
    },
    {
      id: 'shizuoka', name: '静岡・浜松', kana: 'しずおか・はままつ', pref: '静岡', region: '中部', type: 'property',
      gx: 12, gy: 16, links: ['kofu', 'n_chubu_2', 'shop_shibuya'],
      properties: [
        { name: '富士サファリ探検パーク', icon: '🦁', cat: 'attraction', price: 750, rate: 30, desc: '「ほんとにほんとにライオンだ〜♪」ジャングルバスで大冒険！' },
        { name: '大井川きかんしゃSL鉄道', icon: '🚂', cat: 'attraction', price: 520, rate: 30, desc: 'お顔がついた可愛い蒸気機関車が茶畑と鉄橋を走る！' },
        { name: '浜松うなぎパイおかし工場', icon: '🥧', cat: 'food', price: 260, rate: 40, desc: '巨大うなぎパイオブジェと工場見学が楽しいお菓子工場！' },
        { name: '浜名湖うなぎ蒲焼き名店', icon: '🍱', cat: 'food', price: 380, rate: 35, desc: '香ばしいタレでふっくら焼き上げた特上うな重。' },
        { name: '牧之原大茶畑ファーム', icon: '🍵', cat: 'farm', price: 200, rate: 35, desc: '見渡す限り緑の絨毯が広がる日本一の茶畑。' }
      ]
    },
    {
      id: 'shop_shibuya', name: '渋谷売場', kana: 'しぶや', pref: '東京', region: '関東', type: 'shop',
      gx: 13, gy: 16, links: ['shinjuku', 'shizuoka', 'card_izu']
    },
    {
      id: 'card_izu', name: '熱海', kana: 'あたみ', pref: '静岡', region: '中部', type: 'card',
      gx: 14, gy: 16, links: ['yokohama', 'shop_shibuya']
    },

    // ==================== 近畿・中国・四国エリア (gx: 5〜10, gy: 14〜18) ====================
    {
      id: 'n_chugoku_3', name: '石見銀山', kana: 'いわみぎんざん', pref: '島根', region: '中国', type: 'minus',
      gx: 5, gy: 14, links: ['matsue', 'shimonoseki']
    },
    {
      id: 'matsue', name: '松江・出雲', kana: 'まつえ・いずも', pref: '島根', region: '中国', type: 'property',
      gx: 6, gy: 14, links: ['n_chugoku_3', 'tottori', 'hiroshima'],
      properties: [
        { name: 'しまね海洋館アクアス（白イルカ）', icon: '🐬', cat: 'attraction', price: 550, rate: 30, desc: '幸せのバブルリング（空気の輪っか）を出すシロイルカが大人気！' },
        { name: '松江フォーゲル鳥と花の楽園', icon: '🐧', cat: 'attraction', price: 360, rate: 25, desc: '衣装を着たペンギンのお散歩やオオハシへのエサやりが楽しい！' },
        { name: '出雲三段割子そば本舗', icon: '🥢', cat: 'food', price: 140, rate: 45, desc: '赤い丸い器が3段重なった香り豊かな出雲そば。' },
        { name: '宍道湖しじみ漁船団', icon: '🐚', cat: 'marine', price: 180, rate: 35, desc: '栄養満点の大粒しじみを毎朝水揚げ！' }
      ]
    },
    {
      id: 'tottori', name: '鳥取・境港', kana: 'とっとり・さかいみなと', pref: '鳥取', region: '中国', type: 'property',
      gx: 7, gy: 14, links: ['matsue', 'n_kinki_1', 'okayama'],
      properties: [
        { name: '鳥取砂丘ラクダライド＆サンドボード', icon: '🐪', cat: 'attraction', price: 420, rate: 30, desc: '日本最大の砂丘でラクダに乗ったり砂の滑り台で遊ぼう！' },
        { name: '境港妖怪ブロンズストリート', icon: '👻', cat: 'attraction', price: 480, rate: 35, desc: '170体以上のユニークな妖怪像が並ぶワクワク妖怪ロード！' },
        { name: '北栄町名探偵ミステリー館', icon: '🕵️', cat: 'attraction', price: 380, rate: 30, desc: 'スケボーや蝶ネクタイ変声機のトリックを体験できる科学探偵館！' },
        { name: '二十世紀梨みずみずしい果樹園', icon: '🍐', cat: 'farm', price: 200, rate: 35, desc: 'シャキシャキ甘い鳥取名産の青梨農園。' }
      ]
    },
    {
      id: 'n_kinki_1', name: '天橋立', kana: 'あまのはしだて', pref: '京都', region: '近畿', type: 'plus',
      gx: 8, gy: 14, links: ['tottori', 'n_chubu_4', 'kobe']
    },
    {
      id: 'n_chubu_4', name: '敦賀', kana: 'つるが', pref: '福井', region: '中部', type: 'card',
      gx: 9, gy: 14, links: ['n_kinki_1', 'fukui', 'kyoto']
    },
    {
      id: 'shimonoseki', name: '下関・秋吉台', kana: 'しものせき', pref: '山口', region: '中国', type: 'property',
      gx: 5, gy: 15, links: ['n_chugoku_3', 'n_kyushu_1', 'hiroshima'],
      properties: [
        { name: '秋芳洞3億年大鍾乳洞探検', icon: '🦇', cat: 'attraction', price: 450, rate: 30, desc: '百枚皿や黄金柱が並ぶ日本最大級の神秘の地下宮殿を大探検！' },
        { name: '秋吉台サファリ動物ランド', icon: '🦁', cat: 'attraction', price: 420, rate: 25, desc: 'ホワイトタイガーやゾウさんにエサやり体験ができる動物公園！' },
        { name: '海響館ペンギン＆フグ水族館', icon: '🐡', cat: 'attraction', price: 480, rate: 25, desc: '世界中のフグ100種類とペンギン村が人気の水族館！' },
        { name: '下関とらふぐ老舗料亭', icon: '🐡', cat: 'food', price: 550, rate: 30, desc: '透き通るようなフグ刺しとフグちり鍋の名店。' },
        { name: 'アツアツ瓦そば本舗', icon: '🥢', cat: 'food', price: 150, rate: 40, desc: '本物の熱い瓦の上で茶そばとお肉をパリッと焼いて食べる！' }
      ]
    },
    {
      id: 'hiroshima', name: '広島・宮島', kana: 'ひろしま・みやじま', pref: '広島', region: '中国', type: 'property',
      gx: 6, gy: 15, links: ['matsue', 'shimonoseki', 'okayama', 'n_chugoku_2'],
      properties: [
        { name: '宮島ロープウェイ＆スナメリ水族館', icon: '🦌', cat: 'attraction', price: 520, rate: 30, desc: '海に浮かぶ大鳥居とニコニコ顔のイルカ「スナメリ」に会える！' },
        { name: '呉巨大戦艦＆潜水艦ミュージアム', icon: '🚢', cat: 'attraction', price: 480, rate: 25, desc: '1/10サイズの巨大戦艦模型と本物の巨大潜水艦の中を探検！' },
        { name: 'みろくの里昭和レトロ遊園地', icon: '🎡', cat: 'attraction', price: 380, rate: 25, desc: '恐竜パークと駄菓子屋さんが並ぶ楽しいテーマパーク！' },
        { name: '広島焼きお好み村タワー', icon: '🥞', cat: 'food', price: 220, rate: 50, desc: 'キャベツと焼きそばがたっぷり重なった本場の広島風お好み焼き！' },
        { name: '焼きたてもみじ饅頭工場', icon: '🍁', cat: 'food', price: 160, rate: 45, desc: 'あんこ・クリーム・チョコに揚げもみじも大人気！' }
      ]
    },
    {
      id: 'okayama', name: '岡山・倉敷', kana: 'おかやま・くらしき', pref: '岡山', region: '中国', type: 'property',
      gx: 7, gy: 15, links: ['tottori', 'hiroshima', 'kobe', 'n_chugoku_1'],
      properties: [
        { name: 'ブラジリアン鷲羽山ハイランド', icon: '🎢', cat: 'attraction', price: 480, rate: 30, desc: '瀬戸大橋を見下ろす天空のスカイサイクルとサンバショー！' },
        { name: '玉野おもちゃ王国本部', icon: '🧸', cat: 'attraction', price: 450, rate: 30, desc: 'トミカ・プラレールやリカちゃんなど18のおもちゃパビリオン！' },
        { name: '桃太郎きびだんご本舗', icon: '🍡', cat: 'food', price: 100, rate: 55, desc: 'お供のイヌ・サル・キジも大喜びの可愛いパッケージのきびだんご！' },
        { name: '岡山白桃パフェ果樹園', icon: '🍑', cat: 'farm', price: 300, rate: 35, desc: 'とろける甘さの白桃とマスカットの果樹園。' }
      ]
    },
    {
      id: 'kobe', name: '神戸・姫路', kana: 'こうべ・ひめじ', pref: '兵庫', region: '近畿', type: 'property',
      gx: 8, gy: 15, links: ['n_kinki_1', 'okayama', 'kyoto', 'n_kinki_2'],
      properties: [
        { name: '姫路セントラルサファリ＆遊園地', icon: '🦁', cat: 'attraction', price: 680, rate: 30, desc: '空を飛ぶスカイサファリとドライブスルーサファリが楽しめる！' },
        { name: '神戸どうぶつ王国パーク', icon: '🦩', cat: 'attraction', price: 520, rate: 30, desc: 'カピバラやハシビロコウ、バードショーが目の前で見られる全天候型パーク！' },
        { name: '淡路島ニジゲンアニメの森', icon: '🐉', cat: 'attraction', price: 600, rate: 25, desc: '巨大怪獣の口の中にジップラインで飛び込むアトラクション公園！' },
        { name: '最高級神戸牛ステーキ館', icon: '🥩', cat: 'food', price: 650, rate: 30, desc: '目の前の鉄板でシェフが焼き上げる極上神戸ビーフ。' },
        { name: '明石焼き（玉子焼）本舗', icon: '🐙', cat: 'food', price: 120, rate: 45, desc: 'お出汁につけて食べるふわっふわのタコ入り玉子焼！' }
      ]
    },
    {
      id: 'kyoto', name: '京都', kana: 'きょうと', pref: '京都', region: '近畿', type: 'property',
      gx: 9, gy: 15, links: ['n_chubu_4', 'kobe', 'otsu', 'osaka'],
      properties: [
        { name: '太秦時代劇映画村（忍者＆迷路）', icon: '🎬', cat: 'attraction', price: 750, rate: 30, desc: '江戸の町並みで立体忍者迷路や巨大ヒーロー展示を楽しめる！' },
        { name: '京都鉄道ジオラマ大博物館', icon: '🚂', cat: 'attraction', price: 680, rate: 30, desc: '本物の蒸気機関車扇形車庫とSLスチーム号に乗れる！' },
        { name: '保津川トロッコ列車＆川下り', icon: '🚃', cat: 'attraction', price: 400, rate: 25, desc: '渓谷の絶景をガタゴト走るオープンカー列車。' },
        { name: '宇治抹茶パフェ茶屋', icon: '🍵', cat: 'food', price: 220, rate: 45, desc: '香り高い宇治抹茶アイスと白玉の贅沢パフェ。' },
        { name: '生八ツ橋手焼きおかし工房', icon: '🥟', cat: 'craft', price: 180, rate: 40, desc: 'ニッキやイチゴ、チョコ味もある三角形の京都銘菓。' }
      ]
    },
    {
      id: 'n_chugoku_2', name: 'しまなみ海道', kana: 'しまなみ', pref: '広島', region: '中国', type: 'card',
      gx: 6, gy: 16, links: ['hiroshima', 'matsuyama']
    },
    {
      id: 'n_chugoku_1', name: '瀬戸大橋', kana: 'せとおおはし', pref: '岡山', region: '中国', type: 'plus',
      gx: 7, gy: 16, links: ['okayama', 'takamatsu']
    },
    {
      id: 'n_kinki_2', name: '淡路島', kana: 'あわじしま', pref: '兵庫', region: '近畿', type: 'plus',
      gx: 8, gy: 16, links: ['kobe', 'osaka', 'tokushima']
    },
    {
      id: 'osaka', name: '大阪', kana: 'おおさか', pref: '大阪', region: '近畿', type: 'property',
      gx: 9, gy: 16, links: ['kyoto', 'n_kinki_2', 'nara', 'shop_nanba'],
      properties: [
        { name: 'ハリウッド映画スタジオパーク', icon: '🌎', cat: 'attraction', price: 2400, rate: 30, desc: 'ゲームの国や魔法界、恐竜コースターで大興奮の巨大テーマパーク！' },
        { name: '海遊館ジンベエザメ大水族館', icon: '🦈', cat: 'attraction', price: 850, rate: 30, desc: '太平洋の巨大水槽をゆったり泳ぐジンベエザメと隣の大観覧車！' },
        { name: 'キッズプラザ科学あそび館', icon: '🎪', cat: 'attraction', price: 400, rate: 25, desc: '巨大なシャボン玉の中に入ったりお店屋さんごっこができる子供の城！' },
        { name: '道頓堀あつあつたこ焼き道場', icon: '🐙', cat: 'food', price: 160, rate: 55, desc: '外はカリッ、中はトロ〜リ！大ダコ入りの本場たこ焼き！' },
        { name: '二度づけ禁止串カツ本舗', icon: '🍢', cat: 'food', price: 240, rate: 45, desc: 'サクサク揚げたての串カツ名店チェーン。' }
      ]
    },
    {
      id: 'nara', name: '奈良', kana: 'なら', pref: '奈良', region: '近畿', type: 'property',
      gx: 10, gy: 16, links: ['otsu', 'osaka', 'n_chubu_2', 'ise'],
      properties: [
        { name: '奈良公園シカせんべい広場', icon: '🦌', cat: 'attraction', price: 350, rate: 35, desc: 'ペコリとお辞儀をする可愛いシカさんたちにせんべいをあげよう！' },
        { name: '生駒山上レトロ遊園地', icon: '🎠', cat: 'attraction', price: 420, rate: 25, desc: '可愛いブルドッグやミケネコのケーブルカーで行く山の上の遊園地！' },
        { name: '金魚ミュージアムワンダー館', icon: '🐠', cat: 'attraction', price: 280, rate: 30, desc: 'キラキラのアート水槽で色とりどりの金魚が泳ぐ！' },
        { name: 'まほろば大仏プリン本舗', icon: '🍮', cat: 'food', price: 110, rate: 50, desc: '可愛い大仏様のイラスト瓶に入ったとろけるプリン！' },
        { name: '柿の葉寿司老舗', icon: '🍣', cat: 'food', price: 180, rate: 35, desc: '柿の葉で包んだ伝統のサバ・サケ押し寿司。' }
      ]
    },
    {
      id: 'matsuyama', name: '松山', kana: 'まつやま', pref: '愛媛', region: '四国', type: 'property',
      gx: 6, gy: 17, links: ['n_chugoku_2', 'ferry_beppu', 'takamatsu', 'n_shikoku_1'],
      properties: [
        { name: '松山城ロープウェイ＆リフト体験', icon: '🏯', cat: 'attraction', price: 380, rate: 30, desc: '1人乗りリフトでお城へ登り、甲冑（よろい）試着体験！' },
        { name: 'とべ動物園しろくまパーク', icon: '🐻‍❄️', cat: 'attraction', price: 420, rate: 25, desc: 'ホッキョクグマやジップラインで谷を越える冒険動物園！' },
        { name: '道後温泉坊っちゃんからくり時計', icon: '🕰️', cat: 'attraction', price: 300, rate: 30, desc: '音楽とともに人形たちが飛び出す楽しい時計台と足湯！' },
        { name: '蛇口からみかんジューススタンド', icon: '🍊', cat: 'food', price: 140, rate: 55, desc: '水道の蛇口をひねると100%みかんジュースが出てくる夢のお店！' },
        { name: 'ふわふわ今治タオル工房', icon: '🧣', cat: 'craft', price: 250, rate: 35, desc: '雲みたいに柔らかくて吸水力抜群の高級タオル。' }
      ]
    },
    {
      id: 'takamatsu', name: '高松・丸亀', kana: 'たかまつ・まるがめ', pref: '香川', region: '四国', type: 'property',
      gx: 7, gy: 17, links: ['n_chugoku_1', 'matsuyama', 'tokushima', 'kochi'],
      properties: [
        { name: 'ニューレオマワールド遊園地', icon: '🎢', cat: 'attraction', price: 620, rate: 30, desc: 'パレードやごっこタウン、空中ブランコが楽しい中四国最大級の遊園地！' },
        { name: '四国次世代うずしお水族館', icon: '🐬', cat: 'attraction', price: 480, rate: 25, desc: '夕日をバックにジャンプするイルカプールが絶景！' },
        { name: '中野うどん学校（足踏み体験）', icon: '🍜', cat: 'attraction', price: 220, rate: 45, desc: '音楽に合わせて生地を足踏み！自分だけの讃岐うどんを作ろう！' },
        { name: '丸亀パリパリ骨付鳥専門店', icon: '🍗', cat: 'food', price: 180, rate: 45, desc: 'スパイシーでジューシーに焼き上げた豪快な鶏もも肉！' }
      ]
    },
    {
      id: 'tokushima', name: '徳島・鳴門', kana: 'とくしま・なると', pref: '徳島', region: '四国', type: 'property',
      gx: 8, gy: 17, links: ['n_kinki_2', 'takamatsu', 'shop_nanba', 'plus_muroto'],
      properties: [
        { name: '鳴門のうずしお水中観潮船', icon: '🌀', cat: 'attraction', price: 450, rate: 30, desc: '世界最大級の渦潮を船底の水中展望室から間近で観察！' },
        { name: '阿波おどり体験にぎわい会館', icon: '💃', cat: 'attraction', price: 320, rate: 30, desc: '「踊る阿呆に見る阿呆♪」みんなで楽しく阿波おどり体験！' },
        { name: '祖谷のかずら橋スリル体験', icon: '🌉', cat: 'attraction', price: 240, rate: 30, desc: '植物のツルで編まれたドキドキ揺れる秘境の吊り橋！' },
        { name: 'なると金時スイートポテト工場', icon: '🍠', cat: 'farm', price: 180, rate: 40, desc: '栗のようにホクホク甘いブランドさつまいも。' }
      ]
    },
    {
      id: 'shop_nanba', name: '難波売場', kana: 'なんば', pref: '大阪', region: '近畿', type: 'shop',
      gx: 9, gy: 17, links: ['osaka', 'tokushima', 'shirahama']
    },
    {
      id: 'ise', name: '伊勢・鈴鹿', kana: 'いせ・すずか', pref: '三重', region: '近畿', type: 'property',
      gx: 10, gy: 17, links: ['nara', 'n_warp_2'],
      properties: [
        { name: '鈴鹿レーシングサーキット遊園地', icon: '🏎️', cat: 'attraction', price: 850, rate: 30, desc: '子供が自分で運転できるレーシングカートやバイクがいっぱい！' },
        { name: 'ナガシマ絶叫スパーランド', icon: '🎢', cat: 'attraction', price: 920, rate: 30, desc: '世界最大級の木製＆ハイブリッドコースターがそびえ立つ！' },
        { name: '鳥羽ラッコ＆ジュゴン水族館', icon: '🦦', cat: 'attraction', price: 540, rate: 25, desc: '飼育種類数日本一！かわいいラッコのお食事タイムが人気！' },
        { name: '松阪牛すき焼き本舗', icon: '🥩', cat: 'food', price: 500, rate: 30, desc: 'お口の中でとろける世界のブランド松阪牛。' },
        { name: '伊勢名物あんころ餅茶屋', icon: '🍡', cat: 'food', price: 150, rate: 45, desc: 'おかげ横丁で大人気のお餅スイーツ。' }
      ]
    },
    {
      id: 'n_shikoku_1', name: '四万十川', kana: 'しまんと', pref: '高知', region: '四国', type: 'plus',
      gx: 6, gy: 18, links: ['matsuyama', 'kochi']
    },
    {
      id: 'kochi', name: '高知', kana: 'こうち', pref: '高知', region: '四国', type: 'property',
      gx: 7, gy: 18, links: ['takamatsu', 'n_shikoku_1', 'plus_muroto'],
      properties: [
        { name: 'やなせたかし風絵本ミュージアム', icon: '🦸', cat: 'attraction', price: 520, rate: 35, desc: '正義のヒーローたちの絵画やジオラマがいっぱいの夢の美術館！' },
        { name: '桂浜トド＆ウミガメ水族館', icon: '🦭', cat: 'attraction', price: 360, rate: 30, desc: 'ウミガメやカワウソにエサやりができるユーモア満点の浜辺の水族館！' },
        { name: 'のいちジャングル動物公園', icon: '🦒', cat: 'attraction', price: 380, rate: 25, desc: '檻がなくて動物たちが自然の中で暮らす日本有数の動物園！' },
        { name: 'カツオの豪快藁焼きタタキ店', icon: '🐟', cat: 'food', price: 240, rate: 45, desc: '1メートルの炎で一気に焼き上げる香ばしいカツオのタタキ！' },
        { name: '馬路村ゆずジュース農園', icon: '🍋', cat: 'farm', price: 150, rate: 40, desc: '爽やかな香りのゆずドリンク「ごっくん」工場。' }
      ]
    },
    {
      id: 'plus_muroto', name: '室戸岬', kana: 'むろと', pref: '高知', region: '四国', type: 'plus',
      gx: 8, gy: 18, links: ['tokushima', 'kochi']
    },
    {
      id: 'shirahama', name: '白浜・和歌山', kana: 'しらはま・わかやま', pref: '和歌山', region: '近畿', type: 'property',
      gx: 9, gy: 18, links: ['shop_nanba', 'n_warp_2'],
      properties: [
        { name: '南紀白浜パンダアドベンチャー', icon: '🐼', cat: 'attraction', price: 950, rate: 30, desc: 'パンダファミリーにサファリ、イルカショー、遊園地が全部そろう夢の楽園！' },
        { name: 'ポルトヨーロッパ海辺遊園地', icon: '⚓', cat: 'attraction', price: 480, rate: 25, desc: 'ヨーロッパの港町を再現したテーマパークと黒潮市場のマグロ解体ショー！' },
        { name: 'たま駅長ねこ電車', icon: '🐱', cat: 'attraction', price: 260, rate: 35, desc: 'ネコの耳とヒゲがついた可愛い電車に乗って出発進行！' },
        { name: '有田みかん甘い果樹園', icon: '🍊', cat: 'farm', price: 220, rate: 40, desc: '太陽をたっぷり浴びた甘〜い和歌山みかん畑。' },
        { name: '紀州南高梅干し工場', icon: '🔴', cat: 'food', price: 180, rate: 35, desc: 'はちみつ漬けも大人気のふっくら大粒梅干し。' }
      ]
    },
    {
      id: 'n_warp_2', name: '海底ワープ', kana: 'かいていわーぷ', pref: '和歌山', region: '近畿', type: 'warp',
      gx: 10, gy: 18, links: ['ise', 'shirahama']
    },

    // ==================== 九州・沖縄エリア (gx: 2〜5, gy: 15〜21) ====================
    {
      id: 'shop_tenjin', name: '天神売場', kana: 'てんじん', pref: '福岡', region: '九州', type: 'shop',
      gx: 3, gy: 15, links: ['n_kyushu_1', 'saga']
    },
    {
      id: 'n_kyushu_1', name: '関門海峡', kana: 'かんもん', pref: '福岡', region: '九州', type: 'card',
      gx: 4, gy: 15, links: ['shop_tenjin', 'shimonoseki', 'hakata']
    },
    {
      id: 'nagasaki', name: '長崎・佐世保', kana: 'ながさき・させぼ', pref: '長崎', region: '九州', type: 'property',
      gx: 2, gy: 16, links: ['saga', 'plus_goto'],
      properties: [
        { name: 'ハウステンボス風オランダ王国', icon: '🌷', cat: 'attraction', price: 1300, rate: 30, desc: '風車とチューリップ、3階建てメリーゴーランドや光の王国が広がる街！' },
        { name: '長崎ペンギン大行進水族館', icon: '🐧', cat: 'attraction', price: 420, rate: 30, desc: '世界にいるペンギン18種類のうち9種類に会えるペンギン天国！' },
        { name: '九十九島パール海賊遊覧船', icon: '🚢', cat: 'attraction', price: 360, rate: 25, desc: '無数の島々を縫って進むクルーズと真珠の玉出し体験！' },
        { name: '長崎ザラメ黄金カステラ本舗', icon: '🍰', cat: 'food', price: 240, rate: 45, desc: '底のザラメがジャリッと甘い伝統のふわふわカステラ！' },
        { name: '長崎ちゃんぽん＆佐世保バーガー店', icon: '🍔', cat: 'food', price: 200, rate: 45, desc: '具だくさんちゃんぽんとジャンボ手作りバーガー！' }
      ]
    },
    {
      id: 'saga', name: '佐賀・吉野ヶ里', kana: 'さが・よしのがり', pref: '佐賀', region: '九州', type: 'property',
      gx: 3, gy: 16, links: ['shop_tenjin', 'nagasaki', 'hakata', 'kumamoto'],
      properties: [
        { name: '吉野ヶ里弥生タイムスリップ公園', icon: '🏺', cat: 'attraction', price: 380, rate: 30, desc: '物見やぐらや竪穴住居、火おこし体験と巨大トランポリンで遊ぼう！' },
        { name: '佐賀バルーン熱気球ミュージアム', icon: '🎈', cat: 'attraction', price: 340, rate: 30, desc: 'フライトシミュレーターで空飛ぶ熱気球パイロット体験！' },
        { name: '肥前夢街道ちびっこ忍者村', icon: '🥷', cat: 'attraction', price: 300, rate: 30, desc: '手裏剣や吹き矢、からくり屋敷が楽しい温泉地の忍者パーク！' },
        { name: '呼子の透明イカ活け造り店', icon: '🦑', cat: 'marine', price: 260, rate: 40, desc: '透き通るほど新鮮なイカの刺し身とイカしゅうまい！' }
      ]
    },
    {
      id: 'hakata', name: '博多・北九州', kana: 'はかた', pref: '福岡', region: '九州', type: 'property',
      gx: 4, gy: 16, links: ['n_kyushu_1', 'saga', 'n_kyushu_2', 'beppu'],
      properties: [
        { name: 'ららぽーと実物大ロボ＆お仕事体験館', icon: '🤖', cat: 'attraction', price: 1100, rate: 30, desc: '巨大な動くロボットと約100種類のお仕事ごっこができるこども都市！' },
        { name: 'マリンワールド海の中道水族館', icon: '🐬', cat: 'attraction', price: 650, rate: 30, desc: '博多湾をバックに飛ぶイルカとラッコ、サメ大水槽が大人気！' },
        { name: '北九州スペース宇宙科学館', icon: '🚀', cat: 'attraction', price: 450, rate: 25, desc: '竜巻ラボやプラネタリウムで宇宙と科学を体感！' },
        { name: '博多とんこつラーメン屋台街', icon: '🍜', cat: 'food', price: 180, rate: 55, desc: '「バリカタ替え玉！」濃厚クリーミーな本場とんこつラーメン！' },
        { name: 'あまおうイチゴ＆明太子本舗', icon: '🍓', cat: 'food', price: 320, rate: 40, desc: 'あかい・まるい・おおきい・うまい苺と名物明太子！' }
      ]
    },
    {
      id: 'n_kyushu_2', name: '湯布院', kana: 'ゆふいん', pref: '大分', region: '九州', type: 'plus',
      gx: 5, gy: 16, links: ['hakata', 'ferry_beppu']
    },
    {
      id: 'plus_goto', name: '天草・五島', kana: 'あまくさ', pref: '熊本', region: '九州', type: 'plus',
      gx: 2, gy: 17, links: ['nagasaki', 'kumamoto']
    },
    {
      id: 'kumamoto', name: '熊本・阿蘇', kana: 'くまもと・あそ', pref: '熊本', region: '九州', type: 'property',
      gx: 3, gy: 17, links: ['saga', 'plus_goto', 'beppu', 'n_kyushu_3'],
      properties: [
        { name: '阿蘇カドリーこぐま＆動物牧場', icon: '🐻', cat: 'attraction', price: 520, rate: 30, desc: 'かわいい赤ちゃんグマを抱っこしたり動物ショーを楽しめる牧場！' },
        { name: '荒尾グリーンランド大遊園地', icon: '🎡', cat: 'attraction', price: 680, rate: 30, desc: 'アトラクション数日本一級！高さ105mの大観覧車がある九州最大の遊園地！' },
        { name: '天草野生イルカウォッチング船', icon: '🐬', cat: 'attraction', price: 400, rate: 30, desc: '船のすぐ横をジャンプする野生のイルカの群れに会える！' },
        { name: '黒亭風焦がしニンニク熊本ラーメン', icon: '🍜', cat: 'food', price: 150, rate: 45, desc: '香ばしい黒マー油が食欲をそそる濃厚ラーメン。' },
        { name: 'ホクホクいきなり団子本舗', icon: '🍠', cat: 'food', price: 90, rate: 50, desc: '輪切りのサツマイモとあんこを包んで蒸した素朴なおやつ。' }
      ]
    },
    {
      id: 'beppu', name: '別府・大分', kana: 'べっぷ・おおいた', pref: '大分', region: '九州', type: 'property',
      gx: 4, gy: 17, links: ['hakata', 'kumamoto', 'ferry_beppu', 'miyazaki'],
      properties: [
        { name: '別府地獄めぐり（ワニ＆青い湯）', icon: '👹', cat: 'attraction', price: 550, rate: 35, desc: 'コバルトブルーの海地獄や真っ赤な血の池地獄、ワニ園をめぐる大冒険！' },
        { name: '九州自然動物アフリカンサファリ', icon: '🦁', cat: 'attraction', price: 620, rate: 30, desc: 'ジャングルバスからライオンやキリン、ゾウにエサやり体験！' },
        { name: '高崎山おさる＆うみたまご水族館', icon: '🐒', cat: 'attraction', price: 580, rate: 25, desc: '股くぐりで福を呼ぶ野生のサル山とセイウチの腹筋ショー！' },
        { name: '別府ラクテンチケーブル遊園地', icon: '🎠', cat: 'attraction', price: 350, rate: 25, desc: '名物の「あひるの徒競走」が可愛い山の上の遊園地！' },
        { name: '大分とり天＆からあげ専門店', icon: '🍗', cat: 'food', price: 160, rate: 45, desc: 'サクふわの鶏天とジューシーな中津からあげ！' }
      ]
    },
    {
      id: 'ferry_beppu', name: '豊後フェリー', kana: 'ぶんご', pref: '大分', region: '九州', type: 'plus',
      gx: 5, gy: 17, links: ['n_kyushu_2', 'beppu', 'matsuyama']
    },
    {
      id: 'n_kyushu_3', name: '霧島', kana: 'きりしま', pref: '鹿児島', region: '九州', type: 'minus',
      gx: 3, gy: 18, links: ['kumamoto', 'miyazaki', 'kagoshima']
    },
    {
      id: 'miyazaki', name: '宮崎', kana: 'みやざき', pref: '宮崎', region: '九州', type: 'property',
      gx: 4, gy: 18, links: ['beppu', 'n_kyushu_3', 'plus_tanegashima'],
      properties: [
        { name: 'サンメッセ日南モアイ像パーク', icon: '🗿', cat: 'attraction', price: 420, rate: 30, desc: '青い海をバックに7体の巨大モアイ像が並ぶ南国パーク！' },
        { name: 'フェニックスフラミンゴ動物園', icon: '🦩', cat: 'attraction', price: 380, rate: 25, desc: '空を舞うフラミンゴショーやゾウさんのお散歩が人気！' },
        { name: '高千穂あまてらす鉄道＆ボート', icon: '🚂', cat: 'attraction', price: 350, rate: 30, desc: 'シャボン玉を飛ばしながら高さ105mの鉄橋を渡る絶景カート！' },
        { name: 'タルタルたっぷりチキン南蛮本舗', icon: '🍗', cat: 'food', price: 180, rate: 45, desc: '甘酢と特製タルタルソースが絶品の宮崎ソウルフード！' },
        { name: '太陽の完熟マンゴー温室農園', icon: '🥭', cat: 'farm', price: 360, rate: 35, desc: 'とろける甘さの最高級アップルマンゴー。' }
      ]
    },
    {
      id: 'kagoshima', name: '鹿児島', kana: 'かごしま', pref: '鹿児島', region: '九州', type: 'property',
      gx: 3, gy: 19, links: ['n_kyushu_3', 'plus_tanegashima', 'ferry_amami'],
      properties: [
        { name: '桜島フェリー＆恐竜アスレチック公園', icon: '🌋', cat: 'attraction', price: 480, rate: 30, desc: '煙を上げる活火山へフェリーで渡り、実物大の恐竜滑り台で遊ぼう！' },
        { name: 'いおワールド黒潮大水槽水族館', icon: '🐋', cat: 'attraction', price: 520, rate: 25, desc: 'ジンベエザメやマグロ、青空イルカ水路が楽しい水族館！' },
        { name: '種子島ロケット宇宙センター', icon: '🚀', cat: 'attraction', price: 750, rate: 30, desc: '海に面した世界一美しいロケット発射場と宇宙科学館！' },
        { name: '天文館むじゃき風しろくま氷カフェ', icon: '🍧', cat: 'food', price: 140, rate: 50, desc: '練乳とフルーツが盛り付けられた可愛い白熊のかき氷！' },
        { name: 'かごしま黒豚しゃぶしゃぶ亭', icon: '🐷', cat: 'food', price: 320, rate: 35, desc: '甘みがあって柔らかい本場の六白黒豚。' }
      ]
    },
    {
      id: 'plus_tanegashima', name: '種子島', kana: 'たねがしま', pref: '鹿児島', region: '九州', type: 'plus',
      gx: 4, gy: 19, links: ['miyazaki', 'kagoshima']
    },
    {
      id: 'ferry_amami', name: '奄美航路', kana: 'あまみ', pref: '鹿児島', region: '九州', type: 'card',
      gx: 3, gy: 20, links: ['kagoshima', 'naha']
    },
    {
      id: 'plus_ishigaki', name: '石垣島', kana: 'いしがきじま', pref: '沖縄', region: '沖縄', type: 'plus',
      gx: 2, gy: 21, links: ['naha']
    },
    {
      id: 'naha', name: '那覇・美ら海', kana: 'なは・ちゅらうみ', pref: '沖縄', region: '沖縄', type: 'property',
      gx: 3, gy: 21, links: ['ferry_amami', 'plus_ishigaki', 'airport_naha'],
      properties: [
        { name: '美ら海ジンベエザメ大水族館', icon: '🦈', cat: 'attraction', price: 1200, rate: 35, desc: '巨大黒潮水槽をジンベエザメとナンヨウマンタが泳ぐ感動の水族館！' },
        { name: '名護パイナップル自動カートパーク', icon: '🍍', cat: 'attraction', price: 480, rate: 35, desc: '「パッパパイナップル〜♪」自動運転のパイナップル号でジャングルと恐竜探検！' },
        { name: 'おきなわワールド鍾乳洞＆エイサー村', icon: '🌺', cat: 'attraction', price: 520, rate: 30, desc: '東洋一の玉泉洞探検と大迫力のスーパーエイサー太鼓ショー！' },
        { name: '首里ソーキ沖縄そば食堂', icon: '🍜', cat: 'food', price: 150, rate: 45, desc: 'とろとろに煮込んだお肉が乗った沖縄そば。' },
        { name: '御菓子御殿風紅いもタルト工場', icon: '🍠', cat: 'food', price: 260, rate: 40, desc: '鮮やかな紫色の紅いもを使った大人気沖縄スイーツ！' }
      ]
    },
    {
      id: 'airport_naha', name: '那覇空港', kana: 'なはくうこう', pref: '沖縄', region: '沖縄', type: 'card',
      gx: 4, gy: 21, links: ['naha']
    }
  ];

  // ピクセル座標への変換
  const STATIONS = RAW_STATIONS.map(s => ({
    ...s,
    x: s.gx * GRID_STEP_X,
    y: s.gy * GRID_STEP_Y,
    links: Array.from(new Set(s.links || []))
  }));

  const STATION_MAP = new Map();
  STATIONS.forEach(s => STATION_MAP.set(s.id, s));

  // 全リンクの双方向性を強制保証
  STATIONS.forEach(s => {
    s.links.forEach(targetId => {
      const target = STATION_MAP.get(targetId);
      if (target && !target.links.includes(s.id)) {
        target.links.push(s.id);
      }
    });
  });

  const PROPERTY_STATIONS = STATIONS.filter(s => s.type === 'property');

  /**
   * ある駅から上下左右（up / down / left / right）に接続している隣接駅IDを返す
   * すべての路線が100%縦か横なので、完全に一意に決まる！
   */
  function getDirectionalNeighbors(stationId) {
    const st = STATION_MAP.get(stationId);
    const dirs = { up: null, down: null, left: null, right: null };
    if (!st) return dirs;

    st.links.forEach(nid => {
      const n = STATION_MAP.get(nid);
      if (!n) return;
      if (n.gx === st.gx && n.gy < st.gy) dirs.up = nid;
      else if (n.gx === st.gx && n.gy > st.gy) dirs.down = nid;
      else if (n.gy === st.gy && n.gx < st.gx) dirs.left = nid;
      else if (n.gy === st.gy && n.gx > st.gx) dirs.right = nid;
    });
    return dirs;
  }

  /**
   * 指定した駅IDから全駅への最短歩数（BFS）を計算してMapで返す
   */
  function getShortestDistances(targetId) {
    const dist = new Map();
    if (!STATION_MAP.has(targetId)) return dist;
    const queue = [targetId];
    dist.set(targetId, 0);

    while (queue.length > 0) {
      const curId = queue.shift();
      const curDist = dist.get(curId);
      const curStation = STATION_MAP.get(curId);
      if (!curStation) continue;
      for (const nextId of curStation.links) {
        if (!dist.has(nextId)) {
          dist.set(nextId, curDist + 1);
          queue.push(nextId);
        }
      }
    }
    return dist;
  }

  function getDistanceBetween(idA, idB) {
    const distMap = getShortestDistances(idB);
    return distMap.has(idA) ? distMap.get(idA) : 999;
  }

  KT.STATIONS = STATIONS;
  KT.STATION_MAP = STATION_MAP;
  KT.PROPERTY_STATIONS = PROPERTY_STATIONS;
  KT.getDirectionalNeighbors = getDirectionalNeighbors;
  KT.getShortestDistances = getShortestDistances;
  KT.getDistanceBetween = getDistanceBetween;
})();
