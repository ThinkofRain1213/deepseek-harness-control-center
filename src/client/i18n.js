// Locale wiring for the wallet client half.
//
// ONE resolution point. Every piece of copy in this plugin — plain helpers,
// React components, and non-React paths (notifications, window.confirm) —
// reads the same module-level `walletT` binding. Nothing threads a translate
// function through props or parameters.
//
// Why a module-level binding rather than React context or the renderer's
// `locale:` seat: the helpers below are called from BOTH render trees and
// non-render paths (installCompletionNotifier builds notification text inside
// an effect), and context cannot reach the latter. `ctx.locale.bind(ns)`
// returns a memoized function whose reference is stable for the lifetime of
// the service while its body reads the active locale on every call, so one
// binding serves every caller and still follows a language switch — it only
// needs its callers to run again. Components get that re-run from
// useWalletT()'s subscription; the renderer's own outlet re-render covers the
// rest.

var WALLET_NS = 'wallet'

/** The installed locale face; null until registerWalletLocale runs. */
var walletLocaleFace = null

/**
 * Pre-attach resolver, and the ONLY remaining dictionary read.
 *
 * Reachable only before registerWalletLocale() — i.e. in unit tests that
 * render a component in isolation. It is NOT a runtime language fallback:
 * production cannot reach it, because `apply` attaches the locale service and
 * registers the slot entries in the same synchronous pass, so no component
 * can render before `walletT` is rebound to the locale service.
 */
function walletDictionaryT(key, params) {
  var text = walletZh[key]
  if (text === undefined) text = walletEn[key]
  if (text === undefined) return key
  if (params) {
    Object.keys(params).forEach(function (name) {
      text = text.replaceAll('{' + name + '}', String(params[name]))
    })
  }
  return text
}

/** The one translate binding every caller uses. */
var walletT = walletDictionaryT

/** Stable no-op source for the unattached case (a fresh closure per render
 *  would make useSyncExternalStore resubscribe on every pass). */
var NO_LOCALE_STORE = {
  subscribe: function () { return function () {} },
  getRevision: function () { return 0 }
}

/** Per-face cache: subscribe/getSnapshot references stay stable so the hook
 *  does not churn its subscription. Mirrors the renderer's localeSubscription. */
var walletLocaleStore = null
function walletStoreFor(face) {
  if (walletLocaleStore === null || walletLocaleStore.face !== face) {
    walletLocaleStore = {
      face: face,
      subscribe: function (notify) { return face.subscribe(notify) },
      getRevision: function () { return face.getSnapshot().revision }
    }
  }
  return walletLocaleStore
}

/**
 * Read the translate function inside a component, re-rendering it when the
 * active locale changes. Components must call this instead of accepting `t`
 * as a prop: the renderer's `locale:` seat only reaches slot-registered
 * entries, so a nested component would silently miss it.
 */
function useWalletT() {
  var face = walletLocaleFace
  var store = face !== null ? walletStoreFor(face) : NO_LOCALE_STORE
  React.useSyncExternalStore(store.subscribe, store.getRevision)
  return walletT
}

/**
 * Attach the locale service: register the dictionaries and rebind `walletT`
 * to the service-backed translator.
 *
 * `locale` is a required dependency (declared in the plugin's `inject` and in
 * package.json's dsh.client.inject), so this does not probe for the service.
 * An undeclared read is what cordis rejects, and a probe that swallows a
 * missing service would only downgrade a loud failure into wrong-language
 * output.
 *
 * @param ctx - client cordis context.
 */
function registerWalletLocale(ctx) {
  var locale = ctx.locale
  ctx.effect(function () {
    return locale.register(WALLET_NS, { zh: walletZh, en: walletEn })
  }, 'dsh-wallet: locale dictionaries')
  walletLocaleFace = locale
  walletT = locale.bind(WALLET_NS)
}
