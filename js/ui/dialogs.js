/**
 * きんたろうてつどう - ダイアログ・SVGサイコロ演出・ルーレット・物件購入・年度末決算画面 (Ver 2.0 快適テンポ版)
 * ・サイコロやルーレット後の余計なボタンクリック待ちを廃止し、本家桃鉄のようにテンポよく進行
 * ・CPUターン中のイベントは人間がボタンを押さなくても自動で進行（ゲーム速度設定にも対応）
 * ・Enter / Space キーでの快適スキップ操作に対応
 */
window.KT = window.KT || {};

(function () {
  let gameSpeedMultiplier = 1; // 1: ふつう, 0.5: はやい, 0.25: 超はやい

  function setSpeedMultiplier(mult) {
    gameSpeedMultiplier = mult;
  }

  function getSpeedMultiplier() {
    return gameSpeedMultiplier;
  }

  function scaledTime(ms) {
    return Math.max(120, Math.round(ms * gameSpeedMultiplier));
  }

  function getModalElements() {
    return {
      overlay: document.getElementById('modal-overlay'),
      windowEl: document.getElementById('modal-window')
    };
  }

  let activeKeyHandler = null;

  function clearKeyHandler() {
    if (activeKeyHandler) {
      window.removeEventListener('keydown', activeKeyHandler);
      activeKeyHandler = null;
    }
  }

  function closeModal() {
    clearKeyHandler();
    const { overlay } = getModalElements();
    if (overlay) overlay.classList.add('hidden');
  }

  function openModal(htmlContent) {
    clearKeyHandler();
    const { overlay, windowEl } = getModalElements();
    if (!overlay || !windowEl) return;
    windowEl.innerHTML = KT.ruby(htmlContent);
    overlay.classList.remove('hidden');
  }

  function bindConfirmKeys(callback) {
    clearKeyHandler();
    activeKeyHandler = e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        callback();
      }
    };
    window.addEventListener('keydown', activeKeyHandler);
  }

  /**
   * 汎用イベント通知モーダル
   * autoCloseMs が指定されている場合（CPUターン等）は自動で閉じる
   */
  function showEventModal({
    title,
    desc,
    charType = 'kintaro',
    mood = 'happy',
    headerClass = '',
    buttonText = 'OK！（Enter）',
    autoCloseMs = null
  }) {
    return new Promise(resolve => {
      let done = false;
      let timer = null;
      const finish = () => {
        if (done) return;
        done = true;
        if (timer) clearTimeout(timer);
        KT.audio.SE.click();
        closeModal();
        resolve();
      };

      openModal(`
        <div class="modal-header ${headerClass}">${KT.ruby(title)}</div>
        <div class="event-modal-body" style="display:flex; align-items:center; gap:18px; padding:10px 6px; text-align:left; flex-wrap:wrap; justify-content:center;">
          <div class="event-modal-avatar" style="flex-shrink:0;">${KT.svg.getCharacterSVG(charType, mood, 96)}</div>
          <div class="event-modal-desc" style="flex:1; min-width:240px; font-size:1.15rem; font-weight:800; line-height:1.85; background:#fff8e1; border:3px solid #ffb300; border-radius:16px; padding:14px 18px;">
            ${KT.ruby(desc)}
          </div>
        </div>
        <div style="margin-top:12px;">
          <button id="modal-ok-btn" class="btn-jumbo btn-start" style="padding:10px 36px;">
            ${KT.ruby(buttonText)}
          </button>
        </div>
      `);

      const btn = document.getElementById('modal-ok-btn');
      if (btn) btn.addEventListener('click', finish);
      bindConfirmKeys(finish);

      if (autoCloseMs !== null) {
        timer = setTimeout(finish, scaledTime(autoCloseMs));
      }
    });
  }

  /**
   * SVG 3D風サイコロ回転アニメーション（出目が決まったらボタン押し不要で自動的に移動開始！）
   */
  function showDiceRollModal(player, diceResults, titleLabel = '🎲 サイコロタイム！') {
    return new Promise(resolve => {
      const count = diceResults.length;
      const total = diceResults.reduce((a, b) => a + b, 0);

      openModal(`
        <div id="dice-modal-inner" style="cursor:pointer;">
          <div class="modal-header">${KT.ruby(titleLabel)}</div>
          <div style="display:flex; align-items:center; justify-content:center; gap:12px; margin-bottom:6px;">
            ${KT.svg.getCharacterSVG(player.avatar, 'happy', 58)}
            <div style="font-size:1.25rem; font-weight:900;">
              ${KT.ruby(`${player.name}：サイコロ ${count}個！`)}
            </div>
          </div>
          <div id="dice-anim-stage" class="dice-stage">
            ${diceResults.map(() => KT.svg.getDiceSVG(Math.ceil(Math.random() * 6), 80, true)).join('')}
          </div>
          <div id="dice-result-area" style="min-height:64px; display:flex; flex-direction:column; align-items:center; justify-content:center;">
            <div style="font-weight:900; font-size:1.1rem; color:#546e7a;">🎲 コロコロ…（クリック / Enter で即決定）</div>
          </div>
        </div>
      `);

      const stage = document.getElementById('dice-anim-stage');
      const resultArea = document.getElementById('dice-result-area');

      let ticks = 0;
      const maxTicks = Math.max(5, Math.round(10 * gameSpeedMultiplier));
      let landed = false;
      let completed = false;
      let finishTimer = null;

      const completeMove = () => {
        if (completed) return;
        completed = true;
        clearInterval(rollInterval);
        if (finishTimer) clearTimeout(finishTimer);
        KT.audio.SE.whistle();
        closeModal();
        resolve(total);
      };

      const landDiceNow = () => {
        if (completed) return;
        if (landed) {
          completeMove();
          return;
        }
        landed = true;
        clearInterval(rollInterval);
        KT.audio.SE.diceDecide();
        if (stage) {
          stage.innerHTML = diceResults
            .map(val => KT.svg.getDiceSVG(val, 84, false))
            .join('');
        }
        if (resultArea) {
          resultArea.innerHTML = `
            <div class="dice-total-banner">🎉 ${KT.ruby(`合計 ${total} マス すすむ！`)}</div>
          `;
        }
        // 余計なクリック待ちをせず、0.65秒後に自動でマップ移動を開始！
        finishTimer = setTimeout(completeMove, scaledTime(680));
      };

      bindConfirmKeys(landDiceNow);
      document.getElementById('dice-modal-inner')?.addEventListener('click', landDiceNow);

      const rollInterval = setInterval(() => {
        ticks++;
        KT.audio.SE.diceTick();
        if (stage) {
          stage.innerHTML = diceResults
            .map(() => KT.svg.getDiceSVG(Math.ceil(Math.random() * 6), 80, true))
            .join('');
        }
        if (ticks >= maxTicks) {
          landDiceNow();
        }
      }, 75);
    });
  }

  /**
   * 目的地決定ルーレットモーダル（好きな駅を直接選ぶことも可能！）
   */
  function showDestinationRouletteModal(currentGoalId = null, isAutoCpu = false) {
    return new Promise(resolve => {
      const candidates = KT.PROPERTY_STATIONS.filter(s => s.id !== currentGoalId);
      const chosen = candidates[Math.floor(Math.random() * candidates.length)];

      openModal(`
        <div class="modal-header gold">${KT.ruby('🎯 つぎの目的地ルーレット！')}</div>
        <div class="roulette-modal-top" style="display:flex; justify-content:center; align-items:center; gap:14px; margin-bottom:6px;">
          <div class="roulette-modal-avatar">${KT.svg.getCharacterSVG('kintaro', 'happy', 72)}</div>
          <div style="text-align:left; font-weight:900; font-size:1.05rem;">
            ${KT.ruby('全国47都道府県の駅から、つぎの目的地を決めるよ！')}
          </div>
        </div>
        <div id="goal-roulette-display" class="roulette-box">
          ${KT.ruby('どこになるかな…？')}
        </div>
        <div id="goal-roulette-footer" style="min-height:90px;"></div>
      `);

      const disp = document.getElementById('goal-roulette-display');
      const footer = document.getElementById('goal-roulette-footer');
      let count = 0;
      const maxSteps = Math.max(8, Math.round(14 * gameSpeedMultiplier));
      let finished = false;

      const timer = setInterval(() => {
        count++;
        KT.audio.SE.diceTick();
        const temp = candidates[count % candidates.length];
        if (disp) {
          disp.innerHTML = `【${temp.pref}】 ${temp.name}駅`;
        }
        if (count >= maxSteps) {
          clearInterval(timer);
          KT.audio.SE.goalFanfare();
          if (disp) {
            disp.innerHTML = `🎉 【${chosen.pref}】 ${chosen.name}駅 🎉`;
          }
          const featuredProp = chosen.properties && chosen.properties[0]
            ? `${chosen.properties[0].icon} ${chosen.properties[0].name}`
            : '';

          const finishGoal = (stationObj) => {
            if (finished) return;
            finished = true;
            KT.audio.SE.click();
            closeModal();
            resolve(stationObj);
          };

          if (footer) {
            footer.innerHTML = `
              <div style="background:#fff8e1; border:3px solid #ffa000; border-radius:14px; padding:10px; margin-bottom:12px; font-weight:800;">
                ${KT.ruby(`名物スポット：「${featuredProp}」がある駅だよ！`)}
              </div>
              <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
                <button id="goal-decide-btn" class="btn-jumbo btn-start" style="padding:10px 32px;">
                  ${KT.ruby('よし、ここを目指すぞ！（Enter）')}
                </button>
                <button id="goal-pick-utsunomiya" class="hud-icon-btn" style="background:#fff9c4;">
                  🐄 栃木（りんどう湖）にする！
                </button>
              </div>
            `;
            document.getElementById('goal-decide-btn')?.addEventListener('click', () => finishGoal(chosen));
            document.getElementById('goal-pick-utsunomiya')?.addEventListener('click', () => {
              const tochigi = KT.STATION_MAP.get('utsunomiya') || chosen;
              finishGoal(tochigi);
            });
            bindConfirmKeys(() => finishGoal(chosen));

            if (isAutoCpu) {
              setTimeout(() => finishGoal(chosen), scaledTime(1100));
            }
          }
        }
      }, 75);
    });
  }

  /**
   * プラス駅・マイナス駅の高速ルーレット（結果表示後に自動で閉じる快適設計）
   */
  function showStationRouletteModal({ title, headerClass, items, onSelect }) {
    return new Promise(resolve => {
      const chosen = items[Math.floor(Math.random() * items.length)];
      openModal(`
        <div id="st-roulette-inner" style="cursor:pointer;">
          <div class="modal-header ${headerClass}">${KT.ruby(title)}</div>
          <div id="st-roulette-disp" class="roulette-box">🎰 ルーレット回転中…</div>
          <div id="st-roulette-sub" style="min-height:48px; font-weight:900; color:#546e7a;"></div>
        </div>
      `);

      const disp = document.getElementById('st-roulette-disp');
      const sub = document.getElementById('st-roulette-sub');
      let step = 0;
      const maxSteps = Math.max(6, Math.round(10 * gameSpeedMultiplier));
      let done = false;

      const finish = () => {
        if (done) return;
        done = true;
        closeModal();
        resolve(chosen);
      };

      const timer = setInterval(() => {
        step++;
        KT.audio.SE.diceTick();
        const cur = items[step % items.length];
        if (disp) disp.innerHTML = cur.label;
        if (step >= maxSteps) {
          clearInterval(timer);
          if (disp) disp.innerHTML = `✨ ${chosen.label} ✨`;
          if (onSelect) onSelect(chosen);
          if (sub) sub.innerHTML = '決定！';
          bindConfirmKeys(finish);
          document.getElementById('st-roulette-inner')?.addEventListener('click', finish);
          setTimeout(finish, scaledTime(850));
        }
      }, 70);
    });
  }

  /**
   * 物件駅のアトラクション＆名産品 購入モーダル（まとめ買いボタン付き！）
   */
  function showPropertyShopModal(state, player, station, options = {}) {
    return new Promise(resolve => {
      const discountFactor = options.halfPrice ? 0.5 : options.freeOne ? 0 : 1;
      let freeUsed = false;

      function renderShopContent(justMonopolized = false) {
        const pIdx = state.players.indexOf(player);
        const props = station.properties || [];

        // 未購入で買える物件の合計額を計算
        let unownedTotal = 0;
        let unownedIndices = [];
        props.forEach((prop, idx) => {
          const ownerIdx = state.propertyOwners[`${station.id}_${idx}`];
          if (ownerIdx === undefined || ownerIdx === null) {
            const pCost = Math.round(prop.price * discountFactor);
            unownedTotal += pCost;
            unownedIndices.push(idx);
          }
        });

        const rowsHtml = props.map((prop, idx) => {
          const key = `${station.id}_${idx}`;
          const ownerIdx = state.propertyOwners[key];
          const isSelf = ownerIdx === pIdx;
          const isOther = ownerIdx !== undefined && ownerIdx !== null && !isSelf;
          const effectivePrice = (options.freeOne && !freeUsed) ? 0 : Math.round(prop.price * discountFactor);
          const canAfford = player.money >= effectivePrice;

          let actionHtml = '';
          if (isSelf) {
            actionHtml = `<span style="background:#ffa000; color:#fff; padding:6px 14px; border-radius:10px; font-weight:900;">👑 購入ずみ</span>`;
          } else if (isOther) {
            const ownerName = state.players[ownerIdx]?.name || '他社';
            actionHtml = `<span style="background:#78909c; color:#fff; padding:6px 12px; border-radius:10px;">${ownerName}</span>`;
          } else if (canAfford) {
            actionHtml = `
              <button class="buy-prop-btn btn-jumbo btn-start" data-prop-idx="${idx}" style="padding:7px 20px; font-size:1rem;">
                ${effectivePrice === 0 ? '🎁 無料でもらう！' : '買う！'}
              </button>
            `;
          } else {
            actionHtml = `<span style="color:#90a4ae; font-size:0.9rem;">お金不足</span>`;
          }

          return `
            <div class="prop-item ${isSelf ? 'owned-self' : isOther ? 'owned-other' : ''}">
              <div style="flex:1; min-width:220px;">
                <div class="prop-title">
                  <span style="font-size:1.55rem;">${prop.icon}</span>
                  <span>${KT.ruby(prop.name)}</span>
                </div>
                <div class="prop-desc">${KT.ruby(prop.desc)}</div>
              </div>
              <div class="prop-meta">
                <span style="font-size:1.1rem;">${KT.formatMoney(effectivePrice, true)}</span>
                <span class="prop-rate-badge">収益 ${prop.rate}%</span>
                ${actionHtml}
              </div>
            </div>
          `;
        }).join('');

        const canBuyAll = unownedIndices.length >= 2 && player.money >= unownedTotal && !options.freeOne;

        openModal(`
          <div class="modal-header">
            🏢 ${KT.ruby(`【${station.pref}】 ${station.name}駅 の 物件うりば`)}
          </div>
          ${justMonopolized ? `
            <div class="celebration-banner">
              👑 ${KT.ruby(`祝・${station.name}駅 を 完全独占！！ 収益がすべて２倍になります！`)} 🎉
            </div>
          ` : ''}
          <div style="display:flex; justify-content:space-between; align-items:center; background:#e3f2fd; border:3px solid #1e88e5; border-radius:14px; padding:10px 18px; font-weight:900; font-size:1.15rem;">
            <span>💼 ${player.name} の 持ち金</span>
            <span style="color:#d50000; font-size:1.35rem;">${KT.formatMoney(player.money, true)}</span>
          </div>
          <div class="prop-list">${rowsHtml}</div>
          <div style="display:flex; justify-content:center; gap:14px; flex-wrap:wrap; margin-top:14px;">
            ${canBuyAll ? `
              <button id="prop-buy-all-btn" class="btn-jumbo btn-start" style="background:linear-gradient(180deg,#ffca28,#f57f17); color:#212121; padding:10px 26px;">
                👑 ぜんぶまとめて買う！（${KT.formatMoney(unownedTotal, true)}）
              </button>
            ` : ''}
            <button id="prop-shop-close" class="btn-jumbo btn-continue" style="padding:10px 34px;">
              お買い物を おわる（Enter）
            </button>
          </div>
        `);

        document.querySelectorAll('.buy-prop-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const idx = Number(btn.getAttribute('data-prop-idx'));
            const prop = props[idx];
            const key = `${station.id}_${idx}`;
            const effectivePrice = (options.freeOne && !freeUsed) ? 0 : Math.round(prop.price * discountFactor);
            if (player.money < effectivePrice) return;

            player.money -= effectivePrice;
            state.propertyOwners[key] = pIdx;
            if (options.freeOne && !freeUsed) freeUsed = true;

            const allOwned = props.every((_, i) => state.propertyOwners[`${station.id}_${i}`] === pIdx);
            if (allOwned) KT.audio.SE.monopoly();
            else KT.audio.SE.buy();

            KT.mapRenderer.renderMap(state);
            renderShopContent(allOwned);
          });
        });

        document.getElementById('prop-buy-all-btn')?.addEventListener('click', () => {
          if (player.money < unownedTotal) return;
          player.money -= unownedTotal;
          unownedIndices.forEach(idx => {
            state.propertyOwners[`${station.id}_${idx}`] = pIdx;
          });
          const allOwned = props.every((_, i) => state.propertyOwners[`${station.id}_${i}`] === pIdx);
          if (allOwned) KT.audio.SE.monopoly();
          else KT.audio.SE.buy();

          KT.mapRenderer.renderMap(state);
          renderShopContent(allOwned);
        });

        const finishShop = () => {
          KT.audio.SE.click();
          closeModal();
          resolve();
        };

        document.getElementById('prop-shop-close')?.addEventListener('click', finishShop);
        bindConfirmKeys(finishShop);
      }

      renderShopContent(false);
    });
  }

  /**
   * スペシャルカード（1〜6の好きな目を選ぶ）モーダル
   */
  function showSpecialNumberPickerModal() {
    return new Promise(resolve => {
      openModal(`
        <div class="modal-header gold">⭐ ${KT.ruby('スペシャルカード！ 進むマス数をえらぼう！')}</div>
        <p style="font-weight:900; margin-bottom:14px;">
          ${KT.ruby('1〜6の サイコロをクリックするか、キーボードの 1〜6 キーを押してね！')}
        </p>
        <div style="display:flex; justify-content:center; gap:14px; flex-wrap:wrap; margin:18px 0;">
          ${[1, 2, 3, 4, 5, 6].map(n => `
            <button class="sp-num-btn" data-num="${n}" style="background:#fff; border:3px solid #263238; border-radius:16px; padding:8px; cursor:pointer;">
              ${KT.svg.getDiceSVG(n, 78, false)}
              <div style="font-weight:900; font-size:1.15rem; margin-top:4px;">${n}マス</div>
            </button>
          `).join('')}
        </div>
        <button id="sp-cancel-btn" class="hud-icon-btn">やめる（Esc）</button>
      `);

      const pick = n => {
        KT.audio.SE.diceDecide();
        closeModal();
        resolve(n);
      };

      document.querySelectorAll('.sp-num-btn').forEach(btn => {
        btn.addEventListener('click', () => pick(Number(btn.getAttribute('data-num'))));
      });

      activeKeyHandler = e => {
        if (e.key >= '1' && e.key <= '6') {
          e.preventDefault();
          pick(Number(e.key));
        } else if (e.key === 'Escape') {
          KT.audio.SE.cancel();
          closeModal();
          resolve(null);
        }
      };
      window.addEventListener('keydown', activeKeyHandler);

      document.getElementById('sp-cancel-btn')?.addEventListener('click', () => {
        KT.audio.SE.cancel();
        closeModal();
        resolve(null);
      });
    });
  }

  /**
   * 手持ちカード一覧＆使用モーダル
   */
  function showCardHandModal(player) {
    return new Promise(resolve => {
      if (!player.cards || player.cards.length === 0) {
        showEventModal({
          title: '🃏 カード袋は からっぽです',
          desc: 'いまは カードを 1枚も 持っていないよ！黄色の「カ（カード駅）」や オレンジ色の「売（カード売場）」に 止まると 手に入るよ！',
          charType: player.avatar,
          mood: 'normal',
          headerClass: 'blue'
        }).then(() => resolve(null));
        return;
      }

      const cardsHtml = player.cards.map((card, idx) => `
        <div class="game-card-item">
          <div>
            <div class="c-head">
              <span style="font-size:1.55rem;">${card.icon}</span>
              <span>${KT.ruby(card.name)}</span>
            </div>
            <div class="c-desc">${KT.ruby(card.desc)}</div>
          </div>
          <div style="display:flex; gap:8px; justify-content:flex-end;">
            <button class="use-card-btn btn-jumbo btn-start" data-idx="${idx}" style="padding:6px 18px; font-size:0.95rem;">
              つかう！
            </button>
          </div>
        </div>
      `).join('');

      openModal(`
        <div class="modal-header blue">🃏 ${player.name} の カード袋（${player.cards.length} / 8枚）</div>
        ${player.sealedTurns > 0 ? `
          <div style="background:#ffebee; border:3px solid #e53935; border-radius:12px; padding:8px; font-weight:900; color:#d50000; margin-bottom:8px;">
            💤 ふういん状態のため、あと ${player.sealedTurns} ターンは カードが使えません！
          </div>
        ` : ''}
        <div class="card-grid">${cardsHtml}</div>
        <button id="card-modal-close" class="btn-jumbo btn-continue" style="padding:8px 32px; margin-top:8px;">
          とじる
        </button>
      `);

      document.querySelectorAll('.use-card-btn').forEach(btn => {
        if (player.sealedTurns > 0) {
          btn.disabled = true;
          btn.style.opacity = '0.45';
          return;
        }
        btn.addEventListener('click', () => {
          const idx = Number(btn.getAttribute('data-idx'));
          KT.audio.SE.card();
          closeModal();
          resolve(idx);
        });
      });

      document.getElementById('card-modal-close')?.addEventListener('click', () => {
        KT.audio.SE.cancel();
        closeModal();
        resolve(null);
      });
    });
  }

  /**
   * カード売り場駅モーダル
   */
  function showCardShopModal(player, station) {
    return new Promise(resolve => {
      const shopCards = ['kyuko', 'tokkyu', 'shinkansen', 'linear', 'special', 'buttobi', 'chikamichi', 'oharai', 'pato', 'mecha']
        .map(id => KT.getCardById(id))
        .filter(Boolean);

      function renderCardShop() {
        const listHtml = shopCards.map(c => {
          const canBuy = player.money >= c.price && player.cards.length < 8;
          return `
            <div class="game-card-item">
              <div>
                <div class="c-head"><span>${c.icon}</span><span>${KT.ruby(c.name)}</span></div>
                <div class="c-desc">${KT.ruby(c.desc)}</div>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-weight:900; color:#d50000;">${KT.formatMoney(c.price, true)}</span>
                <button class="buy-card-btn btn-jumbo btn-start" data-id="${c.id}"
                        style="padding:5px 16px; font-size:0.9rem; ${canBuy ? '' : 'opacity:0.35; pointer-events:none;'}">
                  買う
                </button>
              </div>
            </div>
          `;
        }).join('');

        openModal(`
          <div class="modal-header gold">🛒 ${station.name} カードうりば</div>
          <div style="display:flex; justify-content:space-between; background:#fff8e1; border:3px solid #ffa000; border-radius:12px; padding:10px 18px; font-weight:900; font-size:1.1rem;">
            <span>💼 持ち金：${KT.formatMoney(player.money, true)}</span>
            <span>🃏 手持ちカード：${player.cards.length} / 8枚</span>
          </div>
          <div class="card-grid">${listHtml}</div>
          <button id="card-shop-exit" class="btn-jumbo btn-continue" style="padding:8px 32px;">
            うりばを 出る（Enter）
          </button>
        `);

        document.querySelectorAll('.buy-card-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const c = KT.getCardById(btn.getAttribute('data-id'));
            if (!c || player.money < c.price || player.cards.length >= 8) return;
            player.money -= c.price;
            player.cards.push(c);
            KT.audio.SE.buy();
            renderCardShop();
          });
        });

        const exitShop = () => {
          KT.audio.SE.click();
          closeModal();
          resolve();
        };
        document.getElementById('card-shop-exit')?.addEventListener('click', exitShop);
        bindConfirmKeys(exitShop);
      }

      renderCardShop();
    });
  }

  /**
   * 3月 年度末「けっさん（決算）」画面モーダル
   */
  function showAnnualSettlementModal(state, revenueSummary) {
    return new Promise(resolve => {
      KT.audio.setBgmMode('kessan');
      const maxAsset = Math.max(1000, ...revenueSummary.map(r => Math.max(100, r.totalAssets)));

      const rowsHtml = revenueSummary.map((item, idx) => {
        const pct = Math.max(6, Math.min(100, Math.round((Math.max(0, item.totalAssets) / maxAsset) * 100)));
        return `
          <div class="kessan-row">
            <div class="kessan-row-top">
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:1.35rem;">${idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🎖️'}</span>
                ${KT.svg.getCharacterSVG(item.player.avatar, 'happy', 44)}
                <span style="font-size:1.15rem;">${idx + 1}位：${item.player.name}</span>
              </div>
              <div style="text-align:right;">
                <div style="color:#2e7d32; font-size:0.95rem;">
                  今年の物件収益：＋${KT.formatMoney(item.revenue, true)}
                </div>
                <div style="font-size:1.25rem; color:#d50000;">
                  総資産：${KT.formatMoney(item.totalAssets, true)}
                </div>
              </div>
            </div>
            <div class="kessan-bar-wrap">
              <div class="kessan-bar-fill" data-target-width="${pct}%" style="background:${item.player.color};"></div>
            </div>
          </div>
        `;
      }).join('');

      openModal(`
        <div class="modal-header gold">📊 ${state.year}年目 年度末「けっさん（決算）」発表！</div>
        <p style="font-weight:900; font-size:1.05rem;">
          ${KT.ruby('全国のアトラクションや名産品物件から、1年分の収益（もうけ）が振り込まれました！')}
        </p>
        <div class="kessan-chart">${rowsHtml}</div>
        <button id="kessan-next-btn" class="btn-jumbo btn-start" style="margin-top:8px;">
          ${state.year >= state.maxYears ? '🏆 最終結果発表へ！' : `🌸 ${state.year + 1}年目へ すすむ！（Enter）`}
        </button>
      `);

      setTimeout(() => {
        document.querySelectorAll('.kessan-bar-fill').forEach((bar, i) => {
          bar.style.width = bar.getAttribute('data-target-width');
          KT.audio.SE.graphTick(i * 4);
        });
      }, 120);

      const finishKessan = () => {
        KT.audio.SE.goalFanfare();
        KT.audio.setBgmMode('normal');
        closeModal();
        resolve();
      };
      document.getElementById('kessan-next-btn')?.addEventListener('click', finishKessan);
      bindConfirmKeys(finishKessan);
    });
  }

  /**
   * 駅の物件詳細インスペクター
   */
  function showStationInspectorModal(state, stationId) {
    const st = KT.STATION_MAP.get(stationId);
    if (!st) return;

    const dist = state.goalStationId ? KT.getDistanceBetween(st.id, state.goalStationId) : 0;

    let bodyHtml = '';
    if (st.type === 'property' && st.properties) {
      bodyHtml = `
        <div class="prop-list">
          ${st.properties.map((p, idx) => {
            const ownerIdx = state.propertyOwners[`${st.id}_${idx}`];
            const owner = ownerIdx !== undefined && ownerIdx !== null ? state.players[ownerIdx] : null;
            return `
              <div class="prop-item ${owner ? 'owned-self' : ''}">
                <div>
                  <div class="prop-title"><span>${p.icon}</span><span>${KT.ruby(p.name)}</span></div>
                  <div class="prop-desc">${KT.ruby(p.desc)}</div>
                </div>
                <div class="prop-meta">
                  <span>${KT.formatMoney(p.price, true)}</span>
                  <span class="prop-rate-badge">収益 ${p.rate}%</span>
                  <span style="padding:4px 10px; border-radius:8px; background:${owner ? owner.color : '#cfd8dc'}; color:${owner ? '#fff' : '#37474f'};">
                    ${owner ? owner.name : '未購入'}
                  </span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else {
      const typeDescriptions = {
        plus: '🔵 プラス駅：止まると おこづかいが もらえる ラッキーな 駅だよ！',
        minus: '🔴 マイナス駅：止まると お金が 減っちゃうので 気をつけよう！',
        card: '🟨 カード駅：止まると 便利な お助けカードが 1枚 もらえるよ！',
        shop: '🛒 カード売り場：好きな カードを お金で 買える お店だよ！',
        warp: '✨ ワープ駅：全国の どこかへ ジャンプできる 不思議な 駅だよ！'
      };
      bodyHtml = `
        <div style="background:#fff8e1; border:3px solid #ffa000; border-radius:16px; padding:16px; font-weight:900; font-size:1.1rem; margin:12px 0;">
          ${KT.ruby(typeDescriptions[st.type] || '')}
        </div>
      `;
    }

    openModal(`
      <div class="modal-header blue">
        🗾 【${st.pref}】 ${st.name}（${st.kana}）
      </div>
      <div style="font-weight:900; font-size:1.1rem; color:#d50000; margin-bottom:8px;">
        🏁 現在の目的地まで：あと ${dist} マス
      </div>
      ${bodyHtml}
      <div style="display:flex; justify-content:center; gap:12px; margin-top:12px;">
        <button id="insp-focus-btn" class="hud-icon-btn">📍 この駅を画面の中心にする</button>
        <button id="insp-close-btn" class="btn-jumbo btn-start" style="padding:6px 26px;">とじる</button>
      </div>
    `);

    document.getElementById('insp-focus-btn')?.addEventListener('click', () => {
      KT.mapRenderer.focusOnStation(st.id, 1.05);
      closeModal();
    });
    document.getElementById('insp-close-btn')?.addEventListener('click', () => {
      KT.audio.SE.click();
      closeModal();
    });
    bindConfirmKeys(closeModal);
  }

  /**
   * ポンコツびんぼう神の3択ご当地クイズモーダル
   */
  function showBinboQuizModal(quiz) {
    return new Promise(resolve => {
      openModal(`
        <div class="modal-header purple">🦆 ${KT.ruby('ポンコツびんぼう神の わくわく都道府県クイズ！')}</div>
        <div style="display:flex; justify-content:center; margin-bottom:8px;">
          ${KT.svg.getCharacterSVG('binbo', 'happy', 84)}
        </div>
        <div style="background:#f3e5f5; border:3px solid #8e24aa; border-radius:16px; padding:14px; font-size:1.15rem; font-weight:900; margin-bottom:14px;">
          ${KT.ruby(quiz.q)}
        </div>
        <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
          ${quiz.choices.map((c, idx) => `
            <button class="quiz-ans-btn btn-jumbo btn-start" data-idx="${idx}" style="font-size:1.1rem; padding:10px 24px;">
              ${KT.ruby(c)}
            </button>
          `).join('')}
        </div>
      `);

      document.querySelectorAll('.quiz-ans-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.getAttribute('data-idx'));
          closeModal();
          resolve(idx === quiz.answer);
        });
      });
    });
  }

  /**
   * 人間プレイヤー交代・ターン開始告知モーダル
   * 人間が複数人いるマルチプレイ時に端末交代をスムーズに促す
   */
  function showTurnNoticeModal(player, playerIndex, goalStation, distToGoal) {
    return new Promise(resolve => {
      const colorClasses = ['p-red', 'p-blue', 'p-yellow', 'p-green'];
      const slotColorClass = colorClasses[playerIndex % 4] || 'p-red';
      const slotLabels = ['🔴 1P', '🔵 2P', '🟡 3P', '🟢 4P'];
      const slotLabel = slotLabels[playerIndex % 4] || `${playerIndex + 1}P`;
      const defaultAvatars = ['player1', 'player2', 'player3', 'player4'];
      const avatarType = player.avatar || defaultAvatars[playerIndex % 4] || 'player1';

      openModal(`
        <div class="turn-notice-card">
          <div class="turn-notice-banner ${slotColorClass}">
            <span>${slotLabel}</span>
            <span>${player.name} の番です！</span>
          </div>
          <div class="turn-notice-avatar">
            ${KT.svg.getCharacterSVG(avatarType, 'happy', 96)}
          </div>
          <div class="turn-notice-instruction">
            📱 端末（コントローラー）を交代してください！<br>
            準備ができたら <strong>［スタート！］</strong> を押してね！
          </div>
          <div class="turn-notice-status-row">
            <div>💼 持ち金：<strong style="color:#d50000;">${KT.formatMoney(player.money, true)}</strong></div>
            <div>🏁 目的地まで：<strong>あと ${distToGoal} マス</strong></div>
            <div>🃏 カード：<strong>${player.cards.length} 枚</strong></div>
          </div>
          <button id="turn-notice-start-btn" class="btn-jumbo btn-start" style="padding:12px 42px; font-size:1.3rem;">
            🎲 交代完了！サイコロをふる！（Space / Enter）
          </button>
        </div>
      `);

      let started = false;
      const finish = () => {
        if (started) return;
        started = true;
        KT.audio.SE.click();
        closeModal();
        resolve();
      };

      document.getElementById('turn-notice-start-btn')?.addEventListener('click', finish);
      bindConfirmKeys(finish);
    });
  }

  KT.dialogs = {
    openModal,
    closeModal,
    setSpeedMultiplier,
    getSpeedMultiplier,
    scaledTime,
    showEventModal,
    showDiceRollModal,
    showDestinationRouletteModal,
    showStationRouletteModal,
    showPropertyShopModal,
    showSpecialNumberPickerModal,
    showCardHandModal,
    showCardShopModal,
    showAnnualSettlementModal,
    showStationInspectorModal,
    showBinboQuizModal,
    showTurnNoticeModal
  };
})();
