let allPosts = [];
let currentFilter = "all";
let followingList = [];


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
window.sendLikeNotification = async function(postId) {
  console.log("🔔 sendLikeNotification fired for:", postId);

  try {
    const { data: post, error } = await window.supabaseClient
      .from("pinora823")
      .select("uploader_uid, thumb_url")
      .eq("id", postId)
      .single();

    if (error || !post) {
      console.error("❌ Supabase post fetch failed", error);
      return;
    }

    if (!post.uploader_uid) {
      console.warn("⚠ uploader_uid missing in pinora823 table");
      return;
    }

    const user = firebase.auth().currentUser;
    const browserId = getBrowserId();

    const fromName = user ? (user.displayName || "User") : "Guest";
    const fromUid = user ? user.uid : browserId;

    if (user && post.uploader_uid === user.uid) return;

    const notifRef = firebase.database()
      .ref(`notifications/${post.uploader_uid}`)
      .push();

    await notifRef.set({
      from: fromName,
      fromUid: fromUid,
      postId: postId,
      thumb: post.thumb_url || "default.jpg",
      commentText: "",

      text: `${fromName} liked your video`,
      profileImage: user?.photoURL || "default.jpg",
      verified: user?.emailVerified || false,
      type: "like",
      read: false,
      timestamp: Date.now()
    });

    console.log("✅ Notification created");

  } catch (err) {
    console.error("🔥 sendLikeNotification error:", err);
  }
  
};

window.sendCommentNotification = async function(postId, commentText) {
  console.log("💬 sendCommentNotification fired for:", postId);

  try {
    const { data: post, error } = await window.supabaseClient
      .from("pinora823")
      .select("uploader_uid, thumb_url")
      .eq("id", postId)
      .single();

    if (error || !post || !post.uploader_uid) return;

    const user = firebase.auth().currentUser;
    if (!user) return;

    // ❌ apne hi video pe comment → no notification
    if (post.uploader_uid === user.uid) return;

    const notifRef = firebase.database()
      .ref(`notifications/${post.uploader_uid}`)
      .push();

    await notifRef.set({
      from: user.displayName || "User",
      fromUid: user.uid,
      postId: postId,
      thumb: post.thumb_url || "default.jpg",
      commentText: commentText,

      text: `${user.displayName || "User"} commented on your video`,
      profileImage: user.photoURL || "default.jpg",
      verified: user.emailVerified || false,
      type: "comment",
      read: false,
      timestamp: Date.now()
    });

    

  } catch (err) {
    console.error("🔥 sendCommentNotification error:", err);
  }
};


// ----------------------
// 🌐 GUEST BROWSER ID
// ----------------------
function getBrowserId() {
  let id = localStorage.getItem("browser_id");
  if (!id) {
    id = "browser_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("browser_id", id);
  }
  return id;
}
function hasViewed(postId) {
  return sessionStorage.getItem("viewed_" + postId) === "1";
}

function markViewed(postId) {
  sessionStorage.setItem("viewed_" + postId, "1");
}


// ----------------------
// MAIN DOM LOADED
// ----------------------
document.addEventListener("DOMContentLoaded", async () => {
    const SUPABASE_URL = "https://lxbojhmvcauiuxahjwzk.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4Ym9qaG12Y2F1aXV4YWhqd3prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MzM3NjEsImV4cCI6MjA4MDUwOTc2MX0.xP1QCzWIwnWFZArsk_5C8wCz7vkPrmwmLJkEThT74JA";

    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const main = document.querySelector(".main-content");
    const modal = document.getElementById("videoModal");
    const modalVideo = document.getElementById("modalVideo");
    const modalImage = document.getElementById("modalImage");
    const modalTitle = document.getElementById("modalTitle");
    const relatedVideos = document.getElementById("relatedVideos");
    const closeBtn = document.querySelector(".closeBtn");
    const searchVideoInput = document.getElementById("searchVideoInput");
    const filterBtns = document.querySelectorAll(".filter-btn");

filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {

    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    currentFilter = btn.dataset.filter;
    applyFilters();
  });
  
});


    if (!main) return;

    main.innerHTML = "<h3>Loading...</h3>";

    

    // ----------------
    // FETCH POSTS
    // ----------------
    try {
        const { data, error } = await supabaseClient
            .from("pinora823")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;
        allPosts = data || [];
applyFilters();


    } catch (err) {
        console.error("Error fetching posts:", err);
        main.innerHTML = "<p>Error loading posts.</p>";
    }
// ----------------------
// 👁️ REAL VIEW COUNT LOGIC
// ----------------------
// ----------------------
// 👁️ REAL VIEW COUNT
// ----------------------
async function countView(postId) {

  // ❌ already viewed in this session → STOP
  if (hasViewed(postId)) return;

  const user = firebase.auth().currentUser;
  const viewsRef = firebase.database().ref(`videoViews/${postId}`);

  try {
    if (user) {
      const userRef = viewsRef.child(`users/${user.uid}`);
      const snap = await userRef.get();

      if (!snap.exists()) {
        await userRef.set(true);
        await incrementSupabaseViews(postId);
        markViewed(postId); // ✅ mark
      }

    } else {
      const browserId = getBrowserId();
      const browserRef = viewsRef.child(`browsers/${browserId}`);
      const snap = await browserRef.get();

      if (!snap.exists()) {
        await browserRef.set(true);
        await incrementSupabaseViews(postId);
        markViewed(postId); // ✅ mark
      }
    }
  } catch (err) {
    console.error("Count view error:", err);
  }
}

// ----------------------
// ➕ INCREMENT SUPABASE VIEWS
// ----------------------
async function incrementSupabaseViews(postId) {
  try {
    const { data, error } = await supabaseClient
      .from("pinora823")
      .select("views")
      .eq("id", postId)
      .single();

    console.log("CURRENT VIEWS:", data?.views);

    if (error || !data) {
      console.error("Fetch views error:", error);
      return;
    }

    const newViews = Number(data.views || 0) + 1;

    const { error: updateError } = await supabaseClient
      .from("pinora823")
      .update({ views: newViews })
      .eq("id", postId);

    if (updateError) {
      console.error("UPDATE ERROR:", updateError);
    } else {
      console.log("VIEWS UPDATED TO:", newViews);
    }

  } catch (err) {
    console.error("Increment views error:", err);
  }
}


    // ----------------
    // SEARCH
    // ----------------
    searchVideoInput.addEventListener("input", () => {
  const query = searchVideoInput.value.toLowerCase().trim();
  if (!query) return displayVideos(allPosts);

  const aiResults = [];
  const titleResults = [];
  const added = new Set();

  allPosts.forEach(post => {
    const tags = normalizeTags(post.content_tags);
    const aiMatch = tags.some(tag => tag.includes(query));

    if (aiMatch) {
      aiResults.push(post);
      added.add(post.id);
    }
  });

  allPosts.forEach(post => {
    if (added.has(post.id)) return;

    const titleMatch = post.title &&
      post.title.toLowerCase().includes(query);

    if (titleMatch) {
      titleResults.push(post);
    }
  });

  const finalResults = [...aiResults, ...titleResults];
  displayVideos(finalResults);
});

function normalizeTags(tags) {
  if (!tags) return [];

  // agar string hai: "{bird,animal}"
  if (typeof tags === "string") {
    return tags
      .replace(/[{}"]/g, "")
      .split(",")
      .map(t => t.trim().toLowerCase())
      .filter(Boolean);
  }

  // agar array hai
  if (Array.isArray(tags)) {
    return tags.map(t => String(t).toLowerCase().trim());
  }

  return [];
}



function getSmartRelated(currentPost, allPosts) {

  const stopWords = ["the","is","are","of","to","a","an","and","or","in","on","for","with"];

  const currentTags = normalizeTags(currentPost.content_tags);

  const titleWords = currentPost.title
    ? currentPost.title.toLowerCase()
        .split(" ")
        .filter(w => w.length > 2 && !stopWords.includes(w))
    : [];

  const aiMatches = [];
  const titleMatches = [];
  const added = new Set();

  // 🥇 AI TAG MATCH FIRST
  allPosts.forEach(post => {
    if (post.id === currentPost.id) return;

    const tags = normalizeTags(post.content_tags);
    const matchScore = tags.filter(t => currentTags.includes(t)).length;

    if (matchScore > 0) {
      aiMatches.push({ ...post, score: matchScore });
      added.add(post.id);
    }
  });

  aiMatches.sort((a,b) => b.score - a.score); // best match first

  // 🥈 TITLE MATCH SECOND
  allPosts.forEach(post => {
    if (post.id === currentPost.id || added.has(post.id)) return;
    if (!post.title) return;

    const postTitle = post.title.toLowerCase();
    const match = titleWords.some(w => postTitle.includes(w));

    if (match) titleMatches.push(post);
  });

  return [...aiMatches, ...titleMatches];
}



    // ----------------
    // DISPLAY VIDEOS
    // ----------------
    function displayVideos(posts) {
        main.innerHTML = "";

        if (!posts || posts.length === 0) {
            main.innerHTML = "<p>No videos found.</p>";
            return;
        }

        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        posts.forEach(post => {

            const box = document.createElement("div");
            box.classList.add("pin-box");

            const mediaContainer = document.createElement("div");
            mediaContainer.className = "mediaContainer";

            // OVERLAY
            const overlay = document.createElement("div");
            overlay.className = "uploaderOverlay";

            const verified = post.uploader_verified === true 
                || post.uploader_verified === 'true' 
                || post.uploader_verified === 1 
                || post.uploader_verified === '1';

            const badgeHTML = verified 
                ? `<img src="https://upload.wikimedia.org/wikipedia/commons/e/e4/Twitter_Verified_Badge.svg" style="width:16px; height:16px;">` 
                : '';

            overlay.innerHTML = `
                <div style="display:flex; align-items:center; gap:8px; width:100%;">
                    <img src="${post.uploader_image ? post.uploader_image + '?t=' + Date.now() : 'default.jpg'}" class="uploaderDP" alt="uploader">
                    <div style="display:flex; align-items:center; gap:6px;">
                        <span class="uploaderName">${post.uploader_name || 'Unknown'}</span>
                        ${badgeHTML}
                    </div>
                </div>
            `;
            // overlay ke andar div ko select karo
const uploaderDiv = overlay.querySelector('div');
if (uploaderDiv) {
    uploaderDiv.style.cursor = "pointer";
    uploaderDiv.addEventListener("click", (e) => {
        e.stopPropagation(); // video click se conflict na ho
        if (post.uploader_uid) {
            window.location.href = `user.html?uid=${post.uploader_uid}`;
        }
    });
}

            mediaContainer.appendChild(overlay);

            // VIEWS
            const viewsOverlay = document.createElement("div");
            viewsOverlay.className = "viewsOverlay";
            viewsOverlay.innerHTML = `
                <i class="fa-regular fa-eye"></i>
                <span class="viewCount">${post.views ? post.views.toLocaleString() : 0}</span>
            `;
            mediaContainer.appendChild(viewsOverlay);

            // MEDIA
            let media;
            if (post.file_type.startsWith("video") && isMobile) {
                media = document.createElement("img");
                media.src = post.thumb_url || "images/default.jpg";
            } else if (post.file_type.startsWith("video")) {
                media = document.createElement("video");
                media.src = post.file_url;
                media.muted = true;
                media.loop = true;
                media.playsInline = true;
                media.preload = "metadata";
            } else {
                media = document.createElement("img");
                media.src = post.file_url;
            }

            media.className = "postMedia";

            // ----------------
            // MEDIA CLICK → OPEN MODAL
            // ----------------
            media.addEventListener("click", () => {
               currentPostId = post.id;   // 🔥 VERY IMPORTANT
    updateCommentCount();      // 🔥 FIX
               loadLikes(post.id);
              // ✅ REAL VIEW COUNT
    countView(post.id);
                if (post.file_type.startsWith("video")) {
                    modalVideo.src = post.file_url;
                    modalVideo.style.display = "block";
                    modalImage.style.display = "none";
                    modalVideo.controls = false; // hide browser controls
                } else {
                    modalImage.src = post.file_url;
                    modalImage.style.display = "block";
                    modalVideo.style.display = "none";
                }

                // MODAL TITLE
                modalTitle.innerHTML = `
                    ${post.title || ""}
                    <div class="modalUploader" style="display:flex; align-items:center; gap:5px;">
                        <img src="${post.uploader_image ? post.uploader_image + '?t=' + Date.now() : 'default.jpg'}" class="modalUploaderDP">
                        <span>${post.uploader_name || "Unknown"}</span>
                        ${badgeHTML}
                    </div>
                `;
                // ✅ UPLOADER CLICK → USER PAGE
const modalUploader = modalTitle.querySelector(".modalUploader");
if (modalUploader) {
    modalUploader.style.cursor = "pointer"; // pointer dikhe
    modalUploader.addEventListener("click", () => {
        const uploaderUid = post.uploader_uid;
        if (uploaderUid) {
            window.location.href = `user.html?uid=${uploaderUid}`;
        }
    });
}

// ✅ YAHAN ADD KARO VIEW COUNT
    const modalViewCount = document.getElementById("modalViewCount");
if (modalViewCount) {

  modalViewCount.textContent = post.views.toLocaleString();
}


                modal.classList.remove("hidden");

                // ----------------
                // RELATED VIDEOS
                // ----------------
                relatedVideos.innerHTML = "";

function getSmartRelated(currentPost, allPosts) {

  const stopWords = ["the","is","are","of","to","a","an","and","or","in","on","for","with"];

  const currentTags = normalizeTags(currentPost.content_tags);

  const titleWords = currentPost.title
    ? currentPost.title.toLowerCase()
        .split(" ")
        .filter(w => w.length > 2 && !stopWords.includes(w))
    : [];

  const aiMatches = [];
  const titleMatches = [];
  const added = new Set();

  // 🥇 AI TAG MATCH FIRST
  allPosts.forEach(post => {
    if (post.id === currentPost.id) return;

    const tags = normalizeTags(post.content_tags);
    const matchScore = tags.filter(t => currentTags.includes(t)).length;

    if (matchScore > 0) {
      aiMatches.push({ ...post, score: matchScore });
      added.add(post.id);
    }
  });

  aiMatches.sort((a,b) => b.score - a.score); // best match first

  // 🥈 TITLE MATCH SECOND
  allPosts.forEach(post => {
    if (post.id === currentPost.id || added.has(post.id)) return;
    if (!post.title) return;

    const postTitle = post.title.toLowerCase();
    const match = titleWords.some(w => postTitle.includes(w));

    if (match) titleMatches.push(post);
  });

  return [...aiMatches, ...titleMatches];
}

const finalRelated = getSmartRelated(post, allPosts);


// CLEAR RELATED VIDEOS CONTAINER
relatedVideos.innerHTML = "";

// LOOP THROUGH finalRelated
finalRelated.forEach(other => {

    // CREATE WRAP DIV
    const wrap = document.createElement("div");
    wrap.className = "relatedBox";

    // CHECK VERIFIED
    const relatedVerified =
        other.uploader_verified === true ||
        other.uploader_verified === 'true' ||
        other.uploader_verified === 1 ||
        other.uploader_verified === '1';

    const relatedBadgeHTML = relatedVerified
        ? `<img src="https://upload.wikimedia.org/wikipedia/commons/e/e4/Twitter_Verified_Badge.svg"
             style="width:12px; height:12px; margin-left:4px;">`
        : '';

    // INNER HTML
    wrap.innerHTML = `
        <div class="relatedThumb">
            <img src="${other.thumb_url || other.file_url || 'default_thumb.jpg'}" class="relatedVideoThumb">
            <div class="uploaderHeaderSmall">
                <img src="${other.uploader_image ? other.uploader_image + '?t=' + Date.now() : 'default.jpg'}" class="smallDP">
                <span class="smallName">${other.uploader_name || "User"}</span>
                ${relatedBadgeHTML}
            </div>
        </div>
    `;

    // UPLOADER CLICK → USER PAGE
    const uploaderSmall = wrap.querySelector(".uploaderHeaderSmall");
    if (uploaderSmall) {
        uploaderSmall.style.cursor = "pointer";
        uploaderSmall.addEventListener("click", (e) => {
            e.stopPropagation(); // Prevent modal open
            if (other.uploader_uid) {
                window.location.href = `user.html?uid=${other.uploader_uid}`;
            }
        });
    }

    // WRAP CLICK → OPEN MODAL
    wrap.addEventListener("click", () => {
        currentPostId = other.id;
        updateCommentCount();
        loadLikes(other.id);

        if (other.file_type.startsWith("video")) {
            modalVideo.src = other.file_url;
            modalVideo.style.display = "block";
            modalImage.style.display = "none";
        } else {
            modalImage.src = other.file_url;
            modalImage.style.display = "block";
            modalVideo.style.display = "none";
        }

        modalTitle.innerHTML = `
            ${other.title || ""}
            <div class="modalUploader" style="display:flex; align-items:center; gap:5px;">
                <img src="${other.uploader_image || 'images/default.jpg'}" class="modalUploaderDP">
                <span>${other.uploader_name || "Unknown"}</span>
                ${relatedBadgeHTML}
            </div>
        `;
const modalUploader = modalTitle.querySelector(".modalUploader");
if (modalUploader) {
    modalUploader.style.cursor = "pointer";
    modalUploader.addEventListener("click", (e) => {
        e.stopPropagation();   // ❗ modal click se conflict na ho
        if (other.uploader_uid) {
            window.location.href = `user.html?uid=${other.uploader_uid}`;
        }
    });
}

        modal.classList.remove("hidden");
    });

    // APPEND WRAP ONCE
    relatedVideos.appendChild(wrap);
});




                // ----------------
                // CUSTOM CONTROLS
                // ----------------
              if (!document.querySelector(".custom-controls")) {

    const customControls = document.createElement("div");
    customControls.className = "custom-controls";
    customControls.innerHTML = `
        <button id="playPauseBtn" class="playPauseBtn">
            <i class="fa-solid fa-play"></i>
        </button>

        <input type="range" id="seekBar" value="0" min="0" max="100">

        <div class="timeRow">
            <span id="currentTime">0:00</span> / <span id="duration">0:00</span>
        </div>
    `;

    modal.querySelector(".modal-media-wrapper").appendChild(customControls);

    const playPauseBtn = document.getElementById("playPauseBtn");
    const seekBar = document.getElementById("seekBar");
    const currentTime = document.getElementById("currentTime");
    const duration = document.getElementById("duration");
    const playPauseIcon = playPauseBtn.querySelector("i");

    // 🔁 TOGGLE FUNCTION
    function togglePlayPause() {
        if (modalVideo.paused) {
            modalVideo.play();
            playPauseIcon.className = "fa-solid fa-pause";
        } else {
            modalVideo.pause();
            playPauseIcon.className = "fa-solid fa-play";
        }
    }

    // ▶️⏸ BUTTON CLICK
    playPauseBtn.addEventListener("click", (e) => {
        e.stopPropagation(); // video click se conflict na ho
        togglePlayPause();
    });

    // 👆 VIDEO CLICK ANYWHERE
    modalVideo.addEventListener("click", togglePlayPause);

    // 👁 ICON AUTO SHOW / HIDE
    modalVideo.addEventListener("play", () => {
        playPauseBtn.style.opacity = "0";
    });

    modalVideo.addEventListener("pause", () => {
        playPauseBtn.style.opacity = "1";
    });



                    modalVideo.addEventListener("timeupdate", () => {
                        const value = (modalVideo.currentTime / modalVideo.duration) * 100;
                        seekBar.value = value;
                        currentTime.textContent = formatTime(modalVideo.currentTime);
                    });

                    modalVideo.addEventListener("loadedmetadata", () => {
                        duration.textContent = formatTime(modalVideo.duration);
                    });

                    seekBar.addEventListener("input", () => {
                        modalVideo.currentTime = (seekBar.value / 100) * modalVideo.duration;
                    });

                    function formatTime(seconds) {
                        const mins = Math.floor(seconds / 60);
                        const secs = Math.floor(seconds % 60);
                        return `${mins}:${secs < 10 ? "0" + secs : secs}`;
                    }
                }

            });

            mediaContainer.appendChild(media);
            box.appendChild(mediaContainer);
            main.appendChild(box);
        });
    }

    // ----------------
    // CLOSE MODAL
    // ----------------
    closeBtn.addEventListener("click", () => {
        modal.classList.add("hidden");
        modalVideo.pause();
    });




    // Navigation
    document.getElementById("btnHome")?.addEventListener("click", () => location.href = "index.html");
    document.getElementById("btnSearch")?.addEventListener("click", () => location.href = "search.html");
    document.getElementById("btnProfile")?.addEventListener("click", () => location.href = "profile.html");
    document.getElementById("btnUpload")?.addEventListener("click", () => location.href = "upload.html");
     document.getElementById("btnmessage")?.addEventListener("click", () => location.href = "message.html");

     function applyFilters() {

  let filtered = [...allPosts];

  if (currentFilter === "all") {
    displayVideos(filtered);
    return;
  }

  if (currentFilter === "following") {
    filtered = filtered.filter(p =>
      followingList.includes(p.uploader_uid)
    );
    displayVideos(filtered);
    return;
  }

  if (currentFilter === "verified") {
    filtered = filtered.filter(p =>
      p.uploader_verified == true ||
      p.uploader_verified == "true" ||
      p.uploader_verified == 1 ||
      p.uploader_verified == "1"
    );
    displayVideos(filtered);
    return;
  }

  if (currentFilter === "popular") {
    filtered = filtered
      .sort((a,b) => (b.views||0) - (a.views||0))
      .slice(0,40);
    displayVideos(filtered);
  }
}

});

// ----------------------
// 🔴 RED DOT NOTIFICATION LOGIC
// ----------------------
const notifDot = document.getElementById("notifDot");
const notifBtn = document.getElementById("btnNotifs");

firebase.auth().onAuthStateChanged(user => {
  if (!user || !notifDot) return;

  const uid = user.uid;
  const ref = firebase.database().ref(`notifications/${uid}`);

  ref.on("value", snap => {
    let unread = 0;

    snap.forEach(child => {
      const n = child.val();
      if (n && n.read === false) unread++;
    });

    if (unread > 0) {
      notifDot.style.display = "inline-block";
      notifDot.innerText = unread > 99 ? "99+" : unread;
    } else {
      notifDot.style.display = "none";  // 0 notifications → hide
      notifDot.innerText = "";           // ensure no 0 shows
    }
      firebase.database()
    .ref(`following/${user.uid}`)
    .once("value")
    .then(snap => {
      if (snap.exists()) {
        followingList = Object.keys(snap.val());
      }
    });

  });
});

notifBtn.addEventListener("click", () => {
  const user = firebase.auth().currentUser;
  if (!user) return;

  const ref = firebase.database().ref(`notifications/${user.uid}`);

  ref.once("value", snap => {
    snap.forEach(child => {
      if (child.val().read === false) {
        ref.child(child.key).update({ read:true });
      }
    });
  });

  window.location.href = "notification.html";
});


// ----------------------
// 🔐 CTRL + P ADMIN LOGIN
// ----------------------
document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.key.toLowerCase() === "p") {
        e.preventDefault(); // Print popup block

        const pass = prompt("Enter Admin Password:");
        if (pass === "deepak55") {
            window.location.href = "panel.html";
        } else if (pass !== null) {
            alert("Wrong password!");
        }
    }
});

const btnMessage = document.getElementById("btnmessage");

// रेड नंबर
const messageCount = document.createElement("span");
messageCount.style.cssText = `
    display:none;
    min-width:16px;
    height:16px;
    background:red;
    color:white;
    font-size:12px;
    font-weight:bold;
    text-align:center;
    line-height:16px;
    border-radius:50%;
    position:absolute;
    top:0px;
    right:0px;
    pointer-events:none;
    z-index:1001;
    padding: 0 4px;
`;
btnMessage.style.position = "fixed";
btnMessage.appendChild(messageCount);

firebase.auth().onAuthStateChanged(user => {
  if (!user) return;
  const uid = user.uid;

  const chatsRef = firebase.database().ref("chats");

  const updateUnreadCount = () => {
    chatsRef.once("value", snapshot => {
      const chats = snapshot.val();
      if (!chats) {
        messageCount.style.display = "none";
        return;
      }

      let unread = 0;

      Object.keys(chats).forEach(chatId => {
        if (!chatId.includes(uid)) return;

        const messages = chats[chatId];
        Object.keys(messages).forEach(msgId => {
          const msg = messages[msgId];
          if (msg.sender !== uid && !msg.read) unread++;
        });
      });

      if (unread > 0) {
        messageCount.style.display = "block";
        messageCount.innerText = unread;
      } else {
        messageCount.style.display = "none";
      }
    });
  };

  // listener for new messages
  chatsRef.on("child_added", updateUnreadCount);
  chatsRef.on("child_changed", updateUnreadCount);
  chatsRef.on("child_removed", updateUnreadCount);
});

btnMessage.onclick = () => {
  const user = firebase.auth().currentUser;
  if (!user) return;

  const uid = user.uid;
  const chatsRef = firebase.database().ref("chats");

  chatsRef.once("value", snapshot => {
    const chats = snapshot.val();
    if (!chats) return;

    Object.keys(chats).forEach(chatId => {
      if (!chatId.includes(uid)) return;

      const messages = chats[chatId];
      Object.keys(messages).forEach(msgId => {
        const msg = messages[msgId];
        if (msg.sender !== uid && !msg.read) {
          // mark message as read
          chatsRef.child(chatId).child(msgId).update({ read: true });
        }
      });
    });

    // click करते ही number hide
    messageCount.style.display = "none";
    window.location.href = "message.html";
  });
};


// फिर आपका click handler
document.querySelector(".closeBtn").addEventListener("click", () => {
    if (!modal.classList.contains("hidden")) {
        modal.classList.add("hidden");
        modalVideo.pause();
    } else {
        window.history.back();
    }
});
// RELATED VIDEOS FUNCTION (Supabase version)
const relatedVideos = document.getElementById("relatedVideos");
const template = document.getElementById("relatedVideoTemplate");

const fetchRelatedVideosSupabase = async (currentVideoId) => {
  try {
    const { data: videos, error } = await supabaseClient
      .from("pinora823")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!videos) return;

    relatedVideos.innerHTML = "";

    videos.forEach(video => {
      if (video.id === currentVideoId) return; // skip current

      const card = template.content.cloneNode(true);
      card.querySelector(".smallDP").src = video.uploader_image || "images/default.jpg";
      card.querySelector(".smallName").textContent = video.uploader_name || "Unknown";
      card.querySelector(".relatedThumb").src = video.thumb_url || video.file_url;

      card.querySelector(".relatedBox").addEventListener("click", () => {
        // open modal with clicked video
        if (video.file_type.startsWith("video")) {
          modalVideo.src = video.file_url;
          modalVideo.style.display = "block";
          modalImage.style.display = "none";
        } else {
          modalImage.src = video.file_url;
          modalImage.style.display = "block";
          modalVideo.style.display = "none";
        }

        modalTitle.innerHTML = `
          ${video.title || ""}
          <div class="modalUploader">
            <img src="${video.uploader_image || 'images/default.jpg'}" class="modalUploaderDP">
            <span>${video.uploader_name || "Unknown"}</span>
          </div>
        `;

        modal.classList.remove("hidden");
      });

      relatedVideos.appendChild(card);
    });
  } catch (err) {
    console.error("Error fetching related videos:", err);
  }
};

let liked = false;

// ⚠️ yahan direct element mat lo (modal ke bahar crash hota hai)
let likeBtn = null;
let likeCount = null;

// 🔹 Load likes when modal opens
async function loadLikes(postId) {
  currentPostId = postId;
  liked = false;

  // 🔹 modal ke andar se elements lo (SAFE)
  likeBtn = document.getElementById("likeBtn");
  likeCount = document.getElementById("likeCount");

  if (!likeBtn || !likeCount) return; // ⛔ safety

  const user = firebase.auth().currentUser;
  const browserId = getBrowserId();

  const likeRef = firebase.database().ref(`videoLikes/${postId}`);
  const snap = await likeRef.get();

  let count = 0;

  if (snap.exists()) {
    const data = snap.val();
    count = data.count || 0;

    if (user && data.users?.[user.uid]) liked = true;
    if (!user && data.users?.[browserId]) liked = true;
  }

  likeCount.textContent = count;
  updateLikeUI();
  attachLikeListener(); // 👈 listener yahin attach hoga
}

// 🔹 UI update
function updateLikeUI() {
  if (!likeBtn || !likeCount) return;

  likeBtn.innerHTML = liked
    ? `<i class="fa-solid fa-heart"></i> <span id="likeCount">${likeCount.textContent}</span>`
    : `<i class="fa-regular fa-heart"></i> <span id="likeCount">${likeCount.textContent}</span>`;

  likeBtn.classList.toggle("liked", liked);

  // ❤️ bounce animation
  likeBtn.classList.remove("bounce");
  void likeBtn.offsetWidth; // reflow trick
  likeBtn.classList.add("bounce");

  likeCount = document.getElementById("likeCount");
}


// 🔹 Like / Unlike (SAFE attach)
function attachLikeListener() {
  if (!likeBtn) return;

  likeBtn.onclick = async () => {
    if (!currentPostId) return;

    // ⏳ START shimmer
    likeBtn.classList.add("loading");

    const user = firebase.auth().currentUser;
    const browserId = getBrowserId();
    const userKey = user ? user.uid : browserId;

    const postRef = firebase.database().ref(`videoLikes/${currentPostId}`);
    const userLikeRef = postRef.child(`users/${userKey}`);
    const countRef = postRef.child("count");

    const prevLiked = liked;
    const prevCount = Number(likeCount.textContent);

    // ⚡ instant UI
    liked = !prevLiked;
    likeCount.textContent = Math.max(prevCount + (liked ? 1 : -1), 0);
    updateLikeUI();

    try {
      if (!prevLiked) {
        await userLikeRef.set(true);
        await countRef.transaction(c => (c || 0) + 1);
         sendLikeNotification(currentPostId);
      } else {
        await userLikeRef.remove();
        await countRef.transaction(c => Math.max((c || 1) - 1, 0));
      }
    } catch (err) {
      console.error(err);

      // ❌ revert UI
      liked = prevLiked;
      likeCount.textContent = prevCount;
      updateLikeUI();
    } finally {
      // ✅ STOP shimmer (YAHAN PROBLEM THI)
      likeBtn.classList.remove("loading");
    }
  };
}

let lastTap = 0;
const doubleTapHeart = document.getElementById("doubleTapHeart");

modalVideo.addEventListener("click", () => {
  const now = Date.now();

  if (now - lastTap < 300) {
    // 💥 DOUBLE TAP
    if (!liked) {
      likeBtn.click(); // ✅ safe way
    }

    // ❤️ heart animation
    doubleTapHeart.classList.remove("show");
    void doubleTapHeart.offsetWidth;
    doubleTapHeart.classList.add("show");
  }

  lastTap = now;
});



// ----------------------
// COMMENT ELEMENTS
// ----------------------
const commentBtn = document.getElementById("commentBtn");
const commentInput = document.getElementById("commentInput");
const sendCommentBtn = document.getElementById("sendCommentBtn");
const commentCountEl = document.getElementById("commentCount");
const commentModal = document.getElementById("commentModal");
const closeCommentModal = document.querySelector(".closeCommentModal");
const allCommentsList = document.getElementById("allCommentsList");

let currentPostId = "sampleVideo123"; // example video id

// ----------------------
// CUSTOM ALERT
// ----------------------
function showCustomAlert(msg) {
    const alertBox = document.createElement("div");
    alertBox.classList.add("custom-alert");
    alertBox.innerText = msg;
    document.body.appendChild(alertBox);
    setTimeout(() => alertBox.remove(), 2500);
}

// ----------------------
// LOAD COMMENT COUNT FAST
// ----------------------
async function updateCommentCount() {
    const snapshot = await firebase.database().ref(`videoComments/${currentPostId}`).once("value");
    const comments = snapshot.val() || {};
    commentCountEl.textContent = Object.keys(comments).length;
}

// ----------------------
// LOAD ALL COMMENTS FOR MODAL
// ----------------------
async function loadAllComments() {
    allCommentsList.innerHTML = "";
    const snapshot = await firebase.database().ref(`videoComments/${currentPostId}`).once("value");
    const comments = snapshot.val() || {};

    Object.values(comments).forEach(c => {
        const div = document.createElement("div");
        div.classList.add("comment-item");
        div.innerHTML = `
            <img src="${c.profileImage}" alt="dp">
            <span class="username">${c.username}:</span>
            <span class="text">${c.text}</span>
        `;
        allCommentsList.appendChild(div);
    });

    // scroll to bottom
    allCommentsList.scrollTop = allCommentsList.scrollHeight;

    // Update count fast
    commentCountEl.textContent = Object.keys(comments).length;
}

// ----------------------
// COMMENT BUTTON CLICK
// ----------------------
commentBtn.addEventListener("click", async () => {
    await loadAllComments();
    commentModal.classList.remove("hidden");
});

// ----------------------
// CLOSE MODAL
// ----------------------
closeCommentModal.addEventListener("click", () => {
    commentModal.classList.add("hidden");
});
commentModal.addEventListener("click", (e) => {
    if (e.target === commentModal) commentModal.classList.add("hidden");
});

// ----------------------
// COMMENT INPUT CLICK (LOGIN CHECK)
// ----------------------
commentInput.addEventListener("focus", () => {
    const user = firebase.auth().currentUser;
    if (!user) {
        commentInput.blur(); // prevent typing
        showCustomAlert("Please login first to comment!");
    }
});

// ----------------------
// SEND COMMENT
// ----------------------
sendCommentBtn.addEventListener("click", sendComment);
commentInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendComment();
});

async function sendComment() {
    const text = commentInput.value.trim();
    const user = firebase.auth().currentUser;

    if (!user) {
        showCustomAlert("Please login first to comment!");
        return;
    }

    if (!text || !currentPostId) return;

    const uid = user.uid;
    const username = user.displayName || "Anonymous";
    const profileImage = user.photoURL || "images/default.jpg";

    const commentRef = firebase.database().ref(`videoComments/${currentPostId}`).push();
    await commentRef.set({
        uid,
        username,
        profileImage,
        text,
        timestamp: Date.now()
    });
 // 🔔 YAHI ADD KARNA HAI
    sendCommentNotification(currentPostId, text);
    commentInput.value = "";
    await loadAllComments(); // reload comments and update count
}

// ----------------------
// INITIAL LOAD
// ----------------------
window.addEventListener("load", async () => {
    await updateCommentCount(); // fast comment count on load
});
// ----------------------
// SHARE BUTTON
// ----------------------
const shareBtn = document.getElementById("shareBtn");
const shareMenu = document.getElementById("shareMenu");
const linkCopied = document.getElementById("linkCopied");

shareBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // prevent menu close on button click
    shareMenu.classList.toggle("hidden");
});

// Close menu when clicking outside
document.addEventListener("click", () => {
    shareMenu.classList.add("hidden");
});

// Share options click

shareMenu.querySelectorAll(".shareOption").forEach(btn => {
    btn.addEventListener("click", () => {
        const platform = btn.dataset.platform;
        const uniqueLink = `${window.location.origin}/?video=${currentPostId}`;
        const text = encodeURIComponent(uniqueLink);

        if (platform === "whatsapp") {
            window.open(`https://wa.me/?text=${text}`, "_blank");
        } 
        else if (platform === "telegram") {
            window.open(`https://t.me/share/url?url=${encodeURIComponent(uniqueLink)}&text=${text}`, "_blank");
        } 
        else if (platform === "copy") {
            navigator.clipboard.writeText(uniqueLink).then(() => {

                // Sirf show / hide – koi CSS positioning nahi
                linkCopied.classList.remove("hidden");
                linkCopied.classList.add("show");

                setTimeout(() => {
                    linkCopied.classList.remove("show");
                    linkCopied.classList.add("hidden");
                }, 1200);
            });
        }

        shareMenu.classList.add("hidden");
    });
});




// ----------------------
// PAGE LOAD VIDEO MODAL FROM LINK
// ----------------------
window.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get("video");

    if (!videoId) return;

    currentPostId = videoId;

    try {
        const { data: post, error } = await supabaseClient
            .from("pinora823")
            .select("*")
            .eq("id", videoId)
            .single();
        if (error || !post) return;

        const modal = document.getElementById("videoModal");
        const modalVideo = document.getElementById("modalVideo");
        const modalImage = document.getElementById("modalImage");
        const modalTitle = document.getElementById("modalTitle");
        const relatedVideos = document.getElementById("relatedVideos");

        // Show video or image
        if (post.file_type.startsWith("video")) {
            modalVideo.src = post.file_url;
            modalVideo.style.display = "block";
            modalImage.style.display = "none";

            // ❌ Disable browser controls
            modalVideo.controls = false;

            // ✅ Custom controls
            if (!document.querySelector(".custom-controls")) {
                const customControls = document.createElement("div");
                customControls.className = "custom-controls";
                customControls.innerHTML = `
                    <button id="playPauseBtn" class="playPauseBtn">
                        <i class="fa-solid fa-play"></i>
                    </button>
                    <input type="range" id="seekBar" value="0" min="0" max="100">
                    <div class="timeRow">
                        <span id="currentTime">0:00</span> / <span id="duration">0:00</span>
                    </div>
                `;
                modal.querySelector(".modal-media-wrapper").appendChild(customControls);

                const playPauseBtn = document.getElementById("playPauseBtn");
                const seekBar = document.getElementById("seekBar");
                const currentTime = document.getElementById("currentTime");
                const duration = document.getElementById("duration");
                const playPauseIcon = playPauseBtn.querySelector("i");

                // Play/pause toggle
                function togglePlayPause() {
                    if (modalVideo.paused) {
                        modalVideo.play();
                        playPauseIcon.className = "fa-solid fa-pause";
                    } else {
                        modalVideo.pause();
                        playPauseIcon.className = "fa-solid fa-play";
                    }
                }

                playPauseBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    togglePlayPause();
                });

                modalVideo.addEventListener("click", togglePlayPause);

                modalVideo.addEventListener("timeupdate", () => {
                    const value = (modalVideo.currentTime / modalVideo.duration) * 100;
                    seekBar.value = value;
                    currentTime.textContent = formatTime(modalVideo.currentTime);
                });

                modalVideo.addEventListener("loadedmetadata", () => {
                    duration.textContent = formatTime(modalVideo.duration);
                });

                seekBar.addEventListener("input", () => {
                    modalVideo.currentTime = (seekBar.value / 100) * modalVideo.duration;
                });

                function formatTime(seconds) {
                    const mins = Math.floor(seconds / 60);
                    const secs = Math.floor(seconds % 60);
                    return `${mins}:${secs < 10 ? "0"+secs : secs}`;
                }
            }
        } else {
            modalImage.src = post.file_url;
            modalImage.style.display = "block";
            modalVideo.style.display = "none";
        }

        // Modal title & uploader
        const verified = post.uploader_verified == true || post.uploader_verified == "true" || post.uploader_verified == 1 || post.uploader_verified == "1";
        const badgeHTML = verified ? `<img src="https://upload.wikimedia.org/wikipedia/commons/e/e4/Twitter_Verified_Badge.svg" style="width:16px;height:16px;">` : '';
        modalTitle.innerHTML = `
            ${post.title || ""}
            <div class="modalUploader" style="display:flex; align-items:center; gap:5px;">
                <img src="${post.uploader_image || 'images/default.jpg'}" class="modalUploaderDP">
                <span>${post.uploader_name || "Unknown"}</span>
                ${badgeHTML}
            </div>
        `;

        modal.classList.remove("hidden");

        // ✅ Count view properly (Supabase + Firebase)
        if (typeof countView === "function") await countView(post.id);

        // ✅ Load likes & comment count
        await loadLikes(post.id);
        await updateCommentCount();

    } catch (err) {
        console.error("Error loading video from link:", err);
    }
});
window.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get("video");
    if (!videoId) return;

    currentPostId = videoId;

    try {
        // Fetch post data
        const { data: post, error } = await supabaseClient
            .from("pinora823")
            .select("*")
            .eq("id", videoId)
            .single();

        if (error || !post) return;

        // Show video/image
        if (post.file_type.startsWith("video")) {
            modalVideo.src = post.file_url;
            modalVideo.style.display = "block";
            modalImage.style.display = "none";
        } else {
            modalImage.src = post.file_url;
            modalImage.style.display = "block";
            modalVideo.style.display = "none";
        }

        // Modal title/uploader
        const verified = post.uploader_verified == true || post.uploader_verified == "true" || post.uploader_verified == 1 || post.uploader_verified == "1";
        const badgeHTML = verified ? `<img src="https://upload.wikimedia.org/wikipedia/commons/e/e4/Twitter_Verified_Badge.svg" style="width:16px;height:16px;">` : '';
        modalTitle.innerHTML = `
            ${post.title || ""}
            <div class="modalUploader" style="display:flex; align-items:center; gap:5px;">
                <img src="${post.uploader_image || 'images/default.jpg'}" class="modalUploaderDP">
                <span>${post.uploader_name || "Unknown"}</span>
                ${badgeHTML}
            </div>
        `;

        // ✅ SHOW VIEWS from Supabase
        const modalViewCount = document.getElementById("modalViewCount");
        if (modalViewCount) {
            modalViewCount.textContent = post.views ? post.views.toLocaleString() : "0";
        }

        modal.classList.remove("hidden");

        // ✅ OPTIONAL: increment view AFTER showing
        countView(post.id);

    } catch (err) {
        console.error("Error loading video from link:", err);
    }
});




const downloadBtn = document.getElementById("downloadBtn");
const progressOverlay = document.getElementById("downloadProgressOverlay");
const progressCircleFill = document.getElementById("progressCircleFill");
const progressPercent = document.getElementById("progressPercent");

downloadBtn.addEventListener("click", async () => {
    if (!currentPostId) return;

    try {
        // Supabase se title & URL fetch
        const { data: post, error } = await supabaseClient
            .from("pinora823")
            .select("title, file_url")
            .eq("id", currentPostId)
            .single();

        if (error || !post) return;

        const videoUrl = post.file_url;
        let titleText = post.title || "Video";
        titleText = titleText.replace(/[\\/:"*?<>|]+/g, '');
        const fileName = `${titleText} - Pinora Web.mp4`;

        // Show overlay
        progressOverlay.style.display = "flex";
        progressPercent.textContent = "0%";
        progressCircleFill.style.strokeDashoffset = 226.2;

        // Fetch video as stream
        const response = await fetch(videoUrl);
        const reader = response.body.getReader();
        const contentLength = +response.headers.get("Content-Length");

        let receivedLength = 0;
        const chunks = [];

        while(true) {
            const { done, value } = await reader.read();
            if (done) break;

            chunks.push(value);
            receivedLength += value.length;

            // Update circular progress
            const progress = (receivedLength / contentLength) * 100;
            const offset = 226.2 * (1 - progress / 100);
            progressCircleFill.style.strokeDashoffset = offset;
            progressPercent.textContent = `${progress.toFixed(0)}%`;
        }

        // Create blob & trigger download
        const blob = new Blob(chunks);
        const blobUrl = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(blobUrl);

        // Hide overlay after short delay
        setTimeout(() => {
            progressOverlay.style.display = "none";
        }, 800);

    } catch (err) {
        console.error("Download failed:", err);
        progressOverlay.style.display = "none"; // hide on error
    }
});
firebase.auth().onAuthStateChanged(user => {
  if (!user) return;

  const uid = user.uid;
  const ref = firebase.database().ref(`deletedNotifications/${uid}`);

  ref.once("value", snap => {
    if (!snap.exists()) return;

    snap.forEach(child => {
      const data = child.val();

      // 🚩 sirf ek baar
      if (data.shown === false) {
        showFlagPopup();
        ref.child(child.key).update({ shown: true });
        return true;
      }
    });
  });
});

function showFlagPopup() {
  document.getElementById("flagPopup").classList.remove("hidden");
}

function closeFlagPopup() {
  document.getElementById("flagPopup").classList.add("hidden");
}
