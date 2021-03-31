var pausedbyProgram
var isPlaying
var access_token
var loggedIn = false;
var extensionEnabled = false;

/**
 * Setter for extension status, sets to true. Extension enabled.
 */
function enableExtension() {
    extensionEnabled = true;
}

/**
 * Setter for extension status, sets to false. Extension disabled.
 */
function disableExtension() {
    extensionEnabled = false;
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
function checkPlaying() {
    var player_url = 'https://api.spotify.com/v1/me/player'
    pause_media(access_token, player_url, "GET", playerStatus)
}

/**
 * Recieves the callback after request in checkPlaying() 
 * Takes json_text returned from HTTP request and parses it to determine is music is being played from Spotify.
 * 
 * @param {JSON String} json_text - JSON string returned from HTTP request containing current Spotify player info
 */
function playerStatus(json_text) {
    var obj = JSON.parse(json_text)
    isPlaying = obj.is_playing
}

/**
 * Check to see if audio is being played by Google chrome tabs, and adjusts Spotify playback accordingly. 
 */
function checkAudible() {
    chrome.tabs.query({
        audible: true
    }, function (tabs) {
        if (Array.isArray(tabs) && tabs.length) {
            // There is a tab playing audio
            // Puase music only if it is already playing
            checkPlaying()
            if (isPlaying) {
                var pause_url = "https://api.spotify.com/v1/me/player/pause";
                pause_media(access_token, pause_url, "PUT")
                pausedbyProgram = true;
            }
        } else {
            // Nothing is playing audio
            if (pausedbyProgram) {
                checkPlaying()
                if (!isPlaying) {
                    // Play music only if it is not already playing
                    var play_url = "https://api.spotify.com/v1/me/player/play";
                    pause_media(access_token, play_url, "PUT")
                    pausedbyProgram = !pausedbyProgram
                }
            }
        }
    })
}

/**
 * Function to check that extension is enabled before checking tabs for audio
 */
function performCheck() {
    if (extensionEnabled) {
        checkAudible();
    }
}

setInterval(performCheck, 2000);


//      *** Need to add device specific spotify controls *** 


/**
 * Function for handling HTTP requests
 * 
 * @param {String} access_token - Access token for HTTP request
 * @param {String} url - URL for HTTP request
 * @param {String} type - HTTP Method to use
 * @param {Function} callback - Callback function to pass responsetext to.
 */
function pause_media(access_token, url, type, callback) {

    var xhr = new XMLHttpRequest();
    xhr.open(type, url);

    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("Authorization", `Bearer ${access_token}`);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            console.log(xhr.status);
            if (callback) {
                callback(xhr.responseText)
            }
        }
    };

    xhr.send();
}