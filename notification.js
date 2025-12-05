// notification.js

// Dummy notifications (replace with Firebase later)
const notifications = [
    { icon: "fa-solid fa-heart", text: "John liked your video." },
    { icon: "fa-solid fa-user-plus", text: "Sara started following you." },
    { icon: "fa-solid fa-comment", text: "Alex commented: Nice video!" },
    { icon: "fa-solid fa-heart", text: "Mike liked your video." }
];

const notifContainer = document.querySelector(".notif-container");

// Load notifications dynamically
notifications.forEach(notif => {
    const div = document.createElement("div");
    div.className = "notif-item";
    div.innerHTML = `<i class="${notif.icon}"></i><span class="notif-text">${notif.text}</span>`;
    notifContainer.appendChild(div);
});

// Bottom nav functionality
document.getElementById("btnHome").addEventListener("click", () => { window.location.href = "home.html"; });
document.getElementById("btnSearch").addEventListener("click", () => { window.location.href = "search.html"; });
document.getElementById("btnProfile").addEventListener("click", () => { window.location.href = "profile.html"; });
// Navigation Buttons Redirect

document.getElementById("btnHome").addEventListener("click", () => {
    window.location.href = "index.html";
});

document.getElementById("btnSearch").addEventListener("click", () => {
    window.location.href = "search.html";
});

document.getElementById("btnNotifs").addEventListener("click", () => {
    window.location.href = "notification.html"; // बाद में बनायेंगे
});

document.getElementById("btnProfile").addEventListener("click", () => {
    window.location.href = "profile.html"; // बाद में बनायेंगे
});
document.getElementById("btnUpload").addEventListener("click", () => {
    window.location.href = "upload.html"; // ये पेज तुम बनाओगे
});