const { google } = require('googleapis');
const User = require('../models/User');

const getOAuthClient = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

// Generate Consent URL
exports.getAuthUrl = (req, res) => {
  try {
    const userId = req.user.id;
    const oauth2Client = getOAuthClient();

    const scopes = [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    // Encode user ID into state to authenticate callback session
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId,
      prompt: 'consent'
    });

    res.json({ url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Handle OAuth callback redirection
exports.oauthCallback = async (req, res) => {
  const { code, state } = req.query; // state contains userId
  
  if (!code || !state) {
    console.error("Callback failed: missing code or state parameter.");
    return res.redirect('http://localhost:3000?calendar_sync=error');
  }

  try {
    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    
    // Save tokens under the user ID passed in state
    const updated = await User.findByIdAndUpdate(state, {
      $set: { googleTokens: tokens }
    });

    if (!updated) {
      console.error(`Callback failed: User not found for state ${state}.`);
      return res.redirect('http://localhost:3000?calendar_sync=error');
    }

    console.log(`✅ Google Calendar tokens successfully linked for user: ${state}`);
    res.redirect('http://localhost:3000?calendar_sync=success');
  } catch (error) {
    console.error('Google OAuth token exchange error:', error);
    res.redirect('http://localhost:3000?calendar_sync=error');
  }
};

// Check Sync status
exports.getSyncStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const isSynced = !!(user.googleTokens && user.googleTokens.access_token);
    res.json({ synced: isSynced });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
