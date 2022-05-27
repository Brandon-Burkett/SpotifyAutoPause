try {
    chrome.runtime.onMessage.addListener((request, sender, response) => {
        if (request.message === "get_status") {
            response({
                enabled: false,
                loggedIn: false
            });
        } else if (request.message === "handleLogin") {
            handleLogin();
        } else if (request.message === "logout") {
            logout();
        }
        return true;
    });
} catch (error) {
    console.log(error);
}

function base64URLEncode(str) {
  return str.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
}

function base64urlencode(a) {
    // Convert the ArrayBuffer to string using Uint8 array.
    // btoa takes chars from 0-255 and base64 encodes.
    // Then convert the base64 encoded to base64url encoded.
    // (replace + with -, replace / with _, trim trailing =)
    return btoa(String.fromCharCode.apply(null, new Uint8Array(a)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}



function sha256(buffer) {
    var enc = new TextEncoder().encode(buffer);

  return crypto.subtle.digest('SHA-256', enc);
}

function generateRandomString(length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
    for (var i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

// var challenge = base64URLEncode(sha256(verifier));


/** 
 * Authenticates the user using Spotify, returns an access token to the callback.
 */
async function handleLogin() {

    var verifier = base64URLEncode(generateRandomString(64));
    chrome.storage.sync.set({"verifier": verifier});
    var hashed_verifier = await sha256(verifier);
    var challenge = base64urlencode(hashed_verifier);

  var url = "https://accounts.spotify.com/authorize"
  var client_id = "f157802132604174a06f70478d857820"
  var response_type = "code"
  var redirect_uri = chrome.identity.getRedirectURL('oauth2')
  var scope = "user-modify-playback-state%20user-read-playback-state"
  // Maybe add state

  

  var request_url = url + 
  "?client_id=" + client_id + 
  "&response_type=" + response_type +
  "&redirect_uri=" + redirect_uri + 
  "&scope=" + scope +
  "&code_challenge=" + challenge +
  "&code_challenge_method=S256"
  // Spotify URL

//   var request_url = url + querystring.stringify({
//     client_id: client_id,
//     response_type: response_type,
//     redirect_uri: redirect_uri,
//     scope: scope,
//     code_challenge: base64URLEncode(sha256(verifier)),
//     code_challenge_method: "S256"
//   })
console.log(request_url)

  chrome.identity.launchWebAuthFlow({
      'url': request_url,
      'interactive': true
    },
    (redirect_url) => {
      console.log(redirect_url)
      var auth_code = new URLSearchParams(new URL(redirect_url).search).get('code'); // Parse url for access token
        console.log(auth_code)
    //   let body = {
    //       client_id: client_id,
    //       grant_type: "authorization_code",
    //         code: auth_code,
    //         redirect_uri: redirect_uri,
    //         code_verifier: verifier
    //   };
      //console.log(body);
      console.log("Verifier: " + verifier);
      console.log("Challenge: " + challenge);
      fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body: new URLSearchParams({
        client_id: client_id,
        grant_type: "authorization_code",
        code: auth_code,
        redirect_uri: redirect_uri,
        code_verifier: verifier
      }),
    }).then(async (response) => {
        var jsonResponse = await response.json();
        console.log(jsonResponse);
        access_token = jsonResponse.access_token;
        refresh_token = jsonResponse.refresh_token;
    
        const t = new Date();
        expires_at = t.setSeconds(t.getSeconds() + jsonResponse.expires_in);
    
        chrome.storage.sync.set({'access_token': access_token});
        chrome.storage.sync.set({'refresh_token': refresh_token});
        chrome.storage.sync.set({'expires_at': expires_at});
        console.log("Access token: " + access_token);
        console.log("Refresh token: " + refresh_token);
        console.log("Expires at: " + expires_at);
      })
    //   window.close(); // Close popup window to force reload after login.
    }
  )
}





var pausedbyProgram;
var access_token;
var audibleTabs = 0;
var loggedIn = false;
var extensionEnabled = false;

/**
 * Setter for extension status, sets to true. Extension enabled.
 */
function enableExtension() {
    extensionEnabled = true;

    chrome.tabs.query({
        audible: true
    }, function (tabs) {
        console.log(tabs.length)
        audibleTabs += tabs.length;
        if (audibleTabs >= 1) {
            console.log("Started with" + audibleTabs)
            checkPlaying(handleMusic)
        }
    });


}

/**
 * Setter for extension status, sets to false. Extension disabled.
 */
function disableExtension() {
    extensionEnabled = false;

    audibleTabs = 0;
}

/**
 * Getter for for extension status
 */
function getExtensionEnabled() {
    return extensionEnabled;
}

/**
 * User logged in, update access token and login status
 * 
 * @param {*} token - Spotify access token
 */
function login(token) {
    access_token = token;
    loggedIn = true;
}

/**
 * User logged out, update access token and login status
 */
function logout() {
    disableExtension();
    access_token = null;
    loggedIn = false;
}

/**
 * Getter for login status
 */
function getLoginStatus() {
    return loggedIn;
}


/**
 * Make a request to the Spotify Api to see if music is currently being played from Spotify. 
 * Response callback is sent to playerStatus()
 */
function checkPlaying(callback) {
    var player_url = 'https://api.spotify.com/v1/me/player';
    http_request(access_token, player_url, "GET", callback);
}

/**
 * Recieves the callback after request in checkPlaying() 
 * Takes json_text returned from HTTP request and parses it to determine is music is being played from Spotify.
 * 
 * @param {JSON String} json_text - JSON string returned from HTTP request containing current Spotify player info
 */
function handleMusic(json_text) {
    var obj = JSON.parse(json_text);
    if (obj.is_playing) { // If Spotify is playing music, then pause it
        var pause_url = "https://api.spotify.com/v1/me/player/pause";
        http_request(access_token, pause_url, "PUT")
        pausedbyProgram = true;
    } else if (!obj.is_playing) { // If spotify is not playing music,
        if (pausedbyProgram) { // And it was paused by the program, then resume playback
            var play_url = "https://api.spotify.com/v1/me/player/play";
            http_request(access_token, play_url, "PUT")
            pausedbyProgram = !pausedbyProgram
        }
    };
}


/**
 * Check to see if audio is being played by Google chrome tabs, and adjusts Spotify playback accordingly. 
 */
/* function checkAudible() {
    chrome.tabs.query({
        audible: true
    }, function (tabs) {
        if (Array.isArray(tabs) && tabs.length) {
            // There is a tab playing audio
            // Puase music only if it is already playing
            checkPlaying()
            if (isPlaying) {
                var pause_url = "https://api.spotify.com/v1/me/player/pause";
                http_request(access_token, pause_url, "PUT")
                pausedbyProgram = true;
            }
        } else {
            // Nothing is playing audio
            if (pausedbyProgram) {
                checkPlaying()
                if (!isPlaying) {
                    // Play music only if it is not already playing
                    var play_url = "https://api.spotify.com/v1/me/player/play";
                    http_request(access_token, play_url, "PUT")
                    pausedbyProgram = !pausedbyProgram
                }
            }
        }
    })
} */


chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (extensionEnabled) { // Make sure extension is enabled
        if (changeInfo.audible == true) {
            console.log(audibleTabs);
            if (audibleTabs == 0) { // If no tabs were audible, but now one is, 
                console.log("Trying to pause");
                checkPlaying(handleMusic); // Check if music is playing, if so pause it
            }
            audibleTabs += 1;
            console.log("Added tab" + audibleTabs);
        } else if (changeInfo.audible == false) {
            audibleTabs -= 1;
            console.log("Removed tab" + audibleTabs);
            if (audibleTabs == 0) { // If we removed the last audible tab, 
                console.log("Trying to play");
                checkPlaying(handleMusic); // Check if music is playing, if not, resume playback
            }

        }
    }
})


/**
 * Function to check that extension is enabled before checking tabs for audio
 */
/* function performCheck() {
    if (extensionEnabled) {
        checkAudible();
    }
}

setInterval(performCheck, 2000); */


//      *** Need to add device specific spotify controls *** 


/**
 * Function for handling HTTP requests
 * 
 * @param {String} access_token - Access token for HTTP request
 * @param {String} url - URL for HTTP request
 * @param {String} type - HTTP Method to use
 * @param {Function} callback - Callback function to pass responsetext to.
 */
function http_request(access_token, url, type, callback) {

    var xhr = new XMLHttpRequest();
    xhr.open(type, url);

    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("Authorization", `Bearer ${access_token}`);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (callback) {
                callback(xhr.responseText);
            }
        }
    };

    xhr.send();
}