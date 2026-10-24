/**
 * きんたろうてつどう - 全国47都道府県 インタラクティブSVGマップ描画エンジン (Ver 3.5 超軽量・省バッテリー＆マップダイレクトタップ移動対応)
 * ・常時RAFループを完全撤去！カメラ静止時はCPU/GPU稼働率ゼロで発熱・バッテリー消費を大幅抑制
 * ・重いSVGフィルター（feDropShadow）や巨大パターンを廃止し、iPhone Safariでも超軽快動作
 * ・進める駅・方向矢印に大きな透明タッチ判定（半径48px）を配置し、指でポンポン快適に1マス移動
 * ・残り0マスのときは現在地駅をタップするだけで「⭕ ここに止まる！」が即座に実行
 */
window.KT = window.KT || {};

(function () {
  const KT = window.KT;
  let svgEl = null;
  let cameraGroup = null;
  let staticLayer = null;
  let dynamicLayer = null;

  // カメラ座標＆キャッシュ
  let camX = 3220;
  let camY = 2015;
  let targetCamX = 3220;
  let targetCamY = 2015;
  let zoom = 0.88;
  let targetZoom = 0.88;
  let isCameraActive = false;
  let animFrameId = null;

  let cachedVw = window.innerWidth;
  let cachedVh = window.innerHeight;

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

  function updateViewportCache() {
    if (svgEl) {
      const rect = svgEl.getBoundingClientRect();
      cachedVw = rect.width || window.innerWidth;
      cachedVh = rect.height || window.innerHeight;
    } else {
      cachedVw = window.innerWidth;
      cachedVh = window.innerHeight;
    }
  }

  function applyCameraTransform() {
    if (cameraGroup) {
      const tx = cachedVw / 2 - camX * zoom;
      const ty = cachedVh / 2 - camY * zoom;
      cameraGroup.setAttribute('transform', `translate(${tx.toFixed(1)}, ${ty.toFixed(1)}) scale(${zoom.toFixed(3)})`);
    }
  }

  /**
   * カメラが必要な時だけRAFを実行（目標値に到達したら即座に停止してバッテリー消費ゼロに！）
   */
  function requestCameraUpdate() {
    if (isCameraActive) return;
    isCameraActive = true;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(cameraStep);
  }

  function cameraStep() {
    const dx = targetCamX - camX;
    const dy = targetCamY - camY;
    const dz = targetZoom - zoom;

    // 誤差が微小になったらスリープ停止
    if (Math.abs(dx) < 0.15 && Math.abs(dy) < 0.15 && Math.abs(dz) < 0.001) {
      camX = targetCamX;
      camY = targetCamY;
      zoom = targetZoom;
      isCameraActive = false;
      animFrameId = null;
      applyCameraTransform();
      return;
    }

    camX += dx * 0.30;
    camY += dy * 0.30;
    zoom += dz * 0.28;

    applyCameraTransform();
    animFrameId = requestAnimationFrame(cameraStep);
  }

  function initMap(svgElement, stationClickHandler) {
    svgEl = svgElement;
    onStationClickCallback = stationClickHandler;
    updateViewportCache();

    svgEl.innerHTML = `
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
    applyCameraTransform();

    window.addEventListener('resize', () => {
      updateViewportCache();
      requestCameraUpdate();
    });
  }

  /**
   * 地形と直交線路を描画（重いSVGフィルタは不使用で超高速描画）
   */
  function renderStaticBackgroundAndTracks() {
    if (!staticLayer) return;

    // 地形の下にシンプルな立体影（ベクターオフセット描画）
    const shadowSvg = JAPAN_LAND_PATHS.map(p => `
      <path d="${p.d}" fill="#01579b" opacity="0.32" transform="translate(0, 16)"/>
    `).join('');

    const landSvg = JAPAN_LAND_PATHS.map(p => `
      <path d="${p.d}" fill="${p.fill}" stroke="${p.stroke}" stroke-width="12" stroke-linejoin="round"/>
    `).join('');

    // 地方名プレート
    const regionBanners = [
      { label: '北海道エリア', kana: 'ほっかいどう', x: 3450, y: 60, color: '#2e7d32' },
      { label: '東北エリア', kana: 'とうほく', x: 3720, y: 1240, color: '#00838f' },
      { label: '関東エリア', kana: 'かんとう', x: 3720, y: 2015, color: '#1565c0' },
      { label: '中部・北陸エリア', kana: 'ちゅうぶ・ほくりく', x: 2300, y: 1400, color: '#283593' },
      { label: '近畿エリア', kana: 'きんき', x: 2070, y: 2630, color: '#6a1b9a' },
      { label: '中国・四国エリア', kana: 'ちゅうごく・しこく', x: 1150, y: 1850, color: '#ef6c00' },
      { label: '九州・沖縄エリア', kana: 'きゅうしゅう・おきなわ', x: 460, y: 2160, color: '#c62828' }
    ].map(b => `
      <g transform="translate(${b.x}, ${b.y})" opacity="0.92">
        <rect x="-95" y="-18" width="190" height="42" rx="18" fill="#1b2a32" opacity="0.4"/>
        <rect x="-95" y="-22" width="190" height="42" rx="18" fill="${b.color}" stroke="#fff" stroke-width="3"/>
        <text x="0" y="-8" font-size="9" font-weight="900" fill="#ffeb3b" text-anchor="middle">${b.kana}</text>
        <text x="0" y="11" font-size="15" font-weight="900" fill="#fff" text-anchor="middle">${b.label}</text>
      </g>
    `).join('');

    // 100%縦・横の線路描画
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
          linesSvg.push(`
            <line x1="${st.x}" y1="${st.y}" x2="${target.x}" y2="${target.y}"
                  stroke="#0277bd" stroke-width="18" stroke-linecap="round"/>
            <line x1="${st.x}" y1="${st.y}" x2="${target.x}" y2="${target.y}"
                  stroke="#e1f5fe" stroke-width="8" stroke-dasharray="14,12" stroke-linecap="round"/>
          `);
        } else {
          linesSvg.push(`
            <line x1="${st.x}" y1="${st.y}" x2="${target.x}" y2="${target.y}"
                  stroke="#263238" stroke-width="20" stroke-linecap="round"/>
            <line x1="${st.x}" y1="${st.y}" x2="${target.x}" y2="${target.y}"
                  stroke="#eceff1" stroke-width="12" stroke-linecap="round"/>
            <line x1="${st.x}" y1="${st.y}" x2="${target.x}" y2="${target.y}"
                  stroke="#37474f" stroke-width="9" stroke-dasharray="10,14" stroke-linecap="round"/>
          `);
        }
      });
    });

    staticLayer.innerHTML = `
      ${shadowSvg}
      ${landSvg}
      ${regionBanners}
      <g class="routes-layer">${linesSvg.join('')}</g>
    `;
  }

  // マルチタッチ・ピンチズーム対応
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
      return Math.max(0.32, baseZoom * 0.85);
    } else if (window.innerWidth <= 768) {
      return Math.max(0.32, baseZoom * 0.92);
    }
    return baseZoom;
  }

  function getCameraOffsetY() {
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return 15;
    // スマホでは、移動中は中央(10)、通常時（下部ドック表示時）はドックに駅が隠れないよう上寄り(36)
    return document.body.classList.contains('moving-phase') ? 10 : 36;
  }

  function setupPanAndZoom() {
    const viewport = document.getElementById('map-viewport');
    if (!viewport) return;

    viewport.addEventListener('pointerdown', e => {
      if (e.target.closest('.station-node-group') || e.target.closest('.map-dir-arrow')) return;
      activePointers.set(e.pointerId, e);
      try { viewport.setPointerCapture(e.pointerId); } catch (_) {}

      if (activePointers.size === 1) {
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
        const screenDx = e.clientX - dragStartX;
        const screenDy = e.clientY - dragStartY;
        // タップ時の微小な指のブレ（8px以内）ではカメラを動かさない
        if (!dragMoved && (Math.abs(screenDx) > 8 || Math.abs(screenDy) > 8)) {
          dragMoved = true;
        }
        if (dragMoved) {
          const dx = screenDx / zoom;
          const dy = screenDy / zoom;
          targetCamX = Math.max(200, Math.min(4100, camStartX - dx));
          targetCamY = Math.max(80, Math.min(3400, camStartY - dy));
          requestCameraUpdate();
        }
      } else if (activePointers.size === 2 && pinchInitialDist) {
        const [p1, p2] = Array.from(activePointers.values());
        const currentDist = getDistance(p1, p2);
        if (currentDist > 10 && pinchInitialDist > 10) {
          const scale = currentDist / pinchInitialDist;
          targetZoom = Math.max(0.30, Math.min(1.80, pinchInitialZoom * scale));
          requestCameraUpdate();
        }
      }
    });

    function handlePointerUpOrCancel(e) {
      activePointers.delete(e.pointerId);
      try { viewport.releasePointerCapture(e.pointerId); } catch (_) {}

      if (activePointers.size === 0) {
        // ドラッグ移動しなかったタップの場合は元の目標座標に戻す（ズレの累積を完全遮断）
        if (isDragging && !dragMoved) {
          targetCamX = camStartX;
          targetCamY = camStartY;
        }
        isDragging = false;
        pinchInitialDist = null;
      } else if (activePointers.size === 1) {
        const remaining = Array.from(activePointers.values())[0];
        isDragging = true;
        dragMoved = false;
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
      requestCameraUpdate();
    }, { passive: false });
  }

  function focusOnStation(stationId, newZoom = null, instant = false) {
    const st = KT.STATION_MAP.get(stationId);
    if (!st) return;
    updateViewportCache();
    targetCamX = st.x;
    targetCamY = st.y - getCameraOffsetY();
    if (newZoom !== null) {
      targetZoom = getResponsiveZoom(newZoom);
    }
    if (instant) {
      camX = targetCamX;
      camY = targetCamY;
      if (newZoom !== null) zoom = targetZoom;
      applyCameraTransform();
    } else {
      requestCameraUpdate();
    }
  }

  function adjustZoom(deltaFactor) {
    targetZoom = Math.max(0.30, Math.min(1.80, targetZoom * deltaFactor));
    requestCameraUpdate();
  }

  function setHighlightedBranches(stationIds = [], backStationId = null, remainingSteps = null) {
    highlightedBranchIds = new Set(stationIds);
    previousStationIdForBack = backStationId;
    currentRemainingSteps = remainingSteps;
  }

  /**
   * 駅間を滑らかに移動するアニメーション（60fps補間＋カメラ追従）
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

      const arrowsLayer = dynamicLayer.querySelector('.arrows-layer');
      if (arrowsLayer) arrowsLayer.style.opacity = '0.15';

      const actualDuration = Math.max(55, KT.dialogs && KT.dialogs.scaledTime ? KT.dialogs.scaledTime(durationMs) : durationMs);
      const startTime = performance.now();
      let done = false;

      const finishAnim = () => {
        if (done) return;
        done = true;
        clearTimeout(safetyTimer);
        markerEl.setAttribute('transform', `translate(${toSt.x}, ${toSt.y})`);
        targetCamX = toSt.x;
        targetCamY = toSt.y - getCameraOffsetY();
        requestCameraUpdate();
        resolve();
      };

      const safetyTimer = setTimeout(finishAnim, actualDuration + 100);

      function tick(now) {
        if (done) return;
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / actualDuration);
        const ease = 1 - Math.pow(1 - t, 2.2);
        const curX = fromSt.x + (toSt.x - fromSt.x) * ease;
        const curY = fromSt.y + (toSt.y - fromSt.y) * ease;
        const hopY = -Math.sin(t * Math.PI) * 16;

        markerEl.setAttribute('transform', `translate(${curX.toFixed(1)}, ${(curY + hopY).toFixed(1)})`);

        targetCamX = curX;
        targetCamY = curY - getCameraOffsetY();
        requestCameraUpdate();

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

    // 1. 目的地へのゴールド点線コンパス
    let compassLineSvg = '';
    if (curSt && goalSt && curSt.id !== goalSt.id) {
      compassLineSvg = `
        <line x1="${curSt.x}" y1="${curSt.y}" x2="${goalSt.x}" y2="${goalSt.y}"
              stroke="#ffd600" stroke-width="4.5" stroke-dasharray="14,12" opacity="0.65" pointer-events="none"/>
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
          <!-- 単純な影矩形（フィルター不使用） -->
          <rect x="${-w / 2}" y="${-h / 2 + 5}" width="${w}" height="${h}" rx="12" fill="#212121" opacity="0.32"/>
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

        const maxTxtLen = Math.max(st.name.length, (st.kana || '').length);
        const badgeW = Math.max(76, maxTxtLen * 13 + 14);
        const hasKana = !!st.kana && st.kana !== st.name;
        const badgeH = hasKana ? 28 : 18;

        tileSvg = `
          <circle cx="0" cy="4" r="22" fill="#212121" opacity="0.28"/>
          <circle cx="0" cy="0" r="22" fill="${cfg.fill}" stroke="${ringStroke}" stroke-width="${ringW}"/>
          <ellipse cx="-6" cy="-8" rx="8" ry="4" fill="rgba(255,255,255,0.35)" transform="rotate(-25 -6 -8)"/>
          <text x="0" y="7" font-size="19" font-weight="900" fill="${cfg.textCol}" text-anchor="middle">${cfg.text}</text>
          <rect x="${-badgeW / 2}" y="24" width="${badgeW}" height="${badgeH}" rx="8" fill="rgba(38,50,56,0.92)"/>
          ${hasKana ? `<text x="0" y="34.5" font-size="8.5" font-weight="900" fill="#ffd54f" text-anchor="middle">${st.kana}</text>` : ''}
          <text x="0" y="${hasKana ? 48 : 37}" font-size="10.5" font-weight="800" fill="#fff" text-anchor="middle">${st.name}</text>
        `;
      }

      // 目的地フラッグ
      const goalBanner = isGoal ? `
        <circle cx="0" cy="0" r="46" fill="none" stroke="#ff1744" stroke-width="5" class="goal-pulse-ring"/>
        <g transform="translate(0, 44)">
          <rect x="-66" y="2" width="132" height="26" rx="13" fill="#212121" opacity="0.3"/>
          <rect x="-66" y="0" width="132" height="26" rx="13" fill="#d50000" stroke="#ffeb3b" stroke-width="3"/>
          <text x="0" y="18" font-size="13.5" font-weight="900" fill="#ffeb3b" text-anchor="middle">🏁 もくてきち！</text>
        </g>
      ` : '';

      // 進める駅の光るバッジ＆案内
      let branchBadge = '';
      if (isBranchChoice) {
        branchBadge = `
          <!-- 進める駅の光るガイドサークル -->
          <circle cx="0" cy="0" r="48" fill="rgba(0, 230, 118, 0.22)" stroke="${isBackChoice ? '#78909c' : '#00e676'}" stroke-width="4.5" stroke-dasharray="8,6" class="branch-pulse-ring"/>
          <g transform="translate(0, -44)">
            <rect x="-56" y="-20" width="112" height="26" rx="13" fill="#212121" opacity="0.35"/>
            <rect x="-56" y="-22" width="112" height="26" rx="13"
                  fill="${isBackChoice ? '#546e7a' : '#00c853'}" stroke="#ffffff" stroke-width="3"/>
            <text x="0" y="-4" font-size="12.5" font-weight="900" fill="#fff" text-anchor="middle">
              ${isBackChoice ? '↩️ もどる' : `あと ${dist} マス`}
            </text>
          </g>
        `;
      }

      // 残り0マスで現在地駅に到着した時の「⭕ ここに止まる！」タップ用ビッグボタン
      let stopButtonSvg = '';
      if (isCurrentHere && currentRemainingSteps === 0) {
        stopButtonSvg = `
          <g transform="translate(0, -82)" class="stop-confirm-badge" style="cursor:pointer;">
            <circle cx="0" cy="0" r="32" fill="#d50000" stroke="#ffeb3b" stroke-width="4"/>
            <text x="0" y="-8" font-size="18" font-weight="900" fill="#fff" text-anchor="middle">⭕</text>
            <text x="0" y="8" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">と</text>
            <text x="0" y="19" font-size="11.5" font-weight="900" fill="#ffeb3b" text-anchor="middle">止まる</text>
          </g>
        `;
      }

      return `
        <g class="station-node-group ${isBranchChoice ? 'can-move-target' : ''}" data-station-id="${st.id}" transform="translate(${st.x}, ${st.y})" style="cursor:pointer;">
          <!-- スマホでタップしやすい広域タッチ判定エリア（半径52px） -->
          <circle cx="0" cy="0" r="54" fill="transparent" pointer-events="all"/>
          ${tileSvg}
          ${goalBanner}
          ${branchBadge}
          ${stopButtonSvg}
        </g>
      `;
    }).join('');

    // 3. 移動中：現在地の上下左右に出る「光る方向矢印ボタン（⬆️⬇️⬅️➡️）」
    let arrowsSvg = '';
    if (curSt && highlightedBranchIds.size > 0 && currentRemainingSteps > 0) {
      let bestDist = 9999;
      highlightedBranchIds.forEach(id => {
        if (id === previousStationIdForBack) return;
        const d = distMap.has(id) ? distMap.get(id) : 999;
        if (d < bestDist) bestDist = d;
      });

      const neighbors = KT.getDirectionalNeighbors ? KT.getDirectionalNeighbors(curSt.id) : {};
      const dirConfigs = [
        { dir: 'up',    id: neighbors.up,    ox: 0,    oy: -95, rot: -90, keyLabel: '↑', textLabel: '北' },
        { dir: 'down',  id: neighbors.down,  ox: 0,    oy: 85,  rot: 90,  keyLabel: '↓', textLabel: '南' },
        { dir: 'left',  id: neighbors.left,  ox: -112, oy: 0,   rot: 180, keyLabel: '←', textLabel: '西' },
        { dir: 'right', id: neighbors.right, ox: 112,  oy: 0,   rot: 0,   keyLabel: '→', textLabel: '東' }
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
            <!-- 広域タッチ判定エリア -->
            <circle cx="0" cy="0" r="42" fill="transparent" pointer-events="all"/>
            <g transform="rotate(${cfg.rot})">
              <polygon points="34,0 -20,-26 -9,0 -20,26" fill="${fillCol}" stroke="${strokeCol}" stroke-width="4.5"/>
            </g>
            <circle cx="0" cy="0" r="15" fill="#263238" stroke="#fff" stroke-width="2.5"/>
            <text x="0" y="5.5" font-size="14.5" font-weight="900" fill="#fff" text-anchor="middle">${cfg.keyLabel}</text>
          </g>
        `;
      }).join('');
    }

    // 4. プレイヤーコマの描画
    const renderOrder = state.players
      .map((p, idx) => ({ p, idx }))
      .sort((a, b) => (a.idx === state.currentPlayerIndex ? 1 : b.idx === state.currentPlayerIndex ? -1 : a.idx - b.idx));

    const playersSvg = renderOrder.map(({ p, idx }) => {
      const st = KT.STATION_MAP.get(p.stationId);
      if (!st) return '';
      const isCurrent = idx === state.currentPlayerIndex;
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

    // スマホ・PC双方で最も反応が良く誤爆しない高精度タップイベントバインド
    function bindNodeTap(element, handler) {
      let startX = 0;
      let startY = 0;
      let startTime = 0;

      element.addEventListener('pointerdown', e => {
        startX = e.clientX;
        startY = e.clientY;
        startTime = performance.now();
      });

      element.addEventListener('pointerup', e => {
        const dx = Math.abs(e.clientX - startX);
        const dy = Math.abs(e.clientY - startY);
        const dt = performance.now() - startTime;
        // 指の微小なズレ（14px以内）かつ短時間タップなら確実に発火
        if (dx < 16 && dy < 16 && dt < 650) {
          e.stopPropagation();
          handler();
        }
      });
    }

    dynamicLayer.querySelectorAll('.station-node-group').forEach(node => {
      const stId = node.getAttribute('data-station-id');
      bindNodeTap(node, () => {
        if (onStationClickCallback) onStationClickCallback(stId);
      });
    });

    dynamicLayer.querySelectorAll('.map-dir-arrow').forEach(arrow => {
      const targetId = arrow.getAttribute('data-target-id');
      bindNodeTap(arrow, () => {
        if (onStationClickCallback) onStationClickCallback(targetId);
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
