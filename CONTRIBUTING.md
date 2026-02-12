# 🤝 Contributing — NexusAI 贡献指南

感谢你对 NexusAI 的关注！欢迎提交 Issue 和 Pull Request。

---

## 📁 项目结构

```
src/
├── main.tsx              # 应用入口
├── App.tsx               # 根组件（ThemeProvider + 路由 + GlowOrbs）
├── index.css             # 全局样式 + 13 套主题 CSS 变量
├── store.ts              # Zustand 状态管理（认证/对话/模型/主题等）
├── utils/
│   └── cn.ts             # className 合并工具
└── components/
    ├── AuthPage.tsx       # 登录/注册页
    ├── Sidebar.tsx        # 侧边栏导航 + 对话历史
    ├── ChatPage.tsx       # 对话页面 + Markdown 渲染
    ├── AgentsPage.tsx     # AI Agents 页面
    ├── SkillsPage.tsx     # Skills 技能管理页
    ├── ModelsPage.tsx     # 模型市场 + Ollama 本地部署
    └── SettingsPage.tsx   # 设置（主题/账号/偏好）
```

## 🎨 添加新主题

1. **定义 CSS 变量** — 在 `src/index.css` 中添加 `[data-theme="your-theme"]` 块
2. **注册主题配置** — 在 `src/store.ts` 的 `themeConfigs` 数组中添加配置项
3. **更新类型** — 在 `ThemeId` 类型联合中添加新 ID
4. **浅色主题** — 如果是浅色主题，ID 需以 `light-` 开头，并在 CSS 中添加相应的选择器

### CSS 变量参考（每个主题需要定义）

| 变量 | 用途 |
|------|------|
| `--t-bg` | 页面背景渐变 |
| `--t-orb1~4` | 光晕球体颜色 |
| `--t-accent` | 主强调色 |
| `--t-accent-light` | 浅强调色 |
| `--t-glass-*` | 毛玻璃效果 |
| `--t-text` / `--t-text-secondary` / `--t-text-muted` | 文字颜色 |
| `--t-code-bg` / `--t-code-text` | 代码块样式 |
| `--t-user-msg-from` / `--t-user-msg-to` | 用户消息气泡渐变 |

## 🧠 添加新模型厂商

1. 在 `src/store.ts` 的 `modelProviders` 数组中添加新厂商对象
2. 如果有特殊 UI 需求，在 `ModelsPage.tsx` 中添加专属组件（参考 `OllamaSection`）

## 🤖 添加新 Agent

在 `src/store.ts` 的 `defaultAgents` 数组中添加新 Agent 对象：

```ts
{
  id: 'unique-id',
  name: '名称',
  description: '描述',
  icon: '🎯',
  systemPrompt: '系统提示词',
  skills: ['skill-id-1', 'skill-id-2'],
  category: '分类',
  color: '#hex',
}
```

## 🔧 开发命令

```bash
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run preview  # 预览构建结果
```
