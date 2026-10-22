/**
 * きんたろうてつどう - 全国47都道府県 インタラクティブSVGマップ描画エンジン (Ver 3.0 本家桃鉄・完全直交グリッド＆移動アニメーション対応)
 * ・すべての線路が100%縦（南北）または横（東西）の直交グリッド（斜め線ゼロ！）
 * ・現在地に「社長キャラ顔アイコン＋列車＋現在地スポットライト＋残り歩数バッジ」を大きく表示
 * ・駅間をスイスイ滑るように走る60fps移動アニメーション（animateTrainStep）
 * ・現在地の上下左右の線路上に直接出る「⬆️⬇️⬅️➡️ 方向矢印ガイド」と「↩️ もどる矢印」
 */
window.KT = window.KT || {};

(function () {
  let svgEl = null;
  let cameraGroup = null;
  let staticLayer = null;
  let dynamicLayer = null;

  // カメラ座標（現在値と目標値を補間してなめらかに追従）
  let camX = 3220;
  let camY = 2015;
  let targetCamX = 3220;
  let targetCamY = 2015;
  let zoom = 0.88;
  let targetZoom = 0.88;
  let animFrameId = null;

  let isDragging = false;
  let dragMoved = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let camStartX = 0;
  let camStartY = 0;

  let onStationClickCallback = null;
  let highlightedBranchIds = new Set();
  let previousStationIdForBack = null;
  let currentRemainingSteps = null;

  /**
   * 100%直交グリッド（gx*230, gy*155）に合わせた日本列島のデフォルメ地形ポリゴン
   */
  const JAPAN_LAND_PATHS = [
    // 北海道 (gx: 13..17 => x: 2990..3910, gy: 1..5 => y: 155..775)
    {
      fill: '#a5d6a7',
      stroke: '#2e7d32',
      d: 'M2870,80 L3580,80 L4020,240 L4020,560 L3560,720 L3120,860 L2870,860 L2870,380 Z'
    },
    // 本州（東北〜関東〜中部〜近畿〜中国）
    {
      fill: '#c5e1a5',
      stroke: '#33691e',
      d: 'M2870,990 L3560,990 L3560,2410 L2640,2410 L2400,2560 L1720,2560 L1720,2260 L820,2260 L820,1920 L1950,1920 L1950,1460 L2640,1460 L2870,1300 Z'
    },
    // 四国 (gx: 5..7 => x: 1150..1610, gy: 16..17 => y: 2480..2635)
    {
      fill: '#dce775',
      stroke: '#827717',
      d: 'M1050,2400 L1710,2400 L1710,2730 L1050,2730 Z'
    },
    // 九州 (gx: 2..4 => x: 460..920, gy: 15..18 => y: 2325..2790)
    {
      fill: '#ffcc80',
      stroke: '#e65100',
      d: 'M360,2240 L1020,2240 L1020,2880 L360,2880 Z'
    },
    // 沖縄 (gx: 2..3 => x: 460..690, gy: 20..21 => y: 3100..3255)
    {
      fill: '#ffab91',
      stroke: '#bf360c',
      d: 'M340,3010 L810,3010 L810,3350 L340,3350 Z'
    }
  ];

  function initMap(svgElement, stationClickHandler) {
    svgEl = svgElement;
    onStationClickCallback = stationClickHandler;

    svgEl.innerHTML = `
      <defs>
        <filter id="tileShadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000" flood-opacity="0.38"/>
        </filter>
        <pattern id="seaGrid" width="230" height="155" patternUnits="userSpaceOnUse">
          <rect width="230" height="155" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2"/>
          <path d="M 40 78 Q 75 63 110 78 T 180 78" fill="none" stroke="rgba(255,255,255,0.16)" stroke-width="3" stroke-linecap="round"/>
        </pattern>
      </defs>
      <rect x="-4000" y="-4000" width="14000" height="14000" fill="url(#seaGrid)" pointer-events="none"/>
      <g id="map-camera-group">
        <g id="map-static-layer"></g>
        <g id="map-dynamic-layer"></g>
      </g>
    `;

    cameraGroup = svgEl.querySelector('#map-camera-group');
    staticLayer = svgEl.querySelector('#map-static-layer');
    dynamicLayer = svgEl.querySelector('#map-dynamic-layer');

    renderStaticBackgroundAndTracks();
    setupPanAndZoom();
    startCameraLoop();
  }

  /**
   * 地形と100%縦・横の直交線路を初回に描画
   */
  function renderStaticBackgroundAndTracks() {
    if (!staticLayer) return;

    const landSvg = JAPAN_LAND_PATHS.map(p => `
      <path d="${p.d}" fill="${p.fill}" stroke="${p.stroke}" stroke-width="14" stroke-linejoin="round" filter="url(#tileShadow)"/>
    `).join('');

    // 地方名プレート
    const regionBanners = [
      { label: '北海道エリア', x: 3450, y: 60, color: '#2e7d32' },
      { label: '東北エリア', x: 3720, y: 1240, color: '#00838f' },
      { label: '関東エリア', x: 3720, y: 2015, color: '#1565c0' },
      { label: '中部・北陸エリア', x: 2300, y: 1400, color: '#283593' },
      { label: '近畿エリア', x: 2070, y: 2630, color: '#6a1b9a' },
      { label: '中国・四国エリア', x: 1150, y: 1850, color: '#ef6c00' },
      { label: '九州・沖縄エリア', x: 460, y: 2160, color: '#c62828' }
    ].map(b => `
      <g transform="translate(${b.x}, ${b.y})" opacity="0.9">
        <rect x="-95" y="-22" width="190" height="36" rx="18" fill="${b.color}" stroke="#fff" stroke-width="3"/>
        <text x="0" y="3" font-size="16" font-weight="900" fill="#fff" text-anchor="middle">${b.label}</text>
      </g>
    `).join('');

    // 100%縦（南北）または横（東西）の路線リンク描画
    const drawnEdges = new Set();
    const linesSvg = [];
    KT.STATIONS.forEach(st => {
      st.links.forEach(nextId => {
        const key = [st.id, nextId].sort().join('--');
        if (drawnEdges.has(key)) return;
        drawnEdges.add(key);
        const target = KT.STATION_MAP.get(nextId);
        if (!target) return;

        const isSea = st.id.includes('ferry') || target.id.includes('ferry') || st.id === 'plus_ishigaki' || target.id === 'plus_ishigaki' ||
                      (st.id === 'kagoshima' && target.id === 'naha') || (st.id === 'naha' && target.id === 'kagoshima') ||
                      (st.id === 'aomori' && target.id === 'hakodate') || (st.id === 'hakodate' && target.id === 'aomori');

        if (isSea) {
          // 海路・青函トンネル・沖縄航路（水色の点線レーン）
          linesSvg.push(`
            <line x1="${st.x}" y1="${st.y}" x2="${target.x}" y2="${target.y}"
                  stroke="#0288d1" stroke-width="18" stroke-linecap="round"/>
            <line x1="${st.x}" y1="${st.y}" x2="${target.x}" y2="${target.y}"
                  stroke="#80d8ff" stroke-width="10" stroke-dasharray="14,12" stroke-linecap="round"/>
          `);
        } else {
          // 本家桃鉄風のくっきりした縦・横の枕木付き線路
          linesSvg.push(`
            <line x1="${st.x}" y1="${st.y}" x2="${target.x}" y2="${target.y}"
                  stroke="#263238" stroke-width="20" stroke-linecap="round"/>
            <line x1="${st.x}" y1="${st.y}" x2="${target.x}" y2="${target.y}"
                  stroke="#eceff1" stroke-width="12" stroke-linecap="round"/>
            <line x1="${st.x}" y1="${st.y}" x2="${target.x}" y2="${target.y}"
                  stroke="#37474f" stroke-width="10" stroke-dasharray="10,14" stroke-linecap="round"/>
          `);
        }
      });
    });

    staticLayer.innerHTML = `
      ${landSvg}
      ${regionBanners}
      <g class="routes-layer">${linesSvg.join('')}</g>
    `;
  }

  // マルチタッチ・ピンチズーム対応トラッキング
  const activePointers = new Map();
  let pinchInitialDist = null;
  let pinchInitialZoom = null;
  let lastTapTime = 0;

  function getDistance(p1, p2) {
    const dx = p1.clientX - p2.clientX;
    const dy = p1.clientY - p2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function getResponsiveZoom(baseZoom) {
    if (window.innerWidth <= 480) {
      return Math.max(0.32, baseZoom * 0.82);
    } else if (window.innerWidth <= 768) {
      return Math.max(0.32, baseZoom * 0.90);
    }
    return baseZoom;
  }

  function setupPanAndZoom() {
    const viewport = document.getElementById('map-viewport');
    if (!viewport) return;

    viewport.addEventListener('pointerdown', e => {
      if (e.target.closest('.station-node-group') || e.target.closest('.map-dir-arrow')) return;
      activePointers.set(e.pointerId, e);
      try { viewport.setPointerCapture(e.pointerId); } catch (_) {}

      if (activePointers.size === 1) {
        // ダブルタップで少し拡大
        const now = performance.now();
        if (now - lastTapTime < 320) {
          adjustZoom(1.3);
          lastTapTime = 0;
        } else {
          lastTapTime = now;
        }

        isDragging = true;
        dragMoved = false;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        camStartX = targetCamX;
        camStartY = targetCamY;
      } else if (activePointers.size === 2) {
        // 2本指でのピンチズーム開始
        isDragging = false;
        dragMoved = true;
        const [p1, p2] = Array.from(activePointers.values());
        pinchInitialDist = getDistance(p1, p2);
        pinchInitialZoom = targetZoom;
      }
    });

    viewport.addEventListener('pointermove', e => {
      if (!activePointers.has(e.pointerId)) return;
      activePointers.set(e.pointerId, e);

      if (activePointers.size === 1 && isDragging) {
        const dx = (e.clientX - dragStartX) / zoom;
        const dy = (e.clientY - dragStartY) / zoom;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragMoved = true;
        targetCamX = Math.max(200, Math.min(4100, camStartX - dx));
        targetCamY = Math.max(80, Math.min(3400, camStartY - dy));
        camX = targetCamX;
        camY = targetCamY;
      } else if (activePointers.size === 2 && pinchInitialDist) {
        const [p1, p2] = Array.from(activePointers.values());
        const currentDist = getDistance(p1, p2);
        if (currentDist > 10 && pinchInitialDist > 10) {
          const scale = currentDist / pinchInitialDist;
          targetZoom = Math.max(0.30, Math.min(1.80, pinchInitialZoom * scale));
        }
      }
    });

    function handlePointerUpOrCancel(e) {
      activePointers.delete(e.pointerId);
      try { viewport.releasePointerCapture(e.pointerId); } catch (_) {}

      if (activePointers.size === 0) {
        isDragging = false;
        pinchInitialDist = null;
      } else if (activePointers.size === 1) {
        // 2本指から1本指に戻った時、急激なジャンプを防ぐためドラッグ開始点を再初期化
        const remaining = Array.from(activePointers.values())[0];
        isDragging = true;
        dragStartX = remaining.clientX;
        dragStartY = remaining.clientY;
        camStartX = targetCamX;
        camStartY = targetCamY;
        pinchInitialDist = null;
      }
    }

    viewport.addEventListener('pointerup', handlePointerUpOrCancel);
    viewport.addEventListener('pointercancel', handlePointerUpOrCancel);

    viewport.addEventListener('wheel', e => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.15 : 0.87;
      targetZoom = Math.max(0.30, Math.min(1.80, targetZoom * factor));
    }, { passive: false });
  }

  function startCameraLoop() {
    function step() {
      camX += (targetCamX - camX) * 0.25;
      camY += (targetCamY - camY) * 0.25;
      zoom += (targetZoom - zoom) * 0.22;

      if (svgEl && cameraGroup) {
        const rect = svgEl.getBoundingClientRect();
        const vw = rect.width || window.innerWidth;
        const vh = rect.height || window.innerHeight;
        const tx = vw / 2 - camX * zoom;
        const ty = vh / 2 - camY * zoom;
        cameraGroup.setAttribute('transform', `translate(${tx.toFixed(1)}, ${ty.toFixed(1)}) scale(${zoom.toFixed(3)})`);
      }
      animFrameId = requestAnimationFrame(step);
    }
    if (!animFrameId) animFrameId = requestAnimationFrame(step);
  }

  function focusOnStation(stationId, newZoom = null, instant = false) {
    const st = KT.STATION_MAP.get(stationId);
    if (!st) return;
    targetCamX = st.x;
    // スマホでは下部ドックやヘッダーが上下にあるため、少し中央より上に配置して見やすく
    const offsetY = window.innerWidth <= 768 ? 10 : 20;
    targetCamY = st.y - offsetY;
    if (newZoom !== null) {
      targetZoom = getResponsiveZoom(newZoom);
    }
    if (instant) {
      camX = targetCamX;
      camY = targetCamY;
      if (newZoom !== null) zoom = targetZoom;
    }
  }

  function adjustZoom(deltaFactor) {
    targetZoom = Math.max(0.30, Math.min(1.80, targetZoom * deltaFactor));
  }

  function setHighlightedBranches(stationIds = [], backStationId = null, remainingSteps = null) {
    highlightedBranchIds = new Set(stationIds);
    previousStationIdForBack = backStationId;
    currentRemainingSteps = remainingSteps;
  }

  /**
   * 駅間を滑らかに移動するアニメーション（60fps補間＋カメラ追従）
   * @param {number} playerIndex - 移動するプレイヤーのインデックス
   * @param {string} fromStationId - 出発駅ID
   * @param {string} toStationId - 到着駅ID
   * @param {number} durationMs - 移動時間(ms)
   */
  function animateTrainStep(playerIndex, fromStationId, toStationId, durationMs = 180) {
    return new Promise(resolve => {
      const fromSt = KT.STATION_MAP.get(fromStationId);
      const toSt = KT.STATION_MAP.get(toStationId);
      if (!fromSt || !toSt || !dynamicLayer) {
        resolve();
        return;
      }

      const markerEl = dynamicLayer.querySelector(`.train-marker-group[data-player-idx="${playerIndex}"]`);
      if (!markerEl) {
        resolve();
        return;
      }

      // 移動アニメーション中は矢印ガイドを一時非表示にしてスッキリ見せる
      const arrowsLayer = dynamicLayer.querySelector('.arrows-layer');
      if (arrowsLayer) arrowsLayer.style.opacity = '0.2';

      const actualDuration = Math.max(55, KT.dialogs && KT.dialogs.scaledTime ? KT.dialogs.scaledTime(durationMs) : durationMs);
      const startTime = performance.now();
      let done = false;

      const finishAnim = () => {
        if (done) return;
        done = true;
        clearTimeout(safetyTimer);
        markerEl.setAttribute('transform', `translate(${toSt.x}, ${toSt.y})`);
        targetCamX = toSt.x;
        targetCamY = toSt.y - 20;
        resolve();
      };

      const safetyTimer = setTimeout(finishAnim, actualDuration + 100);

      function tick(now) {
        if (done) return;
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / actualDuration);
        // なめらかなイージング + 軽快なジャンプ弧
        const ease = 1 - Math.pow(1 - t, 2.2);
        const curX = fromSt.x + (toSt.x - fromSt.x) * ease;
        const curY = fromSt.y + (toSt.y - fromSt.y) * ease;
        const hopY = -Math.sin(t * Math.PI) * 16;

        markerEl.setAttribute('transform', `translate(${curX.toFixed(1)}, ${(curY + hopY).toFixed(1)})`);

        // カメラもキャラクターに合わせて滑らかに追従
        targetCamX = curX;
        targetCamY = curY - 20;

        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          finishAnim();
        }
      }

      requestAnimationFrame(tick);
    });
  }

  /**
   * 駅ノード・4方向直交矢印・目的地ガイドライン・社長キャラ＆汽車コマの描画
   */
  function renderMap(state) {
    if (!dynamicLayer || !state) return;

    const distMap = state.goalStationId ? KT.getShortestDistances(state.goalStationId) : new Map();
    const curPlayer = state.players[state.currentPlayerIndex];
    const curSt = curPlayer ? KT.STATION_MAP.get(curPlayer.stationId) : null;
    const goalSt = state.goalStationId ? KT.STATION_MAP.get(state.goalStationId) : null;

    // 1. 現在地から目的地へのゴールドコンパス点線
    let compassLineSvg = '';
    if (curSt && goalSt && curSt.id !== goalSt.id) {
      compassLineSvg = `
        <line x1="${curSt.x}" y1="${curSt.y}" x2="${goalSt.x}" y2="${goalSt.y}"
              stroke="#ffd600" stroke-width="5" stroke-dasharray="16,14" opacity="0.6" pointer-events="none"/>
      `;
    }

    // 2. 全駅マスの描画
    const stationsSvg = KT.STATIONS.map(st => {
      const isGoal = state.goalStationId === st.id;
      const isCurrentHere = curSt && curSt.id === st.id;
      const isBranchChoice = highlightedBranchIds.has(st.id);
      const isBackChoice = previousStationIdForBack === st.id;
      const dist = distMap.has(st.id) ? distMap.get(st.id) : null;

      // 所有状況
      let propBoxes = [];
      let isMonopoly = false;
      if (st.type === 'property' && st.properties) {
        const owners = st.properties.map((_, idx) => state.propertyOwners[`${st.id}_${idx}`]);
        propBoxes = owners.map(oIdx => (oIdx !== undefined && oIdx !== null) ? state.players[oIdx]?.color : '#cfd8dc');
        const validOwners = owners.filter(o => o !== undefined && o !== null);
        if (validOwners.length === st.properties.length && new Set(validOwners).size === 1) {
          isMonopoly = true;
        }
      }

      let tileSvg = '';
      if (st.type === 'property') {
        const w = Math.max(114, st.name.length * 16 + 24);
        const h = 52;
        const bgFill = isGoal ? '#ffeb3b' : isCurrentHere ? '#fff9c4' : isMonopoly ? '#ffe082' : '#ffffff';
        const borderCol = isGoal ? '#d50000' : isCurrentHere ? '#ff1744' : isBranchChoice ? '#00e676' : '#263238';
        const borderW = (isGoal || isCurrentHere || isBranchChoice) ? 6 : 3.5;

        const boxW = Math.min(16, Math.floor((w - 20) / Math.max(1, propBoxes.length)) - 3);
        const boxesHtml = propBoxes.map((col, idx) => {
          const bx = -((propBoxes.length * (boxW + 3)) / 2) + idx * (boxW + 3);
          return `<rect x="${bx}" y="14" width="${boxW}" height="8" rx="2" fill="${col}" stroke="#263238" stroke-width="1.2"/>`;
        }).join('');

        tileSvg = `
          <rect x="${-w / 2}" y="${-h / 2 + 4}" width="${w}" height="${h}" rx="12" fill="#263238" opacity="0.45"/>
          <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="12"
                fill="${bgFill}" stroke="${borderCol}" stroke-width="${borderW}"/>
          <path d="M ${-w / 2 + 3} ${-h / 2 + 16} L ${w / 2 - 3} ${-h / 2 + 16}" stroke="#cfd8dc" stroke-width="1.5"/>
          <text x="0" y="${-h / 2 + 13}" font-size="9.5" font-weight="900" fill="#c62828" text-anchor="middle">${st.kana || ''}</text>
          <text x="0" y="7" font-size="15.5" font-weight="900" fill="#212121" text-anchor="middle">${st.name}</text>
          ${boxesHtml}
          ${isMonopoly ? `<text x="${w / 2 - 8}" y="${-h / 2 + 6}" font-size="20" text-anchor="middle">👑</text>` : ''}
        `;
      } else {
        const cfg = {
          plus:  { fill: '#1e88e5', stroke: '#fff', text: '＋', textCol: '#fff' },
          minus: { fill: '#e53935', stroke: '#fff', text: 'ー', textCol: '#fff' },
          card:  { fill: '#fdd835', stroke: '#263238', text: 'カ', textCol: '#263238' },
          shop:  { fill: '#fb8c00', stroke: '#fff', text: '売', textCol: '#fff' },
          warp:  { fill: '#8e24aa', stroke: '#ffd600', text: '★', textCol: '#ffd600' }
        }[st.type] || { fill: '#90a4ae', stroke: '#fff', text: '●', textCol: '#fff' };

        const ringStroke = isCurrentHere ? '#ff1744' : isBranchChoice ? '#00e676' : cfg.stroke;
        const ringW = (isCurrentHere || isBranchChoice) ? 6 : 4;

        tileSvg = `
          <circle cx="0" cy="4" r="22" fill="#263238" opacity="0.35"/>
          <circle cx="0" cy="0" r="22" fill="${cfg.fill}" stroke="${ringStroke}" stroke-width="${ringW}"/>
          <ellipse cx="-6" cy="-8" rx="8" ry="4" fill="rgba(255,255,255,0.35)" transform="rotate(-25 -6 -8)"/>
          <text x="0" y="7" font-size="19" font-weight="900" fill="${cfg.textCol}" text-anchor="middle">${cfg.text}</text>
          <rect x="-40" y="25" width="80" height="17" rx="8" fill="rgba(38,50,56,0.86)"/>
          <text x="0" y="37" font-size="10.5" font-weight="800" fill="#fff" text-anchor="middle">${st.name}</text>
        `;
      }

      // 目的地フラッグ演出
      const goalBanner = isGoal ? `
        <circle cx="0" cy="0" r="46" fill="none" stroke="#ff1744" stroke-width="6" class="goal-pulse-ring"/>
        <g transform="translate(0, 44)">
          <rect x="-66" y="0" width="132" height="26" rx="13" fill="#d50000" stroke="#ffeb3b" stroke-width="3" filter="url(#tileShadow)"/>
          <text x="0" y="18" font-size="13.5" font-weight="900" fill="#ffeb3b" text-anchor="middle">🏁 もくてきち！</text>
        </g>
      ` : '';

      // 移動中の隣接マスガイド（「あとXマス」または「↩️1マスもどる」）
      let branchBadge = '';
      if (isBranchChoice) {
        branchBadge = `
          <g transform="translate(0, -42)">
            <rect x="-56" y="-22" width="112" height="26" rx="13"
                  fill="${isBackChoice ? '#546e7a' : '#00c853'}" stroke="#ffffff" stroke-width="3" filter="url(#tileShadow)"/>
            <text x="0" y="-4" font-size="12.5" font-weight="900" fill="#fff" text-anchor="middle">
              ${isBackChoice ? '↩️ 1マスもどる' : `あと ${dist} マス`}
            </text>
          </g>
        `;
      }

      return `
        <g class="station-node-group" data-station-id="${st.id}" transform="translate(${st.x}, ${st.y})" style="cursor:pointer;">
          ${tileSvg}
          ${goalBanner}
          ${branchBadge}
        </g>
      `;
    }).join('');

    // 3. 移動中：現在地の線路の上下左右に直接「光る直交矢印ボタン（↑・↓・←・→）」を描画
    let arrowsSvg = '';
    if (curSt && highlightedBranchIds.size > 0) {
      let bestDist = 9999;
      highlightedBranchIds.forEach(id => {
        if (id === previousStationIdForBack) return;
        const d = distMap.has(id) ? distMap.get(id) : 999;
        if (d < bestDist) bestDist = d;
      });

      const neighbors = KT.getDirectionalNeighbors ? KT.getDirectionalNeighbors(curSt.id) : {};
      const dirConfigs = [
        { dir: 'up',    id: neighbors.up,    ox: 0,    oy: -88, rot: -90, keyLabel: '↑' },
        { dir: 'down',  id: neighbors.down,  ox: 0,    oy: 78,  rot: 90,  keyLabel: '↓' },
        { dir: 'left',  id: neighbors.left,  ox: -102, oy: 0,   rot: 180, keyLabel: '←' },
        { dir: 'right', id: neighbors.right, ox: 102,  oy: 0,   rot: 0,   keyLabel: '→' }
      ];

      arrowsSvg = dirConfigs.map(cfg => {
        if (!cfg.id || !highlightedBranchIds.has(cfg.id)) return '';
        const isBack = cfg.id === previousStationIdForBack;
        const distVal = distMap.has(cfg.id) ? distMap.get(cfg.id) : 999;
        const isBest = !isBack && distVal === bestDist;

        const fillCol = isBack ? '#78909c' : isBest ? '#ffd600' : '#00e676';
        const strokeCol = isBest ? '#d50000' : '#ffffff';
        const ax = curSt.x + cfg.ox;
        const ay = curSt.y + cfg.oy;

        return `
          <g class="map-dir-arrow" data-target-id="${cfg.id}" transform="translate(${ax}, ${ay})" style="cursor:pointer;">
            <g transform="rotate(${cfg.rot})">
              <polygon points="30,0 -18,-24 -8,0 -18,24" fill="${fillCol}" stroke="${strokeCol}" stroke-width="4" filter="url(#tileShadow)"/>
            </g>
            <circle cx="0" cy="0" r="13" fill="#263238" stroke="#fff" stroke-width="2"/>
            <text x="0" y="5" font-size="14" font-weight="900" fill="#fff" text-anchor="middle">${cfg.keyLabel}</text>
          </g>
        `;
      }).join('');
    }

    // 4. プレイヤーの「社長キャラクター＋列車」コマ描画（現在手番プレイヤーを最前面に描画！）
    const renderOrder = state.players
      .map((p, idx) => ({ p, idx }))
      .sort((a, b) => (a.idx === state.currentPlayerIndex ? 1 : b.idx === state.currentPlayerIndex ? -1 : a.idx - b.idx));

    const playersSvg = renderOrder.map(({ p, idx }) => {
      const st = KT.STATION_MAP.get(p.stationId);
      if (!st) return '';
      const isCurrent = idx === state.currentPlayerIndex;
      // 手番外のプレイヤーは駅の四隅に少しずらして配置し、現在手番プレイヤーは駅のど真ん中に堂々と配置！
      const cornerOffsets = [[-54, -24], [54, -24], [-54, 30], [54, 30]];
      const [ox, oy] = isCurrent ? [0, 0] : cornerOffsets[idx % 4];
      const hasBinbo = state.binboPlayerIndex === idx ? state.binboForm : null;
      const remSteps = isCurrent ? currentRemainingSteps : null;

      return `
        <g class="train-marker-group ${isCurrent ? 'is-current-player' : ''}"
           data-player-idx="${idx}"
           transform="translate(${st.x + ox}, ${st.y + oy})"
           style="pointer-events:none;">
          ${KT.svg.getPlayerPieceSVG(p, isCurrent, hasBinbo, remSteps)}
        </g>
      `;
    }).join('');

    dynamicLayer.innerHTML = `
      ${compassLineSvg}
      <g class="stations-layer">${stationsSvg}</g>
      <g class="arrows-layer">${arrowsSvg}</g>
      <g class="players-layer">${playersSvg}</g>
    `;

    // クリックイベントバインド
    dynamicLayer.querySelectorAll('.station-node-group').forEach(node => {
      node.addEventListener('click', e => {
        if (dragMoved) return;
        e.stopPropagation();
        const stId = node.getAttribute('data-station-id');
        if (onStationClickCallback) onStationClickCallback(stId);
      });
    });

    dynamicLayer.querySelectorAll('.map-dir-arrow').forEach(arrow => {
      arrow.addEventListener('click', e => {
        if (dragMoved) return;
        e.stopPropagation();
        const stId = arrow.getAttribute('data-target-id');
        if (onStationClickCallback) onStationClickCallback(stId);
      });
    });
  }

  KT.mapRenderer = {
    initMap,
    renderMap,
    focusOnStation,
    adjustZoom,
    setHighlightedBranches,
    animateTrainStep
  };
})();
