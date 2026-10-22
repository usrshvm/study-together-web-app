
const registerForm = document.getElementById("registerForm");
const formMessage = document.getElementById("formMessage");
const registerButton = document.getElementById("registerButton");

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    formMessage.textContent = "";
    formMessage.classList.remove("success");
    registerButton.disabled = true;
    registerButton.textContent = "Creating account...";

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Registration failed.");
        }

        formMessage.textContent =
            "Account created! Redirecting to login...";
        formMessage.classList.add("success");

        registerForm.reset();

        setTimeout(() => {
            window.location.href = "login.html";
        }, 900);
    } catch (error) {
        formMessage.textContent =
            error.message === "Failed to fetch"
                ? "Cannot reach the server. Make sure your backend is running."
                : error.message;
    } finally {
        registerButton.disabled = false;
        registerButton.innerHTML = 'Create account <span>→</span>';
    }
});
