# Cloudflare Pages 部署指南

## 🔑 获取正确的 API Token

### 方法 1: 创建新的 API Token（推荐）

1. **登录 Cloudflare Dashboard**

   访问: https://dash.cloudflare.com/profile/api-tokens

2. **创建自定义 Token**

   点击 **"Create Token"** → **"Create Custom Token"**

3. **配置权限**

   **Token name**: `Pages Deployment`

   **Permissions**:
   - Account → Cloudflare Pages → Edit
   - Zone → Zone → Read

   **Account Resources**:
   - Include → Your Account (`fe394f7c37b25babc4e351d704a6a97c`)

   **Zone Resources**:
   - Include → All zones (或选择特定域名)

4. **创建并保存 Token**

   点击 **"Continue to summary"** → **"Create Token"**

   ⚠️ **重要**: 复制显示的 token 并保存到安全位置
   - Token 格式类似: `xxxxxxxxxxx-xxxxxxxxxxxx-xxxxxxxxxxxxx`
   - Token 只显示一次，之后无法再查看

### 方法 2: 使用现有 Global API Key（不推荐）

访问: https://dash.cloudflare.com/profile/api-tokens

找到 **"Global API Key"** → 点击 **"View"** → 输入密码查看

---

## 🚀 部署选项

### 选项 A: 通过 Dashboard 部署（最简单，强烈推荐）

这是最简单且可靠的方法，无需 API token。

#### 步骤 1: 访问 Cloudflare Pages

登录: https://dash.cloudflare.com/fe394f7c37b25babc4e351d704a6a97c/pages

#### 步骤 2: 创建新项目

1. 点击 **"Create a project"**
2. 选择 **"Connect to Git"**
3. 选择 **"GitHub"**
4. 授权 Cloudflare 访问 GitHub
5. 选择仓库: `taoyadev/fingerprint-generator`

#### 步骤 3: 配置构建设置

**Project name**: `fingerprint-generator`

**Production branch**: `main`

**Framework preset**: `None`

**Build settings**:
```bash
Build command: npm install && npm run build && node dev-server.js
Build output directory: dist
Root directory: (留空)
```

**Environment variables**:
| 变量名 | 值 |
|--------|-----|
| `NODE_ENV` | `production` |
| `PORT` | `8080` |

#### 步骤 4: 开始部署

点击 **"Save and Deploy"**

等待 2-3 分钟，部署完成后会显示 URL：
```
https://fingerprint-generator.pages.dev
```

#### 步骤 5: 配置自定义域名

1. 在项目页面，点击 **"Custom domains"**
2. 点击 **"Set up a custom domain"**
3. 输入: `fingerprintgenerator.com`
4. 点击 **"Continue"**

如果域名在 Cloudflare DNS 上，会自动配置。否则需要添加 CNAME 记录：
```
fingerprintgenerator.com → fingerprint-generator.pages.dev
```

---

### 选项 B: 通过 CLI 部署（需要有效 Token）

只有在您有有效的 API Token 时才使用此方法。

#### 前置条件

确保 Token 有效：

```bash
export CLOUDFLARE_API_TOKEN="your-actual-token-here"
wrangler whoami
```

预期输出应显示账户信息。如果失败，返回选项 A。

#### 部署步骤

```bash
# 1. 进入项目目录
cd fingerprint-generator

# 2. 安装依赖
npm install

# 3. 构建项目
npm run build

# 4. 部署到 Pages（使用 wrangler）
export CLOUDFLARE_API_TOKEN="your-actual-token-here"
export CLOUDFLARE_ACCOUNT_ID="fe394f7c37b25babc4e351d704a6a97c"

# 初次部署（创建项目）
wrangler pages project create fingerprint-generator

# 部署
wrangler pages deploy dist --project-name=fingerprint-generator
```

---

## 📋 部署后验证

### 1. 检查部署状态

访问: https://dash.cloudflare.com/fe394f7c37b25babc4e351d704a6a97c/pages

找到 `fingerprint-generator` 项目，查看：
- ✅ Deployment status: Success
- ✅ Last deployed: Recent timestamp
- ✅ Production URL: Active

### 2. 测试网站

打开浏览器访问:
```
https://fingerprint-generator.pages.dev
```

或（如果配置了自定义域名）:
```
https://fingerprintgenerator.com
```

### 3. 验证端点

```bash
# Homepage
curl https://fingerprint-generator.pages.dev/

# Health check
curl https://fingerprint-generator.pages.dev/health

# Robots.txt
curl https://fingerprint-generator.pages.dev/robots.txt

# Sitemap
curl https://fingerprint-generator.pages.dev/sitemap.xml

# OG Image
curl https://fingerprint-generator.pages.dev/og-image.svg
```

预期：所有端点都应返回 200 OK。

### 4. 验证 SEO Meta Tags

在浏览器中打开网站，右键 → 查看源代码，确认：
- ✅ `<title>` 标签正确
- ✅ `<meta name="description">` 存在
- ✅ Open Graph tags 存在
- ✅ Twitter Card tags 存在
- ✅ Schema.org structured data 存在

---

## 🔧 故障排除

### 问题 1: Token 无效

**症状**: `Invalid format for Authorization header`

**解决方案**:
1. 重新创建 API Token（参见上面的步骤）
2. 确保 Token 完整，没有换行或空格
3. 使用 Dashboard 部署（选项 A），无需 Token

### 问题 2: 构建失败

**症状**: Build 阶段失败

**解决方案**:
1. 检查 `package.json` 中的 scripts
2. 确保 build command 正确：
   ```bash
   npm install && npm run build
   ```
3. 本地测试构建：
   ```bash
   npm install
   npm run build
   ```
4. 检查构建日志，查找错误信息

### 问题 3: 部署成功但网站无法访问

**症状**: Deployment 成功，但访问 URL 返回 404

**解决方案**:
1. 确认 `dist` 目录包含 `index.js` 等文件
2. 检查 build output directory 设置为 `dist`
3. 查看 Functions 日志（如果使用 Pages Functions）
4. 确认 `dev-server.js` 正确导出

### 问题 4: DNS 解析失败

**症状**: 自定义域名无法访问

**解决方案**:
1. 等待 DNS 传播（最多 24 小时）
2. 检查 DNS 记录：
   ```bash
   dig fingerprintgenerator.com
   ```
3. 确保域名 nameservers 指向 Cloudflare
4. 清除本地 DNS 缓存：
   ```bash
   # macOS
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
   ```

---

## ✅ 成功部署检查清单

完成以下所有项目确认部署成功：

- [ ] 代码推送到 GitHub (`main` 分支)
- [ ] Cloudflare Pages 项目已创建
- [ ] GitHub 仓库已连接
- [ ] 构建配置正确
- [ ] 环境变量已设置
- [ ] 部署成功（Deployment status: Success）
- [ ] Production URL 可访问
- [ ] 所有 API 端点响应正常
- [ ] SEO meta tags 正确显示
- [ ] 自定义域名已配置（可选）
- [ ] HTTPS 已启用
- [ ] Sitemap 已提交到搜索引擎

---

## 📞 获取帮助

如果遇到问题：

1. **Cloudflare Dashboard**: https://dash.cloudflare.com/fe394f7c37b25babc4e351d704a6a97c
2. **Cloudflare Docs**: https://developers.cloudflare.com/pages/
3. **Cloudflare Community**: https://community.cloudflare.com/
4. **GitHub Issues**: https://github.com/taoyadev/fingerprint-generator/issues

---

## 🎯 推荐路径

**对于首次部署，强烈推荐使用「选项 A: 通过 Dashboard 部署」**

优势：
- ✅ 无需处理 API tokens
- ✅ 图形界面，直观易懂
- ✅ 自动持续部署（推送即部署）
- ✅ 内置预览环境（PR 自动部署）
- ✅ 详细的构建日志
- ✅ 一键回滚

**预计时间**: 5-10 分钟即可完成首次部署

开始部署: https://dash.cloudflare.com/fe394f7c37b25babc4e351d704a6a97c/pages
