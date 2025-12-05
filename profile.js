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

// --- Navigation redirects (same as your original) ---
document.getElementById("btnHome").addEventListener("click", () => window.location.href = "index.html");
document.getElementById("btnSearch").addEventListener("click", () => window.location.href = "search.html");
document.getElementById("btnNotifs").addEventListener("click", () => window.location.href = "notification.html");
document.getElementById("btnProfile").addEventListener("click", () => window.location.href = "profile.html");
document.getElementById("btnUpload").addEventListener("click", () => window.location.href = "upload.html");











// ---------- Google Login ----------
googleLoginBtn.onclick = () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider).then(res => {
    currentUser = res.user;
    checkUserSetup();
  }).catch(err => alert(err.message));
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
  
  // ✅ Username + verify badge
  if (data.verified === true) {
       displayUsername.innerHTML = `
        <div style="
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 5px;
            width: 100%;
        ">
            @${data.username || ""}
            <img 
                src="https://upload.wikimedia.org/wikipedia/commons/e/e4/Twitter_Verified_Badge.svg" 
                style="width:16px; height:16px;"
            >
        </div>
    `;
  } else {
    displayUsername.innerText = "@" + (data.username || "");
  }

  profilePic.src = data.photoURL || currentUser.photoURL || "default.jpg";

  // followers / following counts
  firebase.database().ref("followers/" + (data.uid || currentUser.uid)).once("value")
    .then(snap => followersCount.innerText = snap ? snap.numChildren() : 0)
    .catch(()=> followersCount.innerText = 0);

  firebase.database().ref("following/" + (data.uid || currentUser.uid)).once("value")
    .then(snap => followingCount.innerText = snap ? snap.numChildren() : 0)
    .catch(()=> followingCount.innerText = 0);
}


// --- Upload profile photo (edit photo only) ---
uploadPhoto.onchange = async function(e) {
    const file = uploadPhoto.files[0];
    if (!file || !currentUser) return;

    try {
        // Safe file name
        const safeFileName = file.name.replace(/[^\w\-\.]/g, '_').substring(0, 100);
        const filePath = `profilePics/${currentUser.uid}_${safeFileName}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabaseClient
            .storage
            .from("Zarvio") // your Supabase bucket name
            .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: publicURL } = supabaseClient
            .storage
            .from("Zarvio")
            .getPublicUrl(filePath);

        const profileUrl = publicURL.publicUrl;

        // ✅ Update Firebase user table photoURL
        await firebase.database().ref("users/" + currentUser.uid + "/photoURL").set(profileUrl);

        // Update front-end immediately
        profilePic.src = profileUrl;
        alert("Profile photo updated successfully!");

    } catch (err) {
        console.error(err);
        alert("Profile photo upload failed!");
    }
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