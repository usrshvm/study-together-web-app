
const loginForm = document.getElementById("loginForm");
const formMessage = document.getElementById("formMessage");
const loginButton = document.getElementById("loginButton");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    formMessage.textContent = "";
    formMessage.classList.remove("success");
    loginButton.disabled = true;
    loginButton.textContent = "Signing in...";

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Login failed.");
        }

        // Keep the token for this browser session.
        sessionStorage.setItem("studyTogetherToken", data.token);
        sessionStorage.setItem(
            "studyTogetherUser",
            JSON.stringify(data.user)
        );

        formMessage.textContent = "Login successful! Redirecting...";
        formMessage.classList.add("success");

        window.location.replace("../index.html");
    } catch (error) {
        formMessage.textContent =
            error.message === "Failed to fetch"
                ? "Cannot reach the server. Make sure your backend is running."
                : error.message;
    } finally {
        loginButton.disabled = false;
        loginButton.innerHTML = 'Sign in <span>→</span>';
    }
});