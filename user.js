// ---------- Firebase Config (same as your project) ----------
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
const profilePic = document.getElementById("profilePic");
const displayName = document.getElementById("displayName");
const displayUsername = document.getElementById("displayUsername");
const followersCount = document.getElementById("followersCount");
const followingCount = document.getElementById("followingCount");
const loaderOverlay = document.getElementById("loaderOverlay");
const profileContent = document.getElementById("profileView");

// UID from URL
const params = new URLSearchParams(window.location.search);
const profileUid = params.get("uid");

if (!profileUid) {
  alert("Invalid user.");
}

// Wait for auth
firebase.auth().onAuthStateChanged(async user => {
  if (!user) {
    loaderOverlay.style.display = "none";
    profileContent.style.display = "none";
    alert("Please login first.");
    return;
  }

  loaderOverlay.style.display = "flex";
  profileContent.style.display = "none";

  try {
    const snapshot = await firebase.database().ref("users/" + profileUid).once("value");
    if (!snapshot.exists()) {
      alert("User profile not found");
      return;
    }

    const data = snapshot.val();
    displayName.innerText = (data.name || "") + (data.surname ? " " + data.surname : "");
    displayUsername.innerText = "@" + (data.username || "");
    profilePic.src = data.photoURL || "default.jpg";
// Display username + verified badge
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

    displayUsername.innerHTML = `
        <div style="text-align:center; width:100%;">
            @${data.username || ""}
        </div>
    `;

}


    // followers / following
    const followersSnap = await firebase.database().ref("followers/" + profileUid).once("value");
    followersCount.innerText = followersSnap ? followersSnap.numChildren() : 0;

    const followingSnap = await firebase.database().ref("following/" + profileUid).once("value");
    followingCount.innerText = followingSnap ? followingSnap.numChildren() : 0;

    profileContent.style.display = "block";
  } catch (err) {
    console.error(err);
    alert("Error loading profile");
  } finally {
    loaderOverlay.style.display = "none";
  }
});

// ----------------------
    // NAVIGATION BUTTONS
    // ----------------------
    document.getElementById("btnHome").addEventListener("click", () => {
        window.location.href = "index.html";
    });

    document.getElementById("btnSearch").addEventListener("click", () => {
        window.location.href = "search.html";
    });

    document.getElementById("btnNotifs").addEventListener("click", () => {
        window.location.href = "notification.html";
    });

    document.getElementById("btnProfile").addEventListener("click", () => {
        window.location.href = "profile.html";
    });

    document.getElementById("btnUpload").addEventListener("click", () => {
        window.location.href = "upload.html";
    });



firebase.auth().onAuthStateChanged(user => {
    if (!user) return;

    const currentUid = user.uid;
    const followRef = firebase.database().ref(`followers/${profileUid}/${currentUid}`);

    // LIVE LISTENER → Button auto update hoga
    followRef.on("value", (snap) => {
        if (snap.exists()) {
            followBtn.innerText = "Unfollow";
            followBtn.dataset.following = "yes";
        } else {
            followBtn.innerText = "Follow";
            followBtn.dataset.following = "no";
        }
    });

    // followers count bhi realtime update hoga
    firebase.database()
        .ref(`followers/${profileUid}`)
        .on("value", (snap) => {
            followersCount.innerText = snap.numChildren();
        });
});


followBtn.addEventListener("click", async () => {
    const currentUid = firebase.auth().currentUser.uid;
    const isFollowing = followBtn.dataset.following === "yes";

    const ref = firebase.database().ref(`followers/${profileUid}/${currentUid}`);

    if (isFollowing) {
        await ref.remove(); // unfollow
    } else {
        await ref.set(true); // follow
    }
});

