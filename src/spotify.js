const clientId = "537383e86adb4edf89b1bd6e05d725e9";
const redirectUri = "http://127.0.0.1:5173/callback";

const scopes = [
  "user-read-currently-playing",
  "user-read-playback-state",
  "user-modify-playback-state",
];

function generateRandomString(length) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const values = crypto.getRandomValues(new Uint8Array(length));
  values.forEach((v) => {
    result += chars[v % chars.length];
  });
  return result;
}

async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return await crypto.subtle.digest("SHA-256", data);
}

function base64encode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function redirectToSpotifyLogin() {
  const codeVerifier = generateRandomString(64);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64encode(hashed);

  localStorage.setItem("spotify_code_verifier", codeVerifier);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: scopes.join(" "),
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    redirect_uri: redirectUri,
  });

  window.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function handleSpotifyCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  if (!code) return null;

  const codeVerifier = localStorage.getItem("spotify_code_verifier");

  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = await response.json();

  if (data.access_token) {
    localStorage.setItem("spotify_access_token", data.access_token);
    if (data.refresh_token) {
      localStorage.setItem("spotify_refresh_token", data.refresh_token);
    }
    window.history.replaceState({}, document.title, "/");
  }

  return data;
}

export function getAccessToken() {
  return localStorage.getItem("spotify_access_token");
}

export async function getCurrentlyPlaying() {
  const token = getAccessToken();
  if (!token) return null;

  const response = await fetch(
    "https://api.spotify.com/v1/me/player/currently-playing",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (response.status === 204) return null;
  if (!response.ok) throw new Error("Failed to fetch currently playing track");

  return await response.json();
}

export function loadSpotifyPlayer() {
  return new Promise((resolve) => {
    if (window.Spotify) {
      resolve(window.Spotify);
      return;
    }

    window.onSpotifyWebPlaybackSDKReady = () => {
      resolve(window.Spotify);
    };
  });
}

export async function createSpotifyPlayer(onStateChange, onReady) {
  const Spotify = await loadSpotifyPlayer();
  const token = getAccessToken();

  if (!Spotify || !token) {
    throw new Error("Spotify SDK or token missing");
  }

  const player = new Spotify.Player({
    name: "SoundSpace Player",
    getOAuthToken: (cb) => cb(getAccessToken()),
    volume: 0.7,
  });

  player.addListener("ready", ({ device_id }) => {
    onReady?.(device_id);
  });

  player.addListener("player_state_changed", (state) => {
    onStateChange?.(state);
  });

  player.addListener("initialization_error", ({ message }) => {
    console.error("init error:", message);
  });

  player.addListener("authentication_error", ({ message }) => {
    console.error("auth error:", message);
  });

  player.addListener("account_error", ({ message }) => {
    console.error("account error:", message);
  });

  player.addListener("playback_error", ({ message }) => {
    console.error("playback error:", message);
  });

  await player.connect();
  return player;
}

export async function transferPlayback(deviceId) {
  const token = getAccessToken();

  const response = await fetch("https://api.spotify.com/v1/me/player", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      device_ids: [deviceId],
      play: false,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to transfer playback");
  }
}

export async function playPauseSpotify(player) {
  if (!player) return;
  await player.togglePlay();
}

// export async function startPlayback(deviceId) {
//   const token = getAccessToken();

//   const response = await fetch(
//     `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
//     {
//       method: "PUT",
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//     }
//   );

//   if (!response.ok) {
//     console.error("Start playback failed");
//   }
// }