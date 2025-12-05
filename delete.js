// ---------------- Firebase Config ----------------
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

let foundUID = null; // Save UID for delete

// ---------------- SEARCH USER ----------------
document.getElementById("searchBtn").addEventListener("click", () => {
    const username = document.getElementById("usernameInput").value.trim();
    const result = document.getElementById("result");
    const userBox = document.getElementById("userBox");

    if (!username) {
        result.innerHTML = "❌ Username required!";
        return;
    }

    result.innerHTML = "⏳ Searching...";
    userBox.classList.add("hidden");

    db.ref("users")
        .orderByChild("username")
        .equalTo(username)
        .once("value", snapshot => {

            if (!snapshot.exists()) {
                result.innerHTML = "❌ No user found!";
                return;
            }

            snapshot.forEach(child => {
                const data = child.val();

                foundUID = child.key;

                document.getElementById("uidShow").innerText = child.key;
                document.getElementById("unameShow").innerText = data.username;
                document.getElementById("emailShow").innerText = data.email || "No Email";
            });

            userBox.classList.remove("hidden");
            result.innerHTML = "";
        });
});

// ---------------- DELETE USER ----------------
document.getElementById("deleteBtn").addEventListener("click", () => {
    const result = document.getElementById("result");

    if (!foundUID) {
        result.innerHTML = "❌ No selected user!";
        return;
    }

    if (!confirm("Are you sure? This will permanently delete the user.")) return;

    db.ref("users/" + foundUID).remove()
        .then(() => {
            result.innerHTML = "✅ User deleted successfully!";
            document.getElementById("userBox").classList.add("hidden");
            foundUID = null;
        })
        .catch(() => {
            result.innerHTML = "❌ Error deleting!";
        });
});
