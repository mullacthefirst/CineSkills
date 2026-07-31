# 🌐 Free Web Hosting & Classroom Deployment Guide — CineSkills

Publish CineSkills to a free public URL so 20+ students can open it on their phones, tablets, or school PCs without downloading code files or installing local web servers.

---

## Option 1: Free Hosting via GitHub Pages (Recommended)

### Step 1: Create a GitHub Repository
1. Create a free account at [github.com](https://github.com) (if you don't already have one).
2. Click **New Repository** and name it `cineskills`.
3. Choose **Public** and click **Create repository**.

### Step 2: Upload Application Files
1. Open the repository on GitHub and click **Add file** -> **Upload files**.
2. Drag and drop all files from your local [`App`](file:///g:/My%20Drive/Obsidian%20Vault/02_Creative%20Media%20Production/04_CineSkills/App) directory into the GitHub upload area:
   - `index.html`
   - `style.css`
   - `data.js`
   - `cineskills_db.json`
   - `manifest.json`
   - `sw.js`
   - `icons/` folder (`icon-192.png`, `icon-512.png`)
   - `js/` folder (`app.js`, `state.js`, `matrix.js`, `profile.js`, `charts.js`, `gear.js`, `quests.js`, `sync.js`)
3. Click **Commit changes**.

### Step 3: Enable Free GitHub Pages
1. Go to **Settings** -> **Pages** in your GitHub repository sidebar.
2. Under **Build and deployment** -> **Source**, select **Deploy from a branch**.
3. Under **Branch**, select `main` (or `master`) and click **Save**.
4. Within 1-2 minutes, GitHub will generate your free live URL:
   `https://<your-username>.github.io/cineskills`

---

## Option 2: Free Hosting via Vercel (Instant 30-Second Drag & Drop)

1. Go to [vercel.com](https://vercel.com) and create a free account.
2. Install Vercel CLI or use their web dashboard.
3. Drag the [`App`](file:///g:/My%20Drive/Obsidian%20Vault/02_Creative%20Media%20Production/04_CineSkills/App) folder onto Vercel's import screen.
4. Click **Deploy**. Vercel will instantly issue a free HTTPS URL:
   `https://cineskills.vercel.app`

---

## 📱 Classroom & On-Set Student Experience

### 1. Classroom QR Code Setup
Generate a free QR code for your live URL (e.g. using `qr-code-generator.com`) and project it on your classroom whiteboard or print it on studio door posters.

### 2. Mobile & Tablet Installation (PWA)
* **iOS (Safari):** Open the URL -> Tap the **Share** button (⬆️) -> Tap **"Add to Home Screen"**.
* **Android (Chrome):** Open the URL -> Tap **"Install App"** banner or 3 dots menu -> **"Add to Home Screen"**.
* **Windows/Mac:** Click **⚙️ Settings** -> **"📲 Install App (PWA)"**.

### 3. 100% Offline Access
Once opened, the Service Worker caches all skills, icons, and CSS locally. Students can filming in dark studio basements or remote outdoor locations with zero mobile signal and the app will open instantly from their home screen.

---

## 💾 Local Data Saving & JSON Backup System

CineSkills operates **100% locally and offline**. All student progress, notes, production projects, gear bookings, and unlocked achievements are saved directly to browser `localStorage`.

### 1. Manual Backup Export & Transfer
* Open **⚙️ Settings** -> **💾 Export Backup (JSON)** (or click **💾 Export Backup** on your Student Profile).
* Downloads a single `.json` file containing all student progress, portfolio projects, showreel links, notes, and achievements.

### 2. Restoring or Switching Devices
* On a new phone, laptop, or tablet, open **⚙️ Settings** -> **📂 Import Backup (JSON)**.
* Select the exported `.json` backup file to instantly restore all student data locally.

### 3. Educator Class Overview
* Open **⚙️ Settings** -> **👩‍🏫 Educator Class View** (Default Passcode: `1234`).
* Summarizes and ranks local student competency profiles stored on the current device.
