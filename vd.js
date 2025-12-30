// ---------------- SUPABASE ----------------
const SUPABASE_URL = "https://lxbojhmvcauiuxahjwzk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4Ym9qaG12Y2F1aXV4YWhqd3prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MzM3NjEsImV4cCI6MjA4MDUwOTc2MX0.xP1QCzWIwnWFZArsk_5C8wCz7vkPrmwmLJkEThT74JA";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ---------------- FIREBASE ----------------
const firebaseConfig = {
  apiKey: "AIzaSyDUefeJbHKIAs-l3zvFlGaas6VD63vv4kI",
  authDomain: "inspire4ever-c60ad.firebaseapp.com",
  databaseURL: "https://inspire4ever-c60ad-default-rtdb.firebaseio.com"
};

firebase.initializeApp(firebaseConfig);

// ---------------- DELETE ----------------
document.getElementById("deleteBtn").addEventListener("click", async () => {
  const link = document.getElementById("videoLink").value.trim();
  if (!link) return alert("Paste link");

  const url = new URL(link);
  const videoId = url.searchParams.get("video");
  if (!videoId) return alert("Invalid link");

  await deleteVideo(videoId);
});

async function deleteVideo(videoId) {
  try {
    // 1️⃣ uploader uid fetch
    const { data: post } = await supabaseClient
      .from("pinora823")
      .select("uploader_uid")
      .eq("id", videoId)
      .single();

    if (!post) return alert("Video not found");

    const uploaderUid = post.uploader_uid;

    // 2️⃣ supabase delete
    await supabaseClient
      .from("pinora823")
      .delete()
      .eq("id", videoId);

    // 3️⃣ firebase cleanup
    const db = firebase.database();
    await db.ref(`videoLikes/${videoId}`).remove();
    await db.ref(`videoComments/${videoId}`).remove();
    await db.ref(`videoViews/${videoId}`).remove();

    // 4️⃣ USER popup flag
    await db.ref(`deletedNotifications/${uploaderUid}/${videoId}`).set({
      reason: "Some reason",
      shown: false,
      timestamp: Date.now()
    });

    alert("Video deleted successfully");

  } catch (err) {
    console.error(err);
    alert("Delete failed");
  }
}
