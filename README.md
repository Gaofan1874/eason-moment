# **Eason Moment - 陪你度过漫长岁月 (Desktop App)**

> "在成人的世界里，我们都需要一点陈奕迅。"

---
**GitHub**: [Gaofan1874/eason-moment](https://github.com/Gaofan1874/eason-moment)   
**版本**: 0.1.0  
**作者**: Gaofan & Gemini

---

**Eason Moment** 是一款专为陈奕迅粉丝打造的沉浸式 macOS 桌面应用。它脱离了编辑器的束缚，以更优雅、更独立的方式，将 Eason 的歌词融入你的桌面生活。

无论是深夜工作的间隙，还是午后发呆的片刻，只需轻轻一瞥状态栏，总有一句歌词懂你。

## **✨ 核心特性 (Features)**

### **1\. 🖥️ 沉浸式海报工坊 (Immersive Poster Studio)**

全新升级的独立窗口设计，带来专业级的海报制作体验。不再受限于狭小的侧边栏，每一张海报都值得被认真对待。

*   **暗房工作台**：采用 macOS 深空灰（Space Gray）背景与点阵纹理，营造专注创作的氛围。
*   **三种独家设计风格**：
    *   **经典沉浸 (Classic)**：无遮罩全屏大图，强调通透感与文字张力，配以 `E A S O N MOMENT DAILY` 金色落款。
    *   **文艺拍立得 (Polaroid)**：白底留白，优雅的右对齐引用排版，复古胶片感，配以 `SHOT ON EASON MOMENT` 落款。
    *   **电影故事 (Cinema)**：宽画幅黑边 + 字幕特效，赋予歌词电影般的叙事感，配以 `PRESENTED BY EASON MOMENT` 落款。
*   **全能编辑体验**：
    *   **📝 智能排版**：支持**空格自动换行**逻辑，完美还原歌词韵律。
    *   **🎛️ 检查器面板**：右侧悬浮式属性栏（Inspector），直观调节主题、字号、行距及偏移量。
    *   **🖼️ 交互式布局**：支持**拖拽移动**和**滚轮缩放**图片，构图随心所欲。
*   **一键导出**：生成的精美海报可直接导出为 PNG，分享至朋友圈或作为壁纸。

### **2\. ☁️ 托盘歌词 (Tray Lyrics)**

Eason 的歌词现在驻留在你的 macOS 顶部菜单栏中。

*   **轻量陪伴**：不占用屏幕空间，也不打扰你的工作流。
*   **随机偶遇**：每隔 5 分钟自动切换一句精选歌词，每一次抬眼都是一次久违的感动。
*   **右键菜单**：随时呼出主界面，或静静退出。

### **3\. 🎨 macOS 原生质感**

*   **视觉**：毛玻璃（Blur）特效侧边栏、原生控件风格、平滑的圆角与阴影。
*   **交互**：针对 macOS 优化的窗口拖拽区域，无缝融入系统体验。

## **🚀 安装与使用 (Installation)**

### **开发环境运行**

```bash
# 1. 克隆项目
git clone https://github.com/Gaofan1874/eason-moment.git

# 2. 安装依赖 (推荐使用 npmmirror)
npm config set registry https://registry.npmmirror.com
export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
npm install

# 3. 启动应用
npm run dev
```

### **打包应用**

```bash
# 构建 macOS 应用 (.dmg)
npm run build
```

打包完成后，你可以在 `dist/` 目录下找到安装包，拖入 Applications 即可使用。

## **🛠️ 技术栈 (Tech Stack)**

*   **Core**: Electron 28 + React 18
*   **Language**: TypeScript + Vite
*   **UI/UX**: CSS Modules + Lucide Icons + Native Canvas API

## **📝 版权声明**

本应用仅作粉丝交流与学习使用，歌词版权归词作者及发行公司所有。请支持正版音乐。

**Enjoy Coding with Eason!** 🎤
