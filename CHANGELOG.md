# Changelog

All notable changes to this project will be documented in this file.

## [v0.1.5] - 2026-01-15

### ✨ Features (新特性)
*   **启动优化**: 软件启动时默认自动开启桌面歌词，无需手动开启。

### 💄 UI/UX (体验优化)
*   **macOS 托盘优化**: 为菜单栏图标启用了模板模式 (`Template Image`)，完美适配系统深色/浅色模式切换。
*   **标题显示**: 优化了 macOS 菜单栏歌词标题的截断长度，视觉上更加整洁。

### 🐞 Bug Fixes (修复)
*   **语法修复**: 修复了 `electron/main.ts` 中 `window-all-closed` 事件处理器的语法错误导致的编译失败。
*   **稳定性**: 完善了 `before-quit` 事件处理，确保程序退出时能够彻底销毁所有窗口进程。

## [v0.1.0] - 2026-01-13

### 🎉 Initial Release

**Eason Moment** 的首个公开预览版本，带来了跨平台的沉浸式歌词体验。

### ✨ Features (新特性)

*   **多平台支持**: 完美适配 macOS (Hidden Inset Titlebar) 和 Windows (Custom Frameless Window)。
*   **海报工坊**:
    *   内置 3 款主题：经典沉浸、文艺拍立得、电影故事。
    *   支持**本地图片上传**与交互式布局（拖拽、缩放）。
    *   支持导出高清 PNG，提供旋转/脉动加载特效。
    *   排版参数（字号/行距）与图片位置支持**独立重置**。
*   **智能托盘**:
    *   **macOS**: 顶部菜单栏显示歌词摘要。
    *   **心情模式**: 6 大分类（含新增的 **💕 爱与浪漫**），智能聚合 20+ 种标签。
    *   **轮播控制**: 支持自定义轮播间隔（1分钟 - 1小时）。
*   **桌面歌词 (Desktop Lyric)**:
    *   Windows 专属的透明悬浮窗。
    *   支持全窗口拖拽。
    *   支持**自定义文字颜色**，并提供系统级取色器。
    *   主界面与悬浮窗样式实时同步。

### 💄 UI/UX (体验优化)

*   **沉浸式设计**: 采用 Space Gray 深空灰背景与毛玻璃特效。
*   **品牌化**: 统一使用 "Eason Moment" 品牌落款。
*   **交互**: 优化了状态栏显示逻辑，避免文字过长；增加了导出时的仪式感动画。

### 🔧 Engineering (工程化)

*   集成 **GitHub Actions** 自动构建工作流 (macOS + Windows)。
*   配置 Prettier 代码格式化规范。
*   优化 Vite 构建配置，解决生产环境资源路径 (`file://`) 加载白屏问题。
