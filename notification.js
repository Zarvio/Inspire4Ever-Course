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

function renderNotifications() {

  notifToday.innerHTML = "";
  notifYesterday.innerHTML = "";
  notifOlder.innerHTML = "";

  notifBuffer.sort((a, b) => b.data.timestamp - a.data.timestamp);

  notifBuffer.forEach(item => {
    const section = getNotifSection(item.data.timestamp);
    if (section === "today") notifToday.appendChild(item.element);
    else if (section === "yesterday") notifYesterday.appendChild(item.element);
    else notifOlder.appendChild(item.element);
  });

  updateSectionVisibility();
}


function getNotifSection(timestamp) {
  const notifDate = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (notifDate.toDateString() === today.toDateString()) return "today";
  if (notifDate.toDateString() === yesterday.toDateString()) return "yesterday";
  return "older";
}
function updateSectionVisibility() {
  document.querySelectorAll(".notif-section").forEach(section => {
    const list = section.querySelector("div");
    if (list.children.length === 0) {
      section.style.display = "none";
    } else {
      section.style.display = "block";
    }
  });
}
function timeAgo(timestamp) {
  const now = Date.now();
  const seconds = Math.floor((now - timestamp) / 1000);

  if (seconds < 10) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}



const notifToday = document.getElementById("notifToday");
const notifYesterday = document.getElementById("notifYesterday");
const notifOlder = document.getElementById("notifOlder");
const noNotifText = document.getElementById("noNotifText");

const loader = document.querySelector(".notif-loader"); // loader select करें
const notifContainer = document.querySelector(".notif-container");

let firstLoad = true;
let notifBuffer = [];

firebase.auth().onAuthStateChanged(user => {
  updateSectionVisibility();

  notifContainer.style.display = "none";
loader.style.display = "flex";

  if (!user) {
    loader.style.display = "none";
notifContainer.style.display = "block";

    notifContainer.innerHTML = "<p>Please login to see notifications.</p>";
    return;
  }

  const currentUid = user.uid;
  const notifRef = firebase.database()
  .ref(`notifications/${currentUid}`)
  .orderByChild("timestamp")
  .limitToLast(50);
notifRef.once("value", snap => {

  loader.style.display = "none";
  notifContainer.style.display = "block";

  if (!snap.exists()) {
    noNotifText.style.display = "block";
  } else {
    noNotifText.style.display = "none";
  }

});


  loader.style.display = "flex"; // loader दिखाएँ

  notifRef.on("child_added", async snapshot => {
    noNotifText.style.display = "none";

    const n = snapshot.val();
    if (!n.timestamp) return;

    if (!n) return;

    // Sender data fetch
    const senderSnap = await firebase.database().ref(`users/${n.fromUid}`).once("value");
    const sender = senderSnap.val();


    // 🔐 FALLBACK FOR GUEST / MISSING USER


const fallbackName = n.from || "Guest";
const fallbackImage = n.profileImage || "default.jpg";

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

    const videoThumb = n.thumb || "default.jpg";
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
  ${actionText} · <span style="color:#aaa;">${timeAgo(n.timestamp)}</span>
</div>

  </div>

  ${showVideoThumb ? `<img src="${videoThumb}" style="width:42px; height:42px; object-fit:cover; border-radius:6px;">` : ``}
  <i class="${iconClass}"></i>
`;




    div.addEventListener("click", () => {
      window.location.href = `user.html?uid=${n.fromUid}`;
    });

    notifBuffer.push({ data: n, element: div });
renderNotifications();



    firebase.database()
  .ref(`notifications/${currentUid}/${snapshot.key}`)
  .update({ read: true });


    loader.style.display = "none";
notifContainer.style.display = "block";

  });
});


  

// ----------------------
// NAVIGATION
// ----------------------
document.getElementById("btnHome").addEventListener("click", () => window.location.href = "main.html");
document.getElementById("btnSearch").addEventListener("click", () => window.location.href = "search.html");
document.getElementById("btnNotifs").addEventListener("click", () => window.location.href = "notification.html");
document.getElementById("btnProfile").addEventListener("click", () => window.location.href = "profile.html");
document.getElementById("btnUpload").addEventListener("click", () => window.location.href = "upload.html");

