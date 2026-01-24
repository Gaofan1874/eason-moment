# Specification: Refactor Update Mechanism

## 1. Goal
重构应用的自动更新机制，使用指定的 API 接口检测新版本，并提供友好的 UI 供用户选择更新或跳过。

## 2. API Endpoints
- **Version Check (macOS)**: `https://easonlab.faygift.com/api/latest-mac.yml`
    - **Method**: GET
    - **Expected Response**: Standard Electron-Updater YAML containing version and relative path to DMG.
- **Download (macOS)**: `https://easonlab.faygift.com/api/download/mac` (Direct DMG download) or via the relative path in YAML.

## 3. Functional Requirements
### 3.1 Version Check Logic
- App launch or manual trigger.
- Use `electron-updater` with `autoDownload: false` to check `https://easonlab.faygift.com/api/latest-mac.yml`.
- **Condition**: If update available, show dialog.

### 3.2 User Interface (Update Dialog)
- **Component**: New/Refactored `UpdateNotifier`.
- **Content**: Version number, Release Notes (if available in YAML).
- **Actions**:
    - **Update Now**: Trigger `autoUpdater.downloadUpdate()`. Show progress.
    - **Download Manually**: Open `https://easonlab.faygift.com/api/download/mac` in browser.
    - **Skip**: Close dialog.

### 3.3 Electron Main Process
- 主进程负责实际的 HTTP 请求和版本对比逻辑（推荐），通过 IPC 将结果发送给渲染进程。
- 或者使用 `electron-updater` 库配置 Generic Provider 指向该 URL。

## 4. Technical Approach
- **Library**: 优先复用或配置 `electron-updater`，因为 `package.json` 中已包含该依赖。
- **Configuration**: 修改 `electron-builder` 配置或主进程中的 `autoUpdater` 配置，使其指向 generic provider URL。

## 5. Constraints
- 必须兼容 macOS (主要) 和 Windows (次要，如果 API 支持)。
- 遵循现有的 UI 风格（毛玻璃、圆角）。
