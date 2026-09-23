# 迁移方案：wallet 插件 → DSH 0.1.7-rc.1

> 依据：`docs/wallet-feature-inventory.md` 的逐项核查（309 项功能 / 13 条宿主接触面）。
> 范围：让插件在 0.1.7-rc.1 上**功能完整**，同时**不破坏**已支持的老宿主（0.1.2-alpha.3 ～ 0.1.5-rc.3）。
> 状态：**方案待批准，未改任何源码。**

---

## 一、需要处理的问题（3 项，按严重度排序）

| # | 清单序号 | 问题 | 判定 | 0.1.7 上的实际表现 |
|---|---|---|---|---|
| 1 | **N1** | 点完成通知跳转会话（`ctx.sessions.open`） | **失效** | 通知照常弹，但点击后不跳转 |
| 2 | **A10** | 完成通知的 `completed` 触发条件 | 降级 | 该条件恒 false；主路径（`running` 翻转）仍工作 |
| 3 | **#116** | 兼容性状态显示 | 显示不准 | 显示 `unknown`（与 0.1.7 无关，白名单本来就没更新） |

**其余 306 项不受影响** —— 逐项核查结果见清单文档"逐条接触面对照"。

### 问题的代码级根因

**问题 1**：0.1.7 把"视图选择"从会话控制器移到了 workspace 层。

```
0.1.5 ClientSessions 成员: open, openSubagent, select, this.selected ×9
0.1.7 ClientSessions 成员: retain, using, retainInfo, subagentAddress, ...
                           ↑ open/select/selected 全消失

【0.1.7 的类头注释（决定性）】
  /** Host catalog and local reference allocator;
      view selection remains outside the Controller. */
```

导航能力搬到 `ctx.get('uiWorkspace').openSession(target)`：

```js
// 0.1.7 的完整调用链（逐环实测存在）
openSession(target)
  └─ this.replaceMain(target, this.lifetime.signal, "reveal")
       ├─ this.sessions.retain(target, { source: "mainView" })     ✓ 0.1.7 有
       ├─ this.sessions.subagentAddress(...)                        ✓ 0.1.7 有
       ├─ this.selection.set({ sessionId, subagentAddress })         ← workspace 层持有
       ├─ this.mainReference = reference; previous?.release()
       └─ if (panel === "reveal") this.ctx.layout.selectPanel(null)  ← 关侧栏面板
```

**问题 2**：0.1.7 的 `projectList()` 不再投影 `completed`：

```js
// 0.1.5:  ...entry.completed ? { completed: true } : {},
// 0.1.7:  retainedBy: this.retentionSnapshot(entry.sessionId).retainedBy,   ← 取代
```

底层 `completedNotifications` Set + `syncCompletedNotifications()` 也一并删除。

**问题 3**：`index.js:551-560` 的 `hostCompatibility()` 只认精确白名单；白名单最高到 `0.1.5-alpha.1`，`dsh` 范围又写成点值 `=0.1.5-alpha.1` —— 连在跑的 `0.1.5-rc.2` 都不在内。

---

## 二、方案总览

**核心思路**：**能力探测 + 逐级回落**，而不是版本号判断。

理由：版本号判断需要维护一张随宿主发布的映射表；能力探测只看"这个 API 在不在"，对未知宿主（0.1.6、未来版本、私有分支）天然正确。

三处改动性质完全不同：

| 问题 | 方案 | 是否需要改逻辑 |
|---|---|---|
| 1 | 新增能力探测解析器 + 改 1 个调用点 | 是（低风险，有回落） |
| 2 | **保留现有逻辑**，只加注释 | **否**（零行为变化） |
| 3 | `package.json` 元数据 | 否 |

---

## 三、问题 1 的具体实现

### 3.1 为什么用 `ctx.get` 而不是加进 `inject`

已用真实 cordis 实测：

```
root ctx.get(uiWorkspace)            object
child scope.get(uiWorkspace)         object      ← installCompletionNotifier 拿到的是子作用域
child scope.uiWorkspace (property)   THROW cannot get property "uiWorkspace" without inject
child scope.get(missing)             undefined   ← 缺失时返回 undefined，不抛
```

**不能加进 `inject`**：`uiWorkspace` 在 0.1.2-alpha.3 不存在，而 cordis 对"已声明但缺失的服务"会**整个 withhold `apply`** —— 插件完全不加载，比现在的问题严重得多。

### 3.2 为什么首选 `uiWorkspace.openSession` 而不是保底用 `sessions.open`

因为 **`uiWorkspace.openSession` 在 0.1.5 上是 `sessions.open` 的超集**：

```js
// 0.1.5 的实现
openSession(sessionId) {
  this.sessions.open(sessionId);        // 与旧路径相同的效果
  this.ctx.layout.selectPanel(null);    // 额外：收起侧栏面板
}
```

所以换到新路径在 0.1.5 上**行为不退化，反而更正确**（点通知时本该收起侧栏）。

### 3.3 代码

**新增**（放在 `src/client/views.js` 的 `installCompletionNotifier` 之前）：

```js
/**
 * Resolve "navigate to this session" across dsh generations.
 *
 * The session controller owned view selection until 0.1.5 and handed it to the
 * workspace service in 0.1.7, where `open`/`select` and the `selected` field
 * were removed outright (the class documents itself as "host catalog and local
 * reference allocator; view selection remains outside the Controller").
 *
 * `uiWorkspace.openSession` is preferred because it exists from 0.1.5 on and is
 * a SUPERSET of the old `sessions.open` there — it performs the same selection
 * and additionally clears the side panel — so preferring it does not regress an
 * older host. `sessions.open` stays as the fallback for 0.1.2.
 *
 * `ctx.get` is used instead of an `inject` entry on purpose: `uiWorkspace` does
 * not exist in 0.1.2, and cordis withholds `apply` entirely for a declared but
 * missing service, which would stop the whole plugin from loading.
 *
 * @param ctx - the client scope installCompletionNotifier received.
 * @returns {{ open: (function(string): void)|null, via: string }}
 *   `open` is null only on a host offering neither seam.
 */
function resolveSessionOpener(ctx) {
  var workspace = null
  try {
    workspace = ctx && typeof ctx.get === 'function' ? ctx.get('uiWorkspace') : null
  } catch (e) { workspace = null }
  if (workspace && typeof workspace.openSession === 'function') {
    return { open: function (id) { workspace.openSession(id) }, via: 'uiWorkspace.openSession' }
  }
  var sessions = ctx && ctx.sessions ? ctx.sessions : null
  if (sessions && typeof sessions.open === 'function') {
    return { open: function (id) { sessions.open(id) }, via: 'sessions.open' }
  }
  return { open: null, via: 'none' }
}
```

**修改**（`src/client/views.js:315`，`installCompletionNotifier` 内）：

```js
function installCompletionNotifier(ctx) {
  if (typeof window === 'undefined' || !ctx.sessions || !ctx.sessions.list) return function () {}
  // Resolved once at install: the service set is stable for the client's
  // lifetime, and installation happens during apply(), before any reminder can
  // be clicked.
  var opener = resolveSessionOpener(ctx)
  ...
```

**修改**（`src/client/views.js:381-385`，点击处理）：

```js
// 旧
notification.onclick = function () {
  try { window.focus() } catch (e) { /* ignore */ }
  try { ctx.sessions.open(item.id) } catch (e) { /* session may have been removed */ }
  finishActive(true)
}

// 新
notification.onclick = function () {
  try { window.focus() } catch (e) { /* ignore */ }
  // `open` is null only on a host exposing neither seam; the window focus above
  // is then the entire effect, which matches the pre-resolver degradation.
  if (opener.open !== null) {
    try { opener.open(item.id) } catch (e) { /* session may have been removed */ }
  }
  finishActive(true)
}
```

**导出**（`src/client/wallet.js` 的 `exports.__testing`，加一行以便单测）：

```js
resolveSessionOpener: resolveSessionOpener,
```

### 3.4 行为对照表

| 宿主 | 解析结果 | 跳转 | 附带效果 |
|---|---|---|---|
| 0.1.2-alpha.3 | `sessions.open` | ✅ | 与现在完全一致 |
| 0.1.5-rc.2 | `uiWorkspace.openSession` | ✅ | **新增**收起侧栏面板（更正确） |
| 0.1.7-rc.1 | `uiWorkspace.openSession` | ✅ | 收起侧栏面板 |
| 两个都无（私有宿主） | `none` | ❌ | 只剩 `window.focus()`，与现在 0.1.7 表现相同 |

### 3.5 代码实测结果

把上面那份代码**逐字**在 Node 里加载并驱动 12 种宿主形状（含 5 种畸形输入），全部 PASS：

```
=== resolver behaviour across host shapes ===
  0.1.2-alpha.3                    via=sessions.open            callable=YES  invoked=ok
  0.1.5-rc.2                       via=uiWorkspace.openSession  callable=YES  invoked=ok
  0.1.7-rc.1                       via=uiWorkspace.openSession  callable=YES  invoked=ok
  exact test stub (no ctx.get)     via=sessions.open            callable=YES  invoked=ok
  no uiWorkspace service           via=sessions.open            callable=YES  invoked=ok
  both seams absent                via=none                     callable=no
  null ctx                         via=none                     callable=no
  undefined ctx                    via=none                     callable=no
  ctx.get throws                   via=sessions.open            callable=YES  invoked=ok
  uiWorkspace is a number          via=sessions.open            callable=YES  invoked=ok
  uiWorkspace.openSession not a fn via=sessions.open            callable=YES  invoked=ok
  sessions.open not a fn           via=none                     callable=no

=== expectations ===
  12/12 PASS

=== existing test assertion replay (wallet.test.mjs:1220-1247) ===
  PASS  opened = ["two"] (test asserts ['two'])
```

**关键的三条**：

1. **`ctx.get` 抛错也不影响** —— 宿主若因 cordis 未声明访问而抛，`try/catch` 吞掉并回落到 `sessions.open`。
2. **畸形输入不崩** —— `uiWorkspace` 是数字、`openSession` 不是函数、`sessions.open` 不是函数，全部安全。
3. **现有测试断言原样复现** —— 用测试里那个精确的桩形状跑，`opened` 结果仍是 `['two']`。

### 3.6 对现有测试的影响

现有 6 处 `installCompletionNotifier({...})` 用的桩 ctx 形如：

```js
{ sessions: { list: { getSnapshot, subscribe }, open(id) { opened.push(id) } } }
```

**没有 `get` 方法**。解析器里 `typeof ctx.get === 'function'` 的判断使它在桩环境下安全回落到 `sessions.open` —— 已实测（§3.5 最后一段）：

- `wallet.test.mjs:1247` 的 `assert.deepEqual(opened, ['two'])` **继续通过**
- 其余 5 处 notifier 测试**不受影响**

**结论：现有测试无需修改。**

---

## 四、问题 2 的具体实现

**不改行为，只加注释。**

先看量化结果（已模拟跑过）：

```
same  old=true  new=true    running flips true->false（主路径）
DIFF  old=true  new=false   completed flips false->true（0.1.5 独有路径）
same  old=false new=false   no previous state
same  old=false new=false   already stopped
```

**删掉第二个条件会在仍受支持的 0.1.5 上减少通知触发**；保留的代价是零（一个恒 false 的布尔）。所以保留。

**修改**（`src/client/views.js:421-428`）：

```js
// 现状
var state = { running: row.running === true, completed: row.completed === true }
var previous = previousSessionStates.get(id)
previousSessionStates.set(id, state)
var justFinished = !!previous && (
  (previous.running && !state.running) ||
  (!previous.completed && state.completed)
)

// 改后（仅加注释，代码不变）
var state = { running: row.running === true, completed: row.completed === true }
var previous = previousSessionStates.get(id)
previousSessionStates.set(id, state)
// `completed` is projected by the session list on 0.1.5 and earlier, where it
// marks a pending completion reminder. 0.1.7 removed both the field and the
// `completedNotifications` mechanism behind it, so the second disjunct is inert
// there — the running->stopped edge alone carries the notifier. The condition is
// kept rather than deleted because dropping it would narrow reminder coverage on
// the older hosts this build still supports.
var justFinished = !!previous && (
  (previous.running && !state.running) ||
  (!previous.completed && state.completed)
)
```

---

## 五、问题 3 的具体实现

`package.json` 的 `dsh.compatibility`：

```json
// 现状
"dsh": ">=0.1.2-alpha.3 <0.1.3 || =0.1.5-alpha.1",
"dshReleases": {
  "0.1.2-alpha.3": "compatible",
  "0.1.2-alpha.4": "compatible",
  "0.1.2-alpha.5": "compatible",
  "0.1.2-rc.1": "compatible",
  "0.1.5-alpha.1": "compatible"
}
```

```json
// 目标
"dsh": ">=0.1.2-alpha.3 <0.1.3 || >=0.1.5-alpha.1 <0.1.8",
"dshReleases": {
  "0.1.2-alpha.3": "compatible",
  "0.1.2-alpha.4": "compatible",
  "0.1.2-alpha.5": "compatible",
  "0.1.2-rc.1": "compatible",
  "0.1.5-alpha.1": "compatible",
  "0.1.5-rc.1": "compatible",
  "0.1.5-rc.2": "compatible",
  "0.1.5-rc.3": "compatible",
  "0.1.7-rc.1": "compatible"
}
```

**两处改动的独立性**（重要）：

- `dsh` **范围**是安装门槛，`dshReleases` **白名单**是健康检查显示。二者独立。
- 范围可以**现在就放宽**（纯门槛，无风险）。
- 白名单里的 `0.1.7-rc.1` **必须等实机验证通过后**再加 —— 否则等于对用户宣称未经验证的兼容性。

**注意**：加 `0.1.7-rc.1` 时，健康检查会显示"已声明兼容"，但**问题 2 意味着 0.1.7 的通知覆盖面本来就比 0.1.5 窄**。这是宿主的限制，不是我们的缺陷，但声称兼容时应知情。

**另需同步**：`index.js:41` 的 `MIN_HOST_VERSION` 保持 `0.1.2-alpha.3` 不变（它是最低版本判定，与本次无关）。

---

## 六、需要同步更新的测试

| 文件 | 改动 | 理由 |
|---|---|---|
| `test/client-injection.test.mjs` | **新增 1 条** | 断言解析器在 0.1.7 形状的 ctx 下选 `uiWorkspace.openSession` |
| `test/client-injection.test.mjs` | **新增 1 条** | 断言 0.1.2 形状（无 `uiWorkspace`）下回落 `sessions.open` |
| `test/wallet.test.mjs` | **不改** | 桩 ctx 无 `get`，自动回落，现有断言全通过 |
| `test/host-compatibility.test.mjs` | **不改** | 它遍历白名单自检；白名单更新后自动适配 |

新增测试的草案：

```js
test('the completion notifier navigates through uiWorkspace when the host has it', () => {
  let definition
  runInNewContext(readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8'), {
    window: { __ModuleLoader__: { load(value) { definition = value } } },
  })
  const plugin = definition.factory(() => ({ useEffect() {} }))
  const opened = []
  const openedViaWorkspace = []
  const resolve = plugin.__testing.resolveSessionOpener

  // 0.1.7 shape: sessions.open is GONE, uiWorkspace.openSession is present.
  assert.equal(resolve({
    get: (name) => (name === 'uiWorkspace'
      ? { openSession: (id) => openedViaWorkspace.push(id) }
      : undefined),
    sessions: { list: {} },
  }).via, 'uiWorkspace.openSession')

  // 0.1.2 shape: no uiWorkspace service at all -> fall back.
  assert.equal(resolve({
    get: () => undefined,
    sessions: { open: (id) => opened.push(id), list: {} },
  }).via, 'sessions.open')

  // Defensive: neither seam.
  assert.equal(resolve({ get: () => undefined, sessions: { list: {} } }).open, null)
})
```

---

## 七、落地顺序

| 步 | 动作 | 风险 | 前置 | 可回滚 |
|---|---|---|---|---|
| 1 | ③ 放宽 `dsh` 范围（纯元数据） | 无 | — | 是 |
| 2 | ② 加注释（零行为变化） | 无 | — | 是 |
| 3 | ① 加 `resolveSessionOpener` + 改 2 处调用点 + 导出 | 低 | — | 是 |
| 4 | 补 2 条测试 | 无 | 3 | 是 |
| 5 | 跑全量测试 + 三项 check + 构建产物 | 无 | 1-4 | — |
| 6 | **实机装 0.1.7-rc.1 验证**（见 §八） | — | 5 | 是 |
| 7 | ③ 白名单补 `0.1.7-rc.1: compatible` | 无 | 6 通过 | 是 |
| 8 | bump 版本（`0.3.13-patched.5` → `.6`）+ 更新 CHANGELOG | 无 | 7 | 是 |
| 9 | 提交 / 部署 / 发布 | — | 8 | 是 |

**步骤 6 不可省** —— 本方案全部结论来自静态比对 + cordis 运行时探针。特别是 `cordis-plugin-loader` 从 `1.0.3` 到 `1.0.5` 有约 360 行重写，我只审了 `{id, name}` 解析路径，未逐行过。

---

## 八、实机验证清单（步骤 6）

装 0.1.7-rc.1 后逐项确认：

| # | 验证项 | 预期 | 对应清单项 |
|---|---|---|---|
| 1 | 插件能加载（无 `Failed to load plugins`） | 通过 | — |
| 2 | 输入框标签出现且显示余额 | 通过 | 38-56 |
| 3 | 点标签展开面板 | 通过 | 39 |
| 4 | 面板显示官方 token / 花费 | 通过 | 62-70 |
| 5 | 设置页出现「钱包」分区 | 通过 | 101+ |
| 6 | 侧边栏底部出现峰谷时钟 | 通过 | 219-236 |
| 7 | 健康检查显示 Harness 版本 = `0.1.7-rc.1` | 通过 | 114 |
| 8 | **对话完成后通知弹出** | 通过 | N1（部分） |
| 9 | **点击通知跳转到该会话** | 通过（本方案的目标） | N1 |
| 10 | 通知标题/正文显示会话名 | 通过 | N1 |
| 11 | 金额计算与 0.1.5 一致 | 通过 | 1-5 |
| 12 | 峰谷时钟时段判定正确 | 通过 | 219+ |
| 13 | 余额低额通知 | 通过 | N2 |
| 14 | 峰谷切换通知 | 通过 | N3 |

**验证环境注意**：不要直接升生产 profile。建议：
- 复制一份 profile 或用隔离的 `DSH_HOME` 装 0.1.7（参考既有的 `dsh-install-and-upgrade` 经验）
- 或按 `AGENTS.md` 的备份纪律先备份 `profiles/web`

---

## 九、本方案的已知边界

1. **未实机验证** —— 全部为静态代码比对 + cordis 探针。步骤 6 是硬前置。
2. **`cordis-plugin-loader` 1.0.3→1.0.5 的 ~360 行重写未逐行审**。已确认仍按 `{id, name}` 解析 patch 条目、仍动态 import、per-entry 报错更完善；但"0.1.7 能否加载本插件"未实测（步骤 6 的验证项 1）。
3. **`uiWorkspace` 服务的提供者包未定位**。已确认：它是标准 `cordis.Service`（`super(ctx, 'uiWorkspace')`）、三个版本服务名一致、`ctx.get` 实测可取。但"它在客户端根 cordis 树中对插件可见"仍需步骤 6 验证（验证项 9）。
4. **0.1.6 两版未查**。若将来要声明兼容 0.1.6，需单独核查。方案的能力探测对 0.1.6 天然安全（有 `uiWorkspace.openSession` 就用，没有就回落），但未验证。
5. **问题 2 的覆盖面收窄不会消失**。0.1.7 上通知只靠 `running` 翻转触发，这是宿主删字段导致的，改动无法恢复。
