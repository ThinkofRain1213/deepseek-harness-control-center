import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

test('composer model resolution declares remote.session in its calling scope', () => {
  let definition
  runInNewContext(readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8'), {
    window: { __ModuleLoader__: { load(value) { definition = value } } },
  })
  const plugin = definition.factory(() => ({ useEffect() {} }))
  let resolved = false
  plugin.apply({
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

// The locale seat is injected by the renderer into SLOT-registered components
// only. A nested component created with React.createElement inside another
// component is not a slot entry, so it never receives `t` from the seat and
// silently falls back to the Chinese dictionary. Every in-tree component that
// renders copy must therefore be handed `t` explicitly at its creation site.
test('nested wallet components receive the translate function explicitly', () => {
  const sources = ['wallet.js', 'settings.js'].map((name) =>
    readFileSync(new URL('../src/client/' + name, import.meta.url), 'utf8'))
  const nested = ['UsageHistoryPanel', 'PlanUsagePanel']
  let checked = 0
  for (const source of sources) {
    for (const name of nested) {
      const re = new RegExp('React\\.createElement\\(' + name + ',\\s*\\{([^}]*)\\}', 'g')
      let match
      while ((match = re.exec(source)) !== null) {
        checked += 1
        assert.match(
          match[1],
          /(?:^|[\s,{])t:\s*t(?:[\s,}]|$)/,
          `${name} is created without t: ${match[0].slice(0, 80)} — it will fall back to Chinese`,
        )
      }
    }
  }
  assert.ok(checked >= 6, 'expected every nested panel creation site to be covered')
})
