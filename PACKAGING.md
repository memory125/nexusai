# NexusAI 桌面应用打包指南

## 系统要求

### Windows
- Windows 10/11
- Microsoft Visual C++ Redistributable
- WebView2 Runtime (会自动安装)

### macOS
- macOS 10.13+ (High Sierra)
- Xcode Command Line Tools (用于签名)

### Linux
- Ubuntu 18.04+ / Debian 10+ / Fedora 35+
- 依赖：`libwebkit2gtk-4.0-37`, `libgtk-3-0`

## 安装依赖

```bash
# 确保已安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# 安装 Tauri CLI
npm install
```

## 开发模式

```bash
# 启动开发服务器
npm run tauri-dev
```

## 打包应用

### Windows (.msi 和 .exe)
```bash
npm run build:win
```
输出：`src-tauri/target/release/bundle/msi/*.msi` 和 `nsis/*.exe`

### macOS (.dmg 和 .app)
Intel 芯片:
```bash
npm run build:mac
```
Apple Silicon (M1/M2/M3):
```bash
npm run build:mac-arm
```
输出：`src-tauri/target/release/bundle/dmg/*.dmg`

### Linux (.deb, .rpm, .AppImage)
```bash
npm run build:linux
```
输出：
- `src-tauri/target/release/bundle/deb/*.deb` (Debian/Ubuntu)
- `src-tauri/target/release/bundle/rpm/*.rpm` (Fedora/openSUSE)
- `src-tauri/target/release/bundle/appimage/*.AppImage` (通用)

### 所有平台
```bash
npm run build:all
```

## 图标设置

应用图标位于 `src-tauri/icons/` 目录：
- `icon.svg` - 源文件
- `icon.png` (1024x1024) - PNG 源文件
- `icon.icns` - macOS 图标
- `icon.ico` - Windows 图标
- `32x32.png`, `128x128.png`, `128x128@2x.png` - 各种尺寸

生成图标：
```bash
npm run icon
```

## 配置说明

### 应用信息
编辑 `src-tauri/tauri.conf.json`：
- `productName` - 应用名称
- `version` - 版本号
- `identifier` - 唯一标识符
- `copyright` - 版权信息

### 窗口设置
在 `tauri.conf.json` 的 `app.windows` 中配置：
- `width/height` - 默认窗口大小
- `minWidth/minHeight` - 最小窗口尺寸
- `fullscreen` - 是否全屏启动
- `transparent` - 是否透明背景
- `decorations` - 是否显示窗口边框

### 权限配置
`tauri.conf.json` 的 `app.security.csp` 中配置网络安全策略，已预设常用 API 域名。

## 签名配置（可选）

### Windows 签名
需要代码签名证书，配置 `windows.certificateThumbprint`

### macOS 签名
需要 Apple Developer 账号，配置 `macOS.signingIdentity`

### Linux 签名
使用 GPG 密钥签名 `.deb` 和 `.rpm` 包

## 自动更新

在 `tauri.conf.json` 中配置 `plugins.updater`：

```json
{
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": ["https://api.nexusai.com/updates"],
      "dialog": true,
      "pubkey": "YOUR_PUBLIC_KEY"
    }
  }
}
```

## 常见问题

### 1. 构建失败：找不到 WebView2
Windows 会自动下载 WebView2 Bootstrapper，如果失败可手动安装：
https://developer.microsoft.com/en-us/microsoft-edge/webview2/

### 2. Linux 缺少依赖
```bash
# Ubuntu/Debian
sudo apt install libwebkit2gtk-4.0-dev libgtk-3-dev

# Fedora
sudo dnf install webkit2gtk4.0-devel gtk3-devel
```

### 3. macOS 架构选择
- Intel Mac: 使用 `x86_64-apple-darwin`
- Apple Silicon: 使用 `aarch64-apple-darwin`
- 通用二进制: 使用 `universal-apple-darwin`

### 4. 应用体积过大
在 `Cargo.toml` 中启用了 `strip = true` 和 `lto = true` 来优化体积。

## 发布检查清单

- [ ] 更新 `package.json` 中的版本号
- [ ] 更新 `src-tauri/tauri.conf.json` 中的版本号
- [ ] 更新 `src-tauri/Cargo.toml` 中的版本号
- [ ] 更新 `CHANGELOG.md`
- [ ] 测试所有功能
- [ ] 在各平台测试安装包
- [ ] 配置签名（生产环境）
- [ ] 配置自动更新（可选）

## 输出文件结构

```
src-tauri/target/release/bundle/
├── msi/
│   └── NexusAI_1.4.0_x64_en-US.msi
├── nsis/
│   └── NexusAI_1.4.0_x64-setup.exe
├── dmg/
│   └── NexusAI_1.4.0_x64.dmg
├── app/
│   └── NexusAI.app
├── deb/
│   └── nexusai_1.4.0_amd64.deb
├── rpm/
│   └── nexusai-1.4.0-1.x86_64.rpm
└── appimage/
    └── nexusai_1.4.0_amd64.AppImage
```

## 技术支持

- Tauri 文档: https://tauri.app/v1/guides/
- GitHub Issues: https://github.com/nexusai/nexusai/issues
