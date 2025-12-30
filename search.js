// ----------------------
//  FIREBASE CONFIG
// ----------------------
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
const db = firebase.database();

// URL se UID le lo
  // ----------------------
  const params = new URLSearchParams(window.location.search);
  const uid = params.get("uid"); // ye wahi UID hai jo search se click hua

  if(uid) {
      db.ref("users/" + uid).once("value").then(snapshot => {
          if(snapshot.exists()) {
              const u = snapshot.val();
              document.getElementById("profilePhoto").src = u.photoURL || "default.jpg";
              document.getElementById("username").innerText = "@" + u.username;
              document.getElementById("name").innerText = (u.name || "") + " " + (u.surname || "");
          }
      });
  }



// ----------------------
//  USERNAME SEARCH FUNCTION
// ----------------------
async function searchUsername(username) {
    let snapshot = await db.ref("users")
        .orderByChild("username")
        .equalTo(username)
        .once("value");

    if (snapshot.exists()) {
        return Object.values(snapshot.val())[0];  // user data
    } else {
        return null;
    }
}

// ----------------------
//  MAIN
// ----------------------
document.addEventListener("DOMContentLoaded", function() {

    // Dummy sample thumbnails
    const sampleVideos = [

    ];

    const resultsGrid = document.getElementById("resultsGrid");
    const searchInput = document.getElementById("searchInput");

    // Load videos
    function loadVideos(videos = sampleVideos) {
        resultsGrid.innerHTML = "";
        videos.forEach(src => {
            let box = document.createElement("div");
            box.className = "video";
            box.innerHTML = `<img src="${src}" alt="Video Thumbnail">`;
            resultsGrid.appendChild(box);
        });
    }

    loadVideos(); // initial load



    // ----------------------
    // SEARCH — username OR title
    // ----------------------

    searchInput.addEventListener("input", async () => {
        let val = searchInput.value.toLowerCase();

        // Empty → show sample videos
        if (val === "") {
            loadVideos();
            return;
        }



        // 2️⃣ Otherwise → filter videos by title (dummy)
        let filtered = sampleVideos.filter(v => v.toLowerCase().includes(val));
        loadVideos(filtered);
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

});



document.addEventListener("DOMContentLoaded", async () => {

    const searchInput = document.getElementById("searchInput");
    const suggestionsBox = document.getElementById("userSuggestions");

    // Username search
    searchInput.addEventListener("input", async () => {
        let text = searchInput.value.trim().toLowerCase();

        if (text.length === 0) {
            suggestionsBox.classList.add("hidden");
            return;
        }

        let snap = await firebase.database().ref("users").once("value");
        let results = [];

        snap.forEach(user => {
            let u = user.val();
            if (u.username && u.username.toLowerCase().includes(text)) {
                results.push({
                    uid: user.key,
                    username: u.username,
                    name: (u.name || "") + " " + (u.surname || ""),
                    photo: u.photoURL || "default.jpg",
                    verified: u.verified || false
                });
            }
        });

        showSuggestions(results);
    });

    function showSuggestions(list) {
        suggestionsBox.innerHTML = "";
        if (list.length === 0) {
            suggestionsBox.innerHTML = "<p style='padding:10px;color:#666'>No users found</p>";
        } else {
            list.forEach(user => {
                let div = document.createElement("div");
                div.className = "suggestion-item";

                div.innerHTML = `
                    <img src="${user.photo}" class="suggestion-photo">
                    <div class="suggestion-info">
                        <span class="suggestion-username" style="display:flex;align-items:center;gap:4px;">
                            @${user.username} ${user.verified ? '<img src="https://upload.wikimedia.org/wikipedia/commons/e/e4/Twitter_Verified_Badge.svg" style="width:14px;height:14px;">' : ''}
                        </span>
                        <span class="suggestion-name">${user.name}</span>
                    </div>
                `;

                div.onclick = () => {
                    window.location.href = "user.html?uid=" + user.uid;
                };

                suggestionsBox.appendChild(div);
            });
        }

        suggestionsBox.classList.remove("hidden");
    }

});





const userList = document.getElementById("userList");

// Fetch users on page load
// Fetch users on page load
async function loadUsers() {
    let snapshot = await firebase.database().ref("users").once("value");

    let users = [];
    snapshot.forEach(user => {
        let u = user.val();
        users.push({
            uid: user.key,
            username: u.username,
            name: (u.name || "") + " " + (u.surname || ""),
            photo: u.photoURL || "default.jpg",
            verified: u.verified || false   // ✅ add verified flag
        });
    });

    // --- Shuffle function ---
    function shuffleArray(arr) {
        return arr.sort(() => Math.random() - 0.5);
    }

    // Shuffle users list
    let randomUsers = shuffleArray(users);

    // Pick first 3
    showUserList(randomUsers.slice(0, 3));
}

// Show users below popular tags with verified badge
function showUserList(users) {
    userList.innerHTML = "";
    users.forEach(u => {
        let div = document.createElement("div");
        div.className = "suggestion-item";

div.innerHTML = `
    <img src="${u.photo}" class="suggestion-photo">

    <div class="suggestion-info" style="display: flex; flex-direction: column; align-items: center;">

        <span class="suggestion-username" style="display: flex; align-items: center; gap: 4px; justify-content: center;">
            @${u.username}
            ${u.verified ? 
                '<img src="https://upload.wikimedia.org/wikipedia/commons/e/e4/Twitter_Verified_Badge.svg" style="width:14px;height:14px;">' 
                : ''
            }
        </span>

        <span class="suggestion-name" style="text-align:center;">${u.name}</span>
    </div>
`;


        div.onclick = () => {
            window.location.href = "user.html?uid=" + u.uid;
        };

        userList.appendChild(div);
    });
}


// Call on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
    loadUsers();
});

