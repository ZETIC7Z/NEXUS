# NEXUS - Stream Movies & TV Shows

**NEXUS** is a modern streaming platform built with React, TypeScript, and Vite. Stream movies, TV shows, and anime in high quality with support for multiple providers and custom tokens.

## 🚀 Features

- **Multi-Provider Support**: Integrates with multiple streaming providers
- **Fembox Integration**: Custom provider with shared token fallback
- **Mobile Optimized**: Responsive design with mobile-first approach
- **PWA Support**: Install as a Progressive Web App
- **Multi-Language**: Supports 55+ languages
- **Custom Branding**: NEXUS branding throughout the application

## 📋 Prerequisites

- **Node.js** 18+ (LTS recommended)
- **pnpm** package manager
- **Vercel CLI** (for deployment)

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd "p=stream sam 12-20-25"
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Configure Environment
Edit `public/config.js` with your settings:
- TMDB API Key
- Backend URL
- Proxy URLs
- Shared Febbox Token (optional)

### 4. Run Development Server
```bash
pnpm run dev
```

The app will be available at `http://localhost:5173`

## 🏗️ Build for Production

```bash
pnpm run build
```

Build output will be in the `dist/` directory.

## 🚢 Deployment

### Deploy to Vercel
```bash
vercel --prod
```

Or use the Vercel dashboard to deploy from GitHub.

### Environment Variables (Vercel)
Set these in your Vercel project settings:
- `VITE_CORS_PROXY_URL`
- `VITE_M3U8_PROXY_URL`
- `VITE_BACKEND_URL`
- `VITE_TMDB_READ_API_KEY`
- `VITE_ALLOW_FEBBOX_KEY`
- `VITE_ALLOW_DEBRID_KEY`

## 📱 Mobile Support

### Userscript Installation
NEXUS works on mobile browsers using userscript managers:

**Chrome/Edge**: [Tampermonkey](https://www.tampermonkey.net/)
**Firefox**: [Violentmonkey](https://addons.mozilla.org/en-US/firefox/addon/violentmonkey/)
**Safari**: [Userscripts](https://apps.apple.com/app/userscripts/id1463298887)

After installing the userscript manager, click "Alternative Userscript" in the onboarding to install the NEXUS userscript.

## 🎨 Customization

### Logo
Replace `public/vivamax-logo.jpg` with your own logo.

### Branding
All "NEXUS" branding can be changed in:
- `src/assets/locales/*.json` (55 language files)
- `manifest.json` (PWA name)
- `package.json` (project name)

### Colors
Edit `src/assets/css/index.css` for theme colors.

## 📁 Project Structure

```
├── public/              # Static assets
│   ├── config.js       # Runtime configuration
│   ├── vivamax-logo.jpg # App logo
│   └── manifest.json   # PWA manifest
├── src/
│   ├── assets/         # Images, fonts, locales
│   ├── backend/        # API integrations
│   │   └── providers/  # Streaming providers
│   ├── components/     # Reusable components
│   ├── pages/          # Page components
│   ├── stores/         # State management
│   └── setup/          # App configuration
├── package.json
└── vite.config.mts     # Vite configuration
```

## 🔧 Key Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Zustand** - State management
- **@p-stream/providers** - Provider library
- **HLS.js** - Video streaming

## 🌐 Providers

### Built-in Providers
- TurboVid
- Cuevana3
- And more from `@p-stream/providers`

### Custom Providers
- **Fembox**: Uses `fembox.lordflix.club` API
  - Supports personal tokens
  - Falls back to shared token
  - Direct API calls (no proxy needed)

## 🔐 Febbox Token

Users can add their own Febbox token in Settings → Connections.

If no personal token is set, the app uses the shared token configured in `public/config.js`:
```javascript
VITE_SHARED_FEBBOX_TOKEN: "your-token-here"
```

## 🐛 Troubleshooting

### Settings Page Error
If you see routing errors, ensure `VITE_NORMAL_ROUTER: "true"` in `config.js`.

### Providers Not Working
1. Check proxy configuration in `config.js`
2. Verify backend URL is accessible
3. Check browser console for errors

### Mobile Issues
1. Install userscript manager
2. Install NEXUS userscript
3. Refresh the page

## 📝 License

This project is for educational purposes only.

## 🤝 Contributing

Contributions are welcome! Please ensure:
- Code follows existing style
- All tests pass
- Documentation is updated

## 📞 Support

For issues and questions, please open a GitHub issue.

---

**Built with ❤️ using React + Vite + TypeScript**
