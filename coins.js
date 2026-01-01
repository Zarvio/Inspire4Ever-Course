const findBtn = document.getElementById("findUserBtn");
const foundUserInfo = document.getElementById("foundUserInfo");
const currentCoins = document.getElementById("currentCoins");
const coinActions = document.getElementById("coinActions");
const coinAmount = document.getElementById("coinAmount");
let targetUID = null;

// 🔐 Only admin access
firebase.auth().onAuthStateChanged(async admin => {
  if (!admin) return window.location.href = "login.html";

  const snap = await firebase.database().ref("admins/" + admin.uid).once("value");
  if (!snap.exists()) return alert("Access Denied!");
});

// 🔎 Find user by username
findBtn.addEventListener("click", async () => {
  const uname = document.getElementById("searchUsername").value.trim();
  if (!uname) return;

  const snap = await firebase.database().ref("users").once("value");

  let found = false;

  snap.forEach(child => {
    const u = child.val();
    if (u.username === uname) {
      found = true;
      targetUID = child.key;
      foundUserInfo.innerText = "User: " + uname;
      loadCoins();
    }
  });

  if (!found) {
    foundUserInfo.innerText = "User not found!";
    coinActions.classList.add("hidden");
  }
});

// 🪙 Load coins
async function loadCoins(){
  const snap = await firebase.database().ref(`userCoins/${targetUID}`).once("value");
  currentCoins.innerText = "Current Coins: " + (snap.val() || 0);
  coinActions.classList.remove("hidden");
}

// ➕ Add coins
document.getElementById("addCoinsBtn").onclick = async () => {
  const amt = Number(coinAmount.value);
  if (!amt) return;

  await firebase.database().ref(`userCoins/${targetUID}`).transaction(c => (Number(c||0) + amt));
  loadCoins();
};

// ➖ Remove coins
document.getElementById("removeCoinsBtn").onclick = async () => {
  const amt = Number(coinAmount.value);
  if (!amt) return;

  await firebase.database().ref(`userCoins/${targetUID}`).transaction(c => Math.max(0, (Number(c||0) - amt)));
  loadCoins();
};
