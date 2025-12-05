document.addEventListener("DOMContentLoaded", () => {

    // SUPABASE CONFIG
    const SUPABASE_URL = "https://lxbojhmvcauiuxahjwzk.supabase.co";
    const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4Ym9qaG12Y2F1aXV4YWhqd3prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5MzM3NjEsImV4cCI6MjA4MDUwOTc2MX0.xP1QCzWIwnWFZArsk_5C8wCz7vkPrmwmLJkEThT74JA";

    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Helper function to make safe file name
    function makeSafeFileName(name) {
        return name.replace(/[^\w\-\.]/g, '_').substring(0, 100);
    }

    // UPLOAD HANDLER
    const uploadForm = document.getElementById("uploadForm");
    uploadForm?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const title = document.getElementById("pinTitle").value;
        const file = document.getElementById("pinFile").files[0];

        if (!file) {
            alert("Please select a file!");
            return;
        }

        const safeFileName = makeSafeFileName(file.name);
        const filePath = `uploads/${Date.now()}-${safeFileName}`;

        // Upload file
        const { data: uploadData, error: uploadError } = await supabaseClient
            .storage
            .from("Zarvio")
            .upload(filePath, file);

        if (uploadError) {
            console.error("Upload Error:", uploadError);
            alert("Upload failed!");
            return;
        }

        const { data: publicURL } = supabaseClient
            .storage
            .from("Zarvio")
            .getPublicUrl(filePath);

        const fileUrl = publicURL.publicUrl;

        const { data, error } = await supabaseClient
            .from("pinora823")
            .insert([{
                title: title,
                file_url: fileUrl,
                created_at: new Date().toISOString()
            }]);

        if (error) {
            console.error("Database Error:", error);
            alert("Database error!");
            return;
        }

        alert("Uploaded Successfully!");
        window.location.href = "index.html";
    });

    // NAVIGATION BUTTONS
    document.getElementById("btnHome")?.addEventListener("click", () => window.location.href = "index.html");
    document.getElementById("btnSearch")?.addEventListener("click", () => window.location.href = "search.html");
    document.getElementById("btnNotifs")?.addEventListener("click", () => window.location.href = "notification.html");
    document.getElementById("btnProfile")?.addEventListener("click", () => window.location.href = "profile.html");
    document.getElementById("btnUpload")?.addEventListener("click", () => window.location.href = "upload.html");

});
