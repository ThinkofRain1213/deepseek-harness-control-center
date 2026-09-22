function WalletChip(props) {
  props = props || {}
  // `t` arrives through the renderer's locale seat when the slot registration
  // declared `locale:`; the dictionary fallback keeps older hosts working.
  var t = typeof props.t === 'function' ? props.t : walletT
  var sessionId = props.sessionId
  var modelAware = props.modelAware === true
  var dataRef = React.useRef(null)
  var notifiedRef = React.useRef(false)
  var lowNoticeRef = React.useRef(null)
  var chipAnchorRef = React.useRef(null)
  var chipRef = React.useRef(null)
  var chipButtonRef = React.useRef(null)
  var panelRef = React.useRef(null)
  var panelDragRef = React.useRef(null)
  var confirmRef = React.useRef(null)
  var cancelButtonRef = React.useRef(null)
  var confirmButtonRef = React.useRef(null)
  var restoreFocusRef = React.useRef(null)
  var thresholdInitializedRef = React.useRef(false)
  var thresholdEditTimerRef = React.useRef(null)
  var [data, setData] = React.useState(null)
  var modelSelection = useModelSelectionStore(props.modelDirectory, modelAware)
  var [open, setOpen] = React.useState(false)
  // The composer label always follows the active model. The details panel
  // can temporarily inspect either account system without changing that
  // model selection.
  var [panelProviderView, setPanelProviderView] = React.useState(null)
  var [panelStyle, setPanelStyle] = React.useState({ visibility: 'hidden' })
  var [panelPos, setPanelPos] = React.useState(function () {
    try {
      var raw = compatibility.storage.getItem(PANEL_POS_KEY)
      if (raw === null) return null
      var parts = raw.split(',')
      var x = Number.parseFloat(parts[0]); var y = Number.parseFloat(parts[1])
      return Number.isFinite(x) && Number.isFinite(y) ? { x: x, y: y } : null
    } catch (e) { return null }
  })
  var panelPosRef = React.useRef(panelPos)
  var [thresholdDraft, setThresholdDraft] = React.useState(null)
  var [confirming, setConfirming] = React.useState(false)
  var [accounts, setAccounts] = React.useState(null)
  var [accountsError, setAccountsError] = React.useState(null)
  var [accountNotice, setAccountNotice] = React.useState(null)
  var [addName, setAddName] = React.useState('')
  var [addKey, setAddKey] = React.useState('')
  var [adding, setAdding] = React.useState(false)
  var [switchingId, setSwitchingId] = React.useState(null)
  var [floated, setFloated] = React.useState(function () {
    try { return compatibility.storage.getItem('dshw-float-mode') === 'float' || compatibility.storage.getItem('dshw-float-mode') === 'dot' } catch (e) { return false }
  })
  var [minimized, setMinimized] = React.useState(function () {
    try { return compatibility.storage.getItem('dshw-float-mode') === 'dot' } catch (e) { return false }
  })
  var [floatPos, setFloatPos] = React.useState(null)
  var floatPosRef = React.useRef(null)
  var floatRef = React.useRef(null)
  var dragRef = React.useRef(null)
  var didDragRef = React.useRef(false)
  var [chipLayout, setChipLayout] = React.useState(function () {
    try {
      var saved = compatibility.storage.getItem(CHIP_LAYOUT_KEY)
      return saved === null ? normalizeChipLayout(null) : normalizeChipLayout(JSON.parse(saved))
    } catch (e) { return normalizeChipLayout(null) }
  })
  var [chipScale, setChipScale] = React.useState(function () {
    try { return normalizeChipScale(compatibility.storage.getItem(CHIP_SCALE_KEY)) } catch (e) { return 1 }
  })
  var [chipAppearance, setChipAppearance] = React.useState(function () {
    try { return normalizeChipStyle(compatibility.storage.getItem(CHIP_STYLE_KEY)) } catch (e) { return 'standard' }
  })
  var [balanceOnly, setBalanceOnly] = React.useState(readBalanceOnly)
  var [homeMode, setHomeMode] = React.useState('full')
        var chipLiftHostRef = React.useRef(null)
  var [dataVisibility, setDataVisibility] = React.useState(function () {
    try {
      var savedVisibility = compatibility.storage.getItem(DATA_VISIBILITY_KEY)
      return normalizeDataVisibility(savedVisibility === null ? null : JSON.parse(savedVisibility))
    } catch (e) { return normalizeDataVisibility(null) }
  })
  var [notifyConfig, setNotifyConfig] = React.useState(readNotifyConfig)
  React.useEffect(function () {
    function refreshVisibilityAndScale() {
      try {
        var savedVisibility = compatibility.storage.getItem(DATA_VISIBILITY_KEY)
        setDataVisibility(savedVisibility === null ? normalizeDataVisibility(null) : normalizeDataVisibility(JSON.parse(savedVisibility)))
      } catch (e) { /* ignore */ }
      try { setChipScale(normalizeChipScale(compatibility.storage.getItem(CHIP_SCALE_KEY))) } catch (e) { /* ignore */ }
      try { setChipAppearance(normalizeChipStyle(compatibility.storage.getItem(CHIP_STYLE_KEY))) } catch (e) { /* ignore */ }
      try { setBalanceOnly(readBalanceOnly()) } catch (e) { /* ignore */ }
    }
    window.addEventListener(SETTINGS_EVENT, refreshVisibilityAndScale)
    return function () { window.removeEventListener(SETTINGS_EVENT, refreshVisibilityAndScale) }
  }, [])

  React.useEffect(function () {
    function refreshNotifyConfig() { setNotifyConfig(readNotifyConfig()) }
    window.addEventListener(NOTIFY_CONFIG_EVENT, refreshNotifyConfig)
    window.addEventListener('storage', refreshNotifyConfig)
    return function () {
      window.removeEventListener(NOTIFY_CONFIG_EVENT, refreshNotifyConfig)
      window.removeEventListener('storage', refreshNotifyConfig)
    }
  }, [])
  var [permanentDeleteEnabled, setPermanentDeleteEnabled] = React.useState(function () {
    try { return compatibility.storage.getItem(PERMANENT_DELETE_KEY) === 'true' } catch (e) { return false }
  })
  var [permanentDeleteSupported, setPermanentDeleteSupported] = React.useState(function () {
    return compatibility.hasCapability('permanentDelete')
  })
  React.useEffect(function () {
    function refreshHostCapabilities() { setPermanentDeleteSupported(compatibility.hasCapability('permanentDelete')) }
    window.addEventListener(HOST_CAPABILITY_EVENT, refreshHostCapabilities)
    refreshHostCapabilities()
    return function () { window.removeEventListener(HOST_CAPABILITY_EVENT, refreshHostCapabilities) }
  }, [])
  React.useEffect(function () {
    if (chipAppearance !== 'hidden' || floated) return
    setOpen(false)
    setConfirming(false)
  }, [chipAppearance, floated])

  React.useEffect(function () {
    var pw = data && data.pricingWindows
    if (!pw || !pw.windows) return
    var checkNotify = function () {
      try {
        if (compatibility.storage.getItem(PEAK_NOTIFY_KEY) !== 'true') return
      } catch (e) { return }
      var now = Date.now()
      var tz = pw.timezone || 'Asia/Shanghai'
      var offMin = typeof pw.offsetMinutes === 'number' ? pw.offsetMinutes : 480
      var st = peakClockState(pw, wallHourIn(tz, offMin, new Date(now)), now, t)
      if (!st.periodId) return
      var last = null
      try { last = compatibility.storage.getItem(PEAK_NOTIFY_LAST_KEY) } catch (e) { /* ignore */ }
      if (last === st.periodId) return
      try { compatibility.storage.setItem(PEAK_NOTIFY_LAST_KEY, st.periodId) } catch (e) { /* ignore */ }
      if (last === null) return
      try {
        compatibility.notify(t('panel.peakSwitchTitle'), {
          body: st.switchBody, tag: 'dsh-wallet-peak'
        })
      } catch (e) { /* ignore */ }
    }
    checkNotify()
    var timer = setInterval(checkNotify, 60000)
    return function () { clearInterval(timer) }
  }, [data])
  var showOfficial = dataVisibility.official
  var showThird = dataVisibility.third
  var activeProviderMode = providerModeFor(modelSelection, data || {}, modelAware)
  var showDeepSeek = (showOfficial || balanceOnly) && activeProviderMode.kind === 'deepseek'
  var panelProviderMode = panelProviderView === 'deepseek'
    ? { kind: 'deepseek', provider: 'deepseek-official', model: null }
    : panelProviderView === 'zai'
      ? { kind: 'zai', provider: preferredPlanProvider(data || {}, activeProviderMode), model: null }
      : activeProviderMode
  var panelShowDeepSeek = showOfficial && panelProviderMode.kind === 'deepseek'
  var panelShowZai = panelProviderMode.kind === 'zai'
  React.useEffect(function () {
    setPanelProviderView(null)
  }, [activeProviderMode.provider, activeProviderMode.model])
  var chipScaleRef = React.useRef(chipScale)
  var chipSizeRef = React.useRef({ horizontal: null, vertical: null })
  var [snapPreview, setSnapPreview] = React.useState(null)
  var chipLayoutRef = React.useRef(chipLayout)
  var chipDragRef = React.useRef(null)
  var chipDidDragRef = React.useRef(false)
  var bottomDockHostRef = React.useRef(null)
  chipLayoutRef.current = chipLayout
  chipScaleRef.current = chipScale
  panelPosRef.current = panelPos

  function applyChipLayout(next) {
    next = normalizeChipLayout(next)
    chipLayoutRef.current = next
    setChipLayout(next)
    try { compatibility.storage.setItem(CHIP_LAYOUT_KEY, JSON.stringify(next)) } catch (e) { /* ignore */ }
  }

  function savePanelPosition(next) {
    panelPosRef.current = next
    setPanelPos(next)
    try { compatibility.storage.setItem(PANEL_POS_KEY, next.x + ',' + next.y) } catch (e) { /* ignore */ }
  }

  function saveChipScale(next) {
    next = normalizeChipScale(next)
    var cap = chipLayoutRef.current.dock === 'home' ? 1.05 : 1.25
    if (next > cap) next = cap
    chipScaleRef.current = next
    setChipScale(next)
    try { compatibility.storage.setItem(CHIP_SCALE_KEY, String(next)) } catch (e) { /* ignore */ }
  }

  function saveDataVisibility(next) {
    next = normalizeDataVisibility(next)
    setDataVisibility(next)
    try { compatibility.storage.setItem(DATA_VISIBILITY_KEY, JSON.stringify(next)) } catch (e) { /* ignore */ }
  }

  function saveNotifyConfig(next) {
    next = normalizeNotifyConfig(next)
    setNotifyConfig(next)
    try { compatibility.storage.setItem(NOTIFY_CONFIG_KEY, JSON.stringify(next)) } catch (e) { /* ignore */ }
    compatibility.dispatch(NOTIFY_CONFIG_EVENT)
  }

  React.useEffect(function () {
    var alive = true
    function tick() {
      var url = '/api/wallet/snapshot'
      if (sessionId) url = url + '?session=' + encodeURIComponent(sessionId)
      fetch(url).then(function (resp) {
        if (!resp.ok) throw new Error(String(resp.status))
        return resp.json()
      }).then(function (json) {
        if (!alive) return
        dataRef.current = json
        setData(json)
        try {
          if (typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
            window.dispatchEvent(new CustomEvent('dshw-snapshot-update', { detail: json }))
          }
        } catch (e) { /* ignore */ }
        if (json.threshold !== undefined && json.threshold !== null) {
          // Follow the active currency's own threshold line: switching
          // accounts (and thus currency) refreshes the draft unless the
          // user is mid-edit (the 600ms auto-save owns that window).
          setThresholdDraft(function (prev) {
            if (thresholdInitializedRef.current === 'editing') return prev
            return json.threshold.toFixed(2)
          })
        }
        if (showDeepSeek && json.lowBalance) {
          if (!notifiedRef.current) {
            try {
              var lowCurrency = json.balance && json.balance.currency ? json.balance.currency : 'CNY'
              var lowNotice = compatibility.notify(t('chip.deepSeekLowBalance'), { body: t('chip.balanceBelowThreshold') + fmtCurrency(json.threshold, lowCurrency), tag: 'dsh-wallet-low' })
              if (lowNotice) {
                lowNoticeRef.current = lowNotice
                notifiedRef.current = true
              }
            } catch (e) { /* ignore */ }
          }
        } else {
          if (lowNoticeRef.current && typeof lowNoticeRef.current.close === 'function') {
            try { lowNoticeRef.current.close() } catch (e) { /* ignore */ }
          }
          lowNoticeRef.current = null
          notifiedRef.current = false
        }
      }).catch(function () {
        if (alive) setData({ ok: false })
      })
    }
    tick()
    var timer = setInterval(tick, POLL_MS)
    return function () {
      alive = false
      clearInterval(timer)
      if (lowNoticeRef.current && typeof lowNoticeRef.current.close === 'function') {
        try { lowNoticeRef.current.close() } catch (e) { /* ignore */ }
      }
      lowNoticeRef.current = null
    }
  }, [sessionId, showDeepSeek])
  React.useEffect(function () {
    loadAccounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  React.useEffect(function () {
    function onMove(event) {
      var chipDrag = chipDragRef.current
      if (chipDrag !== null && event.pointerId === chipDrag.pointerId) {
        var moved = Math.abs(event.clientX - chipDrag.startX) > 3 || Math.abs(event.clientY - chipDrag.startY) > 3
        if (moved) {
          if (!chipDrag.dragged && chipDrag.node && chipDrag.node.setPointerCapture) {
            try { chipDrag.node.setPointerCapture(chipDrag.pointerId) } catch (e) { /* ignore */ }
          }
          chipDrag.dragged = true
          chipDidDragRef.current = true
          setOpen(false)
          var liveRect = chipDrag.node.getBoundingClientRect()
          var liveWidth = liveRect.width || chipDrag.w
          var liveHeight = liveRect.height || chipDrag.h
          var liveSize = { width: liveWidth, height: liveHeight, scale: chipScaleRef.current }
          if (chipDrag.node.classList && chipDrag.node.classList.contains('dshw_chipVertical')) chipSizeRef.current.vertical = liveSize
          else chipSizeRef.current.horizontal = liveSize
          var chipX = Math.max(CHIP_EDGE_MARGIN, Math.min(window.innerWidth - liveWidth - CHIP_EDGE_MARGIN, event.clientX - liveWidth * chipDrag.grabXRatio))
          var chipY = Math.max(CHIP_EDGE_MARGIN, Math.min(window.innerHeight - liveHeight - CHIP_EDGE_MARGIN, event.clientY - liveHeight * chipDrag.grabYRatio))
          chipDrag.x = chipX
          chipDrag.y = chipY
          var movingLayout = { dock: 'free', x: chipX, y: chipY }
          chipLayoutRef.current = movingLayout
          setChipLayout(movingLayout)
          var homeRect = findComposerRect(chipAnchorRef.current, window.innerWidth, window.innerHeight)
          var contentHost = findBottomDockHost(chipAnchorRef.current, window.innerWidth, window.innerHeight)
          var contentRect = contentHost && typeof contentHost.getBoundingClientRect === 'function' ? contentHost.getBoundingClientRect() : null
          var pointer = { x: event.clientX, y: event.clientY }
          var previewDock = chooseChipDock(movingLayout, liveWidth, liveHeight, window.innerWidth, window.innerHeight, homeRect, pointer, contentRect)
          var anchorRect = chipAnchorRef.current && typeof chipAnchorRef.current.getBoundingClientRect === 'function' ? chipAnchorRef.current.getBoundingClientRect() : null
          var scale = chipScaleRef.current
          var savedHorizontal = chipSizeRef.current.horizontal
          var savedVertical = chipSizeRef.current.vertical
          var horizontalFactor = savedHorizontal && savedHorizontal.scale ? scale / savedHorizontal.scale : 1
          var verticalFactor = savedVertical && savedVertical.scale ? scale / savedVertical.scale : 1
          var previewSizes = {
            horizontal: savedHorizontal ? { width: savedHorizontal.width * horizontalFactor, height: savedHorizontal.height * horizontalFactor } : { width: Math.min(320 * scale, window.innerWidth - CHIP_EDGE_MARGIN * 2), height: 22 * scale },
            vertical: savedVertical ? { width: savedVertical.width * verticalFactor, height: savedVertical.height * verticalFactor } : { width: 40 * scale, height: 127 * scale }
          }
          setSnapPreview(computeSnapPreview(previewDock, movingLayout, window.innerWidth, window.innerHeight, homeRect, contentRect, anchorRect, previewSizes))
          if (event.preventDefault) event.preventDefault()
        }
        return
      }
      var panelDrag = panelDragRef.current
      if (panelDrag !== null && event.pointerId === panelDrag.pointerId) {
        var panelMoved = Math.abs(event.clientX - panelDrag.startX) > 3 || Math.abs(event.clientY - panelDrag.startY) > 3
        if (panelMoved) {
          panelDrag.dragged = true
          var panelFitted = clampPosition({
            x: event.clientX - panelDrag.dx,
            y: event.clientY - panelDrag.dy
          }, panelDrag.w, panelDrag.h, window.innerWidth, window.innerHeight)
          panelDrag.x = panelFitted.x
          panelDrag.y = panelFitted.y
          panelPosRef.current = panelFitted
          setPanelStyle({ left: panelFitted.x, top: panelFitted.y, visibility: 'visible' })
          if (event.preventDefault) event.preventDefault()
        }
        return
      }
      var d = dragRef.current
      if (d === null || event.pointerId !== d.pointerId) return
      var x = Math.max(4, Math.min(window.innerWidth - d.w - 4, event.clientX - d.dx))
      var y = Math.max(4, Math.min(window.innerHeight - d.h - 4, event.clientY - d.dy))
      if (Math.abs(event.clientX - d.startX) > 3 || Math.abs(event.clientY - d.startY) > 3) didDragRef.current = true
      d.x = x
      d.y = y
      floatPosRef.current = { x: x, y: y }
      setFloatPos(floatPosRef.current)
    }
    function onUp(event) {
      var chipDrag = chipDragRef.current
      if (chipDrag !== null && event.pointerId === chipDrag.pointerId) {
        chipDragRef.current = null
        setSnapPreview(null)
        if (chipDrag.dragged) {
          var releaseRect = chipDrag.node.getBoundingClientRect()
          var releasePos = {
            x: Number.isFinite(chipDrag.x) ? chipDrag.x : releaseRect.left,
            y: Number.isFinite(chipDrag.y) ? chipDrag.y : releaseRect.top
          }
          var homeRect = findComposerRect(chipAnchorRef.current, window.innerWidth, window.innerHeight)
          var contentHost = findBottomDockHost(chipAnchorRef.current, window.innerWidth, window.innerHeight)
          var contentRect = contentHost && typeof contentHost.getBoundingClientRect === 'function' ? contentHost.getBoundingClientRect() : null
          var pointer = { x: event.clientX, y: event.clientY }
          var dock = chooseChipDock(releasePos, releaseRect.width, releaseRect.height, window.innerWidth, window.innerHeight, homeRect, pointer, contentRect)
          if (dock === 'free') releasePos = clampFreeDrop(releasePos, releaseRect.width, releaseRect.height, window.innerWidth, window.innerHeight, pointer, contentRect)
          applyChipLayout({ dock: dock, x: releasePos.x, y: releasePos.y })
          setTimeout(function () { chipDidDragRef.current = false }, 0)
        } else {
          chipDidDragRef.current = false
        }
        if (chipDrag.node && chipDrag.node.releasePointerCapture) {
          try { chipDrag.node.releasePointerCapture(chipDrag.pointerId) } catch (e) { /* ignore */ }
        }
        return
      }
      var panelDrag = panelDragRef.current
      if (panelDrag !== null && event.pointerId === panelDrag.pointerId) {
        panelDragRef.current = null
        if (panelDrag.dragged) savePanelPosition({ x: panelDrag.x, y: panelDrag.y })
        if (panelDrag.node && panelDrag.node.releasePointerCapture) {
          try { panelDrag.node.releasePointerCapture(panelDrag.pointerId) } catch (e) { /* ignore */ }
        }
        return
      }
      var d = dragRef.current
      if (d === null || event.pointerId !== d.pointerId) return
      dragRef.current = null
      if (d.dot && didDragRef.current === true) {
        var settled = settleDotPosition(d, d.w, d.h, window.innerWidth, window.innerHeight)
        d.x = settled.x
        d.y = settled.y
        floatPosRef.current = { x: d.x, y: d.y }
        setFloatPos(floatPosRef.current)
      }
      try { compatibility.storage.setItem('dshw-float-pos', d.x + ',' + d.y) } catch (e) { /* ignore */ }
      if (d.node && d.node.releasePointerCapture) {
        try { d.node.releasePointerCapture(d.pointerId) } catch (e) { /* ignore */ }
      }
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
    document.addEventListener('pointercancel', onUp)
    return function () {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointercancel', onUp)
    }
  }, [])

  React.useEffect(function () {
    if (!open) return
    function onDocDown(event) {
      var t = event.target
      if (chipRef.current && chipRef.current.contains(t)) return
      if (panelRef.current && panelRef.current.contains(t)) return
      if (confirmRef.current && confirmRef.current.contains(t)) return
      setOpen(false)
    }
    function onKeyDown(event) {
      if (event.key === 'Escape' && !confirming) {
        setOpen(false)
        if (chipButtonRef.current) chipButtonRef.current.focus()
      }
    }
    document.addEventListener('pointerdown', onDocDown)
    document.addEventListener('keydown', onKeyDown)
    return function () {
      document.removeEventListener('pointerdown', onDocDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, confirming])

  useLayoutEffect(function () {
    if (!open || floated) return
    var chipNode = chipRef.current
    var panelNode = panelRef.current
    if (chipNode === null || panelNode === null) return
    function placePanel() {
      var chipRect = chipNode.getBoundingClientRect()
      var panelRect = panelNode.getBoundingClientRect()
      var saved = panelPosRef.current
      if (saved) {
        var fitted = clampPosition(saved, panelRect.width, panelRect.height, window.innerWidth, window.innerHeight)
        if (fitted.x !== saved.x || fitted.y !== saved.y) savePanelPosition(fitted)
        setPanelStyle({ left: fitted.x, top: fitted.y, visibility: 'visible' })
      } else {
        setPanelStyle(computePanelPosition(chipRect, panelRect, window.innerWidth, window.innerHeight))
      }
    }
    placePanel()
    window.addEventListener('resize', placePanel)
    window.addEventListener('scroll', placePanel, true)
    return function () {
      window.removeEventListener('resize', placePanel)
      window.removeEventListener('scroll', placePanel, true)
    }
  }, [open, floated, data, chipScale, showOfficial, showThird])

  React.useEffect(function () {
    if (!confirming) return
    restoreFocusRef.current = document.activeElement
    if (confirmButtonRef.current) confirmButtonRef.current.focus()
    function onKeyDown(event) {
      if (event.key === 'Escape') setConfirming(false)
      if (event.key === 'Tab' && cancelButtonRef.current && confirmButtonRef.current) {
        if (event.shiftKey && document.activeElement === cancelButtonRef.current) {
          event.preventDefault()
          confirmButtonRef.current.focus()
        } else if (!event.shiftKey && document.activeElement === confirmButtonRef.current) {
          event.preventDefault()
          cancelButtonRef.current.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return function () {
      document.removeEventListener('keydown', onKeyDown)
      var previous = restoreFocusRef.current
      if (previous && typeof previous.focus === 'function') previous.focus()
    }
  }, [confirming])

  function clampPos(pos, width, height) {
    return clampPosition(pos, width, height, window.innerWidth, window.innerHeight)
  }

  function readSavedPos(width, height) {
    try {
      var raw = compatibility.storage.getItem('dshw-float-pos')
      if (raw === null) return null
      var parts = raw.split(',')
      var x = Number.parseFloat(parts[0]); var y = Number.parseFloat(parts[1])
      if (Number.isFinite(x) && Number.isFinite(y)) {
        return clampPos({ x: x, y: y }, width, height)
      }
    } catch (e) { /* ignore */ }
    return null
  }

  function onFloatDown(event) {
    if (event.pointerType !== 'touch' && event.button !== 0) return
    var target = event.target
    var node = floatRef.current
    if (node === null) return
    if (target !== node && target && target.closest && target.closest('button,input,a')) return
    var rect = node.getBoundingClientRect()
    dragRef.current = {
      pointerId: event.pointerId,
      dx: event.clientX - rect.left,
      dy: event.clientY - rect.top,
      startX: event.clientX,
      startY: event.clientY,
      x: rect.left,
      y: rect.top,
      w: rect.width,
      h: rect.height,
      grabXRatio: rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0.5,
      grabYRatio: rect.height > 0 ? (event.clientY - rect.top) / rect.height : 0.5,
      node: node,
      dot: minimized
    }
    didDragRef.current = false
    if (node.setPointerCapture) {
      try { node.setPointerCapture(event.pointerId) } catch (e) { /* ignore */ }
    }
    event.preventDefault()
  }

  function onChipDown(event) {
    if (event.pointerType !== 'touch' && event.button !== 0) return
    var node = chipRef.current
    if (node === null) return
    var rect = node.getBoundingClientRect()
    var startSize = { width: rect.width, height: rect.height, scale: chipScaleRef.current }
    if (node.classList && node.classList.contains('dshw_chipVertical')) chipSizeRef.current.vertical = startSize
    else chipSizeRef.current.horizontal = startSize
    chipDragRef.current = {
      pointerId: event.pointerId,
      dx: event.clientX - rect.left,
      dy: event.clientY - rect.top,
      startX: event.clientX,
      startY: event.clientY,
      x: rect.left,
      y: rect.top,
      w: rect.width,
      h: rect.height,
      grabXRatio: rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0.5,
      grabYRatio: rect.height > 0 ? (event.clientY - rect.top) / rect.height : 0.5,
      node: node,
      dragged: false
    }
    chipDidDragRef.current = false
  }

  function onPanelDown(event) {
    if (event.pointerType !== 'touch' && event.button !== 0) return
    var target = event.target
    var node = panelRef.current
    if (node === null) return
    if (target && target.closest && target.closest('button,input,a')) return
    var rect = node.getBoundingClientRect()
    panelDragRef.current = {
      pointerId: event.pointerId,
      dx: event.clientX - rect.left,
      dy: event.clientY - rect.top,
      startX: event.clientX,
      startY: event.clientY,
      x: rect.left,
      y: rect.top,
      w: rect.width,
      h: rect.height,
      node: node,
      dragged: false
    }
    if (node.setPointerCapture) {
      try { node.setPointerCapture(event.pointerId) } catch (e) { /* ignore */ }
    }
    if (event.preventDefault) event.preventDefault()
  }

  // A docked chip is position:fixed, but it still renders inside the host
  // composer subtree; hosts commonly wrap that subtree in a low stacking
  // context (dsh uses z-index:1), which caps the chip under neighbouring
  // top-level panels. The node must stay in place so React's delegated
  // events keep working, so instead lift the outermost trapping ancestor
  // context while any dock mode is active.
  useLayoutEffect(function () {
    if (chipLayout.dock === 'home') return
    var node = chipAnchorRef.current
    if (node === null || typeof window === 'undefined' || !window.getComputedStyle) return
    var outermost = null
    while (node && node !== document.body) {
      if (isStackingContext(window.getComputedStyle(node))) outermost = node
      node = node.parentElement
    }
    chipLiftHostRef.current = outermost
    if (outermost && outermost.classList) outermost.classList.add('dshw_chipLift')
    return function () {
      if (outermost && outermost.classList) outermost.classList.remove('dshw_chipLift')
      if (chipLiftHostRef.current === outermost) chipLiftHostRef.current = null
    }
  }, [chipLayout.dock])

  // A stored 125% from a floating/side dock must come back down when the
  // chip returns to the space-constrained home row.
  React.useEffect(function () {
    if (chipLayout.dock === 'home' && chipScaleRef.current > 1.05) saveChipScale(1.05)
  }, [chipLayout.dock])

  useLayoutEffect(function () {
    var node = chipRef.current
    if (node === null) return
    var rect = node.getBoundingClientRect()
    var measured = { width: rect.width, height: rect.height, scale: chipScaleRef.current }
    if (node.classList && node.classList.contains('dshw_chipVertical')) chipSizeRef.current.vertical = measured
    else chipSizeRef.current.horizontal = measured
  }, [chipLayout.dock, chipScale, data, showOfficial, showThird, homeMode])

  useLayoutEffect(function () {
    if (chipLayout.dock !== 'home') return
    var anchor = chipAnchorRef.current
    var chip = chipRef.current
    if (!anchor || !chip) return

    function measureHomeMode() {
      var current = chipAnchorRef.current
      var chipNode = chipRef.current
      if (!current || !chipNode) return null
      // Try each tier in place and let the composer row's own flex pressure
      // accept or squeeze it: a tier fits when the chip's allocated width
      // matches its content width. All readings come from the chip itself
      // so the scale slider's zoom factor cancels out; the anchor's
      // parent slot wrapper can be display:contents, so measuring
      // ancestors is not reliable.
      var compact = current.classList.contains('dshw_compact')
      current.classList.remove('dshw_compact')
      current.classList.remove('dshw_fit')
      var mode
      if (chipNode.clientWidth >= chipNode.scrollWidth - 1) {
        mode = 'full'
      } else {
        current.classList.add('dshw_fit')
        mode = chipNode.clientWidth >= chipNode.scrollWidth - 1 ? 'fit' : 'compact'
        current.classList.remove('dshw_fit')
      }
      if (compact) current.classList.add('dshw_compact')
      return mode
    }

    function evaluateHomeSpace() {
      var next = measureHomeMode()
      if (next) setHomeMode(next)
    }

    evaluateHomeSpace()
    window.addEventListener('resize', evaluateHomeSpace)
    var observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(evaluateHomeSpace) : null
    if (observer) {
      observer.observe(anchor)
      observer.observe(chip)
    }
    return function () {
      window.removeEventListener('resize', evaluateHomeSpace)
      if (observer) observer.disconnect()
    }
  }, [chipLayout.dock, chipScale, data, showOfficial, showThird])

  useLayoutEffect(function () {
    var previous = bottomDockHostRef.current
    if (previous && previous.classList) previous.classList.remove('dshw_bottomDockHost')
    bottomDockHostRef.current = null
    if (chipLayout.dock !== 'bottom') return
    var host = findBottomDockHost(chipAnchorRef.current, window.innerWidth, window.innerHeight)
    if (!host || !host.classList) return
    host.classList.add('dshw_bottomDockHost')
    bottomDockHostRef.current = host
    return function () {
      if (host.classList) host.classList.remove('dshw_bottomDockHost')
      if (bottomDockHostRef.current === host) bottomDockHostRef.current = null
    }
  }, [chipLayout.dock])

  useLayoutEffect(function () {
    if (chipLayout.dock === 'home' || chipRef.current === null) return
    var node = chipRef.current
    function fitDockedChip() {
      var rect = node.getBoundingClientRect()
      var current = chipLayoutRef.current
      var next = current
      var composerRect = findComposerRect(chipAnchorRef.current, window.innerWidth, window.innerHeight)
      if (current.dock === 'free') {
        var fitted = clampPosition(current, rect.width, rect.height, window.innerWidth, window.innerHeight)
        next = { dock: 'free', x: fitted.x, y: fitted.y }
      } else if (current.dock === 'left' || current.dock === 'right' || current.dock === 'content-left') {
        var sideContentRect = null
        if (current.dock === 'content-left') {
          var contentHost = findBottomDockHost(chipAnchorRef.current, window.innerWidth, window.innerHeight)
          sideContentRect = contentHost && typeof contentHost.getBoundingClientRect === 'function' ? contentHost.getBoundingClientRect() : null
        }
        var sideX = computeSideDockX(current.dock, rect.width, window.innerWidth, sideContentRect)
        var sideY = Math.max(CHIP_EDGE_MARGIN, Math.min(window.innerHeight - rect.height - CHIP_EDGE_MARGIN, current.y))
        next = { dock: current.dock, x: sideX, y: sideY }
      } else if (current.dock === 'bottom') {
        var bottomX = (window.innerWidth - rect.width) / 2
        var bottomY = window.innerHeight - rect.height - CHIP_EDGE_MARGIN
        if (composerRect && composerRect.width >= 150) {
          bottomX = composerRect.left + (composerRect.width - rect.width) / 2
        }
        next = { dock: 'bottom', x: bottomX, y: bottomY }
      }
      if (next.x !== current.x || next.y !== current.y) applyChipLayout(next)
    }
    fitDockedChip()
    window.addEventListener('resize', fitDockedChip)
    window.addEventListener('scroll', fitDockedChip, true)
    return function () {
      window.removeEventListener('resize', fitDockedChip)
      window.removeEventListener('scroll', fitDockedChip, true)
    }
  }, [chipLayout.dock, chipScale, data, showOfficial, showThird])

  useLayoutEffect(function () {
    if (!floated || floatRef.current === null) return
    var node = floatRef.current
    function fitFloatingWindow() {
      var rect = node.getBoundingClientRect()
      var current = floatPosRef.current || readSavedPos(rect.width, rect.height) || {
        x: window.innerWidth - rect.width - 16,
        y: 80
      }
      var fitted = clampPos(current, rect.width, rect.height)
      floatPosRef.current = fitted
      setFloatPos(fitted)
    }
    fitFloatingWindow()
    window.addEventListener('resize', fitFloatingWindow)
    return function () { window.removeEventListener('resize', fitFloatingWindow) }
  }, [floated, minimized, showOfficial, showThird])

  React.useEffect(function () {
    try {
      var mode = 'chip'
      if (floated) mode = minimized ? 'dot' : 'float'
      compatibility.storage.setItem('dshw-float-mode', mode)
    } catch (e) { /* ignore */ }
  }, [floated, minimized])

  function requestNotify() {
    compatibility.requestNotificationPermission().then(function () {
      compatibility.dispatch(NOTIFY_CONFIG_EVENT)
    }).catch(function () { /* page reminders remain available */ })
  }

  function saveThreshold(valueArg) {
    if (dataRef.current && dataRef.current.usageStorage && dataRef.current.usageStorage.locked) return
    var value = Number.parseFloat(valueArg !== undefined ? valueArg : thresholdDraft)
    if (!Number.isFinite(value)) return
    value = Math.min(100000, Math.max(0, Math.round(value * 100) / 100))
    fetch('/api/wallet/threshold', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ threshold: value, currency: (dataRef.current && dataRef.current.balance && dataRef.current.balance.currency) || 'CNY' })
    }).then(function (resp) { return resp.json() }).then(function (json) {
      if (json && json.ok) {
        setThresholdDraft(json.threshold.toFixed(2))
        if (dataRef.current) { dataRef.current.threshold = json.threshold; setData(Object.assign({}, dataRef.current)) }
      }
    }).catch(function () { /* ignore */ })
  }

  var thresholdSaveTimerRef = React.useRef(null)
  function queueThresholdSave(value) {
    if (thresholdSaveTimerRef.current) clearTimeout(thresholdSaveTimerRef.current)
    thresholdSaveTimerRef.current = setTimeout(function () { saveThreshold(value) }, 600)
  }

  function clearSession() {
    if (!sessionId || (dataRef.current && dataRef.current.usageStorage && dataRef.current.usageStorage.locked)) return
    fetch('/api/wallet/clear-session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ session: sessionId })
    }).then(function () {
      var url = '/api/wallet/snapshot'
      if (sessionId) url = url + '?session=' + encodeURIComponent(sessionId)
      fetch(url).then(function (r) { return r.json() }).then(function (json) {
        dataRef.current = json
        setData(json)
      }).catch(function () {})
    }).catch(function () {})
  }

  function refreshBalance() {
    fetch('/api/wallet/refresh', { method: 'POST' }).then(function () {
      setTimeout(function () {
        var url = '/api/wallet/snapshot'
        if (sessionId) url = url + '?session=' + encodeURIComponent(sessionId)
        fetch(url).then(function (r2) { return r2.json() }).then(function (json) {
          dataRef.current = json
          setData(json)
        }).catch(function () { /* ignore */ })
      }, 300)
    }).catch(function () { /* ignore */ })
  }

  // -- multi-account management ------------------------------------------
  function loadAccounts() {
    fetch('/api/wallet/accounts').then(function (resp) {
      if (!resp.ok) throw new Error(String(resp.status))
      return resp.json()
    }).then(function (json) {
      if (json && json.ok) {
        setAccounts(json)
        setAccountsError(json.storage && json.storage.locked
          ? t('settings.accountEncryptedFileLocked')
          : null)
      }
    }).catch(function () {
      setAccountsError(t('chip.accountsLoadFailed'))
    })
  }

  function addAccount() {
    if (adding) return
    var name = addName.trim()
    var key = addKey.trim()
    if (name === '' || key === '') {
      setAccountNotice(t('chip.nameAndApiKeyRequired'))
      return
    }
    setAdding(true)
    setAccountNotice(null)
    fetch('/api/wallet/accounts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: name, apiKey: key })
    }).then(function (resp) { return resp.json() }).then(function (json) {
      setAdding(false)
      if (json && json.ok) {
        setAddName('')
        setAddKey('')
        setAccountNotice(json.synced
          ? t('settings.addedAndSetAsCurrent')
          : t('settings.added') + (json.syncError ? t('chip.syncFailedParen') + json.syncError + '\uff09' : ''))
        loadAccounts()
        refreshBalance()
        try {
          if (typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
            window.dispatchEvent(new CustomEvent('dshw-refresh'))
          }
        } catch (e) { /* ignore */ }
      } else {
        setAccountNotice((json && json.error) || t('settings.addFailed'))
      }
    }).catch(function () {
      setAdding(false)
      setAccountNotice(t('settings.addFailed'))
    })
  }

  function activateAccount(id, name) {
    if (switchingId !== null) return
    if (!window.confirm(t('chip.switchToAccount') + name + t('chip.switchAccountConfirmSuffix'))) return
    setSwitchingId(id)
    setAccountNotice(null)
    fetch('/api/wallet/accounts/activate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: id })
    }).then(function (resp) { return resp.json() }).then(function (json) {
      setSwitchingId(null)
      if (json && json.ok) {
        setAccountNotice(t('settings.switchedToAccountPrefix') + json.account.name + '\u300d')
        loadAccounts()
        refreshBalance()
        try {
          if (typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
            window.dispatchEvent(new CustomEvent('dshw-refresh'))
          }
        } catch (e) { /* ignore */ }
        // Switch account: unlock + the activate response carries the threshold (zero-wait jump).
        thresholdInitializedRef.current = false
        if (json.threshold !== undefined && json.threshold !== null) setThresholdDraft(json.threshold.toFixed(2))
      } else {
        setAccountNotice((json && json.error) || t('settings.switchFailed'))
      }
    }).catch(function () {
      setSwitchingId(null)
      setAccountNotice(t('settings.switchFailed'))
    })
  }

  function removeAccount(id, name) {
    if (!window.confirm(t('settings.deleteAccountPrefix') + name + t('chip.deleteAccountConfirmSuffix'))) return
    fetch('/api/wallet/accounts/remove', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: id })
    }).then(function (resp) { return resp.json() }).then(function (json) {
      if (json && json.ok) {
        setAccountNotice(t('settings.deleted'))
        loadAccounts()
        refreshBalance()
        try {
          if (typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
            window.dispatchEvent(new CustomEvent('dshw-refresh'))
          }
        } catch (e) { /* ignore */ }
      } else {
        setAccountNotice((json && json.error) || t('settings.deleteFailed'))
      }
    }).catch(function () {
      setAccountNotice(t('settings.deleteFailed'))
    })
  }

  function accountsSection() {
    var activeName = snapshot.accounts && snapshot.accounts.activeName ? snapshot.accounts.activeName : null
    var list = accounts && accounts.accounts ? accounts.accounts : []
    var children = []
    children.push(React.createElement('div', { key: 't', className: 'dshw_title' }, t('settings.accountManagement')))
    if (accountsError) {
      children.push(React.createElement('div', { key: 'e', className: 'dshw_muted' }, accountsError))
    } else {
      children.push(React.createElement('div', { key: 'cur', className: 'dshw_row' },
        React.createElement('span', { className: 'dshw_muted' }, t('chip.currentAccount')),
        React.createElement('span', null, activeName ? activeName + t('chip.llmBillingSuffix') : t('settings.followSystemKey'))))
      if (list.length === 0) {
        children.push(React.createElement('div', { key: 'none', className: 'dshw_muted' },
          t('settings.noAccountsHint')))
      }
      var acctRows = []
      list.forEach(function (acc) {
        var rowChildren = []
        rowChildren.push(React.createElement('span', {
          key: 'n',
          className: 'dshw_title',
          style: { flex: '1 1 auto', minWidth: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
        }, acc.name))
        rowChildren.push(React.createElement('span', { key: 'k', className: 'dshw_muted' }, acc.maskedKey))
        if (acc.active) {
          rowChildren.push(React.createElement('span', { key: 'a', className: 'dshw_muted' }, t('settings.current')))
        } else {
          rowChildren.push(React.createElement('button', {
            key: 's',
            type: 'button',
            className: 'dshw_btn',
            style: { padding: '2px 8px' },
            disabled: switchingId !== null,
            onClick: function () { activateAccount(acc.id, acc.name) }
          }, switchingId === acc.id ? '\u2026' : t('settings.switch')))
        }
        rowChildren.push(React.createElement('button', {
          key: 'r',
          type: 'button',
          className: 'dshw_btn',
          style: { padding: '2px 6px' },
          onClick: function () { removeAccount(acc.id, acc.name) }
        }, '\u00d7'))
        acctRows.push(React.createElement('div', { key: acc.id, className: 'dshw_row', style: { margin: 0 } }, rowChildren))
      })
      if (acctRows.length > 0) {
        children.push(React.createElement('div', { key: 'scroll', className: 'dshw_acctScroll' }, acctRows))
        if (acctRows.length > 2) children.push(React.createElement('div', { key: 'more', className: 'dshw_acctMore' }, t('chip.accountsTotalPrefix') + acctRows.length + t('chip.accountsSwipeSuffix')))
      }
      children.push(React.createElement('div', { key: 'add', className: 'dshw_row', style: { gap: '4px' } },
        React.createElement('input', {
          className: 'dshw_input',
          type: 'text',
          placeholder: t('settings.name'),
          style: { width: '72px' },
          value: addName,
          onChange: function (e) { setAddName(e.target.value) }
        }),
        React.createElement('input', {
          className: 'dshw_input',
          type: 'password',
          placeholder: 'sk-...',
          style: { flex: '1 1 auto', minWidth: '0' },
          value: addKey,
          onChange: function (e) { setAddKey(e.target.value) }
        }),
        React.createElement('button', {
          type: 'button',
          className: 'dshw_btn dshw_btnPrimary',
          disabled: adding,
          onClick: addAccount
        }, adding ? '\u2026' : t('settings.add'))))
    }
    if (accountNotice) {
      children.push(React.createElement('div', {
        key: 'notice',
        className: 'dshw_muted',
        style: { overflowWrap: 'anywhere' }
      }, accountNotice))
    }
    return React.createElement(React.Fragment, null, children)
  }

  function goRecharge() {
    setConfirming(false)
    try { compatibility.storage.setItem(CONFIRM_KEY, '1') } catch (e) { /* ignore */ }
    var url = data && data.rechargeUrl ? data.rechargeUrl : 'https://platform.deepseek.com/top_up'
    compatibility.openExternal(url)
  }

  function onRechargeClick(event) {
    if (event && event.stopPropagation) event.stopPropagation()
    if (event && event.preventDefault) event.preventDefault()
    if (chipDidDragRef.current === true) return
    var confirmed = false
    try { confirmed = compatibility.storage.getItem(CONFIRM_KEY) === '1' } catch (e) { /* ignore */ }
    if (confirmed) goRecharge()
    else setConfirming(true)
  }

  // Hiding the composer label is presentation-only: all polling,
  // reminders, settings, history and plan adapters above remain mounted.
  // A deliberately floated panel/dot also remains available.
  if (chipAppearance === 'hidden' && !floated) return null

  var snapshot = data || {}
  var usageLocked = !!(snapshot.usageStorage && snapshot.usageStorage.locked)
  var bal = snapshot.balance || {}
  var session = snapshot.session || {}
  var official = session.official || {}
  var third = session.third || {}
  var officialTokens = official.tokens ? totalTokens(official.tokens) : 0
  var thirdTokens = third.tokens ? totalTokens(third.tokens) : 0
  var thirdCustomText = customCostsText(third.customCosts)
  var activeThirdRoute = activeProviderMode.kind === 'third' && Array.isArray(third.routes)
    ? third.routes.find(function (route) { return route.provider === activeProviderMode.provider && route.model === activeProviderMode.model })
    : null
  var activeThirdCostText = activeThirdRoute && activeThirdRoute.customCost
    ? fmtCurrency(activeThirdRoute.customCost.cost, activeThirdRoute.customCost.currency)
    : ''
  var activePlanSource = activeProviderMode.kind === 'zai'
    ? planSourceForProvider(snapshot, activeProviderMode.provider)
    : null
  var planTokenRemaining = planRemainingPercent(activePlanSource, 'tokens-5h')
  var planToolRemaining = planRemainingPercent(activePlanSource, 'tools-month')
  var low = showDeepSeek && snapshot.lowBalance === true
  var chipDock = chipLayout.dock
  // The home toolbar row cannot fit the widest scale on narrow windows, so
  // cap the slider there; floating and side docks keep the full range.
  var scaleMaxPercent = chipDock === 'home' ? 105 : 125
  var chipVertical = chipDock === 'left' || chipDock === 'right' || chipDock === 'content-left'
  var lowBlinkOff = false
  try { lowBlinkOff = compatibility.storage.getItem(LOW_BLINK_KEY) === 'false' } catch (e) { /* ignore */ }
  var lowBlinkOn = !lowBlinkOff
  var chipClass = low ? (lowBlinkOff ? 'dshw_chip dshw_chipLow dshw_noBlink' : 'dshw_chip dshw_chipLow') : 'dshw_chip'
  var cssZoom = compatibility.supportsCssZoom()
  var chipStyle = cssZoom
    ? { zoom: chipScale }
    : { transform: 'scale(' + chipScale + ')', transformOrigin: 'top left' }
  var chipPositionScale = cssZoom ? chipScale : 1
  if (chipDock !== 'home') chipClass += ' dshw_chipDocked'
  if (chipVertical) chipClass += ' dshw_chipVertical'
  if (balanceOnly) chipClass += ' dshw_chipBalanceOnly'
  if (!showDeepSeek || balanceOnly) chipClass += ' dshw_chipNoRecharge'
  if (chipDragRef.current && chipDragRef.current.dragged) chipClass += ' dshw_chipDragging'
  if (chipDock === 'free') { chipStyle.left = chipLayout.x / chipPositionScale; chipStyle.top = chipLayout.y / chipPositionScale }
  if (chipDock === 'left' || chipDock === 'right' || chipDock === 'content-left' || chipDock === 'bottom') { chipStyle.left = chipLayout.x / chipPositionScale; chipStyle.top = chipLayout.y / chipPositionScale }

  var chipTextParts = []
  var balanceText = bal.total === null || bal.total === undefined ? '--' : fmtCurrency(bal.total, bal.currency)
  function verticalMetric(key, label, value) {
    return React.createElement('span', { key: key, className: 'dshw_metric' },
      React.createElement('span', { className: 'dshw_metricLabel' }, label),
      React.createElement('span', { className: 'dshw_metricValue' }, value))
  }
  // The session cost stays on the chip even at ¥0.00. Three states:
  // no session record yet → show ¥0.00 (a fresh chat must not lose the
  // segment), priced → show the value, unpriced (priced === false) →
  // hide, because no honest number exists.
  var chipCostHidden = official.priced === false
  var chipCostValue = (official.cost === null || official.cost === undefined) ? 0 : official.cost
  if (balanceOnly) {
    if (activeProviderMode.kind === 'zai') {
      if (chipVertical) chipTextParts.push(verticalMetric('plan-token', t('chip.planToken5h'), planTokenRemaining))
      else chipTextParts.push(React.createElement('span', { key: 'plan-token', className: 'dshw_homePrimary' },
        React.createElement('span', { className: 'dshw_homePrimaryLabel' }, t('chip.planToken5h') + ' '),
        React.createElement('span', { className: 'dshw_homePrimaryValue' }, planTokenRemaining)))
    } else if (activeProviderMode.kind === 'third') {
      if (chipVertical) chipTextParts.push(verticalMetric('third', activeThirdCostText ? t('chip.estimated') : t('chip.session'), activeThirdCostText || fmtTokens(thirdTokens)))
      else chipTextParts.push(React.createElement('span', { key: 'third', className: 'dshw_homePrimary' },
        React.createElement('span', { className: 'dshw_homePrimaryLabel' }, (activeThirdCostText ? t('chip.estimated') : t('chip.session')) + ' '),
        React.createElement('span', { className: 'dshw_homePrimaryValue' }, activeThirdCostText || fmtTokens(thirdTokens))))
    } else {
      if (chipVertical) chipTextParts.push(verticalMetric('bal', t('chip.balance'), balanceText))
      else chipTextParts.push(React.createElement('span', { key: 'bal', className: 'dshw_balanceText dshw_homePrimary' },
        React.createElement('span', { className: 'dshw_homePrimaryLabel' }, t('chip.balance') + ' '),
        React.createElement('span', { className: 'dshw_homePrimaryValue' }, balanceText)))
    }
  } else if (activeProviderMode.kind === 'zai') {
    if (chipVertical) {
      chipTextParts.push(verticalMetric('provider', t('chip.plan'), 'Z.ai'))
      chipTextParts.push(verticalMetric('plan-token', t('chip.planToken5h'), planTokenRemaining))
      chipTextParts.push(verticalMetric('plan-tools', t('chip.planTools'), planToolRemaining))
      if (showThird) chipTextParts.push(verticalMetric('third', t('chip.session'), fmtTokens(thirdTokens)))
    } else {
      chipTextParts.push(React.createElement('span', { key: 'provider', className: 'dshw_homePrimary' },
        React.createElement('span', { className: 'dshw_homePrimaryValue' }, 'Z.ai')))
      chipTextParts.push(React.createElement('span', { key: 'plan-token' }, t('chip.planToken5h') + planTokenRemaining))
      chipTextParts.push(React.createElement('span', { key: 'plan-tools' }, t('chip.planTools') + planToolRemaining))
      if (showThird) chipTextParts.push(React.createElement('span', { key: 'third' }, t('chip.session') + ' ' + fmtTokens(thirdTokens)))
    }
  } else if (activeProviderMode.kind === 'third') {
    var thirdProviderName = providerDisplayName(activeProviderMode, t)
    if (chipVertical) {
      chipTextParts.push(verticalMetric('provider', t('chip.model'), thirdProviderName))
      chipTextParts.push(verticalMetric('third', t('chip.session'), fmtTokens(thirdTokens)))
      if (activeThirdCostText) chipTextParts.push(verticalMetric('third-cost', t('chip.estimate'), activeThirdCostText))
    } else {
      chipTextParts.push(React.createElement('span', { key: 'provider', className: 'dshw_homePrimary' },
        React.createElement('span', { className: 'dshw_homePrimaryValue' }, thirdProviderName)))
      chipTextParts.push(React.createElement('span', { key: 'third' }, t('chip.sessionTokensPrefix') + fmtTokens(thirdTokens)))
      if (activeThirdCostText) chipTextParts.push(React.createElement('span', { key: 'third-cost' }, t('chip.estimatedCostPrefix') + activeThirdCostText))
    }
  } else if (chipVertical) {
    if (showDeepSeek) {
      chipTextParts.push(verticalMetric('bal', t('chip.balance'), balanceText))
      if (!chipCostHidden) chipTextParts.push(verticalMetric('cost', sessionCostLabel(bal.currency, t), sessionCostText(chipCostValue, bal.currency)))
      chipTextParts.push(verticalMetric('off', t('chip.official'), fmtTokens(officialTokens)))
    }
    if (showThird) chipTextParts.push(verticalMetric('third', t('chip.third'), fmtTokens(thirdTokens)))
  } else {
    if (showDeepSeek) {
      chipTextParts.push(React.createElement('span', { key: 'bal', className: 'dshw_balanceText dshw_homePrimary' },
        React.createElement('span', { className: 'dshw_homePrimaryLabel' }, t('panel.balanceLabel')),
        React.createElement('span', { className: 'dshw_homePrimaryValue' }, balanceText)))
      if (!chipCostHidden) chipTextParts.push(React.createElement('span', { key: 'cost' }, sessionCostLabel(bal.currency, t) + ' ' + sessionCostText(chipCostValue, bal.currency)))
      chipTextParts.push(React.createElement('span', { key: 'off' }, t('chip.officialTokensPrefix') + fmtTokens(officialTokens)))
    }
    if (showDeepSeek && showThird) chipTextParts.push(React.createElement('span', { key: 'sep', className: 'dshw_sep' }, '|'))
    if (showThird) chipTextParts.push(React.createElement('span', { key: 'third', className: showDeepSeek ? 'dshw_thirdText' : 'dshw_thirdText dshw_homePrimary' },
      React.createElement('span', { className: 'dshw_homePrimaryLabel' }, t('chip.thirdPartyPrefix')),
      React.createElement('span', { className: 'dshw_homePrimaryValue' }, fmtTokens(thirdTokens))))
  }

  var chip = React.createElement('span', {
    ref: chipRef,
    className: chipClass,
    style: chipStyle,
    role: 'group',
    'data-dshw-chip': chipAppearance,
    'data-dshw-balance-only': balanceOnly ? 'true' : 'false',
    'aria-label': activeProviderMode.kind === 'zai' ? t('chip.zaiPlanQuota') : activeProviderMode.kind === 'third' ? providerDisplayName(activeProviderMode, t) + t('chip.usageSuffix') : t('chip.deepSeekWallet'),
    onPointerDown: onChipDown
  },
    React.createElement('button', {
      ref: chipButtonRef,
      type: 'button',
      className: 'dshw_chipMain',
      'data-dshw-chip-main': 'true',
      title: t('chip.controlCenterTooltip'),
      'aria-expanded': open,
      'aria-haspopup': 'dialog',
      onClick: function () {
      if (chipDidDragRef.current === true) return
      requestNotify()
      if (floated) {
        setFloated(false)
        setPanelStyle({ visibility: 'hidden' })
        setOpen(true)
        return
      }
      if (!open) setPanelStyle({ visibility: 'hidden' })
      setOpen(!open)
      }
    }, chipTextParts),
    showDeepSeek && !balanceOnly ? React.createElement('button', {
      type: 'button',
      className: 'dshw_recharge',
      'data-dshw-chip-recharge': 'true',
      title: t('chip.openPlatformTopUpTitle'),
      'aria-label': t('chip.openTopUpPage'),
      onClick: onRechargeClick
    }, t('chip.topUp')) : null)

  var chipHost = React.createElement('span', { ref: chipAnchorRef, className: chipDock === 'home' ? 'dshw_anchor dshw_anchorHome' + (homeMode === 'compact' ? ' dshw_compact' : homeMode === 'fit' ? ' dshw_fit' : '') : 'dshw_anchor' }, chip)
  var snapPreviewElement = snapPreview ? React.createElement('div', {
    className: snapPreview.vertical ? 'dshw_snapPreview dshw_snapPreviewVertical' : 'dshw_snapPreview',
    style: { left: snapPreview.x, top: snapPreview.y, width: snapPreview.width, height: snapPreview.height },
    'data-dock': snapPreview.dock,
    'aria-hidden': 'true'
  }) : null

  var confirmOverlay = null
  if (confirming) {
    confirmOverlay = React.createElement('div', { ref: confirmRef, className: 'dshw_overlay', onClick: function () { setConfirming(false) } },
      React.createElement('div', {
        className: 'dshw_overlayBox',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': 'dshw-confirm-title',
        'aria-describedby': 'dshw-confirm-description',
        onClick: function (e) { e.stopPropagation() }
      },
        React.createElement('div', { id: 'dshw-confirm-title', className: 'dshw_title' }, t('chip.topUpDialogTitle')),
        React.createElement('div', { className: 'dshw_muted' }, 'https://platform.deepseek.com/top_up'),
        React.createElement('div', { id: 'dshw-confirm-description' }, t('chip.topUpDialogDesc')),
        React.createElement('div', { className: 'dshw_overlayRow' },
          React.createElement('button', { ref: cancelButtonRef, type: 'button', className: 'dshw_btn', onClick: function () { setConfirming(false) } }, t('chip.cancel')),
          React.createElement('button', { ref: confirmButtonRef, type: 'button', className: 'dshw_btn dshw_btnPrimary', onClick: goRecharge }, t('chip.goTopUp')))))
  }

  if (!open && !floated) return React.createElement(React.Fragment, null, chipHost, snapPreviewElement, confirmOverlay)

  var balanceRows = []
  if (bal.available && bal.balances && bal.balances.length > 0) {
    bal.balances.forEach(function (info, index) {
      balanceRows.push(React.createElement('div', { key: String(info.currency) + '-' + index, className: 'dshw_row' },
        React.createElement('span', { className: 'dshw_muted' }, t('chip.balanceWithCurrency') + info.currency + ')'),
        React.createElement('span', null, fmtCurrency(info.total_balance, info.currency) + t('chip.toppedUpPrefix') + fmtCurrency(info.topped_up_balance, info.currency) + t('chip.grantedPrefix') + fmtCurrency(info.granted_balance, info.currency) + ')')
      ))
    })
  } else {
    balanceRows.push(React.createElement('div', { key: 'no-bal', className: 'dshw_row dshw_muted' }, bal.error ? (t('chip.balanceUnavailable') + bal.error) : t('chip.balanceLoading')))
  }

  var officialRows = []
  if (official.tokens) {
    officialRows.push(React.createElement('div', { key: 'o-t', className: 'dshw_row' },
      React.createElement('span', { className: 'dshw_muted' }, t('chip.officialToken')),
      React.createElement('span', null, t('chip.tokensInputPrefix') + fmtTokens(official.tokens.input) + t('chip.cacheReadPrefix') + fmtTokens(official.tokens.cacheRead) + t('chip.outputPrefix') + fmtTokens(official.tokens.output))))
  }
  officialRows.push(React.createElement('div', { key: 'o-c', className: 'dshw_row' },
    React.createElement('span', { className: 'dshw_muted' }, t('chip.sessionCost')),
    React.createElement('span', null, official.cost === null ? t('chip.unpricedModel') : sessionCostText(official.cost, bal.currency))))

  var thirdRows = []
  thirdRows.push(React.createElement('div', { key: 't-t', className: 'dshw_row' },
    React.createElement('span', { className: 'dshw_muted' }, t('chip.thirdPartyToken')),
    React.createElement('span', null, t('chip.tokensInputPrefix') + fmtTokens(third.tokens && third.tokens.input) + t('chip.cacheReadPrefix') + fmtTokens(third.tokens && third.tokens.cacheRead) + t('chip.outputPrefix') + fmtTokens(third.tokens && third.tokens.output))))
  if (thirdCustomText) {
    thirdRows.push(React.createElement('div', { key: 't-c', className: 'dshw_row' },
      React.createElement('span', { className: 'dshw_muted' }, t('chip.customEstimate')),
      React.createElement('span', { title: t('chip.customEstimateExplain') }, thirdCustomText)))
  }
  if (activeThirdRoute && activeThirdRoute.activePrice) {
    var activeCustomPrice = activeThirdRoute.activePrice
    var activeWindow = activeCustomPrice.window
    thirdRows.push(React.createElement('div', { key: 't-price-window', className: 'dshw_row' },
      React.createElement('span', { className: 'dshw_muted' }, t('chip.currentPricing')),
      React.createElement('span', {
        title: activeWindow ? (t('chip.weekdayBySelectedDate') + activeWindow.start + '–' + activeWindow.end + ' · ' + activeCustomPrice.timezone) : (t('chip.noWindowMatched') + activeCustomPrice.timezone)
      }, customRateLabel(activeCustomPrice, t))))
  }

  var thresholdInput = React.createElement('input', {
    className: 'dshw_input',
    type: 'number',
    min: '0',
    step: 'any',
    'aria-label': t('chip.balanceThresholdPrefix') + (bal.currency || 'CNY') + t('chip.balanceThresholdSuffix'),
    value: thresholdDraft === null ? '' : thresholdDraft,
    disabled: usageLocked,
    title: usageLocked ? t('settings.usageLedgerLockedThreshold') : undefined,
    onChange: function (event) {
      thresholdInitializedRef.current = 'editing'
      if (thresholdEditTimerRef.current) clearTimeout(thresholdEditTimerRef.current)
      thresholdEditTimerRef.current = setTimeout(function () { thresholdInitializedRef.current = false }, 15000)
      setThresholdDraft(event.target.value)
    }
  })

  var usageLockNotice = usageLocked ? React.createElement('div', { className: 'dshw_muted', style: { color: 'var(--dsw-alias-state-error-primary,#e5534b)', lineHeight: 1.4 } }, t('chip.ledgerUnreadable')) : null

  var scaleControl = React.createElement('div', { className: 'dshw_row' },
    React.createElement('span', { className: 'dshw_muted' }, t('chip.chipRatio')),
    React.createElement('span', { className: 'dshw_scaleControl' },
      React.createElement('input', {
        className: 'dshw_scaleInput',
        type: 'range',
        min: '75',
        max: String(scaleMaxPercent),
        step: '5',
        value: String(Math.round(chipScale * 100)),
        'aria-label': t('settings.walletChipScale'),
        onInput: function (event) { saveChipScale(Number.parseFloat(event.target.value) / 100) },
        onChange: function (event) { saveChipScale(Number.parseFloat(event.target.value) / 100) }
      }),
      React.createElement('span', { className: 'dshw_scaleValue' }, Math.round(chipScale * 100) + '%')))

  var visibilityControl = React.createElement('div', { className: 'dshw_row' },
    React.createElement('span', { className: 'dshw_muted' }, t('settings.displayContent')),
    React.createElement('span', { className: 'dshw_visibilityControl' },
      React.createElement('label', { className: 'dshw_check' },
        React.createElement('input', {
          type: 'checkbox',
          checked: showOfficial,
          disabled: showOfficial && !showThird,
          'aria-label': t('settings.showOfficialData'),
          onChange: function (event) { saveDataVisibility({ official: event.target.checked, third: showThird }) }
        }),
        React.createElement('span', null, t('chip.officialData'))),
      React.createElement('label', { className: 'dshw_check' },
        React.createElement('input', {
          type: 'checkbox',
          checked: showThird,
          disabled: showThird && !showOfficial,
          'aria-label': t('settings.showThirdPartyTokens'),
          onChange: function (event) { saveDataVisibility({ official: showOfficial, third: event.target.checked }) }
        }),
        React.createElement('span', null, t('chip.thirdPartyToken')))))

  var notifyControl = React.createElement('div', { className: 'dshw_row dshw_notifyControl' },
    React.createElement('span', { className: 'dshw_muted' }, t('settings.completionAlert')),
    React.createElement('span', { className: 'dshw_visibilityControl' },
      React.createElement('label', { className: 'dshw_check' },
        React.createElement('input', {
          type: 'checkbox',
          checked: notifyConfig.enabled,
          'aria-label': t('chip.enableTurnDoneReminder'),
          onChange: function (event) {
            var enabled = event.target.checked
            saveNotifyConfig({ enabled: enabled, timeout: notifyConfig.timeout })
            if (enabled) requestNotify()
          }
        }),
        React.createElement('span', null, t('chip.on'))),
      React.createElement('select', {
        className: 'dshw_select',
        value: String(notifyConfig.timeout),
        disabled: !notifyConfig.enabled,
        'aria-label': t('chip.reminderAutoCloseTime'),
        onChange: function (event) {
          saveNotifyConfig({ enabled: notifyConfig.enabled, timeout: Number.parseInt(event.target.value, 10) })
        }
      },
        React.createElement('option', { value: '0' }, t('chip.keepUntilClosed')),
        React.createElement('option', { value: '5' }, t('settings.seconds5')),
        React.createElement('option', { value: '10' }, t('settings.seconds10')),
        React.createElement('option', { value: '30' }, t('settings.seconds30')),
        React.createElement('option', { value: '60' }, t('settings.seconds60')))))

  var permanentDeleteControl = React.createElement('div', { className: 'dshw_setCell', style: { border: 'none', padding: '0 9px', minHeight: '30px' } },
    React.createElement('span', { className: 'dshw_muted' }, t('settings.deleteSessionPermanently')),
    React.createElement('label', { className: 'dshw_check' },
      React.createElement('input', {
        type: 'checkbox',
        checked: permanentDeleteSupported && permanentDeleteEnabled,
        disabled: !permanentDeleteSupported,
        'aria-label': t('settings.enablePermanentDelete'),
        title: permanentDeleteSupported ? t('settings.showPermanentDelete') : t('settings.hostNoPermanentDelete'),
        onChange: function (event) {
          if (!permanentDeleteSupported) return
          var enabled = event.target.checked
          setPermanentDeleteEnabled(enabled)
          try { compatibility.storage.setItem(PERMANENT_DELETE_KEY, String(enabled)) } catch (e) { /* ignore */ }
          compatibility.dispatch(PERMANENT_DELETE_EVENT)
        }
      }),
      React.createElement('span', null, permanentDeleteSupported ? t('chip.on') : t('chip.hostUnsupported'))))
  var floatBtnRow = React.createElement('div', {
    className: 'dshw_row dshw_panelHeader',
    style: { justifyContent: 'space-between', marginTop: '2px' },
    title: t('chip.dragPanelTooltip'),
    'data-dshw-panel-drag-handle': 'true',
    onPointerDown: onPanelDown
  },
    React.createElement('span', { className: 'dshw_panelDragLabel' }, t('chip.dragHoldLabel')),
    React.createElement('span', { style: { display: 'inline-flex', gap: '4px' } },
      React.createElement('button', {
        type: 'button',
        className: 'dshw_btn',
        style: { height: '22px', fontSize: '11px', padding: '0 8px' },
        title: t('chip.restoreToToolbar'),
        onClick: function () { applyChipLayout({ dock: 'home', x: 0, y: 0 }) }
      }, t('settings.redockButton')),
      React.createElement('button', {
        type: 'button',
        className: 'dshw_btn',
        style: { height: '22px', fontSize: '11px', padding: '0 8px' },
        title: t('chip.minimizeToCircle'),
        onClick: function () {
          var rect = chipRef.current ? chipRef.current.getBoundingClientRect() : null
          if (rect) {
            var initialDotPos = clampPos({
              x: rect.left + (rect.width - 36) / 2,
              y: rect.top + (rect.height - 36) / 2
            }, 36, 36)
            floatPosRef.current = initialDotPos
            setFloatPos(initialDotPos)
          }
          setFloated(true)
          setMinimized(true)
          setOpen(false)
        }
      }, t('chip.minimize'))))

  var providerSwitcher = React.createElement('div', {
    className: 'dshw_providerTabs',
    role: 'group',
    'aria-label': t('chip.switchPanelData'),
    title: t('chip.switchPanelDataTooltip')
  },
    React.createElement('button', {
      type: 'button',
      className: 'dshw_providerTab',
      'aria-pressed': panelProviderMode.kind === 'deepseek',
      onClick: function () { setPanelProviderView('deepseek') }
    }, 'DeepSeek'),
    React.createElement('button', {
      type: 'button',
      className: 'dshw_providerTab',
      'aria-pressed': panelProviderMode.kind === 'zai',
      onClick: function () { setPanelProviderView('zai') }
    }, 'Z.ai'))

  // Balance summary as one compact horizontal card: hero figure, optional
  // low-balance pill, inline session cost; breakdown on a quiet sub-line.
  function balanceCard() {
    if (!bal.available || !bal.balances || bal.balances.length === 0) {
      return React.createElement('div', { className: 'dshw_balanceCard' },
        React.createElement('div', { className: 'dshw_muted' }, bal.error ? balanceErrorText(bal.error, t) : t('chip.balanceLoading')))
    }
    var first = selectBalanceInfo(bal)
    var others = bal.balances.filter(function (info) { return info !== first })
    var subParts = [
      React.createElement('span', { key: 'top' }, t('settings.toppedUpPrefix') + fmtCurrency(first.topped_up_balance, first.currency)),
      React.createElement('span', { key: 'd1', className: 'dshw_balDot' }, '\u00b7'),
      React.createElement('span', { key: 'grt' }, t('settings.grantedPrefix') + fmtCurrency(first.granted_balance, first.currency))
    ]
    others.forEach(function (info, i) {
      subParts.push(React.createElement('span', { key: 'd' + i, className: 'dshw_balDot' }, '\u00b7'))
      subParts.push(React.createElement('span', { key: 'x' + i }, info.currency + ' ' + fmtCurrency(info.total_balance, info.currency)))
    })
    return React.createElement('div', {
      className: low ? 'dshw_balanceCard dshw_low' : 'dshw_balanceCard'
    },
      React.createElement('div', { className: 'dshw_balLine' },
        React.createElement('span', { className: 'dshw_muted' }, t('chip.balance')),
        React.createElement('span', { className: 'dshw_balNum' }, fmtCurrency(first.total_balance, first.currency)),
        low ? React.createElement('span', { className: 'dshw_balWarn', title: t('chip.belowThresholdPrefix') + fmtCurrency(snapshot.threshold !== undefined ? snapshot.threshold : 0, bal.currency || 'CNY') }, t('settings.lowBalance')) : null),
      React.createElement('div', { className: 'dshw_balSub' },
        sessionCostLabel(bal.currency, t) + ' ' + (official.cost === null ? '--' : sessionCostText(official.cost, bal.currency)),
        React.createElement('span', { className: 'dshw_balDot' }, '\u00b7'),
        subParts))
  }

  // All controls in one bordered card with compact rows; the threshold
  // input carries its own save button so the action row stays two items.
  function settingsCard() {
    var cells = []
    cells.push(React.createElement('div', { key: 'vis', className: 'dshw_setCell' },
      React.createElement('span', { className: 'dshw_muted' }, t('settings.displayContent')),
      React.createElement('span', { className: 'dshw_balFill' }),
      React.createElement('label', { className: 'dshw_chipToggle' },
        React.createElement('input', {
          type: 'checkbox',
          checked: showOfficial,
          disabled: showOfficial && !showThird,
          'aria-label': t('settings.showOfficialData'),
          onChange: function (event) { saveDataVisibility({ official: event.target.checked, third: showThird }) }
        }),
        React.createElement('span', null, t('settings.official'))),
      React.createElement('label', { className: 'dshw_chipToggle' },
        React.createElement('input', {
          type: 'checkbox',
          checked: showThird,
          disabled: showThird && !showOfficial,
          'aria-label': t('settings.showThirdPartyTokens'),
          onChange: function (event) { saveDataVisibility({ official: showOfficial, third: event.target.checked }) }
        }),
        React.createElement('span', null, t('settings.thirdParty')))))
    cells.push(React.createElement('div', { key: 'sc', className: 'dshw_setCell' }, scaleControl))
    // Completion reminder + low-balance threshold share a row (fits 276px with no save button).
    cells.push(React.createElement('div', { key: 'nfth', className: 'dshw_setCell', style: { gap: '5px' } },
      React.createElement('span', { className: 'dshw_muted', style: { flex: 'none' } }, t('chip.alert')),
      React.createElement('select', {
        className: 'dshw_select',
        style: { flex: '0 0 auto' },
        value: notifyConfig.enabled ? (notifyConfig.timeout === 0 ? 'keep' : String(notifyConfig.timeout)) : 'off',
        'aria-label': t('settings.completionAlert'),
        onChange: function (event) {
          var v = event.target.value
          if (v === 'off') { saveNotifyConfig({ enabled: false, timeout: notifyConfig.timeout }); return }
          saveNotifyConfig({ enabled: true, timeout: v === 'keep' ? 0 : Number.parseInt(v, 10) })
          requestNotify()
        }
      },
        React.createElement('option', { value: 'off' }, t('settings.off')),
        React.createElement('option', { value: '5' }, t('settings.seconds5')),
        React.createElement('option', { value: '10' }, t('settings.seconds10')),
        React.createElement('option', { value: '30' }, t('settings.seconds30')),
        React.createElement('option', { value: '60' }, t('settings.seconds60')),
        React.createElement('option', { value: 'keep' }, t('settings.keepForever'))),
      React.createElement('span', { className: 'dshw_balFill' }),
      React.createElement('span', { className: 'dshw_muted', style: { flex: 'none' } }, t('chip.threshold')),
      React.createElement('input', {
        className: 'dshw_input', type: 'number', min: '0', step: '0.01',
        style: { width: '64px', flex: 'none' },
        value: thresholdDraft,
        disabled: usageLocked,
        title: usageLocked ? t('settings.usageLedgerLockedThreshold') : t('chip.thresholdHint'),
        'aria-label': t('chip.lowBalanceThreshold') + (bal.currency === 'USD' ? 'USD' : 'CNY') + ')',
        onInput: function (event) { setThresholdDraft(event.target.value); queueThresholdSave(event.target.value) },
        onChange: function (event) { setThresholdDraft(event.target.value); queueThresholdSave(event.target.value) }
      })))
    // Low-balance blink + permanent delete share a row.
    cells.push(React.createElement('div', { key: 'blinkpd', className: 'dshw_setCell', style: { gap: '5px' } },
      React.createElement('span', { className: 'dshw_muted', style: { flex: 'none' } }, t('chip.lowBalanceBlink')),
      React.createElement('label', { className: 'dshw_switch' },
        React.createElement('input', {
          type: 'checkbox',
          checked: lowBlinkOn,
          'aria-label': t('chip.lowBalanceBlinkRed'),
          onChange: function (event) {
            try { compatibility.storage.setItem(LOW_BLINK_KEY, String(event.target.checked)) } catch (e) { /* ignore */ }
            compatibility.dispatch(SETTINGS_EVENT)
          }
        }),
        React.createElement('span', { className: 'dshw_track', 'aria-hidden': 'true' }),
        React.createElement('span', { className: 'dshw_knob', 'aria-hidden': 'true' })),
      React.createElement('span', { className: 'dshw_balFill' }),
      React.createElement('span', { className: 'dshw_muted', style: { flex: 'none' } }, permanentDeleteSupported ? t('chip.permanentDelete') : t('chip.permanentDeleteUnsupported')),
      React.createElement('label', { className: 'dshw_switch' },
        React.createElement('input', {
          type: 'checkbox',
          checked: permanentDeleteSupported && permanentDeleteEnabled,
          disabled: !permanentDeleteSupported,
          'aria-label': t('settings.enablePermanentDelete'),
          title: permanentDeleteSupported ? t('settings.showPermanentDelete') : t('settings.hostNoPermanentDelete'),
          onChange: function (event) {
            if (!permanentDeleteSupported) return
            var enabled = event.target.checked
            setPermanentDeleteEnabled(enabled)
            try { compatibility.storage.setItem(PERMANENT_DELETE_KEY, String(enabled)) } catch (e) { /* ignore */ }
            compatibility.dispatch(PERMANENT_DELETE_EVENT)
          }
        }),
        React.createElement('span', { className: 'dshw_track', 'aria-hidden': 'true' }),
        React.createElement('span', { className: 'dshw_knob', 'aria-hidden': 'true' }))))
    return React.createElement('div', { className: 'dshw_setCard' }, cells)
  }

  var panel = React.createElement('div', {
    ref: panelRef,
    className: 'dshw_panel',
    style: panelStyle,
    role: 'dialog',
    'aria-label': panelProviderMode.kind === 'zai' ? t('panel.titleZai') : panelProviderMode.kind === 'third' ? t('panel.titleThird', { provider: providerDisplayName(panelProviderMode, t) }) : t('panel.title'),
    onClick: function (e) { e.stopPropagation() }
  },
    floatBtnRow,
    providerSwitcher,
    panelShowDeepSeek ? React.createElement(React.Fragment, null,
      React.createElement('div', { className: 'dshw_title' }, (snapshot.accounts && snapshot.accounts.activeName) ? t('chip.officialDeepSeekPrefix') + snapshot.accounts.activeName : t('chip.officialDeepSeek')),
      balanceCard(),
      official.tokens ? React.createElement('div', { key: 'o-t', className: 'dshw_row' },
        React.createElement('span', { className: 'dshw_muted' }, t('chip.officialToken')),
        React.createElement('span', null, t('chip.tokensInputPrefix') + fmtTokens(official.tokens.input) + t('chip.cacheReadPrefix') + fmtTokens(official.tokens.cacheRead) + t('chip.outputPrefix') + fmtTokens(official.tokens.output))) : null,
      React.createElement('div', { className: 'dshw_divider' })) : null,
    showThird ? React.createElement(React.Fragment, null,
      React.createElement('div', { className: 'dshw_title' }, panelProviderMode.kind === 'zai' ? t('chip.zaiThirdPartySessionTokens') : panelProviderMode.kind === 'third' ? providerDisplayName(panelProviderMode, t) + t('chip.sessionTokensSuffix') : t('chip.thirdPartyTotal')),
      thirdRows,
      React.createElement('div', { className: 'dshw_divider' })) : null,
    panelShowDeepSeek ? settingsCard() : React.createElement('div', { className: 'dshw_setCard' },
      React.createElement('div', { className: 'dshw_setCell' }, scaleControl),
      React.createElement('div', { className: 'dshw_setCell' }, notifyControl),
      React.createElement('div', { className: 'dshw_setCell' }, permanentDeleteControl)),
    usageLockNotice,
    panelShowDeepSeek ? React.createElement(React.Fragment, null,
      React.createElement('div', { className: 'dshw_actionRow', style: { gridTemplateColumns: '1fr 1fr 1fr' } },
        React.createElement('button', {
          type: 'button',
          className: 'dshw_btn dshw_btnPrimary',
          onClick: onRechargeClick
        }, t('panel.rechargeShort')),
        React.createElement('button', { type: 'button', className: 'dshw_btn', onClick: refreshBalance }, t('settings.refreshBalance')),
        React.createElement('button', {
          type: 'button',
          className: 'dshw_btn',
          disabled: usageLocked,
          style: { color: 'var(--dsw-alias-state-error-primary,#e5534b)' },
          title: usageLocked ? t('chip.ledgerLockedClear') : t('chip.clearSessionDataTooltip'),
          onClick: function () {
            if (window.confirm(t('chip.clearSessionDataConfirm'))) clearSession()
          }
        }, t('chip.clear'))),
      React.createElement('div', { className: 'dshw_divider' })) : null,
    React.createElement(UsageHistoryPanel, { key: 'history', sessionId: sessionId, t: t }),
    panelShowZai ? React.createElement(PlanUsagePanel, { key: 'plans-compact', compact: true, provider: panelProviderMode.provider, t: t }) : null,
    panelShowDeepSeek ? accountsSection() : null,
    React.createElement('div', { style: { marginTop: '8px', textAlign: 'right', fontSize: '10px', color: 'var(--dsw-alias-label-secondary,var(--dsw-alias-label-tertiary,#667085))', userSelect: 'none' } }, 'Harness Control Center v' + WALLET_VERSION)
  )

  if (floated) {
    if (minimized) {
      var dotPos = floatPos || readSavedPos(36, 36) || { x: Math.max(4, window.innerWidth - 52), y: 80 }
      var dot = React.createElement('button', {
        ref: floatRef,
        type: 'button',
        className: low ? 'dshw_dot dshw_dotLow' : 'dshw_dot',
        style: { left: dotPos.x, top: dotPos.y },
        title: t('chip.walletClickExpand'),
        'aria-label': t('chip.aria'),
        onPointerDown: onFloatDown,
        onClick: function () { if (didDragRef.current !== true) setMinimized(false) }
      }, activeProviderMode.kind === 'zai' ? planTokenRemaining : showDeepSeek ? (bal.total === null || bal.total === undefined ? '--' : fmtCurrency(bal.total, bal.currency)) : fmtTokens(thirdTokens))
      return React.createElement(React.Fragment, null, dot, confirmOverlay)
    }
    var winPos = floatPos || readSavedPos(306, 340) || { x: Math.max(4, window.innerWidth - 322), y: 80 }
    var floatPanel = React.createElement('div', {
      ref: floatRef,
      className: 'dshw_float',
      style: { left: winPos.x, top: winPos.y },
      role: 'dialog',
      'aria-label': panelProviderMode.kind === 'zai' ? t('panel.floatTitleZai') : panelShowDeepSeek ? t('panel.floatTitle') : t('panel.floatTitleThird', { provider: providerDisplayName(panelProviderMode, t) })
    },
      React.createElement('div', { className: 'dshw_floatHeader', onPointerDown: onFloatDown },
        React.createElement('span', { title: t('chip.dragByTitleBar') }, t('chip.walletHoldToDrag')),
        React.createElement('span', null,
          React.createElement('button', {
            type: 'button',
            className: 'dshw_floatBtn',
            title: t('chip.minimizeToDot'),
            onClick: function (e) { e.stopPropagation(); setMinimized(true) }
          }, '–'),
          React.createElement('button', {
            type: 'button',
            className: 'dshw_floatBtn',
            style: { marginLeft: '4px' },
            title: t('chip.collapseTabMode'),
            onClick: function (e) { e.stopPropagation(); setFloated(false); setMinimized(false); setOpen(false) }
          }, '×'))),
      providerSwitcher,
      panelShowDeepSeek ? React.createElement(React.Fragment, null,
        balanceRows,
        officialRows,
        React.createElement('div', { className: 'dshw_divider' })) : null,
      showThird ? React.createElement(React.Fragment, null,
        thirdRows,
        React.createElement('div', { className: 'dshw_divider' })) : null,
      panelShowDeepSeek ? visibilityControl : null,
      scaleControl,
      notifyControl,
      permanentDeleteControl,
      usageLockNotice,
      panelShowDeepSeek ? React.createElement(React.Fragment, null,
        React.createElement('div', { className: 'dshw_row' },
          React.createElement('span', { className: 'dshw_muted' }, t('chip.thresholdShortPrefix') + (bal.currency || 'CNY') + t('chip.thresholdZeroOff')),
          thresholdInput),
        React.createElement('div', { className: 'dshw_row' },
          React.createElement('button', { type: 'button', className: 'dshw_btn', onClick: refreshBalance }, t('history.refresh')),
          React.createElement('button', { type: 'button', className: 'dshw_btn dshw_btnPrimary', disabled: usageLocked, onClick: saveThreshold }, t('settings.save'))),
        React.createElement('button', {
          type: 'button',
          className: 'dshw_btn dshw_btnPrimary',
          style: { textAlign: 'center' },
          onClick: onRechargeClick
        }, t('panel.rechargeShort'))) : null,
      React.createElement('button', {
        type: 'button',
        className: 'dshw_btn', style: { width: '100%' },
        disabled: usageLocked,
        title: usageLocked ? t('chip.ledgerLockedClear') : undefined,
        onClick: function () {
          if (window.confirm(t('chip.clearSessionDataConfirm'))) clearSession()
        }
      }, panelShowDeepSeek ? t('chip.clearBalanceAndTokens') : t('chip.clearSessionTokens')),
      React.createElement('div', { className: 'dshw_divider' }),
      React.createElement(UsageHistoryPanel, { key: 'history-float', sessionId: sessionId, t: t }),
      panelShowZai ? React.createElement(PlanUsagePanel, { key: 'plans-float', compact: true, provider: panelProviderMode.provider, t: t }) : null,
      panelShowDeepSeek ? accountsSection() : null,
      React.createElement('div', { style: { marginTop: '8px', textAlign: 'right', fontSize: '10px', color: 'var(--dsw-alias-label-secondary,var(--dsw-alias-label-tertiary,#667085))', userSelect: 'none' } }, 'Harness Control Center v' + WALLET_VERSION)
    )
    return React.createElement(React.Fragment, null, floatPanel, confirmOverlay)
  }
  var renderedPanel = ReactDOM && typeof ReactDOM.createPortal === 'function' && typeof document !== 'undefined' && document.body
    ? ReactDOM.createPortal(panel, document.body)
    : panel
  return React.createElement(React.Fragment, null, chipHost, snapPreviewElement, renderedPanel, confirmOverlay)
}

// The i18n probe in registerWalletLocale() reads ctx.locale; reading an
// undeclared service throws in cordis, so this declaration is what makes the
// fallback reachable instead of aborting the whole plugin boot.
var inject = ['slots', 'sessions', 'modelDirectories', 'remote', 'remote.session', 'locale']

function apply(ctx) {
  // Registers the dictionary pair and answers whether this host actually has a
  // locale service. `hasLocale` gates the `locale:` seat on every slot below:
  // declaring it without a face installed makes the renderer throw
  // SlotAssemblyError and abort the whole plugin boot.
  var i18n = registerWalletLocale(ctx)
  var t = i18n.t

  ctx.inject(['sessions'], function (scope) {
    scope.effect(function () { return installCompletionNotifier(scope) }, 'dsh-wallet: completion notifications')
    scope.effect(function () { return installMaidModelMenuGuard() }, 'dsh-wallet: maid model-menu repaint guard')
    scope.effect(function () { return installPersistentPreferenceSync() }, 'dsh-wallet: durable preference sync')
  })
  ctx.inject(['slots', 'conversation', 'modelDirectories', 'remote', 'remote.session'], function (scope) {
    scope.effect(function () {
      var chipDef = {
        name: 'conversation.input.left',
        id: 'wallet',
        order: 130,
        inject: function (sessionId) {
          var directory = scope.modelDirectories.directoryFor(sessionId)
          return {
            modelAware: true,
            modelDirectory: directory
          }
        }
      }
      if (i18n.hasLocale) chipDef.locale = i18n.ns
      return scope.slots.register(chipDef, WalletChip)
    }, 'dsh-wallet: chip registration')
  })
  // Host settings panel section (dsh rc.7 settings cards): order 40 sits
  // right below the vision-toolkit section (order 30) contributed by
  // another plugin. Registered only when the host exposes the slots API
  // root, so older hosts without settings cards keep loading the wallet.
  if (ctx.slots && typeof ctx.slots.inject === 'function') {
    ctx.slots.inject('settings.section', function () {
      var sectionDef = {
        name: 'settings.section',
        id: 'wallet',
        order: 40,
        label: function () { return t('settings.nav') },
        inject: function () {
          return {
            modelAware: true,
            sessionsService: ctx.sessions,
            modelDirectories: ctx.modelDirectories
          }
        }
      }
      if (i18n.hasLocale) sectionDef.locale = i18n.ns
      return ctx.slots.register(sectionDef, WalletSettingsSection)
    })
    try {
      ctx.slots.inject('sidebar.footer.action', function () {
        var ringDef = {
          name: 'sidebar.footer.action',
          id: 'wallet-peak-ring',
          order: 50,
          inject: function () {
            return {
              modelAware: true,
              sessionsService: ctx.sessions,
              modelDirectories: ctx.modelDirectories
            }
          }
        }
        if (i18n.hasLocale) ringDef.locale = i18n.ns
        return ctx.slots.register(ringDef, PeakRingFooter)
      })
    } catch (e) { /* host without the sidebar footer slot */ }
  }
}

exports.apply = apply
exports.inject = inject
exports.__testing = {
  chooseChipDock: chooseChipDock,
  clampFreeDrop: clampFreeDrop,
  clampPosition: clampPosition,
  computeSnapPreview: computeSnapPreview,
  computeSideDockX: computeSideDockX,
  computePanelPosition: computePanelPosition,
  clampPeakPosition: clampPeakPosition,
  createCompatibilityAdapter: createCompatibilityAdapter,
  fmtCurrency: fmtCurrency,
  selectBalanceInfo: selectBalanceInfo,
  balanceErrorText: balanceErrorText,
  installCompletionNotifier: installCompletionNotifier,
  hydratePersistentPreferences: hydratePersistentPreferences,
  flushPersistentPreferences: flushPersistentPreferences,
  normalizeDataVisibility: normalizeDataVisibility,
  normalizeNotifyConfig: normalizeNotifyConfig,
  normalizeChipLayout: normalizeChipLayout,
  normalizeChipScale: normalizeChipScale,
  normalizeChipStyle: normalizeChipStyle,
  peakClockState: peakClockState,
  wallHourIn: wallHourIn,
  peakRingSVG: peakRingSVG,
  PeakRingFooter: PeakRingFooter,
  WalletChip: WalletChip,
  WalletSettingsSection: WalletSettingsSection,
  PlanUsagePanel: PlanUsagePanel,
  planErrorText: planErrorText,
  providerModeFor: providerModeFor,
  peakClockAppliesFor: peakClockAppliesFor,
  UsageHistoryPanel: UsageHistoryPanel,
  settleDotPosition: settleDotPosition
}
