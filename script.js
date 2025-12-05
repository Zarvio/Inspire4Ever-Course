document.addEventListener("DOMContentLoaded", async () => {

    // SUPABASE CONFIG
    const SUPABASE_URL = "https://lxbojhmvcauiuxahjwzk.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4Ym9qaG12Y2F1aXV4YWhqd3prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MzM3NjEsImV4cCI6MjA4MDUwOTc2MX0.xP1QCzWIwnWFZArsk_5C8wCz7vkPrmwmLJkEThT74JA";

    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const main = document.querySelector(".main-content");
    if (!main) return;

    main.innerHTML = "<h3>Loading...</h3>";

    try {
        const { data, error } = await supabaseClient
            .from("pinora823")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        main.innerHTML = "";

        if (!data || data.length === 0) {
            main.innerHTML = "<p>No posts found.</p>";
            return;
        }

        data.forEach(post => {
            const box = document.createElement("div");
            box.classList.add("pin-box");

            if (!post.file_url) {
                box.innerHTML = `<p>Error: File URL missing</p>`;
            } else if (post.file_url.match(/\.(mp4|mov|webm)$/)) {
                box.innerHTML = `
                    <video src="${post.file_url}" controls muted autoplay loop style="max-width:100%;"></video>
                    <p>${post.title}</p>
                `;
            } else {
                box.innerHTML = `
                    <img src="${post.file_url}" alt="" style="max-width:100%;">
                    <p>${post.title}</p>
                `;
            }

            main.appendChild(box);
        });

    } catch (err) {
        main.innerHTML = "<p>Error loading posts.</p>";
        console.error("Error fetching posts:", err);
    }

});
// NAVIGATION BUTTONS
    document.getElementById("btnHome")?.addEventListener("click", () => window.location.href = "index.html");
    document.getElementById("btnSearch")?.addEventListener("click", () => window.location.href = "search.html");
    document.getElementById("btnNotifs")?.addEventListener("click", () => window.location.href = "notification.html");
    document.getElementById("btnProfile")?.addEventListener("click", () => window.location.href = "profile.html");
    document.getElementById("btnUpload")?.addEventListener("click", () => window.location.href = "upload.html");
     document.getElementById("btnmessage")?.addEventListener("click", () => window.location.href = "");