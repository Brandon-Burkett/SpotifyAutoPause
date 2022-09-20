chrome.runtime.sendMessage({ message: "get_status" }, (response) => {
  console.log(response);
  updateStatus(response);
});

/**
 * Updates what div's are shown based on login status and if the extension is enabled.
 */
function updateStatus(response) {
  var image = document.querySelector(".playback-info__image");
  image.src = response.image_url;
  var title = document.querySelector(".playback-info__title");
  title.innerHTML = response.title;
  var artist = document.querySelector(".playback-info__artist");
  artist.innerHTML = response.artist;
  // var album = document.querySelector(".playback-info__album");
  // album.innerHTML = response.album;
  // var status = document.querySelector(".status");
  // status.innerHTML = response.status;
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
    } else {
      // If disabled
      node4.style.visibility = "visible";
      node4.style.display = "";
      node3.style.visibility = "hidden";
      node3.style.display = "none";
    }
  } else {
    // If logged out
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

var playbutton = document.querySelector(".playback-controls__play");
playbutton.addEventListener("click", () => {
  chrome.runtime.sendMessage({ message: "play" }, (response) => {
    console.log(response);
  });
});
var pausebutton = document.querySelector(".playback-controls__pause");
pausebutton.addEventListener("click", () => {
  chrome.runtime.sendMessage({ message: "pause" }, (response) => {
    console.log(response);
  });
});

// Event listeners for buttons
document.getElementById("login").addEventListener("click", () => {
  chrome.runtime.sendMessage({ message: "handleLogin" }, (response) => {
    console.log(response);
    updateStatus(response);
  });
});
document.getElementById("enableBtn").addEventListener("click", () => {
  chrome.runtime.sendMessage({ message: "enable" }, (response) => {
    console.log(response);
    updateStatus(response);
  });
});
document.getElementById("disableBtn").addEventListener("click", () => {
  chrome.runtime.sendMessage({ message: "disable" }, (response) => {
    console.log(response);
    updateStatus(response);
  });
});
document.getElementById("logout").addEventListener("click", () => {
  chrome.runtime.sendMessage({ message: "logout" }, (response) => {
    console.log(response);
    updateStatus(response);
  });
});

/**
 * Set the extensions state to be disabled on the background page and update the DOM
 */
// function handleDisable() {
//   chrome.extension.getBackgroundPage().disableExtension();
//   updateStatus();
// }

// /**
//  * Set the extensions state to be disabled on the background page and update the DOM
//  */
// function handleEnable() {
//   chrome.extension.getBackgroundPage().enableExtension();
//   updateStatus();
// }

// /**
//  * Logs the user out and disables the extension, and updates the DOM.
//  */
// function handleLogout() {
//   chrome.extension.getBackgroundPage().logout();
//   handleDisable();
// }
