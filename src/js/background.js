// Check if expires time is past, if so, refresh token
try {
  chrome.runtime.onMessage.addListener((request, sender, response) => {
    if (request.message === "get_status") {
      chrome.storage.sync.get(["loggedIn", "enabled"], (result) => {
        getPlaying().then((playing) => {
          response({
            enabled: result.enabled,
            loggedIn: result.loggedIn,
            media_type: playing.media_type,
            image_url: playing.image_url,
            title: playing.title,
            link: playing.link,
            artist: playing.artist,
            artist_link: playing.artist_link,
            album: playing.album,
            album_link: playing.album_link,
            playstate: playing.playstate,
          });
        });
      });
    } else if (request.message === "handleLogin") {
      handleLogin().then(() => {
        enableExtension();
        chrome.storage.sync.get(["loggedIn", "enabled"], (result) => {
          console.log(result.loggedIn);
          response({
            enabled: result.enabled,
            loggedIn: result.loggedIn,
          });
        });
      });
    } else if (request.message === "logout") {
      logout().then(() => {
        response({
          enabled: false,
          loggedIn: false,
        });
      });
    } else if (request.message === "enable") {
      chrome.storage.sync.get(["loggedIn"], (result) => {
        if (result.loggedIn) {
          enableExtension();
          response({
            enabled: true,
            loggedIn: result.loggedIn,
          });
        } else {
          response({
            enabled: false,
            loggedIn: result.loggedIn,
          });
        }
      });
    } else if (request.message === "disable") {
      chrome.storage.sync.set({ enabled: false });
      response({
        enabled: false,
        loggedIn: result.loggedIn,
      });
    }
    return true;
  });
} catch (error) {
  console.log(error);
}

function base64URLEncode(str) {
  return str
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function base64urlencode(a) {
  // Convert the ArrayBuffer to string using Uint8 array.
  // btoa takes chars from 0-255 and base64 encodes.
  // Then convert the base64 encoded to base64url encoded.
  // (replace + with -, replace / with _, trim trailing =)
  return btoa(String.fromCharCode.apply(null, new Uint8Array(a)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sha256(buffer) {
  console.log("buffer: " + buffer);
  var enc = new TextEncoder().encode(buffer);
  console.log("enc: " + enc);
  var hash = await crypto.subtle.digest("SHA-256", enc); //.then((hash) => {
  console.log("hash: " + hash);
  return hash;
  // }).catch((err) => {
  //     console.log(err);
  // });
}

function generateRandomString(length) {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// var challenge = base64URLEncode(sha256(verifier));

/**
 * Authenticates the user using Spotify, returns an access token to the callback.
 */
// async function handleLogin2() {
//   var verifier = base64URLEncode(generateRandomString(64));
//   chrome.storage.sync.set({ verifier: verifier });
//   var hashed_verifier = await sha256(verifier);
//   console.log("hashed" + hashed_verifier);
//   var challenge = base64urlencode(hashed_verifier);

//   var url = "https://accounts.spotify.com/authorize";
//   var client_id = "f157802132604174a06f70478d857820";
//   var response_type = "code";
//   var redirect_uri = chrome.identity.getRedirectURL("oauth2");
//   var scope = "user-modify-playback-state%20user-read-playback-state";
//   // Maybe add state

//   var request_url =
//     url +
//     "?client_id=" +
//     client_id +
//     "&response_type=" +
//     response_type +
//     "&redirect_uri=" +
//     redirect_uri +
//     "&scope=" +
//     scope +
//     "&code_challenge=" +
//     challenge +
//     "&code_challenge_method=S256";
//   // Spotify URL

//   console.log(request_url);

//   chrome.identity.launchWebAuthFlow(
//     {
//       url: request_url,
//       interactive: true,
//     },
//     (redirect_url) => {
//       console.log(redirect_url);
//       var auth_code = new URLSearchParams(new URL(redirect_url).search).get(
//         "code"
//       ); // Parse url for access token
//       console.log(auth_code);
//       console.log("Verifier: " + verifier);
//       console.log("Challenge: " + challenge);
//       fetch("https://accounts.spotify.com/api/token", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
//         },
//         body: new URLSearchParams({
//           client_id: client_id,
//           grant_type: "authorization_code",
//           code: auth_code,
//           redirect_uri: redirect_uri,
//           code_verifier: verifier,
//         }),
//       }).then(async (response) => {
//         var jsonResponse = await response.json();
//         console.log(jsonResponse);
//         access_token = jsonResponse.access_token;
//         refresh_token = jsonResponse.refresh_token;

//         if (access_token) {
//           const t = new Date();
//           expires_at = t.setSeconds(t.getSeconds() + jsonResponse.expires_in);

//           chrome.storage.sync.set({ access_token: access_token });
//           chrome.storage.sync.set({ refresh_token: refresh_token });
//           chrome.storage.sync.set({ expires_at: expires_at });
//           chrome.storage.sync.set({ loggedIn: true });

//           console.log("Access token: " + access_token);
//           console.log("Refresh token: " + refresh_token);
//           console.log("Expires at: " + expires_at);
//         } else {
//           console.log("Error logging in");
//         }
//       });
//     }
//   );
// }

function logout() {
  chrome.storage.sync.set({ loggedIn: false, enabled: false });
  chrome.storage.sync.remove(["access_token", "refresh_token", "expires_at"]);
}

function getPlaying() {
  return new Promise((resolve, reject) => {
    http_request(
      "https://api.spotify.com/v1/me/player/currently-playing?additional_types=track,episode",
      "GET"
    ).then(async (response) => {
      console.log(response);
      var obj = await response.json();
      console.log(obj);
      if (obj.currently_playing_type == "track") {
        console.log("Item Link: " + obj.item.external_urls.spotify);
        console.log("Album Link: " + obj.item.album.external_urls.spotify);
        console.log(
          "Artist Link: " +
            obj.item.artists.map((a) => a.external_urls.spotify).join(", ")
        );
        console.log("Image:" + obj.item.album.images[1].url);
        console.log("Title: " + obj.item.name);
        console.log(
          "Artist: " + obj.item.artists.map((a) => a.name).join(", ")
        );
        console.log("Album: " + obj.item.album.name);
        resolve({
          media_type: "track",
          image_url: obj.item.album.images[1].url,
          title: obj.item.name,
          link: obj.item.external_urls.spotify,
          artist: obj.item.artists.map((a) => a.name).join(", "),
          artist_link: obj.item.artists
            .map((a) => a.external_urls.spotify)
            .join(", "),
          album: obj.item.album.name,
          album_link: obj.item.album.external_urls.spotify,
          playstate: obj.is_playing,
        });
      } else if (obj.currently_playing_type == "episode") {
        console.log("Item Link: " + obj.item.external_urls.spotify);
        console.log("Podcast Link: " + obj.item.show.external_urls.spotify);
        console.log("Image:" + obj.item.images[1].url);
        console.log("Title: " + obj.item.name);
        console.log("Podcast: " + obj.item.show.name);
        resolve({
          media_type: "episode",
          image_url: obj.item.images[1].url,
          title: obj.item.name,
          link: obj.item.external_urls.spotify,
          artist: obj.item.show.name,
          artist_link: obj.item.show.external_urls.spotify,
          playstate: obj.is_playing,
        });
      }
    });
  });
}

/**
 * Authenticates the user using Spotify, returns an access token to the callback.
 */
async function handleLogin() {
  var verifier = base64URLEncode(generateRandomString(64));

  var hashed_verifier = await sha256(verifier);
  console.log("hashed" + hashed_verifier);
  var challenge = base64urlencode(hashed_verifier);

  chrome.storage.sync.set({ verifier: verifier });

  var url = "https://accounts.spotify.com/authorize";
  var client_id = "f157802132604174a06f70478d857820";
  var response_type = "code";
  var redirect_uri = chrome.identity.getRedirectURL("oauth2");
  var scope = "user-modify-playback-state%20user-read-playback-state";

  var request_url =
    url +
    "?client_id=" +
    client_id +
    "&response_type=" +
    response_type +
    "&redirect_uri=" +
    redirect_uri +
    "&scope=" +
    scope +
    "&code_challenge=" +
    challenge +
    "&code_challenge_method=S256";
  // Spotify URL

  console.log(request_url);

  chrome.identity.launchWebAuthFlow(
    {
      url: request_url,
      interactive: true,
    },
    (redirect_url) => {
      console.log(redirect_url);
      var auth_code = new URLSearchParams(new URL(redirect_url).search).get(
        "code"
      ); // Parse url for access token

      console.log(auth_code);
      console.log("Verifier: " + verifier);
      console.log("Challenge: " + challenge);

      token_request({
        client_id: client_id,
        grant_type: "authorization_code",
        code: auth_code,
        redirect_uri: redirect_uri,
        code_verifier: verifier,
      });
    }
  );
  // .catch((error) => {
  //   console.log("WebAuthFlow error: " + error);
  // });
}

function handleLoginResponse(response) {
  return new Promise(async (resolve, reject) => {
    var jsonResponse = await response.json();
    console.log(jsonResponse);
    var access_token = jsonResponse.access_token;
    var refresh_token = jsonResponse.refresh_token;

    if (jsonResponse.access_token) {
      const t = new Date();
      expires_at = t.setSeconds(t.getSeconds() + jsonResponse.expires_in);

      chrome.storage.sync.set({ access_token: access_token });
      chrome.storage.sync.set({ refresh_token: refresh_token });
      chrome.storage.sync.set({ expires_at: expires_at });
      chrome.storage.sync.set({ loggedIn: true });

      console.log("Access token: " + access_token);
      console.log("Refresh token: " + refresh_token);
      console.log("Expires at: " + expires_at);
      resolve();
    } else {
      reject(jsonResponse);
    }
  });
}

// var pausedbyProgram;
// var access_token;
// var audibleTabs = 0;
// var loggedIn = false;
// var extensionEnabled = false;

/**
 * Setter for extension status, sets to true. Extension enabled.
 */
function enableExtension() {
  chrome.storage.sync.set({ enabled: true });
  chrome.storage.sync.set({ pausedByProgram: false });
  chrome.tabs
    .query({
      audible: true,
    })
    .then((tabs) => {
      console.log(tabs.length);
      let audibleTabs = tabs.length;
      chrome.storage.sync.set({ audibleTabs: audibleTabs });
      if (audibleTabs >= 1) {
        console.log("Started with" + audibleTabs);
        handleMusic();
      }
    })
    .catch((error) => {
      console.log("Tab Query error: " + error);
    });
}

/**
 * Setter for extension status, sets to false. Extension disabled.
 */
// function disableExtension() {
//     extensionEnabled = false;

//     audibleTabs = 0;
// }

// /**
//  * Getter for for extension status
//  */
// function getExtensionEnabled() {
//     return extensionEnabled;
// }

// /**
//  * User logged in, update access token and login status
//  *
//  * @param {*} token - Spotify access token
//  */
// function login(token) {
//     access_token = token;
//     loggedIn = true;
// }

// /**
//  * User logged out, update access token and login status
//  */
// function logout() {
//     disableExtension();
//     access_token = null;
//     loggedIn = false;
// }

// /**
//  * Getter for login status
//  */
// function getLoginStatus() {
//     return loggedIn;
// }

/*
if audible tabs change and ext enabled:
  if tab became audible:
    if none were audible before:
      check if music is playing
      if so, pause it
      set pausedByProgram to true
    increment audibleTabs
  if tab became unaudible:
    decrement audibleTabs
    if only one was audible before (audibleTabs == 0 now):
      check if pausedByProgram is true
      if true, play music
      set pausedByProgram to false (opposite of what it was)
*/

/**
 * Make a request to the Spotify Api to see if music is currently being played from Spotify.
 * Response callback is sent to playerStatus()
//  */
// function checkPlaying(callback) {
//   var player_url = "https://api.spotify.com/v1/me/player";
//   http_request(player_url, "GET", callback);
// }

/**
 * Recieves the callback after request in checkPlaying()
 * Takes json_text returned from HTTP request and parses it to determine is music is being played from Spotify.
 *
 * @param {JSON String} json_text - JSON string returned from HTTP request containing current Spotify player info
 */
function handleMusic() {
  http_request("https://api.spotify.com/v1/me/player", "GET").then(
    async (response) => {
      console.log(response);
      var obj = await response.json();
      if (obj.is_playing) {
        // If Spotify is playing music, then pause it
        http_request("https://api.spotify.com/v1/me/player/pause", "PUT").then(
          () => {
            chrome.storage.sync.set({ pausedByProgram: true });
          }
        );
      } else if (!obj.is_playing) {
        // If spotify is not playing music,
        chrome.storage.sync.get(["pausedByProgram"], (result) => {
          if (result.pausedByProgram) {
            // And it was paused by the program, then resume playback
            http_request(
              "https://api.spotify.com/v1/me/player/play",
              "PUT"
            ).then(() => {
              chrome.storage.sync.set({
                pausedByProgram: !result.pausedByProgram,
              });
            });
          }
        });
      }
    }
  );
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log("Something changed!!");
  console.log("changed audibleTabs: " + changeInfo.audible);
  if ("audible" in changeInfo) {
    chrome.storage.sync.get(["enabled", "audibleTabs"], (result) => {
      if (result.enabled) {
        // Make sure extension is enabled
        let audibleTabs = result.audibleTabs;
        console.log("audibleTabs: " + audibleTabs);
        if (changeInfo.audible == true) {
          console.log(audibleTabs);
          if (audibleTabs == 0) {
            // If no tabs were audible, but now one is,
            console.log("Trying to pause");
            handleMusic(); // Check if music is playing, if so pause it
          }
          audibleTabs += 1;
          console.log("Added tab" + audibleTabs);
        } else if (changeInfo.audible == false) {
          audibleTabs -= 1;
          console.log("Removed tab" + audibleTabs);
          if (audibleTabs == 0) {
            // If we removed the last audible tab,
            console.log("Trying to play");
            handleMusic(); // Check if music is playing, if not, resume playback
          }
        }
        chrome.storage.sync.set({ audibleTabs: audibleTabs });
      }
    });
  } else {
    console.log("No audibleTabs change");
  }
});

//      *** Need to add device specific spotify controls ***

/**
 * Function for handling HTTP requests
 *
 * @param {String} access_token - Access token for HTTP request
 * @param {String} url - URL for HTTP request
 * @param {String} type - HTTP Method to use
 * @param {Function} callback - Callback function to pass responsetext to.
 */
function http_request(url, type) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(["access_token"], (result) => {
      fetch(url, {
        method: type,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${result.access_token}`,
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          console.log(response);
          if (response.status == 401) {
            console.log("Token expired, refreshing");
            refresh_access_token()
              .then(() => {
                console.log("Token refreshed");
                http_request(url, type);
              })
              .catch(async (error) => {
                console.log("Token refresh failed");
                await logout();
                reject(error);
              });
          } else {
            resolve(response);
          }
        })
        .catch((error) => {
          console.log("Http Request error: " + error);
          reject(error);
        });
    });
  });
}

function refresh_access_token() {
  return new Promise((resolve, reject) => {
    console.log("Refreshing access token");
    chrome.storage.sync.get(["refresh_token"], (result) => {
      var client_id = "f157802132604174a06f70478d857820";
      token_request({
        grant_type: "refresh_token",
        refresh_token: result.refresh_token,
        client_id: client_id,
      })
        .then(() => {
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  });
}

function token_request(body) {
  return new Promise((resolve, reject) => {
    fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: new URLSearchParams(body),
    })
      .then(async (response) => {
        handleLoginResponse(response)
          .then(() => {
            resolve();
          })
          .catch((error) => {
            console.log("Token Request Login error: " + error);
            reject(error);
          });
      })
      .catch((error) => {
        console.log("Token Request Fetch error: " + error);
        reject(error);
      });
  });
}
