# 🚀 COMPLETE GOOGLE CALENDAR CONNECTION GUIDE

## Follow These Steps EXACTLY (Screenshots Included)

---

## ✅ STEP 1: Open Google Cloud Console

**Click this link:** https://console.cloud.google.com/

You should see something like this:
```
┌─────────────────────────────────────────────┐
│  Google Cloud Platform                      │
├─────────────────────────────────────────────┤
│  Select a project  ▼                        │
│                                             │
│  [+ CREATE PROJECT]                         │
└─────────────────────────────────────────────┘
```

**What to do:**
- Click "Select a project" dropdown
- Find and select **"ai-dashboard-project"**
- If you don't see it, create a new project with that name

---

## ✅ STEP 2: Enable Google Calendar API

**Navigate to:** APIs & Services → Library

```
Left Sidebar Menu:
├── Dashboard
├── Credentials
├── OAuth consent screen  ← We'll use this later
├── Library               ← CLICK THIS
└── Enabled APIs & services
```

**What to do:**
1. Click **"Library"** in the left menu
2. Search for: **"Google Calendar API"**
3. Click on it
4. Press **"ENABLE"** button

You should see:
```
┌─────────────────────────────────────┐
│  Google Calendar API                │
│                                     │
│  [✓] API is enabled                 │
│                                     │
└─────────────────────────────────────┘
```

---

## ✅ STEP 3: Configure OAuth Consent Screen

**Navigate to:** APIs & Services → OAuth consent screen

**If this is your first time:**

### 3A: Choose User Type
```
┌─────────────────────────────────────┐
│  OAuth consent screen               │
│                                     │
│  ○ External (any Google user)      │
│  ● Internal (organization only)    │
│                                     │
│  [SELECT]                           │
└─────────────────────────────────────┘
```

**What to do:**
- Select **"External"** 
- Click **"CREATE"**

### 3B: Fill App Information

**Form fields:**
```
App name: AI Dashboard
User support email: shivamdhankani9@gmail.com
App logo: (optional - skip)
Application home page: http://localhost:8000/
Authorized domains: (leave blank)
Developer contact email: shivamdhankani9@gmail.com
```

**What to do:**
1. Fill in all the fields above
2. Click **"SAVE AND CONTINUE"**

### 3C: Scopes (SKIP)

**What to do:**
- Just click **"SAVE AND CONTINUE"** (no changes needed)

### 3D: Test Users (IMPORTANT!)

**This is where you add yourself:**

```
┌─────────────────────────────────────┐
│  Test users                         │
│                                     │
│  [+ ADD USERS]                      │
│                                     │
│  Current test users:                │
│  • shivamdhankani9@gmail.com       │
│                                     │
└─────────────────────────────────────┘
```

**What to do:**
1. Click **"+ ADD USERS"**
2. Type: `shivamdhankani9@gmail.com`
3. Click **"ADD"**
4. Click **"SAVE AND CONTINUE"**

### 3E: Summary

**What to do:**
- Click **"BACK TO DASHBOARD"**

---

## ✅ STEP 4: Create OAuth Credentials

**Navigate to:** APIs & Services → Credentials

### 4A: Create OAuth Client ID

```
┌─────────────────────────────────────┐
│  Credentials                        │
│                                     │
│  [+ CREATE CREDENTIALS ▼]          │
│                                     │
│  OAuth client ID                    │
└─────────────────────────────────────┘
```

**What to do:**
1. Click **"+ CREATE CREDENTIALS"**
2. Select **"OAuth client ID"**

### 4B: Configure OAuth Client

**Fill the form:**
```
Application type: Web application
Name: AI Dashboard Web Client

Authorized JavaScript origins:
• http://localhost:8000

Authorized redirect URIs:
• http://localhost:8000/calendar/google/callback/
```

**⚠️ CRITICAL:** The redirect URI MUST end with `/` (trailing slash)!

**What to do:**
1. Select "Web application"
2. Add the JavaScript origin
3. Add the redirect URI (with trailing slash!)
4. Click **"CREATE"**

### 4C: Copy Your Credentials

After creating, you'll see a popup:

```
┌─────────────────────────────────────┐
│  OAuth client created               │
│                                     │
│  Client ID:                         │
│  878019584135-xxx.apps.googleuser...│
│                                     │
│  Client Secret:                     │
│  GOCSPX-xxxxxxxxxxxx               │
│                                     │
│  [DOWNLOAD JSON] [OK]              │
└─────────────────────────────────────┘
```

**What to do:**
- Copy the **Client ID**
- Copy the **Client Secret**
- Click **"OK"**

---

## ✅ STEP 5: Update Django Settings

Your `.env` file should already have these values, but verify:

**Open:** `d:\ai-agents-platform\ai-agents-platform\.env`

It should look like this:
```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_PROJECT_ID=ai-dashboard-project
GOOGLE_REDIRECT_URI=http://localhost:8000/calendar/google/callback/
```

**✅ Your credentials are already configured!** No changes needed.

---

## ✅ STEP 6: PUBLISH THE APP (RECOMMENDED)

**This removes all access restrictions!**

**Navigate to:** APIs & Services → OAuth consent screen

At the top of the page, you'll see:

```
┌─────────────────────────────────────┐
│  Publishing status                  │
│                                     │
│  Status: Testing                    │
│                                     │
│  [PUBLISH APP] ← CLICK THIS        │
│                                     │
└─────────────────────────────────────┘
```

**What to do:**
1. Click **"PUBLISH APP"**
2. Confirm by clicking **"PUBLISH"** in the popup
3. Wait for confirmation message

Your status will change to:
```
Status: In production
```

---

## ✅ STEP 7: Test the Connection

### 7A: Restart Django Server

In your terminal:
```powershell
# Press Ctrl+C to stop the server
python manage.py runserver
```

### 7B: Login to Your Dashboard

Open: http://127.0.0.1:8000/login/

Login with your username and password.

### 7C: Go to Settings

Navigate to: http://127.0.0.1:8000/settings/

Look for **"Google Calendar Integration"** section.

### 7D: Connect Google Calendar

Click the button:
```
┌─────────────────────────────────┐
│  🔗 Connect Google Calendar     │
└─────────────────────────────────┘
```

### 7E: Authorize with Google

You'll be redirected to Google's page:

```
┌─────────────────────────────────────┐
│  Sign in to continue to            │
│  AI Dashboard                       │
│                                     │
│  Choose an account:                │
│  ○ shivamdhankani9@gmail.com       │
│                                     │
└─────────────────────────────────────┘
```

**What to do:**
1. Select your Gmail account
2. Review permissions
3. Click **"Allow"** or **"Continue"**

### 7F: Success! ✅

You'll be redirected back to Settings with:

```
┌─────────────────────────────────────┐
│  ✓ Google Calendar connected!      │
│                                     │
│  Connected to: shivamdhankani9@... │
│                                     │
│  [Disconnect]                       │
└─────────────────────────────────────┘
```

---

## ✅ STEP 8: Verify It Works

### Test 1: View Calendar

Go to: http://127.0.0.1:8000/calendar/

You should see your Google Calendar events displayed!

### Test 2: Create Event

1. Click **"Add Event"**
2. Fill in details
3. Save it
4. Check your actual Google Calendar app - the event should appear there too!

---

## 🎯 QUICK CHECKLIST

Before you start, make sure you have:

- [ ] Google Cloud project created (ai-dashboard-project)
- [ ] Google Calendar API enabled
- [ ] OAuth consent screen configured
- [ ] Test users added (or app published)
- [ ] OAuth credentials created
- [ ] Redirect URI matches exactly (with trailing /)
- [ ] .env file has correct credentials
- [ ] Django server restarted

---

## ❓ TROUBLESHOOTING

### Error: "redirect_uri_mismatch"

**Solution:** Check that your redirect URI in Google Cloud Console EXACTLY matches:
```
http://localhost:8000/calendar/google/callback/
```
(including the trailing `/`)

### Error: "access_denied" or "not a tester"

**Solution:** Either:
1. Add your Gmail as a test user (Step 3D), OR
2. Publish the app (Step 6) ← RECOMMENDED

### Error: "invalid_client"

**Solution:** Double-check your Client ID and Secret in `.env` file match what you copied from Google Cloud.

### Nothing happens when I click "Connect"

**Solution:**
1. Check browser console for errors (F12)
2. Check Django terminal for error messages
3. Verify you're logged in to Django

---

## 🎉 SUCCESS INDICATORS

You know it's working when you see:

✅ Green checkmark in Settings  
✅ Your Gmail email displayed  
✅ "Connected to: your-email@gmail.com"  
✅ Events showing on Calendar page  
✅ Can create events that sync to Google  

---

## 📞 NEED HELP?

If you get stuck at any step:

1. **Take a screenshot** of the error/page
2. **Check Django console** for error messages
3. **Verify all settings** match exactly
4. **Clear browser cache** and try again

---

## 🚀 ALTERNATIVE: FASTEST PATH

If you want the QUICKEST solution:

1. **Enable Google Calendar API** (Step 2)
2. **Create OAuth Credentials** (Step 4)
3. **Publish the app** (Step 6)
4. **Test connection** (Step 7)

That's it! Publishing removes all access issues.

---

**Ready?** Start with Step 1 and follow along! 🎊
