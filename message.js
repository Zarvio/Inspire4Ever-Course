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
// Supabase URL & anon key
const supabaseUrl = "https://lxbojhmvcauiuxahjwzk.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4Ym9qaG12Y2F1aXV4YWhqd3prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MzM3NjEsImV4cCI6MjA4MDUwOTc2MX0.xP1QCzWIwnWFZArsk_5C8wCz7vkPrmwmLJkEThT74JA";

// Initialize Supabase (sirf ek hi baar)
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);




// ---------- Elements ----------
const chatListScreen = document.getElementById("chatListScreen");
const chatScreen = document.getElementById("chatScreen");
const chatList = document.getElementById("chatList");
const chatBox = document.getElementById("chatBox");
const msgInput = document.getElementById("msgInput");
const sendBtn = document.getElementById("sendBtn");
const chatUserName = document.getElementById("chatUserName");
const backBtn = document.getElementById("backBtn");
const listBackBtn = document.getElementById("listBackBtn");
const typingIndicator = document.getElementById("typingIndicator");

let currentUserId = null;
let selectedUserId = null;

// ---------- URL से UID ----------
const params = new URLSearchParams(window.location.search);
const targetUid = params.get("uid"); // user.html से आया UID

// ---------- Auth ----------
firebase.auth().onAuthStateChanged(user => {
  if (!user) {
    alert("Login first");
    location.href = "profile.html";
    return;
  }

  currentUserId = user.uid;

  // पहले chat list load करो
  loadChatList().then(() => {
    // अगर targetUid है → auto open
    if (targetUid) {
      firebase.database().ref("users/" + targetUid).once("value").then(snap => {
        const userData = snap.val();
        if (!userData) {
          alert("User not found");
          return;
        }
        openChat(targetUid, userData.username);
      });
    }
  });
});

// ---------- Load chat list ----------
// ---------- Load chat list with live updates ----------
async function loadChatList() {
  const chatRef = firebase.database().ref("chats");
  chatRef.off(); // duplicate listener prevent

  chatRef.on("value", async snapshot => {
    chatList.innerHTML = ""; // Clear previous list
    const chats = snapshot.val();
    if (!chats) return;

    const chatIds = Object.keys(chats).filter(id => id.includes(currentUserId));
    const addedUsers = new Set();

    for (const chatId of chatIds) {
      const ids = chatId.split("_");
      const otherUid = ids[0] === currentUserId ? ids[1] : ids[0];

      if (addedUsers.has(otherUid)) continue;
      addedUsers.add(otherUid);

      const userSnap = await firebase.database().ref("users/" + otherUid).once("value");
      const userData = userSnap.val();
      if (!userData) continue;

      const messagesSnap = await firebase.database().ref("chats/" + chatId).once("value");
      const messages = messagesSnap.val();
      if (!messages) continue;

      const lastMsgKey = Object.keys(messages).pop();
      const lastMsg = messages[lastMsgKey].text;

      let hasUnread = false;
      Object.values(messages).forEach(msg => {
        if (msg.sender !== currentUserId && !msg.read) hasUnread = true;
      });

      const div = document.createElement("div");
      div.className = "chat-item";
      div.style.position = "relative";

      div.innerHTML = `
        <img src="${userData.photoURL || 'default.jpg'}" style="width:50px; height:50px; border-radius:50%; object-fit:cover; margin-right:10px;">
        <div class="chat-info" style="display:flex; flex-direction:column; justify-content:center;">
          <div class="chat-name" style="display:flex; align-items:center; font-weight:${hasUnread ? 'bold' : 'normal'}; font-size:14px; gap:4px;">
            ${userData.username || "User"}
            ${userData.verified ? '<img src="https://upload.wikimedia.org/wikipedia/commons/e/e4/Twitter_Verified_Badge.svg" style="width:16px; height:16px;">' : ''}
          </div>
          <div class="chat-last" style="font-size:13px; color:#555; margin-top:2px;">${lastMsg}</div>
        </div>
      `;

      if (hasUnread) {
        const dot = document.createElement("span");
        dot.className = "unread-dot";
        dot.style.cssText = `
          width:8px;
          height:8px;
          background:red;
          border-radius:50%;
          position:absolute;
          top:12px;
          right:10px;
        `;
        div.appendChild(dot);
      }

      div.onclick = async () => {
        selectedUserId = otherUid;

        const chatRef = firebase.database().ref("chats/" + chatId);

        Object.keys(messages).forEach(msgId => {
          const msg = messages[msgId];
          if (msg.sender !== currentUserId && !msg.read) {
            chatRef.child(msgId).update({ read: true });
          }
        });

        openChat(otherUid, userData);


        const dotElem = div.querySelector(".unread-dot");
        if (dotElem) dotElem.remove();

        updateUnreadCount();
      };

      chatList.appendChild(div);

      // ---------- Live update red dot ----------
      firebase.database().ref(`chats/${chatId}`).on("child_changed", snap => {
        const updatedMsg = snap.val();
        if (updatedMsg.sender !== currentUserId) {
          const dotElem = div.querySelector(".unread-dot");
          if (updatedMsg.read) {
            if (dotElem) dotElem.remove();
          } else {
            if (!dotElem) {
              const dot = document.createElement("span");
              dot.className = "unread-dot";
              dot.style.cssText = `
                width:8px;
                height:8px;
                background:red;
                border-radius:50%;
                position:absolute;
                top:12px;
                right:10px;
              `;
              div.appendChild(dot);
            }
          }
        }
      });
    }

    updateUnreadCount();
  });
}


// ---------- Open chat ----------
function openChat(otherUid, userData) {
  selectedUserId = otherUid;

  // Username
  chatUserName.innerText = userData.username || "Chat";

  // Profile Image
  const chatUserImg = document.getElementById("chatUserImg");
  chatUserImg.src = userData.photoURL || "default.jpg";

  // 🔗 Header click → user.html
  const chatUserInfo = document.getElementById("chatUserInfo");
chatUserInfo.onclick = () => {
  window.location.href = `user.html?uid=${otherUid}`;
};


  // ---------- UI Switch ----------
  chatListScreen.style.display = "none";
  chatScreen.style.display = "flex";
  chatBox.innerHTML = "";

  const chatId = getChatId(currentUserId, selectedUserId);

  // ---------- Chat listener ----------
  const chatRef = firebase.database().ref("chats/" + chatId);
  chatRef.off();

  // First load old messages
  chatRef.once("value").then(snapshot => {
    const msgs = snapshot.val();
    if (msgs) {
      Object.keys(msgs).forEach(msgId => {
        addMessage(msgs[msgId], msgId, chatId);
      });
    }
  });

  // New messages live
  chatRef.on("child_added", snap => {
    addMessage(snap.val(), snap.key, chatId);
  });


  // Listen for changes in existing messages (for live seen)
  firebase.database().ref("chats/" + chatId).on("child_changed", snap => {
    const updatedMsg = snap.val();
    const msgDivs = chatBox.querySelectorAll(".msg");
    msgDivs.forEach(div => {
      if (div.dataset.msgId === snap.key) {
        updateMessageStatus(div, updatedMsg, snap.key, chatId);
      }
    });
  });
}

// ---------- Send message ----------
sendBtn.onclick = sendMessage;
msgInput.onkeydown = e => {
  if (e.key === "Enter") sendMessage();
};

function sendMessage() {
  const text = msgInput.value.trim();
  if (!text || !selectedUserId) return;

  const chatId = getChatId(currentUserId, selectedUserId);

  const newMsgRef = firebase.database().ref("chats/" + chatId).push();
  newMsgRef.set({
    sender: currentUserId,
    text: text,
    time: Date.now(),
    read: false
  });

  msgInput.value = "";
}
function linkify(text) {
  const urlPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
  return text.replace(urlPattern, '<a href="$1" target="_blank" style="color:blue; text-decoration:underline;">$1</a>');
}

// ---------- Add message UI ----------
function addMessage(msg, msgId, chatId) {
  const div = document.createElement("div");
  div.className = "msg";
  div.dataset.msgId = msgId;

  if (msg.sender === currentUserId) div.classList.add("sent");
  else div.classList.add("received");

  if (msg.image) {
  // Image box me wrap karo
  div.innerHTML = `
    <div class="img-box">
      <img src="${msg.image}" class="chat-image">
    </div>
  `;
} else {
  div.innerHTML = linkify(msg.text || "");
}



  // Time
  const timeDiv = document.createElement("div");
  timeDiv.className = "msg-time";
  timeDiv.style.fontSize = "10px";
  timeDiv.style.color = "#888";
  timeDiv.style.marginTop = "2px";
  div.appendChild(timeDiv);

  // Sent/Seen Status for your messages
 if (msg.sender === currentUserId) {
  const statusSpan = document.createElement("span");
  statusSpan.style.fontSize = "12px";
  statusSpan.style.marginLeft = "5px";
  timeDiv.appendChild(statusSpan);

  // Live listener for read status
  firebase.database().ref(`chats/${chatId}/${msgId}/read`).on("value", snap => {
    const read = snap.val();
    if (read) {
      const diff = Math.floor((Date.now() - msg.time) / 60000);
      if (diff < 1) {
        statusSpan.innerText = "seen just now";
      } else if (diff < 60) {
        statusSpan.innerText = `seen ${diff} min ago`;
      } else {
        const hours = Math.floor(diff / 60);
        statusSpan.innerText = `seen ${hours} h ago`;
      }
      statusSpan.style.color = "blue";
    } else {
      statusSpan.innerText = "sent";
      statusSpan.style.color = "#888";
    }
  });
}


  chatBox.appendChild(div);
  // Image click to fullscreen
chatBox.addEventListener("click", (e) => {
  if (e.target.classList.contains("chat-image")) {
    const overlay = document.getElementById("imgOverlay");
    const overlayImg = document.getElementById("overlayImg");
    overlayImg.src = e.target.src;
    overlay.style.display = "flex";
  }
});

// Click overlay to close
document.getElementById("imgOverlay").addEventListener("click", () => {
  document.getElementById("imgOverlay").style.display = "none";
});

  chatBox.scrollTop = chatBox.scrollHeight;
}

// ---------- Update message status ----------
function updateMessageStatus(div, msg, msgId, chatId) {
  const statusSpan = div.querySelector("span");
  if (!statusSpan) return;

  firebase.database().ref(`chats/${chatId}/${msgId}`).once("value").then(snap => {
    const m = snap.val();
    if (!m) return;

    if (m.read) {
      const diff = Math.floor((Date.now() - m.time) / 60000);
      if (diff < 1) {
        statusSpan.innerText = "seen just now";
      } else if (diff < 60) {
        statusSpan.innerText = `seen ${diff} min ago`;
      } else {
        const hours = Math.floor(diff / 60);
        statusSpan.innerText = `seen ${hours} h ago`;
      }
      statusSpan.style.color = "blue";
    } else {
      statusSpan.innerText = "sent";
      statusSpan.style.color = "#888";
    }
  });
}

// ---------- Chat ID system ----------
function getChatId(a, b) {
  return a < b ? a + "_" + b : b + "_" + a;
}

// ---------- Back buttons ----------
backBtn.onclick = () => {
  chatScreen.style.display = "none";
  chatListScreen.style.display = "flex";
};

listBackBtn.onclick = () => {
  window.location.href = "main.html";
};

// ---------- Update index.html unread count ----------
function updateUnreadCount() {
  firebase.database().ref("chats").once("value").then(snapshot => {
    const chats = snapshot.val();
    if (!chats) return;
    let totalUnread = 0;

    Object.keys(chats).forEach(chatId => {
      const msgs = chats[chatId];
      Object.values(msgs).forEach(msg => {
        if (msg.sender !== currentUserId && !msg.read) totalUnread++;
      });
    });

    const notifBadge = document.getElementById("notifBadge");
    if (notifBadge) {
      notifBadge.innerText = totalUnread > 0 ? totalUnread : "";
    }
  });
}

// Initial unread count
updateUnreadCount();

// ---------- Typing Indicator ----------
msgInput.oninput = () => {
  if (!selectedUserId) return;

  firebase.database().ref("typingStatus/" + currentUserId).set(true);

  setTimeout(() => {
    firebase.database().ref("typingStatus/" + currentUserId).set(false);
  }, 2000);
};

firebase.database().ref("typingStatus").on("value", snap => {
  const status = snap.val();
  if (selectedUserId && status && status[selectedUserId]) {
    typingIndicator.innerText = "Typing...";
  } else {
    typingIndicator.innerText = "";
  }
});
const imgInput = document.getElementById("imgInput");
const imgBtn = document.getElementById("imgBtn");

imgBtn.onclick = () => imgInput.click();
imgInput.onchange = async (e) => {
  const file = e.target.files[0];
  if (!file || !selectedUserId) return;

  const chatId = getChatId(currentUserId, selectedUserId);
  const filePath = `chatImages/${chatId}/${Date.now()}_${file.name}`;

  const { data, error } = await supabaseClient.storage
  .from('Zarvio')
  .upload(filePath, file);

if (error) {
  console.error("Upload error:", error.message);
  return;
}

const { data: urlData, error: urlError } = supabaseClient.storage
  .from('Zarvio')
  .getPublicUrl(filePath);

if (urlError) {
  console.error("URL error:", urlError.message);
  return;
}

// Firebase me save karo
const newMsgRef = firebase.database().ref("chats/" + chatId).push();
newMsgRef.set({
  sender: currentUserId,
  image: urlData.publicUrl,
  time: Date.now(),
  read: false
});

  imgInput.value = ""; // Reset
};
