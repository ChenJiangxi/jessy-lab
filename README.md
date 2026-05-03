# personal-site — 陈姜希 / Jessy 的数字自我

一个以 AI agent 为主交互形态的个人站。访客在首页直接和 **Jessy**（我的数字化身）对话；其它路由是手写的编辑性页面（项目 / 艺术）和管理后台。

**技术栈**：React 19 + React Router 7 · Vite + 内嵌 server middleware（同进程）· SQLite (`better-sqlite3`) · 自托管 TTS · Three.js 做 ambient backdrop。

> 📐 关于设计哲学与最初的"presence / 火焰显影"叙事，见 [`docs/design-archive-v1.md`](docs/design-archive-v1.md)。
> 那是 v1 蓝图，实际实现已朝**暗紫赛博 HUD + 视频头像**方向迭代。本文档以**当前实现**为准。

---

## 路由

| 路径 | 组件 | 说明 |
| --- | --- | --- |
| `/` | `src/routes/V2.tsx` | 主对话首页 — VideoHead + chat + TTS + chips |
| `/projects` | `src/routes/Projects.tsx` | 项目编辑页（手写，非 agent 调度） |
| `/arts` | `src/routes/Arts.tsx` | 艺术 gallery |
| `/research` | `src/main.tsx` `ResearchRedirect` | 重定向到学术主页 |
| `/contact` | `src/routes/Placeholder.tsx`（在 `main.tsx` 装配） | 邮箱 / GitHub 占位页 |
| `/admin` | `src/routes/Admin.tsx` | 后台 — agent_config 编辑 + Conversations tab（看/删访客 session） |

未注册路径走 `<Navigate to="/" replace />` 兜底。

---

## 架构

```
┌──────────────────────────────────────────────────────────────┐
│   pnpm dev (单进程 vite)                                       │
│                                                                │
│  ┌────────────────────────┐    ┌────────────────────────┐    │
│  │ Frontend (src/)         │    │ Server middleware       │    │
│  │  V2 (chat UI)           │    │ (server/*.ts plugins)   │    │
│  │  lib/chat   (SSE)       │◄──►│  chat-plugin   /api/chat  /api/history │
│  │  lib/tts    (audio)     │    │  tts-plugin    /api/tts   │    │
│  │  lib/session (UUID)     │    │  admin-plugin  /api/admin/* │    │
│  └────────────────────────┘    └────────────┬───────────┘    │
│                                              │                │
│                                  ┌───────────▼───────────┐    │
│                                  │  SQLite (WAL)          │   │
│                                  │  server/personal-site.db │  │
│                                  │   - agent_config        │   │
│                                  │   - chat_messages       │   │
│                                  └───────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

前后端跑在同一个 vite 进程里 —— server 逻辑在 `vite.config.ts:14` 通过 plugin 形式挂为 middleware（`chatApiPlugin / ttsApiPlugin / adminApiPlugin`）。dev 和 preview 都是同样形态，没有独立的 node server。

---

## 快速上手

```bash
pnpm install
pnpm dev          # http://localhost:5173
```

第一次运行：`config/agent.ts` 的 `SYSTEM_PROMPT` 会在第一次 `/api/chat` 请求时 seed 进 `agent_config` 表（`server/agent-config.ts:18` 的 `ensureSeeded`）。**之后想改 agent 语气，必须从 `/admin` UI 改 —— 直接编辑 `config/agent.ts` 不会生效**，因为 seed 只在 row 不存在时跑。

---

## 维护速查

### 常用旋钮

| 想改什么 | 改哪里 |
| --- | --- |
| 首次访客开场白文案 | `src/routes/V2.tsx` 顶部 `GREETING` 常量 |
| 推荐 chips 池子 | `src/routes/V2.tsx` 顶部 `SUGGESTIONS_POOL` 数组 |
| 每次抽几条 chips | `V2()` 内 `useState(() => sampleN(SUGGESTIONS_POOL, 4))` 第二个参数 |
| Agent 语气 / 身份（seed） | `config/agent.ts` `SYSTEM_PROMPT` |
| Agent 语气（live，已 seed 后） | `/admin` UI |
| Agent 模型 / 温度 / 上下文规则 | `server/chat-plugin.ts` |
| TTS 引擎 / voice id | `server/tts-plugin.ts` |
| TTS 文本清洗规则 | `src/lib/tts.ts` 的 `cleanForTTS` |
| 流式打字速度 / 标点停顿 | `V2.tsx` 顶部的 `BASE_DELAY_MS` / `SOFT_PAUSE_MS` / `HARD_PAUSE_MS` |
| 移动端导航文案 | `V2.tsx` 底部的 `MobileNav` 组件 |
| 联系方式（邮箱 / GitHub） | `src/main.tsx` `/contact` 路由的 `links` 数组 |
| 允许的 host（生产域名） | `vite.config.ts` `server.allowedHosts` |

### 数据库

DB 文件：`server/personal-site.db`（SQLite，WAL 模式 —— `pnpm dev` 在跑时不要直接手动写）。

| 表 | 内容 | 备注 |
| --- | --- | --- |
| `agent_config` | `system_prompt` + `memory`（按 `name` 唯一） | 懒 seed：第一次 `/api/chat` 时若 row 不存在则用 `config/agent.ts` 写入 |
| `chat_messages` | 全部访客对话，按 `session_id` 分组 | `sessionId` 是访客 localStorage 里的 UUID（`src/lib/session.ts`） |

常用 SQL：

```sh
# 看某访客最近聊了什么
sqlite3 server/personal-site.db \
  "SELECT role, substr(content,1,80), datetime(ts/1000,'unixepoch','localtime')
   FROM chat_messages WHERE session_id='<uuid>' ORDER BY ts;"

# 重置某访客
sqlite3 server/personal-site.db \
  "DELETE FROM chat_messages WHERE session_id='<uuid>';"

# 强制 agent_config 重新从 config/agent.ts seed
sqlite3 server/personal-site.db "DELETE FROM agent_config;"
```

或直接走 `/admin` Conversations tab 删（更安全 —— 走应用层、不会撞 WAL 锁）。

### 命令

```bash
pnpm dev        # 开发 — vite + 内嵌 server
pnpm build      # tsc -b && vite build
pnpm preview    # 预览构建产物
```

---

## 一些非显然的实现约定

- **TTS 必须由 user gesture 触发**：iOS / Safari / WeChat 不允许无交互的 audio 播放。开场白文字虽然在 mount 时就显示，但要等访客**第一次点击或按键**才会发声 —— 这是浏览器的硬约束，不是 bug。见 `V2.tsx` 里的 greeting listener effect。
- **Chip 的 race**：window 的 `click` 监听器（开场白触发）会在 React 的 `onClick`（chip 触发的 `ask()`）**之后**才冒泡到。所以 `ask()` 里调用 `suppressGreetingRef.current?.()` 抢先关闭监听，避免出现"开场白播了 100ms 又被切断"的爆音。这也是为什么用 `click` 而不是 `pointerdown`。
- **History 是服务端真相**：前端不存对话历史，每次进站都从 `/api/history?sessionId=...` 拉。模型上下文也由服务端从 DB 重建，前端传过去的对话历史会被忽略（防注入）。见 `chat-plugin.ts`。
- **`server/prompt.ts` 的 `ROOM_NOTES` / `THREAD_NOTES` 当前是 dead code**：`buildSystemPrompt(agent, ctx, scene)` 的 `scene` 参数虽然 plumb 到了 `server/chat-plugin.ts:233`，但 `V2.tsx` 调 `streamChat()` 不传 `scene`，所以 server 始终用默认的 `{ kind: 'entry' }`。如果未来做"展开层"（按话题切换 room），这部分就能直接接上。
- **音频流水线的限制**：`createMediaElementSource` 在同一个 `<audio>` 元素上只能调一次，所以 TTS 用一个全局 shared `<audio>`，多句话靠 `stopAudio()` 串行切换，不并发。见 `src/lib/tts.ts` 顶部注释。

---

## 目录速览

```
config/
  agent.ts              # SYSTEM_PROMPT seed (写一次进 DB 就不再读)
docs/
  design-archive-v1.md  # 初版设计愿景（参考用，非现状）
PROFILE.md              # 我的档案 — agent memory 的素材来源
server/
  chat-plugin.ts        # /api/chat (SSE), /api/history
  tts-plugin.ts         # /api/tts
  admin-plugin.ts       # /api/admin/*
  agent-config.ts       # 60s in-memory cache，/admin 改完调 invalidate
  prompt.ts             # buildSystemPrompt (含 dead-code ROOM/THREAD_NOTES)
  db.ts                 # better-sqlite3 setup + schema + seed
  tool-data.ts          # （tool-use 预留，目前未启用）
  personal-site.db      # SQLite 文件 (gitignored 推荐)
src/
  routes/               # V2 / Projects / Arts / Admin / Placeholder
  components/           # BrandMark / BackLink
  scene/                # AmbientBackdrop (three.js) / VideoHead
  lib/                  # chat (SSE), tts (audio), session (UUID)
  main.tsx              # 路由装配
  styles.css            # tailwind + 全局
public/                 # 视频 / 图片 / 字体
archive/                # 早期素材（视频 / 截图）
```
