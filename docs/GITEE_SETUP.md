# Gitee 下载平台配置指南

本项目已配置 Gitee Pages + Gitee Releases 作为国内快速访问的下载平台。

## 📁 项目结构

```
eason-moment/
├── docs/
│   └── index.html          # Gitee Pages 下载页面
├── .gitee/
│   └── workflows/
│       └── build.yml       # Gitee Go 工作流配置
├── scripts/
│   └── upload-to-gitee.sh  # Gitee Releases 上传脚本
```

## 🚀 快速开始

### 1. 启用 Gitee Pages

1. 访问 Gitee 仓库：https://gitee.com/lin-gaofan/eason-moment
2. 点击「服务」→「Gitee Pages」
3. 选择部署分支：`main`
4. 部署目录：`docs/`
5. 点击「启动」
6. 启动成功后，访问：`https://lin-gaofan.gitee.io/eason-moment/`

### 2. 创建 Gitee Release

#### 方式一：通过 Gitee 网页操作

1. 访问 Gitee 仓库
2. 点击「发行版」→「创建发行版」
3. 输入版本号（如 `v0.1.8`）
4. 上传构建产物（`.dmg` 或 `.exe` 文件）
5. 点击「创建发行版」

#### 方式二：使用上传脚本

```bash
# 1. 构建
pnpm run build

# 2. 设置 Gitee Token
export GITEE_TOKEN="your_gitee_personal_access_token"

# 3. 上传文件到 Gitee Release
./scripts/upload-to-gitee.sh v0.1.8 dist/eason-moment-0.1.8.dmg
```

### 3. 获取 Gitee Personal Access Token

1. 访问：https://gitee.com/profile/personal_access_tokens
2. 点击「生成新令牌」
3. 勾选权限：
   - `projects`（项目权限）
   - `user_info`（用户信息）
4. 复制生成的令牌（只显示一次，请妥善保存）

## 🔄 自动化流程

### GitHub Actions → Gitee Releases

当前 GitHub Actions 配置会自动构建并上传到 GitHub Releases。如需自动上传到 Gitee，需要：

1. 在 Gitee 仓库设置中添加 `GITEE_TOKEN` Secret
2. 修改 `.github/workflows/build.yml`，添加 Gitee 上传步骤

### 手动上传流程

```bash
# 1. 创建标签
git tag v0.1.8
git push origin v0.1.8

# 2. GitHub Actions 自动构建并发布到 GitHub

# 3. 从 GitHub Actions 下载构建产物

# 4. 手动上传到 Gitee Release
./scripts/upload-to-gitee.sh v0.1.8 dist/eason-moment-0.1.8.dmg
```

## 📦 下载页面功能

下载页面 [`docs/index.html`](docs/index.html) 包含：

- ✅ macOS 和 Windows 下载入口
- ✅ 跳转到 Gitee Releases 页面
- ✅ 核心特性展示
- ✅ 响应式设计，支持移动端
- ✅ 精美的渐变背景和卡片设计

## 🔧 Gitee Go 配置

Gitee Go 工作流文件位于 [`.gitee/workflows/build.yml`](../.gitee/workflows/build.yml)

**注意**：Gitee Go 功能可能需要企业版或付费账户才能使用。如果不可用，建议：

1. 使用 GitHub Actions 构建
2. 手动下载构建产物
3. 使用 `upload-to-gitee.sh` 脚本上传到 Gitee Releases

## 📝 更新下载页面版本号

当发布新版本时，需要更新 [`docs/index.html`](docs/index.html) 中的版本号：

```html
<div class="version-badge">版本 0.1.8</div>
```

## 🌐 访问地址

- **Gitee Pages**: https://lin-gaofan.gitee.io/eason-moment/
- **Gitee Releases**: https://gitee.com/lin-gaofan/eason-moment/releases
- **Gitee 仓库**: https://gitee.com/lin-gaofan/eason-moment

## ⚠️ 注意事项

1. Gitee Pages 需要实名认证
2. Gitee Pages 静态页面有流量限制
3. Gitee Releases 文件大小限制：单文件最大 100MB
4. 建议同时使用 GitHub 和 Gitee 作为备份

## 📚 相关链接

- [Gitee Pages 官方文档](https://gitee.com/help/articles/4136)
- [Gitee API 文档](https://gitee.com/api/v5/swagger)
- [Gitee Go 官方文档](https://gitee.com/help/articles/4356)
