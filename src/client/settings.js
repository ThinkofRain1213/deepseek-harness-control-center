function WalletSettingsSection(props) {
  props = props || {}
  // `t` arrives through the renderer's locale seat when the slot registration
  // declared `locale:`; the dictionary fallback keeps older hosts working.
  var t = typeof props.t === 'function' ? props.t : walletT
  var close = typeof props.close === 'function' ? props.close : null
  var settingsSectionRef = React.useRef(null)
  var [snapshot, setSnapshot] = React.useState(null)
  var [health, setHealth] = React.useState(null)
  var [healthNotice, setHealthNotice] = React.useState(null)
  var [thresholdDraft, setThresholdDraft] = React.useState('')
  var [thresholdNotice, setThresholdNotice] = React.useState(null)
  var [accounts, setAccounts] = React.useState(null)
  var [accountsError, setAccountsError] = React.useState(null)
  var [accountNotice, setAccountNotice] = React.useState(null)
  var [nameDraft, setNameDraft] = React.useState('')
  var [keyDraft, setKeyDraft] = React.useState('')
  var [switchingId, setSwitchingId] = React.useState(null)
  var [priceRules, setPriceRules] = React.useState([])
  var [knownPriceRoutes, setKnownPriceRoutes] = React.useState([])
  var [priceNotice, setPriceNotice] = React.useState(null)
  var [priceDraft, setPriceDraft] = React.useState({
    provider: '', model: '', currency: 'CNY', input: '', cacheRead: '', cacheWrite: '', output: '',
    timezone: 'Asia/Shanghai', windows: []
  })
  var [visibility, setVisibility] = React.useState(function () {
    try {
      var saved = compatibility.storage.getItem(DATA_VISIBILITY_KEY)
      return saved === null ? normalizeDataVisibility(null) : normalizeDataVisibility(JSON.parse(saved))
    } catch (e) { return normalizeDataVisibility(null) }
  })
  var [chipStyle, setChipStyle] = React.useState(function () {
    try { return normalizeChipStyle(compatibility.storage.getItem(CHIP_STYLE_KEY)) } catch (e) { return 'standard' }
  })
  var [balanceOnly, setBalanceOnly] = React.useState(readBalanceOnly)
  var [scale, setScale] = React.useState(function () {
    try { return normalizeChipScale(compatibility.storage.getItem(CHIP_SCALE_KEY)) } catch (e) { return 1 }
  })
  var [scaleMax, setScaleMax] = React.useState(125)
  var [notifyEnabled, setNotifyEnabled] = React.useState(function () { return readNotifyConfig().enabled })
  var [notifyTimeout, setNotifyTimeout] = React.useState(function () {
    var cfg = readNotifyConfig()
    return cfg.timeout === 0 ? 'keep' : String(cfg.timeout)
  })
  var [lowBlinkEnabled, setLowBlinkEnabled] = React.useState(function () {
    try { return compatibility.storage.getItem(LOW_BLINK_KEY) !== 'false' } catch (e) { return true }
  })
  var [pdEnabled, setPdEnabled] = React.useState(function () {
    try { return compatibility.storage.getItem(PERMANENT_DELETE_KEY) === 'true' } catch (e) { return false }
  })
  var [pdSupported, setPdSupported] = React.useState(function () {
    return compatibility.hasCapability('permanentDelete')
  })
  var [ringEnabled, setRingEnabled] = React.useState(function () {
    try { return compatibility.storage.getItem(PEAK_RING_KEY) !== 'false' } catch (e) { return true }
  })
  var [peakNotifyEnabled, setPeakNotifyEnabled] = React.useState(function () {
    try { return compatibility.storage.getItem(PEAK_NOTIFY_KEY) === 'true' } catch (e) { return false }
  })
  var [peakOrient, setPeakOrient] = React.useState(function () {
    try { return compatibility.storage.getItem(PEAK_ORIENT_KEY) || 'horizontal' } catch (e) { return 'horizontal' }
  })
  var [peakBackground, setPeakBackground] = React.useState(function () {
    try { return normalizePeakBackground(compatibility.storage.getItem(PEAK_BACKGROUND_KEY)) } catch (e) { return 'transparent' }
  })
  var [peakRecharge, setPeakRecharge] = React.useState(function () {
    try { return compatibility.storage.getItem(PEAK_RECHARGE_KEY) !== 'false' } catch (e) { return true }
  })
  var [peakScale, setPeakScale] = React.useState(function () {
    try {
      var val = Number.parseFloat(compatibility.storage.getItem(PEAK_SCALE_KEY))
      return Number.isFinite(val) ? Math.min(1.2, Math.max(1.0, val)) : 1.0
    } catch (e) { return 1.0 }
  })
  var [peakDock, setPeakDock] = React.useState(function () {
    try { return compatibility.storage.getItem(PEAK_DOCK_KEY) || 'sidebar' } catch (e) { return 'sidebar' }
  })
  var settingsModelSelection = useCurrentModelSelection(props.sessionsService, props.modelDirectories, props.modelAware === true)
  React.useEffect(function () {
    if (typeof window.addEventListener !== 'function') return
    function syncPreferencesFromStorage() {
      try {
        var savedVisibility = compatibility.storage.getItem(DATA_VISIBILITY_KEY)
        setVisibility(savedVisibility === null ? normalizeDataVisibility(null) : normalizeDataVisibility(JSON.parse(savedVisibility)))
      } catch (e) { /* ignore */ }
      try { setChipStyle(normalizeChipStyle(compatibility.storage.getItem(CHIP_STYLE_KEY))) } catch (e) { /* ignore */ }
      try { setBalanceOnly(readBalanceOnly()) } catch (e) { /* ignore */ }
      try { setScale(normalizeChipScale(compatibility.storage.getItem(CHIP_SCALE_KEY))) } catch (e) { /* ignore */ }
      try {
        var notify = readNotifyConfig()
        setNotifyEnabled(notify.enabled)
        setNotifyTimeout(notify.timeout === 0 ? 'keep' : String(notify.timeout))
      } catch (e) { /* ignore */ }
      try { setLowBlinkEnabled(compatibility.storage.getItem(LOW_BLINK_KEY) !== 'false') } catch (e) { /* ignore */ }
      try { setPdEnabled(compatibility.storage.getItem(PERMANENT_DELETE_KEY) === 'true') } catch (e) { /* ignore */ }
      try { setRingEnabled(compatibility.storage.getItem(PEAK_RING_KEY) !== 'false') } catch (e) { /* ignore */ }
      try { setPeakNotifyEnabled(compatibility.storage.getItem(PEAK_NOTIFY_KEY) === 'true') } catch (e) { /* ignore */ }
      try { setPeakOrient(compatibility.storage.getItem(PEAK_ORIENT_KEY) || 'horizontal') } catch (e) { /* ignore */ }
      try { setPeakBackground(normalizePeakBackground(compatibility.storage.getItem(PEAK_BACKGROUND_KEY))) } catch (e) { /* ignore */ }
      try { setPeakRecharge(compatibility.storage.getItem(PEAK_RECHARGE_KEY) !== 'false') } catch (e) { /* ignore */ }
      try {
        var savedPeakScale = Number.parseFloat(compatibility.storage.getItem(PEAK_SCALE_KEY))
        setPeakScale(Number.isFinite(savedPeakScale) ? Math.min(1.2, Math.max(1, savedPeakScale)) : 1)
      } catch (e) { /* ignore */ }
      try { setPeakDock(compatibility.storage.getItem(PEAK_DOCK_KEY) || 'sidebar') } catch (e) { /* ignore */ }
    }
    window.addEventListener(SETTINGS_EVENT, syncPreferencesFromStorage)
    return function () { window.removeEventListener(SETTINGS_EVENT, syncPreferencesFromStorage) }
  }, [])
  useLayoutEffect(function () {
    var node = settingsSectionRef.current
    var dialog = node && typeof node.closest === 'function' ? node.closest('[role="dialog"]') : null
    if (!dialog || !dialog.classList) return
    dialog.classList.add('dshw_settingsHostDialog')
    return function () { dialog.classList.remove('dshw_settingsHostDialog') }
  }, [])
  React.useEffect(function () {
    if (typeof window.addEventListener !== 'function') return
    function refreshCap() { setPdSupported(compatibility.hasCapability('permanentDelete')) }
    window.addEventListener(HOST_CAPABILITY_EVENT, refreshCap)
    refreshCap()
    return function () { window.removeEventListener(HOST_CAPABILITY_EVENT, refreshCap) }
  }, [])

  React.useEffect(function () {
    var stopped = false
    function refresh() {
      fetch('/api/wallet/snapshot').then(function (resp) { return resp.json() }).then(function (json) {
        if (!stopped && json && json.ok) {
          setSnapshot(json)
          var providerState = json.providers || {}
          setPriceRules(Array.isArray(providerState.customPrices) ? providerState.customPrices : [])
          setKnownPriceRoutes(Array.isArray(providerState.knownRoutes) ? providerState.knownRoutes : [])
          setThresholdDraft(json.threshold !== undefined && json.threshold !== null ? json.threshold.toFixed(2) : '')
        }
      }).catch(function () { /* ignore */ })
    }
    refresh()
    fetch('/api/wallet/accounts').then(function (resp) { return resp.json() }).then(function (json) {
      if (!stopped && json && json.ok) {
        setAccounts(json)
        setAccountsError(json.storage && json.storage.locked ? t('settings.accountEncryptedFileLocked') : null)
      }
    }).catch(function () { if (!stopped) setAccountsError(t('settings.accountApiUnavailable')) })
    fetch('/api/wallet/health').then(function (resp) { return resp.json() }).then(function (json) {
      if (!stopped && json && json.ok) setHealth(json)
    }).catch(function () { if (!stopped) setHealthNotice(t('settings.healthCheckUnavailable')) })
    try {
      var savedLayout = compatibility.storage.getItem(CHIP_LAYOUT_KEY)
      var dock = savedLayout === null ? 'home' : normalizeChipLayout(JSON.parse(savedLayout)).dock
      setScaleMax(dock === 'home' ? 105 : 125)
    } catch (e) { /* ignore */ }
    return function () { stopped = true }
  }, [])

  function refreshHealth() {
    setHealthNotice(t('settings.checkingHealth'))
    fetch('/api/wallet/health').then(function (resp) { return resp.json() }).then(function (json) {
      if (json && json.ok) { setHealth(json); setHealthNotice(t('settings.healthCheckComplete')) }
      else setHealthNotice(t('settings.healthCheckFailed'))
    }).catch(function () { setHealthNotice(t('settings.healthCheckFailed')) })
  }

  function refreshPricing() {
    setHealthNotice(t('settings.syncingOfficialPricing'))
    fetch('/api/wallet/pricing/refresh', { method: 'POST' }).then(function (resp) { return resp.json() }).then(function (json) {
      if (json && json.ok) {
        setHealth(function (current) { return current ? Object.assign({}, current, { pricing: json.pricing }) : current })
        setHealthNotice(json.pricing && json.pricing.status === 'synced' ? t('settings.officialPricingSynced') : t('settings.keptBuiltinPricingPendingReview'))
      } else setHealthNotice(t('settings.pricingSyncFailed'))
    }).catch(function () { setHealthNotice(t('settings.pricingSyncFailed')) })
  }

  function copyDiagnostics() {
    if (!health) return
    var safe = {
      plugin: health.plugin,
      host: health.host,
      pricing: health.pricing && {
        status: health.pricing.status,
        ruleVersion: health.pricing.ruleVersion,
        checkedAt: health.pricing.checkedAt,
        modelCount: health.pricing.modelCount,
      },
      accounts: health.accounts && {
        encryptedAtRest: health.accounts.encryptedAtRest,
        scheme: health.accounts.scheme,
        status: health.accounts.status,
      },
      usage: health.usage && {
        status: health.usage.status,
        locked: health.usage.locked,
        recovered: health.usage.recovered,
        backup: health.usage.backup,
        retentionDays: health.usage.retentionDays,
      },
      runtime: health.runtime && { node: health.runtime.node, platform: health.runtime.platform },
    }
    var text = JSON.stringify(safe, null, 2)
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(text).then(function () { setHealthNotice(t('settings.diagnosticsCopied')) }).catch(function () { setHealthNotice(t('settings.copyFailed')) })
        return
      }
    } catch (e) { /* fall through to the message */ }
    setHealthNotice(t('settings.autoCopyUnsupported'))
  }

  function persistVisibility(next) {
    next = normalizeDataVisibility(next)
    setVisibility(next)
    try { compatibility.storage.setItem(DATA_VISIBILITY_KEY, JSON.stringify(next)) } catch (e) { /* ignore */ }
    compatibility.dispatch(SETTINGS_EVENT)
  }

  function persistChipStyle(next) {
    next = normalizeChipStyle(next)
    setChipStyle(next)
    try { compatibility.storage.setItem(CHIP_STYLE_KEY, next) } catch (e) { /* ignore */ }
    compatibility.dispatch(SETTINGS_EVENT)
  }

  function persistBalanceOnly(next) {
    next = next === true
    setBalanceOnly(next)
    try { compatibility.storage.setItem(CHIP_BALANCE_ONLY_KEY, String(next)) } catch (e) { /* ignore */ }
    compatibility.dispatch(SETTINGS_EVENT)
  }

  function persistScale(next) {
    next = normalizeChipScale(next)
    if (next > scaleMax / 100) next = scaleMax / 100
    setScale(next)
    try { compatibility.storage.setItem(CHIP_SCALE_KEY, String(next)) } catch (e) { /* ignore */ }
    compatibility.dispatch(SETTINGS_EVENT)
  }

  var thresholdSaveTimerRef = React.useRef(null)
  function queueThresholdSave(value) {
    if (thresholdSaveTimerRef.current) clearTimeout(thresholdSaveTimerRef.current)
    thresholdSaveTimerRef.current = setTimeout(function () { saveThreshold(value) }, 600)
  }

  function persistNotify(enabled, timeout) {
    var timeoutSeconds = timeout === 'keep' ? 0 : Number.parseInt(timeout, 10)
    if ([0, 5, 10, 30, 60].indexOf(timeoutSeconds) === -1) timeoutSeconds = 10
    try {
      compatibility.storage.setItem(NOTIFY_CONFIG_KEY, JSON.stringify({ enabled: enabled, timeout: timeoutSeconds }))
    } catch (e) { /* ignore */ }
    setNotifyEnabled(enabled)
    setNotifyTimeout(timeoutSeconds === 0 ? 'keep' : String(timeoutSeconds))
    compatibility.dispatch(NOTIFY_CONFIG_EVENT)
  }

  function persistLowBlink(enabled) {
    enabled = enabled === true
    setLowBlinkEnabled(enabled)
    try { compatibility.storage.setItem(LOW_BLINK_KEY, String(enabled)) } catch (e) { /* ignore */ }
    compatibility.dispatch(SETTINGS_EVENT)
  }

  function persistPeakOrient(next) {
    setPeakOrient(next)
    try { compatibility.storage.setItem(PEAK_ORIENT_KEY, next) } catch (e) { /* ignore */ }
    compatibility.dispatch(SETTINGS_EVENT)
    compatibility.dispatch(PEAK_RING_EVENT)
  }

  function persistPeakBackground(next) {
    next = normalizePeakBackground(next)
    setPeakBackground(next)
    try { compatibility.storage.setItem(PEAK_BACKGROUND_KEY, next) } catch (e) { /* ignore */ }
    compatibility.dispatch(SETTINGS_EVENT)
    compatibility.dispatch(PEAK_RING_EVENT)
  }

  function persistPeakRecharge(next) {
    setPeakRecharge(next)
    try { compatibility.storage.setItem(PEAK_RECHARGE_KEY, String(next)) } catch (e) { /* ignore */ }
    compatibility.dispatch(SETTINGS_EVENT)
    compatibility.dispatch(PEAK_RING_EVENT)
  }

  function persistPeakScale(next) {
    var num = Math.min(1.2, Math.max(1.0, next))
    setPeakScale(num)
    try { compatibility.storage.setItem(PEAK_SCALE_KEY, String(num)) } catch (e) { /* ignore */ }
    compatibility.dispatch(SETTINGS_EVENT)
    compatibility.dispatch(PEAK_RING_EVENT)
  }

  function resetPeakDock() {
    setPeakDock('sidebar')
    try {
      compatibility.storage.setItem(PEAK_DOCK_KEY, 'sidebar')
      compatibility.storage.removeItem(PEAK_POS_KEY)
    } catch (e) { /* ignore */ }
    compatibility.dispatch(SETTINGS_EVENT)
    compatibility.dispatch(PEAK_RING_EVENT)
  }

  function saveThreshold(valueArg) {
    if (usageLocked) { setThresholdNotice(t('settings.usageLedgerLockedCannotSave')); return }
    var value = Number.parseFloat(valueArg !== undefined ? valueArg : thresholdDraft)
    if (!Number.isFinite(value)) return
    value = Math.min(100000, Math.max(0, Math.round(value * 100) / 100))
    fetch('/api/wallet/threshold', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ threshold: value, currency: (snapshot && snapshot.balance && snapshot.balance.currency) || 'CNY' })
    }).then(function (resp) { return resp.json() }).then(function (json) {
      if (json && json.ok) {
        setThresholdDraft(json.threshold.toFixed(2))
        setThresholdNotice(t('settings.saved'))
        if (snapshot) { snapshot.threshold = json.threshold; setSnapshot(Object.assign({}, snapshot)) }
      }
    }).catch(function () { setThresholdNotice(t('settings.saveFailed')) })
  }

  function applyCustomPriceResponse(json) {
    if (!json || json.ok !== true) return false
    setPriceRules(Array.isArray(json.rules) ? json.rules : [])
    setKnownPriceRoutes(Array.isArray(json.knownRoutes) ? json.knownRoutes : [])
    return true
  }

  function saveCustomPrice() {
    if (usageLocked) { setPriceNotice(t('settings.usageLedgerLockedCannotSave')); return }
    var numeric = ['input', 'cacheRead', 'cacheWrite', 'output'].reduce(function (out, key) {
      var value = Number.parseFloat(priceDraft[key])
      out[key] = Number.isFinite(value) && value >= 0 ? value : null
      return out
    }, {})
    if (!priceDraft.provider.trim() || !priceDraft.model.trim() || Object.values(numeric).some(function (value) { return value === null })) {
      setPriceNotice(t('settings.fillProviderModelAndPrices'))
      return
    }
    var windows = (Array.isArray(priceDraft.windows) ? priceDraft.windows : []).map(function (window) {
      var rates = ['input', 'cacheRead', 'cacheWrite', 'output'].reduce(function (out, key) {
        var value = Number.parseFloat(window[key])
        out[key] = Number.isFinite(value) && value >= 0 ? value : null
        return out
      }, {})
      return {
        label: String(window.label || '').trim(),
        days: Array.isArray(window.days) ? window.days.slice() : [],
        start: window.start,
        end: window.end,
        input: rates.input,
        cacheRead: rates.cacheRead,
        cacheWrite: rates.cacheWrite,
        output: rates.output
      }
    })
    if (windows.some(function (window) {
      return !window.label || window.days.length === 0 || !/^([01]\d|2[0-3]):[0-5]\d$/.test(window.start || '') || !/^([01]\d|2[0-3]):[0-5]\d$/.test(window.end || '') || window.start === window.end || ['input', 'cacheRead', 'cacheWrite', 'output'].some(function (key) { return window[key] === null })
    })) {
      setPriceNotice(t('settings.fillWindowFieldsComplete'))
      return
    }
    setPriceNotice(t('settings.saving'))
    fetch('/api/wallet/custom-prices', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ rule: {
        provider: priceDraft.provider.trim(),
        model: priceDraft.model.trim(),
        currency: priceDraft.currency,
        input: numeric.input,
        cacheRead: numeric.cacheRead,
        cacheWrite: numeric.cacheWrite,
        output: numeric.output,
        timezone: String(priceDraft.timezone || '').trim(),
        windows: windows
      } })
    }).then(function (resp) { return resp.json().then(function (json) { return { ok: resp.ok, json: json } }) }).then(function (result) {
      if (!result.ok || !applyCustomPriceResponse(result.json)) throw new Error(result.json && result.json.error ? result.json.error : 'save-failed')
      setPriceNotice(t('settings.priceSavedReestimated'))
    }).catch(function (error) {
      setPriceNotice(error && error.message === 'official-provider-not-allowed' ? t('settings.officialProviderNoThirdPartyPrice') : t('settings.priceSaveFailedCheckWindows'))
    })
  }

  function removeCustomPrice(rule) {
    if (usageLocked) return
    setPriceNotice(t('settings.deleting'))
    fetch('/api/wallet/custom-prices', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ provider: rule.provider, model: rule.model })
    }).then(function (resp) { return resp.json().then(function (json) { return { ok: resp.ok, json: json } }) }).then(function (result) {
      if (!result.ok || !applyCustomPriceResponse(result.json)) throw new Error('delete-failed')
      setPriceNotice(t('settings.priceRuleDeleted'))
    }).catch(function () { setPriceNotice(t('settings.deleteFailed')) })
  }

  function editCustomPrice(rule) {
    setPriceDraft({
      provider: rule.provider,
      model: rule.model,
      currency: rule.currency,
      input: String(rule.input),
      cacheRead: String(rule.cacheRead),
      cacheWrite: String(rule.cacheWrite),
      output: String(rule.output),
      timezone: rule.timezone || 'Asia/Shanghai',
      windows: (Array.isArray(rule.windows) ? rule.windows : []).map(function (window) {
        return {
          label: window.label,
          days: Array.isArray(window.days) ? window.days.slice() : [],
          start: window.start,
          end: window.end,
          input: String(window.input),
          cacheRead: String(window.cacheRead),
          cacheWrite: String(window.cacheWrite),
          output: String(window.output)
        }
      })
    })
    setPriceNotice(t('settings.loadedEditableThenSave'))
  }

  function addCustomPriceWindow() {
    setPriceDraft(function (current) {
      var windows = Array.isArray(current.windows) ? current.windows.slice() : []
      var fallback = function (key) { return current[key] === '' ? '' : String(current[key]) }
      windows.push({
        label: t('settings.windowLabelSuffix') + (windows.length + 1),
        days: [1, 2, 3, 4, 5],
        start: '00:00',
        end: '09:00',
        input: fallback('input'),
        cacheRead: fallback('cacheRead'),
        cacheWrite: fallback('cacheWrite'),
        output: fallback('output')
      })
      return Object.assign({}, current, { windows: windows })
    })
  }

  function updateCustomPriceWindow(index, key, value) {
    setPriceDraft(function (current) {
      var windows = (Array.isArray(current.windows) ? current.windows : []).map(function (window, candidate) {
        return candidate === index ? Object.assign({}, window, (function () { var patch = {}; patch[key] = value; return patch })()) : window
      })
      return Object.assign({}, current, { windows: windows })
    })
  }

  function toggleCustomPriceDay(index, day) {
    setPriceDraft(function (current) {
      var windows = (Array.isArray(current.windows) ? current.windows : []).map(function (window, candidate) {
        if (candidate !== index) return window
        var days = Array.isArray(window.days) ? window.days.slice() : []
        days = days.includes(day) ? days.filter(function (value) { return value !== day }) : days.concat([day])
        return Object.assign({}, window, { days: days })
      })
      return Object.assign({}, current, { windows: windows })
    })
  }

  function removeCustomPriceWindow(index) {
    setPriceDraft(function (current) {
      return Object.assign({}, current, { windows: (Array.isArray(current.windows) ? current.windows : []).filter(function (_, candidate) { return candidate !== index }) })
    })
  }

  function useCurrentRouteForPrice() {
    if (!settingsModelSelection || typeof settingsModelSelection.provider !== 'string' || typeof settingsModelSelection.model !== 'string') {
      setPriceNotice(t('settings.noRecognizableModelInSession'))
      return
    }
    setPriceDraft(function (current) {
      return Object.assign({}, current, {
        provider: settingsModelSelection.provider,
        model: settingsModelSelection.model
      })
    })
    setPriceNotice(t('settings.filledSessionProviderModel'))
  }

  function reloadAccounts() {
    fetch('/api/wallet/accounts').then(function (resp) { return resp.json() }).then(function (json) {
      if (json && json.ok) {
        setAccounts(json)
        setAccountsError(json.storage && json.storage.locked ? t('settings.accountEncryptedFileLocked') : null)
      }
    }).catch(function () { /* ignore */ })
    fetch('/api/wallet/snapshot').then(function (resp) { return resp.json() }).then(function (json) {
      if (json && json.ok) {
        setSnapshot(json)
        // Switching accounts jumps the threshold input to that account currency.
        if (json.threshold !== undefined && json.threshold !== null) setThresholdDraft(json.threshold.toFixed(2))
      }
    }).catch(function () { /* ignore */ })
  }

  function addAccount() {
    var name = nameDraft.trim()
    var key = keyDraft.trim()
    if (!name || !key) return
    fetch('/api/wallet/accounts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: name, apiKey: key })
    }).then(function (resp) { return resp.json() }).then(function (json) {
      if (json && json.ok) {
        setNameDraft(''); setKeyDraft('')
        setAccountNotice(json.synced ? t('settings.addedAndSetAsCurrent') : t('settings.added'))
        reloadAccounts()
      } else {
        setAccountNotice(json && json.error ? String(json.error) : t('settings.addFailed'))
      }
    }).catch(function () { setAccountNotice(t('settings.addFailed')) })
  }

  function activateAccount(id, name) {
    if (!window.confirm(t('settings.switchToAccountPrefix') + name + t('settings.switchToAccountSuffix'))) return
    setSwitchingId(id)
    fetch('/api/wallet/accounts/activate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: id })
    }).then(function (resp) { return resp.json() }).then(function (json) {
      setSwitchingId(null)
      setAccountNotice(json && json.ok ? t('settings.switchedToAccountPrefix') + name + '\u300d' : (json && json.error ? String(json.error) : t('settings.switchFailed')))
      // Zero-wait threshold jump: the activate response carries the account threshold.
      if (json && json.ok && json.threshold !== undefined && json.threshold !== null) setThresholdDraft(json.threshold.toFixed(2))
      reloadAccounts()
    }).catch(function () { setSwitchingId(null); setAccountNotice(t('settings.switchFailed')) })
  }

  function removeAccount(id, name) {
    if (!window.confirm(t('settings.deleteAccountPrefix') + name + '\u300d\uff1f')) return
    fetch('/api/wallet/accounts/remove', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: id })
    }).then(function (resp) { return resp.json() }).then(function (json) {
      setAccountNotice(json && json.ok ? t('settings.deleted') : t('settings.deleteFailed'))
      reloadAccounts()
    }).catch(function () { setAccountNotice(t('settings.deleteFailed')) })
  }

  var bal = snapshot && snapshot.balance ? snapshot.balance : null
  var balanceText = bal && bal.total !== null && bal.total !== undefined ? fmtCurrency(bal.total, bal.currency) : '--'
  var activeName = snapshot && snapshot.accounts && snapshot.accounts.activeName ? snapshot.accounts.activeName : null
  var list = accounts && accounts.accounts ? accounts.accounts : []
  var rows = []
  var settingsProviderMode = providerModeFor(settingsModelSelection, snapshot || {}, props.modelAware === true)
  var settingsPolicy = snapshot && snapshot.pricingWindows ? snapshot.pricingWindows : null
  var peakClockApplicable = peakClockAppliesFor(settingsProviderMode, settingsPolicy)
  var peakClockHint = !ringEnabled
    ? t('settings.offOfficialPeakOnly')
    : peakClockApplicable
      ? t('settings.modelSupportsPeakPricing')
      : settingsProviderMode.kind === 'zai'
        ? t('settings.zaiAutoHidden')
        : settingsProviderMode.kind === 'third'
          ? t('settings.thirdPartyAutoHidden')
          : settingsProviderMode.kind === 'deepseek'
            ? t('settings.modelNoPeakPricing')
            : t('settings.showOnlyForOfficialPeakModel')

  // --- Balance card ---
  var lowBalance = snapshot && snapshot.lowBalance === true
  var sessionCost = snapshot && snapshot.session && snapshot.session.official && snapshot.session.official.cost !== null && snapshot.session.official.cost !== undefined ? sessionCostText(snapshot.session.official.cost, snapshot && snapshot.balance ? snapshot.balance.currency : null) : '--'
  var currencyCode = bal && typeof bal.currency === 'string' ? bal.currency : 'CNY'
  var primaryBalance = selectBalanceInfo(bal)
  var toppedText = primaryBalance ? fmtCurrency(primaryBalance.topped_up_balance, primaryBalance.currency) : '--'
  var grantedText = primaryBalance ? fmtCurrency(primaryBalance.granted_balance, primaryBalance.currency) : '--'
  rows.push(React.createElement('div', { key: 'head', className: 'dshw_settingsHeader' },
    React.createElement('div', null,
      React.createElement('div', { className: 'dshw_settingsHeading' }, t('settings.accountCenterTitle')),
      React.createElement('div', { className: 'dshw_settingsLead' }, t('settings.accountCenterLead')))))
  rows.push(React.createElement('div', { key: 'balcard', className: lowBalance ? 'dshw_settingsHero dshw_low' : 'dshw_settingsHero' },
    React.createElement('div', { className: 'dshw_settingsHeroTop' },
      React.createElement('span', { className: 'dshw_settingsHeroLabel' }, t('settings.officialBalance')),
      React.createElement('span', { className: 'dshw_accountPill', title: activeName || t('settings.followSystemKey') }, activeName ? t('settings.currentAccountPrefix') + activeName : t('settings.followSystemKey')),
      React.createElement('span', { className: 'dshw_balFill' }),
      lowBalance ? React.createElement('span', { className: 'dshw_balWarn' }, t('settings.lowBalance')) : null),
    React.createElement('div', { className: 'dshw_settingsHeroMain' },
      React.createElement('strong', { className: 'dshw_settingsBalance' }, balanceText),
      React.createElement('span', { className: 'dshw_settingsSpend' },
        React.createElement('span', { className: 'dshw_muted' }, sessionCostLabel(currencyCode, t)),
        React.createElement('strong', null, sessionCost))),
    React.createElement('div', { className: 'dshw_settingsHeroMeta' },
      React.createElement('span', null, t('settings.toppedUpPrefix') + toppedText),
      React.createElement('span', { className: 'dshw_balDot' }, '·'),
      React.createElement('span', null, t('settings.grantedPrefix') + grantedText),
      React.createElement('span', { className: 'dshw_balDot' }, '·'),
      React.createElement('span', null, currencyCode))))

  // --- Health check ---
  var hostHealth = health && health.host ? health.host : null
  var hostCompatibility = hostHealth && hostHealth.compatibility ? hostHealth.compatibility : null
  var pricing = health && health.pricing ? health.pricing : null
  var accountStorage = health && health.accounts ? health.accounts : null
  var usageStorage = health && health.usage ? health.usage : null
  var usageLocked = !!((snapshot && snapshot.usageStorage && snapshot.usageStorage.locked) || (usageStorage && usageStorage.locked))
  var compatibilityText = hostCompatibility
    ? (hostCompatibility.status === 'compatible' ? t('settings.compatDeclared') : hostCompatibility.status === 'upgrade-recommended' ? t('settings.upgradeRecommended') : t('settings.notYetVerified'))
    : t('settings.detecting')
  var pricingText = pricing
    ? (pricing.status === 'synced'
      ? t('settings.synced')
      : pricing.status === 'review-required'
        ? t('settings.pendingReview')
        : pricing.status === 'offline'
          ? (String(pricing.ruleVersion || '').indexOf('official-') === 0 ? t('settings.offlineUsingVerifiedRules') : t('settings.offlineUsingBuiltinRules'))
          : t('settings.builtinRules'))
    : t('settings.detecting')
  var storageText = accountStorage
    ? (accountStorage.status === 'locked'
      ? t('settings.undecryptableWritesLocked')
      : accountStorage.status === 'recovered'
        ? t('settings.restoredFromEncryptedBackup')
        : accountStorage.status === 'error'
          ? t('settings.encryptedStorageError')
          : accountStorage.scheme === 'windows-dpapi' ? t('settings.encryptionWindowsDpapi') : t('settings.encryptionAesGcm'))
    : t('settings.detecting')
  var usageStorageText = usageStorage
    ? (usageStorage.status === 'locked'
      ? t('settings.corruptedWritesLocked')
      : usageStorage.status === 'recovered'
        ? t('settings.restoredFromBackup')
        : usageStorage.status === 'error'
          ? t('settings.writeFailedCheckDiskPermissions')
          : usageStorage.backup ? t('settings.okWithBackup') : t('plan.dataOk'))
    : t('settings.detecting')
  rows.push(React.createElement('div', { key: 'health', className: 'dshw_setCard', style: { display: 'block' } },
    React.createElement('div', { className: 'dshw_settingsGroupHeader' },
      React.createElement('div', { className: 'dshw_settingsGroupTitle' }, t('settings.harnessHealthCheck')),
      React.createElement('div', { className: 'dshw_settingsGroupHint' }, healthNotice || t('settings.noApiKeyOrLocalPaths'))),
    React.createElement('div', { className: 'dshw_settingsHeroMeta' },
      React.createElement('span', null, 'Harness v' + (hostHealth && hostHealth.version ? hostHealth.version : t('settings.unrecognized'))),
      React.createElement('span', { className: 'dshw_balDot' }, '·'),
      React.createElement('span', null, t('settings.pluginVersionPrefix') + WALLET_VERSION),
      React.createElement('span', { className: 'dshw_balDot' }, '·'),
      React.createElement('span', null, t('settings.compatibilityPrefix') + compatibilityText)),
    React.createElement('div', { className: 'dshw_settingsHeroMeta' },
      React.createElement('span', null, t('settings.pricingRulesPrefix') + pricingText),
      React.createElement('span', { className: 'dshw_balDot' }, '·'),
      React.createElement('span', null, t('settings.accountStoragePrefix') + storageText),
      React.createElement('span', { className: 'dshw_balDot' }, '·'),
      React.createElement('span', null, t('settings.usageLedgerPrefix') + usageStorageText)),
    React.createElement('div', { className: 'dshw_settingsFooterActions', style: { marginTop: '8px' } },
      React.createElement('button', { type: 'button', className: 'dshw_btn', onClick: refreshHealth }, t('settings.recheck')),
      React.createElement('button', { type: 'button', className: 'dshw_btn', onClick: refreshPricing }, t('settings.syncOfficialPricing')),
      React.createElement('button', { type: 'button', className: 'dshw_btn', disabled: !health, onClick: copyDiagnostics }, t('settings.copyDiagnostics')))))

  // --- Settings cards ---
  var cells = []
  cells.push(React.createElement('div', { key: 'vis', className: 'dshw_setCell' },
    React.createElement('span', { className: 'dshw_settingsFieldLabel' },
      React.createElement('strong', null, t('settings.displayContent')),
      React.createElement('span', null, t('settings.chooseTabDataSource'))),
    React.createElement('span', { className: 'dshw_balFill' }),
    React.createElement('label', { className: 'dshw_chipToggle' },
      React.createElement('input', {
        type: 'checkbox', checked: visibility.official,
        'aria-label': t('settings.showOfficialData'),
        onChange: function (event) { persistVisibility({ official: event.target.checked, third: visibility.third }) }
      }), t('settings.official')),
    React.createElement('label', { className: 'dshw_chipToggle' },
      React.createElement('input', {
        type: 'checkbox', checked: visibility.third,
        'aria-label': t('settings.showThirdPartyTokens'),
        onChange: function (event) { persistVisibility({ official: visibility.official, third: event.target.checked }) }
      }), t('settings.thirdParty'))))
  cells.push(React.createElement('div', { key: 'chip-style', className: 'dshw_setCell' },
    React.createElement('span', { className: 'dshw_settingsFieldLabel' },
      React.createElement('strong', null, t('settings.inputLabel')),
      React.createElement('span', null, chipStyle === 'hidden' ? t('settings.hiddenAlertsStillRun') : t('settings.shownInInputToolbar'))),
    React.createElement('span', { className: 'dshw_balFill' }),
    React.createElement('label', { className: 'dshw_switch', title: t('settings.offHidesLabelOnly') },
      React.createElement('input', {
        type: 'checkbox',
        checked: chipStyle !== 'hidden',
        'aria-label': t('settings.showInputLabel'),
        onChange: function (event) { persistChipStyle(event.target.checked ? 'standard' : 'hidden') }
      }),
      React.createElement('span', { className: 'dshw_track', 'aria-hidden': 'true' }),
      React.createElement('span', { className: 'dshw_knob', 'aria-hidden': 'true' }))))
  cells.push(React.createElement('div', { key: 'balance-only', className: 'dshw_setCell' },
    React.createElement('span', { className: 'dshw_settingsFieldLabel' },
      React.createElement('strong', null, t('settings.balanceOnly')),
      React.createElement('span', null, t('settings.balanceOnlyHint'))),
    React.createElement('span', { className: 'dshw_balFill' }),
    React.createElement('label', { className: 'dshw_switch', title: t('settings.balanceOnlyTitle') },
      React.createElement('input', {
        type: 'checkbox',
        checked: balanceOnly,
        disabled: chipStyle === 'hidden',
        'aria-label': t('settings.inputLabelBalanceOnly'),
        onChange: function (event) { persistBalanceOnly(event.target.checked) }
      }),
      React.createElement('span', { className: 'dshw_track', 'aria-hidden': 'true' }),
      React.createElement('span', { className: 'dshw_knob', 'aria-hidden': 'true' }))))
  cells.push(React.createElement('div', { key: 'sc', className: 'dshw_setCell' },
    React.createElement('span', { className: 'dshw_settingsFieldLabel' },
      React.createElement('strong', null, t('settings.labelScale')),
      React.createElement('span', null, t('settings.labelScaleHint'))),
    React.createElement('span', { className: 'dshw_balFill' }),
    React.createElement('span', { className: 'dshw_scaleControl' },
      React.createElement('input', {
        className: 'dshw_scaleInput', type: 'range', min: '75', max: String(scaleMax), step: '5',
        value: String(Math.round(scale * 100)),
        'aria-label': t('settings.walletChipScale'),
        onInput: function (event) { persistScale(Number.parseFloat(event.target.value) / 100) },
        onChange: function (event) { persistScale(Number.parseFloat(event.target.value) / 100) }
      }),
      React.createElement('span', { className: 'dshw_scaleValue' }, Math.round(scale * 100) + '%'))))
  cells.push(React.createElement('div', { key: 'quad', className: 'dshw_setCell wide dshw_reminderCard' },
    React.createElement('div', { className: 'dshw_settingsGroupHeader' },
      React.createElement('div', { className: 'dshw_settingsGroupTitle' }, t('settings.alertsAndSession')),
      React.createElement('div', { className: 'dshw_settingsGroupHint' }, t('settings.alertsAndSessionHint'))),
    React.createElement('div', { className: 'dshw_settingChoices' },
      React.createElement('div', { className: 'dshw_settingChoice' },
        React.createElement('span', { className: 'dshw_settingChoiceCopy' },
          React.createElement('strong', null, t('settings.completionAlert')),
          React.createElement('span', null, t('settings.notifyAfterConversation'))),
        React.createElement('select', {
          className: 'dshw_select',
          'aria-label': t('settings.completionAlert'),
          value: notifyEnabled ? notifyTimeout : 'off',
          onChange: function (event) {
            var v = event.target.value
            if (v === 'off') { persistNotify(false, notifyTimeout); return }
            persistNotify(true, v)
          }
        },
          React.createElement('option', { value: 'off' }, t('settings.off')),
          React.createElement('option', { value: '5' }, t('settings.seconds5')),
          React.createElement('option', { value: '10' }, t('settings.seconds10')),
          React.createElement('option', { value: '30' }, t('settings.seconds30')),
          React.createElement('option', { value: '60' }, t('settings.seconds60')),
          React.createElement('option', { value: 'keep' }, t('settings.keepForever')))),
      React.createElement('div', { className: 'dshw_settingChoice' },
        React.createElement('span', { className: 'dshw_settingChoiceCopy' },
          React.createElement('strong', null, t('settings.lowBalanceThreshold')),
          React.createElement('span', null, thresholdNotice || (usageLocked ? t('settings.usageLedgerLockedCannotSave') : currencyCode + t('settings.autoSaveSuffix')))),
        React.createElement('span', { className: 'dshw_settingsInline' },
          React.createElement('span', { style: { fontWeight: 700, color: 'var(--dsw-alias-label-primary,inherit)' } }, currencyCode === 'USD' ? '$' : '¥'),
          React.createElement('input', {
            className: 'dshw_input', type: 'number', min: '0', step: '0.01',
            style: { width: '64px' },
            value: thresholdDraft,
            disabled: usageLocked,
            title: usageLocked ? t('settings.usageLedgerLockedThreshold') : t('settings.thresholdHint'),
            'aria-label': t('settings.lowBalanceThresholdPrefix') + currencyCode + ')',
            onInput: function (event) { setThresholdDraft(event.target.value); queueThresholdSave(event.target.value) },
            onChange: function (event) { setThresholdDraft(event.target.value); queueThresholdSave(event.target.value) }
          }),
          React.createElement('span', { className: 'dshw_muted' }, currencyCode))),
      React.createElement('div', { className: 'dshw_settingChoice' },
        React.createElement('span', { className: 'dshw_settingChoiceCopy' },
          React.createElement('strong', null, t('settings.lowBalanceBlink')),
          React.createElement('span', null, t('settings.lowBalanceBlinkHint'))),
        React.createElement('label', { className: 'dshw_switch' },
          React.createElement('input', {
            type: 'checkbox', checked: lowBlinkEnabled,
            'aria-label': t('settings.lowBalanceBlinkAria'),
            onChange: function (event) { persistLowBlink(event.target.checked) }
          }),
          React.createElement('span', { className: 'dshw_track', 'aria-hidden': 'true' }),
          React.createElement('span', { className: 'dshw_knob', 'aria-hidden': 'true' }))),
      React.createElement('div', { className: 'dshw_settingChoice' },
        React.createElement('span', { className: 'dshw_settingChoiceCopy' },
          React.createElement('strong', null, t('settings.deleteSessionPermanently')),
          React.createElement('span', null, pdSupported ? t('settings.sessionMenuEntry') : t('settings.hostUnsupported'))),
        React.createElement('label', { className: 'dshw_switch', title: pdSupported ? t('settings.showPermanentDelete') : t('settings.hostNoPermanentDelete') },
          React.createElement('input', {
            type: 'checkbox', checked: pdSupported && pdEnabled, disabled: !pdSupported,
            'aria-label': t('settings.enablePermanentDelete'),
            onChange: function (event) {
              if (!pdSupported) return
              var enabled = event.target.checked
              setPdEnabled(enabled)
              try { compatibility.storage.setItem(PERMANENT_DELETE_KEY, String(enabled)) } catch (e) { /* ignore */ }
              compatibility.dispatch(PERMANENT_DELETE_EVENT)
            }
          }),
          React.createElement('span', { className: 'dshw_track', 'aria-hidden': 'true' }),
          React.createElement('span', { className: 'dshw_knob', 'aria-hidden': 'true' }))),
      React.createElement('div', { className: 'dshw_settingChoice' },
        React.createElement('span', { className: 'dshw_settingChoiceCopy' },
          React.createElement('strong', null, t('settings.peakClock')),
          React.createElement('span', null, peakClockHint)),
        React.createElement('label', { className: 'dshw_switch', title: peakClockHint },
          React.createElement('input', {
            type: 'checkbox', checked: ringEnabled,
            'aria-label': t('settings.showSidebarPeakClock'),
            onChange: function (event) {
              var enabled = event.target.checked
              setRingEnabled(enabled)
              try { compatibility.storage.setItem(PEAK_RING_KEY, String(enabled)) } catch (e) { /* ignore */ }
              try { compatibility.dispatch(SETTINGS_EVENT) } catch (e) { /* ignore */ }
              try { compatibility.dispatch(PEAK_RING_EVENT) } catch (e) { /* ignore */ }
            }
          }),
          React.createElement('span', { className: 'dshw_track', 'aria-hidden': 'true' }),
          React.createElement('span', { className: 'dshw_knob', 'aria-hidden': 'true' }))),
      React.createElement('div', { className: 'dshw_settingChoice' },
        React.createElement('span', { className: 'dshw_settingChoiceCopy' },
          React.createElement('strong', null, t('settings.peakSwitchAlert')),
          React.createElement('span', null, t('settings.peakSwitchNotifyOnce'))),
        React.createElement('label', { className: 'dshw_switch', title: t('settings.peakSwitchAlertTitle') },
          React.createElement('input', {
            type: 'checkbox', checked: peakNotifyEnabled,
            'aria-label': t('settings.enablePeakSwitchAlert'),
            onChange: function (event) {
              var enabled = event.target.checked
              setPeakNotifyEnabled(enabled)
              try { compatibility.storage.setItem(PEAK_NOTIFY_KEY, String(enabled)) } catch (e) { /* ignore */ }
              try { compatibility.dispatch(SETTINGS_EVENT) } catch (e) { /* ignore */ }
            }
          }),
          React.createElement('span', { className: 'dshw_track', 'aria-hidden': 'true' }),
          React.createElement('span', { className: 'dshw_knob', 'aria-hidden': 'true' }))),
      React.createElement('div', { className: 'dshw_settingChoice' },
        React.createElement('span', { className: 'dshw_settingChoiceCopy' },
          React.createElement('strong', null, t('settings.clockLayout')),
          React.createElement('span', null, t('settings.clockLayoutHint'))),
        React.createElement('select', {
          className: 'dshw_select',
          'aria-label': t('settings.peakClockLayout'),
          value: peakOrient,
          onChange: function (event) { persistPeakOrient(event.target.value) }
        },
          React.createElement('option', { value: 'horizontal' }, t('settings.layoutHorizontal')),
          React.createElement('option', { value: 'vertical' }, t('settings.layoutVertical')))),
      React.createElement('div', { className: 'dshw_settingChoice' },
        React.createElement('span', { className: 'dshw_settingChoiceCopy' },
          React.createElement('strong', null, t('settings.clockBackground')),
          React.createElement('span', null, peakBackground === 'solid' ? t('settings.clockBackgroundSolidHint') : t('settings.clockBackgroundTransparentHint'))),
        React.createElement('select', {
          className: 'dshw_select',
          'aria-label': t('settings.peakClockBackground'),
          value: peakBackground,
          onChange: function (event) { persistPeakBackground(event.target.value) }
        },
          React.createElement('option', { value: 'transparent' }, t('settings.backgroundTransparent')),
          React.createElement('option', { value: 'solid' }, t('settings.backgroundSolid')))),
      React.createElement('div', { className: 'dshw_settingChoice' },
        React.createElement('span', { className: 'dshw_settingChoiceCopy' },
          React.createElement('strong', null, t('settings.clockSize')),
          React.createElement('span', null, t('settings.clockSizeHint'))),
        React.createElement('span', { className: 'dshw_scaleControl' },
          React.createElement('input', {
            className: 'dshw_scaleInput', type: 'range', min: '100', max: '120', step: '5',
            value: String(Math.round(peakScale * 100)),
            'aria-label': t('settings.peakClockCardScale'),
            onInput: function (event) { persistPeakScale(Number.parseFloat(event.target.value) / 100) },
            onChange: function (event) { persistPeakScale(Number.parseFloat(event.target.value) / 100) }
          }),
          React.createElement('span', { className: 'dshw_scaleValue' }, Math.round(peakScale * 100) + '%'))),
      React.createElement('div', { className: 'dshw_settingChoice' },
        React.createElement('span', { className: 'dshw_settingChoiceCopy' },
          React.createElement('strong', null, t('settings.clockTopUpButton')),
          React.createElement('span', null, t('settings.clockTopUpButtonHint'))),
        React.createElement('label', { className: 'dshw_switch', title: t('settings.clockTopUpButtonTitle') },
          React.createElement('input', {
            type: 'checkbox', checked: peakRecharge,
            'aria-label': t('settings.showClockTopUpButton'),
            onChange: function (event) { persistPeakRecharge(event.target.checked) }
          }),
          React.createElement('span', { className: 'dshw_track', 'aria-hidden': 'true' }),
          React.createElement('span', { className: 'dshw_knob', 'aria-hidden': 'true' }))),
      React.createElement('div', { className: 'dshw_settingChoice' },
        React.createElement('span', { className: 'dshw_settingChoiceCopy' },
          React.createElement('strong', null, t('settings.clockPosition')),
          React.createElement('span', null, peakDock === 'free' ? t('settings.clockFreeFloating') : t('settings.clockDockedBottom'))),
        peakDock === 'free' ? React.createElement('button', {
          type: 'button', className: 'dshw_btn',
          title: t('settings.clockRedockTitle'),
          onClick: function () { resetPeakDock() }
        }, t('settings.redockButton')) : React.createElement('span', { className: 'dshw_muted', style: { fontSize: '11px' } }, t('settings.pinned')))))
  )
  rows.push(React.createElement('div', { key: 'setcard', className: 'dshw_setCard' }, cells))

  // --- Provider buckets (Issue #21: wrapper routes can count as official billing) ---
  var knownProviders = snapshot && snapshot.providers && Array.isArray(snapshot.providers.known) ? snapshot.providers.known.filter(function (provider) { return !isPlanProviderId(provider) }) : []
  var officialProviders = snapshot && snapshot.providers && Array.isArray(snapshot.providers.official) ? snapshot.providers.official.filter(function (provider) { return !isPlanProviderId(provider) }) : []
  if (knownProviders.length > 0 || officialProviders.length > 0) {
    rows.push(React.createElement('div', { key: 'pr-t', className: 'dshw_title', style: { marginTop: '8px' } }, t('settings.providerBillingBuckets')))
    rows.push(React.createElement('div', { key: 'pr-h', className: 'dshw_muted' }, t('settings.providerBucketsHint')))
    var providerRows = officialProviders.map(function (p) {
      return React.createElement('div', { key: 'op-' + p, className: 'dshw_setCell' },
        React.createElement('label', { className: 'dshw_check', style: { margin: 0 } },
          React.createElement('input', {
            type: 'checkbox', checked: true, disabled: usageLocked,
            'aria-label': p + t('settings.countAsOfficialSuffix'),
            onChange: function () {
              fetch('/api/wallet/official-providers', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ providers: officialProviders.filter(function (x) { return x !== p }) })
              }).then(reloadAccounts).catch(function () { /* ignore */ })
            }
          }), p + t('settings.officialBillingSuffix')))
    }).concat(knownProviders.map(function (p) {
      return React.createElement('div', { key: 'kp-' + p, className: 'dshw_setCell' },
        React.createElement('label', { className: 'dshw_check', style: { margin: 0 } },
          React.createElement('input', {
            type: 'checkbox', checked: false, disabled: usageLocked,
            'aria-label': p + t('settings.countAsOfficialSuffix'),
            onChange: function () {
              fetch('/api/wallet/official-providers', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ providers: officialProviders.concat([p]) })
              }).then(reloadAccounts).catch(function () { /* ignore */ })
            }
          }), p + t('settings.thirdPartyBillingSuffix')))
    }))
    rows.push(React.createElement('div', { key: 'pr-card', className: 'dshw_setCard', style: { display: 'block' } }, providerRows))
  }

  // --- Third-party API custom pricing (Issue #36) ---
  rows.push(React.createElement('div', { key: 'cp-head', className: 'dshw_accountHeader', style: { marginTop: '8px' } },
    React.createElement('span', null,
      React.createElement('span', { className: 'dshw_title' }, t('settings.thirdPartyApiCustomPrice')),
      React.createElement('span', { className: 'dshw_muted', style: { display: 'block', marginTop: '2px', fontSize: '10px' } }, t('settings.customPriceNote'))),
    React.createElement('button', {
      type: 'button', className: 'dshw_btn',
      disabled: settingsProviderMode.kind !== 'third',
      title: settingsProviderMode.kind === 'third' ? t('settings.fillCurrentProviderModel') : t('settings.switchToThirdPartyFirst'),
      onClick: useCurrentRouteForPrice
    }, t('settings.useCurrentModel'))))
  var providerOptions = Array.from(new Set(knownPriceRoutes.map(function (route) { return route && route.provider }).filter(Boolean)))
  var modelOptions = Array.from(new Set(knownPriceRoutes.filter(function (route) {
    return route && (!priceDraft.provider || route.provider === priceDraft.provider)
  }).map(function (route) { return route.model }).filter(Boolean)))
  function updatePriceDraft(key, value) {
    setPriceDraft(function (current) { var next = Object.assign({}, current); next[key] = key === 'currency' ? String(value).toUpperCase().slice(0, 3) : value; return next })
  }
  function priceField(key, label, type, options) {
    return React.createElement('label', { key: key, className: 'dshw_priceField' },
      React.createElement('span', null, label),
      type === 'select'
        ? React.createElement('select', { className: 'dshw_select', value: priceDraft[key], 'aria-label': label, onChange: function (event) { updatePriceDraft(key, event.target.value) } },
            options.map(function (option) { return React.createElement('option', { key: option, value: option }, option) }))
        : React.createElement('input', {
            className: 'dshw_input', type: type, min: type === 'number' ? '0' : undefined,
            max: type === 'number' ? '1000000' : undefined, step: type === 'number' ? '0.000001' : undefined,
            list: key === 'provider' ? 'dshw-price-providers' : key === 'model' ? 'dshw-price-models' : undefined,
            value: priceDraft[key], 'aria-label': label,
            onChange: function (event) { updatePriceDraft(key, event.target.value) }
          }))
  }
  var priceForm = React.createElement('div', { className: 'dshw_priceForm' },
    priceField('provider', 'Provider ID', 'text'),
    priceField('model', t('settings.modelId'), 'text'),
    priceField('currency', t('settings.currency'), 'text'),
    priceField('input', t('settings.priceInput'), 'number'),
    priceField('cacheRead', t('settings.priceCacheRead'), 'number'),
    priceField('cacheWrite', t('settings.priceCacheWrite'), 'number'),
    priceField('output', t('settings.priceOutput'), 'number'),
    React.createElement('button', { type: 'button', className: 'dshw_btn dshw_btnPrimary', disabled: usageLocked, onClick: saveCustomPrice }, t('settings.save')),
    React.createElement('datalist', { id: 'dshw-price-providers' }, providerOptions.map(function (provider) { return React.createElement('option', { key: provider, value: provider }) })),
    React.createElement('datalist', { id: 'dshw-price-models' }, modelOptions.map(function (model) { return React.createElement('option', { key: model, value: model }) })))
  function customWindowField(window, index, key, label, type) {
    return React.createElement('label', { key: key, className: 'dshw_priceField' },
      React.createElement('span', null, label),
      React.createElement('input', {
        className: 'dshw_input',
        type: type,
        min: type === 'number' ? '0' : undefined,
        max: type === 'number' ? '1000000' : undefined,
        step: type === 'number' ? '0.000001' : undefined,
        value: window[key],
        'aria-label': t('settings.windowLabelSuffix') + (index + 1) + ' ' + label,
        onChange: function (event) { updateCustomPriceWindow(index, key, event.target.value) }
      }))
  }
  var draftPriceWindows = Array.isArray(priceDraft.windows) ? priceDraft.windows : []
  var priceWindowRows = draftPriceWindows.map(function (window, index) {
    return React.createElement('div', { key: index, className: 'dshw_priceWindow' },
      React.createElement('div', { className: 'dshw_priceWindowHead' },
        customWindowField(window, index, 'label', t('settings.windowLabel'), 'text'),
        React.createElement('button', { type: 'button', className: 'dshw_btn', disabled: usageLocked, 'aria-label': t('settings.deleteWindowAria') + (index + 1), onClick: function () { removeCustomPriceWindow(index) } }, t('settings.deleteWindow'))),
      React.createElement('div', { className: 'dshw_priceDays', role: 'group', 'aria-label': t('settings.windowLabelSuffix') + (index + 1) + t('settings.appliesOnDaysSuffix') },
        React.createElement('span', null, t('settings.weekdays')),
        CUSTOM_PRICE_WEEKDAYS.map(function (day) {
          var dayLabel = t(day.labelKey)
          var selected = Array.isArray(window.days) && window.days.includes(day.value)
          return React.createElement('button', {
            key: day.value,
            type: 'button',
            className: 'dshw_priceDay',
            'aria-label': t('settings.weekdays') + dayLabel,
            'aria-pressed': selected,
            onClick: function () { toggleCustomPriceDay(index, day.value) }
          }, dayLabel)
        })),
      React.createElement('div', { className: 'dshw_priceWindowRates' },
        customWindowField(window, index, 'start', t('settings.windowStart'), 'time'),
        customWindowField(window, index, 'end', t('settings.windowEnd'), 'time'),
        customWindowField(window, index, 'input', t('settings.priceInput'), 'number'),
        customWindowField(window, index, 'cacheRead', t('settings.priceCacheRead'), 'number'),
        customWindowField(window, index, 'cacheWrite', t('settings.priceCacheWrite'), 'number'),
        customWindowField(window, index, 'output', t('settings.priceOutput'), 'number')))
  })
  var priceWindowEditor = React.createElement('div', { className: 'dshw_priceWindowEditor' },
    React.createElement('div', { className: 'dshw_priceWindowToolbar' },
      React.createElement('label', { className: 'dshw_priceField' },
        React.createElement('span', null, t('settings.pricingTimezoneIana')),
        React.createElement('input', {
          className: 'dshw_input', type: 'text', list: 'dshw-price-timezones', value: priceDraft.timezone,
          'aria-label': t('settings.thirdPartyPricingTimezone'), onChange: function (event) { updatePriceDraft('timezone', event.target.value) }
        }),
        React.createElement('datalist', { id: 'dshw-price-timezones' }, ['Asia/Shanghai', 'UTC', 'America/New_York', 'Europe/London'].map(function (timezone) {
          return React.createElement('option', { key: timezone, value: timezone }, timezone)
        }))),
      React.createElement('button', { type: 'button', className: 'dshw_btn', disabled: usageLocked || draftPriceWindows.length >= 24, onClick: addCustomPriceWindow }, t('settings.addWindow'))),
    priceWindowRows.length > 0
      ? React.createElement('div', { className: 'dshw_priceWindowList' }, priceWindowRows)
      : React.createElement('div', { className: 'dshw_muted' }, t('settings.basePriceNote')),
    React.createElement('div', { className: 'dshw_muted' }, t('settings.windowsMayCrossMidnight')))
  var priceRuleRows = priceRules.map(function (rule) {
    var windows = Array.isArray(rule.windows) ? rule.windows : []
    var active = rule.active && windows.length > 0 ? rule.active : null
    return React.createElement('div', { key: rule.provider + ':' + rule.model, className: 'dshw_priceRule' },
      React.createElement('span', null,
        React.createElement('strong', { title: rule.provider + ' · ' + rule.model }, rule.provider + ' · ' + rule.model),
        React.createElement('span', null, rule.currency + t('settings.rateBaseIn') + rule.input + t('settings.rateCacheRead') + rule.cacheRead + t('settings.rateCacheWrite') + rule.cacheWrite + t('settings.rateOutput') + rule.output),
        windows.length > 0 ? React.createElement('span', null, t('settings.timeOfDayPrefix') + windows.length + t('settings.windowsSuffix') + (rule.timezone || 'Asia/Shanghai') + t('settings.currentNow') + (customRateLabel(active, t))) : null),
      React.createElement('span', { className: 'dshw_settingsInline' },
        React.createElement('button', { type: 'button', className: 'dshw_btn', onClick: function () { editCustomPrice(rule) } }, t('settings.edit')),
        React.createElement('button', { type: 'button', className: 'dshw_btn', disabled: usageLocked, onClick: function () { removeCustomPrice(rule) } }, t('settings.delete'))))
  })
  rows.push(React.createElement('div', { key: 'cp-card', className: 'dshw_setCard wide', style: { display: 'block' } },
    priceForm,
    priceWindowEditor,
    priceNotice ? React.createElement('div', { className: 'dshw_muted', role: 'status', style: { padding: '0 12px 8px' } }, priceNotice) : null,
    priceRuleRows.length > 0
      ? React.createElement('div', { className: 'dshw_priceRules' }, priceRuleRows)
      : React.createElement('div', { className: 'dshw_muted', style: { padding: '0 12px 11px' } }, t('settings.noRulesHint'))))

  rows.push(React.createElement(PlanUsagePanel, { key: 'plans', compact: false, t: t }))
  rows.push(React.createElement(UsageHistoryPanel, { key: 'history', sessionId: null, alwaysOpen: true, t: t }))

  // --- Account management ---
  rows.push(React.createElement('div', { key: 'acc-t', className: 'dshw_accountHeader' },
    React.createElement('span', { className: 'dshw_title' }, t('settings.accountManagement')),
    React.createElement('span', { className: 'dshw_accountCount' }, list.length + t('settings.accountCountSuffix'))))
  if (accountsError) {
    rows.push(React.createElement('div', { key: 'acc-e', className: 'dshw_muted' }, accountsError))
  } else if (list.length === 0) {
    rows.push(React.createElement('div', { key: 'acc-none', className: 'dshw_muted' }, t('settings.noAccountsHint')))
  } else {
    var AVATAR_HUES = [212, 262, 152, 22, 338, 180]
    var acctRows = list.map(function (acc, i) {
      var hue = AVATAR_HUES[i % AVATAR_HUES.length]
      return React.createElement('div', { key: acc.id, className: acc.active ? 'dshw_acctRow current' : 'dshw_acctRow' },
        React.createElement('span', {
          className: 'dshw_acctAvatar',
          style: { background: 'oklch(0.72 0.14 ' + hue + ' / 0.22)', color: 'oklch(0.5 0.16 ' + hue + ')' }
        }, acc.name.trim().charAt(0).toUpperCase()),
        React.createElement('span', { className: 'dshw_acctInfo' },
          React.createElement('span', { className: 'dshw_acctName' },
            acc.name,
            acc.active ? React.createElement('span', { className: 'dshw_acctBadge' }, t('settings.llmBillingActive')) : null),
          React.createElement('span', { className: 'dshw_acctKey' }, acc.maskedKey)),
        acc.active
          ? React.createElement('span', { key: 'a', className: 'dshw_acctNow' }, t('settings.current'))
          : React.createElement('button', {
              key: 's', type: 'button', className: 'dshw_btn',
              style: { height: '22px', padding: '0 10px', fontSize: '11px' },
              disabled: switchingId !== null,
              onClick: function () { activateAccount(acc.id, acc.name) }
            }, switchingId === acc.id ? '\u2026' : t('settings.switch')),
        React.createElement('button', {
          key: 'r', type: 'button', className: 'dshw_btn',
          style: { height: '24px', padding: '0 8px', fontSize: '10.5px' },
          title: t('settings.deleteAccount'),
          'aria-label': t('settings.deleteAccountNamed') + acc.name,
          onClick: function () { removeAccount(acc.id, acc.name) }
        }, t('settings.delete')))
    })
    rows.push(React.createElement('div', { key: 'acc-scroll', className: 'dshw_acctScroll' }, acctRows))
  }
  rows.push(React.createElement('div', { key: 'acc-add', className: 'dshw_accountAdd' },
    React.createElement('input', {
      className: 'dshw_input',
      placeholder: t('settings.name'), 'aria-label': t('settings.name'),
      value: nameDraft,
      onInput: function (event) { setNameDraft(event.target.value) },
      onChange: function (event) { setNameDraft(event.target.value) }
    }),
    React.createElement('input', {
      className: 'dshw_input', type: 'password',
      placeholder: 'sk-...', 'aria-label': 'API Key',
      value: keyDraft,
      onInput: function (event) { setKeyDraft(event.target.value) },
      onChange: function (event) { setKeyDraft(event.target.value) }
    }),
    React.createElement('button', {
      type: 'button', className: 'dshw_btn dshw_btnPrimary', style: { height: '28px', padding: '0 14px' },
      onClick: addAccount
    }, t('settings.add'))))
  if (accountNotice) {
    rows.push(React.createElement('div', { key: 'acc-n', className: 'dshw_muted' }, accountNotice))
  }

  // Account switching and usage history are the primary account-center
  // tasks, so keep both directly under the balance overview. Health and
  // appearance/reminder preferences follow below them.
  function rowKey(row) {
    if (!row) return ''
    if (row.key !== null && row.key !== undefined) return String(row.key)
    return row.props && row.props.key !== undefined ? String(row.props.key) : ''
  }
  var accountRows = rows.filter(function (row) { return rowKey(row).indexOf('acc-') === 0 })
  var planRows = rows.filter(function (row) { return rowKey(row) === 'plans' })
  var historyRows = rows.filter(function (row) { return rowKey(row) === 'history' })
  rows = rows.filter(function (row) {
    var key = rowKey(row)
    return key !== 'plans' && key !== 'history' && key.indexOf('acc-') !== 0
  })
  var balanceRowIndex = rows.findIndex(function (row) { return rowKey(row) === 'balcard' })
  rows.splice.apply(rows, [balanceRowIndex + 1, 0].concat(accountRows, planRows, historyRows))

  rows.push(React.createElement('div', { key: 'footer', className: 'dshw_settingsFooter' },
    React.createElement('span', { className: 'dshw_versionBadge' }, 'DeepSeek Harness Control Center v' + WALLET_VERSION),
    React.createElement('span', { className: 'dshw_settingsFooterActions' },
    React.createElement('button', {
      type: 'button', className: 'dshw_btn',
      onClick: function () {
        fetch('/api/wallet/refresh', { method: 'POST' }).then(reloadAccounts).catch(function () { /* ignore */ })
      }
    }, t('settings.refreshBalance')),
    React.createElement('button', {
      type: 'button', className: 'dshw_btn dshw_btnPrimary',
      onClick: function () { if (close) close(); openOfficialRecharge() }
    }, t('settings.goTopUp')))))
  return React.createElement('div', { ref: settingsSectionRef, className: 'dshw_settingsSection', style: { display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: 'var(--dsw-alias-label-primary,inherit)' } }, rows)
}

// Label for the custom-price rate that is currently in effect.
//
// The host reports the selection as `{kind, label}`. A `window` label is the
// user's own text and must be shown verbatim; the `base` label is copy the host
// hardcodes and therefore cannot follow the client language, so translate it
// from the stable `kind` instead of echoing the host string.
function customRateLabel(active, t) {
  t = typeof t === 'function' ? t : walletT
  if (!active) return t('settings.baseRate')
  if (active.kind === 'base') return t('settings.baseRate')
  return typeof active.label === 'string' && active.label !== '' ? active.label : t('settings.baseRate')
}

// Wall-clock hour (0-24, fractional) inside an IANA timezone, via Intl —
// never a fixed UTC offset, so DST-observing zones stay correct. Falls back
// to the policy's declared offset only if Intl cannot resolve the zone.
function wallHourIn(tz, offsetMinutes, date) {
  try {
    var text = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false
    }).format(date)
    var parts = text.split(':')
    var h = Number.parseFloat(parts[0])
    var m = Number.parseFloat(parts[1])
    if (Number.isFinite(h) && Number.isFinite(m)) return (h % 24) + m / 60
  } catch (e) { /* fall through to the fixed offset */ }
  return (date.getTime() + (offsetMinutes || 0) * 60000) % 86400000 / 3600000
}

// Pure peak-clock math shared by the sidebar ring: current period, next
// boundary (wrapping past midnight), the reminder dedup id, and the
// zero-text-friendly tooltip / screen-reader strings. windows come from
// the wallet snapshot; anything malformed collapses to the neutral state.
function peakClockState(policy, nowHour, nowMs, t) {
  // Callers inside the render tree pass the live locale seat; the bundled
  // dictionary keeps direct (and older) callers working.
  t = typeof t === 'function' ? t : walletT
  var windows = policy && Array.isArray(policy.windows) ? policy.windows.filter(function (w) {
    return w && Number.isFinite(w.startHour) && Number.isFinite(w.endHour) && w.endHour > w.startHour
  }) : []
  var weekendOffPeak = policy && policy.weekendOffPeak === true
  if (weekendOffPeak) {
    var offsetMinutes = policy && Number.isFinite(policy.offsetMinutes) ? policy.offsetMinutes : 480
    var beijingNow = Number.isFinite(nowMs) ? new Date(nowMs + offsetMinutes * 60000) : null
    var day = beijingNow && Number.isFinite(beijingNow.getTime()) ? beijingNow.getUTCDay() : 6
    // Friday after 18:00, Saturday, Sunday and Monday before 09:00 are
    // one continuous off-peak period. Anchor it to Friday so unchanged
    // pricing does not emit duplicate notifications at each midnight.
    var weekendAnchor = beijingNow && Number.isFinite(beijingNow.getTime())
      ? new Date(Date.UTC(beijingNow.getUTCFullYear(), beijingNow.getUTCMonth(), beijingNow.getUTCDate() - (day === 6 ? 1 : 2)))
      : null
    var weekendDateKey = weekendAnchor
      ? [weekendAnchor.getUTCFullYear(), String(weekendAnchor.getUTCMonth() + 1).padStart(2, '0'), String(weekendAnchor.getUTCDate()).padStart(2, '0')].join('-')
      : 'weekend'
    var weekendTzName = policy.timezone || 'Asia/Shanghai'
    var weekendDayLabel = day === 6 ? t('plan.saturday') : t('plan.sunday')
    return {
      configured: true, windows: [], weekendOffPeak: true, inPeak: false,
      nextHour: 9,
      ariaText: t('plan.currentlyPrefix') + weekendDayLabel + t('plan.weekendOffPeakNote'),
      tip: t('plan.clockTipCurrent') + weekendDayLabel + t('plan.offPeakSuffix') + weekendDayLabel + t('plan.weekendHalfPriceNote') + weekendTzName,
      periodName: t('plan.weekendOffPeak'), rateBadge: t('plan.halfPrice'),
      countdownSummary: weekendDayLabel + t('plan.offPeakAllDay'),
      windowSummary: weekendDayLabel + t('plan.weekendOffPeakWindow'),
      periodId: 'weekend-chain-' + weekendDateKey,
      switchBody: t('plan.enteredWeekendOffPeak'),
    }
  }
  if (windows.length === 0) {
    return { configured: false, windows: [], weekendOffPeak: false, ariaText: t('panel.peakWindowsUnconfigured'), tip: t('plan.clockWindowsUnconfigured'), periodId: null }
  }
  var inPeak = false
  var segStart = null
  var segEnd = null
  for (var i = 0; i < windows.length; i++) {
    if (nowHour >= windows[i].startHour && nowHour < windows[i].endHour) {
      inPeak = true; segStart = windows[i].startHour; segEnd = windows[i].endHour; break
    }
  }
  if (!inPeak) {
    // Off-peak segment runs from the last passed boundary to the next one.
    var bounds = []
    for (var b = 0; b < windows.length; b++) bounds.push(windows[b].startHour, windows[b].endHour)
    bounds.sort(function (a, b2) { return a - b2 })
    segStart = -1
    segEnd = 25
    for (var c = 0; c < bounds.length; c++) {
      if (bounds[c] <= nowHour && bounds[c] > segStart) segStart = bounds[c]
      if (bounds[c] > nowHour && bounds[c] < segEnd) segEnd = bounds[c]
    }
    if (segStart < 0) segStart = bounds[bounds.length - 1] - 24 // late evening wraps to yesterday's last edge
  }
  // Late evening off-peak is past every boundary: the next switch is the
  // FIRST boundary of tomorrow (segEnd still sits at its 25 sentinel).
  var nextHour = !inPeak && segEnd > 24 ? bounds[0] : segEnd
  function hh(h) { return String(Math.floor(((h % 24) + 24) % 24)).padStart(2, '0') + ':00' }
  var winText = windows.map(function (w) { return hh(w.startHour) + '–' + hh(w.endHour) }).join(' / ')
  var tzName = policy.timezone || 'Asia/Shanghai'
  var rate = typeof policy.offPeakRate === 'number' && policy.offPeakRate > 0 ? policy.offPeakRate : 0.5
  var rateWord = rate === 0.5 ? t('plan.halfPrice') : '×' + rate
  var hoursLeft = (nextHour - nowHour + 24) % 24
  var msLeft = Math.round(hoursLeft * 3600000)
  var hLeft = Math.floor(msLeft / 3600000)
  var mLeft = Math.floor((msLeft % 3600000) / 60000)
  var leftText = hLeft > 0 ? hLeft + t('plan.hoursUnit') + mLeft + t('plan.minutesShortUnit') : mLeft + t('plan.minutesUnit')
  var leftShort = hLeft > 0 ? (hLeft + 'h' + (mLeft > 0 ? mLeft + 'm' : '')) : (mLeft + 'm')
  var switchText = inPeak ? (hh(nextHour) + t('plan.inSuffix') + rateWord) : (hh(nextHour) + t('plan.resumeStandardRate'))
  var period = inPeak ? t('plan.peak') : t('plan.offPeak') + rateWord
  var periodName = inPeak ? t('plan.peakWindow') : t('plan.offPeakWindow')
  var rateBadge = inPeak ? t('plan.standardRate') : (rate === 0.5 ? t('plan.halfPrice') : '×' + rate)
  var offsetMinutesForDay = policy && Number.isFinite(policy.offsetMinutes) ? policy.offsetMinutes : 480
  var localWallDate = Number.isFinite(nowMs) ? new Date(nowMs + offsetMinutesForDay * 60000) : null
  var localDay = localWallDate ? localWallDate.getUTCDay() : -1
  var weekendRuleSince = policy && Number.isFinite(policy.weekendOffPeakSince) ? policy.weekendOffPeakSince : -Infinity
  var nextLocalMidnightMs = localWallDate
    ? Date.UTC(localWallDate.getUTCFullYear(), localWallDate.getUTCMonth(), localWallDate.getUTCDate() + 1) - offsetMinutesForDay * 60000
    : Infinity
  var currentLocalMidnightMs = localWallDate
    ? Date.UTC(localWallDate.getUTCFullYear(), localWallDate.getUTCMonth(), localWallDate.getUTCDate()) - offsetMinutesForDay * 60000
    : Infinity
  var fridayAfterLastPeak = !inPeak && localDay === 5 && nowHour >= windows[windows.length - 1].endHour && nextLocalMidnightMs >= weekendRuleSince
  var mondayBeforeFirstPeak = !inPeak && localDay === 1 && nowHour < windows[0].startHour && currentLocalMidnightMs >= weekendRuleSince
  var countdownSummary = fridayAfterLastPeak
    ? t('plan.weekendOffPeakAllDay')
    : mondayBeforeFirstPeak ? (t('plan.leftPrefix') + leftShort + t('plan.enterPeakSuffix')) : (hh(nextHour) + t('plan.switchLeftMiddle') + leftShort)
  var windowSummary = fridayAfterLastPeak
    ? t('plan.weekendWindowNote')
    : t('plan.peakPrefix') + winText
  // Dual timezone: billing is judged in the policy's base zone; a device
  // elsewhere also sees the local-clock span of the CURRENT segment.
  var localNote = ''
  try {
    var localTz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (localTz && localTz !== tzName && Number.isFinite(nowMs)) {
      var hoursAgo = (nowHour - segStart + 24) % 24
      var segLenH = ((nextHour - segStart) % 24 + 24) % 24 || 24
      var startInstant = nowMs - hoursAgo * 3600000
      var endInstant = startInstant + segLenH * 3600000
      var fmtLocal = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
      localNote = t('plan.localTimeMiddle') + fmtLocal.format(startInstant) + '–' + fmtLocal.format(endInstant)
    }
  } catch (e) { /* timezone introspection is best-effort */ }
  var ariaText = inPeak
    ? t('plan.currentlyPeakPrefix') + tzName + ' ' + winText + t('plan.billedAtStandardRateSuffix')
    : t('plan.currentlyOffPeakPrefix') + rate + t('plan.timesRateMiddle') + tzName + t('plan.peakMiddle') + winText
  var tip = fridayAfterLastPeak
    ? t('plan.clockTipOffPeakHalfPrice') + tzName + localNote
    : t('plan.clockTipCurrent') + period + ' · ' + switchText + t('plan.remainingMiddle') + leftText
      + t('plan.peakMiddleWithTz') + winText + t('plan.peakTzWrapStart') + tzName + t('plan.peakTzWrapEnd') + localNote
  var periodId = (inPeak ? 'p' : 'o') + Math.round(segStart * 100)
  if ((fridayAfterLastPeak || mondayBeforeFirstPeak) && localWallDate) {
    var chainAnchorDays = mondayBeforeFirstPeak ? 3 : 0
    var chainAnchor = new Date(Date.UTC(localWallDate.getUTCFullYear(), localWallDate.getUTCMonth(), localWallDate.getUTCDate() - chainAnchorDays))
    var chainKey = [chainAnchor.getUTCFullYear(), String(chainAnchor.getUTCMonth() + 1).padStart(2, '0'), String(chainAnchor.getUTCDate()).padStart(2, '0')].join('-')
    periodId = 'weekend-chain-' + chainKey
  }
  return {
    configured: true, windows: windows, weekendOffPeak: false, inPeak: inPeak,
    nextHour: nextHour, ariaText: ariaText, tip: tip,
    periodName: periodName, rateBadge: rateBadge,
    countdownSummary: countdownSummary, windowSummary: windowSummary,
    // Reminder dedup id: entering this period at this boundary fires once.
    periodId: periodId,
    switchBody: inPeak ? t('plan.enteredPeak') : t('plan.enteredOffPeakPrefix') + rate + t('plan.timesRateSuffix'),
  }
}

// Sidebar foot occupant: the 24h peak/off-peak ring clock, registered on
// the host's sidebar.footer.action list so it sits in the strip the
// Sidebar foot occupant: the 24h peak/off-peak ring clock, registered on
// the host's sidebar.footer.action list so it sits in the strip the
// sidebar keeps right above its Settings row (bottom left). Zero in-ring text —
// the arcs, the bolded current segment and the hover tooltip carry the meaning.
// In wide mode, it displays the 46px ring clock alongside status, balance/cost, and countdown.
// In rail mode, it collapses to a 34px centered circular widget.
function PeakRingFooter(props) {
  props = props || {}
  var t = typeof props.t === 'function' ? props.t : walletT
  var wide = props.wide !== false
  var modelAware = props.modelAware === true
  var modelSelection = useCurrentModelSelection(props.sessionsService, props.modelDirectories, modelAware)
  var [shown, setShown] = React.useState(function () {
    try { return compatibility.storage.getItem(PEAK_RING_KEY) !== 'false' } catch (e) { return true }
  })
  var [orient, setOrient] = React.useState(function () {
    try { return compatibility.storage.getItem(PEAK_ORIENT_KEY) || 'horizontal' } catch (e) { return 'horizontal' }
  })
  var [peakBackground, setPeakBackground] = React.useState(function () {
    try { return normalizePeakBackground(compatibility.storage.getItem(PEAK_BACKGROUND_KEY)) } catch (e) { return 'transparent' }
  })
  var [showRecharge, setShowRecharge] = React.useState(function () {
    try { return compatibility.storage.getItem(PEAK_RECHARGE_KEY) !== 'false' } catch (e) { return true }
  })
  var [peakScale, setPeakScale] = React.useState(function () {
    try {
      var val = Number.parseFloat(compatibility.storage.getItem(PEAK_SCALE_KEY))
      return Number.isFinite(val) ? Math.min(1.2, Math.max(1.0, val)) : 1.0
    } catch (e) { return 1.0 }
  })
  var [dock, setDock] = React.useState(function () {
    try { return compatibility.storage.getItem(PEAK_DOCK_KEY) || 'sidebar' } catch (e) { return 'sidebar' }
  })
  var [pos, setPos] = React.useState(function () {
    try {
      var raw = compatibility.storage.getItem(PEAK_POS_KEY)
      if (raw) {
        var parsed = JSON.parse(raw)
        if (parsed && typeof parsed.x === 'number' && typeof parsed.y === 'number') return parsed
      }
      return null
    } catch (e) { return null }
  })
  var latestPosRef = React.useRef(pos)
  latestPosRef.current = pos
  var [dragging, setDragging] = React.useState(false)
  var [narrowCard, setNarrowCard] = React.useState(false)
  var [snapshot, setSnapshot] = React.useState(undefined) // undefined = loading
  var [nowMs, setNowMs] = React.useState(function () { return Date.now() })
  var dragRef = React.useRef(null)
  var didDragRef = React.useRef(false)
  // Guards the self-echo: every preference write dispatches the shared
  // change events so OTHER surfaces resync, but this component must not
  // re-read storage from its own dispatch — the listener would setState a
  // second time from a different call stack and race the update already
  // queued, which can drop the write that started it.
  var suppressSelfSyncRef = React.useRef(false)
  var [panelOpen, setPanelOpen] = React.useState(false)
  var [panelPos, setPanelPos] = React.useState({ left: 16, top: 16 })
  var cardNodeRef = React.useRef(null)
  var panelNodeRef = React.useRef(null)

  var [peakNotify, setPeakNotify] = React.useState(function () {
    try { return compatibility.storage.getItem(PEAK_NOTIFY_KEY) === 'true' } catch (e) { return false }
  })

  React.useEffect(function () {
    var stopped = false
    function loadSnap() {
      fetch('/api/wallet/snapshot').then(function (resp) { return resp.json() }).then(function (json) {
        if (!stopped && json && json.ok) setSnapshot(json)
      }).catch(function () { if (!stopped) setSnapshot({ ok: false }) })
    }
    loadSnap()
    var listensEvents = typeof window.addEventListener === 'function'
    function onRingChange() {
      // Skip our own echo (see suppressSelfSyncRef).
      if (suppressSelfSyncRef.current) return
      try {
        setShown(compatibility.storage.getItem(PEAK_RING_KEY) !== 'false')
        setOrient(compatibility.storage.getItem(PEAK_ORIENT_KEY) || 'horizontal')
        setPeakBackground(normalizePeakBackground(compatibility.storage.getItem(PEAK_BACKGROUND_KEY)))
        setShowRecharge(compatibility.storage.getItem(PEAK_RECHARGE_KEY) !== 'false')
        var val = Number.parseFloat(compatibility.storage.getItem(PEAK_SCALE_KEY))
        setPeakScale(Number.isFinite(val) ? Math.min(1.2, Math.max(1.0, val)) : 1.0)
        var currentDock = compatibility.storage.getItem(PEAK_DOCK_KEY) || 'sidebar'
        setDock(currentDock)
        setPeakNotify(compatibility.storage.getItem(PEAK_NOTIFY_KEY) === 'true')
        var raw = compatibility.storage.getItem(PEAK_POS_KEY)
        if (raw) {
          try {
            var parsed = JSON.parse(raw)
            if (parsed && typeof parsed.x === 'number' && typeof parsed.y === 'number') {
              setPos(parsed)
              latestPosRef.current = parsed
            }
          } catch (e) { /* ignore */ }
        } else if (currentDock === 'sidebar') {
          setPos(null)
          latestPosRef.current = null
        }
      } catch (e) { /* ignore */ }
      loadSnap()
    }
    function onSnapUpdate(event) {
      if (!stopped && event && event.detail && event.detail.ok) {
        setSnapshot(event.detail)
      }
    }
    if (listensEvents) {
      window.addEventListener(PEAK_RING_EVENT, onRingChange)
      window.addEventListener(SETTINGS_EVENT, onRingChange)
      window.addEventListener('dshw-refresh', onRingChange)
      window.addEventListener('dshw-snapshot-update', onSnapUpdate)
    }
    var timer = window.setInterval(function () {
      setNowMs(Date.now())
      loadSnap()
    }, 30000)
    return function () {
      stopped = true
      window.clearInterval(timer)
      if (listensEvents) {
        window.removeEventListener(PEAK_RING_EVENT, onRingChange)
        window.removeEventListener(SETTINGS_EVENT, onRingChange)
        window.removeEventListener('dshw-refresh', onRingChange)
        window.removeEventListener('dshw-snapshot-update', onSnapUpdate)
      }
    }
  }, [])

  React.useEffect(function () {
    if (!panelOpen) return
    function updatePosition() {
      var cardEl = cardNodeRef.current
      var panelEl = panelNodeRef.current
      if (!cardEl || !panelEl) return
      var cRect = cardEl.getBoundingClientRect()
      var pRect = panelEl.getBoundingClientRect()
      var winW = window.innerWidth || 1024
      var winH = window.innerHeight || 768
      var targetLeft = 16
      var targetTop = 16

      if (dock === 'sidebar') {
        targetLeft = Math.min(winW - pRect.width - 12, cRect.right + 12)
        targetTop = Math.max(12, Math.min(winH - pRect.height - 12, cRect.bottom - pRect.height))
      } else {
        targetLeft = Math.max(12, Math.min(winW - pRect.width - 12, cRect.left))
        if (cRect.bottom + pRect.height + 12 <= winH) {
          targetTop = cRect.bottom + 8
        } else {
          targetTop = Math.max(12, cRect.top - pRect.height - 8)
        }
      }
      setPanelPos({ left: Math.round(targetLeft), top: Math.round(targetTop) })
    }
    updatePosition()
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('resize', updatePosition)
      return function () {
        window.removeEventListener('resize', updatePosition)
      }
    }
  }, [panelOpen, dock, pos, peakScale, orient])

  React.useEffect(function () {
    if (!panelOpen) return
    function onDocDown(event) {
      var target = event.target
      if (panelNodeRef.current && panelNodeRef.current.contains(target)) return
      if (cardNodeRef.current && cardNodeRef.current.contains(target)) return
      setPanelOpen(false)
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') setPanelOpen(false)
    }
    document.addEventListener('pointerdown', onDocDown)
    document.addEventListener('keydown', onKeyDown)
    return function () {
      document.removeEventListener('pointerdown', onDocDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [panelOpen])

  var policy = snapshot && snapshot.pricingWindows ? snapshot.pricingWindows : null

  React.useEffect(function () {
    if (policy === undefined || policy === null) return
    try {
      if (compatibility.storage.getItem(PEAK_NOTIFY_KEY) !== 'true') return
    } catch (e) { return }
    var tzName = policy.timezone || 'Asia/Shanghai'
    var state = peakClockState(policy, wallHourIn(tzName, policy.offsetMinutes, new Date(nowMs)), nowMs, t)
    if (!state.periodId) return
    var last = null
    try { last = compatibility.storage.getItem(PEAK_NOTIFY_LAST_KEY) } catch (e) { /* ignore */ }
    if (last === state.periodId) return
    try { compatibility.storage.setItem(PEAK_NOTIFY_LAST_KEY, state.periodId) } catch (e) { /* ignore */ }
    if (last === null) return
    try {
      compatibility.notify(t('panel.peakSwitchTitle'), {
        body: state.switchBody, tag: 'dsh-wallet-peak'
      })
    } catch (e) { /* ignore */ }
  }, [policy, nowMs])

  var isFreeFloating = dock === 'free'
  var isVertical = orient === 'vertical' && (wide || isFreeFloating)
  var isRail = !wide && !isFreeFloating

  // Some skins reserve more inner sidebar padding and enlarge typography.
  // Detect actual text overflow instead of keying behavior to a skin name
  // or a fixed card width. Measurement is read-only: mutating the observed
  // card inside ResizeObserver can create a skin/layout feedback loop while
  // the host is switching model menus.
  useLayoutEffect(function () {
    var node = cardNodeRef.current
    if (isRail || isVertical || !node || typeof node.getBoundingClientRect !== 'function') {
      setNarrowCard(false)
      return
    }
    var measureCanvas = typeof document !== 'undefined' && typeof document.createElement === 'function'
      ? document.createElement('canvas')
      : null
    var measureContext = measureCanvas && typeof measureCanvas.getContext === 'function' ? measureCanvas.getContext('2d') : null
    function textWidth(element) {
      if (!element) return 0
      if (!measureContext || typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') return element.scrollWidth || 0
      var style = window.getComputedStyle(element)
      measureContext.font = style.font || (style.fontSize + ' ' + style.fontFamily)
      var text = element.textContent || ''
      var width = measureContext.measureText(text).width
      var spacing = Number.parseFloat(style.letterSpacing)
      if (Number.isFinite(spacing) && text.length > 1) width += spacing * (text.length - 1)
      return width
    }
    function measure() {
      var money = node.querySelector && node.querySelector('.dshw_footRingMoney')
      var countdown = node.querySelector && node.querySelector('.dshw_footRingCountdown')
      var bottom = node.querySelector && node.querySelector('.dshw_footRingBottom')
      var recharge = node.querySelector && node.querySelector('.dshw_footRingBtnRechargeInline')
      var groups = money && money.querySelectorAll ? [...money.querySelectorAll('.dshw_footRingMoneyGroup')] : []
      var requiredMoney = groups.reduce(function (total, group) { return total + group.getBoundingClientRect().width }, 0)
        + (groups.length > 1 ? 10 : 0)
      var countdownRoom = bottom ? bottom.clientWidth - (recharge ? recharge.getBoundingClientRect().width + 6 : 0) : 0
      var overflowed = !!((money && requiredMoney > money.clientWidth + 1)
        || (countdown && textWidth(countdown) > countdownRoom + 1))
      setNarrowCard(overflowed)
    }
    measure()
    if (typeof ResizeObserver === 'function') {
      var observer = new ResizeObserver(measure)
      observer.observe(node)
      return function () { observer.disconnect() }
    }
    window.addEventListener('resize', measure)
    return function () { window.removeEventListener('resize', measure) }
  }, [snapshot, isRail, isVertical, isFreeFloating, peakScale, showRecharge, modelSelection && modelSelection.provider, modelSelection && modelSelection.model])

  // A saved floating coordinate is not trustworthy after a window resize
  // or scale change. Re-measure the rendered card (including transform)
  // and persist the corrected coordinate before it can disappear outside
  // the viewport. This hook must run even while the card is still loading,
  // otherwise React sees a changing hook count when the snapshot arrives.
  useLayoutEffect(function () {
    if (!isFreeFloating || !cardNodeRef.current) return
    var node = cardNodeRef.current
    function fitFloatingPeakCard() {
      if (!node || typeof node.getBoundingClientRect !== 'function') return
      var rect = node.getBoundingClientRect()
      var current = latestPosRef.current || pos || { x: rect.left, y: rect.top }
      var fitted = clampPeakPosition(current, rect.width, rect.height, window.innerWidth, window.innerHeight, 8)
      if (fitted.x === current.x && fitted.y === current.y && pos !== null) return
      latestPosRef.current = fitted
      setPos(fitted)
      try { compatibility.storage.setItem(PEAK_POS_KEY, JSON.stringify(fitted)) } catch (e) { /* ignore */ }
    }
    fitFloatingPeakCard()
    window.addEventListener('resize', fitFloatingPeakCard)
    return function () { window.removeEventListener('resize', fitFloatingPeakCard) }
  }, [isFreeFloating, pos, peakScale, orient, showRecharge])

  if (!shown || snapshot === undefined) return null
  var providerMode = providerModeFor(modelSelection, snapshot, modelAware)
  if (providerMode.kind !== 'deepseek') return null
  if (modelAware && !peakClockAppliesFor(providerMode, policy)) return null
  var tzName = policy && policy.timezone ? policy.timezone : 'Asia/Shanghai'
  var offsetMinutes = policy && typeof policy.offsetMinutes === 'number' ? policy.offsetMinutes : 480
  var state = peakClockState(policy, wallHourIn(tzName, offsetMinutes, new Date(nowMs)), nowMs, t)

  var bal = snapshot && snapshot.balance ? snapshot.balance : {}
  var balCurrency = bal && bal.currency ? bal.currency : 'CNY'
  var balText = bal.total !== null && bal.total !== undefined ? fmtCurrency(bal.total, balCurrency) : fmtCurrency(0, balCurrency)
  var session = snapshot && snapshot.session ? snapshot.session : {}
  var official = session && session.official ? session.official : {}
  var costValue = (official.cost === null || official.cost === undefined) ? 0 : official.cost
  var costText = sessionCostText(costValue, balCurrency)
  var costLabel = sessionCostLabel(balCurrency, t)
  var low = snapshot && snapshot.lowBalance === true

  // Announce a preference change to the other surfaces (settings page, a
  // second window) while suppressing our own listener, so this component's
  // queued setState is the single writer for this interaction.
  function announcePrefs(includeRingEvent) {
    suppressSelfSyncRef.current = true
    try {
      try { compatibility.dispatch(SETTINGS_EVENT) } catch (e) { /* ignore */ }
      if (includeRingEvent !== false) {
        try { compatibility.dispatch(PEAK_RING_EVENT) } catch (e) { /* ignore */ }
      }
    } finally {
      suppressSelfSyncRef.current = false
    }
  }

  function updateOrient(val) {
    setOrient(val)
    try { compatibility.storage.setItem(PEAK_ORIENT_KEY, val) } catch (e) { /* ignore */ }
    announcePrefs()
  }
  function updateBackground(val) {
    val = normalizePeakBackground(val)
    setPeakBackground(val)
    try { compatibility.storage.setItem(PEAK_BACKGROUND_KEY, val) } catch (e) { /* ignore */ }
    announcePrefs()
  }
  function updateScale(val) {
    val = Math.min(1.2, Math.max(1.0, Math.round(val * 20) / 20))
    setPeakScale(val)
    try { compatibility.storage.setItem(PEAK_SCALE_KEY, String(val)) } catch (e) { /* ignore */ }
    announcePrefs()
  }
  function updateRecharge(val) {
    setShowRecharge(val)
    try { compatibility.storage.setItem(PEAK_RECHARGE_KEY, String(val)) } catch (e) { /* ignore */ }
    announcePrefs()
  }
  function updateNotify(val) {
    setPeakNotify(val)
    try { compatibility.storage.setItem(PEAK_NOTIFY_KEY, String(val)) } catch (e) { /* ignore */ }
    announcePrefs(false)
  }

  function handlePointerDown(e) {
    if (isRail) return
    var targetEl = e.target && e.target.nodeType === 3 ? e.target.parentElement : e.target
    if (targetEl && typeof targetEl.closest === 'function' && (targetEl.closest('button') || targetEl.closest('a') || targetEl.closest('input') || targetEl.closest('select'))) return
    if (e.button !== undefined && e.button !== 0) return
    var targetNode = e.currentTarget
    var rect = targetNode.getBoundingClientRect()
    var curX = (isFreeFloating && pos && typeof pos.x === 'number') ? pos.x : rect.left
    var curY = (isFreeFloating && pos && typeof pos.y === 'number') ? pos.y : rect.top
    var grabOffsetX = e.clientX - curX
    var grabOffsetY = e.clientY - curY
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      grabOffsetX: grabOffsetX,
      grabOffsetY: grabOffsetY,
      rectWidth: rect.width,
      rectHeight: rect.height,
      dragged: false,
      pointerId: e.pointerId
    }
    didDragRef.current = false
    latestPosRef.current = { x: curX, y: curY }

    function onMove(moveEvent) {
      if (!dragRef.current) return
      var dx = moveEvent.clientX - dragRef.current.startX
      var dy = moveEvent.clientY - dragRef.current.startY
      if (!dragRef.current.dragged && Math.hypot(dx, dy) > 3) {
        dragRef.current.dragged = true
        didDragRef.current = true
        setDragging(true)
        setDock('free')
      }
      if (dragRef.current.dragged) {
        var w = dragRef.current.rectWidth || (isVertical ? 140 : 180)
        var h = dragRef.current.rectHeight || (isVertical ? 120 : 60)
        var nextPos = clampPeakPosition({
          x: moveEvent.clientX - dragRef.current.grabOffsetX,
          y: moveEvent.clientY - dragRef.current.grabOffsetY,
        }, w, h, window.innerWidth, window.innerHeight, 8)
        latestPosRef.current = nextPos
        setPos(nextPos)
      }
    }
    function onUp() {
      if (dragRef.current && dragRef.current.dragged) {
        var finalPos = latestPosRef.current || { x: curX, y: curY }
        try {
          compatibility.storage.setItem(PEAK_DOCK_KEY, 'free')
          if (finalPos) compatibility.storage.setItem(PEAK_POS_KEY, JSON.stringify(finalPos))
        } catch (err) { /* ignore */ }
        setDragging(false)
        setDock('free')
        setPos(finalPos)
        announcePrefs(false)
      }
      dragRef.current = null
      // Release the "this was a drag, swallow the click" latch after the
      // click that follows pointerup. Without this the flag stays true
      // whenever the next pointerdown never arrives (pointer released
      // outside the window, a cancelled gesture), and every later click on
      // the card is swallowed — the control panel then refuses to open
      // until the page is reloaded.
      if (typeof window.setTimeout === 'function') {
        window.setTimeout(function () { didDragRef.current = false }, 0)
      } else {
        didDragRef.current = false
      }
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  function handleResetDock(e) {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation()
    setDock('sidebar')
    setPos(null)
    latestPosRef.current = null
    try {
      compatibility.storage.setItem(PEAK_DOCK_KEY, 'sidebar')
      compatibility.storage.removeItem(PEAK_POS_KEY)
    } catch (err) { /* ignore */ }
    announcePrefs()
  }


  var cardStyle = {}
  if (isFreeFloating) {
    cardStyle.position = 'fixed'
    if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
      cardStyle.left = pos.x + 'px'
      cardStyle.top = pos.y + 'px'
    } else {
      cardStyle.left = '20px'
      cardStyle.top = '100px'
    }
    cardStyle.zIndex = 90
    if (peakScale && peakScale !== 1) {
      cardStyle.transform = 'scale(' + peakScale + ')'
      cardStyle.transformOrigin = 'top left'
    }
  } else {
    if (!isVertical) {
      cardStyle.width = '100%'
    } else {
      cardStyle.width = 'fit-content'
      cardStyle.maxWidth = Math.round(148 * peakScale) + 'px'
      cardStyle.marginLeft = 'auto'
      cardStyle.marginRight = 'auto'
    }
    cardStyle.boxSizing = 'border-box'
    cardStyle.marginBottom = Math.round(8 * peakScale) + 'px'
  }

  var containerClasses = ['dshw_footRing']
  if (isRail) containerClasses.push('dshw_footRingRail')
  if (isVertical) containerClasses.push('dshw_footRingVertical')
  if (!isVertical && !showRecharge) containerClasses.push('dshw_footRingNoRecharge')
  if (isFreeFloating) containerClasses.push('dshw_footRingFloating')
  if (narrowCard) containerClasses.push('dshw_footRingNarrow')
  if (dragging) containerClasses.push('dshw_footRingDragging')
  if (low) containerClasses.push('dshw_low')

  var clockSize = isRail
    ? 36
    : (isFreeFloating ? (isVertical ? 42 : 50) : Math.round((isVertical ? 42 : 50) * peakScale))

  var cardElement = React.createElement('div', {
    ref: cardNodeRef,
    className: containerClasses.join(' '),
    'data-dshw-peak-background': peakBackground,
    style: Object.keys(cardStyle).length > 0 ? cardStyle : undefined,
    title: state.tip + t('panel.balanceMiddle') + balText + ' · ' + costLabel + ' ' + costText + (isRail ? t('panel.clickToTopUp') : t('panel.clickToExpandPanel')),
    'aria-label': state.ariaText + t('panel.balanceComma') + balText + t('panel.balanceCommaTail') + costLabel + ' ' + costText,
    role: 'button',
    tabIndex: 0,
    onPointerDown: isRail ? undefined : handlePointerDown,
    onClick: function (e) {
      if (isRail) {
        openOfficialRecharge()
        return
      }
      if (didDragRef.current !== true) {
        setPanelOpen(function (prev) { return !prev })
      }
    },
    onKeyDown: function (e) {
      if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        setPanelOpen(function (prev) { return !prev })
      }
    }
  },
    isFreeFloating ? React.createElement('button', {
      type: 'button',
      className: 'dshw_footRingResetBtn',
      title: t('panel.returnToSidebarBottom'),
      'aria-label': t('panel.returnToSidebarBottom'),
      onClick: handleResetDock
    }, t('settings.redockButton')) : null,
    React.createElement('div', { style: { flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
      peakRingSVG(state.configured ? state.windows : null, wallHourIn(tzName, offsetMinutes, new Date(nowMs)), clockSize, state.ariaText, state.weekendOffPeak, t)
    ),
    !isRail ? React.createElement('div', { className: 'dshw_footRingLabel' },
      React.createElement('div', { className: 'dshw_footRingHeader' },
        React.createElement('span', {
          className: 'dshw_footRingTitle',
          style: {
            color: state.configured ? (state.inPeak ? 'var(--dsw-alias-state-error-primary,#e5534b)' : 'var(--dsw-alias-state-success-primary,#1a7f37)') : 'inherit',
            fontSize: isFreeFloating ? undefined : (Math.round((isVertical ? 12 : 13.5) * peakScale) + 'px')
          }
        }, state.configured ? state.periodName : t('settings.peakClock'))
      ),
      React.createElement('div', {
        className: 'dshw_footRingMoney' + (low ? ' dshw_low' : ''),
        style: isFreeFloating ? undefined : { fontSize: (Math.round((isVertical ? 11 : 12.5) * peakScale) + 'px') }
      },
        React.createElement('span', { className: 'dshw_footRingMoneyGroup' },
          React.createElement('span', { className: 'dshw_muted' }, t('panel.balanceLabel')),
          React.createElement('span', { className: 'dshw_footBalNum', style: { fontWeight: '600' } }, balText)),
        React.createElement('span', { className: 'dshw_balDot', style: { margin: '0 3px' } }, '·'),
        React.createElement('span', { className: 'dshw_footRingMoneyGroup' },
          React.createElement('span', { className: 'dshw_muted' }, costLabel + ' '),
          React.createElement('span', { style: { fontWeight: '600' } }, costText))
      ),
      React.createElement('div', { className: 'dshw_footRingBottom' },
        React.createElement('span', {
          className: 'dshw_footRingCountdown',
          style: isFreeFloating ? undefined : { fontSize: (Math.round((isVertical ? 10 : 11) * peakScale) + 'px') }
        }, state.configured ? state.countdownSummary : t('panel.windowsUnconfigured')),
        showRecharge ? React.createElement('button', {
          type: 'button',
          className: 'dshw_footRingBtnRechargeInline',
          title: t('panel.deepSeekOfficialTopUp'),
          'aria-label': t('panel.goTopUpOfficial'),
          onClick: function (e) {
            if (e && typeof e.stopPropagation === 'function') e.stopPropagation()
            openOfficialRecharge()
          }
        }, t('chip.recharge')) : null
      )
    ) : null
  )

  var panelElement = panelOpen ? React.createElement('div', {
    ref: panelNodeRef,
    className: 'dshw_peakPanel',
    style: { left: panelPos.left + 'px', top: panelPos.top + 'px' },
    role: 'dialog',
    'aria-label': t('panel.peakClockDedicatedPanel')
  },
    React.createElement('div', { className: 'dshw_peakPanelHeader' },
      React.createElement('span', { style: { display: 'flex', alignItems: 'center', gap: '6px' } },
        React.createElement('span', { style: { color: 'var(--dsw-alias-brand-primary,#4aa3ff)' } }, '⚡'),
        React.createElement('strong', null, t('panel.peakClockPanelTitle'))),
      React.createElement('button', {
        type: 'button',
        className: 'dshw_peakPanelClose',
        title: t('panel.closePanelWithEsc'),
        'aria-label': t('panel.closePanel'),
        onClick: function (e) { e.stopPropagation(); setPanelOpen(false) }
      }, '×')),
    React.createElement('div', { className: 'dshw_peakStatusCard' },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
        React.createElement('span', {
          style: {
            fontWeight: '700',
            fontSize: '13px',
            color: state.configured ? (state.inPeak ? 'var(--dsw-alias-state-error-primary,#e5534b)' : 'var(--dsw-alias-state-success-primary,#1a7f37)') : 'inherit'
          }
        }, state.configured ? (state.periodName + (state.inPeak ? t('panel.standardRateParen') : t('panel.halfPriceParen'))) : t('panel.windowsUnconfigured')),
        React.createElement('span', { className: 'dshw_muted', style: { fontSize: '11px' } }, state.countdownSummary)),
      React.createElement('div', { className: 'dshw_muted', style: { fontSize: '11px', marginTop: '2px' } }, state.windowSummary),
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '5px', paddingTop: '5px', borderTop: '1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.12))' } },
        React.createElement('span', { style: { fontSize: '11.5px' } }, t('panel.balanceLabel') + balText + ' · ' + costLabel + ' ' + costText),
        React.createElement('button', {
          type: 'button',
          className: 'dshw_btn dshw_btnPrimary',
          style: { height: '22px', fontSize: '11px', padding: '0 8px' },
          onClick: function () { openOfficialRecharge() }
        }, t('panel.rechargeShort')))),
    React.createElement('div', { className: 'dshw_divider' }),
    React.createElement('div', { className: 'dshw_peakRow' },
      React.createElement('span', { className: 'dshw_muted' }, t('panel.clockLayout')),
      React.createElement('select', {
        className: 'dshw_select',
        style: { height: '24px', fontSize: '11px' },
        'aria-label': t('panel.clockLayoutAria'),
        value: orient,
        onChange: function (e) { updateOrient(e.target.value) }
      },
        React.createElement('option', { value: 'horizontal' }, t('settings.layoutHorizontal')),
        React.createElement('option', { value: 'vertical' }, t('settings.layoutVertical')))),
    React.createElement('div', { className: 'dshw_peakRow' },
      React.createElement('span', { className: 'dshw_muted' }, t('settings.clockBackground')),
      React.createElement('select', {
        className: 'dshw_select',
        style: { height: '24px', fontSize: '11px' },
        'aria-label': t('panel.clockBackgroundAria'),
        value: peakBackground,
        onChange: function (e) { updateBackground(e.target.value) }
      },
        React.createElement('option', { value: 'transparent' }, t('settings.backgroundTransparent')),
        React.createElement('option', { value: 'solid' }, t('settings.backgroundSolid')))),
    React.createElement('div', { className: 'dshw_peakRow' },
      React.createElement('span', { className: 'dshw_muted' }, t('panel.clockSize') + Math.round(peakScale * 100) + '%)'),
      React.createElement('span', { className: 'dshw_scaleControl' },
        React.createElement('input', {
          className: 'dshw_scaleInput', type: 'range', min: '100', max: '120', step: '5',
          value: String(Math.round(peakScale * 100)),
          'aria-label': t('panel.clockCardScaleAria'),
          onInput: function (e) { updateScale(Number.parseFloat(e.target.value) / 100) },
          onChange: function (e) { updateScale(Number.parseFloat(e.target.value) / 100) }
        }))),
    React.createElement('div', { className: 'dshw_peakRow' },
      React.createElement('span', { className: 'dshw_muted' }, t('settings.clockTopUpButton')),
      React.createElement('label', { className: 'dshw_switch' },
        React.createElement('input', {
          type: 'checkbox', checked: showRecharge,
          'aria-label': t('panel.clockTopUpButtonAria'),
          onChange: function (e) { updateRecharge(e.target.checked) }
        }),
        React.createElement('span', { className: 'dshw_track', 'aria-hidden': 'true' }),
        React.createElement('span', { className: 'dshw_knob', 'aria-hidden': 'true' }))),
    React.createElement('div', { className: 'dshw_peakRow' },
      React.createElement('span', { className: 'dshw_muted' }, t('settings.peakSwitchAlert')),
      React.createElement('label', { className: 'dshw_switch' },
        React.createElement('input', {
          type: 'checkbox', checked: peakNotify,
          'aria-label': t('panel.peakSwitchNotifyAria'),
          onChange: function (e) { updateNotify(e.target.checked) }
        }),
        React.createElement('span', { className: 'dshw_track', 'aria-hidden': 'true' }),
        React.createElement('span', { className: 'dshw_knob', 'aria-hidden': 'true' }))),
    React.createElement('div', { className: 'dshw_peakRow' },
      React.createElement('span', { className: 'dshw_muted' }, t('settings.clockPosition')),
      isFreeFloating ? React.createElement('button', {
        type: 'button',
        className: 'dshw_btn',
        style: { height: '24px', fontSize: '11px' },
        onClick: handleResetDock
      }, t('panel.returnToSidebar')) : React.createElement('span', { className: 'dshw_muted', style: { fontSize: '11px' } }, t('panel.sidebarBottomDraggable'))),
    React.createElement('div', { style: { marginTop: '4px', textAlign: 'right', fontSize: '10px', color: 'var(--dsw-alias-label-secondary,var(--dsw-alias-label-tertiary,#667085))' } },
      'DeepSeek Harness Control Center v' + WALLET_VERSION)
  ) : null

  function renderWithPortal(elem) {
    if (ReactDOM && typeof ReactDOM.createPortal === 'function' && typeof document !== 'undefined' && document.body) {
      return ReactDOM.createPortal(elem, document.body)
    }
    return elem
  }

  if (panelOpen) {
    var renderedCard = isFreeFloating ? renderWithPortal(cardElement) : cardElement
    var renderedPanel = renderWithPortal(panelElement)
    return React.createElement(React.Fragment, null, renderedCard, renderedPanel)
  }
  return isFreeFloating ? renderWithPortal(cardElement) : cardElement
}
