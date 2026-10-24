/**
 * きんたろうてつどう（金太郎電鉄） Ver 2.0 - 本家桃鉄クオリティ メインゲームエンジン
 * ・十字キー（↑↓←→ / WASD）＆マップ上の矢印クリックによる直感ルート選択
 * ・一本道は自動でスイスイ進み、分岐点だけで止まる快適移動
 * ・「↩️ 1マスもどる（歩数回復・ルートやり直し）」と「🌟 最短ルートで一気に進む」を搭載
 * ・CPUターンは人間のボタンクリック待ちゼロでテンポよく完全自動進行
 */
window.KT = window.KT || {};

(function () {
  const SAVE_KEY = 'kintaro_tetsudo_save_v3';

  const PLAYER_COLORS = ['#e53935', '#1e88e5', '#fbc02d', '#43a047'];
  const PLAYER_AVATARS = ['player1', 'player2', 'player3', 'player4'];

  let state = null;
  let mapClickResolver = null;
  let isCommandPhase = false;
  let speedStateIndex = 0; // 0: ふつう(1x), 1: はやい(0.5x), 2: 超はやい(0.25x)

  function calcTotalAssets(playerIndex) {
    if (!state) return 0;
    const p = state.players[playerIndex];
    if (!p) return 0;
    let propVal = 0;
    KT.PROPERTY_STATIONS.forEach(st => {
      (st.properties || []).forEach((prop, idx) => {
        if (state.propertyOwners[`${st.id}_${idx}`] === playerIndex) {
          propVal += prop.price;
        }
      });
    });
    return p.money + propVal;
  }

  function calcAnnualRevenue(playerIndex) {
    if (!state) return 0;
    let totalRev = 0;
    KT.PROPERTY_STATIONS.forEach(st => {
      const props = st.properties || [];
      if (props.length === 0) return;
      const isMono = props.every((_, idx) => state.propertyOwners[`${st.id}_${idx}`] === playerIndex);
      props.forEach((prop, idx) => {
        if (state.propertyOwners[`${st.id}_${idx}`] === playerIndex) {
          const base = Math.round((prop.price * prop.rate) / 100);
          totalRev += isMono ? base * 2 : base;
        }
      });
    });
    return totalRev;
  }

  function setMessage(text, avatarType = 'kintaro', mood = 'normal') {
    const avatarEl = document.getElementById('message-speaker-avatar');
    const contentEl = document.getElementById('message-content');
    if (avatarEl) avatarEl.innerHTML = KT.svg.getCharacterSVG(avatarType, mood, 50);
    if (contentEl) contentEl.innerHTML = KT.ruby(text);
  }

  /**
   * 画面全体のUI更新（上部ヘッダー・横並び社長バー・全国マップ）
   */
  function updateAllUI() {
    if (!state) return;

    const seasonMap = {
      4: '🌸', 5: '🎏', 6: '☔', 7: '🌻', 8: '🍉', 9: '🍁',
      10: '🎃', 11: '🍂', 12: '🎄', 1: '🎍', 2: '⛄', 3: '🎎'
    };
    const dateEl = document.getElementById('hud-date-text');
    const seasonEl = document.getElementById('hud-season-icon');
    if (dateEl) dateEl.innerHTML = KT.ruby(`${state.year}年目 ${state.month}月`);
    if (seasonEl) seasonEl.textContent = seasonMap[state.month] || '🌸';

    const goalSt = KT.STATION_MAP.get(state.goalStationId);
    const curPlayer = state.players[state.currentPlayerIndex];
    const dist = (goalSt && curPlayer) ? KT.getDistanceBetween(curPlayer.stationId, goalSt.id) : 0;
    const goalTextEl = document.getElementById('hud-goal-text');
    const goalDistEl = document.getElementById('hud-goal-dist');
    if (goalTextEl && goalSt) {
      goalTextEl.innerHTML = KT.ruby(`🏁 目的地：【${goalSt.pref}】${goalSt.name}駅`);
    }
    if (goalDistEl) {
      goalDistEl.innerHTML = KT.ruby(`あと ${dist} マス`);
    }

    // カードボタンに所持枚数を表示
    const cardBtn = document.getElementById('cmd-btn-card');
    if (cardBtn && curPlayer) {
      cardBtn.innerHTML = KT.ruby(`🃏 カード(${curPlayer.cards.length})`);
    }

    // コマンドバー手番インジケーターの更新
    const turnBadge = document.getElementById('cmd-turn-badge');
    const turnTitle = document.getElementById('cmd-turn-title');
    const turnIcon = document.getElementById('cmd-turn-icon');
    if (turnBadge && curPlayer) {
      const slotColors = ['p-red', 'p-blue', 'p-yellow', 'p-green'];
      const slotIcons = ['🔴', '🔵', '🟡', '🟢'];
      const slotIdx = (curPlayer.slotIndex !== undefined ? curPlayer.slotIndex : (curPlayer.id !== undefined ? curPlayer.id : state.currentPlayerIndex)) % 4;

      turnBadge.className = `cmd-turn-badge ${slotColors[slotIdx] || 'p-red'}`;
      if (turnIcon) turnIcon.textContent = slotIcons[slotIdx] || '🔴';
      if (turnTitle) {
        const pLabel = `${slotIdx + 1}P ${curPlayer.name}`;
        turnTitle.innerHTML = curPlayer.isCpu
          ? KT.ruby(`🤖 ${pLabel}（自動進行中）`)
          : KT.ruby(`🎮 ${pLabel} の番！`);
      }
    }

    // 4人の社長の横並びコンパクトスコアボード
    const sidebar = document.getElementById('players-sidebar');
    if (sidebar) {
      sidebar.innerHTML = state.players.map((p, idx) => {
        const isTurn = idx === state.currentPlayerIndex;
        const pDist = goalSt ? KT.getDistanceBetween(p.stationId, goalSt.id) : 0;
        const stName = KT.STATION_MAP.get(p.stationId)?.name || '';
        const hasBinbo = state.binboPlayerIndex === idx;
        const binboLabel = hasBinbo
          ? (state.binboForm === 'king' ? '⚡大魔王' : state.binboForm === 'chibi' ? '🍼ちび神' : '🦆貧乏神')
          : '';

        const slotNum = (p.slotIndex !== undefined ? p.slotIndex : idx) + 1;
        const pBadge = p.isCpu
          ? `<span style="background:#546e7a; color:#fff; font-size:0.72rem; padding:1px 5px; border-radius:6px; margin-right:4px;">CPU</span>`
          : `<span style="background:${p.color}; color:#fff; font-size:0.72rem; padding:1px 5px; border-radius:6px; margin-right:4px;">${slotNum}P</span>`;

        return `
          <div class="player-card-hud ${isTurn ? 'active-turn' : ''}" data-pidx="${idx}" style="border-color:${p.color};">
            <div class="p-avatar">${KT.svg.getCharacterSVG(p.avatar, p.money < 0 ? 'sad' : 'happy', 38)}</div>
            <div class="p-info">
              <div class="p-name-row">
                <span>${pBadge}${KT.ruby(p.name)}</span>
                ${hasBinbo ? `<span class="binbo-tag ${state.binboForm === 'king' ? 'king' : ''}">${KT.ruby(binboLabel)}</span>` : ''}
              </div>
              <div class="p-money-row">
                <span class="p-money ${p.money < 0 ? 'negative' : ''}">${KT.formatMoney(p.money, true)}</span>
                <span class="p-dist">📍${KT.ruby(stName)}(あと${pDist})</span>
              </div>
            </div>
          </div>
        `;
      }).join('');

      sidebar.querySelectorAll('.player-card-hud').forEach(card => {
        card.addEventListener('click', () => {
          const idx = Number(card.getAttribute('data-pidx'));
          const p = state.players[idx];
          if (p) KT.mapRenderer.focusOnStation(p.stationId, 0.98);
        });
      });
    }

    KT.mapRenderer.renderMap(state);
  }

  function saveGame() {
    if (!state) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Save failed:', e);
    }
  }

  function hasSavedGame() {
    try {
      return !!localStorage.getItem(SAVE_KEY);
    } catch (e) {
      return false;
    }
  }

  function loadSavedGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      state = JSON.parse(raw);
      return true;
    } catch (e) {
      return false;
    }
  }

  function delay(ms) {
    return new Promise(res => setTimeout(res, KT.dialogs.scaledTime(ms)));
  }

  /**
   * 新規ゲーム開始
   */
  async function startNewGame(playersConfig, maxYears) {
    const players = playersConfig.map((cfg, idx) => {
      const slot = cfg.slotIndex !== undefined ? cfg.slotIndex : idx;
      return {
        id: idx,
        slotIndex: slot,
        name: cfg.name || `${slot + 1}P社長`,
        isCpu: cfg.type !== 'human',
        cpuLevel: cfg.type === 'cpu_easy' ? 'easy' : cfg.type === 'cpu_hard' ? 'hard' : 'normal',
        color: PLAYER_COLORS[slot % 4],
        avatar: cfg.avatar || PLAYER_AVATARS[slot % 4],
        stationId: 'tokyo',
        money: 1000,
        cards: [KT.getCardById('kyuko'), KT.getCardById('special')].filter(Boolean),
        ushipoTurns: 0,
        sealedTurns: 0,
        goalCount: 0
      };
    });

    state = {
      year: 1,
      month: 4,
      maxYears: Number(maxYears) || 3,
      players,
      currentPlayerIndex: 0,
      goalStationId: 'utsunomiya',
      binboPlayerIndex: null,
      binboForm: 'binbo',
      binboTurnsOnForm: 0,
      propertyOwners: {}
    };

    document.getElementById('title-screen').classList.add('hidden');
    KT.audio.startBgm('normal');
    KT.mapRenderer.focusOnStation('tokyo', 0.92, true);
    updateAllUI();

    const hasAnyHuman = players.some(p => !p.isCpu);
    const firstGoal = await KT.dialogs.showDestinationRouletteModal('tokyo', !hasAnyHuman);
    state.goalStationId = firstGoal.id;
    updateAllUI();
    KT.mapRenderer.focusOnStation(firstGoal.id, 0.88);

    await delay(650);
    KT.mapRenderer.focusOnStation('tokyo', 0.95);
    await startPlayerTurn();
  }

  /**
   * 現在のプレイヤーのターン開始
   */
  async function startPlayerTurn() {
    if (!state) return;
    saveGame();

    const player = state.players[state.currentPlayerIndex];
    const hasBinbo = state.binboPlayerIndex === state.currentPlayerIndex;
    KT.audio.setBgmMode(hasBinbo ? (state.binboForm === 'king' ? 'king' : 'binbo') : 'normal');

    updateAllUI();
    KT.mapRenderer.focusOnStation(player.stationId, 0.95);

    const goalSt = KT.STATION_MAP.get(state.goalStationId);
    const dist = goalSt ? KT.getDistanceBetween(player.stationId, goalSt.id) : 0;

    setMessage(
      `【${state.year}年目 ${state.month}月】 <strong>${player.name}</strong> の番！ 目的地「${goalSt ? goalSt.name : ''}駅」まで あと <strong>${dist}マス</strong>！（Spaceでサイコロ）`,
      player.avatar,
      'happy'
    );

    const cmdBar = document.getElementById('command-bar');
    if (player.isCpu) {
      isCommandPhase = false;
      if (cmdBar) cmdBar.classList.add('hidden');
      await delay(480);
      await executeCpuTurn(player);
    } else {
      // 人間が2人以上いるマルチプレイヤー対戦の場合、交代告知モーダルを表示！
      const humanCount = state.players.filter(p => !p.isCpu).length;
      if (humanCount >= 2) {
        KT.audio.SE.card();
        const pSlotIdx = player.slotIndex !== undefined ? player.slotIndex : (player.id !== undefined ? player.id : state.currentPlayerIndex);
        await KT.dialogs.showTurnNoticeModal(player, pSlotIdx, goalSt, dist);
        updateAllUI();
      }

      isCommandPhase = true;
      if (cmdBar) cmdBar.classList.remove('hidden');
    }
  }

  /**
   * CPUプレイヤーの自動行動（人間のボタンクリック不要でサクサク進行！）
   */
  async function executeCpuTurn(player) {
    try {
      const cardIdx = KT.ai.decideCardToUse(state, player);
      if (cardIdx !== null && player.cards[cardIdx]) {
        await useCardAction(player, cardIdx);
        return;
      }
      await rollAndMove(player, 1);
    } catch (err) {
      console.error('CPU turn error:', err);
      await endPlayerTurn();
    }
  }

  /**
   * カード使用処理
   */
  async function useCardAction(player, cardIndex) {
    const card = player.cards[cardIndex];
    if (!card) return;
    isCommandPhase = false;
    const cmdBar = document.getElementById('command-bar');
    if (cmdBar) cmdBar.classList.add('hidden');

    player.cards.splice(cardIndex, 1);
    KT.audio.SE.card();

    // 1. 急行系カード（モーダルを出さずにそのまま複数サイコロを振る！）
    if (card.category === 'move' && card.diceCount) {
      setMessage(`${card.icon} ${player.name} は「${card.name}」を使った！サイコロ ${card.diceCount}個！`, player.avatar, 'happy');
      await rollAndMove(player, card.diceCount, `${card.icon} ${card.name}！（サイコロ${card.diceCount}個）`);
      return;
    }

    // 2. スペシャルカード
    if (card.id === 'special') {
      let chosenSteps = null;
      if (player.isCpu) {
        const dist = KT.getDistanceBetween(player.stationId, state.goalStationId);
        chosenSteps = (dist >= 1 && dist <= 6) ? dist : 6;
        setMessage(`⭐ ${player.name} は「スペシャルカード」で ${chosenSteps}マス 進みます！`, player.avatar, 'happy');
        await delay(500);
      } else {
        chosenSteps = await KT.dialogs.showSpecialNumberPickerModal();
        if (chosenSteps === null) {
          player.cards.push(card);
          isCommandPhase = true;
          if (cmdBar) cmdBar.classList.remove('hidden');
          return;
        }
      }
      await moveTrainSteps(player, chosenSteps);
      return;
    }

    // 3. ぶっとびカード / 目的地ちかづきカード
    if (card.id === 'buttobi' || card.id === 'chikamichi') {
      let targetSt = null;
      if (card.id === 'chikamichi' && state.goalStationId) {
        const distMap = KT.getShortestDistances(state.goalStationId);
        const nearList = KT.STATIONS.filter(s => {
          const d = distMap.get(s.id);
          return d >= 2 && d <= 5;
        });
        targetSt = nearList[Math.floor(Math.random() * nearList.length)] || KT.PROPERTY_STATIONS[0];
      } else {
        const candidates = KT.STATIONS.filter(s => s.id !== player.stationId && s.id !== state.goalStationId);
        targetSt = candidates[Math.floor(Math.random() * candidates.length)];
      }
      player.stationId = targetSt.id;
      updateAllUI();
      KT.mapRenderer.focusOnStation(targetSt.id, 0.95);
      await KT.dialogs.showEventModal({
        title: `${card.icon} ${card.name} で大ジャンプ！`,
        desc: `びゅーん！！ <strong>【${targetSt.pref}】${targetSt.name}</strong> に 飛んできました！`,
        charType: player.avatar,
        mood: 'happy',
        headerClass: 'blue',
        autoCloseMs: player.isCpu ? 1100 : null
      });
      await handleStationArrival(player);
      return;
    }

    // 4. ぴったりカード
    if (card.id === 'pittari') {
      const others = state.players.filter(p => p !== player);
      const targetPlayer = others[Math.floor(Math.random() * others.length)];
      if (targetPlayer) {
        player.stationId = targetPlayer.stationId;
        checkBinboTransferOnPass(player);
        updateAllUI();
        KT.mapRenderer.focusOnStation(player.stationId, 0.95);
        const st = KT.STATION_MAP.get(player.stationId);
        await KT.dialogs.showEventModal({
          title: '🎯 ぴったりカード！',
          desc: `${targetPlayer.name} がいる <strong>${st ? st.name : ''}</strong> にピタッと合流しました！`,
          charType: player.avatar,
          mood: 'happy',
          autoCloseMs: player.isCpu ? 1100 : null
        });
      }
      await endPlayerTurn();
      return;
    }

    // 5. サミットカード
    if (card.id === 'summit') {
      state.players.forEach(p => {
        p.stationId = player.stationId;
      });
      updateAllUI();
      const st = KT.STATION_MAP.get(player.stationId);
      await KT.dialogs.showEventModal({
        title: '✈️ サミットカード発動！',
        desc: `すべての社長たちを <strong>${st ? st.name : ''}</strong> に大集合させました！`,
        charType: player.avatar,
        mood: 'happy',
        headerClass: 'gold',
        autoCloseMs: player.isCpu ? 1100 : null
      });
      await endPlayerTurn();
      return;
    }

    // 6. 一攫千金カード
    if (card.id === 'ikkaku') {
      const bonus = (300 + Math.floor(Math.random() * 5) * 150) * state.year;
      player.money += bonus;
      KT.audio.SE.coin();
      updateAllUI();
      await KT.dialogs.showEventModal({
        title: '💴 一攫千金カード 大当たり！',
        desc: `キラキラの臨時収入 <strong>${KT.formatMoney(bonus, true)}</strong> を手に入れました！`,
        charType: player.avatar,
        mood: 'happy',
        headerClass: 'gold',
        autoCloseMs: player.isCpu ? 1000 : null
      });
      await startPlayerTurn();
      return;
    }

    // 7. わくわく福袋カード
    if (card.id === 'fukubukuro') {
      const gotNames = [];
      for (let i = 0; i < 3; i++) {
        if (player.cards.length < 8) {
          const newCard = KT.drawRandomCard();
          player.cards.push(newCard);
          gotNames.push(`${newCard.icon}${newCard.name}`);
        }
      }
      KT.audio.SE.card();
      await KT.dialogs.showEventModal({
        title: '🛍️ わくわく福袋をあけた！',
        desc: `福袋の中から <strong>${gotNames.join('、')}</strong> が飛び出してきたよ！`,
        charType: player.avatar,
        mood: 'happy',
        headerClass: 'gold',
        autoCloseMs: player.isCpu ? 1000 : null
      });
      await startPlayerTurn();
      return;
    }

    // 8. シンデレラカード / プラチナ割引カード
    if (card.id === 'cinderella' || card.id === 'gold') {
      const curSt = KT.STATION_MAP.get(player.stationId);
      if (curSt && curSt.type === 'property' && !player.isCpu) {
        await KT.dialogs.showPropertyShopModal(state, player, curSt, {
          freeOne: card.id === 'cinderella',
          halfPrice: card.id === 'gold'
        });
      } else {
        const gift = 400 * state.year;
        player.money += gift;
        await KT.dialogs.showEventModal({
          title: `${card.icon} ${card.name} ボーナス！`,
          desc: `特別おこづかい <strong>${KT.formatMoney(gift, true)}</strong> をもらいました！`,
          charType: player.avatar,
          mood: 'happy',
          autoCloseMs: player.isCpu ? 1000 : null
        });
      }
      updateAllUI();
      await startPlayerTurn();
      return;
    }

    // 9. 徳政令カード
    if (card.id === 'tokuseirei') {
      state.players.forEach(p => {
        if (p.money < 0) p.money = 0;
      });
      KT.audio.SE.goalFanfare();
      updateAllUI();
      await KT.dialogs.showEventModal({
        title: '📜 徳政令カード！ 借金ゼロ！',
        desc: '借金があった社長全員のマイナスが チャラ（0円）に なりました！',
        charType: 'kintaro',
        mood: 'happy',
        headerClass: 'gold',
        autoCloseMs: player.isCpu ? 1100 : null
      });
      await startPlayerTurn();
      return;
    }

    // 10. おはらいカード / メカ金太郎カード
    if (card.id === 'oharai' || card.id === 'mecha') {
      const pIdx = state.players.indexOf(player);
      if (state.binboPlayerIndex === pIdx) {
        const otherIndices = state.players.map((_, i) => i).filter(i => i !== pIdx);
        state.binboPlayerIndex = otherIndices[Math.floor(Math.random() * otherIndices.length)];
        state.binboForm = 'binbo';
        KT.audio.SE.goalFanfare();
        updateAllUI();
        const newTarget = state.players[state.binboPlayerIndex];
        await KT.dialogs.showEventModal({
          title: `${card.icon} ${card.name} 大成功！`,
          desc: `取り憑いていた びんぼう神を 追い払い、<strong>${newTarget.name}</strong> のところへ 飛んでいきました！`,
          charType: player.avatar,
          mood: 'happy',
          headerClass: 'gold',
          autoCloseMs: player.isCpu ? 1100 : null
        });
      } else {
        player.money += 200;
        await KT.dialogs.showEventModal({
          title: `${card.icon} ${card.name}！`,
          desc: 'びんぼう神が近くにいなかったので、お守りパワーで臨時おこづかい 200万円 をゲット！',
          charType: player.avatar,
          mood: 'happy',
          autoCloseMs: player.isCpu ? 1000 : null
        });
      }
      await startPlayerTurn();
      return;
    }

    // 11. 妨害系カード
    if (card.id === 'ushipo' || card.id === 'fuuin' || card.id === 'kaze') {
      const rivals = state.players.filter(p => p !== player);
      rivals.sort((a, b) =>
        KT.getDistanceBetween(a.stationId, state.goalStationId) -
        KT.getDistanceBetween(b.stationId, state.goalStationId)
      );
      const victim = rivals[0];
      if (victim) {
        if (card.id === 'ushipo') {
          victim.ushipoTurns = 2;
          await KT.dialogs.showEventModal({
            title: '🐂 うし歩カード発動！',
            desc: `<strong>${victim.name}</strong> は モ〜モ〜牛歩になり、しばらく 1マスずつしか 進めなくなりました！`,
            charType: victim.avatar,
            mood: 'sad',
            headerClass: 'purple',
            autoCloseMs: player.isCpu ? 1100 : null
          });
        } else if (card.id === 'fuuin') {
          victim.sealedTurns = 2;
          await KT.dialogs.showEventModal({
            title: '💤 ふういんカード発動！',
            desc: `<strong>${victim.name}</strong> の カード袋を 2ターンのあいだ 封印しました！`,
            charType: victim.avatar,
            mood: 'sad',
            headerClass: 'purple',
            autoCloseMs: player.isCpu ? 1100 : null
          });
        } else if (card.id === 'kaze') {
          const farStations = KT.STATIONS.filter(s => s.id !== state.goalStationId);
          const blownSt = farStations[Math.floor(Math.random() * farStations.length)];
          victim.stationId = blownSt.id;
          updateAllUI();
          await KT.dialogs.showEventModal({
            title: '🌪️ たいふう吹き飛ばしカード！',
            desc: `大風が吹いて <strong>${victim.name}</strong> は <strong>【${blownSt.pref}】${blownSt.name}</strong> まで吹き飛ばされました！`,
            charType: victim.avatar,
            mood: 'shock',
            headerClass: 'purple',
            autoCloseMs: player.isCpu ? 1100 : null
          });
        }
      }
      await startPlayerTurn();
      return;
    }

    await startPlayerTurn();
  }

  /**
   * サイコロを振って移動開始
   */
  async function rollAndMove(player, diceCount = 1, customLabel = '🎲 サイコロタイム！') {
    isCommandPhase = false;
    const cmdBar = document.getElementById('command-bar');
    if (cmdBar) cmdBar.classList.add('hidden');

    if (player.ushipoTurns > 0) {
      player.ushipoTurns--;
      setMessage(`🐂 ${player.name} は 牛歩状態のため、1マスだけ 進みます！`, player.avatar, 'sad');
      await delay(550);
      await moveTrainSteps(player, 1);
      return;
    }

    const diceResults = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
    const totalSteps = await KT.dialogs.showDiceRollModal(player, diceResults, customLabel);
    await moveTrainSteps(player, totalSteps);
  }

  /**
   * 本家桃鉄クオリティの路線移動システム（Ver 3.5 完全直交グリッド＆タップで直感移動＆全画面マップ表示）
   * ・移動中は下部ドックを自動退避し、マップ視界を100%確保！
   * ・マップ上の隣接駅や方向矢印をタップするだけで、1歩ずつスイスイ直感移動
   * ・残り0マス時は現在地駅のタップ（またはEnter/Space）でピタッと到着確定！
   * ・直前にいた駅をタップ（またはBackSpace）で1マス戻って歩数が＋1回復
   * ・「🌟 最短おまかせ」で目的地まで一気に自動移動も可能
   */
  async function moveTrainSteps(player, initialSteps) {
    let remaining = initialSteps;
    const pIdx = state.players.indexOf(player);
    const pathHistory = [player.stationId]; // 歩いた経路スタック（戻ると歩数が＋1回復！）
    let autoRouteActive = player.isCpu;     // CPUまたは「おまかせ」押下時は自動進行

    document.body.classList.add('moving-phase');

    try {
      while (true) {
        if (remaining <= 0) {
          break;
        }

        const curSt = KT.STATION_MAP.get(player.stationId);
        if (!curSt) break;

        const prevStationId = pathHistory.length >= 2 ? pathHistory[pathHistory.length - 2] : null;
        const forwardCandidates = curSt.links.filter(id => id !== prevStationId);

        // 自動ルートモード（CPU または「🌟おまかせ」実行中）
        if (autoRouteActive) {
          KT.mapRenderer.setHighlightedBranches([], null, remaining);
          updateAllUI();

          const pool = forwardCandidates.length > 0 ? forwardCandidates : curSt.links;
          const nextId = KT.ai.chooseNextBranch(state, player, pool);
          const fromId = player.stationId;

          KT.audio.SE.step();
          await KT.mapRenderer.animateTrainStep(pIdx, fromId, nextId, 165);

          pathHistory.push(nextId);
          player.stationId = nextId;
          remaining--;
          checkBinboTransferOnPass(player);
          updateAllUI();
          continue;
        }

        // 人間プレイヤー：マップ上の駅タップや矢印キーで直感移動！
        const decision = await promptHumanMoveDecision(player, curSt, forwardCandidates, prevStationId, remaining);

        if (decision.type === 'confirm_stop') {
          break;
        } else if (decision.type === 'auto_route') {
          autoRouteActive = true;
          continue;
        } else if (decision.type === 'step_back') {
          if (pathHistory.length >= 2) {
            const fromId = player.stationId;
            pathHistory.pop(); // 現在の駅を取り除く
            const backStId = pathHistory[pathHistory.length - 1];

            KT.audio.SE.cancel();
            await KT.mapRenderer.animateTrainStep(pIdx, fromId, backStId, 165);

            player.stationId = backStId;
            remaining++; // 歩数を1回復！
            updateAllUI();
          }
          continue;
        } else if (decision.type === 'move_to' && decision.stationId) {
          const fromId = player.stationId;
          // もし選んだ先が「直前に来た駅（prevStationId）」なら、1マス戻って歩数＋1回復！
          if (decision.stationId === prevStationId) {
            pathHistory.pop();
            KT.audio.SE.cancel();
            await KT.mapRenderer.animateTrainStep(pIdx, fromId, prevStationId, 165);
            player.stationId = prevStationId;
            remaining++;
          } else {
            pathHistory.push(decision.stationId);
            KT.audio.SE.step();
            await KT.mapRenderer.animateTrainStep(pIdx, fromId, decision.stationId, 175);
            player.stationId = decision.stationId;
            remaining--;
            checkBinboTransferOnPass(player);
          }
          updateAllUI();
        }
      }
    } finally {
      document.body.classList.remove('moving-phase');
      KT.mapRenderer.setHighlightedBranches([], null, null);
      const guideBar = document.getElementById('move-guide-bar');
      if (guideBar) guideBar.classList.add('hidden');
    }

    KT.mapRenderer.focusOnStation(player.stationId);
    updateAllUI();
    await delay(220);
    await handleStationArrival(player);
  }

  /**
   * 2駅間の直交グリッド座標から「⬆️北(↑)」「⬇️南(↓)」「⬅️西(←)」「➡️東(→)」を返す
   */
  function getDirectionInfo(fromSt, toSt) {
    const dx = toSt.x - fromSt.x;
    const dy = toSt.y - fromSt.y;
    if (Math.abs(dx) >= Math.abs(dy)) {
      return dx >= 0
        ? { arrow: '➡️', label: '東(→)', keyDir: 'right' }
        : { arrow: '⬅️', label: '西(←)', keyDir: 'left' };
    } else {
      return dy >= 0
        ? { arrow: '⬇️', label: '南(↓)', keyDir: 'down' }
        : { arrow: '⬆️', label: '北(↑)', keyDir: 'up' };
    }
  }

  /**
   * 人間プレイヤーの移動・方向選択・1マス戻る入力待ち
   * 矢印キー（↑↓←→ / WASD）で直交する4方向の線路へ直感移動＆逆方向キーで1マス戻る！
   */
  function promptHumanMoveDecision(player, curSt, forwardCandidates, prevStationId, remainingSteps) {
    return new Promise(resolve => {
      const guideBar = document.getElementById('move-guide-bar');
      const remBadge = document.getElementById('steps-remaining-text');
      const listEl = document.getElementById('branch-btn-list');
      const autoBtn = document.getElementById('btn-auto-route');
      const backBtn = document.getElementById('btn-step-back');

      const distMap = state.goalStationId ? KT.getShortestDistances(state.goalStationId) : new Map();

      const allHighlightIds = remainingSteps > 0
        ? (forwardCandidates.length > 0 ? forwardCandidates.slice() : curSt.links.slice())
        : [];
      if (prevStationId && !allHighlightIds.includes(prevStationId)) {
        allHighlightIds.push(prevStationId);
      }

      KT.mapRenderer.setHighlightedBranches(allHighlightIds, prevStationId, remainingSteps);
      KT.mapRenderer.renderMap(state);
      KT.mapRenderer.focusOnStation(curSt.id);

      const prevSt = prevStationId ? KT.STATION_MAP.get(prevStationId) : null;
      const backDirInfo = prevSt ? getDirectionInfo(curSt, prevSt) : null;

      if (backBtn) {
        backBtn.disabled = !prevStationId;
        backBtn.innerHTML = backDirInfo
          ? `↩️ 1マスもどる (${backDirInfo.label})`
          : '↩️ 1マスもどる (Back)';
      }

      let cleanedUp = false;
      const cleanupAndResolve = (result) => {
        if (cleanedUp) return;
        cleanedUp = true;
        window.removeEventListener('keydown', keyListener);
        mapClickResolver = null;
        KT.mapRenderer.setHighlightedBranches([], null, remainingSteps);
        if (guideBar) guideBar.classList.add('hidden');
        resolve(result);
      };

      // 残り0マスの場合：「⭕ この駅に止まる！」または「来た方向の駅タップ/矢印キーで1マスもどる」
      if (remainingSteps === 0) {
        if (remBadge) {
          remBadge.innerHTML = `📍 <strong>【${curSt.name}】</strong>（のこり 0 マス）`;
        }
        if (autoBtn) autoBtn.style.display = 'none';
        if (listEl) {
          listEl.innerHTML = `
            <button id="btn-confirm-stop" class="branch-choice-btn recommended" style="padding:5px 16px; font-size:0.92rem;">
              ⭕ この駅に止まる！（タップで決定）
            </button>
          `;
          document.getElementById('btn-confirm-stop')?.addEventListener('click', () => {
            cleanupAndResolve({ type: 'confirm_stop' });
          });
        }
      } else {
        // 残り1マス以上ある場合：マップ上の駅タップ案内＆補助ボタン
        if (remBadge) {
          const isMobile = window.innerWidth <= 600;
          remBadge.innerHTML = isMobile
            ? `🚂 のこり <strong>${remainingSteps}</strong> マス（駅をタップ！）`
            : `🚂 のこり <strong>${remainingSteps}</strong> マス！ （マップタップ または 矢印キーで移動）`;
        }
        if (autoBtn) autoBtn.style.display = 'inline-block';

        const choices = forwardCandidates.length > 0 ? forwardCandidates : curSt.links;
        let minDist = 9999;
        choices.forEach(id => {
          const d = distMap.has(id) ? distMap.get(id) : 999;
          if (d < minDist) minDist = d;
        });

        if (listEl) {
          listEl.innerHTML = choices.map(id => {
            const st = KT.STATION_MAP.get(id);
            const d = distMap.has(id) ? distMap.get(id) : 999;
            const isBest = d === minDist;
            const dirInfo = getDirectionInfo(curSt, st);
            return `
              <button class="branch-choice-btn ${isBest ? 'recommended' : ''}" data-stid="${id}">
                <span class="dir-key-badge">${dirInfo.arrow} ${dirInfo.label}</span>
                <span>${st ? st.name : id}</span>
                <span class="dist-hint">${isBest ? '★最短 ' : ''}あと${d}マス</span>
              </button>
            `;
          }).join('');

          listEl.querySelectorAll('.branch-choice-btn').forEach(btn => {
            btn.addEventListener('click', () => {
              cleanupAndResolve({ type: 'move_to', stationId: btn.getAttribute('data-stid') });
            });
          });
        }
      }

      if (guideBar) guideBar.classList.remove('hidden');

      // 「🌟 最短ルートで一気に進む」ボタン
      if (autoBtn) {
        autoBtn.onclick = () => cleanupAndResolve({ type: 'auto_route' });
      }
      // 「↩️ 1マスもどる」ボタン
      if (backBtn) {
        backBtn.onclick = () => {
          if (prevStationId) cleanupAndResolve({ type: 'step_back' });
        };
      }

      // マップ上の駅または方向矢印の直接クリック
      mapClickResolver = (clickedStationId) => {
        if (remainingSteps === 0 && clickedStationId === curSt.id) {
          cleanupAndResolve({ type: 'confirm_stop' });
          return true;
        }
        if (clickedStationId === prevStationId) {
          cleanupAndResolve({ type: 'step_back' });
          return true;
        }
        if (remainingSteps > 0 && curSt.links.includes(clickedStationId)) {
          cleanupAndResolve({ type: 'move_to', stationId: clickedStationId });
          return true;
        }
        return false;
      };

      // キーボード操作（↑↓←→ / WASD で直交する線路を進む・戻る！）
      const keyListener = e => {
        if (e.key === 'Backspace') {
          if (prevStationId) {
            e.preventDefault();
            cleanupAndResolve({ type: 'step_back' });
          }
          return;
        }
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (remainingSteps === 0) {
            cleanupAndResolve({ type: 'confirm_stop' });
          } else {
            cleanupAndResolve({ type: 'auto_route' });
          }
          return;
        }

        const keyDirMap = {
          ArrowUp: 'up', w: 'up', W: 'up',
          ArrowDown: 'down', s: 'down', S: 'down',
          ArrowLeft: 'left', a: 'left', A: 'left',
          ArrowRight: 'right', d: 'right', D: 'right'
        };
        const wantedDir = keyDirMap[e.key];
        if (!wantedDir) return;
        e.preventDefault();

        // 直交グリッドの上下左右（up / down / left / right）に接続している駅を取得
        const neighbors = KT.getDirectionalNeighbors ? KT.getDirectionalNeighbors(curSt.id) : {};
        const targetId = neighbors[wantedDir];
        if (!targetId) return;

        // もし押した矢印キーの方向が「直前に来た駅（prevStationId）」なら、残り0歩でも1マス戻って歩数＋1回復！
        if (targetId === prevStationId) {
          cleanupAndResolve({ type: 'step_back' });
          return;
        }

        // 残り歩数が1以上あれば、その方向の線路へ1マス進む！
        if (remainingSteps > 0) {
          cleanupAndResolve({ type: 'move_to', stationId: targetId });
        }
      };

      window.addEventListener('keydown', keyListener);
    });
  }

  /**
   * びんぼう神のなすりつけ判定
   */
  function checkBinboTransferOnPass(movingPlayer) {
    if (state.binboPlayerIndex === null) return;
    const movingIdx = state.players.indexOf(movingPlayer);
    const sameStationPlayers = state.players
      .map((p, idx) => ({ p, idx }))
      .filter(item => item.idx !== movingIdx && item.p.stationId === movingPlayer.stationId);

    if (sameStationPlayers.length === 0) return;

    if (state.binboPlayerIndex === movingIdx) {
      const target = sameStationPlayers[0];
      state.binboPlayerIndex = target.idx;
      KT.audio.SE.binbo();
      setMessage(
        `🦆 あっ！ ${movingPlayer.name} は <strong>${target.p.name}</strong> に びんぼう神を なすりつけた！！`,
        'binbo',
        'happy'
      );
    } else {
      const holderHere = sameStationPlayers.find(item => item.idx === state.binboPlayerIndex);
      if (holderHere) {
        state.binboPlayerIndex = movingIdx;
        KT.audio.SE.binbo();
        setMessage(
          `🦆 ぎゃー！ ${movingPlayer.name} は <strong>${holderHere.p.name}</strong> から びんぼう神を もらってしまった！`,
          'binbo',
          'shock'
        );
      }
    }
  }

  /**
   * 移動完了後の駅到着イベント処理
   */
  async function handleStationArrival(player) {
    const station = KT.STATION_MAP.get(player.stationId);
    if (!station) {
      await endPlayerTurn();
      return;
    }

    // ==================== 1. 目的地にピッタリ到着した場合！ ====================
    if (station.id === state.goalStationId) {
      KT.audio.SE.goalFanfare();
      player.goalCount = (player.goalCount || 0) + 1;
      const aidMoney = 1500 + state.year * 500;
      player.money += aidMoney;

      let maxDist = -1;
      let farthestIdx = 0;
      state.players.forEach((p, idx) => {
        const d = KT.getDistanceBetween(p.stationId, station.id);
        if (d > maxDist) {
          maxDist = d;
          farthestIdx = idx;
        }
      });
      state.binboPlayerIndex = farthestIdx;
      state.binboForm = 'binbo';
      state.binboTurnsOnForm = 0;
      const farthestPlayer = state.players[farthestIdx];

      updateAllUI();

      await KT.dialogs.showEventModal({
        title: `🎊 祝・【${station.pref}】${station.name}駅 一番乗り到着！！`,
        desc: `おめでとうございます！！ <strong>${player.name}</strong> が 目的地「${station.name}駅」に 一番乗りで 到着しました！<br>援助金 <strong>＋${KT.formatMoney(aidMoney, true)}</strong> が プレゼントされます！<br><br>🦆 そして…目的地から いちばん 遠かった <strong>${farthestPlayer.name}</strong>（あと${maxDist}マス）に「ポンコツびんぼう神」が 取り憑きました！`,
        charType: player.avatar,
        mood: 'happy',
        headerClass: 'gold',
        buttonText: 'つぎの目的地ルーレットへ！ 🎯',
        autoCloseMs: player.isCpu ? 1800 : null
      });

      if (station.type === 'property') {
        await handlePropertyStationVisit(player, station);
      }

      const nextGoal = await KT.dialogs.showDestinationRouletteModal(station.id, player.isCpu);
      state.goalStationId = nextGoal.id;
      updateAllUI();
      KT.mapRenderer.focusOnStation(nextGoal.id, 0.88);
      await delay(650);
      KT.mapRenderer.focusOnStation(player.stationId, 0.95);
      await endPlayerTurn();
      return;
    }

    // ==================== 2. 通常の各駅イベント ====================
    if (station.type === 'property') {
      await handlePropertyStationVisit(player, station);
    } else if (station.type === 'plus') {
      const isSummer = [6, 7, 8, 9].includes(state.month);
      const mult = state.year * (isSummer ? 1.5 : 1);
      const items = [100, 200, 350, 500, 800].map(v => {
        const amount = Math.round(v * mult);
        return { amount, label: `＋${KT.formatMoney(amount, true)}` };
      });

      if (player.isCpu) {
        const pick = items[Math.floor(Math.random() * items.length)];
        player.money += pick.amount;
        KT.audio.SE.coin();
        setMessage(`🔵 ${player.name} は プラス駅で ＋${KT.formatMoney(pick.amount, true)} をゲット！`, player.avatar, 'happy');
        updateAllUI();
        await delay(500);
      } else {
        await KT.dialogs.showStationRouletteModal({
          title: `🔵 ${station.name}（プラス駅）ボーナス！`,
          headerClass: 'blue',
          items,
          onSelect: chosen => {
            player.money += chosen.amount;
            KT.audio.SE.coin();
            updateAllUI();
          }
        });
      }
    } else if (station.type === 'minus') {
      const isWinter = [12, 1, 2].includes(state.month);
      const mult = state.year * (isWinter ? 1.4 : 1);
      const items = [80, 150, 250, 400].map(v => {
        const amount = Math.round(v * mult);
        return { amount, label: `▲${KT.formatMoney(amount, true)}` };
      });

      if (player.isCpu) {
        const pick = items[Math.floor(Math.random() * items.length)];
        player.money -= pick.amount;
        KT.audio.SE.minus();
        setMessage(`🔴 ${player.name} は マイナス駅で ▲${KT.formatMoney(pick.amount, true)} 減ってしまった…`, player.avatar, 'sad');
        updateAllUI();
        await delay(500);
      } else {
        await KT.dialogs.showStationRouletteModal({
          title: `🔴 ${station.name}（マイナス駅）…`,
          headerClass: '',
          items,
          onSelect: chosen => {
            player.money -= chosen.amount;
            KT.audio.SE.minus();
            updateAllUI();
          }
        });
      }
    } else if (station.type === 'card') {
      const newCard = KT.drawRandomCard();
      if (player.cards.length < 8) {
        player.cards.push(newCard);
      }
      KT.audio.SE.card();
      if (player.isCpu) {
        setMessage(`🟨 ${player.name} は カード駅で「${newCard.icon}${newCard.name}」を手に入れた！`, player.avatar, 'happy');
        await delay(500);
      } else {
        await KT.dialogs.showEventModal({
          title: `🟨 カード駅で「${newCard.icon} ${newCard.name}」ゲット！`,
          desc: `${newCard.desc}`,
          charType: player.avatar,
          mood: 'happy',
          headerClass: 'gold',
          autoCloseMs: 1400
        });
      }
    } else if (station.type === 'shop') {
      if (player.isCpu) {
        if (player.money >= 250 && player.cards.length < 6) {
          player.money -= 200;
          player.cards.push(KT.getCardById('tokkyu'));
          setMessage(`🛒 ${player.name} は カード売場で「とっきゅうカード」を購入！`, player.avatar, 'happy');
          updateAllUI();
          await delay(500);
        }
      } else {
        await KT.dialogs.showCardShopModal(player, station);
      }
    } else if (station.type === 'warp') {
      const targets = KT.PROPERTY_STATIONS.filter(s => s.id !== station.id);
      const warpTo = targets[Math.floor(Math.random() * targets.length)];
      player.stationId = warpTo.id;
      KT.audio.SE.card();
      updateAllUI();
      KT.mapRenderer.focusOnStation(warpTo.id, 0.95);
      await KT.dialogs.showEventModal({
        title: `✨ ${station.name} から 超空間ワープ！`,
        desc: `不思議なトンネルを通って、<strong>【${warpTo.pref}】${warpTo.name}駅</strong> にワープしました！`,
        charType: player.avatar,
        mood: 'happy',
        headerClass: 'purple',
        autoCloseMs: player.isCpu ? 1100 : null
      });
    }

    if (!player.isCpu && player.money > 500 && Math.random() < 0.1) {
      await triggerRandomMiniEncounter(player, station);
    }

    updateAllUI();
    await endPlayerTurn();
  }

  async function handlePropertyStationVisit(player, station) {
    const pIdx = state.players.indexOf(player);

    const otherOwned = [];
    (station.properties || []).forEach((prop, idx) => {
      const ownerIdx = state.propertyOwners[`${station.id}_${idx}`];
      if (ownerIdx !== undefined && ownerIdx !== null && ownerIdx !== pIdx) {
        otherOwned.push({ prop, owner: state.players[ownerIdx] });
      }
    });

    if (otherOwned.length > 0) {
      const sample = otherOwned[0];
      const fee = Math.max(20, Math.round(sample.prop.price * 0.12));
      player.money -= fee;
      sample.owner.money += fee;
      KT.audio.SE.coin();
      setMessage(
        `🎡 ${player.name} は ${sample.owner.name} の「${sample.prop.name}」で遊び、入園料 ${KT.formatMoney(fee, true)} を支払いました！`,
        player.avatar,
        'happy'
      );
      updateAllUI();
      await delay(420);
    }

    if (player.isCpu) {
      const bought = KT.ai.autoBuyProperties(state, player, station);
      if (bought.length > 0) {
        KT.audio.SE.buy();
        updateAllUI();
        setMessage(
          `🏢 ${player.name} は 【${station.name}】で ${bought.join('、')} を購入しました！`,
          player.avatar,
          'happy'
        );
        await delay(550);
      }
    } else {
      await KT.dialogs.showPropertyShopModal(state, player, station);
      updateAllUI();
    }
  }

  async function triggerRandomMiniEncounter(player, station) {
    if (Math.random() < 0.45) {
      const patoIdx = player.cards.findIndex(c => c.id === 'pato');
      if (patoIdx !== -1) {
        player.cards.splice(patoIdx, 1);
        KT.audio.SE.goalFanfare();
        await KT.dialogs.showEventModal({
          title: '🚓 パトカードが 怪盗ニャンコ仮面を 撃退！',
          desc: '変装した「怪盗ニャンコ仮面」が現れましたが、パトカードのサイレンで逃げていきました！',
          charType: 'nyanko',
          mood: 'shock',
          headerClass: 'blue'
        });
      } else {
        const stolen = Math.max(50, Math.round(player.money * 0.18));
        player.money -= stolen;
        KT.audio.SE.minus();
        updateAllUI();
        await KT.dialogs.showEventModal({
          title: '🐱 怪盗ニャンコ仮面 参上ニャー！',
          desc: `「おこづかい <strong>${KT.formatMoney(stolen, true)}</strong> は いただくニャ〜♪ 代わりに ネコのヒゲを 置いていくニャ！」`,
          charType: 'nyanko',
          mood: 'happy',
          headerClass: 'purple'
        });
      }
    } else {
      const regionEvents = KT.LOCAL_MONSTER_EVENTS.filter(e => e.regions.includes(station.region));
      const ev = regionEvents[0] || KT.LOCAL_MONSTER_EVENTS[0];
      const gift = 200 * state.year;
      player.money += gift;
      if (player.cards.length < 8) player.cards.push(KT.getCardById('kyuko'));
      KT.audio.SE.coin();
      updateAllUI();
      await KT.dialogs.showEventModal({
        title: ev.title,
        desc: `${ev.goodDesc}<br>（＋<strong>${KT.formatMoney(gift, true)}</strong> ＆ 🚃きゅうこうカード！）`,
        charType: ev.svgType,
        mood: 'happy',
        headerClass: 'gold'
      });
    }
  }

  async function endPlayerTurn() {
    const player = state.players[state.currentPlayerIndex];
    if (player.sealedTurns > 0) player.sealedTurns--;

    if (state.binboPlayerIndex === state.currentPlayerIndex) {
      await executeBinboPhase(player);
    }

    state.currentPlayerIndex++;
    if (state.currentPlayerIndex >= state.players.length) {
      state.currentPlayerIndex = 0;
      await advanceMonth();
    } else {
      await startPlayerTurn();
    }
  }

  /**
   * ポンコツびんぼう神フェーズ（CPUターンの時は自動でサクッと進行！）
   */
  async function executeBinboPhase(player) {
    const autoMs = player.isCpu ? 1100 : null;
    state.binboTurnsOnForm = (state.binboTurnsOnForm || 0) + 1;

    if (state.binboForm === 'binbo' && state.binboTurnsOnForm >= 3 && Math.random() < 0.35) {
      if (Math.random() < 0.55) {
        state.binboForm = 'chibi';
        state.binboTurnsOnForm = 0;
        KT.audio.SE.card();
        updateAllUI();
        await KT.dialogs.showEventModal({
          title: '🍼 ポンコツ神が「ちびポコ神」に大変身！',
          desc: 'ポンコツびんぼう神が 可愛い赤ちゃんの「ちびポコ神」に変身しました！',
          charType: 'chibi',
          mood: 'happy',
          headerClass: 'gold',
          autoCloseMs: autoMs
        });
      } else {
        state.binboForm = 'king';
        state.binboTurnsOnForm = 0;
        KT.audio.SE.kingShock();
        updateAllUI();
        await KT.dialogs.showEventModal({
          title: '⚡ ぎゃー！！「大魔王ドカン神」に大変身！！',
          desc: 'ゴロゴロゴロ…ドカーン！！ポンコツ神が 最凶の「大魔王ドカン神」に変身してしまった！',
          charType: 'king',
          mood: 'shock',
          headerClass: 'purple',
          autoCloseMs: autoMs
        });
      }
    } else if (state.binboForm !== 'binbo' && state.binboTurnsOnForm >= 3) {
      state.binboForm = 'binbo';
      state.binboTurnsOnForm = 0;
      updateAllUI();
    }

    if (state.binboForm === 'chibi') {
      const milkCost = 20 * state.year;
      player.money -= milkCost;
      updateAllUI();
      setMessage(`🍼 ちびポコ神のおやつタイムで ${player.name} のお金が ${KT.formatMoney(milkCost, true)} 減りました♪`, 'chibi', 'happy');
      await delay(500);
      return;
    }

    if (state.binboForm === 'king') {
      const mechaIdx = player.cards.findIndex(c => c.id === 'mecha');
      if (mechaIdx !== -1) {
        player.cards.splice(mechaIdx, 1);
        state.binboForm = 'binbo';
        KT.audio.SE.goalFanfare();
        updateAllUI();
        await KT.dialogs.showEventModal({
          title: '🤖 メカ金太郎 ロケットパンチ炸裂！！',
          desc: '「メカ金太郎カード」が大魔王ドカン神の悪行をブロック！いつものポンコツ神に戻りました！',
          charType: 'kintaro',
          mood: 'happy',
          headerClass: 'gold',
          autoCloseMs: autoMs
        });
        return;
      }

      const loss = (220 + Math.floor(Math.random() * 300)) * state.year;
      player.money -= loss;
      KT.audio.SE.kingShock();
      updateAllUI();
      await KT.dialogs.showEventModal({
        title: '⚡ 大魔王ドカン神の雷撃！！',
        desc: `${player.name} の持ち金から <strong>▲${KT.formatMoney(loss, true)}</strong> が吹き飛ばされた！！`,
        charType: 'king',
        mood: 'shock',
        headerClass: 'purple',
        autoCloseMs: autoMs
      });
      return;
    }

    // 通常のポンコツびんぼう神
    const act = KT.BINBO_ACTIONS[Math.floor(Math.random() * KT.BINBO_ACTIONS.length)];
    KT.audio.SE.binbo();

    if (act.effect === 'quiz_game' && !player.isCpu) {
      const quiz = KT.PREF_QUIZZES[Math.floor(Math.random() * KT.PREF_QUIZZES.length)];
      const correct = await KT.dialogs.showBinboQuizModal(quiz);
      if (correct) {
        const prize = 200 * state.year;
        player.money += prize;
        KT.audio.SE.goalFanfare();
        updateAllUI();
        await KT.dialogs.showEventModal({
          title: '⭕ 大正解なのら〜！！',
          desc: `「すごいのら！ごほうびに <strong>＋${KT.formatMoney(prize, true)}</strong> をあげるのら〜♪」`,
          charType: 'binbo',
          mood: 'happy',
          headerClass: 'gold'
        });
      } else {
        const loss = 80 * state.year;
        player.money -= loss;
        updateAllUI();
        await KT.dialogs.showEventModal({
          title: '❌ ざんねん！ハズレなのら〜！',
          desc: `「おやつ代 <strong>▲${KT.formatMoney(loss, true)}</strong> をもらっちゃうのら〜♪」`,
          charType: 'binbo',
          mood: 'normal'
        });
      }
      return;
    }

    const loss = (60 + Math.floor(Math.random() * 70)) * state.year;
    player.money -= loss;
    updateAllUI();
    if (player.isCpu) {
      setMessage(`🦆 ポンコツびんぼう神のいたずらで ${player.name} は ▲${KT.formatMoney(loss, true)} 減ってしまった！`, 'binbo', 'happy');
      await delay(550);
    } else {
      await KT.dialogs.showEventModal({
        title: act.title,
        desc: `${act.desc}<br>（<strong>▲${KT.formatMoney(loss, true)}</strong> 減ってしまいました）`,
        charType: 'binbo',
        mood: 'normal'
      });
    }
  }

  /**
   * 1ヶ月進行＆名物アトラクション特別ニュース＆3月決算
   */
  async function advanceMonth() {
    for (const ev of KT.ATTRACTION_EVENTS) {
      const key = `${ev.stationId}_${ev.propIndex}`;
      const ownerIdx = state.propertyOwners[key];
      if (ownerIdx !== undefined && ownerIdx !== null && Math.random() < 0.22) {
        const owner = state.players[ownerIdx];
        const st = KT.STATION_MAP.get(ev.stationId);
        const prop = st?.properties?.[ev.propIndex];
        if (owner && prop) {
          const bonus = Math.round(prop.price * ev.bonusRate);
          owner.money += bonus;
          KT.audio.SE.goalFanfare();
          updateAllUI();
          await KT.dialogs.showEventModal({
            title: ev.title,
            desc: `${ev.desc}<br><br>🎊 オーナーの <strong>${owner.name}</strong> に 特別臨時ボーナス <strong>＋${KT.formatMoney(bonus, true)}</strong>！`,
            charType: owner.avatar,
            mood: 'happy',
            headerClass: 'gold',
            autoCloseMs: owner.isCpu ? 1400 : null
          });
          break;
        }
      }
    }

    if (state.month === 3) {
      const summary = state.players.map((p, idx) => {
        const rev = calcAnnualRevenue(idx);
        p.money += rev;
        const total = calcTotalAssets(idx);
        return { player: p, revenue: rev, totalAssets: total };
      });
      summary.sort((a, b) => b.totalAssets - a.totalAssets);
      updateAllUI();

      await KT.dialogs.showAnnualSettlementModal(state, summary);

      if (state.year >= state.maxYears) {
        await showGrandFinale(summary);
        return;
      }

      state.year++;
      state.month = 4;
    } else {
      state.month = state.month === 12 ? 1 : state.month + 1;
    }

    await startPlayerTurn();
  }

  async function showGrandFinale(sortedSummary) {
    const winner = sortedSummary[0];
    KT.audio.SE.goalFanfare();
    localStorage.removeItem(SAVE_KEY);

    const rankingHtml = sortedSummary.map((item, idx) => `
      <div style="display:flex; justify-content:space-between; align-items:center; background:#fff; border:3px solid ${item.player.color}; border-radius:14px; padding:10px 16px; margin-bottom:8px; font-weight:900;">
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="font-size:1.45rem;">${idx === 0 ? '🏆 優勝' : `${idx + 1}位`}</span>
          ${KT.svg.getCharacterSVG(item.player.avatar, 'happy', 48)}
          <span style="font-size:1.15rem;">${item.player.name}</span>
        </div>
        <div style="text-align:right;">
          <div style="font-size:0.85rem; color:#546e7a;">目的地到着：${item.player.goalCount || 0}回</div>
          <div style="font-size:1.25rem; color:#d50000;">総資産：${KT.formatMoney(item.totalAssets, true)}</div>
        </div>
      </div>
    `).join('');

    KT.dialogs.openModal(`
      <div class="celebration-banner">${KT.ruby(`🏆 祝・全${state.maxYears}年 グランドフィナーレ 表彰式！！`)} 🎊</div>
      <div style="margin:10px 0;">
        ${KT.svg.getCharacterSVG(winner.player.avatar, 'happy', 105)}
        <h2 style="color:#d50000; font-size:1.6rem; margin-top:6px;">
          👑 日本一の大社長：${winner.player.name}！！
        </h2>
      </div>
      <div style="margin:14px 0; text-align:left;">${rankingHtml}</div>
      <button id="finale-restart-btn" class="btn-jumbo btn-start">
        タイトル画面へ もどる 🎉
      </button>
    `);

    document.getElementById('finale-restart-btn')?.addEventListener('click', () => {
      KT.dialogs.closeModal();
      document.getElementById('title-screen').classList.remove('hidden');
    });
  }

  function showNationwideAtlasModal() {
    const regions = ['北海道', '東北', '関東', '中部', '近畿', '中国', '四国', '九州', '沖縄'];
    let selectedRegion = '関東';

    function renderAtlas() {
      const tabsHtml = regions.map(r => `
        <button class="atlas-tab-btn hud-icon-btn" data-reg="${r}"
                style="${r === selectedRegion ? 'background:#ffeb3b; border-color:#d50000;' : ''}">
          ${r}
        </button>
      `).join('');

      const stations = KT.PROPERTY_STATIONS.filter(s => s.region === selectedRegion);
      const listHtml = stations.map(st => {
        const propsText = (st.properties || []).map(p => `${p.icon}${p.name}（${KT.formatMoney(p.price, true)}）`).join(' ／ ');
        return `
          <div class="prop-item" style="cursor:pointer;" data-jump-st="${st.id}">
            <div style="flex:1;">
              <div class="prop-title">🗾 【${st.pref}】 ${st.name}駅（${st.kana}）</div>
              <div class="prop-desc" style="font-size:0.9rem; color:#263238;">${KT.ruby(propsText)}</div>
            </div>
            <button class="hud-icon-btn">📍 地図で見る</button>
          </div>
        `;
      }).join('');

      KT.dialogs.openModal(`
        <div class="modal-header blue">${KT.ruby('🗾 全国47都道府県 わくわくアトラクション＆名産品図鑑')}</div>
        <div style="display:flex; gap:6px; justify-content:center; flex-wrap:wrap; margin-bottom:10px;">
          ${tabsHtml}
        </div>
        <div class="prop-list" style="max-height:52vh; overflow-y:auto;">${listHtml}</div>
        <button id="atlas-close-btn" class="btn-jumbo btn-continue" style="padding:8px 32px; margin-top:8px;">
          とじる
        </button>
      `);

      document.querySelectorAll('.atlas-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          selectedRegion = btn.getAttribute('data-reg');
          KT.audio.SE.click();
          renderAtlas();
        });
      });

      document.querySelectorAll('[data-jump-st]').forEach(row => {
        row.addEventListener('click', () => {
          const stId = row.getAttribute('data-jump-st');
          KT.dialogs.closeModal();
          KT.mapRenderer.focusOnStation(stId, 1.05);
          KT.dialogs.showStationInspectorModal(state, stId);
        });
      });

      document.getElementById('atlas-close-btn')?.addEventListener('click', () => {
        KT.audio.SE.click();
        KT.dialogs.closeModal();
      });
    }

    renderAtlas();
  }

  function showCompanyStatusModal() {
    const summary = state.players.map((p, idx) => ({
      player: p,
      revenue: calcAnnualRevenue(idx),
      totalAssets: calcTotalAssets(idx),
      propCount: Object.values(state.propertyOwners).filter(o => o === idx).length
    }));
    summary.sort((a, b) => b.totalAssets - a.totalAssets);

    const rowsHtml = summary.map((item, idx) => `
      <div class="prop-item">
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="font-size:1.3rem; font-weight:900;">${idx + 1}位</span>
          ${KT.svg.getCharacterSVG(item.player.avatar, 'happy', 46)}
          <div>
            <div style="font-weight:900; font-size:1.05rem;">${item.player.name}</div>
            <div style="font-size:0.85rem; color:#546e7a;">
              所有物件：${item.propCount}件 ／ 目的地到着：${item.player.goalCount || 0}回
            </div>
          </div>
        </div>
        <div style="text-align:right; font-weight:900;">
          <div>持ち金：${KT.formatMoney(item.player.money, true)}</div>
          <div style="color:#2e7d32;">年間収益：＋${KT.formatMoney(item.revenue, true)}</div>
          <div style="color:#d50000; font-size:1.15rem;">総資産：${KT.formatMoney(item.totalAssets, true)}</div>
        </div>
      </div>
    `).join('');

    KT.dialogs.openModal(`
      <div class="modal-header gold">${KT.ruby('📊 社長たちの 会社情報・総資産ランキング')}</div>
      <div class="prop-list">${rowsHtml}</div>
      <button id="comp-close-btn" class="btn-jumbo btn-start" style="padding:8px 32px; margin-top:8px;">
        とじる
      </button>
    `);

    document.getElementById('comp-close-btn')?.addEventListener('click', () => {
      KT.audio.SE.click();
      KT.dialogs.closeModal();
    });
  }

  const DEFAULT_HUMAN_NAMES = ['きんたろう社長', 'うらしま社長', 'かぐや姫社長', 'いっすん社長'];
  const ALL_KNOWN_NAMES = [
    'きんたろう社長', 'うらしま社長', 'かぐや姫社長', 'いっすん社長',
    'まめオニ社長', 'あかオニ社長', 'メカオニ社長',
    '1P社長', '2P社長', '3P社長', '4P社長'
  ];

  function initApp() {
    const titleCharsEl = document.getElementById('title-chars-preview');
    if (titleCharsEl) {
      titleCharsEl.innerHTML = `
        ${KT.svg.getCharacterSVG('kintaro', 'happy', 70)}
        ${KT.svg.getCharacterSVG('binbo', 'happy', 64)}
        ${KT.svg.getCharacterSVG('chibi', 'happy', 60)}
        ${KT.svg.getCharacterSVG('king', 'shock', 68)}
      `;
    }

    document.querySelectorAll('[data-ruby]').forEach(el => {
      el.innerHTML = KT.ruby(el.innerHTML);
    });

    // プレイヤー設定スロットのプレビュー＆状態の更新
    function updateSetupSlot(slotIdx) {
      const typeSel = document.getElementById(`p-type-${slotIdx}`);
      const nameInp = document.getElementById(`p-name-${slotIdx}`);
      const box = document.querySelector(`.player-setup-box[data-slot="${slotIdx}"]`);
      const previewEl = document.getElementById(`p-avatar-preview-${slotIdx}`);
      if (!typeSel || !nameInp || !box) return;

      const type = typeSel.value;
      if (type === 'none') {
        box.classList.add('slot-disabled');
        nameInp.disabled = true;
        if (previewEl) previewEl.innerHTML = '<span style="font-size:1.6rem; opacity:0.35;">❌</span>';
      } else {
        box.classList.remove('slot-disabled');
        nameInp.disabled = false;
        const avatarMap = {
          human: PLAYER_AVATARS[slotIdx],
          cpu_easy: 'mame_oni',
          cpu_normal: 'aka_oni',
          cpu_hard: 'mecha_oni'
        };
        const avatarKey = avatarMap[type] || PLAYER_AVATARS[slotIdx];
        if (previewEl) {
          previewEl.innerHTML = KT.svg.getCharacterSVG(avatarKey, 'happy', 56);
        }
      }
    }

    // 選択中の人数に応じたプリセットボタンのハイライト同期
    function syncCountPresetButtons() {
      let humanCount = 0;
      for (let i = 0; i < 4; i++) {
        const typeSel = document.getElementById(`p-type-${i}`);
        if (typeSel && typeSel.value === 'human') humanCount++;
      }
      document.querySelectorAll('.btn-count-preset').forEach(btn => {
        const count = Number(btn.getAttribute('data-humans'));
        if (count === humanCount) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }

    // 各スロットの初期描画＆changeイベント設定
    for (let i = 0; i < 4; i++) {
      const typeSel = document.getElementById(`p-type-${i}`);
      const nameInp = document.getElementById(`p-name-${i}`);
      if (typeSel && nameInp) {
        updateSetupSlot(i);

        typeSel.addEventListener('change', () => {
          const newType = typeSel.value;
          const curVal = nameInp.value.trim();

          // 名前が未入力、または既知のデフォルト名のいずれかであれば、新タイプに応じた名前に自動更新
          if (!curVal || ALL_KNOWN_NAMES.includes(curVal)) {
            if (newType === 'human') {
              nameInp.value = DEFAULT_HUMAN_NAMES[i];
            } else if (newType === 'cpu_easy') {
              nameInp.value = 'まめオニ社長';
            } else if (newType === 'cpu_normal') {
              nameInp.value = 'あかオニ社長';
            } else if (newType === 'cpu_hard') {
              nameInp.value = 'メカオニ社長';
            }
          }

          updateSetupSlot(i);
          syncCountPresetButtons();
        });
      }
    }

    // 「にんげんで遊ぶ人数」クイック選択プリセットボタン
    document.querySelectorAll('.btn-count-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const humans = Number(btn.getAttribute('data-humans')) || 1;
        KT.audio.SE.click();

        // 人数プリセットの適用
        // 1人: 1P人間, 2P CPUやさしい, 3P CPUふつう, 4P 不参加
        // 2人: 1P人間, 2P人間, 3P CPUやさしい, 4P 不参加
        // 3人: 1P人間, 2P人間, 3P人間, 4P CPUやさしい
        // 4人: 1P人間, 2P人間, 3P人間, 4P人間
        const configs = {
          1: [
            { type: 'human', name: DEFAULT_HUMAN_NAMES[0] },
            { type: 'cpu_easy', name: 'まめオニ社長' },
            { type: 'cpu_normal', name: 'あかオニ社長' },
            { type: 'none', name: 'メカオニ社長' }
          ],
          2: [
            { type: 'human', name: DEFAULT_HUMAN_NAMES[0] },
            { type: 'human', name: DEFAULT_HUMAN_NAMES[1] },
            { type: 'cpu_easy', name: 'まめオニ社長' },
            { type: 'none', name: 'メカオニ社長' }
          ],
          3: [
            { type: 'human', name: DEFAULT_HUMAN_NAMES[0] },
            { type: 'human', name: DEFAULT_HUMAN_NAMES[1] },
            { type: 'human', name: DEFAULT_HUMAN_NAMES[2] },
            { type: 'cpu_easy', name: 'まめオニ社長' }
          ],
          4: [
            { type: 'human', name: DEFAULT_HUMAN_NAMES[0] },
            { type: 'human', name: DEFAULT_HUMAN_NAMES[1] },
            { type: 'human', name: DEFAULT_HUMAN_NAMES[2] },
            { type: 'human', name: DEFAULT_HUMAN_NAMES[3] }
          ]
        }[humans] || configs[1];

        configs.forEach((cfg, idx) => {
          const sel = document.getElementById(`p-type-${idx}`);
          const inp = document.getElementById(`p-name-${idx}`);
          if (sel) sel.value = cfg.type;
          if (inp) inp.value = cfg.name;
          updateSetupSlot(idx);
        });

        syncCountPresetButtons();
      });
    });

    const contBtn = document.getElementById('btn-continue-game');
    if (contBtn) {
      if (hasSavedGame()) {
        contBtn.style.display = 'inline-block';
        contBtn.addEventListener('click', () => {
          KT.audio.SE.click();
          if (loadSavedGame()) {
            document.getElementById('title-screen').classList.add('hidden');
            KT.audio.startBgm('normal');
            updateAllUI();
            startPlayerTurn();
          }
        });
      } else {
        contBtn.style.display = 'none';
      }
    }

    const mapSvg = document.getElementById('japan-map-svg');
    KT.mapRenderer.initMap(mapSvg, clickedStId => {
      if (mapClickResolver && mapClickResolver(clickedStId)) {
        return;
      }
      if (state && isCommandPhase) {
        KT.audio.SE.click();
        KT.dialogs.showStationInspectorModal(state, clickedStId);
      }
    });

    document.getElementById('btn-start-game')?.addEventListener('click', () => {
      KT.audio.SE.goalFanfare();
      const playersConfig = [];
      for (let i = 0; i < 4; i++) {
        const typeSel = document.getElementById(`p-type-${i}`);
        const nameInp = document.getElementById(`p-name-${i}`);
        const type = typeSel ? typeSel.value : 'none';
        if (type === 'none') continue;
        const avatarMap = {
          human: PLAYER_AVATARS[i],
          cpu_easy: 'mame_oni',
          cpu_normal: 'aka_oni',
          cpu_hard: 'mecha_oni'
        };
        const defaultName = type === 'human'
          ? (DEFAULT_HUMAN_NAMES[i] || `${i + 1}P社長`)
          : (type === 'cpu_easy' ? 'まめオニ社長' : type === 'cpu_hard' ? 'メカオニ社長' : 'あかオニ社長');

        playersConfig.push({
          slotIndex: i,
          name: nameInp && nameInp.value.trim() ? nameInp.value.trim() : defaultName,
          type,
          avatar: avatarMap[type] || PLAYER_AVATARS[i]
        });
      }

      // 最低2人は必要（1人のみの場合はCPUを1人追加）
      if (playersConfig.length < 2) {
        playersConfig.push({
          slotIndex: 1,
          name: 'まめオニ社長',
          type: 'cpu_easy',
          avatar: 'mame_oni'
        });
      }

      const yearsSel = document.getElementById('setup-years');
      const maxYears = yearsSel ? Number(yearsSel.value) : 3;
      startNewGame(playersConfig, maxYears);
    });

    // コマンドボタン
    document.getElementById('cmd-btn-dice')?.addEventListener('click', () => {
      if (!state || !isCommandPhase) return;
      const p = state.players[state.currentPlayerIndex];
      if (!p || p.isCpu) return;
      KT.audio.SE.click();
      rollAndMove(p, 1);
    });

    document.getElementById('cmd-btn-card')?.addEventListener('click', async () => {
      if (!state || !isCommandPhase) return;
      const p = state.players[state.currentPlayerIndex];
      if (!p || p.isCpu) return;
      KT.audio.SE.click();
      const chosenIdx = await KT.dialogs.showCardHandModal(p);
      if (chosenIdx !== null) {
        await useCardAction(p, chosenIdx);
      }
    });

    document.getElementById('cmd-btn-map')?.addEventListener('click', () => {
      if (!state) return;
      KT.audio.SE.click();
      showNationwideAtlasModal();
    });

    document.getElementById('cmd-btn-info')?.addEventListener('click', () => {
      if (!state) return;
      KT.audio.SE.click();
      showCompanyStatusModal();
    });

    // コマンドフェーズのキーボードショートカット（Space/Enterでサイコロ、Cでカード、Mで図鑑）
    window.addEventListener('keydown', async e => {
      const modalOverlay = document.getElementById('modal-overlay');
      if (!modalOverlay || !modalOverlay.classList.contains('hidden')) return;
      if (!state || !isCommandPhase) return;
      const p = state.players[state.currentPlayerIndex];
      if (!p || p.isCpu) return;

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        KT.audio.SE.click();
        rollAndMove(p, 1);
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        KT.audio.SE.click();
        const chosenIdx = await KT.dialogs.showCardHandModal(p);
        if (chosenIdx !== null) await useCardAction(p, chosenIdx);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        showNationwideAtlasModal();
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        showCompanyStatusModal();
      }
    });

    // 上部＆右サイドボタン
    document.getElementById('hud-goal-banner')?.addEventListener('click', () => {
      if (state && state.goalStationId) {
        KT.audio.SE.click();
        KT.mapRenderer.focusOnStation(state.goalStationId, 0.98);
        KT.dialogs.showStationInspectorModal(state, state.goalStationId);
      }
    });

    // モバイルブラウザでのWeb Audio APIアンロック
    const unlockAudio = () => {
      if (KT.audio && KT.audio.SE && KT.audio.SE.click) {
        // 何も鳴らさずコンテキストのみresume
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          try {
            const ctx = new AudioCtx();
            if (ctx.state === 'suspended') ctx.resume();
          } catch (_) {}
        }
      }
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('touchstart', unlockAudio, { passive: true });

    document.getElementById('btn-toggle-speed')?.addEventListener('click', e => {
      speedStateIndex = (speedStateIndex + 1) % 3;
      const cfg = [
        { mult: 1, icon: '⏩', label: '速度: ふつう' },
        { mult: 0.5, icon: '⏩', label: '速度: はやい' },
        { mult: 0.25, icon: '⚡', label: '速度: 超はやい' }
      ][speedStateIndex];
      KT.dialogs.setSpeedMultiplier(cfg.mult);
      e.currentTarget.innerHTML = `<span class="btn-icon">${cfg.icon}</span><span class="btn-text"> ${cfg.label}</span>`;
      KT.audio.SE.click();
    });

    document.getElementById('btn-toggle-ruby')?.addEventListener('click', e => {
      const enabled = KT.toggleRuby();
      e.currentTarget.innerHTML = `<span class="btn-icon">🔤</span><span class="btn-text"> フリガナ: ${enabled ? 'ON' : 'OFF'}</span>`;
    });

    document.getElementById('btn-toggle-sound')?.addEventListener('click', e => {
      const muted = KT.audio.toggleMute();
      e.currentTarget.innerHTML = `<span class="btn-icon">${muted ? '🔇' : '🔊'}</span><span class="btn-text"> 音: ${muted ? 'OFF' : 'ON'}</span>`;
    });

    document.getElementById('btn-zoom-in')?.addEventListener('click', () => KT.mapRenderer.adjustZoom(1.22));
    document.getElementById('btn-zoom-out')?.addEventListener('click', () => KT.mapRenderer.adjustZoom(0.82));
    document.getElementById('btn-focus-all')?.addEventListener('click', () => {
      const allZoom = window.innerWidth <= 600 ? 0.28 : 0.36;
      KT.mapRenderer.focusOnStation('gifu', allZoom);
    });
    document.getElementById('btn-focus-me')?.addEventListener('click', () => {
      if (!state) return;
      const p = state.players[state.currentPlayerIndex];
      if (p) KT.mapRenderer.focusOnStation(p.stationId, 0.98);
    });
    document.getElementById('btn-focus-goal')?.addEventListener('click', () => {
      if (state && state.goalStationId) {
        KT.mapRenderer.focusOnStation(state.goalStationId, 0.98);
      }
    });

    // 画面の向き変更・リサイズ時にカメラ位置を自然に追従
    window.addEventListener('resize', () => {
      if (state) {
        const cur = state.players[state.currentPlayerIndex];
        if (cur) KT.mapRenderer.focusOnStation(cur.stationId);
      }
    });
  }

  window.addEventListener('DOMContentLoaded', initApp);
})();
