document.getElementById("registerForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const formData = new FormData(this); // Automatically grabs all input values
    const email = document.getElementById("email").value;

    try {
        const response = await fetch("http://localhost:4040/register", {
            method: "POST",
            body: formData, // Send FormData (not JSON!)
        })
                window.location.href = "/home.html";

        const result = await response.text();
        alert(result);
    } catch (error) {
        alert("❌ Error submitting form!");
        console.error(error);
    }
});
