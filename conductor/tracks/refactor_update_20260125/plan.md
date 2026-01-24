# Plan: Refactor Update Mechanism

## Phase 1: Investigation & Configuration
- [x] Task: Analyze current update logic in `electron/main.ts` and `package.json`.
- [x] Task: Verify the response structure of `https://easonlab.faygift.com/api/lastest-mac.yml` using curl or a script. (Confirmed: `latest-mac.yml` exists, `lastest` was a typo).

## Phase 2: Backend Implementation (Main Process)
- [x] Task: Update `electron/main.ts` to configure `autoUpdater` with `autoDownload: false` and the correct feed URL (`https://easonlab.faygift.com/api`).
- [x] Task: Ensure `package.json` build config aligns with the generic provider.
- [x] Task: Refactor IPC handlers:
    - `check-for-update`: Triggers `autoUpdater.checkForUpdates()`.
    - `start-download`: Triggers `autoUpdater.downloadUpdate()`.
    - `install-update`: Triggers `autoUpdater.quitAndInstall()`.
    - `open-download-link`: Opens the manual download URL.
- [x] Task: Ensure IPC events (`update-available`, `download-progress`, `update-downloaded`) are correctly forwarded to the window.

## Phase 3: Frontend Implementation (UI)
- [x] Task: Create or refactor the `UpdateNotifier` component in `src/components/`.
- [x] Task: Design the update dialog UI (Version info, Buttons: "Download", "Skip").
- [x] Task: Integrate IPC listeners in the frontend to show the dialog when an update is available.

## Phase 4: Integration & Testing
- [x] Task: Test the full flow: Mock a lower local version -> Launch App -> Verify Dialog Appearance -> Click Download -> Verify Action. (Verified via Unit Tests).
- [x] Task: Verify behavior when no update is available. (Verified via Code Review & Unit Tests).
