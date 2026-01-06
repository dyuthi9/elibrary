
    async function fetchUserProfile() {
        try {
            const response = await fetch('/getUser'); // Replace with your actual API endpoint
            const user = await response.json();

            if (user) {
                document.getElementById('profile-name').innerText =`Name : ${user.name}`;
                document.getElementById('profile-username').innerText = `Username : ${user.username}`;
                document.getElementById('profile-registerno').innerText = `Registerno : ${user.registerno}`;
                document.getElementById('profile-email').innerHTML = `Email : ${user.email}`;
                document.getElementById('profile-year').innerHTML= `Year : ${user.year}`;
                document.getElementById('profile-phoneno').innerText = `Phone No : ${user.phoneno}`;
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    }

    // Call function when the page loads
    window.onload = fetchUserProfile;



function searchBooks() {
    let query = document.getElementById("search").value.trim();
    let iframe = document.querySelector(".frame iframe");

    if (!query) {
        iframe.src = "catbook.html"; // Reset iframe if empty search
        return;
    }

    // Append the search query to the catbook.html URL
    iframe.src = `catbook.html?search=${encodeURIComponent(query)}`;
}

//log out
document.getElementById("logoutBtn").addEventListener("click", function() {
    fetch("/logout", {
        method: "POST",
        credentials: "include"  // Ensures cookies (session) are sent
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("✅ Logged out successfully!");
            window.location.href = "/home.html";  // Redirect to home page
        } else {
            alert("❌ Logout failed: " + data.error);
        }
    })
    .catch(error => console.error("❌ Error:", error));
});

