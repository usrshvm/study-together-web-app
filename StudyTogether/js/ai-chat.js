const aiInput = document.getElementById("aiInput");
const sendBtn = document.getElementById("sendBtn");
const chatMessages = document.getElementById("chatMessages");

const suggestionButtons =
    document.querySelectorAll(".suggestion-btn");

const attachmentBtn =
    document.getElementById("attachmentBtn");

const aiFileInput =
    document.getElementById("aiFileInput");

const selectedMaterial =
    document.getElementById("selectedMaterial");

const clearMaterial =
    document.getElementById("clearMaterial");


/* =========================
   SEND MESSAGE
========================= */

function sendMessage() {

    const message = aiInput.value.trim();

    if (message === "") {
        return;
    }


    // Add user message

    addMessage(
        message,
        "user"
    );


    aiInput.value = "";


    // Show AI typing

    showTyping();


    // Simulated AI response

    setTimeout(function () {

        removeTyping();

        generateAIResponse(message);

    }, 1200);

}


/* =========================
   ADD MESSAGE
========================= */

function addMessage(message, type) {

    const messageElement =
        document.createElement("div");

    messageElement.classList.add(
        "message",
        type
    );


    const avatar =
        type === "user"
            ? "S"
            : "🤖";


    messageElement.innerHTML = `

        <div class="message-avatar">
            ${avatar}
        </div>

        <div class="message-body">

            <p>
                ${message}
            </p>

            <span class="message-time">
                Just now
            </span>

        </div>

    `;


    chatMessages.appendChild(messageElement);


    chatMessages.scrollTop =
        chatMessages.scrollHeight;

}


/* =========================
   TYPING INDICATOR
========================= */

function showTyping() {

    const typing =
        document.createElement("div");

    typing.classList.add(
        "message",
        "ai",
        "typing-message"
    );

    typing.innerHTML = `

        <div class="message-avatar">
            🤖
        </div>

        <div class="message-body">

            <p class="typing">

                <span></span>
                <span></span>
                <span></span>

            </p>

        </div>

    `;


    chatMessages.appendChild(typing);


    chatMessages.scrollTop =
        chatMessages.scrollHeight;

}


function removeTyping() {

    const typing =
        document.querySelector(".typing-message");

    if (typing) {

        typing.remove();

    }

}


/* =========================
   SIMULATED AI
========================= */

function generateAIResponse(question) {

    const lowerQuestion =
        question.toLowerCase();


    let response;


    if (
        lowerQuestion.includes("normalization") ||
        lowerQuestion.includes("normalisation")
    ) {

        response =
            "Normalization in DBMS is a process of organizing data to reduce redundancy and improve data integrity. It usually involves dividing large tables into smaller related tables and defining relationships between them. Common normal forms include 1NF, 2NF, 3NF and BCNF.";

    }


    else if (
        lowerQuestion.includes("binary tree") ||
        lowerQuestion.includes("binary trees")
    ) {

        response =
            "A binary tree is a tree data structure in which each node can have at most two children, usually called the left child and right child. Binary trees are commonly used to represent hierarchical data and form the basis of structures such as Binary Search Trees and heaps.";

    }


    else if (
        lowerQuestion.includes("process scheduling") ||
        lowerQuestion.includes("scheduling")
    ) {

        response =
            "Process scheduling is the mechanism used by an operating system to decide which process should use the CPU next. Common scheduling algorithms include FCFS, SJF, Round Robin and Priority Scheduling.";

    }


    else if (
        lowerQuestion.includes("tcp") ||
        lowerQuestion.includes("ip")
    ) {

        response =
            "TCP/IP is a collection of communication protocols used for networking. TCP provides reliable, ordered delivery of data, while IP is responsible for addressing and routing packets between devices.";

    }


    else {

        response =
            "That's a good study question. In the connected version of StudyTogether AI, I would analyze your question and provide an explanation using the AI model. For now, this is a simulated frontend response.";

    }


    if (currentSelectedDoc) {
        response = `[Referencing "${currentSelectedDoc.title}" (${currentSelectedDoc.subject || "General"})]: ` + response;
    }

    addMessage(
        response,
        "ai"
    );

}


/* =========================
   SEND BUTTON
========================= */

sendBtn.addEventListener(
    "click",
    sendMessage
);


/* =========================
   ENTER KEY
========================= */

aiInput.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {

            event.preventDefault();

            sendMessage();

        }

    }
);


/* =========================
   SUGGESTIONS
========================= */

suggestionButtons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                aiInput.value =
                    button.textContent.trim();

                sendMessage();

            }
        );

    }
);


/* =========================
   FILE UPLOAD
========================= */

attachmentBtn.addEventListener(
    "click",
    function () {

        aiFileInput.click();

    }
);


aiFileInput.addEventListener(
    "change",
    function () {

        const file =
            aiFileInput.files[0];

        if (!file) {
            return;
        }


        selectedMaterial.innerHTML = `

            <div class="uploaded-material">

                <div class="uploaded-material-icon">
                    PDF
                </div>

                <div>

                    <strong>
                        ${file.name}
                    </strong>

                    <small>
                        Ready for questions
                    </small>

                </div>

            </div>

        `;


        addMessage(
            `I've selected "${file.name}". In the connected version, you will be able to ask questions specifically from this document.`,
            "ai"
        );

    }
);

let currentSelectedDoc = null;

const chooseUploadedMaterialBtn = document.getElementById("chooseUploadedMaterialBtn");
const aiMaterialPickerModal = document.getElementById("aiMaterialPickerModal");
const closeAiMaterialModalBtn = document.getElementById("closeAiMaterialModalBtn");
const aiMaterialsPickerList = document.getElementById("aiMaterialsPickerList");

const API_BASE = (window.location.port === "5500" || window.location.port === "3000" || window.location.protocol === "file:")
    ? "http://localhost:5000"
    : "";

function openMaterialPicker() {
    if (!aiMaterialPickerModal) return;
    aiMaterialPickerModal.style.display = "flex";
    loadUserMaterialsForPicker();
}

if (chooseUploadedMaterialBtn) {
    chooseUploadedMaterialBtn.addEventListener("click", openMaterialPicker);
}

if (attachmentBtn) {
    attachmentBtn.addEventListener("click", function (e) {
        e.preventDefault();
        openMaterialPicker();
    });
}

if (closeAiMaterialModalBtn) {
    closeAiMaterialModalBtn.addEventListener("click", function () {
        aiMaterialPickerModal.style.display = "none";
    });
}

if (aiMaterialPickerModal) {
    aiMaterialPickerModal.addEventListener("click", function (e) {
        if (e.target === aiMaterialPickerModal) {
            aiMaterialPickerModal.style.display = "none";
        }
    });
}

async function loadUserMaterialsForPicker() {
    if (!aiMaterialsPickerList) return;
    const token = sessionStorage.getItem("studyTogetherToken");
    if (!token) {
        aiMaterialsPickerList.innerHTML = `<p style="color: #64748b; font-size: 13px; text-align: center;">Please log in to pick from your materials.</p>`;
        return;
    }

    try {
        aiMaterialsPickerList.innerHTML = `<p style="color: #64748b; font-size: 13px; text-align: center;">Loading your materials...</p>`;
        const res = await fetch(`${API_BASE}/api/materials`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load materials.");

        const materials = data.materials || [];
        if (materials.length === 0) {
            aiMaterialsPickerList.innerHTML = `
                <div style="text-align: center; padding: 16px; color: #64748b;">
                    <p style="margin: 0 0 10px 0; font-size: 13px;">No materials uploaded yet.</p>
                    <a href="materials.html" style="font-size: 13px; color: #4f46e5; font-weight: 600; text-decoration: none;">Go to Materials & Upload One →</a>
                </div>
            `;
            return;
        }

        aiMaterialsPickerList.innerHTML = "";
        materials.forEach(mat => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.style.cssText = "display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; text-align: left; transition: all 0.15s; width: 100%;";
            
            const ext = (mat.fileType || "doc").toUpperCase();
            btn.innerHTML = `
                <div style="min-width: 0;">
                    <strong style="display: block; font-size: 13px; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${mat.title}</strong>
                    <small style="font-size: 11px; color: #64748b;">${mat.subject || "General"} • ${ext}</small>
                </div>
                <span style="font-size: 11px; background: #eef2ff; color: #4f46e5; padding: 2px 8px; border-radius: 4px; font-weight: 600;">Select</span>
            `;

            btn.onmouseover = () => { btn.style.background = "#eef2ff"; btn.style.borderColor = "#c7d2fe"; };
            btn.onmouseout = () => { btn.style.background = "#f8fafc"; btn.style.borderColor = "#e2e8f0"; };

            btn.onclick = () => {
                selectStudyMaterial(mat);
                aiMaterialPickerModal.style.display = "none";
            };

            aiMaterialsPickerList.appendChild(btn);
        });
    } catch (err) {
        aiMaterialsPickerList.innerHTML = `<p style="color: #ef4444; font-size: 13px; text-align: center;">${err.message}</p>`;
    }
}

function selectStudyMaterial(mat) {
    currentSelectedDoc = mat;
    const ext = (mat.fileType || "doc").toUpperCase();
    
    selectedMaterial.innerHTML = `
        <div class="uploaded-material" style="display: flex; align-items: center; gap: 10px; padding: 10px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
            <div class="uploaded-material-icon" style="font-size: 11px; font-weight: bold; background: #4f46e5; color: white; padding: 4px 6px; border-radius: 4px;">
                ${ext}
            </div>
            <div style="min-width: 0; flex: 1;">
                <strong style="display: block; font-size: 12.5px; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${mat.title}
                </strong>
                <small style="font-size: 11px; color: #16a34a; font-weight: 500;">
                    ✓ Active in AI Context
                </small>
            </div>
        </div>
        <div style="margin-top: 8px; display: flex; justify-content: space-between; font-size: 11px;">
            <span style="color: #64748b;">Subject: <strong>${mat.subject || "General"}</strong></span>
            <a href="materials.html" style="color: #4f46e5; text-decoration: none; font-weight: 600;">Open Viewer →</a>
        </div>
    `;

    addMessage(
        `Loaded "${mat.title}" (${mat.subject || "General"}). I am now ready to answer any questions, explain concepts, or summarize points from this study material!`,
        "ai"
    );
}

/* =========================
   CLEAR MATERIAL
========================= */

clearMaterial.addEventListener(
    "click",
    function () {
        currentSelectedDoc = null;
        selectedMaterial.innerHTML = `
            <div class="material-placeholder">
                <span>📄</span>
                <p>No material selected</p>
                <small>Upload or select notes to ask questions.</small>
            </div>
        `;
        if (aiFileInput) aiFileInput.value = "";
    }
);