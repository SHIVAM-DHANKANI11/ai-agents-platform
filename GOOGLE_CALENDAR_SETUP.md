# 🔗 Connect Google Calendar to Your Gmail

## Quick Setup Guide

Your AI SaaS Dashboard already has **Google Calendar integration** built-in! Here's how to connect it to your Gmail account.

---

## 📋 Prerequisites

You need **Google Cloud Platform credentials** to enable OAuth authentication.

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"NEW PROJECT"**
3. Name it (e.g., "AI Dashboard")
4. Click **"CREATE"**

### Step 2: Enable Google Calendar API

1. In your new project, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google Calendar API"**
3. Click on it and press **"ENABLE"**

### Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** user type
3. Fill in required fields:
   - **App name**: AI Dashboard
   - **User support email**: Your email
   - **Developer contact email**: Your email
4. Click **"SAVE AND CONTINUE"**
5. Skip scopes (click **"SAVE AND CONTINUE"**)
6. Add test users if needed (or publish the app)
7. Click **"SAVE AND CONTINUE"**

### Step 4: Create OAuth Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Application type: **"Web application"**
4. Name: "AI Dashboard Web Client"
5. Under **"Authorized redirect URIs"**, add:
   ```
   http://localhost:8000/calendar/google/callback/
   ```
6. Click **"CREATE"**

### Step 5: Copy Your Credentials

After creating, you'll see a popup with:
- **Client ID** (looks like: `123456789-abc123def456.apps.googleusercontent.com`)
- **Client Secret** (looks like: `GOCSPX-abc123def456`)

**Copy both values!**

---

## 🔧 Configure Django Settings

### Option A: Using .env File (Recommended)

Open your `.env` file in the project root (`ai-agents-platform/.env`) and add:

```env
# Google Calendar API Credentials
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_PROJECT_ID=your-project-name
GOOGLE_REDIRECT_URI=http://localhost:8000/calendar/google/callback/
```

Replace the placeholder values with your actual credentials from Step 5.

### Option B: Direct Settings Edit

If you don't have a `.env` file, edit `backend/settings.py`:

```python
GOOGLE_CLIENT_ID = 'your-client-id-here.apps.googleusercontent.com'
GOOGLE_CLIENT_SECRET = 'your-client-secret-here'
GOOGLE_PROJECT_ID = 'your-project-name'
GOOGLE_REDIRECT_URI = 'http://localhost:8000/calendar/google/callback/'
```

---

## ✅ Connect Your Gmail Account

### Method 1: Through Settings Page

1. **Start the server** (if not running):
   ```bash
   cd d:\ai-agents-platform\ai-agents-platform
   python manage.py runserver
   ```

2. **Login** to your dashboard at `http://localhost:8000/login/`

3. Go to **Settings** page:
   - Click on your profile icon (top-right)
   - Select **"Settings"**
   - OR navigate to: `http://localhost:8000/settings/`

4. **Find Google Calendar Section**:
   - Look for "Google Calendar Integration"
   - Click **"Connect Google Calendar"** button

5. **Authorize with Google**:
   - You'll be redirected to Google's OAuth page
   - Select your Gmail account
   - Click **"Allow"** to grant permissions
   - You'll be redirected back to Settings

6. **Success!** ✅
   - You should see: "Google Calendar connected successfully!"
   - Your calendar events will now sync automatically

### Method 2: Direct Authorization URL

Visit this URL directly (replace `YOUR_USER_ID` with your user ID):

```
http://localhost:8000/calendar/google/auth/
```

This will initiate the OAuth flow immediately.

---

## 🎯 What Happens After Connection?

Once connected, your AI Dashboard will:

✅ **Sync Events**: Automatically fetch events from your Google Calendar  
✅ **Two-Way Sync**: Create events that appear in both places  
✅ **Email Notifications**: Get reminders via Gmail  
✅ **Smart Scheduling**: AI can suggest optimal times based on your calendar  

---

## 📱 Test the Integration

### Test 1: View Your Calendar

1. Go to **Calendar** page: `http://localhost:8000/calendar/`
2. You should see your Google Calendar events displayed
3. Events will show with their original colors from Google Calendar

### Test 2: Create an Event

1. Click **"Add Event"** on the calendar page
2. Fill in event details
3. Save it
4. Check your Google Calendar app - the event should appear there too!

### Test 3: Verify Connection Status

Go to Settings page and look for:
- ✅ **"Connected to: your-email@gmail.com"**
- **"Disconnect"** button (to unlink if needed)

---

## 🔒 Security & Privacy

Your data is secure because:

🔐 **OAuth 2.0**: Industry-standard authentication  
🔐 **Encrypted Storage**: Tokens stored encrypted in database  
🔐 **Minimal Scopes**: Only requests necessary permissions  
🔐 **Local Storage**: All data stays on your server  
🔐 **No Third Parties**: Direct connection between you and Google  

**Permissions Granted:**
- View your calendar events
- Create/edit/delete events
- View your email address (for account identification)

---

## ❌ Troubleshooting

### Issue: "Redirect URI Mismatch"

**Solution**: Make sure the redirect URI in Google Cloud Console exactly matches:
```
http://localhost:8000/calendar/google/callback/
```
(Include the trailing slash!)

### Issue: "Invalid Client"

**Solution**: Double-check your Client ID and Client Secret in `.env` file

### Issue: "Access Blocked"

**Solution**: Your app might be in testing mode. Either:
- Add your Gmail as a test user in OAuth consent screen
- OR publish the app (click "PUBLISH APP" in OAuth settings)

### Issue: Events Not Showing

**Solution**:
1. Check if `google_calendar_connected = True` in your user profile
2. Restart the Django server
3. Try disconnecting and reconnecting

### Issue: "Token Expired"

**Solution**: Disconnect and reconnect your calendar. The refresh token should handle auto-renewal.

---

## 🔄 Disconnect Calendar

To disconnect your Gmail account:

1. Go to **Settings**
2. Find **"Google Calendar Integration"**
3. Click **"Disconnect"** button
4. Confirm the action

This will:
- Remove stored tokens
- Stop calendar sync
- Keep existing events in your dashboard

---

## 📊 Environment Variables Summary

Add these to your `.env` file:

```env
# Google Calendar Configuration
GOOGLE_CLIENT_ID=123456789-abc123def456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456
GOOGLE_PROJECT_ID=ai-dashboard-project
GOOGLE_REDIRECT_URI=http://localhost:8000/calendar/google/callback/
```

---

## 🎉 Success Indicators

You'll know it's working when you see:

✅ Green checkmark next to "Google Calendar" in Settings  
✅ Your Gmail email displayed  
✅ Events appearing on Calendar page  
✅ "Disconnect" button available  
✅ Toast notification: "Google Calendar connected successfully!"  

---

## 🚀 Next Steps

Now that your calendar is connected:

1. **View synced events** on your dashboard
2. **Create new events** that sync to Google Calendar
3. **Use AI features** to analyze your schedule
4. **Set up reminders** via Gmail notifications

---

## 📞 Support

If you encounter any issues:

1. Check the Django console for error messages
2. Review logs in `logs/` directory
3. Verify all environment variables are set correctly
4. Ensure Google Calendar API is enabled in Google Cloud Console

---

**Ready to connect?** Just configure your credentials and click "Connect Google Calendar"! 🎊
