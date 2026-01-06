        document.addEventListener("DOMContentLoaded", () => {
                document.getElementById("loginForm").addEventListener("submit", async function(event) {
                    event.preventDefault();
                    
                    const username = document.getElementById("username").value;
                    const password = document.getElementById("password").value;
                    
                    console.log("🔄 Sending login request...");
            
                    try {
                        const response = await fetch("/login", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ username, password })
                        });
            
                        console.log("🔍 Response received:", response);
            
                        const data = await response.json();
                        console.log("📩 Response Data:", data);
                        
                        if (data.success) {
                            console.log("✅ Redirecting to:", data.redirect);
                            window.location.href = data.redirect;
                        } else {
                            const messageElement = document.getElementById("message");
                            if (messageElement) {
                                messageElement.textContent = data.error;
                            } else {
                                alert(data.error); // Fallback if "message" element is missing
                            }
                        }
                    } catch (error) {
                        console.error("❌ Error during login:", error);
                        const messageElement = document.getElementById("message");
                        if (messageElement) {
                            messageElement.textContent = "Server error, please try again.";
                        } else {
                            alert("Server error, please try again."); // Fallback alert
                        }
                    }
                });
            });
            document.addEventListener("DOMContentLoaded", () => {
                document.getElementById("adminForm").addEventListener("submit", async function (event) {
                    event.preventDefault();
            
                    // ✅ Ensure correct ID names (Check if they match your HTML)
                    const adminname = document.getElementById("adminname").value.trim();
                    const password = document.getElementById("password1").value.trim();  // Changed to match the HTML
            
                    console.log("📤 Entered Adminname:", adminname);
                    console.log("📤 Entered Password:", password);
            
                    if (!adminname || !password) {
                        document.getElementById("message1").textContent = "Please fill all fields";
                        return;
                    }
            
                    try {
                        const response = await fetch("/login1", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ adminname, password })  // Ensure password is being sent correctly
                        });
            
                        console.log("🔍 Response received:", response);
            
                        const data = await response.json();
                        console.log("📩 Response Data:", data);
            
                        if (data.success) {
                            console.log("✅ Redirecting to:", data.redirect);
                            window.location.href = data.redirect;
                        } else {
                            document.getElementById("message1").textContent = data.error || "Login failed";
                        }
                    } catch (error) {
                        console.error("❌ Error during login:", error);
                        document.getElementById("message1").textContent = "Server error, please try again.";
                    }
                });
            });
