# DSH Wallet 插件 —— 完整功能清单

> 用途：0.1.7-rc.1 兼容性评估的逐项核对底稿。
> 统计口径：用户可感知的**独立功能**，最小粒度拆解。代码引用为 `文件:行号`。
> 生成方式：三个子代理分别全文通读 `views.js` / `settings.js` / `wallet.js`，宿主侧（`index.js`、`lib/plans.js`）由主代理核对；子代理标出的疑点已由主代理独立复验。

## 统计

| 分区 | 项数 |
|---|---|
| 一、宿主服务端（引擎层） | 22 |
| 二、HTTP 路由 | 15 |
| 三、输入框标签（chip） | 18 |
| 四、主面板（portaled panel） | 28 |
| 五、浮动圆点 + 浮动窗 | 16 |
| 六、设置面板（settings.section） | 102 |
| 七、侧边栏峰谷时钟 + 专属面板 | 18 |
| 八、套餐面板（PlanUsagePanel） | 11 |
| 九、用量账本（UsageHistoryPanel） | 19 |
| 十、账户区 | 15 |
| 十一、跨切面行为（拖拽/后台/通知/对话框） | 45 |
| **合计** | **309** |

**三个已核实的事实**（不是遗漏，特意列出）：

1. **不存在"需要回答/审批"类通知**。全插件系统通知只有 3 种 tag：`dsh-harness-completion`（会话完成）、`dsh-wallet-low`（余额低于阈值）、`dsh-wallet-peak`（峰谷切换）。搜索 `approval`/`question`/`needsInput`/`blocked` 零命中。
2. **仓库内有第二个交付物**：`integrations/dsh-session-delete/` —— 独立 host 补丁（非 npm 插件的一部分），给 DSH 本体加永久删除会话能力，通过 `data-dshw-capability-permanent-delete="true"` 与本插件对接（`src/client/core.js:270` 的 `hasCapability`）。
3. **两个字典键定义了但从未使用**：`settings.version`、`chip.estimateShort`（零引用，已核实）。

---

## 一、宿主服务端（`index.js` / `lib/plans.js`）—— 引擎层

| # | 功能 | 代码引用 |
|---|---|---|
| 1 | Token 计量：挂 `llm/stream` waterfall，按会话×provider 分桶 | `index.js:2603-2624` |
| 2 | 官方/第三方分桶：`deepseek-official` + `vision-toolkit-*` 透明前缀 → 官方桶 | `index.js:30-31, 1094` |
| 3 | 按用量发生时刻锁定价格（历史不被后续调价改写） | `index.js:586`（`ratesFor(model, atMs)`） |
| 4 | 稳定身份去重（同一 usage 不重复记账） | `index.js:2603-2622` |
| 5 | 365 天本地用量账本 | `index.js:2603-2624` |
| 6 | 官方余额缓存（60 秒刷新） | `index.js:52, 2626` |
| 7 | 启动快速重试（2/6/15/30 秒四档） | `index.js:2630-2640` |
| 8 | 低余额阈值持久化（按币种） | `index.js:2596-2601` |
| 9 | 多账户管理（增/删/切换） | `index.js:2871, 2912, 2929` |
| 10 | 账户加密：Windows DPAPI / 其他平台 AES-GCM 文件密钥 | `index.js:1814-1897` |
| 11 | 账户备份与恢复（`.bak` 主备切换） | `index.js:47` |
| 12 | 热切换计费 Key（写 credentials seam，免重启） | `index.js:2206-2212` |
| 13 | 内置官方峰谷价格表（2026-08-17 / 2026-09-10 两个时间点） | `index.js:206-219` |
| 14 | 官方价格页结构化解析（脚注剥离、列数自适应） | `index.js:259-305` |
| 15 | 价格同步（6 小时定时 + 手动，8 秒超时） | `index.js:39-40, 452-455, 2654-2655` |
| 16 | 同步结果持久化（单条 `official-sync`，不累积） | `index.js:226, 405-427` |
| 17 | 退役模型别名（`deepseek-v4-flash` 仍按 Flash 价） | `index.js:222-223, 586-600` |
| 18 | 套餐适配器（Z.ai 全球区 / 中国区） | `lib/plans.js:25, 36` |
| 19 | 套餐刷新（5 分钟节流，12 秒超时） | `index.js:68-70, 1697-1711` |
| 20 | 套餐快照缓存（失败保留上次成功值） | `index.js:1706` |
| 21 | provider 官方白名单维护 | `index.js:2819-2836` |
| 22 | 版本兼容判定 `hostCompatibility()` | `index.js:551-560` |

## 二、HTTP 路由（15 条，均宿主侧）

| # | 功能 | 代码引用 |
|---|---|---|
| 23 | `GET /api/wallet/snapshot` —— 主快照 | `index.js:2666` |
| 24 | `GET /api/wallet/health` —— 健康检查 | `index.js:2674` |
| 25 | `POST /api/wallet/pricing/refresh` —— 手动同步价格 | `index.js:2682` |
| 26 | `GET/POST /api/wallet/preferences` —— 偏好持久化 | `index.js:2691` |
| 27 | `POST /api/wallet/threshold` —— 阈值保存 | `index.js:2712` |
| 28 | `POST /api/wallet/refresh` —— 刷新余额 | `index.js:2737` |
| 29 | `POST /api/wallet/clear-session` —— 清除本会话数据 | `index.js:2745` |
| 30 | `GET /api/wallet/history` —— 历史账本 | `index.js:2763` |
| 31 | `POST /api/wallet/clear-history` —— 清除历史账本 | `index.js:2783` |
| 32 | `GET/POST /api/wallet/plans` —— 套餐查询/刷新 | `index.js:2798` |
| 33 | `POST /api/wallet/official-providers` —— 官方 provider 白名单 | `index.js:2819` |
| 34 | `GET/POST/DELETE /api/wallet/custom-prices` —— 自定义价格 | `index.js:2837` |
| 35 | `GET/POST /api/wallet/accounts` —— 账户列表/添加 | `index.js:2871` |
| 36 | `POST /api/wallet/accounts/activate` —— 切换账户 | `index.js:2912` |
| 37 | `POST /api/wallet/accounts/remove` —— 删除账户 | `index.js:2929` |

## 三、输入框标签（`WalletChip`，`wallet.js:1-1678`）

| # | 功能 | 代码引用 |
|---|---|---|
| 38 | 标签组 aria-label（按 provider 变化） | `wallet.js:1144` |
| 39 | 点击标签展开/收起面板 | `wallet.js:1150-1152` |
| 40 | 余额显示（横排） | `wallet.js:1126` |
| 41 | 余额显示（竖排） | `wallet.js:1118` |
| 42 | 本场花费显示（未定价模型时整体隐藏） | `wallet.js:1119-1130` |
| 43 | 官方 token 显示 | `wallet.js:1120-1129` |
| 44 | 三方 token 显示 | `wallet.js:1122-1133` |
| 45 | 官方/三方分隔符 | `wallet.js:1131` |
| 46 | Z.ai provider 名（字面 `'Z.ai'`） | `wallet.js:1093, 1099` |
| 47 | Z.ai 5h 剩余百分比 | `wallet.js:1076-1078` |
| 48 | Z.ai MCP 工具剩余百分比 | `wallet.js:1095, 1101` |
| 49 | 三方会话 token | `wallet.js:1102, 1113` |
| 50 | 三方 provider/模型名（截断 18 字符） | `wallet.js:1105-1112` |
| 51 | 三方估算费用 | `wallet.js:1109, 1114` |
| 52 | 仅余额模式的变体布局 | `wallet.js:1087-1128` |
| 53 | 充值按钮 | `wallet.js:1170-1175` |
| 54 | 吸附预览矩形 | `wallet.js:1147` |
| 55 | 隐藏态（渲染 null 但轮询继续） | `wallet.js:1060` |
| 56 | 标签拖动 | `wallet.js:150-200` |

## 四、主面板（`wallet.js:1204-1584`）

| # | 功能 | 代码引用 |
|---|---|---|
| 57 | 面板标题（按 provider 变化） | `wallet.js:1540` |
| 58 | 面板拖动 | `wallet.js:1546, 1355-1360` |
| 59 | 面板归位 | `wallet.js:1365-1367` |
| 60 | 面板最小化（转圆点） | `wallet.js:1372-1387` |
| 61 | DeepSeek / Z.ai provider 标签页 | `wallet.js:1390-1403` |
| 62 | 余额大头显示 | `wallet.js:1430-1432` |
| 63 | 低余额告警 pill | `wallet.js:1432` |
| 64 | 本场花费行 | `wallet.js:1225-1226` |
| 65 | 充值/赠送明细行 | `wallet.js:1210-1211, 1418-1420` |
| 66 | 多币种余额行 | `wallet.js:1209-1215` |
| 67 | 余额加载中状态 | `wallet.js:1413` |
| 68 | 8 种余额错误文案 | `views.js:196-211` |
| 69 | 官方 token 明细（输入·缓存读·输出） | `wallet.js:1221-1222, 1549-1550` |
| 70 | 三方 token 明细 | `wallet.js:1230-1231` |
| 71 | 三方自定义估算 | `wallet.js:1234-1235` |
| 72 | 当前计价显示（按时段） | `wallet.js:1240-1244` |
| 73 | 显示内容双勾选（官方/三方） | `wallet.js:1283-1302, 1444-1463` |
| 74 | 芯片比例滑杆 | `wallet.js:1266-1280` |
| 75 | 提醒下拉（关闭/5/10/30/60 秒/一直保留） | `wallet.js:1304-1332` |
| 76 | 阈值输入（面板内 600ms 防抖自动保存） | `wallet.js:1247-1255` |
| 77 | 低额闪烁开关 | `wallet.js:1499-1512` |
| 78 | 永久删除开关 | `wallet.js:1334-1351, 1514-1531` |
| 79 | 账本锁定提示 | `wallet.js:1264` |
| 80 | 充值按钮 | `wallet.js:1562-1567` |
| 81 | 刷新余额按钮 | `wallet.js:1568` |
| 82 | 清除会话数据按钮 | `wallet.js:1571-1578` |
| 83 | 面板页脚版本号 | `wallet.js:1583` |
| 84 | 充值确认浮层（首次） | `wallet.js:1187-1201` |

## 五、浮动圆点 + 浮动窗（`wallet.js:1586-1665`）

| # | 功能 | 代码引用 |
|---|---|---|
| 85 | 圆点点击展开 | `wallet.js:1594-1595` |
| 86 | 圆点数值显示 | `wallet.js:1588-1592` |
| 87 | 圆点拖动 | `wallet.js:1606-1610` |
| 88 | 浮动窗标题拖动 | `wallet.js:1609-1610` |
| 89 | 浮动窗最小化 | `wallet.js:1615` |
| 90 | 浮动窗收回标签 | `wallet.js:1622` |
| 91 | 浮动窗余额行 | `wallet.js:1210` |
| 92 | 浮动窗官方 token 行 | `wallet.js:1221` |
| 93 | 浮动窗三方行 | `wallet.js:1230-1235` |
| 94 | 浮动窗当前计价行 | `wallet.js:1240-1244` |
| 95 | 浮动窗显示内容勾选 | `wallet.js:1283-1302` |
| 96 | 浮动窗阈值输入（**需点保存，无自动保存**） | `wallet.js:1247-1255, 1640-1648` |
| 97 | 浮动窗刷新按钮 | `wallet.js:1643` |
| 98 | 浮动窗保存按钮 | `wallet.js:1644-1650` |
| 99 | 浮动窗充值按钮 | `wallet.js:1650` |
| 100 | 浮动窗清除按钮 | `wallet.js:1653-1659` |

## 六、设置面板（`WalletSettingsSection`，`settings.js:1-1139`）

| # | 功能 | 代码引用 |
|---|---|---|
| 101 | 面板标题「DeepSeek 账户中心」 | `settings.js:574` |
| 102 | 副标题 | `settings.js:575` |
| 103 | 余额卡标题 | `settings.js:578` |
| 104 | 当前账户徽标 | `settings.js:579` |
| 105 | 余额偏低告警 | `settings.js:581` |
| 106 | 余额数值 | `settings.js:583` |
| 107 | 本场花费标签（CNY「本场」/ USD「本约」） | `settings.js:585` |
| 108 | 本场花费数值 | `settings.js:585` |
| 109 | 充值金额显示 | `settings.js:588` |
| 110 | 赠送金额显示 | `settings.js:590` |
| 111 | 币种显示 | `settings.js:584` |
| 112 | 健康检查标题 | `settings.js:633` |
| 113 | 健康提示行 | `settings.js:634` |
| 114 | Harness 版本显示 | `settings.js:636` |
| 115 | 插件版本显示 | `settings.js:638` |
| 116 | 兼容性状态显示 | `settings.js:602-603` |
| 117 | 价格规则状态显示 | `settings.js:606-612` |
| 118 | 账户存储状态显示 | `settings.js:615-621` |
| 119 | 用量账本状态显示 | `settings.js:624-629` |
| 120 | 重新检测按钮 | `settings.js:648` |
| 121 | 同步官方价格按钮 | `settings.js:649` |
| 122 | 复制诊断信息按钮 | `settings.js:650` |
| 123 | 显示内容分组标题 | `settings.js:656-657` |
| 124 | 官方数据勾选 | `settings.js:662-664` |
| 125 | 第三方数据勾选 | `settings.js:668-670` |
| 126 | 输入框标签开关 | `settings.js:676-684` |
| 127 | 仅显示余额开关 | `settings.js:690-699` |
| 128 | 标签比例滑杆 | `settings.js:707-713` |
| 129 | 提醒与会话分组标题 | `settings.js:716-717` |
| 130 | 完成提醒下拉 | `settings.js:724-738` |
| 131 | 低余额阈值输入（600ms 防抖） | `settings.js:746-755` |
| 132 | 低余额闪烁开关 | `settings.js:760-767` |
| 133 | 永久删除会话开关 | `settings.js:772-785` |
| 134 | 峰谷时钟开关 | `settings.js:790-803` |
| 135 | 峰谷切换提醒开关 | `settings.js:808-820` |
| 136 | 时钟布局下拉 | `settings.js:826-832` |
| 137 | 时钟背景下拉 | `settings.js:838-844` |
| 138 | 时钟大小滑杆 | `settings.js:849-857` |
| 139 | 时钟充值按钮开关 | `settings.js:862-869` |
| 140 | 时钟位置显示 | `settings.js:872-878` |
| 141 | 时钟归位按钮 | `settings.js:875-878` |
| 142 | provider 分桶分组标题 | `settings.js:886-887` |
| 143 | 每官方 provider 勾选 | `settings.js:889-901` |
| 144 | 每三方 provider 勾选 | `settings.js:903-915` |
| 145 | 自定义价格分组标题 | `settings.js:921-924` |
| 146 | 使用当前模型按钮 | `settings.js:926-930` |
| 147 | Provider ID 输入 | `settings.js:954` |
| 148 | 模型 ID 输入 | `settings.js:955` |
| 149 | 币种输入 | `settings.js:956` |
| 150 | 输入价格输入 | `settings.js:957` |
| 151 | 缓存读价格输入 | `settings.js:958` |
| 152 | 缓存写价格输入 | `settings.js:959` |
| 153 | 输出价格输入 | `settings.js:960` |
| 154 | provider/模型 建议列表 | `settings.js:952` |
| 155 | 保存价格按钮 | `settings.js:960-961` |
| 156 | 计价时区输入 | `settings.js:1008-1011` |
| 157 | 添加分时段按钮 | `settings.js:1016` |
| 158 | 分时段名称输入 | `settings.js:981` |
| 159 | 删除分时段按钮 | `settings.js:982` |
| 160 | 每时段 7 个星期切换 | `settings.js:983-996` |
| 161 | 每时段开始时间 | `settings.js:998` |
| 162 | 每时段结束时间 | `settings.js:999` |
| 163 | 每时段 4 项价格 | `settings.js:1000-1003` |
| 164 | 基础价说明 | `settings.js:1019` |
| 165 | 跨午夜说明 | `settings.js:1020` |
| 166 | 规则行显示 | `settings.js:1024-1028` |
| 167 | 规则编辑按钮 | `settings.js:1030` |
| 168 | 规则删除按钮 | `settings.js:1031` |
| 169 | 无规则提示 | `settings.js:1039` |
| 170 | 价格操作提示行 | `settings.js:1036` |
| 171 | 账户管理标题 | `settings.js:1046` |
| 172 | 账户数量显示 | `settings.js:1047` |
| 173 | 账户错误行 | `settings.js:1049` |
| 174 | 无账户提示 | `settings.js:1051` |
| 175 | 账户头像 | `settings.js:1058` |
| 176 | 账户 LLM 计费徽标 | `settings.js:1064` |
| 177 | 账户掩码 Key | `settings.js:1065` |
| 178 | 当前账户标记 | `settings.js:1067` |
| 179 | 切换账户按钮 | `settings.js:1069-1073` |
| 180 | 删除账户按钮 | `settings.js:1075-1080` |
| 181 | 账户滚动容器 | `settings.js:1082` |
| 182 | 账户名称输入 | `settings.js:1086` |
| 183 | API Key 输入 | `settings.js:1093` |
| 184 | 添加账户按钮 | `settings.js:1100-1102` |
| 185 | 账户操作提示行 | `settings.js:1104` |
| 186 | 页脚版本徽标 | `settings.js:1126` |
| 187 | 刷新余额按钮 | `settings.js:1129` |
| 188 | 去官方充值按钮 | `settings.js:1135` |
| 189 | 设置面板挂载时并发拉取 3 个接口 | `settings.js:125-154` |
| 190 | 通知偏好行 | `settings.js:131` |
| 191 | 让账户接口失败提示 | `settings.js:144` |
| 192 | 健康检查失败提示 | `settings.js:147` |
| 193 | 检测中提示 | `settings.js:157` |
| 194 | 检测完成提示 | `settings.js:159` |
| 195 | 检测失败提示 | `settings.js:160-161` |
| 196 | 同步中提示 | `settings.js:165` |
| 197 | 同步成功提示 | `settings.js:169` |
| 198 | 同步失败提示 | `settings.js:170-171` |
| 199 | 诊断已复制提示 | `settings.js:202` |
| 200 | 复制失败提示 | `settings.js:202-206` |
| 201 | 阈值已保存提示 | `settings.js:314` |
| 202 | 阈值保存失败提示 | `settings.js:317` |
| 203 | 价格校验失败提示 | `settings.js:335, 358` |
| 204 | 价格保存中提示 | `settings.js:361` |
| 205 | 价格保存成功提示 | `settings.js:378` |
| 206 | 官方 provider 不可设三方价提示 | `settings.js:380` |
| 207 | 价格删除中/成功提示 | `settings.js:386, 393` |
| 208 | 价格载入提示 | `settings.js:420` |
| 209 | 无识别模型提示 | `settings.js:470` |
| 210 | 已填入会话模型提示 | `settings.js:479` |
| 211 | 账户添加成功提示 | `settings.js:509` |
| 212 | 账户添加失败提示 | `settings.js:512-514` |
| 213 | 账户切换成功提示 | `settings.js:526` |
| 214 | 账户切换失败提示 | `settings.js:530` |
| 215 | 账户删除成功/失败提示 | `settings.js:540-542` |
| 216 | 切换账户确认对话框 | `settings.js:518` |
| 217 | 删除账户确认对话框 | `settings.js:534` |
| 218 | 充值确认对话框 | `core.js:435` |

## 七、侧边栏峰谷时钟 + 专属面板（`PeakRingFooter`，`settings.js:1312-1974`）

| # | 功能 | 代码引用 |
|---|---|---|
| 219 | 时钟卡片本体（宽模式开面板 / rail 模式直接充值） | `settings.js:1826, 1844` |
| 220 | 时钟卡片拖动 | `settings.js:1810-1830` |
| 221 | 时钟余额显示 | `settings.js:1834` |
| 222 | 时钟花费显示 | `settings.js:1837` |
| 223 | 倒计时/时段摘要 | `settings.js:1844` |
| 224 | 时钟充值按钮 | `settings.js:1848-1854` |
| 225 | 浮动时归位按钮 | `settings.js:1810-1818` |
| 226 | 专属面板标题 | `settings.js:1869` |
| 227 | 面板关闭（× / Escape / 外点） | `settings.js:1873-1874` |
| 228 | 面板状态卡 | `settings.js:1877-1889` |
| 229 | 面板内充值按钮 | `settings.js:1892-1895` |
| 230 | 面板内时钟排版下拉 | `settings.js:1897-1907` |
| 231 | 面板内时钟背景下拉 | `settings.js:1908-1918` |
| 232 | 面板内时钟大小滑杆 | `settings.js:1919-1928` |
| 233 | 面板内充值按钮开关 | `settings.js:1929-1938` |
| 234 | 面板内切换提醒开关 | `settings.js:1939-1948` |
| 235 | 面板内时钟位置 | `settings.js:1949-1956` |
| 236 | 面板页脚版本号 | `settings.js:1957` |

## 八、套餐面板（`PlanUsagePanel`，`views.js:1085-1174`）

| # | 功能 | 代码引用 |
|---|---|---|
| 237 | 卡片标题 | `views.js:1126` |
| 238 | 头部提示（读取中/摘要/未检测） | `views.js:1121-1124` |
| 239 | 折叠/展开按钮 | `views.js:1131` |
| 240 | 刷新按钮 | `views.js:1128` |
| 241 | 套餐来源名（按稳定 id 翻译） | `views.js:1034-1044, 1166` |
| 242 | 来源元信息行 | `views.js:1167` |
| 243 | 状态徽标（未配置/刷新中/正常/缓存/异常） | `views.js:1137-1140` |
| 244 | 来源消息行 | `views.js:1160-1162` |
| 245 | 模型 Token 额度行 | `views.js:1067-1068, 1152` |
| 246 | MCP 工具额度行 | `views.js:1067-1068, 1152` |
| 247 | 剩余百分比 + 进度条 | `views.js:1135-1155` |
| 248 | 已用百分比/计数 | `views.js:1148` |
| 249 | 重置时间显示 | `views.js:1158` |
| 250 | 空态消息 | `views.js:1172` |

## 九、用量账本（`UsageHistoryPanel`，`views.js:697-888`）

| # | 功能 | 代码引用 |
|---|---|---|
| 251 | 卡片标题（全会话/本会话） | `views.js:801-806` |
| 252 | 保留策略提示行 | `views.js:796-799` |
| 253 | 折叠/展开按钮 | `views.js:806-810` |
| 254 | 加载中状态 | `views.js:815` |
| 255 | 错误提示 | `views.js:817` |
| 256 | 累计 Token 汇总 | `views.js:856` |
| 257 | 今天 Token 汇总 | `views.js:857` |
| 258 | 本月 Token 汇总 | `views.js:858` |
| 259 | 缓存命中率 | `views.js:859` |
| 260 | 三方规则图例 | `views.js:860` |
| 261 | Token/费用 指标切换 | `views.js:861-865` |
| 262 | 热力图图例（低/高） | `views.js:865-871` |
| 263 | 星期列标签 | `views.js:874` |
| 264 | 365 天热力图网格 | `views.js:875` |
| 265 | 单个热力格（点击加载当日） | `views.js:832-848` |
| 266 | 当日明细面板 | `views.js:876-881` |
| 267 | 每模型明细行 | `views.js:850-852` |
| 268 | 当日无明细提示 | `views.js:848` |
| 269 | 费用锁定说明行 | `views.js:882` |
| 270 | 刷新按钮 | `views.js:883` |
| 271 | 清除账本按钮 | `views.js:884` |
| 272 | 清除账本确认对话框 | `views.js:774` |
| 273 | 热力图自动滚到最新 | `views.js:744-771` |

## 十、账户区（`wallet.js:913-994`）

| # | 功能 | 代码引用 |
|---|---|---|
| 274 | 账户管理标题 | `wallet.js:917` |
| 275 | 账户错误行 | `wallet.js:919, 810-815` |
| 276 | 当前账户行 | `wallet.js:921-923` |
| 277 | 无账户提示 | `wallet.js:925-926` |
| 278 | 账户名显示 | `wallet.js:933` |
| 279 | 掩码 Key 显示 | `wallet.js:936` |
| 280 | 当前账户标记 | `wallet.js:938` |
| 281 | 切换账户按钮 | `wallet.js:943-947` |
| 282 | 删除账户按钮 | `wallet.js:952` |
| 283 | 账户滚动容器 | `wallet.js:959` |
| 284 | 账户数量提示 | `wallet.js:960` |
| 285 | 账户名称输入 | `wallet.js:964` |
| 286 | API Key 输入 | `wallet.js:972` |
| 287 | 添加账户按钮 | `wallet.js:981-984` |
| 288 | 账户操作提示行 | `wallet.js:989` |

## 十一、跨切面行为

### 11.1 拖拽 / 吸附（23 项）

| # | 功能 | 代码引用 |
|---|---|---|
| 289 | 标签拖动阈值（3px） | `wallet.js:170-175` |
| 290 | 标签 dock 判定（6 种：home/free/bottom/left/right/content-left） | `wallet.js` `chooseChipDock` |
| 291 | 标签吸附预览 | `wallet.js` `computeSnapPreview` |
| 292 | 自由落点钳制（不被侧栏遮挡） | `wallet.js` `clampFreeDrop` |
| 293 | dock 后自动重排 | `wallet.js` `fitDockedChip` |
| 294 | 宽度分档（full/fit/compact） | `wallet.js` `measureHomeMode` |
| 295 | 堆叠上下文提升（`dshw_chipLift`） | `wallet.js` |
| 296 | bottom dock 宿主标记 | `wallet.js` `findBottomDockHost` |
| 297 | 缩放上限随 dock 变化（home 105% / 其他 125%） | `wallet.js` `saveChipScale` |
| 298 | 竖排朝向（left/right/content-left） | `wallet.js` |
| 299 | 圆点拖动 | `wallet.js:1606-1610` |
| 300 | 圆点落点归位 | `wallet.js` `settleDotPosition` |
| 301 | 浮动窗位置自适应 | `wallet.js` `fitFloatingWindow` |
| 302 | 面板拖动阈值（3px） | `wallet.js:1355-1360` |
| 303 | 面板位置钳制 | `wallet.js` `clampPosition` |
| 304 | 面板打开时定位 | `wallet.js:1204-1215` |
| 305 | 外点关闭面板 | `wallet.js` `onDocDown` |
| 306 | Escape 关闭面板 | `wallet.js` |
| 307 | 确认浮层焦点陷阱 | `wallet.js:1187-1201` |
| 308 | 确认浮层外点取消 | `wallet.js:1187-1201` |
| 309 | 拖动后抑制 click | `wallet.js:170-180` |

### 11.2 后台/自动行为（18 项，编号另起）

| # | 功能 | 代码引用 |
|---|---|---|
| A1 | 15 秒快照轮询 | `wallet.js:259`, `core.js:24` |
| A2 | 快照广播自定义事件 | `wallet.js:259+` |
| A3 | 低余额通知（每次低余额只弹一次） | `wallet.js:236-245` |
| A4 | 余额恢复时主动关闭通知 | `wallet.js:236-245` |
| A5 | 阈值草稿自动同步（编辑中不覆盖，15 秒后解除） | `wallet.js:227-234` |
| A6 | 峰谷切换通知（60 秒检查，periodId 去重） | `wallet.js:135-148`, `settings.js:1493-1511` |
| A7 | 阈值 600ms 防抖保存 | `wallet.js:750-758` |
| A8 | 账户列表加载 | `wallet.js:805-815` |
| A9 | 账户增删切后的连带刷新 | `wallet.js:838-909` |
| A10 | 完成通知器（跨标签 leader 选举 + 队列） | `views.js:315-528` |
| A11 | 偏好同步监听（4 个事件） | `wallet.js:81-105`, `settings.js:79-109` |
| A12 | 宿主能力监听 | `settings.js:117-123`, `wallet.js:112` |
| A13 | 持久化偏好同步（跨重启，3 次重试） | `core.js:311-415` |
| A14 | 隐藏态时强制关闭面板 | `wallet.js` |
| A15 | dock 模式持久化（`dshw-float-mode`） | `wallet.js` |
| A16 | 面板位置重排后回写 | `wallet.js:1204-1215` |
| A17 | 时钟 30 秒轮询快照 | `settings.js:1421-1424` |
| A18 | 时钟文字溢出测量（canvas） | `settings.js:1522-1564` |

### 11.3 系统通知（3 项，已核实只有这 3 种）

| # | 功能 | tag | 代码引用 |
|---|---|---|---|
| N1 | 对话完成通知 | `dsh-harness-completion` | `views.js:367-371` |
| N2 | 余额低于阈值通知 | `dsh-wallet-low` | `wallet.js:240` |
| N3 | 峰谷切换通知 | `dsh-wallet-peak` | `wallet.js:142`, `settings.js:1508` |

### 11.4 存储键（21 个）

`dsh-wallet-recharge-confirmed`, `dshw-chip-layout-v4`, `dshw-panel-pos-v1`, `dshw-chip-scale-v1`, `dshw-chip-style-v1`, `dshw-chip-balance-only-v1`, `dshw-data-visibility-v1`, `dshw-completion-notify-v1`, `dshw-low-blink-v1`, `dshw-peakring-v1`, `dshw-peak-orient-v1`, `dshw-peak-background-v1`, `dshw-peak-recharge-v1`, `dshw-peak-scale-v1`, `dshw-peak-dock-v1`, `dshw-peak-pos-v1`, `dshw-classic-card-v1`, `dshw-peaknotify-v1`, `dshw-peaknotify-last-v1`, `dshw-completion-notify-leader-v1`, `dshw-permanent-delete-v1`（定义于 `core.js:25-50`）

---

## 附：宿主上报（供兼容性核对）

- **host 侧 `inject`**：`['webServer', 'credentials']` — `index.js:28`
- **client 侧 `inject`**：`['slots','sessions','modelDirectories','remote','remote.session','locale']` — `wallet.js:1678`
- **`dsh.client.inject`（模块名）**：`@deepseek-ai/dsh-client-ui-slots`, `-ui-conversation`, `-ui-model-selection`, `-locale`
- **注册的 3 个 slot**：`conversation.input.left`(order 130) / `settings.section`(order 40) / `sidebar.footer.action`(order 50)

---

# 0.1.7-rc.1 迁移影响评估

> 方法：把插件对宿主的**全部调用接触面**（13 条调用链）逐条对 0.1.7-rc.1 的包内容做代码级比对（`npm pack` 拉取两版后逐文件对比），不依赖印象。
> 结论：**309 项中 307 项不受影响，1 项降级，1 项失效。**

## 结论摘要

| 判定 | 数量 | 清单项 |
|---|---|---|
| 不受影响 | 307 | 其余全部 |
| **降级** | 1 | A10 完成通知的第二个触发条件（`completed` 字段） |
| **失效** | 1 | 点完成通知跳转会话（`ctx.sessions.open`） |

**直接迁移到 0.1.7-rc.1 后，插件能正常加载、能算钱、能显示、三个 slot 都在。唯一真正失效的是「点通知跳转会话」。**

## 逐条接触面对照

| 宿主接触面 | 覆盖清单项 | 0.1.5-rc.2 | 0.1.7-rc.1 | 判定 |
|---|---|---|---|---|
| `ctx.webServer.register(route)` | 23-37 + 1-22 | `register(route: WebRoute): () => void` | 逐字相同 | OK |
| `ctx.on('llm/stream', tap)` | 1-5（Token 计量命脉） | waterfall 签名 | 逐字相同 | OK |
| `StreamChunk` usage 块 | 1,3,4 | `{ type:'usage'; usage: TokenUsage }` | 逐字相同 | OK |
| `TokenUsage` 字段 | 1,3,4 | input/output/total?/cacheRead?/cacheWrite?/reasoning? | 逐字相同 | OK |
| `ctx.get(service)` | 8-12 | `get(name, strict=true)` | 未变（cordis 4.0.2→4.0.4） | OK |
| `credentials.resolve/.set` | 10-12 | resolve/set/unset/delete | 方法计数完全一致 | OK |
| slot `conversation.input.left` | 38-56 | `{kind:'list',scope:'session'}` | 逐字相同 | OK |
| slot `settings.section` | 101-218 | `{kind:'list',scope:'root',owner:...}` | 逐字相同 | OK |
| slot `sidebar.footer.action` | 219-236 | `{kind:'list',scope:'root',owner:...}` | 逐字相同 | OK |
| `ctx.slots.register/inject` | 38-56, 101-236 | 存在 | 存在 | OK |
| `ctx.locale.bind/register/getSnapshot/subscribe` | 全部文案 | 记忆化 + 实时读 | 三个函数体逐字相同 | OK |
| `ctx.modelDirectories.directoryFor` | 39,50,52 | 存在 | 计数一致，导出零增删 | OK |
| `ctx.sessions.list`（snapshot store） | A1-A18 | `createSnapshotStore` | 同样是 `createSnapshotStore` | OK |
| 宿主主题 CSS 变量（23 个） | 全部 UI 配色 | 17 个由主题包定义 | 同一划分（定义总数 357→373） | OK |
| `snapshot.byId[id].completed` | A10 第二触发条件 | `...entry.completed ? {completed:true} : {}` | **整条移除** | **降级** |
| `ctx.sessions.open(id)` | 点通知跳转会话 | `open(id){ this.manager.select(id) }` | **整条移除** | **失效** |

### 主题变量细查（23 个）

17 个由主题包定义、两版都在；6 个（`--dsw-alias-brand-soft`、`-state-error-soft`、`-state-success-soft`、`-state-warning-primary`、`-state-success-muted`、`-state-warning-soft`）在**两版都缺失**，说明不是 0.1.7 的回归 —— 而且我们为这 6 个**全部写了兜底颜色**（`styles.js:86,87,88,102,135,141,155,226,229,263,264,295`），所以主题层面零风险。

## 会出问题的功能（逐条）

一共 **3 条**。每条独立说明原因。

### ① 【失效】N1 对话完成通知 —— 点击跳转部分

| 项 | 内容 |
|---|---|
| 清单序号 | **N1**（对话完成通知），代码 `views.js:367-371`；跳转调用点 `views.js:383` |
| 功能描述 | 桌面通知弹出后，**点击通知** → `window.focus()` + `ctx.sessions.open(item.id)` 跳到那个会话 |
| 0.1.7 表现 | **点击后不跳转**。`window.focus()` 仍生效，通知关联的会话不会被打开 |
| 是否崩溃 | **不会**。`views.js:383` 外层有 `try { ... } catch (e) { /* session may have been removed */ }` |
| 严重度 | 中。属**静默失效** —— 用户点通知发现没反应，但没有任何报错 |

**原因**：`ctx.sessions.open(id)` 这个方法在 0.1.7 被整条删除。

```
0.1.5 ClientSessions 成员: open, openSubagent, setSubagentCatalogOpen, refreshSubagents, clear, ...
0.1.7 ClientSessions 成员: retain, using, retainInfo, subagentAddress, refreshProjections, ...
                                                    ↑ open 与 openSubagent 都不在了

0.1.5 SessionManager.select(sessionId)  定义在 L2257（open 的实现就是调它）
0.1.7 SessionManager 只剩 resolveTarget —— select 也没了

0.1.5 this.selected 出现 9 次（会话控制器自己维护"当前选中"）
0.1.7 this.selected 出现 0 次 —— 这个概念整体搬走了
```

根本原因是**模型变更**：会话控制器不再持有"当前选中哪个会话"的状态，改为 `retain` / `using` 的**引用租借**模型（持有会话引用、用完释放）。"显示哪个会话"这件事**不再属于会话控制器**。

**替代路径**（已核实可用）：导航能力搬到了 `uiWorkspace` 服务 —— `ui-conversation` 0.1.7 自己注入给 header 的 `open` 实现就是：

```js
open: (id) => { workspaceNavigation.openSession(id) }
// 而 workspaceNavigation = ctx.get("uiWorkspace")
```

签名兼容性：

```
0.1.5  openSession(sessionId: SessionId): void
0.1.7  openSession(target: SessionTarget): void
       SessionTarget = SessionId | SubagentAddress     ← 放宽，不是收紧
```

**但有个坑**：`uiWorkspace.openSession` 在 **0.1.2-alpha.3 不存在**（那版只有 `connectWorkspace` / `startSession` / `archiveSession`），而 0.1.2-alpha.3 在我们声明的兼容范围内。所以修法必须**依次降级**，不能直接替换。

---

### ② 【降级】A10 完成通知器 —— `completed` 触发条件失效

| 项 | 内容 |
|---|---|
| 清单序号 | **A10**（完成通知器：跨标签 leader 选举 + 队列），代码 `views.js:315-528`；判定逻辑 `views.js:422, 425-428` |
| 功能描述 | 监听会话列表，检测"刚完成"的会话并排队弹通知。判定有两个条件 |
| 0.1.7 表现 | **第二个条件恒为 false**，只剩第一个条件生效 |
| 是否崩溃 | **不会** |
| 严重度 | 低。**功能不失效**，只是触发器覆盖面变窄 |

我们原本的判定：

```js
var state = { running: row.running === true, completed: row.completed === true }

var justFinished = !!previous && (
  (previous.running && !state.running) ||      // 条件 1：running 由真变假 —— 仍工作
  (!previous.completed && state.completed)     // 条件 2：completed 由假变真 —— 0.1.7 恒 false
)
```

**原因**：0.1.7 的会话列表投影里删掉了 `completed` 字段。

```js
// 0.1.5  projectList() 构造 byId[id] 时：
byId[entry.sessionId] = {
  id, displayTitle, running: entry.running,
  ...entry.completed ? { completed: true } : {},     // ← 有
  blank, updatedAt, ...
}

// 0.1.7  projectList()：
byId[entry.sessionId] = {
  id, displayTitle, running: entry.running,
  retainedBy: this.retentionSnapshot(entry.sessionId).retainedBy,   // ← completed 被这行取代
  blank, updatedAt, ...
}
```

底层机制也一并删除了：0.1.5 有 `completedNotifications` 这个 Set（"待处理完成提醒"）+ `syncCompletedNotifications()` 方法；0.1.7 里 `completed` 只出现在**无关的注释**中。

**为什么功能不失效**：条件 1（`running` 由真变假）是主路径且完整可用 —— 会话跑完时 `running` 必然翻转。条件 2 原本是补充路径。

**不需要改代码**，但建议加注释说明，否则将来读代码的人会困惑为什么这个条件永远不成立。

---

### ③ 【显示不准】#116 兼容性状态显示 —— 显示 `unknown`

| 项 | 内容 |
|---|---|
| 清单序号 | **#116**（兼容性状态显示），代码 `settings.js:602-603`；判定源 `index.js:551-560` |
| 功能描述 | 设置面板健康卡里显示"兼容：已声明兼容 / 建议升级 / 尚未验证 / 检测中" |
| 0.1.7 表现 | 显示 **`unknown`（"该 Harness 版本尚未验证兼容性"）** |
| 是否崩溃 | **不会** |
| 严重度 | 极低。**纯文案**，不影响任何功能 |

**原因**：`index.js:551` 的 `hostCompatibility()` 只认 `package.json` 里 `dsh.compatibility.dshReleases` 的**精确白名单匹配**：

```js
: Object.hasOwn(COMPATIBILITY_RELEASES, hostVersion) && COMPATIBILITY_RELEASES[hostVersion] === 'compatible'
  ? { status: 'compatible', ... }
  : { status: 'unknown', ... }
```

而白名单当前只到 `0.1.5-alpha.1`，`dsh` 范围是 `>=0.1.2-alpha.3 <0.1.3 || =0.1.5-alpha.1` —— **连我们实际在跑的 `0.1.5-rc.2` 都不在名单里**。所以在 0.1.7 上必然显示 `unknown`。

**这不是 0.1.7 引入的问题，是白名单本来就没更新。** 修法是补 `dshReleases` 白名单（纯元数据，无风险）。

---

## 不会出问题的（已逐项核实）

以下接触面在 0.1.5-rc.2 与 0.1.7-rc.1 之间**逐字相同**，因此覆盖的功能不受影响：

| 宿主接触面 | 覆盖清单项 | 核实内容 |
|---|---|---|
| `TokenUsage` 全部字段 | 1, 3, 4（记账命脉） | input/output/total?/cacheRead?/cacheWrite?/reasoning? 逐字相同 |
| usage chunk 形状 | 1, 3, 4 | `{ type: 'usage'; usage: TokenUsage }` 逐字相同 |
| `llm/stream` waterfall 签名 | 1-5 | `(options, next) => AsyncIterable<StreamChunk>` 逐字相同 |
| `webServer.register(route)` | 全 15 条路由 + 服务端 1-22 | `register(route: WebRoute): () => void` 逐字相同 |
| `WebRoute` 接口 | 同上 | kind/path/handler 逐字相同 |
| `credentials.resolve/.set` | 10-12 | 方法计数完全一致 |
| `ctx.get(service)` | 8-12 | cordis 4.0.2→4.0.4 该行未变；实测不需 inject |
| slot `conversation.input.left` | 38-56（标签全部） | 声明逐字相同；**且宿主自己没往这个槽加条目**，与我们 order 130 不冲突 |
| slot `settings.section` | 101-218（设置面板全部） | 声明 + owner props 逐字相同 |
| slot `sidebar.footer.action` | 219-236（峰谷时钟全部） | 声明 + owner props 逐字相同 |
| `ctx.locale.bind/register/getSnapshot/subscribe` | 全部文案 | 三个函数体逐字相同，5 条不变量全保住 |
| `ctx.modelDirectories.directoryFor` | 39, 50, 52 | 计数一致，导出符号零增删 |
| `ctx.sessions.list`（snapshot store） | A1-A18 | 两版都是 `this.list = createSnapshotStore({...})` |
| 主题 CSS 变量 23 个 | 全部 UI 配色 | 17 个两版都在；6 个两版都缺（非 0.1.7 回归）且**我们全写了兜底颜色** |

## 迁移方案

三处问题的性质完全不同，所以处理方式也不同。**核心结论：只有 ① 需要改逻辑，② 建议加注释，③ 是纯元数据。**

### 先看一个决定方案的关键事实

我核对了 `uiWorkspace.openSession` 的**实现**（不是只看签名）：

```js
// 0.1.5  openSession 的实现（ui-workspace/lib/client.js）
openSession(sessionId) {
  this.sessions.open(sessionId);          // ← 内部就是调 sessions.open
  this.ctx.layout.selectPanel(null);      // ← 额外：关掉侧栏面板
}

// 0.1.7  改成了新机制
openSession(target) {
  this.replaceMain(target, this.lifetime.signal, "reveal");
}
```

**这带来一个重要结论**：`uiWorkspace.openSession` 在 0.1.5 上是 `sessions.open` 的**超集**（同样跳转，且多关一个面板）。所以把首选路径换成 `uiWorkspace.openSession`，**在 0.1.5 上行为不会退化，反而更完整**。

三个世代的能力清单（从各自 `.d.ts` 的 `UiWorkspace` 接口读出）：

| 方法 | 0.1.2-alpha.3 | 0.1.5-rc.2 | 0.1.7-rc.1 |
|---|---|---|---|
| `openSession` | ❌ **无** | ✅ | ✅ |
| `openWorkspace` | ❌ | ✅ | ✅ |
| `forkSession` | ❌ | ✅ | ✅ |
| `connectWorkspace` | ✅ | ✅ | ✅ |
| `startSession` | ✅ | ✅ | ✅ |
| `archiveSession` | ✅ | ✅ | ✅ |
| `unarchiveSession` / `pin` / `unpin` | ❌ | ❌ | ✅ |

**注意**：0.1.2 的 `startSession(workspaceId)` 是**「开新会话」语义**（`startSession` 实现里走 `recentWorkspace` 挑选目标），**不接受 sessionId**，所以它**不能**当"跳到某会话"的降级路径。降级链末端只能是放弃跳转。

---

### ① 失效项的迁移实现

**思路**：把硬编码的 `ctx.sessions.open` 换成一个**按能力探测的解析器**，优先用 `uiWorkspace.openSession`，回落到 `sessions.open`，都没有就放弃跳转（保留 `window.focus()`）。

我实测确认了三件支撑这件事的事：

1. **`ctx.get` 不受 inject 约束** —— 用真实 cordis 跑探针：
   ```
   root ctx.get(uiWorkspace)            object
   child scope.get(uiWorkspace)         object     ← 我们拿到的是子作用域，照样能取到
   child scope.uiWorkspace (property)   THROW cannot get property "uiWorkspace" without inject
   child scope.get(missing)             undefined  ← 缺失时返回 undefined，不抛
   ```
   这意味着**不需要**把 `uiWorkspace` 加进 `inject`。加进去反而有害：0.1.2 上没这个服务，`inject` 缺失会让 cordis **整个 withhold `apply`**，插件完全不加载。

2. **`uiWorkspace` 是标准 cordis 服务** —— `UiWorkspaceService extends cordis.Service` + `super(ctx, "uiWorkspace")`，三个版本的服务名**都相同**。

3. **`openSession` 的参数类型是放宽的** —— `SessionTarget = SessionId | SubagentAddress`，我们传的 `item.id`（sessionId 字符串）在并集内合法。

**具体实现**（加在 `views.js` 的 `installCompletionNotifier` 之前）：

```js
/**
 * Resolve "navigate to this session" across dsh generations.
 *
 * The session controller owned selection until 0.1.5 (`ctx.sessions.open`) and
 * handed navigation to the workspace service in 0.1.7, where `open`/`select`
 * were removed outright. `uiWorkspace.openSession` exists from 0.1.5 on — and
 * in 0.1.5 it is a SUPERSET of `sessions.open` (it also clears the side panel),
 * so preferring it costs nothing on older hosts. `ctx.get` is used rather than
 * an `inject` entry on purpose: `uiWorkspace` does not exist in 0.1.2, and a
 * missing injected service makes cordis withhold `apply` for the whole plugin.
 *
 * @returns {{ open: (function(string): void)|null, via: string }}
 */
function resolveSessionOpener(ctx) {
  var workspace = null
  try { workspace = ctx && typeof ctx.get === 'function' ? ctx.get('uiWorkspace') : null } catch (e) { workspace = null }
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

**调用点改动**（`views.js:381-385`）：

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
  // `open` is null only on a host that offers neither seam; the window focus
  // above is then the whole effect, which is what the notifier degraded to
  // before this resolver existed.
  if (opener.open !== null) {
    try { opener.open(item.id) } catch (e) { /* session may have been removed */ }
  }
  finishActive(true)
}
```

其中 `opener` 在 notifier 安装时解析一次：

```js
function installCompletionNotifier(ctx) {
  if (typeof window === 'undefined' || !ctx.sessions || !ctx.sessions.list) return function () {}
  var opener = resolveSessionOpener(ctx)   // ← 新增：安装时解析一次
  ...
```

**为什么只解析一次**：服务在客户端生命周期内稳定；且通知安装于 `apply` 期间，早于任何通知点击。

**模拟验证**（已跑，四个宿主世代全 PASS）：

```
0.1.2-alpha.3        -> via=sessions.open            callable=YES
0.1.5-rc.2           -> via=uiWorkspace.openSession  callable=YES
0.1.7-rc.1           -> via=uiWorkspace.openSession  callable=YES
no uiWorkspace svc   -> via=sessions.open            callable=YES

PASS  0.1.2-alpha.3: expected sessions.open, got sessions.open
PASS  0.1.5-rc.2: expected uiWorkspace.openSession, got uiWorkspace.openSession
PASS  0.1.7-rc.1: expected uiWorkspace.openSession, got uiWorkspace.openSession
PASS  no uiWorkspace svc: expected sessions.open, got sessions.open
```

**对 `client-injection.test.mjs` 的影响**：现有测试用桩 ctx（只有 `inject`/`slots`/`effect`），没有 `get`。解析器里 `typeof ctx.get === 'function'` 的判断让它在桩环境下安全回落到 `sessions.open`，**测试不需要改**。但建议补一条断言，锁住"解析器在 0.1.7 形状下选 `uiWorkspace`"。

---

### ② 降级项的迁移实现

**结论：不需要改行为，建议加注释。**

我量化了这个改动的实际差异（模拟跑过）：

```
same  old=true  new=true    running flips true->false (主路径)
DIFF  old=true  new=false   completed flips false->true (0.1.5 独有路径)
same  old=false new=false   no previous state
same  old=false new=false   already stopped
```

即在 0.1.5 上，`completed` 路径**曾经**能多触发一次通知；删掉它会在 0.1.5 上**减少**触发。所以我**不建议**删：

```js
// 保留两个条件 —— 对 0.1.7 无害（第二个恒 false），对 0.1.5 有益
var justFinished = !!previous && (
  (previous.running && !state.running) ||
  (!previous.completed && state.completed)
)
```

只加一条注释说明为什么第二个条件在新宿主上不成立：

```js
// `completed` is projected by the session list on 0.1.5 and earlier, where it
// marks a pending completion reminder. 0.1.7 removed both the field and the
// `completedNotifications` mechanism behind it, so this second disjunct is
// inert there — the running->stopped edge above carries the notifier alone.
var justFinished = !!previous && (
  (previous.running && !state.running) ||
  (!previous.completed && state.completed)
)
```

**为什么不动它**：删掉会**降低 0.1.5 上的通知覆盖率**（我们仍在支持 0.1.5），而保留的代价是零（一个恒 false 的布尔判断）。

---

### ③ 显示不准项的迁移实现

**纯 `package.json` 元数据**，无代码改动。

当前：

```json
"dsh": ">=0.1.2-alpha.3 <0.1.3 || =0.1.5-alpha.1",
"dshReleases": {
  "0.1.2-alpha.3": "compatible",
  "0.1.2-alpha.4": "compatible",
  "0.1.2-alpha.5": "compatible",
  "0.1.2-rc.1": "compatible",
  "0.1.5-alpha.1": "compatible"
}
```

**已存在的两个问题**（不只是 0.1.7）：范围里 `<0.1.3` 覆盖了 0.1.2 全部，但 `=0.1.5-alpha.1` 是个**点值**，把实际在跑的 `0.1.5-rc.2` 和当前 npm `latest`（`0.1.5-rc.3`）都排除在外。所以现在健康检查显示的就已经是"尚未验证"，不是 0.1.7 才坏的。

**建议改动**（需要你先定"验证到哪一档"）：

```json
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

⚠️ **注意**：这里加 `0.1.7-rc.1: compatible` 是**有条件的** —— 只有在 ① 的修法落地**并且**实机验证过之后才应该加。而且 ② 那条 `snapshot.byId[id].completed` 在 0.1.7 上不投影，**0.1.7 的通知覆盖面本来就比 0.1.5 窄**，标注 `compatible` 时应知晓这一点。

**顺序**：`dsh` 范围可以现在就放宽（它只是安装门槛，不影响显示）；`dshReleases` 白名单建议**等实机验证后再加 0.1.7**。

---

## 落地顺序建议

| 步 | 动作 | 风险 | 前置 |
|---|---|---|---|
| 1 | ③ 放宽 `dsh` 范围（纯元数据） | 无 | — |
| 2 | ② 加注释（零行为变化） | 无 | — |
| 3 | ① 加 `resolveSessionOpener` + 改调用点 | 低（有回落链） | — |
| 4 | 补一条测试：解析器在 0.1.7 形状下选 `uiWorkspace` | 无 | 3 |
| 5 | **实机装 0.1.7-rc.1 验证** | — | 1-4 |
| 6 | ③ 白名单补 `0.1.7-rc.1: compatible` | 无 | 5 通过 |
| 7 | bump 版本 + 发布 | — | 6 |

**第 5 步不可省** —— 本次评估全部是静态比对 + cordis 探针，**没有实机跑过 0.1.7**。特别是 `cordis-plugin-loader` 1.0.3→1.0.5 那份约 360 行的重写我只审了 `{id,name}` 解析路径，未逐行过。
