// Locale wiring for the wallet client half.
//
// The DSH client renderer injects a `t` seat into every slot entry that declares
// `locale: <namespace>`; this module owns the namespace, registers the
// dictionaries, and — critically — decides whether that seat can be requested
// at all.
//
// WHY THE FALLBACK MATTERS: the renderer throws SlotAssemblyError when an entry
// declares a locale namespace while no locale face is installed
// (`kit["t"] = localeSeat(...)` in dsh-client-ui-renderer). Passing `locale:` on
// a host without the locale service would therefore abort the whole plugin boot,
// so registration is probed first and the seat is only requested when it exists.

var WALLET_NS = 'wallet'

/**
 * Translate through the wallet dictionary without the locale service.
 * Used by non-component paths (notifications, module helpers) and as the
 * last-resort seat on hosts that ship no locale service.
 * Never returns a bare key: an unknown key falls back to the zh dictionary,
 * then to the key itself only if that is missing too.
 */
function walletT(key, params) {
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

/**
 * Register the wallet dictionaries and resolve a translate function.
 * @param ctx - client cordis context (may lack the optional locale service).
 * @returns {{ t: Function, hasLocale: boolean, ns: string }}
 *   `hasLocale` is false when the host ships no locale service; callers must
 *   then omit `locale:` from slot registrations or the renderer aborts boot.
 */
function registerWalletLocale(ctx) {
  // Read through a guard: when the declared face is not available the accessor
  // rejects the read, and an abort here would take the plugin boot down with it.
  var locale = null
  try { locale = ctx ? ctx.locale : null } catch (error) { locale = null }
  if (!locale || typeof locale.register !== 'function') {
    return { t: walletT, hasLocale: false, ns: WALLET_NS }
  }
  ctx.effect(function () {
    return locale.register(WALLET_NS, { zh: walletZh, en: walletEn })
  }, 'dsh-wallet: locale dictionaries')
  return { t: locale.bind(WALLET_NS), hasLocale: true, ns: WALLET_NS }
}
