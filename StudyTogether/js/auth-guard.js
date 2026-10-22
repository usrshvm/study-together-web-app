
(function () {
    const token = sessionStorage.getItem("studyTogetherToken");

    if (!token) {
        window.location.replace("/pages/login.html");
        return;
    }

    let user = {};

    try {
        user = JSON.parse(
            sessionStorage.getItem("studyTogetherUser") || "{}"
        );
    } catch {
        user = {};
    }

    const name = user.name || "Student";

    const userName = document.getElementById("userName");
    const userAvatar = document.getElementById("userAvatar");
    const welcomeHeading = document.getElementById("welcomeHeading");

    if (userName) {
        userName.textContent = name;
    }

    if (userAvatar) {
        userAvatar.textContent = name.charAt(0).toUpperCase();
    }

    if (welcomeHeading) {
        const hour = new Date().getHours();
        const greeting =
            hour < 12 ? "Good morning" :
            hour < 18 ? "Good afternoon" :
            "Good evening";

        welcomeHeading.textContent = `${greeting}, ${name} 👋`;
    }

    const logoutButton = document.getElementById("logoutButton");

    if (logoutButton) {
        logoutButton.addEventListener("click", function (event) {
            event.preventDefault();

            sessionStorage.removeItem("studyTogetherToken");
            sessionStorage.removeItem("studyTogetherUser");

            window.location.replace("/pages/login.html");
        });
    }
})();
