# 📋 Changelog — NexusAI

All notable changes to this project will be documented in this file.

---

## [1.3.0] — 2026-02-12

### ✨ Added
- **vLLM 高性能推理支持** — 10 个预置开源模型，PagedAttention 加速
- **数据持久化** — localStorage 自动保存对话历史、用户设置、主题偏好
- **响应式移动端适配** — 支持手机/平板访问，侧边栏滑动交互
- **键盘快捷键** — Ctrl+Enter 发送、Ctrl+N 新建对话、Ctrl+/ 聚焦输入等
- **Error Boundary** — 错误边界组件，防止应用崩溃白屏
- **LLM Service** — 统一的 API 服务层，支持 SSE 流式响应
- **ESLint + Prettier** — 代码规范和质量检查工具

### 🔧 Improved
- 优化 Store 架构，拆分 authStore 和 uiStore
- 增强移动端体验，支持触摸操作
- 改进动画性能，支持 prefers-reduced-motion

---

## [1.2.0] — 2026-02-11

### ✨ Added
- **Ollama 本地模型支持** — 14 个预置开源模型（Llama 3.3, Qwen 2.5, DeepSeek R1, Mistral 等）
- 本地服务器连接配置与一键测试
- 自定义模型名称输入
- 模型分类标签（通用/代码/推理/嵌入）
- VRAM 大小估算提示

## [1.1.0] — 2026-02-11

### ✨ Added
- **主题系统 v2** — 新增 5 个浅色主题
  - 薰衣草田 (light-lavender)
  - 蜜桃暖阳 (light-peach)
  - 薄荷清风 (light-mint)
  - 晴空万里 (light-sky)
  - 沙漠暮色 (light-sand)
- 主题总数达到 13 个（7 深色 + 6 浅色）

## [1.0.0] — 2026-02-10

### 🎉 Initial Release
- **智能对话** — 多轮对话、Markdown 渲染、打字动画
- **AI Agents** — 8 个专业预设 Agent
- **Skills 技能** — 12 项可配置技能
- **模型市场** — 7 大云端模型厂商（OpenAI、Anthropic、Google、Qwen、Z.AI、MiniMax、DeepSeek）
- **毛玻璃 UI** — 7 套深色主题 + 1 套浅色主题
- **用户认证** — 登录/注册/注销
- **CSS 变量系统** — 30+ 自定义属性实现主题切换
