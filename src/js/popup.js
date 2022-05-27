chrome.runtime.sendMessage({message: "get_status"}, (response) => {
  console.log(response);
  updateStatus(response);
})

/**
 * Updates what div's are shown based on login status and if the extension is enabled.
 */
function updateStatus(response) {
  var node1 = document.getElementById("notLoggedIn");
  var node2 = document.getElementById("LoggedIn");
  var node3 = document.getElementById("enabled");
  var node4 = document.getElementById("disabled");

  // If logged in
  if (response.loggedIn) {
    node2.style.visibility = "visible";
    node2.style.display = "";
    node1.style.visibility = "hidden";
    node1.style.display = "none";

    // If extension enabled
    if (response.enabled) {
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


// Event listeners for buttons
document.getElementById('login').addEventListener('click', () => {
  chrome.runtime.sendMessage({message: "handleLogin"});
});
document.getElementById('enableBtn').addEventListener('click', handleEnable);
document.getElementById('disableBtn').addEventListener('click', handleDisable);
document.getElementById('logout').addEventListener('click', handleLogout);


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