// ---------- Firebase Config (your existing keys kept) ----------
const firebaseConfig = {
  apiKey: "AIzaSyDUefeJbHKIAs-l3zvFlGaas6VD63vv4kI",
  authDomain: "inspire4ever-c60ad.firebaseapp.com",
  databaseURL: "https://inspire4ever-c60ad-default-rtdb.firebaseio.com",
  projectId: "inspire4ever-c60ad",
  storageBucket: "inspire4ever-c60ad.appspot.com",
  messagingSenderId: "125014633127",
  appId: "1:125014633127:web:d29e4c37628ab637f40982"
};
firebase.initializeApp(firebaseConfig);



// Elements
const loginBox = document.getElementById("loginBox");
const nameBox = document.getElementById("nameBox");
const usernameBox = document.getElementById("usernameBox");
const profileView = document.getElementById("profileView");

const googleLoginBtn = document.getElementById("googleLoginBtn");
const saveNameBtn = document.getElementById("saveNameBtn");
const saveUsernameBtn = document.getElementById("saveUsernameBtn");

const firstName = document.getElementById("firstName");
const lastName = document.getElementById("lastName");
const usernameInput = document.getElementById("username");
const errorMsg = document.getElementById("errorMsg");
const usernameIcon = document.getElementById("usernameIcon");

const profilePic = document.getElementById("profilePic");
const displayName = document.getElementById("displayName");
const displayUsername = document.getElementById("displayUsername");
const followersCount = document.getElementById("followersCount");
const followingCount = document.getElementById("followingCount");
const uploadPhoto = document.getElementById("uploadPhoto");

let currentUser = null;
let tempName = "";
let tempSurname = "";
let usernameAvailable = false;
let usernameCheckTimeout = null;
let videoToDelete = null;

const deletePopup = document.getElementById("deletePopup");
const confirmDeleteBtn = document.getElementById("confirmDelete");
const cancelDeleteBtn = document.getElementById("cancelDelete");


// --- Navigation redirects (same as your original) ---
document.getElementById("btnHome").addEventListener("click", () => window.location.href = "index.html");
document.getElementById("btnSearch").addEventListener("click", () => window.location.href = "search.html");
document.getElementById("btnNotifs").addEventListener("click", () => window.location.href = "notification.html");
document.getElementById("btnProfile").addEventListener("click", () => window.location.href = "profile.html");
document.getElementById("btnUpload").addEventListener("click", () => window.location.href = "upload.html");











// ---------- Google Login ----------
googleLoginBtn.onclick = () => {
  const provider = new firebase.auth.GoogleAuthProvider();

  // Force Google to show account list
  provider.setCustomParameters({
    prompt: "select_account"
  });

  firebase.auth()
    .signInWithPopup(provider)
    .then(res => {
      currentUser = res.user;
      checkUserSetup();
    })
    .catch(err => {
      console.error(err);
      alert("Google login failed!");
    });
};


// onAuthStateChanged -> decide which screen to show
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    checkUserSetup();
  } else {
    // show login
    showOnly(loginBox);
  }
});

// Check if this user already has profile data
function checkUserSetup() {
  if (!currentUser) return;
  firebase.database().ref("users/" + currentUser.uid).once("value")
    .then(snapshot => {
      if (snapshot.exists()) {
        // user already set up — show profile
        loadUserProfile(snapshot.val());
        showOnly(profileView);
      } else {
        // new user => prefill name from Google if available and show name form
        firstName.value = currentUser.displayName ? (currentUser.displayName.split(" ")[0] || "") : "";
        lastName.value = currentUser.displayName ? (currentUser.displayName.split(" ").slice(1).join(" ") || "") : "";
        showOnly(nameBox);
      }
    })
    .catch(err => {
      console.error(err);
      showOnly(loginBox);
    });
}

// --- Save Name button ---
saveNameBtn.onclick = () => {
  const fn = firstName.value.trim();
  const ln = lastName.value.trim();
  if (!fn || !ln) {
    alert("Please enter both first name and surname.");
    return;
  }
  tempName = fn;
  tempSurname = ln;

  // go to username step
  showOnly(usernameBox);
};

// --- Username live-check (debounced) ---
usernameInput.addEventListener("input", (e) => {
  const val = e.target.value.trim().toLowerCase();
  errorMsg.innerText = "";
  usernameAvailable = false;
  setUsernameIcon(null);
  setSaveButtonState(false);

  if (usernameCheckTimeout) clearTimeout(usernameCheckTimeout);
  usernameCheckTimeout = setTimeout(() => validateUsername(val), 500);
});

function validateUsername(val) {
  // basic rules
  if (!val || val.length < 4) {
    errorMsg.innerText = "Username must be at least 4 characters.";
    setUsernameIcon('red');
    return;
  }
  // allow only alphanumeric + underscore + dot
  if (!/^[a-z0-9._]+$/.test(val)) {
    errorMsg.innerText = "Only lowercase letters, numbers, dot and underscore allowed.";
    setUsernameIcon('red');
    return;
  }

  // check DB
  firebase.database().ref("usernames/" + val).once("value")
    .then(snap => {
      if (snap.exists()) {
        // taken
        errorMsg.innerText = "Username already taken!";
        setUsernameIcon('red');
        usernameAvailable = false;
        setSaveButtonState(false);
      } else {
        // available
        errorMsg.innerText = "";
        setUsernameIcon('green');
        usernameAvailable = true;
        setSaveButtonState(true);
      }
    }).catch(err => {
      console.error(err);
      errorMsg.innerText = "Could not check username. Try again.";
      setUsernameIcon('red');
      setSaveButtonState(false);
    });
}

function setUsernameIcon(val) {
  usernameIcon.className = 'status-icon';
  if (val === 'green') usernameIcon.classList.add('green'), usernameIcon.innerHTML = '<i class="fa-solid fa-check"></i>';
  else if (val === 'red') usernameIcon.classList.add('red'), usernameIcon.innerHTML = '<i class="fa-solid fa-xmark"></i>';
  else usernameIcon.innerHTML = '';
}

function setSaveButtonState(enabled) {
  if (enabled) {
    saveUsernameBtn.classList.remove('disabled');
    saveUsernameBtn.disabled = false;
  } else {
    saveUsernameBtn.classList.add('disabled');
    saveUsernameBtn.disabled = true;
  }
}

// --- Save Username (finalize profile) ---
saveUsernameBtn.onclick = () => {
  if (!currentUser) { 
    alert("User not logged in."); 
    return; 
  }

  const username = usernameInput.value.trim().toLowerCase();
  if (!usernameAvailable) { 
    alert("Choose a valid username first."); 
    return; 
  }

  // Data update
  const updates = {};
  updates["/users/" + currentUser.uid] = {
    name: tempName,
    surname: tempSurname,
    email: currentUser.email,
    username: username,
    photoURL: currentUser.photoURL || null,
    createdAt: Date.now()
  };
  updates["/usernames/" + username] = currentUser.uid;

  // ⭐ Only ONE update call (correct)
  firebase.database().ref().update(updates)
    .then(() => {

      // 👉 SHOW POPUP
      document.getElementById("profilePopup").classList.remove("hidden");

      // 👉 BUTTON CLICK → REFRESH TO PROFILE
      document.getElementById("popupBtn").onclick = () => {
        window.location.href = "profile.html";
      };

    })
    .catch(err => {
      console.error(err);
      alert("Could not save profile. Try again.");
    });
};


// --- Load profile UI from DB object ---
function loadUserProfile(data) {
  if (!data) return;

  displayName.innerText = (data.name || "") + (data.surname ? " " + data.surname : "");

  if (data.verified === true) {
    displayUsername.innerHTML = `
      <div style="display:flex; justify-content:center; align-items:center; gap:5px;">
        @${data.username || ""}
        <img src="https://upload.wikimedia.org/wikipedia/commons/e/e4/Twitter_Verified_Badge.svg" style="width:16px; height:16px;">
      </div>
    `;
  } else {
    displayUsername.innerText = "@" + (data.username || "");
  }

  profilePic.src = data.photoURL || currentUser.photoURL || "default.jpg";

  firebase.database().ref("followers/" + (data.uid || currentUser.uid)).once("value")
    .then(snap => followersCount.innerText = snap ? snap.numChildren() : 0);

  firebase.database().ref("following/" + (data.uid || currentUser.uid)).once("value")
    .then(snap => followingCount.innerText = snap ? snap.numChildren() : 0);

  // ✅ Add this part
  const bioEl = document.getElementById("displayBio");
  if (bioEl) {
    bioEl.innerText = data.bio || "";
  }
}



// --- Upload profile photo (edit photo only) ---
// ---------- PROFILE PIC CROP SYSTEM ----------
const cropModal = document.getElementById("cropModal");
const cropCanvas = document.getElementById("cropCanvas");
const zoomRange = document.getElementById("zoomRange");
const ctx = cropCanvas.getContext("2d");

let cropImg = new Image();
let scale = 1;
let posX = 0, posY = 0;
let dragging = false;
let startX = 0, startY = 0;
let minScale = 1;



uploadPhoto.onchange = e => {
  const file = e.target.files[0];
  if (!file || !currentUser) return;

  const reader = new FileReader();
  reader.onload = () => {
    cropImg.src = reader.result;
    

cropImg.onload = () => {
  minScale = Math.max(
    300 / cropImg.width,
    300 / cropImg.height
  );

  scale = minScale;

  zoomRange.min = minScale;
  zoomRange.max = minScale * 4;
  zoomRange.value = scale;

  posX = (300 - cropImg.width * scale) / 2;
  posY = (300 - cropImg.height * scale) / 2;

  cropModal.classList.remove("hidden");
  drawCrop();
};
  };
  reader.readAsDataURL(file);
uploadPhoto.value = "";
};


function drawCrop() {
  ctx.clearRect(0, 0, 300, 300);
  ctx.drawImage(cropImg, posX, posY, cropImg.width * scale, cropImg.height * scale);
}

cropCanvas.onmousedown = e => {
  dragging = true;
  startX = e.offsetX - posX;
  startY = e.offsetY - posY;
};

cropCanvas.onmousemove = e => {
  if (!dragging) return;
  posX = e.offsetX - startX;
  posY = e.offsetY - startY;
  drawCrop();
};

window.onmouseup = () => dragging = false;

function setScale(newScale){
  const prevScale = scale;
  scale = Math.min(minScale * 4, Math.max(minScale, newScale));

  const centerX = 150;
  const centerY = 150;

  posX = centerX - (centerX - posX) * (scale / prevScale);
  posY = centerY - (centerY - posY) * (scale / prevScale);

  zoomRange.value = scale;
  drawCrop();
}

zoomRange.oninput = () => {
  setScale(parseFloat(zoomRange.value));
};




// --- Utility to show only one area at a time ---
function showOnly(el) {
  [loginBox, nameBox, usernameBox, profileView].forEach(x => x.classList.add("hidden"));
  if (el) el.classList.remove("hidden");
}








const loaderOverlay = document.getElementById("loaderOverlay");
const profileContent = document.getElementById("profileView"); // profileView is your main profile div


firebase.auth().onAuthStateChanged(async user => {
  if (user) {
    currentUser = user;

    // Show loader, hide other content
    loaderOverlay.style.display = "flex";
    profileContent.style.display = "none";
    loginBox.style.display = "none";

    try {
      const snapshot = await firebase.database().ref("users/" + user.uid).once("value");
      if (snapshot.exists()) {
        // User already set up → load profile
        const data = snapshot.val();
        loadUserProfile(data);
        profileContent.style.display = "block";
      } else {
        // New user → prefill name form
        firstName.value = currentUser.displayName?.split(" ")[0] || "";
        lastName.value = currentUser.displayName?.split(" ").slice(1).join(" ") || "";
        showOnly(nameBox);
      }
    } catch (err) {
      console.error(err);
      alert("Error loading profile data");
      showOnly(loginBox);
    } finally {
      // Hide loader in all cases
      loaderOverlay.style.display = "none";
    }

  } else {
    // Not logged in → hide loader, show login
    loaderOverlay.style.display = "none";
    profileContent.style.display = "none";
    loginBox.style.display = "block";
  }
});
// URL se UID le lo (search se click hua ho to)
const params = new URLSearchParams(window.location.search);
let profileUid = params.get("uid"); // clicked UID


firebase.auth().onAuthStateChanged(async user => {
  if (!user) {
    // Not logged in → show login
    loaderOverlay.style.display = "none";
    profileContent.style.display = "none";
    loginBox.style.display = "block";
    return;
  }

  // ✅ LOGGED IN USER
  loginBox.style.display = "none";
  profileContent.style.display = "block";
  loaderOverlay.style.display = "none";

  // 🔥 YAHAN CALL KARNA HAI
  loadUserVideos(user.uid);



  currentUser = user;

  // Show loader, hide profile content
  loaderOverlay.style.display = "flex";
  profileContent.style.display = "none";
  loginBox.style.display = "none";

  // URL se UID le lo (agar search se click hua ho to)
  const params = new URLSearchParams(window.location.search);
  let profileUid = params.get("uid") || currentUser.uid; // apni profile default

  try {
    const snapshot = await firebase.database().ref("users/" + profileUid).once("value");
    if (!snapshot.exists()) {
      alert("User profile not found");
      showOnly(loginBox);
      return;
    }

    const data = snapshot.val();
    loadUserProfile(data);
    profileContent.style.display = "block";

    // --- Buttons sirf apni profile ke liye enable kare ---
    const isOwnProfile = (profileUid || "").trim() === (currentUser.uid || "").trim();
    uploadPhoto.disabled = !isOwnProfile;
    saveUsernameBtn.disabled = !isOwnProfile;

    // Agar apni profile hai aur naye user hai → name / username setup
    if (isOwnProfile && !data.username) {
      firstName.value = currentUser.displayName?.split(" ")[0] || "";
      lastName.value = currentUser.displayName?.split(" ").slice(1).join(" ") || "";
      showOnly(nameBox);
    }

  } catch (err) {
    console.error(err);
    alert("Error loading profile data");
    showOnly(loginBox);
  } finally {
    loaderOverlay.style.display = "none";
  }
});


// ---------- Supabase Config ----------
const SUPABASE_URL = "https://lxbojhmvcauiuxahjwzk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4Ym9qaG12Y2F1aXV4YWhqd3prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MzM3NjEsImV4cCI6MjA4MDUwOTc2MX0.xP1QCzWIwnWFZArsk_5C8wCz7vkPrmwmLJkEThT74JA"; // yaha apna anon key dalna
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ----------------------
// 🔧 ADVANCED EDIT PROFILE
// ----------------------
const editProfileBtn = document.getElementById("editProfileBtn");
const editProfileModal = document.getElementById("editProfileModal");
const bioInput = document.getElementById("bioInput");
const newUsernameInput = document.getElementById("newUsernameInput");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const displayBio = document.getElementById("displayBio");

let originalUsername = "";
let usernameOk = true;

// Open modal
editProfileBtn?.addEventListener("click", async () => {
  editProfileModal.classList.remove("hidden");

  const snap = await firebase.database().ref("users/" + currentUser.uid).once("value");
  const data = snap.val();

  originalUsername = data.username || "";
  bioInput.value = data.bio || "";
  newUsernameInput.value = originalUsername;

  usernameOk = true;
  saveProfileBtn.disabled = false;
});

// ------ Live Username Check ------
newUsernameInput?.addEventListener("input", async () => {
  const val = newUsernameInput.value.trim().toLowerCase();

  // Username same as before? OK.
  if (val === originalUsername) {
    usernameOk = true;
    setUsernameStatus("same");
    saveProfileBtn.disabled = false;
    return;
  }

  // Rules
  if (val.length < 4 || !/^[a-z0-9._]+$/.test(val)) {
    usernameOk = false;
    setUsernameStatus("invalid");
    saveProfileBtn.disabled = true;
    return;
  }

  // Check DB
  const check = await firebase.database().ref("usernames/" + val).once("value");
  if (check.exists()) {
    usernameOk = false;
    setUsernameStatus("taken");
    saveProfileBtn.disabled = true;
  } else {
    usernameOk = true;
    setUsernameStatus("ok");
    saveProfileBtn.disabled = false;
  }
});

// ------ UI status icon & messages ------
function setUsernameStatus(type) {
  let msg = "";

  if (!document.getElementById("usernameStatus")) {
    const div = document.createElement("div");
    div.id = "usernameStatus";
    div.style.fontSize = "12px";
    div.style.marginBottom = "5px";
    newUsernameInput.after(div);
  }

  const statusDiv = document.getElementById("usernameStatus");

  if (type === "same") {
    msg = "✔ Username unchanged";
    statusDiv.style.color = "#00ffcc";
  } 
  else if (type === "ok") {
    msg = "✔ Username available";
    statusDiv.style.color = "#00ff66";
  } 
  else if (type === "taken") {
    msg = "✖ Username already taken";
    statusDiv.style.color = "red";
  } 
  else if (type === "invalid") {
    msg = "✖ Invalid username";
    statusDiv.style.color = "orange";
  }

  statusDiv.innerText = msg;
}

// ------ Save Profile ------
saveProfileBtn?.addEventListener("click", async () => {
  const bio = bioInput.value.trim();
  const newUsername = newUsernameInput.value.trim().toLowerCase();

  if (bio.length > 150) return alert("Bio too long!");

  const updates = {};

  // ✅ Always save bio if changed
  updates[`users/${currentUser.uid}/bio`] = bio;

  // ✅ If username changed and valid
  if (newUsername !== originalUsername && usernameOk) {
    // remove old username
    updates[`usernames/${originalUsername}`] = null;

    // save new
    updates[`usernames/${newUsername}`] = currentUser.uid;
    updates[`users/${currentUser.uid}/username`] = newUsername;
  }

  await firebase.database().ref().update(updates);

  // UI Update
  displayBio.innerText = bio;
  editProfileModal.classList.add("hidden");

  
});
// Close / cancel modal
const closeEditModal = document.getElementById("closeEditModal");

closeEditModal?.addEventListener("click", () => {
  editProfileModal.classList.add("hidden");
});

// ✅ Function ko bahar rakho
function showPopup(message) {
  const popup = document.getElementById("customPopup");
  const text = document.getElementById("popupText");

  text.innerText = message;
  popup.classList.remove("hidden");

  setTimeout(() => {
    popup.classList.add("hidden");
  }, 2500);
}

// ✅ Save button logic
saveProfileBtn?.addEventListener("click", async () => {
  const bio = bioInput.value.trim();
  const newUsername = newUsernameInput.value.trim().toLowerCase();

  const updates = {};
  updates[`users/${currentUser.uid}/bio`] = bio;

  if (newUsername !== originalUsername && usernameOk) {
    updates[`usernames/${originalUsername}`] = null;
    updates[`usernames/${newUsername}`] = currentUser.uid;
    updates[`users/${currentUser.uid}/username`] = newUsername;
  }

  await firebase.database().ref().update(updates);

  // ✅ UI update
  displayBio.innerText = bio;
  editProfileModal.classList.add("hidden");

  // ✅ show custom popup
  showPopup("Profile Updated 🎉");
});

// ✅ Close / cancel modal

closeEditModal?.addEventListener("click", () => {
  editProfileModal.classList.add("hidden");
});


async function loadUserVideos(uid) {
  const container = document.getElementById("userVideos");
  container.innerHTML = "<p class='empty-text'>Loading...</p>";

  const { data, error } = await supabaseClient
    .from("pinora823")
    .select("*")
    .eq("uploader_uid", uid)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    container.innerHTML = "<p class='empty-text'>Error loading videos</p>";
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = "<p class='empty-text'>No videos uploaded yet</p>";
    return;
  }

  container.innerHTML = "";

  data.forEach(post => {
    const card = document.createElement("div");
    card.className = "video-card";

    const thumb = document.createElement("img");
    thumb.src = post.thumb_url || post.file_url;

    const playIcon = document.createElement("div");
    playIcon.className = "video-play-icon";
    playIcon.innerHTML = `<i class="fa-solid fa-play"></i>`;

    // 🗑 DELETE BUTTON
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-video-btn";
    deleteBtn.innerHTML = `<i class="fa-solid fa-trash"></i>`;

    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      videoToDelete = post;
      deletePopup.classList.remove("hidden");
    });

    card.appendChild(thumb);
    card.appendChild(playIcon);
    card.appendChild(deleteBtn);

    container.appendChild(card);
  });
}
cancelDeleteBtn.addEventListener("click", () => {
  videoToDelete = null;
  deletePopup.classList.add("hidden");
});
confirmDeleteBtn.addEventListener("click", async () => {
  if (!videoToDelete) return;

  try {
    // 🗑️ DELETE FROM STORAGE
    const filesToDelete = [];

    if (videoToDelete.file_path) {
      filesToDelete.push(videoToDelete.file_path);
    }

    if (videoToDelete.thumb_path) {
      filesToDelete.push(videoToDelete.thumb_path);
    }

    if (filesToDelete.length > 0) {
      await supabaseClient
        .storage
        .from("Zarvio") // ⚠️ bucket name
        .remove(filesToDelete);
    }

    // 🗑️ DELETE FROM TABLE
    const { error } = await supabaseClient
      .from("pinora823")
      .delete()
      .eq("id", videoToDelete.id);

    if (error) throw error;

    // ✅ RESET + REFRESH UI
    deletePopup.classList.add("hidden");
    videoToDelete = null;

    loadUserVideos(firebase.auth().currentUser.uid);

  } catch (err) {
    console.error("Delete failed:", err);
    alert("Failed to delete video");
  }
});



const logoutBtn = document.getElementById("logoutBtn");

logoutBtn?.addEventListener("click", () => {
  firebase.auth().signOut()
    .then(() => {
      // Logout successful → redirect to login page
      window.location.href = "index.html";
    })
    .catch(err => {
      console.error("Logout failed:", err);
      alert("Logout failed. Try again.");
    });
});
document.getElementById("saveCrop").onclick = async () => {
  const out = document.createElement("canvas");
  out.width = 300;
  out.height = 300;
  const octx = out.getContext("2d");

  octx.beginPath();
  octx.arc(150,150,150,0,Math.PI*2);
  octx.closePath();
  octx.clip();

  octx.drawImage(cropCanvas,0,0);

  out.toBlob(async blob => {
    const filePath = `profilePics/${currentUser.uid}_${Date.now()}.png`;


    await supabaseClient.storage.from("Zarvio").upload(filePath, blob, { upsert:true });

    const { data } = supabaseClient.storage.from("Zarvio").getPublicUrl(filePath);
    const url = data.publicUrl;

    await firebase.database().ref("users/"+currentUser.uid+"/photoURL").set(url);
    // 🔥 UPDATE ALL USER POSTS PROFILE IMAGE
await supabaseClient
  .from("pinora823")
  .update({ uploader_image: url })
  .eq("uploader_uid", currentUser.uid);


    profilePic.src = url + "?t=" + Date.now();

    cropModal.classList.add("hidden");
  });
};

document.getElementById("cancelCrop").onclick = () => {
  cropModal.classList.add("hidden");
};
let lastTouchDist = 0;

cropCanvas.addEventListener("touchstart", e => {
  if(e.touches.length === 1){
    dragging = true;
    startX = e.touches[0].clientX - posX;
    startY = e.touches[0].clientY - posY;
  }
  if(e.touches.length === 2){
    lastTouchDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
  }
});

cropCanvas.addEventListener("touchmove", e => {
  e.preventDefault();

  if(e.touches.length === 1 && dragging){
    posX = e.touches[0].clientX - startX;
    posY = e.touches[0].clientY - startY;
    drawCrop();
  }

  if(e.touches.length === 2){
    const dist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    const delta = (dist - lastTouchDist) / 200;
setScale(scale + delta);
lastTouchDist = dist;

  }
},{ passive:false });

cropCanvas.addEventListener("touchend", ()=> dragging=false);
 const followersModal = document.getElementById("followersModal");
const followersList  = document.getElementById("followersList");
const closeFollowers = document.getElementById("closeFollowers");

// Followers count pe click
const followersBtn = document.getElementById("followersBtn");

followersBtn.addEventListener("click", async () => {
  const uid = profileUid || currentUser.uid;

  followersModal.classList.remove("hidden");
  document.querySelector("#followersModal h3").innerText = "Followers";
  followersList.innerHTML = "<p class='empty-text'>Loading...</p>";

  const snap = await firebase.database().ref("followers/" + uid).once("value");

  if (!snap.exists()) {
    followersList.innerHTML = "<p class='empty-text'>No followers yet</p>";
    return;
  }

  followersList.innerHTML = "";
  const followerUids = Object.keys(snap.val());

  for (let fuid of followerUids) {
    const userSnap = await firebase.database().ref("users/" + fuid).once("value");
    if (!userSnap.exists()) continue;

    const user = userSnap.val();
    const verified = user.verified === true;

    const badgeHTML = verified
      ? `<img src="https://upload.wikimedia.org/wikipedia/commons/e/e4/Twitter_Verified_Badge.svg" style="width:14px; height:14px;">`
      : '';

    const div = document.createElement("div");
    div.className = "follower-item";
    div.innerHTML = `
      <img src="${user.photoURL || 'default.jpg'}">
      <div>
        <div style="display:flex; align-items:center; gap:6px;">
          ${user.name || ""} ${user.surname || ""}
          ${badgeHTML}
        </div>
        <small>@${user.username || ""}</small>
      </div>
    `;

    div.onclick = () => {
      window.location.href = "user.html?uid=" + fuid;
    };

    followersList.appendChild(div);
  }
});



// Close modal
closeFollowers.addEventListener("click", () => {
  followersModal.classList.add("hidden");
});
const followingBtn = document.getElementById("followingBtn");

// FOLLOWING LIST OPEN
followingBtn.addEventListener("click", async () => {
  const uid = profileUid || currentUser.uid;

  followersModal.classList.remove("hidden");
  document.querySelector("#followersModal h3").innerText = "Following";
  followersList.innerHTML = "<p class='empty-text'>Loading...</p>";

  const snap = await firebase.database().ref("following/" + uid).once("value");

  if (!snap.exists()) {
    followersList.innerHTML = "<p class='empty-text'>Not following anyone yet</p>";
    return;
  }

  followersList.innerHTML = "";
  const followingUids = Object.keys(snap.val());

  for (let fuid of followingUids) {
    const userSnap = await firebase.database().ref("users/" + fuid).once("value");
    if (!userSnap.exists()) continue;

    const user = userSnap.val();
    const verified = user.verified === true;

    const badgeHTML = verified
      ? `<img src="https://upload.wikimedia.org/wikipedia/commons/e/e4/Twitter_Verified_Badge.svg" style="width:14px; height:14px;">`
      : '';

    const div = document.createElement("div");
    div.className = "follower-item";
    div.innerHTML = `
      <img src="${user.photoURL || 'default.jpg'}">
      <div>
        <div style="display:flex; align-items:center; gap:6px;">
          ${user.name || ""} ${user.surname || ""}
          ${badgeHTML}
        </div>
        <small>@${user.username || ""}</small>
      </div>
    `;

    div.onclick = () => {
      window.location.href = "user.html?uid=" + fuid;
    };

    followersList.appendChild(div);
  }
});
