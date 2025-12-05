// ---- Firebase Init ----
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
const searchBtn = document.getElementById("searchBtn");
const verifyBtn = document.getElementById("verifyBtn");
const userIdInput = document.getElementById("userIdInput");
const resultBox = document.getElementById("resultBox");
const userImg = document.getElementById("userImg");
const userName = document.getElementById("userName");
const verifyBadge = document.getElementById("verifyBadge");

let searchedUID = null;
let isVerified = false;

// ----------------- SEARCH USER -----------------
searchBtn.addEventListener("click", async () => {
    const uid = userIdInput.value.trim();
    if (!uid) return alert("Enter user UID");

    searchedUID = uid;

    const snap = await firebase.database().ref("users/" + uid).once("value");

    if (!snap.exists()) {
        alert("User not found");
        return;
    }

    const data = snap.val();
    isVerified = data.verified === true;

    // Show info
    userImg.src = data.photoURL || "default.jpg";
    userName.innerText = data.username || "Unknown";

    resultBox.classList.remove("hidden");
    verifyBtn.classList.remove("hidden");

    // Update button & badge
    if (isVerified) {
        verifyBadge.classList.remove("hidden");
        verifyBtn.innerText = "Remove Verify Badge";
    } else {
        verifyBadge.classList.add("hidden");
        verifyBtn.innerText = "Add Verify Badge";
    }
});

// ----------------- TOGGLE VERIFY BADGE -----------------
verifyBtn.addEventListener("click", async () => {
    if (!searchedUID) return;

    // Toggle verified status
    isVerified = !isVerified;

    await firebase.database().ref("users/" + searchedUID).update({
        verified: isVerified
    });

    if (isVerified) {
        verifyBadge.classList.remove("hidden");
        verifyBtn.innerText = "Remove Verify Badge";
        alert("User Verified Successfully!");
    } else {
        verifyBadge.classList.add("hidden");
        verifyBtn.innerText = "Add Verify Badge";
        alert("User Verification Removed!");
    }
});

// ----------------- DISPLAY PROFILE PAGE -----------------
function displayProfile(uid) {
    firebase.database().ref("users/" + uid).once("value").then(snapshot => {
        if(snapshot.exists()) {
            const u = snapshot.val();
            console.log(u); // debug

            document.getElementById("profilePhoto").src = u.photoURL || "default.jpg";

            const usernameBox = document.getElementById("username");
            if(u.verified === true) {
                usernameBox.innerHTML = `
                    <div style="display:flex; justify-content:center; align-items:center; gap:4px; width:100%;">
                        @${u.username} <img src="https://upload.wikimedia.org/wikipedia/commons/e/e4/Twitter_Verified_Badge.svg" style="width:16px;height:16px;">
                    </div>
                `;
            } else {
                usernameBox.innerHTML = `<div style="text-align:center; width:100%;">@${u.username}</div>`;
            }

            document.getElementById("name").innerText = (u.name || "") + " " + (u.surname || "");
        }
    });
}
