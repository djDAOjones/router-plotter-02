# GitHub Pages Setup

## Enable GitHub Pages for this Repository

1. Go to repository settings: <https://github.com/djDAOjones/router-plotter-02/settings/pages>

2. Under "Build and deployment":
   - **Source**: Deploy from a branch
   - **Branch**: `main`
   - **Folder**: `/ (root)`

3. Click **Save**

4. Wait 1-2 minutes for deployment

5. Access your site at: <https://djdaojones.github.io/router-plotter-02/>

## Files Structure

The v3 implementation is now in the root:
- `index.html` - Main HTML file
- `styles/main.css` - Stylesheet
- `src/main.js` - JavaScript application

GitHub Pages will automatically serve `index.html` from the root.

## Updating the Site

Any changes pushed to the `main` branch will automatically rebuild and deploy:

```bash
git add -A
git commit -m "your changes"
git push
```

Wait 1-2 minutes and refresh the GitHub Pages URL.
