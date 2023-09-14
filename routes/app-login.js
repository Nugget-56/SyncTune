import 'dotenv/config'
import express from "express";
import axios from "axios";
import { writeSpotifyData, writeYoutubeData } from '../firebase-functions.js';
import { URLSearchParams } from "url";
import cookieParser from "cookie-parser";
import { google } from "googleapis";
import pkg from 'cors';
import { Console } from "console";
const { CorsOptions } = pkg;

const router = express.Router();

const client_id = process.env.spotify_api_client;
const client_secret = process.env.spotify_api_secret;
const redirect_uri = "http://localhost:3000/callback";

const oauth2Client = new google.auth.OAuth2(
  process.env.google_api_client,
  process.env.google_api_secret,
  'http://localhost:3000/oauth2callback'
);

google.options({auth: oauth2Client});

router.use(express.urlencoded({ extended: true }))
      .use(express.json())
      .use(cookieParser());

const generateRandomString = function (length) {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
};

const stateKey = "spotify_auth_state";

router.get("/spotify-login", (req, res) => {

  const state = generateRandomString(16);
  res.cookie(stateKey, state);

  const scope = "user-read-email playlist-read-private playlist-modify-private playlist-modify-public";
  const queryParams = new URLSearchParams({
    response_type: "code",
    client_id: client_id,
    scope: scope,
    redirect_uri: redirect_uri,
    state: state,
  });

  const authorizeURL = `https://accounts.spotify.com/authorize?${queryParams}`;
  res.redirect(authorizeURL);
});

router.get("/callback", async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect("/" +
        querystring.stringify({
          error: "state_mismatch",
        })
    );
  } 
  else {
    res.clearCookie(stateKey);
    const authOptions = {
      url: "https://accounts.spotify.com/api/token",
      data: new URLSearchParams({
        code: code,
        redirect_uri: redirect_uri,
        grant_type: "authorization_code",
      }),
      headers: {
        "Authorization": "Basic " + Buffer.from(client_id + ":" + client_secret).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded"
      },
    };

    try {
      const tokenResponse = await axios.post(
        authOptions.url,
        authOptions.data,
        {
          headers: authOptions.headers,
        }
      );

      const access_token = tokenResponse.data.access_token;
      const refresh_token = tokenResponse.data.refresh_token;

      writeSpotifyData(access_token, refresh_token);

      console.log('Spotify login successful');

      res.redirect('/profile');
    } 
    catch (error) {
      console.error("Error fetching token:", error);
      res.status(400).send("Error fetching token");
    }
  }
});

router.get("/refresh_token", async (req, res) => {

    const refresh_token = req.query.refresh_token;
  
    const authOptions = {
      url: "https://accounts.spotify.com/api/token",
      data: new URLSearchParams({
        refresh_token: refresh_token,
        grant_type: "refresh_token",
      }),
      headers: {
        "Authorization": "Basic " + Buffer.from(client_id + ":" + client_secret).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded"
      },
    };

    try {
      const tokenResponse = await axios.post(
        authOptions.url,
        authOptions.data,
        {
          headers: authOptions.headers,
        }
      );

      const access_token = tokenResponse.data.access_token;
      const refresh_token = tokenResponse.data.refresh_token;

      writeSpotifyData(access_token, refresh_token);

      console.log('Refresh successful!');

      res.redirect('/');
    } 
    catch (error) {
      console.error("Error refreshing token:", error);
      res.status(400).send("Error refreshing token");
    }
});

router.get("/youtube-login", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: 'https://www.googleapis.com/auth/youtube'
  });

  res.redirect(url);
});

router.get('/oauth2callback', async (req, res) => {
  try {
    const {tokens} = await oauth2Client.getToken(req.query.code)
    oauth2Client.setCredentials(tokens);

    const access_token_yt = tokens.access_token;
    const refresh_token_yt = tokens.refresh_token;

    writeYoutubeData(access_token_yt, refresh_token_yt);

    console.log("Youtube login success");

    res.redirect("/profile");
  } 
  catch (error) {
    console.error("Error fetching token:", error);
    res.status(400).send("Error fetching token");
    res.redirect("public/404.html")
  }
});


export default router;
