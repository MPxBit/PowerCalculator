# Azure Deployment Guide

## Deployment Steps

### 1. Build the Application
```bash
npm run build
```

### 2. Deploy to Azure App Service

#### Option A: Using Azure CLI
```bash
# Install Azure CLI if not already installed
# Login to Azure
az login

# Create a resource group (if needed)
az group create --name your-resource-group --location eastus

# Create an App Service plan
az appservice plan create --name your-app-service-plan --resource-group your-resource-group --sku B1 --is-linux

# Create the web app
az webapp create --resource-group your-resource-group --plan your-app-service-plan --name your-app-name --runtime "NODE:18-lts"

# Configure the app
az webapp config appsettings set --resource-group your-resource-group --name your-app-name --settings SCM_DO_BUILD_DURING_DEPLOYMENT=true

# Deploy from local git
az webapp deployment source config-local-git --resource-group your-resource-group --name your-app-name
```

#### Option B: Using Azure Portal
1. Go to Azure Portal
2. Create a new Web App
3. Choose:
   - Runtime stack: Node.js 18 LTS
   - Operating System: Linux (recommended) or Windows
4. Configure Deployment Center to connect to your GitHub repository
5. Set build configuration:
   - Build command: `npm run build`
   - Output directory: `.next`

### 3. Application Settings

In Azure Portal, go to Configuration → Application Settings and add:

- `NODE_ENV`: `production`
- `PORT`: `8080` (or let Azure assign it)

### 4. Access Your App

Your app will be available at:
- `https://your-app-name.azurewebsites.net`

### 5. Troubleshooting

#### App Not Loading
1. Check the logs in Azure Portal: Monitoring → Log stream
2. Verify the build completed successfully
3. Check that `npm run build` runs without errors
4. Ensure the start script is correct

#### Common Issues

**Issue: 404 errors**
- Make sure `next.config.js` is configured correctly
- Verify the build output directory

**Issue: Port binding errors**
- Azure App Service uses the `PORT` environment variable
- The start script should use: `next start -p ${PORT:-3000}`

**Issue: Static files not loading**
- Check that `public` folder exists (if using static assets)
- Verify `next.config.js` output settings

### 6. Environment Variables

If you need environment variables, add them in:
Azure Portal → Your App → Configuration → Application Settings

### 7. Custom Domain

To use a custom domain:
1. Go to Custom domains in Azure Portal
2. Add your domain
3. Configure DNS records as instructed

## Next.js Specific Notes

- Next.js 14 uses the App Router (your app uses this)
- The app should be accessible at the root URL: `https://your-app-name.azurewebsites.net`
- All routes defined in the `app` directory will work automatically
- No specific URL path needed - the root URL should work

## Build Configuration

The app uses:
- Next.js 14
- React 18
- App Router (app directory structure)

Make sure Azure is configured to:
- Run `npm install` (or `npm ci` for production)
- Run `npm run build`
- Run `npm start` to start the server

