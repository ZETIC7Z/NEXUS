# 🚀 GitHub Repository Setup Instructions

## Step 1: Create GitHub Repository

1. Go to [https://github.com/new](https://github.com/new)
2. Fill in the repository details:
   - **Repository name:** `NEXUS-WEBAPP`
   - **Description:** "Full-featured streaming web app with TV optimization - Stream movies, TV shows & anime"
   - **Visibility:** Choose Public or Private
   - **DON'T** initialize with README, .gitignore, or license (we already have these)
3. Click "Create repository"

## Step 2: Copy Your Repository URL

After creating, GitHub will show you a URL like:
```
https://github.com/YOUR_USERNAME/NEXUS-WEBAPP.git
```

Copy this URL!

## Step 3: Run These Commands

Open your terminal in the project directory and run:

```bash
# Add GitHub as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/NEXUS-WEBAPP.git

# Push to GitHub
git push -u origin main
```

If the default branch is "master" instead of "main", use:
```bash
git branch -M main
git push -u origin main
```

## Step 4: Verify

Go to your GitHub repository page:
```
https://github.com/YOUR_USERNAME/NEXUS-WEBAPP
```

You should see all your files uploaded!

---

## 📝 Next Steps (Optional)

### Add Topics/Tags
On your GitHub repo page, click "⚙️ Settings" → "Add topics":
- `streaming`
- `pwa`
- `react`
- `typescript`
- `vite`
- `tv-app`
- `android-tv`
- `movies`
- `anime`

### Enable GitHub Pages (Optional)
If you want to host on GitHub Pages:
1. Go to Settings → Pages
2. Source: Deploy from branch
3. Branch: Choose `main` and `/docs` or `/root`
4. Save

### Add Repository Secrets (For Vercel Deployment)
If you want GitHub Actions:
1. Go to Settings → Secrets and variables → Actions
2. Add `VERCEL_TOKEN`
3. Add `VITE_TMDB_READ_API_KEY`

---

## ⚠️ Important Notes

1. **Environment Variables:** 
   - Your `.env` file is in `.gitignore` and NOT pushed to GitHub (this is correct!)
   - Anyone cloning your repo will need to create their own `.env` file

2. **node_modules:**
   - Not pushed (in `.gitignore`)
   - Others will run `npm install` to get dependencies

3. **dist folder:**
   - Build output not pushed (in `.gitignore`)
   - Run `npm run build` to create it

---

## 🎉 Done!

Your NEXUS webapp is now on GitHub! Share the link with others so they can fork, star, or contribute!
