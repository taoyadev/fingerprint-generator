# Quick Deploy Guide - Cloudflare Pages

## ✅ Authentication Verified

Account: `kimamezozo29982@gmail.com`
Account ID: `2e2c58bba0e280e136a0a1940e7096d2`

## 🚀 Option 1: Deploy via Cloudflare Dashboard (Recommended)

### Step 1: Go to Cloudflare Pages

Visit: https://dash.cloudflare.com/2e2c58bba0e280e136a0a1940e7096d2/pages

### Step 2: Connect GitHub Repository

1. Click **"Create a project"** or **"Connect to Git"**
2. Click **"Connect GitHub"**
3. Authorize Cloudflare to access your GitHub
4. Select repository: **`taoyadev/fingerprint-generator`**
5. Click **"Begin setup"**

### Step 3: Configure Build Settings

**Project name:** `fingerprint-generator`

**Production branch:** `main`

**Build settings:**
- **Framework preset:** None
- **Build command:** `npm install && npm run build`
- **Build output directory:** `dist`
- **Root directory:** (leave empty)

### Step 4: Environment Variables

Add these environment variables:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `8080` |

### Step 5: Deploy

Click **"Save and Deploy"**

Deployment time: ~2-3 minutes

**Deployment URL:** `https://fingerprint-generator.pages.dev`

---

## 🔧 Option 2: Deploy via Command Line

### Requirements

This project uses a Node.js HTTP server which requires Cloudflare Workers, not Pages.

### Convert to Cloudflare Workers

**Step 1: Install dependencies**

```bash
npm install -D @cloudflare/workers-types
```

**Step 2: Update wrangler.toml**

```toml
name = "fingerprint-generator"
main = "dist/worker.js"
compatibility_date = "2024-11-07"
account_id = "2e2c58bba0e280e136a0a1940e7096d2"

[env.production]
name = "fingerprint-generator"
route = "fingerprintgenerator.com/*"
```

**Step 3: Create Worker adapter**

Create `src/worker.ts`:

```typescript
import { FingerprintGenerator } from './index';

const generator = new FingerprintGenerator();

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ ok: true }), { headers });
    }

    // Generate fingerprint
    if (url.pathname === '/api/generate' && request.method === 'POST') {
      try {
        const body = await request.json();
        const result = await generator.generate(body);
        return new Response(JSON.stringify(result), { headers });
      } catch (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers }
        );
      }
    }

    // Serve static HTML for root
    if (url.pathname === '/') {
      return new Response(htmlContent, {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    return new Response('Not found', { status: 404 });
  },
};

const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Fingerprint Generator</title>
</head>
<body>
  <h1>Fingerprint Generator API</h1>
  <p>Use POST /api/generate to generate fingerprints</p>
</body>
</html>`;
```

**Step 4: Build and Deploy**

```bash
# Build
npm run build

# Deploy to Cloudflare Workers
export CLOUDFLARE_API_TOKEN="U3boE5x0eh4FK0OTss_o4Q8LsVQVH9OTpSzAfjj3"
wrangler deploy
```

---

## ⚡ Option 3: Quick Static Deployment (Simplified)

For a quick deployment without server-side logic:

### Step 1: Create static HTML

Create `public/index.html` with the content from `dev-server.js`

### Step 2: Deploy to Pages

```bash
export CLOUDFLARE_API_TOKEN="U3boE5x0eh4FK0OTss_o4Q8LsVQVH9OTpSzAfjj3"
wrangler pages deploy public --project-name=fingerprint-generator
```

---

## 📋 Post-Deployment Checklist

After deployment completes:

### 1. Verify Deployment

Visit: `https://fingerprint-generator.pages.dev` or `https://fingerprintgenerator.com`

Expected: Homepage loads with SEO meta tags

### 2. Test Endpoints

```bash
# Health check
curl https://fingerprint-generator.pages.dev/health

# Robots.txt
curl https://fingerprint-generator.pages.dev/robots.txt

# Sitemap
curl https://fingerprint-generator.pages.dev/sitemap.xml
```

### 3. Configure Custom Domain

1. Go to **Custom domains** in Cloudflare Pages
2. Add `fingerprintgenerator.com`
3. Cloudflare will auto-configure DNS (if domain is on Cloudflare)

### 4. Enable HTTPS

1. Go to **SSL/TLS** → **Overview**
2. Set to **Full (strict)**
3. Enable **Always Use HTTPS**

### 5. Submit Sitemap

**Google Search Console:**
```
https://search.google.com/search-console
```

Submit: `https://fingerprintgenerator.com/sitemap.xml`

**Bing Webmaster Tools:**
```
https://www.bing.com/webmasters
```

Submit: `https://fingerprintgenerator.com/sitemap.xml`

---

## 🔥 Recommended: Use Dashboard (Option 1)

For this Node.js application, **Option 1 (Dashboard)** is **strongly recommended** because:

✅ Automatic builds on every git push
✅ Built-in preview deployments for PRs
✅ Easier to configure environment variables
✅ Better integration with GitHub
✅ Automatic HTTPS and CDN

**Time to deploy:** ~5 minutes (including GitHub connection)

---

## 🆘 Need Help?

- **Cloudflare Dashboard:** https://dash.cloudflare.com/2e2c58bba0e280e136a0a1940e7096d2
- **GitHub Repo:** https://github.com/taoyadev/fingerprint-generator
- **Support:** Open an issue on GitHub

---

**Current Status:**
- ✅ Code pushed to GitHub
- ✅ Cloudflare authentication verified
- ⏳ Waiting for deployment configuration
