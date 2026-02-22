// ---------- (chatonkrna wla ) 127 number pr h ----------

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

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

// ---------- Supabase Config ----------
const SUPABASE_URL = "https://apewbmwwgobliozdollx.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwZXdibXd3Z29ibGlvemRvbGx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MDc4MzksImV4cCI6MjA4Njk4MzgzOX0.8wm8Rpis6W13ZJeavfY-ijicXj57A_1ycYu3heVX5X8";
const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// 🔥 track downloaded media (local)
let downloadedMedia = JSON.parse(
  localStorage.getItem("downloadedMedia") || "{}"
);

// ---------- Variables ----------
let pushLock = false;   // 🔥 firebase double push fix
let currentUser=null;
let selectedUser=null;
let replyTo=null;
let typingDiv = null;
let currentUsername = "";
let chatRef = null;
let typingRef = null;
let sendingLock = false;
let selectedGroup = null;   
let chatRefListener = null;
let typingRefListener = null;
let groupRefListener = null;


function clearAllListeners(){

  if(chatRefListener){
    chatRefListener.off();
    chatRefListener = null;
  }

  if(typingRefListener){
    typingRefListener.off();
    typingRefListener = null;
  }

  if(groupRefListener){
    groupRefListener.off();
    groupRefListener = null;
  }
if(typingDiv){
  typingDiv.remove();
  typingDiv = null;
}

}


// ---------- Elements ----------
const chatListScreen=document.getElementById("chatListScreen");
const chatScreen=document.getElementById("chatScreen");
const chatList=document.getElementById("chatList");
const chatBox=document.getElementById("chatBox");
const msgInput=document.getElementById("msgInput");
const sendBtn=document.getElementById("sendBtn");
const replyBox=document.getElementById("replyBox");
const typingIndicator=document.getElementById("typingIndicator");
// ---------- Typing Indicator logic ----------
// ---------- Typing Indicator logic ----------
// Typing start: user type kar raha hai
msgInput.addEventListener("input", () => {
  

  // 🔹 SINGLE CHAT
  if(selectedUser){
    const chatId = getChatId(currentUser, selectedUser);
    firebase.database().ref(`typing/${chatId}/${currentUser}`).set(true);
  }

  // 🔹 GROUP CHAT
  if(selectedGroup){
    firebase.database().ref(`groupTyping/${selectedGroup}/${currentUser}`).set(true);
  }

});


// Typing stop: input blur ya enter press
msgInput.addEventListener("blur", () => {

  if(selectedUser){
    const chatId = getChatId(currentUser, selectedUser);
    firebase.database().ref(`typing/${chatId}/${currentUser}`).set(false);
  }

  if(selectedGroup){
    firebase.database().ref(`groupTyping/${selectedGroup}/${currentUser}`).set(false);
  }

});


const chatDivMap = {}; // ye track karega har chatId ka div

// ---------- Auth ----------
firebase.auth().onAuthStateChanged(user=>{
firebase.database().ref("users/" + currentUser).once("value").then(snap => {
    const userData = snap.val();
    if(userData){
        currentUsername = userData.username || "User";
    }
});




// ---------- (chatoffkrna wla )chatListScreen.style.display = "none";----------





  if(!user){location.href="profile.html";return;}
  currentUser=user.uid;
  // ---------- USER PRESENCE ----------
const userStatusRef = firebase.database().ref("users/" + currentUser);

// user online
userStatusRef.update({
  online: true,
  lastSeen: Date.now()
});

// disconnect detect
firebase.database().ref(".info/connected").on("value", snap => {
  if (snap.val() === false) return;

  userStatusRef.onDisconnect().update({
    online: false,
    lastSeen: Date.now()
  });
});


  // ✅ URL se uid read karo
  const params = new URLSearchParams(window.location.search);
  const openUid = params.get("uid");


loadChatList();


// loadChatList();  // चैट लिस्ट बंद





  // ✅ agar uid mila to direct chat open karo
  if(openUid){
    setTimeout(()=>{
      openChat(openUid);
    }, 300);
  }
});

// ---------- Load Chat List ----------
function loadChatList(){
  document.getElementById("chatSkeleton").style.display="block";

  firebase.database().ref("chats").on("value",snap=>{
    
    document.getElementById("chatSkeleton").style.display="none";
    const chats=snap.val(); if(!chats) return;

    const sorted=Object.entries(chats).sort(
      (a,b)=>Object.values(b[1]).pop().time - Object.values(a[1]).pop().time
    );

    sorted.forEach(([chatId,msgs])=>{
      if(!chatId.includes(currentUser)) return;

      const other=chatId.split("_").find(i=>i!==currentUser);
      const last=Object.values(msgs).pop();

      let div;
if(chatDivMap[chatId]){
    // 🔹 Already list me hai → update innerHTML
    div = chatDivMap[chatId];
} else {
    // 🔹 Naya chat → create new div aur prepend
    div = document.createElement("div");
    div.className = "chat-item"; // default class, unread baad me add hoga
    chatDivMap[chatId] = div;
    chatList.prepend(div); // latest chat top
}


      // 🔥 user data fetch
firebase.database().ref("users/"+other).once("value").then(userSnap=>{
  const userData = userSnap.val() || {};

  // 🔥 Count unread messages for this chat
  // 🔥 Count unread messages for this chat
firebase.database().ref(`chats/${chatId}`).once("value").then(chatSnap => {
  const msgsData = chatSnap.val() || {};
  let unreadCount = 0;

  Object.values(msgsData).forEach(m => {
      if(m.sender !== currentUser && !m.read) unreadCount++;
  });

  // Decide text to show
  let unreadText = "";
  if(unreadCount === 1) unreadText = "1 new message";
  else if(unreadCount > 1 && unreadCount < 4) unreadText = `${unreadCount} new message`;
  else if(unreadCount >= 4) unreadText = "4+ new message";

  // last message agar new nahi hai, text show karna
 const lastText = last.text || (last.media ? "📷 Media" : "");

  // 🔥 UPLOADING STATE


  div.innerHTML = `
    <img src="${userData.photoURL || 'dp.jpg'}">
    <div>
      <div style="font-size:14px;font-weight:600; display:flex; align-items:center; gap:4px;">
        @${userData.username || 'User'}
        ${userData.verified ? '<img src="https://upload.wikimedia.org/wikipedia/commons/e/e4/Twitter_Verified_Badge.svg" style="width:16px;height:16px;">' : ''}
      </div>
      <div class="chat-last">
        ${unreadText || lastText}
      </div>
    </div>
    ${unreadCount > 0 ? '<span class="dot"></span>' : ''}
  `;
});

});


      div.onclick = () => {
    // Open chat
    openChat(other);

    // Agar last message unread aur sender samne wala hai
    if(last.sender !== currentUser && !last.read){
        // Update Firebase → read = true
        const chatId = getChatId(currentUser, other);
        firebase.database().ref(`chats/${chatId}`).once("value").then(snap => {
            const msgs = snap.val();
            const lastKey = Object.keys(msgs).pop();
            firebase.database().ref(`chats/${chatId}/${lastKey}`).update({
  read: true,
  readTime: Date.now()
});

        });
    }
};

      
    });
  });

  // 🔥 LOAD GROUPS ALSO
  firebase.database().ref("groups").on("value", snap => {

    snap.forEach(child => {

      const group = child.val();
      const groupId = child.key;

      if(group.members && group.members[currentUser]){

        let div;

        if(chatDivMap[groupId]){
            div = chatDivMap[groupId];
        } else {
            div = document.createElement("div");
            div.className = "chat-item";
            chatDivMap[groupId] = div;
            chatList.prepend(div);
        }

        // 🔥 COUNT UNREAD GROUP MESSAGES
firebase.database().ref("groupChats/"+groupId).on("value", chatSnap => {


  const msgs = chatSnap.val() || {};
  let unreadCount = 0;

  Object.entries(msgs).forEach(([key, m]) => {

    // Agar message mera nahi hai
    if(m.sender !== currentUser){

      // Agar seenBy me currentUser nahi hai
      if(!m.seenBy || !m.seenBy[currentUser]){
        unreadCount++;
      }
    }

  });

  let unreadText = "";
  if(unreadCount === 1) unreadText = "1 new message";
  else if(unreadCount > 1 && unreadCount < 4) unreadText = `${unreadCount} new message`;
  else if(unreadCount >= 4) unreadText = "4+ new message";

  div.innerHTML = `
   <img src="${group.groupImg || 'group.jpg'}">
   <div>
     <div style="font-size:14px;font-weight:600;">
       👥 ${group.groupName}
     </div>
     <div class="chat-last">
       ${unreadText || "Group chat"}
     </div>
   </div>
   ${unreadCount > 0 ? '<span class="dot"></span>' : ''}
  `;

});


        div.onclick = () => {
            openGroupChat(groupId);
        };

      }

    });

  });

}

// ---------- Open Chat ----------
function openChat(uid){
  clearAllListeners();  
  document.getElementById("leaveGroupBtn").style.display = "none";
    selectedGroup = null;   // ⭐⭐⭐ ADD THIS LINE
   hideReplyBox();   // 🔥 yaha add karo
  selectedUser = uid;
  // 🔥 LIVE ONLINE / OFFLINE STATUS
firebase.database().ref("users/" + selectedUser).on("value", snap => {
  const u = snap.val();
  if (!u) return;

  const statusEl = document.getElementById("userStatus");
  if (!statusEl) return;

  if (u.online) {
    statusEl.innerHTML = `<span class="green-dot"></span> online`;
  } else {
    statusEl.innerHTML =
      `<span class="gray-dot"></span> offline ${lastSeenText(u.lastSeen)}`;
  }
});

  history.pushState({}, "", "");
  chatListScreen.style.display = "none";
  chatScreen.classList.remove("hidden");
  loadMessages();
// 🔹 Restore last seen message after chat opens
const chatId = getChatId(currentUser, uid);
firebase.database().ref(`chats/${chatId}`).once("value").then(snap => {
    const msgs = snap.val();
    if(!msgs) return;

    // 🔹 find last read message sent by currentUser
    let lastReadMsgKey = null;
    Object.keys(msgs).forEach(key => {
        const m = msgs[key];
        if(m.sender === currentUser && m.read && m.readTime){
            lastReadMsgKey = key;
        }
    });

    if(lastReadMsgKey){
        const div = msgDivMap[lastReadMsgKey];
        if(div){
            showSeen(div, msgs[lastReadMsgKey].readTime);
            lastSeenMsgDiv = div;
        }
    }
});

  // ✅ Firebase user fetch
  const chatUserName = document.getElementById("chatUserName");
  const chatUserImg = document.getElementById("chatUserImg");

  firebase.database().ref("users/" + uid).once("value").then(snap => {
    const statusDiv = document.getElementById("chatUserStatus");

firebase.database().ref("users/" + uid).on("value", snap => {
  const u = snap.val();
  if(!u) return;

  if(u.online){
    statusDiv.className = "user-status online";
    statusDiv.innerHTML = `<span class="dot"></span> online`;
  }else{
    statusDiv.className = "user-status";
    statusDiv.innerHTML = `<span class="dot"></span> ${lastSeenText(u.lastSeen)}`;
  }
});

      const userData = snap.val() || {};

      chatUserName.innerHTML = `
        <div style="display:flex; align-items:center; gap:4px;">
          @${userData.username || "User"}
          ${userData.verified ? '<img src="https://upload.wikimedia.org/wikipedia/commons/e/e4/Twitter_Verified_Badge.svg" style="width:16px;height:16px;">' : ''}
        </div>
      `;

      chatUserImg.src = userData.photoURL || "dp.jpg";

      document.getElementById("chatUserInfo").onclick = function(){
          // ✅ ab uid properly captured
          window.location.href = `user.html?uid=${selectedUser}`;
      };
  });
}
function openGroupChat(groupId){
  clearAllListeners(); 
    document.getElementById("leaveGroupBtn").style.display = "inline-block";

    selectedUser = null;
// Group header click → show members
document.getElementById("chatUserInfo").onclick = function(){
  showGroupMembers(groupId);
};

  selectedUser = null; // important
  selectedGroup = groupId;

  chatListScreen.style.display = "none";
  chatScreen.classList.remove("hidden");

  document.getElementById("chatUserName").innerText = "Group Chat";
firebase.database().ref("groups/" + groupId).once("value")
.then(snap => {
  const group = snap.val();
  document.getElementById("chatUserImg").src =
    group.groupImg || "group.jpg";

  document.getElementById("chatUserName").innerText =
    group.groupName;
});


  loadGroupMessages(groupId);
  // 🔥 GROUP TYPING LISTENER
firebase.database()
  .ref(`groupTyping/${groupId}`)
  .on("value", snap => {

    const data = snap.val();
    typingIndicator.innerHTML = "";

    if(!data) return;

    Object.keys(data).forEach(uid => {

      if(uid !== currentUser && data[uid] === true){

        firebase.database()
          .ref("users/" + uid)
          .once("value")
          .then(userSnap => {

            const user = userSnap.val();
            if(!user) return;

typingIndicator.innerHTML = `
  <div class="msg received typing-msg">
    <div class="dp-space"></div>
    <div class="bubble typing-bubble">
      <span class="jump-text">${user.username} is typing</span>
    </div>
  </div>
`;



          });

      }

    });

});


}

// ---------- Load Messages ----------
function loadMessages(){
  if(!currentUser || !selectedUser){
  return;
}

// 🔥 REMOVE OLD LISTENERS (VERY IMPORTANT)
if(chatRefListener){
  chatRefListener.off();
}

if(typingRefListener){
  typingRefListener.off();
}

  chatBox.innerHTML="";
  shownDays = {};

  const chatId=getChatId(currentUser,selectedUser);
  // ---------- Show typing indicator for other user ----------
typingRefListener = firebase.database()
  .ref(`typing/${chatId}/${selectedUser}`);

typingRefListener.on("value", snap => {

  const isTyping = snap.val();

  if(isTyping){

    if(!typingDiv){

      firebase.database()
        .ref("users/" + selectedUser)
        .once("value")
        .then(userSnap => {

          const user = userSnap.val();
          if(!user) return;

          typingDiv = document.createElement("div");
          typingDiv.className = "msg received typing-msg";

          typingDiv.innerHTML = `
            <div class="dp-space"></div>
            <div class="bubble typing-bubble">
              <span class="jump-text">${user.username} is typing</span>
            </div>
          `;

          chatBox.appendChild(typingDiv);
          chatBox.scrollTop = chatBox.scrollHeight;
        });
    }

  }else{
    if(typingDiv){
      typingDiv.remove();
      typingDiv = null;
    }
  }

});



chatRefListener = firebase.database().ref("chats/"+chatId);

chatRefListener.on("child_added", snap => {
  const msg = snap.val();
  const msgId = snap.key;

  addMessage(msg, msgId);

  // ✅ IMPORTANT FIX
  // Agar samne wale ka msg hai aur chat open hai
  if(
    msg.sender !== currentUser &&
    !msg.read &&
    selectedUser // chatScreen open
  ){
    firebase.database().ref(`chats/${chatId}/${msgId}`).update({
      read: true,
      readTime: Date.now()
    });
  }
});

firebase.database().ref("chats/"+chatId).on("child_changed", snap => {
  const updatedMsg = snap.val();
  const msgId = snap.key;

  const div = msgDivMap[msgId];
  if (!div) return;
const textSpan = div.querySelector(".msg-text");
if(textSpan && updatedMsg.text){
    textSpan.innerHTML = linkify(updatedMsg.text);
}

  // 🔥 CASE 1: upload finished (blur → real media)
  if (!updatedMsg.uploading && updatedMsg.media) {

    let newMediaHTML = "";

    // sender
    if (updatedMsg.sender === currentUser) {
      newMediaHTML =
        updatedMsg.mediaType === "image"
  ? `<img 
        src="${updatedMsg.media}" 
        style="max-width:220px;border-radius:10px;cursor:pointer"
        onclick="openMediaFullscreen('${updatedMsg.media}','image')"
     >`
  : `<video 
        src="${updatedMsg.media}" 
        controls 
        style="max-width:220px;border-radius:10px;cursor:pointer"
        onclick="openMediaFullscreen('${updatedMsg.media}','video')"
     ></video>`;
    }
    // receiver
else {
  newMediaHTML = `
    <div class="media-placeholder blur" data-msgid="${msgId}">
      <button class="download-btn">⬇ Download</button>
    </div>
  `;
}


    // 🔥 REPLACE blur placeholder with real media
    const oldPlaceholder = div.querySelector(".media-placeholder");
    if (oldPlaceholder) {
      oldPlaceholder.outerHTML = newMediaHTML;
      // 🔥 IMPORTANT: re-attach download click (LIVE)
setTimeout(() => {
  const newDiv = msgDivMap[msgId];
  if (!newDiv) return;

  const downloadBtn = newDiv.querySelector(".download-btn");
  if (!downloadBtn) return;

  downloadBtn.onclick = () => {
    const placeholder = downloadBtn.parentElement;

    placeholder.innerHTML = `
      <div class="progress-circle">Downloading...</div>
    `;

    setTimeout(() => {
      placeholder.classList.remove("blur");
      placeholder.innerHTML =
        updatedMsg.mediaType === "image"
          ? `<img src="${updatedMsg.media}" style="max-width:220px;border-radius:10px;">`
          : `<video src="${updatedMsg.media}" controls style="max-width:220px;border-radius:10px;"></video>`;
          // ✅ mark as downloaded
downloadedMedia[msgId] = true;
localStorage.setItem("downloadedMedia", JSON.stringify(downloadedMedia));

    }, 1200);
  };
}, 0);

    }
  }

  // 🔹 edited label
  let editedLabel = div.querySelector(".edited-label");
  if (updatedMsg.edited) {
    if (!editedLabel) {
      editedLabel = document.createElement("span");
      editedLabel.className = "edited-label";
      editedLabel.innerText = "(edited)";
      div.appendChild(editedLabel);
    }
  } else {
    if (editedLabel) editedLabel.remove();
  }

  // 🔹 seen logic (same as pehle)
  if (
    updatedMsg.sender === currentUser &&
    updatedMsg.read &&
    updatedMsg.readTime &&
    !updatedMsg.edited
  ) {
    if (lastSeenMsgDiv) {
      const oldSeen = lastSeenMsgDiv.querySelector(".seen-text");
      if (oldSeen) oldSeen.remove();
    }

    showSeen(div, updatedMsg.readTime);
    lastSeenMsgDiv = div;
  }
});



// ✅ Child removed: remove deleted messages from DOM live
firebase.database().ref("chats/"+chatId).on("child_removed", snap => {
    const msgId = snap.key;
    const div = msgDivMap[msgId]; // jo div banaya tha
    if(div){
        div.remove();              // DOM se turant remove
        delete msgDivMap[msgId];   // map se bhi remove
    }
});




}

// ---------- Add Message ----------


let shownDays = {};
let lastGroupSender = null;

let lastSentMsgDiv = null;
let lastSeenMsgDiv = null;

let msgDivMap = {};
let editingMessageId = null; // abhi kaun sa message edit ho raha hai

function addMessage(msg,id){

const msgDate = new Date(msg.time);
const now = new Date();

// 🔥 normalize dates (IMPORTANT)
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);

const msgDay = new Date(
  msgDate.getFullYear(),
  msgDate.getMonth(),
  msgDate.getDate()
);

let dayKey = "";
let label = "";

if (msgDay.getTime() === today.getTime()) {
  dayKey = "today";
  label = "Today";
}
else if (msgDay.getTime() === yesterday.getTime()) {
  dayKey = "yesterday";
  label = "Yesterday";
}
else {
  dayKey = msgDay.toDateString();
  label = msgDay.toLocaleDateString();
}


  if(!shownDays[dayKey]){
    const sep = document.createElement("div");
    sep.className = "date-separator";
    sep.innerText = label;
    chatBox.appendChild(sep);
    shownDays[dayKey] = true;
  }

  // -------- MESSAGE --------
  const time12 = msgDate.toLocaleTimeString([], {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true
});

const div = document.createElement("div");
div.className = "msg " + (msg.sender===currentUser ? "sent" : "received");
div.dataset.msgid = id;


let replyHTML = "";
if(msg.reply){
    const repliedDiv = msgDivMap[msg.reply];
    if(repliedDiv){
        const repliedText =
          repliedDiv.querySelector(".msg-text")?.innerText || "";

        const repliedUser =
          repliedDiv.classList.contains("sent") ? "You" : "User";

       replyHTML = `
  <div class="reply-preview-wa" data-reply-id="${msg.reply}">
    <div class="reply-user">${repliedUser}</div>
    <div class="reply-text">${linkify(repliedText)}</div>

  </div>
`;

    }
}
let mediaHTML = "";

// 🟡 upload ho raha hai (sender ke liye)
// 🟡 upload ho raha hai → SIRF sender ko dikhe
// 🟡 upload ho raha hai
if (msg.uploading) {

  // sender → progress
if (msg.sender === currentUser) {
  const progressText =
    msg.progress && msg.progress > 0
      ? `${msg.progress}%`
      : "Sending...";

  mediaHTML = `
    <div class="media-placeholder blur">
      <div class="progress-circle">${progressText}</div>
    </div>
  `;
}


  // receiver → EMPTY placeholder (VERY IMPORTANT)
else {
  mediaHTML = `
    <div class="media-placeholder blur">
      <div class="receiving-text">📥 Media receiving...</div>
    </div>
  `;
}
}



// 🟢 upload complete
else if (msg.media) {

  // sender
  if (msg.sender === currentUser) {
    mediaHTML =
      msg.mediaType === "image"
        ? `<img src="${msg.media}" style="max-width:220px;border-radius:10px;">`
        : `<video src="${msg.media}" controls style="max-width:220px;border-radius:10px;"></video>`;
  }

  // receiver
  else {
if (downloadedMedia[id]) {
  // ✅ already downloaded → direct show
  mediaHTML =
    msg.mediaType === "image"
      ? `<img src="${msg.media}" style="max-width:220px;border-radius:10px;">`
      : `<video src="${msg.media}" controls style="max-width:220px;border-radius:10px;"></video>`;
} else {
  // ❌ not downloaded yet
  mediaHTML = `
    <div class="media-placeholder blur">
      <button class="download-btn">⬇ Download</button>
    </div>
  `;
}

  }
}

// 🔵 normal text
else {
 mediaHTML = `<span class="msg-text">${linkify(msg.text || "")}</span>`;

}


if(msg.sender !== currentUser){

let showDp = true;

// 🔥 CLEAN FIX — works even after reload
if(lastGroupSender === msg.sender){
    showDp = false;
}

lastGroupSender = msg.sender;

div.dataset.sender = msg.sender;



  div.innerHTML = `
    <div class="insta-msg-row">
      ${
        showDp
          ? `<img src="${msg.senderPhoto || 'dp.jpg'}" class="insta-dp">`
          : `<div class="insta-dp-placeholder"></div>`
      }

      <div class="insta-bubble">
        ${replyHTML}
        ${mediaHTML}
        ${msg.edited ? '<div class="edited">(edited)</div>' : ''}
      </div>
    </div>

    <div class="msg-time-swipe">${time12}</div>
  `;
}
else{

  div.innerHTML = `
    <div class="insta-msg-row you">
      <div class="insta-bubble you-bubble">
        ${replyHTML}
        ${mediaHTML}
        ${msg.edited ? '<div class="edited">(edited)</div>' : ''}
      </div>
    </div>

    <div class="msg-time-swipe">${time12}</div>
  `;
}



const downloadBtn = div.querySelector(".download-btn");

if (downloadBtn) {
  downloadBtn.onclick = async () => {
    const placeholder = downloadBtn.parentElement;

    // 🔵 downloading UI
    placeholder.innerHTML = `
      <div class="progress-circle">Downloading...</div>
    `;

    // ⏳ fake delay (download feel)
    setTimeout(() => {
      placeholder.classList.remove("blur");

      // ✅ real media show
      placeholder.innerHTML =
        msg.mediaType === "image"
          ? `<img src="${msg.media}" style="max-width:220px;border-radius:10px;">`
          : `<video src="${msg.media}" controls style="max-width:220px;border-radius:10px;"></video>`;
          // ✅ mark as downloaded
downloadedMedia[msgId] = true;
localStorage.setItem("downloadedMedia", JSON.stringify(downloadedMedia));

    }, 1500);
  };
}

chatBox.appendChild(div);
if(msg.sender !== currentUser){
  const img = div.querySelector(".insta-dp");
  if(img){
    firebase.database().ref("users/" + msg.sender).once("value")
    .then(snap=>{
      const user = snap.val();
      if(user && user.photoURL){
        img.src = user.photoURL;
      }
    });
  }
}

// 🔥 Instagram swipe time reveal
// 🔥 Instagram swipe time reveal (ONLY MY MSG)
// 🔥 Instagram swipe time reveal + AUTO RESET
let startX = 0;
let swipeTimer = null;

div.addEventListener("touchstart", e=>{
  if(!div.querySelector(".you-bubble")) return;
  startX = e.touches[0].clientX;
});

div.addEventListener("touchmove", e=>{
  if(!div.querySelector(".you-bubble")) return;

  const moveX = e.touches[0].clientX;
  const diff = startX - moveX;

  // 👉 swipe left detected
  if(diff > 40){
    div.classList.add("show-time");

    // 🔥 timer reset (har swipe pe reset)
    clearTimeout(swipeTimer);

    swipeTimer = setTimeout(()=>{
      div.classList.remove("show-time"); // ⏱️ 2 sec baad normal
    },2000);
  }

  // 👉 swipe wapas right
  if(diff < 10){
    div.classList.remove("show-time");
    clearTimeout(swipeTimer);
  }
});
// 🔥 Reply preview click → scroll to original message
const replyPreview = div.querySelector(".reply-preview-wa");
if(replyPreview){
  replyPreview.addEventListener("click", () => {
    const replyId = replyPreview.dataset.replyId;
    const targetDiv = msgDivMap[replyId];

    if(targetDiv){
      targetDiv.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

      // highlight effect
      targetDiv.classList.add("reply-highlight");
      setTimeout(() => {
        targetDiv.classList.remove("reply-highlight");
      }, 1200);
    }
  });
}

msgDivMap[id] = div;




// -------- TRACK LAST SENT MESSAGE (ONLY TRACK, DON'T REMOVE SEEN) --------
if(msg.sender === currentUser){
  lastSentMsgDiv = div;
}

// -------- SHOW SEEN (ONLY IF THIS MESSAGE WAS READ) --------
// -------- TRACK LAST SENT MESSAGE --------
if(msg.sender === currentUser){
  lastSentMsgDiv = div;
}
// ---------- LONG PRESS OPTIONS ----------
let pressTimer;

// Desktop long press


// Desktop long press
div.addEventListener("mousedown", e => {
    pressTimer = setTimeout(() => {
        if(msg.sender === currentUser){
            // Sent message → full options
            showMessageOptionsBox(div, id, msg);
        } else {
            // Received message → only reply button
            showReplyOnlyBox(div, id, msg);
        }
    }, 500);
});

div.addEventListener("mouseup", e => clearTimeout(pressTimer));
div.addEventListener("mouseleave", e => clearTimeout(pressTimer));

// Mobile long press
div.addEventListener("touchstart", e => {
    pressTimer = setTimeout(() => {
        if(msg.sender === currentUser){
            showMessageOptionsBox(div, id, msg);
        } else {
            showReplyOnlyBox(div, id, msg);
        }
    }, 500);
});

div.addEventListener("touchend", e => clearTimeout(pressTimer));
div.addEventListener("touchcancel", e => clearTimeout(pressTimer));


// mouseup ya mouseleave me ab remove mat karo
div.addEventListener("mouseup", e => clearTimeout(pressTimer));
div.addEventListener("mouseleave", e => clearTimeout(pressTimer));


chatBox.scrollTop = chatBox.scrollHeight;
}
function showReplyOnlyBox(msgDiv, msgId, msgData){
    // Remove any existing box
    const existing = document.getElementById("msgOptionsBox");
    if(existing) existing.remove();

    const box = document.createElement("div");
    box.id = "msgOptionsBox";
    box.style.position = "absolute";
    box.style.background = "#fff";
    box.style.border = "1px solid #ccc";
    box.style.padding = "5px";
    box.style.borderRadius = "8px";
    box.style.display = "flex";
    box.style.flexDirection = "column";
    box.style.zIndex = 1000;
    box.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";

    // Position box above message
// 🔥 bubble ka position lo (NOT msgDiv)
const bubble = msgDiv.querySelector(".insta-bubble");
const rect = bubble.getBoundingClientRect();

const scrollY = window.scrollY || window.pageYOffset;
const scrollX = window.scrollX || window.pageXOffset;

const menuWidth = 120;
const menuHeight = 50;

// bubble ke center me upar
let top = rect.top - menuHeight + scrollY - 8;
let left = rect.left + (rect.width / 2) - (menuWidth / 2) + scrollX;

if(top < 10){
  top = rect.bottom + scrollY + 8;
}

box.style.top = top + "px";
box.style.left = left + "px";

    // ---------- Only Reply Button ----------
    const reply = document.createElement("button");
    reply.innerHTML = '<i class="fa-solid fa-reply"></i> Reply';
    reply.onclick = (e) => {
    e.stopPropagation();  // 🔥 VERY IMPORTANT
    replyToMessage(msgId, msgData);
    box.remove();
};


    box.appendChild(reply);

    document.body.appendChild(box);

    // Click inside box → stop propagation
    box.addEventListener("click", (e) => e.stopPropagation());
}
function linkify(text) {
  if(!text) return "";
  // Regex for URLs
  const urlPattern = /(\bhttps?:\/\/[^\s]+|\bwww\.[^\s]+)/gi;
  return text.replace(urlPattern, function(url) {
    let href = url;
    if(!url.startsWith("http")) href = "https://" + url; // www.xyz.com -> https://www.xyz.com
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color:#22c55e; text-decoration:underline;">${url}</a>`;
  });
}



function replyToMessage(msgId, msgData){
  replyTo = msgId;
  editingMessageId = null;

  // 🔹 DOM se updated text le lo
  const msgDiv = msgDivMap[msgId];
  let text = msgData.text || "📷 Image";
  if(msgDiv){
      const textSpan = msgDiv.querySelector(".msg-text");
      if(textSpan) text = textSpan.innerText;
  }

  replyBox.classList.remove("hidden");
  replyBox.innerHTML = `
    <div class="reply-left">
      <div class="reply-title">You</div>
      <div class="reply-msg">${text}</div>
    </div>
    <div class="reply-close" onclick="cancelReply()">✕</div>
  `;
  msgInput.focus();
}


// ---------- Send ----------
sendBtn.onclick = () => {
  
    // 🔥 GLOBAL PUSH LOCK (MOST IMPORTANT)
  if(pushLock) return;
  pushLock = true;
  setTimeout(()=> pushLock=false, 900);
  // 🔥 DOUBLE SEND FIX
  if(sendingLock) return;
  sendingLock = true;
  setTimeout(()=> sendingLock=false, 600);
if(selectedGroup){

  if (!msgInput.value) return;

  if(editingMessageId){

  // 🔹 GROUP CHAT
  if(selectedGroup){
    firebase.database()
      .ref(`groupChats/${selectedGroup}/${editingMessageId}`)
      .update({
        text: msgInput.value,
        edited: true
      });
  }

  // 🔹 SINGLE CHAT
  else{
    const chatId = getChatId(currentUser, selectedUser);
    firebase.database()
      .ref(`chats/${chatId}/${editingMessageId}`)
      .update({
        text: msgInput.value,
        edited: true
      });
  }

  editingMessageId = null;
  hideReplyBox();
  msgInput.value = "";
  return;
}


  firebase.database().ref("users/" + currentUser).once("value")
  .then(userSnap => {

    const userData = userSnap.val();
    const username = userData?.username || "User";
// 🔥 GROUP typing immediately off
firebase.database()
  .ref(`groupTyping/${selectedGroup}/${currentUser}`)
  .set(false);

firebase.database().ref("groupChats/"+selectedGroup).push({
    sender: currentUser,
    senderName: username,
    senderPhoto: userData.photoURL || "dp.jpg",
    text: msgInput.value,
    reply: replyTo || null,
    time: Date.now(),
    seenBy: {
        [currentUser]: true   // sender auto seen
    }
});


    replyTo = null;
    hideReplyBox();
    msgInput.value = "";
  });

  return;
}



    if (!msgInput.value) return;
    const chatId = getChatId(currentUser, selectedUser);

    if (editingMessageId) {
        // ✅ edit mode → update existing message
        firebase.database().ref(`chats/${chatId}/${editingMessageId}`).update({
            text: msgInput.value,
            edited: true
        });

        editingMessageId = null;          // edit mode off
        replyBox.classList.add("hidden");
        msgInput.value = "";
         hideReplyBox();   // 🔥 VERY IMPORTANT
    } else {
        // ✅ normal send
const messageText = msgInput.value.trim();
if (!messageText) return;

firebase.database().ref("users/" + currentUser).once("value")
.then(userSnap => {

    const userData = userSnap.val() || {};
// 🔥 typing off immediately when message sent
firebase.database().ref(`typing/${chatId}/${currentUser}`).set(false);

    firebase.database().ref(`chats/${chatId}`).push({
      
        sender: currentUser,
        senderPhoto: userData.photoURL || "dp.jpg",
        text: messageText,
        reply: replyTo || null,
        time: Date.now(),
        read: false,
        readTime: null
    });

});

replyTo = null;
hideReplyBox();
msgInput.value = "";

         hideReplyBox();   // 🔥 VERY IMPORTANT
    }
};
// ---------- Send message on Enter key ----------
msgInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { // shift+enter = new line
        e.preventDefault(); // default newline roko
        sendBtn.click();    // send button trigger karo
    }
});


// ---------- Edit / Unsend ----------
function messageOptions(id,msg){
  const ok=confirm("OK = Edit\nCancel = Unsend");
  const chatId=getChatId(currentUser,selectedUser);

  if(ok){
    const t=prompt("Edit message",msg.text);
    if(t) firebase.database().ref(`chats/${chatId}/${id}`).update({text:t});
  }else{
    firebase.database().ref(`chats/${chatId}/${id}`).remove();
  }
}
function showMessageOptionsBox(msgDiv, msgId, msgData){
    // pehle koi existing box hatado
    const existing = document.getElementById("msgOptionsBox");
    if(existing) existing.remove();

    const box = document.createElement("div");
    box.id = "msgOptionsBox";
    box.style.position = "absolute";
    box.style.background = "#fff";
    box.style.border = "1px solid #ccc";
    box.style.padding = "5px";
    box.style.borderRadius = "8px";
    box.style.display = "flex";
    box.style.flexDirection = "column";
    box.style.zIndex = 1000;
    box.style.boxShadow = "0 2px 6px rgba(0,0,0,0.2)";

 

    // ---------- Options ----------
    const unsend = document.createElement("button");
    unsend.innerHTML = '<i class="fa-solid fa-arrow-rotate-left"></i> Unsend';
    unsend.onclick = () => {
        unsendMessage(msgId);
        box.remove();
    };

// 🔥 bubble ka position lo (NOT msgDiv)
const bubble = msgDiv.querySelector(".insta-bubble");
const rect = bubble.getBoundingClientRect();

const scrollY = window.scrollY || window.pageYOffset;
const scrollX = window.scrollX || window.pageXOffset;

const menuWidth = 140;
const menuHeight = 90;

// bubble ke center me upar
let top = rect.top - menuHeight + scrollY - 8;
let left = rect.left + (rect.width / 2) - (menuWidth / 2) + scrollX;

if(top < 10){
  top = rect.bottom + scrollY + 8;
}

box.style.top = top + "px";
box.style.left = left + "px";

    const reply = document.createElement("button");
reply.innerHTML = '<i class="fa-solid fa-reply"></i> Reply';

    reply.onclick = (e) => {
    e.stopPropagation();  // 🔥 VERY IMPORTANT
    replyToMessage(msgId, msgData);
    box.remove();
};


    const edit = document.createElement("button");
    edit.innerHTML = '<i class="fa-solid fa-pencil"></i> Edit';

    edit.onclick = () => {
        editMessage(msgId, msgData);
        box.remove();
    };

    box.appendChild(unsend);
    box.appendChild(reply);
    box.appendChild(edit);

    document.body.appendChild(box);
   // Popup ke andar click ko document click se stop karo
box.addEventListener("click", (e) => {
    e.stopPropagation();
});

}
function unsendMessage(msgId){

    // 🔹 Agar group chat open hai
    if(selectedGroup){
        firebase.database()
          .ref(`groupChats/${selectedGroup}/${msgId}`)
          .remove();
        return;
    }

    // 🔹 Single chat
    const chatId = getChatId(currentUser, selectedUser);
    firebase.database()
      .ref(`chats/${chatId}/${msgId}`)
      .remove();
}

function editMessage(msgId, msgData){

    editingMessageId = msgId;
    replyTo = null;
    replyBox.classList.add("hidden");

    // ✅ YE LINE MISSING THI
    msgInput.value = msgData.text;

    msgInput.focus();

    replyBox.classList.remove("hidden");
    replyBox.innerHTML = `
      <div class="reply-left">
        <div class="reply-title">Editing</div>
        <div class="reply-msg">${msgData.text}</div>
      </div>
      <div class="reply-close" onclick="cancelReply()">✕</div>
    `;
}



// ---------- Helpers ----------
function lastSeenText(t){
  if(!t) return "offline";

  const diff = Date.now() - t;
  const min = Math.floor(diff / 60000);
  const hour = Math.floor(min / 60);
  const day = Math.floor(hour / 24);

  if(min < 1) return "offline just now";
  if(min < 60) return `offline ${min} min ago`;
  if(hour < 24) return `offline ${hour} hour ago`;
  if(day === 1) return "offline 24 hours ago";
  if(day < 7) return `offline ${day} days ago`;
  if(day === 7) return "offline one week ago";

  return "offline";
}

function cancelReply(){
  replyTo = null;
  editingMessageId = null;
  replyBox.classList.add("hidden");
  msgInput.value = "";
}
function hideReplyBox(){
  replyTo = null;
  editingMessageId = null;
  replyBox.classList.add("hidden");
  replyBox.innerHTML = "";
}


// ---------- Close options box on outside click + cancel edit ----------
document.addEventListener("click", (e) => {
  
    const box = document.getElementById("msgOptionsBox");

    // options box close
    if (box && !box.contains(e.target)) {
        box.remove();
    }

    const inputClicked = msgInput.contains(e.target);
    const replyClicked = replyBox.contains(e.target);
    const optionsClicked = box && box.contains(e.target);

    // ---------- CANCEL EDIT ----------
if(editingMessageId && !inputClicked && !replyClicked && !optionsClicked && e.target.id !== "msgOptionsBox"){
        editingMessageId = null;
        replyBox.classList.add("hidden");
        msgInput.value = "";
    }

    // ---------- CANCEL REPLY ----------
    if(
    replyTo &&
    !inputClicked &&
    !replyClicked &&
    !optionsClicked &&
    !e.target.closest("#msgOptionsBox")
){
    // 🔥 Sirf tab cancel hoga jab real outside click ho
    setTimeout(()=>{
        if(!msgInput.contains(document.activeElement)){
            replyTo = null;
            replyBox.classList.add("hidden");
        }
    },0);
}




// cooming soon wala popup audio call


const comingSoonPopup = document.getElementById("comingSoonPopup");
const closePopup = document.getElementById("closePopup");
// Leave Group button click
document.getElementById("leaveGroupBtn").addEventListener("click", () => {
  document.getElementById("leaveGroupPopup").classList.remove("hidden");
});

// Cancel button
document.getElementById("cancelLeaveBtn").addEventListener("click", () => {
  document.getElementById("leaveGroupPopup").classList.add("hidden");
});

// Confirm Leave button
document.getElementById("confirmLeaveBtn").addEventListener("click", leaveGroup);

// audio call button
document.getElementById("audioCallBtn")?.addEventListener("click", () => {
  comingSoonPopup.classList.remove("hidden");
});

// video call button
document.getElementById("videoCallBtn")?.addEventListener("click", () => {
  comingSoonPopup.classList.remove("hidden");
});

// close popup
closePopup.addEventListener("click", () => {
  comingSoonPopup.classList.add("hidden");
});


// cooming soon wala popup audio call





  });



function getChatId(a,b){return a<b?`${a}_${b}`:`${b}_${a}`}
function timeAgo(t){
  const diff = Date.now() - t;
  const min = Math.floor(diff / 60000);
  const hour = Math.floor(min / 60);
  const day = Math.floor(hour / 24);

  if(day >= 1){
    return day === 1 ? "yesterday" : day + " days ago";
  }
  if(hour >= 1){
    return hour + " h ago";
  }
  if(min >= 1){
    return min + " min ago";
  }
  return "just now";
}
function showSeen(msgDiv, readTime){

  // pehle purana seen remove (sirf last message pe dikhe)
  const old = document.querySelector(".seen-text");
  if(old) old.remove();

  const seen = document.createElement("div");
  seen.className = "seen-text";
  seen.innerText = "Seen " + seenTimeFormat(readTime);

  // 🔥 MAIN FIX → bubble ke niche insert hoga
  msgDiv.insertAdjacentElement("afterend", seen);
}
function seenTimeFormat(t){
  const d = new Date(t);
  const now = new Date();
  const diff = (now - d) / 60000;

  if(diff < 1) return "just now";
  if(diff < 60) return Math.floor(diff) + " min ago";

  const y = new Date();
  y.setDate(now.getDate() - 1);

  if(d.toDateString() === now.toDateString()){
    return d.toLocaleTimeString([],{
      hour:'2-digit',minute:'2-digit',hour12:true
    });
  }

  if(d.toDateString() === y.toDateString()){
    return "yesterday";
  }

  return d.toLocaleDateString(undefined,{ weekday:'long' });
}

// ---------- Back ----------
window.onpopstate = () => {
  selectedGroup = null;
    chatScreen.classList.add("hidden");
    chatListScreen.style.display = "block";

    if(selectedUser){
        const chatId = getChatId(currentUser, selectedUser);
        firebase.database().ref(`chats/${chatId}`).once("value").then(snap => {
            const msgs = snap.val();
            if(!msgs) return;

            Object.keys(msgs).forEach(key => {
                const msg = msgs[key];
                if(msg.sender !== currentUser && !msg.read){
                    firebase.database().ref(`chats/${chatId}/${key}`).update({
  read: true,
  readTime: Date.now()
});

                }
            });
        });
    }
};
// ---------- Back Button ----------
const backBtn = document.getElementById("backBtn");

backBtn.addEventListener("click", () => {
  clearAllListeners(); 
  
    // Chat screen hide, chat list show
    chatScreen.classList.add("hidden");
    chatListScreen.style.display = "block";
document.getElementById("leaveGroupBtn").style.display = "none";
    // Selected user reset
    selectedUser = null;
selectedGroup = null;   // ⭐⭐⭐ ADD THIS
    // Reply / edit box hide
    hideReplyBox();

    // Scroll chat box to top (optional)
    chatBox.scrollTop = 0;

    // Browser history pushState reset (optional, for SPA back navigation)
    history.pushState({}, "", "");
});
// Button select karo
const firstBackBtn = document.getElementById("FirstbackBtn");

// Click event add karo
firstBackBtn.addEventListener("click", () => {
    // Redirect to main.html
    window.location.href = "main.html";
});


const imgBtn = document.getElementById("imgBtn");
const imgInput = document.getElementById("imgInput");


imgBtn.addEventListener("click", () => {
  imgInput.click();
});

imgInput.addEventListener("change", async () => {
  const file = imgInput.files[0];
 if (!file || (!selectedUser && !selectedGroup)) return;

 // ======= 👇👇👇 GROUP MEDIA SEND (YAHAN PASTE) =======
  
  if (selectedGroup) {

    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}.${ext}`;

    const msgRef = firebase.database()
      .ref(`groupChats/${selectedGroup}`)
      .push();

    // 🔥 sender info
    const userSnap = await firebase.database()
      .ref("users/" + currentUser)
      .once("value");

    const userData = userSnap.val() || {};

    // 🔥 placeholder message
    await msgRef.set({
      sender: currentUser,
      senderName: userData.username || "User",
      senderPhoto: userData.photoURL || "dp.jpg",
      text: "",
      media: "",
      mediaType: file.type.startsWith("image/") ? "image" : "video",
      uploading: true,
      progress: 0,
      time: Date.now(),
      seenBy: {
        [currentUser]: true
      }
    });

    // 🔥 fake progress
    let progress = 0;
    const timer = setInterval(() => {
      progress += 10;
      if (progress > 90) progress = 90;
      msgRef.update({ progress });
    }, 400);

    // 🔥 upload to Supabase
    const { error } = await supabaseClient.storage
      .from("videos")
      .upload(fileName, file);

    clearInterval(timer);

    if (error) {
      msgRef.remove();
      alert("Upload failed");
      return;
    }

    const { data } = supabaseClient.storage
      .from("videos")
      .getPublicUrl(fileName);

    // 🔥 upload complete
    msgRef.update({
      media: data.publicUrl,
      uploading: false,
      progress: 100
    });

    imgInput.value = "";
    return; // ⛔ single chat code yahan nahi chalega
  }

  const chatId = getChatId(currentUser, selectedUser);
  const ext = file.name.split(".").pop();
  const fileName = `${Date.now()}.${ext}`;

  // 🔥 1) Firebase me PEHLE message push (placeholder)
  const msgRef = firebase.database().ref(`chats/${chatId}`).push();
// 🔥 pehle user ka photo fetch karo
firebase.database().ref("users/" + currentUser).once("value")
.then(userSnap => {

  const userData = userSnap.val() || {};

  msgRef.set({
    sender: currentUser,
    senderPhoto: userData.photoURL || "dp.jpg",  // ✅ THIS WAS MISSING
    text: "",
    media: "",
    mediaType: file.type.startsWith("image/") ? "image" : "video",
    uploading: true,
    progress: 0,
    time: Date.now(),
    read: false,
    readTime: null
  });

});


  // 🔥 2) Fake progress
  let fakeProgress = 0;
  const progressTimer = setInterval(() => {
    fakeProgress += Math.floor(Math.random() * 8) + 4;
    if (fakeProgress > 90) fakeProgress = 90;
    msgRef.update({ progress: fakeProgress });
  }, 400);

  // 🔥 3) Supabase upload
  const { error } = await supabaseClient.storage
    .from("videos")
    .upload(fileName, file);

  clearInterval(progressTimer);

  if (error) {
    msgRef.remove();
    alert("Upload failed");
    return;
  }

  const { data } = supabaseClient.storage
    .from("videos")
    .getPublicUrl(fileName);

  // 🔥 4) Upload complete → update message
  msgRef.update({
    media: data.publicUrl,
    uploading: false,
    progress: 100
  });

  imgInput.value = "";
});
const mediaViewer = document.getElementById("mediaViewer");
const mediaViewerContent = document.getElementById("mediaViewerContent");
const closeViewer = document.querySelector(".close-viewer");

function openMediaFullscreen(src, type){

  let viewer = document.getElementById("mediaViewer");

  // 🔥 agar viewer exist nahi karta → create kar do
  if(!viewer){
    viewer = document.createElement("div");
    viewer.id = "mediaViewer";
    viewer.className = "media-viewer";
    viewer.innerHTML = `
      <span class="close-viewer">✕</span>
      <div id="mediaViewerContent"></div>
    `;
    document.body.appendChild(viewer);

    // close logic
    viewer.querySelector(".close-viewer").onclick = closeMediaViewer;
    viewer.onclick = (e)=>{
      if(e.target === viewer) closeMediaViewer();
    };
  }

  const content = document.getElementById("mediaViewerContent");

  content.innerHTML =
    type === "image"
      ? `<img src="${src}">`
      : `<video src="${src}" controls autoplay></video>`;

  viewer.classList.remove("hidden");
}

function closeMediaViewer(){
  const viewer = document.getElementById("mediaViewer");
  const content = document.getElementById("mediaViewerContent");
  if(viewer){
    viewer.classList.add("hidden");
    content.innerHTML = "";
  }
}










function loadUsersForGroup() {
    const userList = document.getElementById("userSelectList");
    userList.innerHTML = "";

    firebase.database()
      .ref("following/" + currentUser)
      .once("value", snapshot => {

        if (!snapshot.exists()) {
            userList.innerHTML = "<p>You are not following anyone.</p>";
            return;
        }

        snapshot.forEach(child => {
            const followedUid = child.key;

            firebase.database()
              .ref("users/" + followedUid)
              .once("value", userSnap => {

                const user = userSnap.val();
                if (!user) return;

                const div = document.createElement("div");
                div.className = "user-select-item";

                div.innerHTML = `
                  <label style="display:flex;align-items:center;gap:10px;">
                    <input type="checkbox" value="${followedUid}">
                    <img src="${user.photoURL || 'dp.jpg'}"
                         style="width:35px;height:35px;border-radius:50%;">
                    <span>@${user.username || "User"}</span>
                  </label>
                `;

                userList.appendChild(div);
              });
        });
      });
}




function loadGroupMessages(groupId){

  chatBox.innerHTML = "";
  shownDays = {};
  msgDivMap = {};   // ⭐ IMPORTANT RESET
  lastGroupSender = null;


  groupRefListener = firebase.database().ref("groupChats/"+groupId);

  groupRefListener.on("child_added", snap => {
    const msg = snap.val();
    const msgId = snap.key;
    addGroupMessage(msg, msgId);
  });

  groupRefListener.on("child_removed", snap => {
    const msgId = snap.key;
    const div = msgDivMap[msgId];
    if(div){
      div.remove();
      delete msgDivMap[msgId];
    }
  });

  groupRefListener.on("child_changed", snap => {
    const updatedMsg = snap.val();
    const msgId = snap.key;
    const div = msgDivMap[msgId];
    if(!div) return;

    const textSpan = div.querySelector(".msg-text");
    if(textSpan){
      textSpan.innerHTML = linkify(updatedMsg.text);
    }
  });

}


function addGroupMessage(msg,id){

const msgDate = new Date(msg.time);
const now = new Date();

// 🔥 reset time to 00:00:00 (very important)
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);

const msgDay = new Date(
  msgDate.getFullYear(),
  msgDate.getMonth(),
  msgDate.getDate()
);

if (msgDay.getTime() === today.getTime()) {
  dayKey = "today";
  label = "Today";
}
else if (msgDay.getTime() === yesterday.getTime()) {
  dayKey = "yesterday";
  label = "Yesterday";
}
else {
  dayKey = msgDay.toDateString();
  label = msgDay.toLocaleDateString();
}

  

  if(!shownDays[dayKey]){
    const sep = document.createElement("div");
    sep.className = "date-separator";
    sep.innerText = label;
    chatBox.appendChild(sep);
    shownDays[dayKey] = true;
  }

  const time12 = msgDate.toLocaleTimeString([], {
    hour:'2-digit',
    minute:'2-digit',
    hour12:true
  });

  const div = document.createElement("div");
  let profileImgHTML = "";

if(msg.sender !== currentUser){
    profileImgHTML = `
        <img 
          src="${msg.senderPhoto || 'dp.jpg'}" 
          class="group-msg-dp"
        >
    `;
}

  div.className = "msg " + (msg.sender===currentUser ? "sent" : "received");
  div.dataset.msgid = id;

let replyHTML = "";

if(msg.reply){
   const repliedDiv = msgDivMap[msg.reply];
   if(repliedDiv){
      const repliedText =
        repliedDiv.querySelector(".msg-text")?.innerText || "";

      const repliedUser =
        repliedDiv.classList.contains("sent") ? "You" : "User";

      replyHTML = `
        <div class="reply-preview-wa" data-reply-id="${msg.reply}">
          <div class="reply-user">${repliedUser}</div>
          <div class="reply-text">${linkify(repliedText)}</div>
        </div>
      `;
   }
}

if(msg.sender !== currentUser){

   let showDp = true;

   // 🔥 CLEAN FIX — reload proof
   if(lastGroupSender === msg.sender){
       showDp = false;
   }

   lastGroupSender = msg.sender;

   div.dataset.sender = msg.sender;


   div.innerHTML = `
     <div class="insta-msg-row">
       ${showDp 
          ? `<img src="${msg.senderPhoto || 'dp.jpg'}" class="insta-dp">`
          : `<div class="insta-dp-placeholder"></div>`}

       <div class="insta-bubble">
         ${replyHTML}
         ${
  msg.media
    ? (msg.mediaType === "image"
        ? `<img src="${msg.media}" style="max-width:220px;border-radius:10px;">`
        : `<video src="${msg.media}" controls style="max-width:220px;border-radius:10px;"></video>`)
    : `<div class="msg-text">${linkify(msg.text || "")}</div>`
}
         ${msg.edited ? '<div class="edited">(edited)</div>' : ''}
         <div class="msg-time-swipe">${time12}</div>
       </div>
     </div>
   `;
}
else{

  div.innerHTML = `
    <div class="insta-msg-row you">
      <div class="insta-bubble you-bubble">
        ${replyHTML}
       ${
  msg.media
    ? (msg.mediaType === "image"
        ? `<img src="${msg.media}" style="max-width:220px;border-radius:10px;">`
        : `<video src="${msg.media}" controls style="max-width:220px;border-radius:10px;"></video>`)
    : `<div class="msg-text">${linkify(msg.text || "")}</div>`
}
        ${msg.edited ? '<div class="edited">(edited)</div>' : ''}
        <div class="msg-time-swipe">${time12}</div>
      </div>
    </div>
  `;

}




  chatBox.appendChild(div);
  // ✅ GROUP AUTO SEEN
if(msg.sender !== currentUser){

  firebase.database()
    .ref(`groupChats/${selectedGroup}/${id}/seenBy/${currentUser}`)
    .set(true);

}

  const replyPreview = div.querySelector(".reply-preview-wa");
if(replyPreview){
  replyPreview.addEventListener("click", () => {
    const replyId = replyPreview.dataset.replyId;
    const targetDiv = msgDivMap[replyId];

    if(targetDiv){
      targetDiv.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

      targetDiv.classList.add("reply-highlight");
      setTimeout(() => {
        targetDiv.classList.remove("reply-highlight");
      }, 1200);
    }
  });
}

  chatBox.scrollTop = chatBox.scrollHeight;

  msgDivMap[id] = div;
// ✅ SHOW SEEN BY (only for my messages)
if(msg.sender === currentUser){

  firebase.database()
    .ref(`groupChats/${selectedGroup}/${id}/seenBy`)
    .on("value", snap => {

      const data = snap.val();
      if(!data) return;

      const seenUsers = Object.keys(data)
        .filter(uid => uid !== currentUser);

      if(seenUsers.length === 0) return;

      Promise.all(
        seenUsers.map(uid =>
          firebase.database().ref("users/"+uid).once("value")
        )
      ).then(results => {

        const names = results
          .map(r => r.val()?.username)
          .filter(Boolean)
          .join(", ");

        // 🔥 REMOVE OLD SEEN FROM ALL MESSAGES
        document.querySelectorAll(".group-seen-text")
          .forEach(el => el.remove());

        // 🔥 ADD SEEN ONLY TO THIS (LATEST READ) MESSAGE
        const seenDiv = document.createElement("div");
        seenDiv.className = "group-seen-text";
        seenDiv.innerText = "Seen by " + names;

        div.appendChild(seenDiv);

      });

    });

}


  addGroupLongPress(div,id,msg);
}

// 🔥 NEW 2 STEP GROUP SYSTEM

document.addEventListener("DOMContentLoaded", () => {

  const groupPopup = document.getElementById("groupPopup");
  const createGroupBtn = document.getElementById("createGroupBtn");
  const closeGroupPopup = document.getElementById("closeGroupPopup");

  const step1 = document.getElementById("groupStep1");
  const step2 = document.getElementById("groupStep2");

  const nextBtn = document.getElementById("groupNextBtn");
  const confirmBtn = document.getElementById("createGroupConfirmBtn");

  const searchInput = document.getElementById("groupUserSearch");
  const userList = document.getElementById("userSelectList");

  // 🔹 OPEN POPUP
  createGroupBtn.addEventListener("click", () => {
    groupPopup.classList.remove("hidden");
    step1.classList.remove("hidden");
    step2.classList.add("hidden");
    loadUsersForGroup();
  });

  // 🔹 CLOSE POPUP
  closeGroupPopup.addEventListener("click", () => {
    groupPopup.classList.add("hidden");
  });

  // 🔹 SEARCH FILTER
  searchInput.addEventListener("input", () => {
    const value = searchInput.value.toLowerCase();
    const items = userList.querySelectorAll(".user-select-item");

    items.forEach(item => {
      const username = item.innerText.toLowerCase();
      item.style.display =
        username.includes(value) ? "block" : "none";
    });
  });

  // 🔹 NEXT BUTTON
  nextBtn.addEventListener("click", () => {

    const checkedUsers =
      document.querySelectorAll("#userSelectList input:checked");

    if(checkedUsers.length === 0){
      showCustomPopup("Select at least one member");
      return;
    }

    step1.classList.add("hidden");
    step2.classList.remove("hidden");
  });

  // 🔹 CREATE GROUP
  confirmBtn.addEventListener("click", () => {

    const groupName =
      document.getElementById("groupNameInput").value.trim();

    if(!groupName){
      showCustomPopup("Enter group name");
      return;
    }

    const checkedUsers =
      document.querySelectorAll("#userSelectList input:checked");

    const groupRef = firebase.database().ref("groups").push();
    const groupId = groupRef.key;

    let members = {};
    members[currentUser] = true;

    checkedUsers.forEach(cb => {
      members[cb.value] = true;
    });

    groupRef.set({
      groupName: groupName,
      createdBy: currentUser,
      members: members,
      groupImg: "group.jpg",
      createdAt: Date.now()
    });

    groupPopup.classList.add("hidden");

    document.getElementById("groupNameInput").value = "";
    searchInput.value = "";
    userList.querySelectorAll("input")
      .forEach(cb => cb.checked = false);

    showCustomPopup("Group Created Successfully ✅");
  });

});
function showCustomPopup(message){

  const popup = document.getElementById("customPopup");
  const msg = document.getElementById("popupMessage");

  msg.innerText = message;
  popup.classList.remove("hidden");

  setTimeout(()=>{
    popup.classList.add("hidden");
  },2000);
}

function showGroupMembers(groupId){

  const popup = document.getElementById("groupMembersPopup");
  const list = document.getElementById("groupMembersList");

  list.innerHTML = "";
  popup.classList.remove("hidden");

  firebase.database().ref("groups/" + groupId).once("value").then(snap => {

    const group = snap.val();
    if(!group || !group.members) return;

    Object.keys(group.members).forEach(uid => {

      firebase.database().ref("users/" + uid).once("value").then(userSnap => {

        const user = userSnap.val();
        if(!user) return;

        const div = document.createElement("div");
        div.style.display = "flex";
        div.style.alignItems = "center";
        div.style.gap = "10px";
        div.style.padding = "8px";
        div.style.cursor = "pointer";
        div.style.borderBottom = "1px solid #eee";

        div.innerHTML = `
          <img src="${user.photoURL || 'dp.jpg'}"
               style="width:40px;height:40px;border-radius:50%;">
          <span>@${user.username || "User"}</span>
        `;

        div.onclick = () => {
          window.location.href = `user.html?uid=${uid}`;
        };

        list.appendChild(div);

      });

    });

  });

}
function closeGroupMembers(){
  document.getElementById("groupMembersPopup").classList.add("hidden");
}
function addGroupLongPress(div,id,msg){

  let pressTimer;

  div.addEventListener("mousedown",()=>{
    pressTimer=setTimeout(()=>{
      if(msg.sender === currentUser){
        showGroupOptions(div,id,msg);
      }else{
        showGroupReplyOnly(div,id,msg);
      }
    },500);
  });

  div.addEventListener("mouseup",()=>clearTimeout(pressTimer));
  div.addEventListener("mouseleave",()=>clearTimeout(pressTimer));

  div.addEventListener("touchstart",()=>{
    pressTimer=setTimeout(()=>{
      if(msg.sender === currentUser){
        showGroupOptions(div,id,msg);
      }else{
        showGroupReplyOnly(div,id,msg);
      }
    },500);
  });

  div.addEventListener("touchend",()=>clearTimeout(pressTimer));
}
function showGroupOptions(msgDiv,msgId,msgData){

  const existing = document.getElementById("msgOptionsBox");
  if(existing) existing.remove();

  const box = document.createElement("div");
  box.id = "msgOptionsBox";
  box.className = "msg-options-box";

  const unsend = document.createElement("button");
  unsend.innerHTML = '<i class="fa-solid fa-arrow-rotate-left"></i> Unsend';
  unsend.onclick = ()=>{
    firebase.database()
      .ref(`groupChats/${selectedGroup}/${msgId}`)
      .remove();
    box.remove();
  };

  const reply = document.createElement("button");
  reply.innerHTML = '<i class="fa-solid fa-reply"></i> Reply';
  reply.onclick = ()=>{
    replyToMessage(msgId,msgData);
    box.remove();
  };

  const edit = document.createElement("button");
  edit.innerHTML = '<i class="fa-solid fa-pencil"></i> Edit';
  edit.onclick = (e)=>{
  e.stopPropagation();   // 🔥 VERY IMPORTANT
  editingMessageId = msgId;
  msgInput.value = msgData.text;
  replyBox.classList.remove("hidden");
  replyBox.innerHTML = `
    <div class="reply-left">
      <div class="reply-title">Editing</div>
      <div class="reply-msg">${msgData.text}</div>
    </div>
    <div class="reply-close" onclick="cancelReply()">✕</div>
  `;
  box.remove();
};


  box.appendChild(unsend);
  box.appendChild(reply);
  box.appendChild(edit);

  document.body.appendChild(box);

  let bubble =
      msgDiv.querySelector(".insta-bubble") ||
      msgDiv.querySelector(".bubble") ||
      msgDiv.querySelector(".message-bubble") ||
      msgDiv.lastElementChild;

if(!bubble){
   bubble = msgDiv;
}

const rect = bubble.getBoundingClientRect();
 box.style.top = (rect.top - 60) + "px";
box.style.left = rect.left + "px";

  box.style.left = rect.left + "px";
}
function showGroupReplyOnly(msgDiv,msgId,msgData){

  const existing = document.getElementById("msgOptionsBox");
  if(existing) existing.remove();

  const box = document.createElement("div");
  box.id = "msgOptionsBox";
  box.className = "msg-options-box";
box.addEventListener("click",(e)=>{
  e.stopPropagation();
});

  const reply = document.createElement("button");
  reply.innerText = "Reply";
  reply.onclick = ()=>{
    replyToMessage(msgId,msgData);
    box.remove();
  };

  box.appendChild(reply);
  document.body.appendChild(box);

  let bubble =
      msgDiv.querySelector(".insta-bubble") ||
      msgDiv.querySelector(".bubble") ||
      msgDiv.querySelector(".message-bubble") ||
      msgDiv.lastElementChild;

if(!bubble){
   bubble = msgDiv;
}

const rect = bubble.getBoundingClientRect();
  box.style.top = (rect.top - 60) + "px";
box.style.left = rect.left + "px";

  box.style.left = rect.left + "px";
}
function leaveGroup(){

  if(!selectedGroup || !currentUser) return;

  // 🔥 user ko group se remove karo
  firebase.database()
    .ref("groups/" + selectedGroup + "/members/" + currentUser)
    .remove()
    .then(() => {

      // popup hide
      document.getElementById("leaveGroupPopup").classList.add("hidden");

      // 🔥 refresh chat.html
      window.location.reload();

    });

}

