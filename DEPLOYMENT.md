# GitHub Pages Deployment Guide

## Quick Setup

Your app is now configured for GitHub Pages deployment. Follow these steps:

### 1. Update the Homepage URL

Edit `package.json` and replace `yourusername` with your actual GitHub username:

```json
"homepage": "https://yourusername.github.io/pdf-analyzer"
```

### 2. Create a GitHub Repository

Go to https://github.com/new and create a new repository named `pdf-analyzer`

### 3. Initialize Git and Push to GitHub

```bash
# Navigate to the project directory
cd pdf-field-visualizer

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit - PDF Field Visualizer"

# Add your GitHub repository as remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/pdf-analyzer.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### 4. Deploy to GitHub Pages

```bash
npm run deploy
```

This will:
- Build your app (`npm run build`)
- Deploy the build folder to the `gh-pages` branch
- Make your app live at `https://YOUR_USERNAME.github.io/pdf-analyzer`

### 5. Enable GitHub Pages (if needed)

1. Go to your repository on GitHub
2. Click **Settings** > **Pages**
3. Under "Source", select branch: `gh-pages` and folder: `/ (root)`
4. Click **Save**

Your app will be live in a few minutes!

## Future Deployments

Whenever you make changes:

```bash
# Make your changes
git add .
git commit -m "Description of changes"
git push

# Deploy updated version
npm run deploy
```

## Troubleshooting

### Build errors
- Run `npm run build` to test the build locally before deploying

### 404 Error
- Make sure the homepage URL in package.json matches your GitHub username and repo name
- Check that GitHub Pages is enabled in repository settings

### Changes not showing
- Clear your browser cache
- Wait a few minutes for GitHub Pages to update
- Check that the deployment completed successfully
