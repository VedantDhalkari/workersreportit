// scripts/getRefreshToken.js
const { google } = require("googleapis");
require("dotenv").config();

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
} = process.env;

const oAuth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
);

const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: "offline",
  scope: SCOPES,
  prompt: "consent", // force refresh token every time
});

console.log("🔗 Visit this URL to authorize:", authUrl);

// After visiting the URL and logging in, paste the code here:
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

readline.question("Enter the code from Google: ", async (code) => {
  const { tokens } = await oAuth2Client.getToken(code);
  console.log("✅ Your new refresh token:", tokens.refresh_token);
  readline.close();
});
