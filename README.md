<div align="center">

# 🚀 NexusAI

### 智能大模型工作台 | AI Desktop Application

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Tauri](https://img.shields.io/badge/Tauri-2-FFC131?style=for-the-badge&logo=tauri&logoColor=black)](https://tauri.app/)
[![Zustand](https://img.shields.io/badge/Zustand-5-443E38?style=for-the-badge&logo=react&logoColor=white)](https://github.com/pmndrs/zustand)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)

<br />

**NexusAI** 是一款现代化的 AI 大模型聚合工作台，集成 **9 大模型厂商**、**14 个搜索引擎**、**RAG 知识库系统**、**MCP 工具服务**、**智能浏览器自动化**、**插件系统**、**多模态支持**，支持**桌面端应用打包**（Windows/macOS/Linux），采用精美的毛玻璃（Glassmorphism）UI 设计。

> 🔥 **最新更新 v1.8.0**: 新增 🔍 **14 搜索引擎智能检索**、🌐 **智能浏览器自动化**、🧠 **160+ Agents & 100+ Skills**、🎯 **9 嵌入模型**（Ollama / Jina / OpenAI / HuggingFace）、🛡️ **配置持久化**、🖼️ **13 主题 + 白色加粗预览模态**、🦙 **Ollama/LM Studio/vLLM 完整本地化**！

<br />

[✨ 功能特性](#-功能特性) •
[🚀 快速开始](#-快速开始) •
[📦 桌面应用](#-桌面应用) •
[🧠 RAG知识库](#-rag知识库系统) •
[🔍 智能搜索](#-智能搜索系统) •
[🌐 浏览器自动化](#-浏览器自动化) •
[🔀 工作流编排](#-工作流编排系统) •
[🤖 Agents & Skills](#-agents--skills) •
[🔌 MCP服务](#-mcp-model-context-protocol) •
[🔧 插件系统](#-插件系统) •
[🎤 多模态支持](#-多模态支持) •
[📖 使用指南](#-使用指南) •
[🎨 主题系统](#-主题系统)

</div>

---

## ✨ 功能特性

### 💬 智能对话

- 🗨️ 多轮对话，支持上下文记忆
- 📝 Markdown 实时渲染（代码块语法高亮、表格、引用、列表等）
- ⚡ 打字动画效果，流畅的用户体验
- 📋 一键复制代码块
- 💡 快捷提示词，快速发起对话
- 📂 对话历史管理，随时切换和回顾
- 🔍 **RAG 检索增强** - 基于知识库的智能问答
- 📁 **对话文件夹** - 按项目/主题分类管理对话
- 📌 **对话置顶** - 重要对话置顶显示
- 🔎 **对话搜索** - 按标题和消息内容全文搜索
- 👍👎 **对话评分** - 对消息点赞/踩反馈
- 📤 **对话导出** - 支持 Markdown/JSON/PDF/TXT 格式
- 🔊 **语音输出 (TTS)** - AI 消息语音播报
- ⌨️ **快捷键系统** - 可自定义键盘快捷键
- 📋 **对话模板** - 预设提示词模板，快速开始对话
- 👥 **团队权限** - 知识库和模板的细粒度权限管理
- 🎨 **主题预览** - 切换前预览主题效果（白色加粗文字保证清晰）
- 🛑 **流式中断** - 随时停止 AI 生成

### 🤖 Agents & Skills (v1.8.0)

**160+ 内置 AI Agent + 100+ Skill**，覆盖各行各业：

- 📂 **分类齐全** - 创意、技术、分析、语言、产品、专业、设计、学术、医疗、法律、金融、教育、科技、农业、手工艺术等
- 🎯 **专业领域** - 每个 Agent 都有专属系统提示词 + 推荐技能组合
- ⚡ **Skill 分类** - 信息获取、写作辅助、编程开发、数据分析、创意设计、生活服务、商务工作、学习教育等
- 🛠️ **Skill 执行器** - 12 个真实外部 API 集成（网络搜索、新闻、计算器、字典、维基百科、天气、汇率、代码搜索、图片生成等）
- 🔌 **可扩展** - 支持用户自定义 Agent 和 Skill，永久保存

### 🧠 RAG 知识库系统

**完整版 v1.4.0+**，**v1.8.0 性能/可用性大幅升级**：

| 功能 | 描述 |
|------|------|
| 📄 **文档上传** | 支持 PDF、Word、Excel、TXT、Markdown 格式 |
| ✂️ **智能分块** | 自动文本分割，可配置块大小和重叠度 |
| 🌐 **URL 导入** | 一键抓取网页内容（CORS 代理 + Jina Reader 优先） |
| 🧮 **9 嵌入模型** | Ollama (nomic/mxbai/MiniLM) / OpenAI (3-small/3-large/ada) / Jina v3 / HuggingFace / 本地 hash fallback |
| 🔍 **向量检索** | HNSW 向量索引，余弦相似度匹配 |
| 🏷️ **标签管理** | 知识库分类标签，支持筛选和批量操作 |
| 🔗 **多库联合** | 支持同时检索多个知识库 |
| 📊 **性能统计** | 实时显示检索耗时、Token 使用量 |
| 👁️ **文档预览** | 查看原始内容和分块详情 |
| ⚡ **Web Worker** | 检索计算在 Worker 线程，不阻塞 UI |
| 🛡️ **容错处理** | 单块嵌入失败自动降级，文档过大自动截断 |

### 🔍 智能搜索系统 (v1.8.0)

**14 个真实搜索引擎**，全部可调用：

| 类别 | 引擎 |
|------|------|
| 🌐 **通用搜索** | DuckDuckGo, Brave, Bing, Google CSE, SearXNG |
| 📚 **知识库** | Wikipedia, OpenLibrary, arXiv 学术论文 |
| 💻 **开发者** | StackOverflow, GitHub, npm Registry |
| 📰 **资讯社区** | HackerNews, Reddit |
| 🎨 **多媒体** | (内置图片生成) |
| 🤖 **AI 聚合** | 智能多引擎并行 + 去重排序 |

- 📋 **引擎选择器** - 可勾选启用哪些引擎，结果并集去重
- 💬 **发送到对话** - 搜索结果一键插入当前对话
- 💾 **历史记录** - 智能搜索历史自动保存
- 🔄 **实时抓取** - 无需 API Key 也能用的引擎优先

### 🌐 浏览器自动化 (v1.8.0)

- 🌐 **Web 抓取** - 自动访问 URL、提取内容
- 🤖 **智能操作** - 元素定位、表单填写、点击
- 📸 **截图支持** - 自动化过程中截图
- 📋 **任务编排** - 多步骤浏览器任务流

### 🔀 工作流编排系统

**v1.6.0 新增**：可视化工作流编排

| 功能 | 描述 |
|------|------|
| 🎨 **可视化编辑器** | 拖拽式节点编排 |
| 🔗 **多种节点** | LLM、条件、循环、工具、RAG、Webhook、脚本等 |
| 📋 **14+ 模板** | 文档问答、内容生成、代码审查、会议总结等 |
| ▶️ **一键运行** | 立即执行工作流 |
| 📊 **执行日志** | 实时查看运行状态和输出 |

**内置模板**：文档问答助手、智能客服分流、内容生成器、代码审查助手、文档数据提取、会议总结助手、多知识库问答、单元测试生成、API 文档生成...

### 🔌 MCP (Model Context Protocol)

**v1.6.0 扩展**：Model Context Protocol 工具服务 - **34+ 内置服务器**

| 类别 | 服务器 |
|------|--------|
| 📁 **文件系统** | filesystem, everything |
| 📊 **数据库** | sqlite, postgres, mysql, mongodb, redis, postgresql |
| 🔀 **版本控制** | git, github, github-repos, gitlab |
| 🌐 **API** | fetch, puppeteer, brave-search, openapi |
| ☁️ **云服务** | aws, aws-kb, aws-kb-retrieval |
| 💬 **通信** | slack, slack-channel, notion, linear |
| ⏰ **时间** | time |
| 🗺️ **地图** | google-maps |
| 📋 **项目管理** | jira, notion, linear, gitlab |
| 🔍 **搜索** | brave-search, everything |
| 🛡️ **监控** | sentry |
| 🤖 **AI/ML** | memory, sequential-thinking, everart |
| 🐳 **容器** | docker, kubernetes |
| 🔐 **安全** | gitleaks |

- 支持自定义 MCP 服务器配置
- 工具调用权限管理（询问/允许/拒绝）
- 实时连接状态监控
- **快速添加**功能，一键添加内置服务器
- 按分类筛选和搜索

### 🔧 插件系统

**v1.5.0 新增**：可扩展的插件架构

| 功能 | 描述 |
|------|------|
| 🏪 **插件市场** | 浏览/搜索/安装插件 |
| 🛡️ **安全沙箱** | 隔离环境运行插件 |
| 🔐 **权限控制** | 14 种细粒度权限 |
| ⚡ **热插拔** | 无需重启启用/禁用 |
| 🎣 **Hook 机制** | 8 种事件钩子 |

**可用 Hooks**：`before-message-send` / `after-message-receive` / `on-conversation-start` / `on-conversation-end` / `on-plugin-load` / `on-plugin-unload` / `on-theme-change` / `on-settings-change`

### 🎤 多模态支持

**v1.5.0 新增**：富媒体输入输出

| 功能 | 支持格式 |
|------|----------|
| 📷 **图片** | JPEG, PNG, GIF, WebP, SVG, BMP |
| 🎵 **音频** | MP3, WAV, OGG, WebM, M4A, AAC |
| 🎬 **视频** | MP4, WebM, OGV, MOV, AVI |
| 📄 **文件** | PDF, Word, Excel, TXT, Markdown |
| 🎤 **语音输入** | 实时录音 |

- 附件预览（聊天界面）
- 文件大小限制（按类型）
- 语音录制（Web API）

### 🧠 模型厂商支持

支持 **9 大模型厂商**，超过 **65+ 个模型**（2025-2026 最新版）：

| 厂商 | 代表模型 | 类型 |
|------|----------|------|
| ![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat-square&logo=openai&logoColor=white) | **GPT-4.1**, o3, o4-mini, GPT-4o, GPT-4o Mini | ☁️ 云端 |
| ![Anthropic](https://img.shields.io/badge/Anthropic-191919?style=flat-square&logoColor=white) | **Claude Opus 4.6**, **Claude 4 Sonnet**, Claude 3.5 Haiku | ☁️ 云端 |
| ![Google](https://img.shields.io/badge/Google-4285F4?style=flat-square&logo=google&logoColor=white) | **Gemini 2.5 Pro**, **Gemini 2.5 Flash**, Gemini 1.5 Pro | ☁️ 云端 |
| 🟣 通义千问 | **Qwen3-Max**, Qwen3-235B, QwQ-32B | ☁️ 云端 |
| 🔵 智谱 Z.AI | **GLM-4.7**, **GLM-4.5**, GLM-4-Plus | ☁️ 云端 |
| 🟢 MiniMax | **MiniMax-M2.1**, **MiniMax-Text-01** | ☁️ 云端 |
| 🔷 DeepSeek | **DeepSeek-V3.2**, **DeepSeek-R1** | ☁️ 云端 |
| 🦙 Ollama | Llama 3.3, Qwen 2.5/3, DeepSeek R1/V3, Mistral, Phi-4 等 | 🏠 本地 |
| ⚡ vLLM | Llama 3.1/3.3, Qwen 2.5/3, DeepSeek V3/R1, Phi-4 等 | 🏠 本地 |
| 💡 LM Studio | 任何 GGUF 模型 (OpenAI 兼容协议) | 🏠 本地 |

### 🖥️ 桌面应用

**基于 Tauri 的跨平台桌面应用**

| 平台 | 安装包格式 | 体积 |
|------|-----------|------|
| **Windows** | `.msi` (安装程序), `.exe` (安装包) | ~8MB |
| **macOS Intel** | `.dmg` (磁盘镜像), `.app` (应用程序) | ~10MB |
| **macOS Apple Silicon** | `.dmg` (M1/M2/M3) | ~10MB |
| **Linux** | `.deb`, `.rpm`, `.AppImage` | ~12MB |

### 🎨 毛玻璃 UI 设计

- `backdrop-filter: blur()` + 半透明背景的全局毛玻璃效果
- 动态浮动光晕球体背景（animate 动画）
- 精细的页面过渡动画（淡入、上滑、悬浮提升）
- **13 套精美主题**（7 深色 + 6 浅色）
- 📱 响应式设计，支持移动端适配
- 🦊 **Nexi 紫色猫咪机器人**吉祥物 + 呼吸动画
- ⌨️ **打字动画** 加载指示

### 💾 数据持久化 (v1.8.0)

- 🗄️ **Zustand + localStorage** - 所有配置自动保存
- 📂 **会话、文件夹、Agents、Skills、激活状态** 全部持久化
- 🔄 **Quota 容错** - 存储满时自动清理智能搜索历史后重试
- 🎛️ **可配置持久化键** - 版本号管理，兼容升级

---

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Rust** >= 1.70.0 (桌面应用打包需要)

### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/memory125/nexusai.git
cd nexusai

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev

# 4. 桌面应用开发模式
npm run tauri-dev

# 5. 构建桌面应用
npm run build:win      # Windows
npm run build:mac      # macOS Intel
npm run build:mac-arm  # macOS Apple Silicon
npm run build:linux    # Linux
```

### 配置 API Key

首次启动后，进入 **设置 → API 密钥** 配置你使用的模型厂商：

- **云端模型**：填入对应厂商的 API Key
- **本地模型 (Ollama)**：确保 Ollama 服务运行在 `http://localhost:11434`
- **本地模型 (LM Studio)**：确保 LM Studio 启动 OpenAI 兼容服务（默认端口 1234）
- **本地模型 (vLLM)**：启动 vLLM OpenAI 兼容服务

---

## 📦 桌面应用

访问 [Releases](https://github.com/memory125/nexusai/releases) 下载最新版本。

---

## 🧠 RAG 知识库系统

### 使用步骤

1. **创建知识库**: 知识库页面 → 新建知识库 → 输入名称/描述/标签
2. **上传文档**: 支持 PDF、Word、Excel、TXT、Markdown
3. **URL 导入** (v1.8.0): 粘贴网址，自动抓取内容（带 6 套 CORS 代理 fallback）
4. **配置 Embedding**: 选择 OpenAI/HuggingFace/Ollama/Jina/本地模型
5. **测试连接** (v1.8.0): 一键验证嵌入服务是否正常（显示维度+耗时+向量样本）
6. **使用知识库**: 单库检索或多库联合检索
7. **查看结果**: 展开「检索来源」查看相似度和性能统计

### 嵌入模型 (v1.8.0 新增 9 种)

| 模型 ID | 来源 | 维度 | 备注 |
|---------|------|------|------|
| `ollama-nomic-embed-text` | Ollama | 768 | 默认推荐 |
| `ollama-mxbai-embed-large` | Ollama | 1024 | 高质量 |
| `ollama-all-minilm` | Ollama | 384 | 轻量 |
| `text-embedding-3-small` | OpenAI | 1536 | |
| `text-embedding-3-large` | OpenAI | 3072 | |
| `text-embedding-ada-002` | OpenAI | 1536 | 旧版 |
| `jina-embeddings-v3` | Jina AI | 1024 | 多语言 |
| `sentence-transformers/all-MiniLM-L6-v2` | HuggingFace | 384 | |
| `simple-hash` | 本地 | 256 | 离线 fallback |

---

## 🔍 智能搜索系统

### 使用步骤

1. 进入 **智能搜索** 页面
2. 输入查询关键词
3. 勾选要使用的搜索引擎（默认 5 个：DDG/Wikipedia/StackOverflow/GitHub/HackerNews）
4. 点击搜索，结果自动并行抓取并去重
5. 点击「发送到对话」可将结果插入当前会话

### 14 个引擎

🌐 **通用**：DuckDuckGo, Brave, Bing, Google CSE, SearXNG
📚 **学术**：Wikipedia, arXiv, OpenLibrary
💻 **开发者**：StackOverflow, GitHub, npm
📰 **社区**：HackerNews, Reddit

---

## 🌐 浏览器自动化

进入 **浏览器自动化** 页面，可：
- 自动访问指定 URL
- 提取页面内容（标题、正文、链接）
- 模拟点击、滚动、输入
- 截图保存
- 链式任务流

---

## 🤖 Agents & Skills

### 内置 160+ Agent

按 20+ 行业分类：创意、技术、分析、语言、产品、设计、学术、医疗、法律、金融、教育、科技、农业、手工艺术等

### 内置 100+ Skill

按 10+ 类别：信息获取、写作辅助、编程开发、数据分析、创意设计、生活服务、商务工作、学习教育等

### 自定义 Agent/Skill

1. Agent/Skill 页面 → 点击「新建」
2. 填写名称、图标、分类、systemPrompt、推荐技能
3. 自动保存到本地，永久可用

### Skill 执行器 (v1.8.0)

12 个真实外部 API 集成，自动在对话中调用：

| Skill | 真实功能 |
|-------|----------|
| `web-search` | 实时网络搜索 |
| `news-aggregator` | 新闻头条聚合 |
| `academic-search` | arXiv 学术搜索 |
| `wikipedia` | 维基百科查询 |
| `dictionary` | 词典查词 |
| `weather` | 天气查询 |
| `currency-converter` | 汇率换算 |
| `calculator` | 数学计算 |
| `code-search` | 代码搜索 |
| `web-fetch` | 网页抓取 |
| `image-generation` | AI 图片生成 |
| `datetime` | 时区时间 |

---

## 🔌 MCP (Model Context Protocol)

### 使用步骤

1. **启用服务器**: MCP 页面 → 选择服务器 → 开启
2. **配置**: 填写必要的环境变量（如 GitHub Token）
3. **连接**: 点击连接按钮
4. **使用工具**: AI 对话中自动使用 MCP 工具

### 权限管理

- **ask**: 每次询问
- **allow**: 自动允许
- **deny**: 拒绝

---

## 🔧 插件系统

### 安装插件

1. **浏览市场**: 插件页面 → 插件市场
2. **搜索筛选**: 使用分类和排序
3. **安装**: 点击安装按钮
4. **配置**: 如有配置项，设置参数
5. **启用**: 自动激活

### 开发插件

参考 `plugins/README.md` 和示例插件 `plugins/hello-world/`。

---

## 🎤 多模态支持

### 使用方式

1. **上传附件**: 点击输入框旁边的 📎 按钮
2. **选择文件**: 图片/音频/视频/文档
3. **发送消息**: 附件随消息发送
4. **语音输入**: 点击 🎤 按钮开始录音

---

## 🎨 主题系统

### 13 套精选主题

**7 套深色主题**：
- 🌌 午夜星空 (Midnight) - 默认
- 🌊 极光幻境 (Aurora)
- 🌅 日落余晖 (Sunset)
- 🌊 深海幽蓝 (Ocean)
- 🌲 翡翠森林 (Forest)
- 🌹 玫瑰金粉 (Rose)
- 🤖 赛博朋克 (Cyberpunk)

**6 套浅色主题**：
- ☀️ 清晨白昼 (Light)
- 💜 薰衣草田 (Light Lavender)
- 🍑 蜜桃暖阳 (Light Peach)
- 🌿 薄荷清风 (Light Mint)
- 🌤️ 晴空万里 (Light Sky)
- 🏜️ 沙漠暮色 (Light Sand)

### 主题预览 (v1.8.0)

点击主题卡片 → 弹出**白色加粗预览模态**：
- 🖼️ 大尺寸模拟 UI 预览
- 🎨 显示主色调和背景色 hex 值
- 🏷️ 主题名称和描述
- ✓ 取消 / ⚡ 应用主题 按钮

预览模态采用**深色不透明背景**（`rgba(20,20,30,0.95)`），保证白色文字在所有主题下都清晰可读。

### 字体清晰度保障 (v1.8.0)

- ✅ **全局兜底层** - 硬编码 `text-gray-400` 等低对比度 utility 自动映射到主题变量
- ✅ **属性选择器** - 避免 Tailwind 4 转义类名解析问题
- ✅ **`!important` 击赢** - 覆盖 Tailwind utility 源顺序
- ✅ **占位符样式** - input/textarea placeholder 统一主题色
- ✅ **语义色保留** - 绿/红等状态指示色在亮主题下自动加深

---

## 📜 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| **v1.8.0** | 2026-06 | 🔍 **14 引擎智能搜索**、🌐 **浏览器自动化**、🧠 **160+ Agents & 100+ Skills**、🎯 **9 嵌入模型**（Ollama/Jina）、🛡️ **配置持久化**、🖼️ **白色加粗主题预览**、🦙 **Ollama/LM Studio/vLLM 完整本地化**、🌍 **字体清晰度全面保障** |
| **v1.7.0** | 2026-02 | 📁 **对话文件夹分类**、📌 **对话置顶**、🔎 **对话搜索**、👍👎 **对话评分**、📤 **对话导出**、🔊 **TTS语音输出**、⌨️ **快捷键系统**、📋 **对话模板**、👥 **团队权限管理**、🎨 **主题预览** |
| **v1.6.0** | 2026-02 | 🔀 **工作流编排系统**、🔌 **MCP 扩展至 34+ 服务器**、⚡ **RAG 性能优化**（Web Worker + HNSW） |
| **v1.5.0** | 2026-02 | 🔌 **MCP 支持**、🔧 **插件系统**、🎤 **多模态支持** |
| **v1.4.0** | 2026-03 | 🖥️ **桌面应用打包**、🦙 **Ollama 本地模型支持**、🧠 **84+ Agents**、🎨 **13 套主题系统** |
| **v1.3.0** | 2026-02 | ⚡ vLLM 高性能推理、💾 数据持久化、📱 移动端适配 |
| **v1.2.0** | 2026-02 | 🦙 Ollama 本地模型支持 |
| **v1.1.0** | 2026-02 | 🎨 13 套主题系统 |
| **v1.0.0** | 2026-02 | 🚀 首次发布 |

---

## 🏗️ 技术栈

| 类别 | 技术 |
|------|------|
| **前端框架** | React 19 + TypeScript 5.9 |
| **构建工具** | Vite 7 |
| **样式方案** | Tailwind CSS 4 + Glassmorphism |
| **状态管理** | Zustand 5 (含 localStorage 持久化) |
| **桌面框架** | Tauri 2 (Rust) |
| **图标库** | Lucide React |
| **MCP 协议** | @modelcontextprotocol/sdk |
| **向量检索** | HNSW + Web Worker |
| **代码分割** | 路由级 + 组件级 lazy loading |

---

## 🐛 已知问题 / 限制

- 部分国内大模型 API 需要特殊网络环境
- 飞书/微信等严格反爬网站 URL 导入可能失败
- 14 个搜索引擎中部分需 API Key（Brave/Google/SearXNG）
- 浏览器自动化基于 Puppeteer，大型网站性能依赖网络

---

## 📄 开源协议

本项目基于 [MIT License](./LICENSE) 开源。

---

## 🙏 致谢

- [React](https://react.dev/) - 用户界面框架
- [Tauri](https://tauri.app/) - 跨平台桌面框架
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先 CSS 框架
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [Zustand](https://github.com/pmndrs/zustand) - 简洁的状态管理
- [Lucide](https://lucide.dev/) - 精美图标库
- [Model Context Protocol](https://modelcontextprotocol.io/) - 工具调用协议

---

<div align="center">

**如果这个项目对你有帮助，请给一个 ⭐ Star！**

Made with ❤️ by NexusAI Team

[⬆ 回到顶部](#-nexusai)

</div>
