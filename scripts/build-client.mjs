import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { transformSync } from 'esbuild'

// Order matters: the dictionaries and the locale wiring are plain declarations
// consumed by every later file, so they must be concatenated first.
export const clientSources = [
  'locales/zh.js',
  'locales/en.js',
  'i18n.js',
  'core.js',
  'styles.js',
  'views.js',
  'settings.js',
  'wallet.js',
]

/**
 * The loader id the bundle must register itself under.
 *
 * Read from package.json rather than hardcoded: the DSH client-module host
 * resolves each entry's bundle through `<name>/client` and asserts the bundle
 * registered under exactly that id, so any rename (this fork is
 * `deepseek-harness-wallet-patched`) has to reach this string or the host
 * refuses to boot the plugin. Deriving it makes that drift impossible.
 */
const { name: PACKAGE_NAME, version: PLUGIN_VERSION } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
)

export function clientSource() {
  const body = clientSources.map(name => readFileSync(new URL('../src/client/' + name, import.meta.url), 'utf8').replaceAll('\r\n', '\n')).join('\n')
  // The version the settings UI shows is baked into the bundle, so it is stamped
  // here from the manifest instead of living as a second copy in core.js.
  const stamped = body.replace(/var WALLET_VERSION = '[^']*'/, `var WALLET_VERSION = '${PLUGIN_VERSION}'`)
  return `window.__ModuleLoader__.load({\n  id: '${PACKAGE_NAME}',\n  factory: (require) => {\n` + stamped + '\nreturn module.exports\n}\n})\n'
}

export function buildClient() {
  // Binding minification is required, not cosmetic: the bilingual dictionaries
  // push the concatenated body past the 256 KiB review bound otherwise.
  //
  // What survives is what the tests and the host actually reach. esbuild
  // shortens *binding* names (variables, parameters, function declarations) but
  // never *property* names, so `exports.__testing.<name>`, `exports.apply`,
  // `exports.inject`, `ctx.locale.register`, `__ModuleLoader__` and the
  // 'module.semantic' dictionary keys all stay addressable. Internal bindings
  // such as `WalletChip` or `walletZh` do get renamed — nothing outside the
  // bundle refers to them by name.
  //
  // The Git sources remain fully readable; only this generated artifact is
  // compacted. Tests that assert on structure read clientSource(), not this.
  return transformSync(clientSource(), { loader: 'js', target: 'es2022', minifyWhitespace: true, minifySyntax: true, minifyIdentifiers: true, legalComments: 'inline', charset: 'utf8' }).code
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const target = new URL('../lib/client.js', import.meta.url)
  const code = buildClient()
  if (Buffer.byteLength(code) > 262144) throw Error('Client artifact exceeds the 256 KiB review bound')
  if (process.argv.includes('--check')) {
    if (readFileSync(target, 'utf8').replaceAll('\r\n', '\n') !== code) throw Error('Client artifact is stale; run npm run build:client')
  } else writeFileSync(target, code)
  process.stdout.write(`Client artifact verified: ${Buffer.byteLength(code)} bytes.\n`)
}
