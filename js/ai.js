/**
 * きんたろうてつどう - CPU思考ルーチン（まめオニ・あかオニ・メカオニ）
 */
window.KT = window.KT || {};

(function () {
  /**
   * ターン開始時にカードを使うかどうか判断し、使う場合は手札のインデックスを返す
   */
  function decideCardToUse(state, player) {
    if (!player.cards || player.cards.length === 0 || player.sealedTurns > 0) return null;
    const pIdx = state.players.indexOf(player);
    const dist = state.goalStationId ? KT.getDistanceBetween(player.stationId, state.goalStationId) : 10;
    const hasBinbo = state.binboPlayerIndex === pIdx;

    // 初級（まめオニ）はたまにしかカードを使わない
    if (player.cpuLevel === 'easy' && Math.random() < 0.65) return null;

    // 1. びんぼう神がついている場合、おはらいカードやメカ金太郎カードを優先
    if (hasBinbo) {
      const oharaiIdx = player.cards.findIndex(c => c.id === 'oharai' || c.id === 'mecha');
      if (oharaiIdx !== -1) return oharaiIdx;
    }

    // 2. 目的地まで1〜6マスでスペシャルカードがあれば使う（中級・上級）
    if (dist >= 1 && dist <= 6 && player.cpuLevel !== 'easy') {
      const spIdx = player.cards.findIndex(c => c.id === 'special');
      if (spIdx !== -1) return spIdx;
    }

    // 3. 借金がある場合、徳政令カードを使う
    if (player.money < 0) {
      const tokuIdx = player.cards.findIndex(c => c.id === 'tokuseirei');
      if (tokuIdx !== -1) return tokuIdx;
    }

    // 4. 一攫千金や福袋カードはすぐ使う
    const bonusIdx = player.cards.findIndex(c => c.id === 'ikkaku' || c.id === 'fukubukuro');
    if (bonusIdx !== -1) return bonusIdx;

    // 5. 目的地が遠い場合、急行・特急・新幹線・リニアカードを使う
    if (dist >= 6) {
      const moveIdx = player.cards.findIndex(c => c.category === 'move');
      if (moveIdx !== -1) return moveIdx;
    }

    // 6. 目的地が15マス以上遠い場合、ちかづきカードやぶっとびカードを使う
    if (dist >= 15 && player.cpuLevel === 'hard') {
      const warpIdx = player.cards.findIndex(c => c.id === 'chikamichi' || c.id === 'buttobi');
      if (warpIdx !== -1) return warpIdx;
    }

    return null;
  }

  /**
   * 分岐点でどの隣接駅へ進むかを選択する
   */
  function chooseNextBranch(state, player, candidateIds) {
    if (!candidateIds || candidateIds.length === 0) return null;
    if (candidateIds.length === 1) return candidateIds[0];

    const distMap = state.goalStationId ? KT.getShortestDistances(state.goalStationId) : new Map();

    // 目的地に一番近づく候補順にソート
    const sorted = candidateIds.slice().sort((a, b) => {
      const da = distMap.has(a) ? distMap.get(a) : 999;
      const db = distMap.has(b) ? distMap.get(b) : 999;
      return da - db;
    });

    // 初級（まめオニ）は25%の確率で気まぐれに2番目の道を選ぶ
    if (player.cpuLevel === 'easy' && sorted.length > 1 && Math.random() < 0.25) {
      return sorted[1];
    }
    return sorted[0];
  }

  /**
   * 物件駅に止まった時のCPU自動購入処理
   */
  function autoBuyProperties(state, player, station) {
    if (!station.properties) return [];
    const pIdx = state.players.indexOf(player);
    const boughtNames = [];

    // アトラクションや高利回り物件から順に買えるだけ買う
    const indexedProps = station.properties.map((p, idx) => ({ prop: p, idx }));
    indexedProps.sort((a, b) => b.prop.rate - a.prop.rate);

    for (const { prop, idx } of indexedProps) {
      const key = `${station.id}_${idx}`;
      if (state.propertyOwners[key] !== undefined && state.propertyOwners[key] !== null) continue;
      if (player.money >= prop.price) {
        player.money -= prop.price;
        state.propertyOwners[key] = pIdx;
        boughtNames.push(`${prop.icon}${prop.name}`);
      }
    }
    return boughtNames;
  }

  KT.ai = {
    decideCardToUse,
    chooseNextBranch,
    autoBuyProperties
  };
})();
