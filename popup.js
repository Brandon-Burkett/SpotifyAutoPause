/**
 * Updates what div's are shown based on login status and if the extension is enabled.
 */
function updateStatus() {
  var node1 = document.getElementById("notLoggedIn");
  var node2 = document.getElementById("LoggedIn");
  var node3 = document.getElementById("enabled");
  var node4 = document.getElementById("disabled");

  // If logged in
  if (chrome.extension.getBackgroundPage().getLoginStatus()) {
    node2.style.visibility = "visible";
    node2.style.display = "";
    node1.style.visibility = "hidden";
    node1.style.display = "none";

    // If extension enabled
    if (chrome.extension.getBackgroundPage().getExtensionEnabled()) {
      node3.style.visibility = "visible";
      node3.style.display = "";
      node4.style.visibility = "hidden";
      node4.style.display = "none";
    } else { // If disabled
      node4.style.visibility = "visible";
      node4.style.display = "";
      node3.style.visibility = "hidden";
      node3.style.display = "none";
    }

  } else { // If logged out
    node1.style.visibility = "visible";
    node1.style.display = "";
    node2.style.visibility = "hidden";
    node2.style.display = "hidden";

    node3.style.visibility = "hidden";
    node3.style.display = "none";
    node4.style.visibility = "hidden";
    node4.style.display = "none";
  }
}
updateStatus(); // Initial display

// Event listeners for buttons
document.getElementById('login').addEventListener('click', handleLogin);
document.getElementById('enableBtn').addEventListener('click', handleEnable);
document.getElementById('disableBtn').addEventListener('click', handleDisable);
document.getElementById('logout').addEventListener('click', handleLogout);



/** 
 * Authenticates the user using Spotify, returns an access token to the callback.
 */
function handleLogin() {
  var url = "https://accounts.spotify.com/authorize"
  var client_id = "f157802132604174a06f70478d857820"
  var response_type = "token"
  var redirect_uri = chrome.identity.getRedirectURL('oauth2')
  var scope = "user-modify-playback-state%20user-read-playback-state"
  // Maybe add state

  var request_url = url + "?client_id=" + client_id + "&response_type=" + response_type +
    "&redirect_uri=" + redirect_uri + "&scope=" + scope // Spotify URL

  chrome.identity.launchWebAuthFlow({
      'url': request_url,
      'interactive': true
    },
    (redirect_url) => {
      var access_token = new URLSearchParams(new URL(redirect_url).hash.replace("#", "?")).get('access_token'); // Parse url for access token
      chrome.extension.getBackgroundPage().login(access_token); // Send the login info to background page
      updateStatus(); // Update the DOM
    }
  )
}

/**
 * Set the extensions state to be disabled on the background page and update the DOM
 */
function handleDisable() {
  chrome.extension.getBackgroundPage().disableExtension();
  updateStatus();
}

/**
 * Set the extensions state to be disabled on the background page and update the DOM
 */
function handleEnable() {
  chrome.extension.getBackgroundPage().enableExtension();
  updateStatus();
}

/**
 * Logs the user out and disables the extension, and updates the DOM.
 */
function handleLogout() {
  chrome.extension.getBackgroundPage().logout();
  handleDisable();
}