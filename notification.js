// ---------- Firebase Config ----------
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

const notifContainer = document.querySelector(".notif-container");
const loader = document.querySelector(".notif-loader"); // loader select करें
let firstLoad = true;

firebase.auth().onAuthStateChanged(user => {
  if (!user) {
    loader.style.display = "none"; // loader hide
    notifContainer.innerHTML = "<p>Please login to see notifications.</p>";
    return;
  }

  const currentUid = user.uid;
  const notifRef = firebase.database()
  .ref(`notifications/${currentUid}`)
  .orderByChild("timestamp");


  loader.style.display = "flex"; // loader दिखाएँ

  notifRef.on("child_added", async snapshot => {
    const n = snapshot.val();
    if (!n) return;

    // Sender data fetch
    const senderSnap = await firebase.database().ref(`users/${n.fromUid}`).once("value");
    const sender = senderSnap.val();


    // 🔐 FALLBACK FOR GUEST / MISSING USER


const fallbackName = n.from || "Guest";
const fallbackImage = n.profileImage || "images/default.jpg";

const profileImg = sender?.photoURL || fallbackImage;
const senderName =
  ((sender?.name || "") + (sender?.surname ? " " + sender.surname : "")).trim() || fallbackName;

// 🔥 badge sirf tab dikhe jab DB me verified === true ho
const isVerified = sender && sender.verified === true;

    const text = n.text || "New notification";
   

let actionText = "";

if (n.type === "follow") actionText = "started following you";
else if (n.type === "like") actionText = "liked your video";
else if (n.type === "comment") actionText = `commented: "${n.commentText || ""}"`;
else actionText = n.text || "sent you a notification";

    let iconClass = "fa-solid fa-bell";
    if (n.type === "follow") iconClass = "fa-solid fa-user-plus";
    else if (n.type === "like") iconClass = "fa-solid fa-heart";
    else if (n.type === "comment") iconClass = "fa-solid fa-comment";

    const div = document.createElement("div");
    div.className = "notif-item";
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.gap = "10px";
    div.style.cursor = "pointer";
    div.style.marginBottom = "10px";
    div.style.padding = "10px";
    div.style.borderRadius = "10px";
    div.style.background = "#111";

    const videoThumb = n.thumb || "images/default.jpg";
const commentText = n.commentText || "";

const showVideoThumb = n.type !== "follow"; // ❌ follow pe image mat dikhao

div.innerHTML = `
  <img src="${profileImg}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">

  <div style="display:flex; flex-direction:column; justify-content:center; flex:1;">
    <div style="display:flex; align-items:center; gap:4px; font-weight:600;">
      ${senderName || "Someone"}
      ${isVerified ? '<img src="https://upload.wikimedia.org/wikipedia/commons/e/e4/Twitter_Verified_Badge.svg" style="width:14px; height:14px;">' : ''}
    </div>

    <div style="font-size:13px; opacity:0.75;">
      ${actionText}
    </div>
  </div>

  ${showVideoThumb ? `<img src="${videoThumb}" style="width:42px; height:42px; object-fit:cover; border-radius:6px;">` : ``}
  <i class="${iconClass}"></i>
`;




    div.addEventListener("click", () => {
      window.location.href = `user.html?uid=${n.fromUid}`;
    });

    notifContainer.prepend(div);

    firebase.database()
  .ref(`notifications/${currentUid}/${snapshot.key}`)
  .update({ read: true });


    loader.style.display = "none"; // नोटिफ़िकेशन आने के बाद loader hide करें
  });
});


  

// ----------------------
// NAVIGATION
// ----------------------
document.getElementById("btnHome").addEventListener("click", () => window.location.href = "index.html");
document.getElementById("btnSearch").addEventListener("click", () => window.location.href = "search.html");
document.getElementById("btnNotifs").addEventListener("click", () => window.location.href = "notification.html");
document.getElementById("btnProfile").addEventListener("click", () => window.location.href = "profile.html");
document.getElementById("btnUpload").addEventListener("click", () => window.location.href = "upload.html");

