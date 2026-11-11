# TZ Studio: official website (Thamizhans TZ Studios)

Short films, song remakes and movie remakes.
Runs fully on Vercel: the website, the API and the database. Nothing else to sign up for.

## What is inside
- `index.html`: the whole website
- `api/`: the server code (logins, saving videos, view counts, admins)
- `vercel.json`, `package.json`: Vercel settings
- `.env.example`: the settings you add in Vercel

## Setup (about 10 minutes)

### 1. Put it on GitHub
Create a new repository. Upload everything from this folder, **including the `api` folder**,
to the top level of the repository (not inside another folder).

### 2. Create the project on Vercel
1. vercel.com, Add New, Project, import your GitHub repository.
2. Framework Preset: **Other**. Leave Build Command and Output Directory empty.
3. Click Deploy. (The site opens, but videos are not saved until step 3 and 4 are done.)

### 3. Add the database (Vercel)
1. Open your project, then the **Storage** tab (or Marketplace).
2. Choose **Upstash for Redis**, pick the free plan, create it.
3. Connect it to your project for all environments.
   This adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically.

### 4. Add the two secret settings (Vercel)
Project, Settings, Environment Variables. Add:
- `AUTH_SECRET`: any long random text (16+ characters)
- `OWNER_PASSWORD`: the password you will use for the owner account

Then open Deployments and **Redeploy** the latest one (settings only apply after a redeploy).

### 5. First sign in
Open your site, click **Sign in**, and use:
- Email: `satheeshsai73@gmail.com`
- Password: the `OWNER_PASSWORD` you set

The **Admin** tab now appears. Add videos, series and branding there.

## Accounts and admins
- Visitors can create a normal account (email and password). Normal accounts see no admin tab.
- Only the owner can add admins: Admin, **Admins** tab, enter the new admin's email and a temporary
  password, and give those to them.
- Owner and admin emails cannot be claimed through sign-up.
- Admins can manage videos, series and branding. Only the owner manages the admin list.

## Good to know
- Video thumbnails come from YouTube automatically when you paste a YouTube link.
- Audience views are counted for all visitors, once per visitor per session.
- Automatic YouTube view counts: add a YouTube Data API key in Admin, Branding.
  Restrict the key to your site address in Google Cloud, because it is visible in the page.
- All site content must stay under about 900 KB, so use custom images sparingly.
- Sign-up does not verify email addresses. Normal accounts have no special powers.
- Edit `index.html` on GitHub to change the design or text. Vercel redeploys on its own.
  Your videos and accounts live in the database, so redeploying never erases them.

## If something does not work
- "Admins only" after signing in as owner: check `OWNER_PASSWORD` and `AUTH_SECRET`, then redeploy.
- Videos not saving: check the Storage tab shows the database connected to this project.
- Run a quick check by opening `https://YOUR-SITE/api/site`. It should show `{"data":null,"views":{}}` or your data.
