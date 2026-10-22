const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const messages = document.getElementById("messages");

const micBtn = document.getElementById("micBtn");
const cameraBtn = document.getElementById("cameraBtn");

const leaveRoom = document.getElementById("leaveRoom");
const endCallBtn = document.getElementById("endCallBtn");

const timerDisplay = document.getElementById("timer");


/* =========================
   CHAT
========================= */

chatForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const message = messageInput.value.trim();

    if (message === "") {
        return;
    }

    const messageElement = document.createElement("div");

    messageElement.classList.add("message");

    messageElement.innerHTML = `
        <div class="message-avatar">
            S
        </div>

        <div class="message-content">

            <strong>You</strong>

            <p>${message}</p>

            <small>Just now</small>

        </div>
    `;

    messages.appendChild(messageElement);

    messageInput.value = "";

    messages.scrollTop = messages.scrollHeight;

});


/* =========================
   MICROPHONE
========================= */

let micOn = true;

micBtn.addEventListener("click", function () {

    micOn = !micOn;

    if (micOn) {

        micBtn.innerHTML = "🎤 <span>Mute</span>";

    } else {

        micBtn.innerHTML = "🔇 <span>Unmute</span>";

    }

});


/* =========================
   CAMERA
========================= */

let cameraOn = true;

cameraBtn.addEventListener("click", function () {

    cameraOn = !cameraOn;

    if (cameraOn) {

        cameraBtn.innerHTML = "📹 <span>Camera</span>";

    } else {

        cameraBtn.innerHTML = "🚫 <span>Camera Off</span>";

    }

});


/* =========================
   LEAVE ROOM
========================= */

function exitRoom() {

    const confirmLeave = confirm(
        "Are you sure you want to leave the study room?"
    );

    if (confirmLeave) {

        window.location.href = "../index.html";

    }

}


leaveRoom.addEventListener("click", exitRoom);

endCallBtn.addEventListener("click", exitRoom);


/* =========================
   STUDY TIMER
========================= */

let totalSeconds = 25 * 60;

function updateTimer() {

    const minutes = Math.floor(totalSeconds / 60);

    const seconds = totalSeconds % 60;

    timerDisplay.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    if (totalSeconds > 0) {

        totalSeconds--;

    }

}

updateTimer();

setInterval(updateTimer, 1000);

/* =========================
   ROOM MATERIALS ACCESS
========================= */

const materialsBtn = document.getElementById("materialsBtn");
const roomMaterialsModal = document.getElementById("roomMaterialsModal");
const closeRoomMaterialsBtn = document.getElementById("closeRoomMaterialsBtn");
const roomMaterialsList = document.getElementById("roomMaterialsList");

const API_BASE = (window.location.port === "5500" || window.location.port === "3000" || window.location.protocol === "file:")
    ? "http://localhost:5000"
    : "";

if (materialsBtn && roomMaterialsModal) {
    materialsBtn.addEventListener("click", async () => {
        roomMaterialsModal.style.display = "flex";
        await loadRoomMaterials();
    });
}

if (closeRoomMaterialsBtn && roomMaterialsModal) {
    closeRoomMaterialsBtn.addEventListener("click", () => {
        roomMaterialsModal.style.display = "none";
    });

    roomMaterialsModal.addEventListener("click", (e) => {
        if (e.target === roomMaterialsModal) {
            roomMaterialsModal.style.display = "none";
        }
    });
}

async function loadRoomMaterials() {
    if (!roomMaterialsList) return;
    const token = sessionStorage.getItem("studyTogetherToken");
    if (!token) {
        roomMaterialsList.innerHTML = `<p style="color: var(--text-muted); text-align: center;">Please log in to view study materials.</p>`;
        return;
    }

    try {
        roomMaterialsList.innerHTML = `<p class="room-materials-loading">Loading your materials...</p>`;
        const res = await fetch(`${API_BASE}/api/materials`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load materials.");

        const materials = data.materials || [];
        if (materials.length === 0) {
            roomMaterialsList.innerHTML = `
                <div style="text-align: center; padding: 24px 10px; color: var(--text-muted);">
                    <div style="font-size: 32px; margin-bottom: 8px;">📂</div>
                    <p style="margin: 0 0 10px 0;">No materials uploaded yet.</p>
                    <a href="materials.html" class="room-mat-btn" style="display: inline-block;">Upload Your First Material</a>
                </div>
            `;
            return;
        }

        roomMaterialsList.innerHTML = "";
        materials.forEach(mat => {
            const item = document.createElement("div");
            item.className = "room-material-item";
            const ext = (mat.fileType || "doc").toLowerCase();
            const icon = ext === "pdf" ? "📕" : ext === "doc" || ext === "docx" ? "📘" : ext === "txt" ? "📄" : "📁";
            const hasFile = Boolean(mat.fileUrl);

            item.innerHTML = `
                <div class="room-mat-info">
                    <span class="room-mat-icon">${icon}</span>
                    <div class="room-mat-text">
                        <strong title="${mat.title}">${mat.title}</strong>
                        <small>${mat.subject || "General"}</small>
                    </div>
                </div>
                <div class="room-mat-actions">
                    ${hasFile ? `<a href="${API_BASE}${mat.fileUrl}" target="_blank" rel="noopener noreferrer" class="room-mat-btn">View</a>` : ""}
                    <a href="materials.html" class="room-mat-btn" style="background: var(--glass); border: 1px solid var(--border);">Open</a>
                </div>
            `;
            roomMaterialsList.appendChild(item);
        });
    } catch (err) {
        roomMaterialsList.innerHTML = `<p style="color: #ef4444; text-align: center;">${err.message}</p>`;
    }
}