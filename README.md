# personal-site — 陈姜希 / Jessy 的数字自我

一个以 AI agent 为主交互形态的个人站。访客在首页直接和 **Jessy**（我的数字化身）对话；其它路由是手写的编辑性页面（项目 / 艺术）和管理后台。

**技术栈**：React 19 + React Router 7 · Vite + 内嵌 server middleware（同进程）· SQLite (`better-sqlite3`) · MiniMax TTS · 纯 CSS / SVG 做 ambient backdrop。

> 📐 关于设计哲学与最初的"presence / 火焰显影"叙事，见 [`docs/design-archive-v1.md`](docs/design-archive-v1.md)。
> 那是 v1 蓝图，实际实现已朝**暗紫赛博 HUD + 视频头像**方向迭代。本文档以**当前实现**为准。

---

## 路由

| 路径 | 组件 | 说明 |
| --- | --- | --- |
| `/` | `src/routes/V2.tsx` | 主对话首页 — VideoHead + chat + TTS + chips |
| `/projects` | `src/routes/Projects.tsx` | 项目编辑页（手写），每件作品有锚点 `/projects#<id>` |
| `/arts` | `src/routes/Arts.tsx` | 艺术 gallery，锚点 `/arts#<id>`（id 见 `src/data/arts.ts`） |
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

前后端跑在同一个 vite 进程里 —— server 逻辑在 `vite.config.ts` 通过 plugin 形式挂为 middleware（`chatApiPlugin / ttsApiPlugin / adminApiPlugin`），同时挂在 `configureServer`（`pnpm dev`）和 `configurePreviewServer`（`pnpm preview`）上，没有独立的 node server。

**生产环境跑的是 `pnpm build` 之后的 `pnpm preview`**（`deploy/jessy-lab.service`），不是 dev server：打包压缩后的 JS 一次性下发，子页面按需加载。之前线上用 `pnpm dev`，首页要拉 40 个未压缩的模块。

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
| 首次访客开场白文案 | `src/routes/V2.tsx` 顶部 `GREETING` 常量（里面的 `/projects` `/arts` 会变成链接） |
| 聊天回复里哪些路径 / 网址变成链接、链接按钮上的名字、语音怎么念 | `src/lib/links.ts` |
| 新增一件作品 | `src/routes/Projects.tsx` 的 `PROJECTS` + `CHAPTERS`（页面），`src/data/projects.ts`（agent 的 `reveal_project` 工具读这里），再在 `/admin` 的 prompt「作品库存」里加一行 |
| 推荐 chips 池子 | `src/routes/V2.tsx` 顶部 `SUGGESTIONS_POOL` 数组 |
| 每次抽几条 chips | `V2()` 内 `useState(() => sampleN(SUGGESTIONS_POOL, 4))` 第二个参数 |
| Agent 语气 / 身份（seed） | `config/agent.ts` `SYSTEM_PROMPT` |
| Agent 语气（live，已 seed 后） | `/admin` UI |
| Agent 模型 / 温度 / 上下文规则 / 工具 | `server/chat-plugin.ts`（工具结果在 `server/tool-data.ts`） |
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
pnpm preview    # 构建产物 + 内嵌 server（生产就是这个）
```

### 部署（东京 `8.216.48.63`，仓库在 `/home/jessy/personal-site`）

```bash
git push origin main
ssh root@8.216.48.63 'bash /home/jessy/personal-site/deploy/deploy.sh'   # pull → install → build → 重启
```

nginx（`/etc/nginx/sites-enabled/jessylab.cc`）对 `/assets/*` 设一年缓存（文件名带 hash），对图片 / 视频 / 字体设 30 天，并对 JS / CSS / JSON 开 gzip。

---

## 一些非显然的实现约定

- **TTS 必须由 user gesture 触发**：iOS / Safari / WeChat 不允许无交互的 audio 播放。开场白文字虽然在 mount 时就显示，但要等访客**第一次点击或按键**才会发声 —— 这是浏览器的硬约束，不是 bug。见 `V2.tsx` 里的 greeting listener effect。
- **Chip 的 race**：window 的 `click` 监听器（开场白触发）会在 React 的 `onClick`（chip 触发的 `ask()`）**之后**才冒泡到。所以 `ask()` 里调用 `suppressGreetingRef.current?.()` 抢先关闭监听，避免出现"开场白播了 100ms 又被切断"的爆音。这也是为什么用 `click` 而不是 `pointerdown`。
- **History 是服务端真相**：前端不存对话历史，每次进站都从 `/api/history?sessionId=...` 拉。模型上下文也由服务端从 DB 重建，前端传过去的对话历史会被忽略（防注入）。见 `chat-plugin.ts`。
- **聊天里的链接**：模型只写纯文本路径或网址（`/projects`、`/arts#fire`、`xuanji.life`），前端 `src/lib/links.ts` 把它们渲染成链接，并在气泡下面再给一排按钮（手机上好点）。访客在输入框里直接打 `/projects` 会直接跳过去，不发给模型。模型调 `reveal_project` / `show_paper` 时，服务端如果发现回复里没写该项目的网址，会通过 SSE `links` 事件补一个链接按钮，并把这个网址追加到存进 DB 的那条回复末尾，刷新后链接还在。
- **只剩两个工具**：`reveal_project`、`show_paper`，都是查资料。v1 的 `reveal_thread / advance_clarity / shift_mood / navigate_to` 前端从来没接，模型说"带你过去了"其实什么都没发生，已删除。
- **音频流水线的限制**：`createMediaElementSource` 在同一个 `<audio>` 元素上只能调一次，所以 TTS 用一个全局 shared `<audio>`，多句话靠 `stopAudio()` 串行切换，不并发。见 `src/lib/tts.ts` 顶部注释。

---

## 目录速览

```
config/
  agent.ts              # SYSTEM_PROMPT seed (写一次进 DB 就不再读)
docs/
  design-archive-v1.md  # 初版设计愿景（参考用，非现状）
PROFILE.md              # 我的档案 — agent memory 的素材来源
deploy/
  jessy-lab.service     # systemd unit（pnpm preview）
  deploy.sh             # 服务器上一键 pull / build / 重启
server/
  chat-plugin.ts        # /api/chat (SSE), /api/history
  tts-plugin.ts         # /api/tts
  admin-plugin.ts       # /api/admin/*
  agent-config.ts       # 60s in-memory cache，/admin 改完调 invalidate
  prompt.ts             # buildSystemPrompt：DB prompt + memory + 访客上下文 + 安全规则
  db.ts                 # better-sqlite3 setup + schema + seed
  tool-data.ts          # reveal_project / show_paper 的返回内容
  personal-site.db      # SQLite 文件 (gitignored 推荐)
src/
  routes/               # V2 / Projects / Arts / Admin / Placeholder
  components/           # BrandMark / BackLink
  scene/                # AmbientBackdrop (CSS / SVG) / VideoHead
  lib/                  # chat (SSE), tts (audio), session (UUID), links (回复里的链接)
  data/                 # projects（agent 工具用）、arts 锚点、profile、persona
  main.tsx              # 路由装配
  styles.css            # tailwind + 全局
public/                 # 视频 / 图片 / 字体
archive/                # 早期素材（视频 / 截图）
```
