require("dotenv").config();
const express = require("express");
const axios = require("axios");
const bodyParser = require("body-parser");
const app = express();
const port = 3000;
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.json());

app.get("/", (request, response) => {
  console.log("Hello from server!");
  response.json({ message: "Hello from server!" });
});


const CLIENT_ID = process.env.INSTA_CLIENT_ID;
const CLIENT_SECRET = process.env.INSTA_CLIENT_SECRET;
const REDIRECT_URI = 'https://serverless.on-demand.io/apps/commoditiesapi/auth/instagram/callback';

// Step 1: Start the login process
app.get('/auth/instagram', (req, res) => {
    console.log(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    const authURL = `https://www.instagram.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish&response_type=code`;
    res.redirect(authURL);
});

// Step 2: Handle the callback after user authorizes
app.get('/auth/instagram/callback', async (req, res) => {
    const code = req.query.code;

    if (!code) {
        return res.send('Authorization code not found');
    }

    try {
        // Exchange the authorization code for an access token
        const tokenResponse = await axios.post(
            'https://api.instagram.com/oauth/access_token',
            new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'authorization_code',
                redirect_uri: REDIRECT_URI,
                code: code,
            })
        );

        const accessToken = tokenResponse.data.access_token;

        // Store accessToken securely or use it to make API calls
        res.send(`Access Token: ${accessToken}`);
    } catch (error) {
        console.error('Error exchanging code for token:', error.response.data);
        res.send('Failed to exchange code for access token.');
    }
});

const BASE_URL = 'https://graph.instagram.com/v21.0';

// Function to get Instagram user ID from token
const getUserIdFromToken = async (access_token) => {
  try {
    const response = await axios.get(`${BASE_URL}/me`, {
      params: {
        fields: 'id,username',
        access_token,
      },
    });
    return { userId: response.data.id, username: response.data.username };
  } catch (error) {
    throw new Error(
      error.response ? error.response.data.error.message : error.message
    );
  }
};

// Common function to publish media
const publishMedia = async (userId, creationId, access_token) => {
  const publishResponse = await axios.post(
    `${BASE_URL}/${userId}/media_publish`,
    null,
    {
      params: {
        creation_id: creationId,
        access_token,
      },
    }
  );
  return publishResponse.data.id;
};

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
