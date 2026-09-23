import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

// Stand-in for @deepseek-ai/dsh-client-locale. `locale` is a REQUIRED
// dependency (cordis throws on an undeclared service read), so every ctx that
// reaches apply() must provide it, exactly as the real host composition does.
function stubLocale() {
  return {
    register() { return () => {} },
    bind() { return (key) => key },
  }
}

test('composer model resolution declares remote.session in its calling scope', () => {
  let definition
  runInNewContext(readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8'), {
    window: { __ModuleLoader__: { load(value) { definition = value } } },
  })
  const plugin = definition.factory(() => ({ useEffect() {} }))
  let resolved = false
  plugin.apply({
    locale: stubLocale(),
    effect(run) { return run() },
    inject(dependencies, callback) {
      if (!dependencies.includes('conversation')) return
      const allowed = new Set([...plugin.inject, ...dependencies])
      const scope = {
        modelDirectories: {
          directoryFor(sessionId) {
            assert.ok(allowed.has('remote'), 'remote namespace must be declared')
            assert.ok(allowed.has('remote.session'), 'Cordis rejects undeclared caller dependencies')
            assert.equal(sessionId, 'synthetic-session')
            resolved = true
            return { store: {} }
          },
        },
        effect(run) { return run() },
        slots: { register(descriptor) { assert.ok(descriptor.inject('synthetic-session').modelDirectory) } },
      }
      callback(scope)
    },
  })
  assert.ok(resolved)
  assert.ok(plugin.inject.includes('remote.session'), 'settings and footer calls also need the root dependency')
})

test('the wallet declares the locale service its i18n probe reads', () => {
  let definition
  runInNewContext(readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8'), {
    window: { __ModuleLoader__: { load(value) { definition = value } } },
  })
  const plugin = definition.factory(() => ({ useEffect() {} }))
  assert.ok(
    plugin.inject.includes('locale'),
    'the i18n wiring reads ctx.locale, and cordis throws on an undeclared service read, so locale must be injected',
  )
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  assert.ok(
    pkg.dsh.client.inject.includes('@deepseek-ai/dsh-client-locale'),
    'the locale client module must be declared so the face is installed before the wallet applies',
  )
})

// The whole point of the single resolution point: after apply() attaches the
// service, flipping the active locale must change rendered copy with no
// rebinding and no re-mount. This is the property the old prop-threaded design
// could not guarantee (each of the three i18n defects — the cordis crash, the
// silent-Chinese nested panels, and the untranslatable server strings — was a
// way for one caller to miss the switch).
test('a live locale switch changes copy without rebinding the translator', () => {
  let definition
  runInNewContext(readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8'), {
    window: { __ModuleLoader__: { load(value) { definition = value } } },
  })
  const zh = {}, en = {}
  for (const name of ['zh', 'en']) {
    const sandbox = {}
    runInNewContext(readFileSync(new URL(`../src/client/locales/${name}.js`, import.meta.url), 'utf8'), sandbox)
    Object.assign(name === 'zh' ? zh : en, sandbox[`wallet${name === 'zh' ? 'Zh' : 'En'}`])
  }
  let active = 'zh', revision = 0
  const listeners = new Set()
  const face = {
    register() { return () => {} },
    bind() {
      return (key, params) => {
        const dict = active === 'zh' ? zh : en
        let text = dict[key] ?? zh[key] ?? key
        if (params) for (const [k, v] of Object.entries(params)) text = text.replaceAll(`{${k}}`, String(v))
        return text
      }
    },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
    getSnapshot() { return { revision, active } },
  }
  const switchTo = (locale) => { active = locale; revision += 1; for (const fn of [...listeners]) fn() }

  const React = {
    createElement: (type, props, ...children) => ({ type, props: { ...(props || {}), children: children.length === 1 ? children[0] : children } }),
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
    useRef: (initial) => ({ current: initial }),
    useEffect() {},
    useLayoutEffect() {},
    useSyncExternalStore(subscribe, getSnapshot) { subscribe(() => {}); return getSnapshot() },
  }
  let loaded
  runInNewContext(readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8'), {
    window: { __ModuleLoader__: { load(value) { loaded = value } } },
  })
  const plugin = loaded.factory(() => React)
  plugin.apply({
    locale: face,
    effect(run) { return run() },
    inject(_names, callback) {
      callback({ effect(run) { return run() }, slots: { register: () => () => {} } })
    },
  })

  // Pure helpers read the module binding, so they prove the binding follows the
  // switch even with no component involved.
  const helpers = plugin.__testing
  assert.match(helpers.balanceErrorText('unauthorized'), /[\u4e00-\u9fff]/, 'zh copy renders before the switch')
  switchTo('en')
  assert.doesNotMatch(helpers.balanceErrorText('unauthorized'), /[\u4e00-\u9fff]/,
    'the same helper returned Chinese after switching to en — the translator is pinned to one language')
  switchTo('zh')
  assert.match(helpers.balanceErrorText('unauthorized'), /[\u4e00-\u9fff]/, 'switching back restores zh')
})

// Every component resolves `t` from the single module-level binding via
// useWalletT(). Nothing threads a translate function through props: the
// renderer's `locale:` seat reaches slot-registered entries only, so a nested
// component taking `t` as a prop is the exact shape that silently renders the
// wrong language. These assertions pin the replacement contract.
test('wallet components resolve the translator locally instead of through props', () => {
  const components = ['wallet.js', 'settings.js', 'views.js'].map((name) => ({
    name,
    source: readFileSync(new URL('../src/client/' + name, import.meta.url), 'utf8'),
  }))
  for (const { name, source } of components) {
    assert.doesNotMatch(
      source,
      /props\.t\b/,
      `${name} still reads props.t — the translator must come from useWalletT()`,
    )
    assert.doesNotMatch(
      source,
      /,\s*t\)|,\s*t\s*[,}]/,
      `${name} still passes t as an argument — the callee reads the module binding`,
    )
  }
  // Each component that renders copy must open with the hook.
  const consumers = [
    ['wallet.js', 'WalletChip'],
    ['settings.js', 'WalletSettingsSection'],
    ['settings.js', 'PeakRingFooter'],
    ['views.js', 'UsageHistoryPanel'],
    ['views.js', 'PlanUsagePanel'],
  ]
  for (const [file, component] of consumers) {
    const source = components.find((entry) => entry.name === file).source
    const body = source.slice(source.indexOf(`function ${component}(props)`))
    const head = body.slice(0, body.indexOf('\n\n'))
    assert.match(
      head,
      /var t = useWalletT\(\)/,
      `${component} must resolve its translator with useWalletT()`,
    )
  }
  // The nested panels must no longer be handed a translator at creation sites.
  let checked = 0
  for (const { name, source } of components) {
    for (const panel of ['UsageHistoryPanel', 'PlanUsagePanel']) {
      const re = new RegExp('React\\.createElement\\(' + panel + ',\\s*\\{([^}]*)\\}', 'g')
      let match
      while ((match = re.exec(source)) !== null) {
        checked += 1
        assert.doesNotMatch(match[1], /t:\s*t\b/, `${name}: ${panel} must not receive t as a prop`)
      }
    }
  }
  assert.ok(checked >= 6, 'expected every nested panel creation site to be covered')
})

// 0.1.7 moved view selection out of the session controller into the workspace
// service: `sessions.open` (and `select`, and the `selected` field) were removed
// outright, so the completion notifier's click-to-open had to stop hardcoding
// it. These pin the replacement contract — a capability probe, deliberately not
// a version check, so an unknown host (0.1.6, a future release, a private build)
// resolves correctly without a mapping table.
test('the completion notifier navigates through whichever session seam the host exposes', () => {
  let definition
  runInNewContext(readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8'), {
    window: { __ModuleLoader__: { load(value) { definition = value } } },
  })
  const plugin = definition.factory(() => ({ useEffect() {} }))
  const resolve = plugin.__testing.resolveSessionOpener
  assert.equal(typeof resolve, 'function', 'the opener resolver must be exported for coverage')

  // 0.1.7 shape: `sessions.open` is gone; `uiWorkspace.openSession` is present.
  const viaWorkspace = []
  const modern = resolve({
    get: (name) => (name === 'uiWorkspace' ? { openSession: (id) => viaWorkspace.push(id) } : undefined),
    sessions: { list: {} },
  })
  assert.equal(modern.via, 'uiWorkspace.openSession', '0.1.7 must navigate through the workspace service')
  modern.open('s-1')
  assert.deepEqual(viaWorkspace, ['s-1'])

  // 0.1.2 shape: no `uiWorkspace` service at all -> the old seam must carry it.
  const viaSessions = []
  const legacy = resolve({
    get: () => undefined,
    sessions: { open: (id) => viaSessions.push(id), list: {} },
  })
  assert.equal(legacy.via, 'sessions.open', 'a host without the workspace service keeps working')
  legacy.open('s-2')
  assert.deepEqual(viaSessions, ['s-2'])

  // 0.1.5 shape: both exist. The workspace seam wins because there it is a
  // superset (same selection plus clearing the side panel).
  const both = resolve({
    get: (name) => (name === 'uiWorkspace' ? { openSession() {} } : undefined),
    sessions: { open() {}, list: {} },
  })
  assert.equal(both.via, 'uiWorkspace.openSession', 'the superset seam is preferred when both exist')

  // A host exposing neither seam degrades to a null opener instead of throwing.
  assert.equal(resolve({ get: () => undefined, sessions: { list: {} } }).open, null)

  // Cordis rejects an undeclared service read by THROWING, so the probe must
  // swallow that and fall through rather than take the plugin down.
  const guarded = resolve({
    get() { throw new Error('cannot get property "uiWorkspace" without inject') },
    sessions: { open() {}, list: {} },
  })
  assert.equal(guarded.via, 'sessions.open', 'a throwing service read must fall through to the old seam')

  // Malformed hosts must not crash the resolver.
  for (const hostile of [null, undefined, {}, { get: () => 42 }, { get: () => ({ openSession: 'nope' }), sessions: { open: 5, list: {} } }]) {
    const r = resolve(hostile)
    assert.equal(typeof r.via, 'string', `resolver must stay total for ${JSON.stringify(hostile)}`)
    assert.ok(r.open === null || typeof r.open === 'function', 'opener is either callable or null')
  }
})
