<div align="center">

# 🚀 NexusAI

### 智能大模型工作台 | AI Desktop Application

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Tauri](https://img.shields.io/badge/Tauri-2-FFC131?style=for-the-badge&logo=tauri&logoColor=black)](https://tauri.app/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)

<br />

**NexusAI** 是一款现代化的 AI 大模型聚合工作台，集成 9 家模型厂商、**RAG 知识库系统**、**MCP 工具服务**、**插件系统**、**多模态支持**，支持**桌面端应用打包**（Windows/macOS/Linux），采用精美的毛玻璃（Glassmorphism）UI 设计。

> 🔥 **最新更新 v1.7.0**: 新增 **对话文件夹分类**、**对话置顶**、**对话搜索**、**对话评分**、**对话导出**、**TTS语音输出**、**快捷键系统**、**对话模板**、**团队权限管理**、**主题预览**！

<br />

[✨ 功能特性](#-功能特性) •
[🚀 快速开始](#-快速开始) •
[📦 桌面应用](#-桌面应用) •
[🧠 RAG知识库](#-rag知识库系统) •
[🔀 工作流编排](#-工作流编排系统) •
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
- 🎨 **主题预览** - 切换前预览深色/浅色主题效果

### 📚 RAG 知识库系统

**完整版 v1.4.0+**：检索增强生成（RAG）解决方案

| 功能 | 描述 |
|------|------|
| 📄 **文档上传** | 支持 PDF、Word、Excel、TXT、Markdown 格式 |
| ✂️ **智能分块** | 自动文本分割，可配置块大小和重叠度 |
| 🧮 **Embedding** | 支持 OpenAI、HuggingFace、本地 Embedding 模型 |
| 🔍 **向量检索** | HNSW 向量索引，余弦相似度匹配 |
| 🏷️ **标签管理** | 知识库分类标签，支持筛选和批量操作 |
| 🔗 **多库联合** | 支持同时检索多个知识库 |
| 📊 **性能统计** | 实时显示检索耗时、Token 使用量 |
| 👁️ **文档预览** | 查看原始内容和分块详情 |
| ⚡ **性能优化** | Web Worker + HNSW 向量索引，毫秒级检索 |

### 🔀 工作流编排系统

**v1.6.0 新增**：可视化工作流编排

| 功能 | 描述 |
|------|------|
| 🎨 **可视化编辑器** | 拖拽式节点编排 |
| 🔗 **多种节点** | LLM、条件、循环、工具、RAG、Webhook、脚本等 |
| 📋 **14+ 模板** | 文档问答、内容生成、代码审查、会议总结等 |
| ▶️ **一键运行** | 立即执行工作流 |
| 📊 **执行日志** | 实时查看运行状态和输出 |

**内置模板**：
- 文档问答助手
- 智能客服分流
- 内容生成器
- 代码审查助手
- 文档数据提取
- 会议总结助手
- 多知识库问答
- 单元测试生成
- API 文档生成

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

**可用 Hooks**：
- `before-message-send` / `after-message-receive`
- `on-conversation-start` / `on-conversation-end`
- `on-plugin-load` / `on-plugin-unload`
- `on-theme-change` / `on-settings-change`

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

### 🤖 智能 Agents

内置 **8 个专业 AI Agent**：

| Agent | 描述 | 类别 |
|-------|------|------|
| ✍️ 创意写作助手 | 文章、故事、广告文案创作 | 创意 |
| 💻 代码专家 | 全栈开发、代码审查与重构 | 技术 |
| 📊 数据分析师 | 数据可视化与统计分析 | 分析 |
| 🌍 多语言翻译 | 专业文档和实时翻译 | 语言 |
| 📋 产品经理 | PRD撰写、需求分析、产品规划 | 产品 |
| ⚖️ 法律顾问 | 合同审查、法规解读 | 专业 |
| 🎨 UI/UX 设计师 | 界面设计建议与设计系统 | 设计 |
| 🔬 学术研究 | 论文分析、文献综述 | 学术 |

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

---

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Rust** >= 1.70.0 (桌面应用打包需要)

### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/your-username/nexusai.git
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

---

## 📦 桌面应用

访问 [Releases](https://github.com/your-username/nexusai/releases) 下载最新版本。

---

## 🧠 RAG 知识库系统

### 使用步骤

1. **创建知识库**: 知识库页面 → 新建知识库 → 输入名称/描述/标签
2. **上传文档**: 支持 PDF、Word、Excel、TXT、Markdown
3. **配置 Embedding**: 选择 OpenAI/HuggingFace/本地模型
4. **使用知识库**: 单库检索或多库联合检索
5. **查看结果**: 展开「检索来源」查看相似度和性能统计

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

## 📜 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| **v1.7.0** | 2026-02 | 📁 **对话文件夹分类**、📌 **对话置顶**、🔎 **对话搜索**、👍👎 **对话评分**、📤 **对话导出**、🔊 **TTS语音输出**、⌨️ **快捷键系统**、📋 **对话模板**、👥 **团队权限管理**、🎨 **主题预览** |
| **v1.6.0** | 2026-02 | 🔀 **工作流编排系统**、🔌 **MCP 扩展至 34+ 服务器**、⚡ **RAG 性能优化**（Web Worker + HNSW） |
| **v1.5.0** | 2026-02 | 🔌 **MCP 支持**、🔧 **插件系统**、🎤 **多模态支持** |
| **v1.4.0** | 2026-02 | 📚 **RAG 知识库系统**、🖥️ **桌面应用打包**、🧠 **65+ 最新模型** |
| **v1.3.0** | 2026-02 | ⚡ vLLM 高性能推理、💾 数据持久化、📱 移动端适配 |
| **v1.2.0** | 2026-02 | 🦙 Ollama 本地模型支持 |
| **v1.1.0** | 2026-02 | 🎨 13 套主题系统 |
| **v1.0.0** | 2026-02 | 🚀 首次发布 |

---

## 📄 开源协议

本项目基于 [MIT License](./LICENSE) 开源。

<div align="center">

**如果这个项目对你有帮助，请给一个 ⭐ Star！**

Made with ❤️ by NexusAI Team

</div>
