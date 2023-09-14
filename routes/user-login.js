import express, { response } from 'express';
import axios from 'axios';
import app from '../firebase-functions.js';
import { doc, getFirestore, setDoc, getDocs, getDoc, collection } from "firebase/firestore";
import { 
    readSpotifyData,
    readYoutubeData, 
    writeSpotifyPlaylist, 
    writeYoutubePlaylist } from '../firebase-functions.js';
import {
    getAuth,  
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged } from "firebase/auth";
import getArtistTitle from 'get-artist-title';
  
const auth = getAuth(app);
const db = getFirestore(app);
const router = express.Router();

router.use(express.json()); 
router.use(express.urlencoded({ extended: true }));

router.post("/register", async (req, res) => {
    const { username, email, password } = req.body;

    const userName = username;
    const loginEmail = email;
    const loginPassword = password;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, loginEmail, loginPassword);
        const user = userCredential.user;
        res.status(200).json({ message: "Registration successful", user: user });
    } 
    catch (error) {
        const errorCode = 'Error: 400';
        const errorMessage = error.message;
        res.render('404', { errorCode, errorMessage })
    }
})

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const loginEmail = email;
    const loginPassword = password;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
        const user = userCredential.user;
        res.redirect('/profile');
        const uid = user.uid;
        console.log(uid);
        console.log('login successful');
    } 
    catch (error) {
        const errorCode = 'Error: 400';
        const errorMessage = error.message;
        res.render('404', { errorCode, errorMessage })
    }
});

router.get("/signout", async (req, res) => {
    signOut(auth)
      .then(() => {
        res.redirect('/');
      })
      .catch((error) => {
        const errorCode = 'Error: 400';
        const errorMessage = error.message;
        res.render('404', { errorCode, errorMessage })
      });
});

router.post("/playlist", async (req, res) => {
    const { spotifyPlaylist, youtubePlaylist } = req.body;

    const userData = doc(db, 'users/DoFhEBKtCWNVHYieWUlm3ZSdEh22');
    const docData = {
      spotifyPlaylist: `${spotifyPlaylist}`,
      youtubePlaylist: `${youtubePlaylist}`,
    }

    try {
        await setDoc(userData, docData, { merge: true });
        console.log('Playlists added');
        res.redirect('/profile');
    } 
    catch (error) {
        const errorCode = error.code;
        const errorMessage = error.message;
        res.status(errorCode).json({ error: errorMessage });
    }
});

router.post("/sync", async (req, res) => {
    const { source } = req.body;

    if (source == 'spotify') {

        getSpotifyPlaylist();
        spotifyToYoutube();

        res.redirect('/profile');
    } 
    else if (source == 'youtube') {

        //getYoutubePlaylist();
        youtubeToSpotify();

        res.redirect('/profile');
    } 
    else if (source == 'sync') {

        getSpotifyPlaylist();
        spotifyToYoutube();

        getYoutubePlaylist();
        youtubeToSpotify();

        res.redirect('/profile');
    } 
    else {
        res.json({ error: 'Invalid request' });
    }
});


async function getSpotifyPlaylist() {
    const [ spotifyAccessToken, spotifyPlaylist ] = await readSpotifyData(); 

    const apiUrl = `https://api.spotify.com/v1/playlists/${spotifyPlaylist}/tracks?fields=items%28track%28name%2Cartists%28name%29%2Cadded_at%2Cid%29%29`;

    const config = {
        headers: {
            'Authorization': `Bearer ${spotifyAccessToken}`
        }
    };

    try {
        const response = await axios.get(apiUrl, config);
        const playlistItems = response.data.items;

        playlistItems.forEach(item => {
            const track = item.track;
            const songName = track.name;
            const artistNames = track.artists.map(artist => artist.name).join(', ');
            const addedAt = track.added_at;
            const id = track.id;

            writeSpotifyPlaylist(id, songName, artistNames, addedAt);

            console.log('Song Name:', songName);
            console.log('Artist Names:', artistNames);
            console.log('Added At:', addedAt);
            console.log('Track id:', id);
            console.log('---');
        });
        
         /*
        const playlistData = [];
        const itemData = {
            songName,
            artistNames,
            addedAt,
            id
        };
        playlistData.push(itemData);
        */
    } 
    catch (error) {
        const errorCode = error.response.status;
        const errorMessage = error.response.message;
        console.error('Error: ', errorCode);
        console.error('Message: ', errorMessage);
    }
}

//getSpotifyPlaylist();
//console.log(Date.now());

async function getYoutubePlaylist(pageToken = null) {
    const [ youtubeAccessToken, youtubePlaylist ] = await readYoutubeData(); 
    const maxResults = 50;
    const apiKey = 'AIzaSyDO0Naa6kJBy5MP-WLrWuHaNRZtc5eiols';

    let apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?fields=items%28id%2Csnippet%28title%2CvideoOwnerChannelTitle%29%2CcontentDetails%29&part=snippet%2Cid%2CcontentDetails&maxResults=${maxResults}&playlistId=${youtubePlaylist}`;

    /* fields=items%28id%2Csnippet%28title%2CvideoOwnerChannelTitle%29%2CcontentDetails%29& */

    if (pageToken) {
        apiUrl += `&pageToken=${pageToken}`;
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${youtubeAccessToken}`
    };

    try {
        const response = await axios.get(apiUrl, { headers });
        const playlistItems = response.data.items;

        playlistItems.forEach(item => {
            const title = item.snippet.title;
            //const addedAt = track.added_at;
            const playlistItemId = item.id;
            const id = item.contentDetails.videoId;

            let [ artist, name ] = getArtistTitle(`${title}`)

            function truncateString(str) {
                if (str.length > 15) {
                  return str.substring(0, 15); 
                }
                return str; 
            }

            const artistTrunc = truncateString(artist);
            const songTrunc = truncateString(name);

            const songName = artistTrunc + ' ' + songTrunc;
            
            writeYoutubePlaylist(id, songName, title, playlistItemId); 
        });

        if (response.data.nextPageToken) 
        {
            await getYoutubePlaylist(response.data.nextPageToken);
        }
    } 
    catch (error) {
        const errorCode = error.response.status;
        const errorMessage = error.response.message;
        console.error('Error: ', errorCode);
        console.error('Message: ', errorMessage);
    }
}

//getYoutubePlaylist();

async function searchSpotify(song) {
    const [ spotifyAccessToken ] = await readSpotifyData();

    const apiUrl = 'https://api.spotify.com/v1/search';

    const config = {
        params: {
            q: `${song}`,
            type: 'track',
            limit: 1,
        },
        headers: {
            'Authorization': `Bearer ${spotifyAccessToken}`
        }
    };
    
    try {
        const response = await axios.get(apiUrl, config);

        const searchResult = response.data;

        if (searchResult.tracks.items == null) 
        {
            console.log('No matching songs');
            return;
        }

        const id = searchResult.tracks.items[0].id;
        const name = searchResult.tracks.items[0].name;
        const artist = searchResult.tracks.items[0].artists.map(artist => artist.name).join(', ');
        const addedAt = new Date().toLocaleString();

        const userData = doc(db, `/users/DoFhEBKtCWNVHYieWUlm3ZSdEh22/spotify-playlist/${id}`);

        try {
            const docData = await getDoc(userData);

            if (docData.exists())
            {
                console.log('Song exists');
            }
            else
            {
                writeSpotifyPlaylist(id, name, artist, addedAt);
                postSpotifySongs(id);
                console.log(id);
                console.log(name);
                
            }
        } 
        catch (error) {
            console.error('Error reading spotify data from the database:', error);
        } 
    } 
    catch (error) {
        console.error('Error searching Spotify:', error);
    }
}

async function youtubeToSpotify() {

    const youtubeCollection = collection(db, 'users/DoFhEBKtCWNVHYieWUlm3ZSdEh22/youtube-playlist');
    const songs = [];

    try {
        const youtubeData = await getDocs(youtubeCollection);
        
        youtubeData.forEach((doc) => {
            const data = doc.data();
            songs.push(data.name);
        });
    } 
    catch (error) {
        const errorCode = error.response.status;
        const errorMessage = error.response.message;
        console.error('Error: ', errorCode);
        console.error('Message: ', errorMessage);
    }
    
    songs.forEach((value) => {
        let song = value;
        console.log('searching: ', song);
        searchSpotify(song);
    });
}

//youtubeToSpotify();

async function postSpotifySongs(spotifyUri) {
    const [ spotifyAccessToken, spotifyPlaylist ] = await readSpotifyData(); 

    const apiUrl = `https://api.spotify.com/v1/playlists/${spotifyPlaylist}/tracks`;
    const config = {
        headers: {
            'Authorization': `Bearer ${spotifyAccessToken}`
        }
    };
    const data = {
        'uris': [
            `spotify:track:${spotifyUri}`
        ]
    };

    try {
        const response = await axios.post(apiUrl, data, config);
        const playlistItems = response.data;
        console.log('done');
    } 
    catch (error) {
        const errorCode = error.response.status;
        const errorMessage = error.response.statusText;
        console.error('Error: ', errorCode);
        console.error('Message: ', errorMessage);
    }
}

//postSpotifySongs('26XaOsDMbl0e1cVKYfkz6w');

async function spotifyToYoutube() {

    const spotifyCollection = collection(db, 'users/DoFhEBKtCWNVHYieWUlm3ZSdEh22/spotify-playlist');
    const songs = [];

    try {
        const spotifyData = await getDocs(spotifyCollection);
        
        spotifyData.forEach((doc) => {
            const data = doc.data();
            songs.push(`${data.name} ${data.artist}`);
        });
    } 
    catch (error) {
        const errorCode = error.response.status;
        const errorMessage = error.response.message;
        console.error('Error: ', errorCode);
        console.error('Message: ', errorMessage);
    }
    
    const apiKey = 'AIzaSyDO0Naa6kJBy5MP-WLrWuHaNRZtc5eiols';

    const song = songs[4];

    const apiUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&q=${encodeURIComponent(song)}&type=video&maxResults=1&part=snippet`;

    try {
        const response = await axios.get(apiUrl);

        const searchResult = response.data.items;

        const id = searchResult[0].id.videoId;
        const name = searchResult[0].snippet.title;
        const addedAt = new Date().toLocaleString();

        console.log(name);
        console.log(id);

        const userData = doc(db, `/users/DoFhEBKtCWNVHYieWUlm3ZSdEh22/youtube-playlist/${id}`);
  
        try {
            const docData = await getDoc(userData);

            if (docData.exists())
            {
                console.log('Song exists');
            }
            else
            {
                writeYoutubePlaylist(id, name, addedAt, addedAt);
                console.log('Spotify song added to database');
                postYoutubeSongs(id);
                console.log('Spotify song added to Youtube');
            }
        } 
        catch (error) {
            console.error('Error reading Youtube data from the database:', error);
        } 
    } 
    catch (error) {
        console.error('Error searching Youtube:', error.response.status);
    }
}

//spotifyToYoutube();

async function postYoutubeSongs(youtubeUri) {
    const [ youtubeAccessToken, youtubePlaylist ] = await readYoutubeData(); 

    const apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet`;
    const requestData = {
        snippet: {
          playlistId: `${youtubePlaylist}`,
          resourceId: {
            kind: 'youtube#video',
            videoId: `${youtubeUri}`,
          },
        },
    };
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${youtubeAccessToken}`,
    };
      
    try {
        const response = await axios.post(apiUrl, requestData, { headers });
        const playlistItems = response.data;
        console.log(playlistItems);
    } 
    catch (error) {
        const errorCode = error.response.status;
        const errorMessage = error.response.statusText;
        console.error('Error: ', errorCode);
        console.error('Message: ', errorMessage);
    }
}

export const authMiddleware = (req, res, next) => {
    const user = auth.currentUser;
    const isAuthenticated = !!user;
    res.locals.isAuthenticated = isAuthenticated;
    next();
};

export default router;