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

// ---------- Variables ----------
let currentUser=null;
let selectedUser=null;
let replyTo=null;
let typingDiv = null;

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
  if(!selectedUser) return;
  const chatId = getChatId(currentUser, selectedUser);
  firebase.database().ref(`typing/${chatId}/${currentUser}`).set(true);
});

// Typing stop: input blur ya enter press
msgInput.addEventListener("blur", () => {
  if(!selectedUser) return;
  const chatId = getChatId(currentUser, selectedUser);
  firebase.database().ref(`typing/${chatId}/${currentUser}`).set(false);
});

const chatDivMap = {}; // ye track karega har chatId ka div

// ---------- Auth ----------
firebase.auth().onAuthStateChanged(user=>{
  if(!user){location.href="profile.html";return;}
  currentUser=user.uid;

  // ✅ URL se uid read karo
  const params = new URLSearchParams(window.location.search);
  const openUid = params.get("uid");

  loadChatList();

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
  const lastText = last.text || "📷 Image";
  div.innerHTML = `
    <img src="${userData.photoURL || 'default.jpg'}">
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

      chatList.appendChild(div);
    });
  });
}

// ---------- Open Chat ----------
function openChat(uid){
   hideReplyBox();   // 🔥 yaha add karo
  selectedUser = uid;
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
      const userData = snap.val() || {};

      chatUserName.innerHTML = `
        <div style="display:flex; align-items:center; gap:4px;">
          @${userData.username || "User"}
          ${userData.verified ? '<img src="https://upload.wikimedia.org/wikipedia/commons/e/e4/Twitter_Verified_Badge.svg" style="width:16px;height:16px;">' : ''}
        </div>
      `;

      chatUserImg.src = userData.photoURL || "default.jpg";

      document.getElementById("chatUserInfo").onclick = function(){
          // ✅ ab uid properly captured
          window.location.href = `user.html?uid=${selectedUser}`;
      };
  });
}

// ---------- Load Messages ----------
function loadMessages(){
  // 🔥 Remove old listeners
firebase.database().ref(`typing/${getChatId(currentUser,selectedUser)}/${selectedUser}`).off();
firebase.database().ref("chats/"+getChatId(currentUser,selectedUser)).off();

  chatBox.innerHTML="";
  shownDays = {};

  const chatId=getChatId(currentUser,selectedUser);
  // ---------- Show typing indicator for other user ----------
firebase.database().ref(`typing/${chatId}/${selectedUser}`).on("value", snap => {
  const isTyping = snap.val();

  if(isTyping){
    if(!typingDiv){
      typingDiv = document.createElement("div");
      typingDiv.className = "msg received typing-msg";
      typingDiv.innerHTML = `
        <div class="typing-bubble">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      `;
      chatBox.appendChild(typingDiv);
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  }else{
    if(typingDiv){
      typingDiv.remove();
      typingDiv = null;
    }
  }
});

  firebase.database().ref("chats/"+chatId).on("child_added", snap => {
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
    if(div){
        // ✅ Update message text
        const textSpan = div.querySelector(".msg-text");
        if(textSpan) textSpan.innerText = updatedMsg.text || "📷 Image";

        // ✅ Add / remove edited label
        let editedLabel = div.querySelector(".edited-label");
        if(updatedMsg.edited){
            if(!editedLabel){
                editedLabel = document.createElement("span");
                editedLabel.className = "edited-label";
                editedLabel.innerText = "(edited)";
                div.appendChild(editedLabel);
            }
        } else {
            if(editedLabel) editedLabel.remove();
        }

        // 🔹 UPDATE REPLY PREVIEWS
        // loop through all messages to see if kisi ne is msg pe reply kiya
        Object.values(msgDivMap).forEach(mDiv => {
            const replyPreview = mDiv.querySelector(`.reply-preview-wa[data-reply-id='${msgId}'] .reply-text`);
            if(replyPreview){
                replyPreview.innerText = updatedMsg.text || "📷 Image";
            }
        });
    }


    // --------------------------
    // 🔥 Seen logic: only when readTime updated (ignore edits)
    // --------------------------
    // Check: updatedMsg.readTime exists AND sender is currentUser
    if(updatedMsg.sender === currentUser && updatedMsg.read && updatedMsg.readTime && !updatedMsg.edited){
        if(!div) return;

        // Remove old seen
        if(lastSeenMsgDiv){
            const oldSeen = lastSeenMsgDiv.querySelector(".seen-text");
            if(oldSeen) oldSeen.remove();
        }

        // Show seen on this message
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

let lastSentMsgDiv = null;
let lastSeenMsgDiv = null;

let msgDivMap = {};
let editingMessageId = null; // abhi kaun sa message edit ho raha hai

function addMessage(msg,id){

  const msgDate = new Date(msg.time);
  const today = new Date();

  let dayKey = "";
  let label = "";

  // -------- DATE SEPARATOR (same logic) --------
  if(msgDate.toDateString() === today.toDateString()){
    dayKey = "today";
    label = "Today";
  }else{
    const y = new Date();
    y.setDate(today.getDate() - 1);

    if(msgDate.toDateString() === y.toDateString()){
      dayKey = "yesterday";
      label = "Yesterday";
    }else{
      dayKey = msgDate.toDateString();
      label = msgDate.toLocaleDateString();
    }
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

div.innerHTML = `
  ${replyHTML}
  <span class="msg-text">${linkify(msg.text) || "📷 Image"}</span>

  ${msg.edited ? '<span class="edited-label">(edited)</span>' : ''}
  <span class="msg-time-swipe">${time12}</span>
`;



chatBox.appendChild(div);
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

// 👇 swipe logic
let startX = 0;

div.addEventListener("touchstart", e=>{
  startX = e.touches[0].clientX;
});

div.addEventListener("touchmove", e=>{
  const diff = startX - e.touches[0].clientX;
  if(diff > 30){
    div.classList.add("show-time");
  }
});

div.addEventListener("touchend", ()=>{
  setTimeout(()=>{
    div.classList.remove("show-time");
  }, 800);
});


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
    const rect = msgDiv.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset;
    const scrollX = window.scrollX || window.pageXOffset;

    let top = rect.top - 50 + scrollY;
    let left = rect.left + scrollX;

    if(top < 10) top = rect.bottom + scrollY + 5;

    box.style.top = top + "px";
    box.style.left = left + "px";

    // ---------- Only Reply Button ----------
    const reply = document.createElement("button");
    reply.innerHTML = '<i class="fa-solid fa-reply"></i> Reply';
    reply.onclick = () => {
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
        firebase.database().ref(`chats/${chatId}`).push({
            sender: currentUser,
            text: msgInput.value,
            reply: replyTo,
            time: Date.now(),
            read: false,
            readTime: null
        });

        replyTo = null;
        replyBox.classList.add("hidden");
        msgInput.value = "";
         hideReplyBox();   // 🔥 VERY IMPORTANT
    }
};


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

    // box ko message ke upar dikhao
    const rect = msgDiv.getBoundingClientRect();
    box.style.top = (rect.top - 50 + window.scrollY) + "px";
    box.style.left = rect.left + "px";

    // ---------- Options ----------
    const unsend = document.createElement("button");
    unsend.innerHTML = '<i class="fa-solid fa-arrow-rotate-left"></i> Unsend';
    unsend.onclick = () => {
        unsendMessage(msgId);
        box.remove();
    };

const scrollY = window.scrollY || window.pageYOffset;
const scrollX = window.scrollX || window.pageXOffset;

let top = rect.top - 50 + scrollY;
let left = rect.left + scrollX;

// Agar top negative ho jaye (screen ke upar), to adjust karo
if(top < 10) top = rect.bottom + scrollY + 5;

box.style.top = top + "px";
box.style.left = left + "px";

    const reply = document.createElement("button");
reply.innerHTML = '<i class="fa-solid fa-reply"></i> Reply';

    reply.onclick = () => {
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
    const chatId = getChatId(currentUser, selectedUser);
    firebase.database().ref(`chats/${chatId}/${msgId}`).remove();
}
function editMessage(msgId, msgData){
    editingMessageId = msgId;                // ✅ ab ye message edit mode me hai
    replyTo = null;                          // reply mode cancel ho jaye
    replyBox.classList.add("hidden");        // reply box hide

    // input me message text fill karo
   
    msgInput.focus();

    // edit label dikhane ke liye replyBox ya alag box
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
    if(editingMessageId && !inputClicked && !replyClicked && !optionsClicked){
        editingMessageId = null;
        replyBox.classList.add("hidden");
        msgInput.value = "";
    }

    // ---------- CANCEL REPLY ----------
    if(replyTo && !inputClicked && !replyClicked && !optionsClicked){
        replyTo = null;
        replyBox.classList.add("hidden");
    }
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
function showSeen(div, readTime){
  const seen = document.createElement("div");
  seen.className = "seen-text";
  seen.innerText = "seen " + seenTimeFormat(readTime);
  div.appendChild(seen);
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
    // Chat screen hide, chat list show
    chatScreen.classList.add("hidden");
    chatListScreen.style.display = "block";

    // Selected user reset
    selectedUser = null;

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
