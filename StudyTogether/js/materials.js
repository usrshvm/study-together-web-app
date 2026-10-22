/**
 * StudyTogether AI - Materials Management
 * Handles file uploads, view/download access, edits, and filtering without browser prompts.
 */

// API Configuration (supports localhost:5000, Live Server, and file:// protocols)
const API_BASE = (window.location.port === "5500" || window.location.port === "3000" || window.location.protocol === "file:")
    ? "http://localhost:5000"
    : "";

// Global State
let allMaterials = [];
let availableSubjects = [
    { name: "Data Structures", icon: "🌳" },
    { name: "DBMS", icon: "🗄️" },
    { name: "Operating Systems", icon: "⚙️" },
    { name: "Computer Networks", icon: "🌐" }
];
let currentSubjectFilter = "all";
let activeViewerMaterial = null;

// DOM Elements
const uploadBtn = document.getElementById("uploadBtn");
const searchInput = document.getElementById("searchInput");
const subjectFilter = document.getElementById("subjectFilter");
const materialsTable = document.getElementById("materialsTable");
const subjectGrid = document.getElementById("subjectGrid");
const addSubjectBtn = document.getElementById("addSubjectBtn");

// Modals
const uploadModal = document.getElementById("uploadModal");
const editModal = document.getElementById("editModal");
const subjectModal = document.getElementById("subjectModal");
const viewerModal = document.getElementById("viewerModal");
const viewerDialog = document.getElementById("viewerDialog");

// Viewer Modal Elements
const viewerTitle = document.getElementById("viewerTitle");
const viewerFileIcon = document.getElementById("viewerFileIcon");
const viewerSubjectTag = document.getElementById("viewerSubjectTag");
const viewerTypeTag = document.getElementById("viewerTypeTag");
const viewerSizeTag = document.getElementById("viewerSizeTag");
const viewerContentArea = document.getElementById("viewerContentArea");
const viewerNotesContainer = document.getElementById("viewerNotesContainer");
const viewerNotesText = document.getElementById("viewerNotesText");
const viewerDateTag = document.getElementById("viewerDateTag");
const viewerDownloadBtn = document.getElementById("viewerDownloadBtn");
const viewerRawTabBtn = document.getElementById("viewerRawTabBtn");
const viewerFullscreenBtn = document.getElementById("viewerFullscreenBtn");
const closeViewerModalBtn = document.getElementById("closeViewerModalBtn");
const viewerEditBtn = document.getElementById("viewerEditBtn");

// Upload Modal Form Elements
const uploadMaterialForm = document.getElementById("uploadMaterialForm");
const modalFileInput = document.getElementById("modalFileInput");
const dropzone = document.getElementById("dropzone");
const dropzonePrompt = document.getElementById("dropzonePrompt");
const dropzoneFilePreview = document.getElementById("dropzoneFilePreview");
const previewFilename = document.getElementById("previewFilename");
const previewFilesize = document.getElementById("previewFilesize");
const previewIcon = document.getElementById("previewIcon");
const removeSelectedFileBtn = document.getElementById("removeSelectedFileBtn");
const materialTitleInput = document.getElementById("materialTitle");
const materialSubjectSelect = document.getElementById("materialSubject");
const customSubjectInput = document.getElementById("customSubjectInput");
const materialDescriptionInput = document.getElementById("materialDescription");
const submitUploadBtn = document.getElementById("submitUploadBtn");
const uploadSpinner = document.getElementById("uploadSpinner");
const uploadBtnText = document.getElementById("uploadBtnText");
const closeUploadModalBtn = document.getElementById("closeUploadModalBtn");
const cancelUploadBtn = document.getElementById("cancelUploadBtn");

// Edit Modal Form Elements
const editMaterialForm = document.getElementById("editMaterialForm");
const editMaterialId = document.getElementById("editMaterialId");
const editTitleInput = document.getElementById("editTitle");
const editSubjectInput = document.getElementById("editSubject");
const editDescriptionInput = document.getElementById("editDescription");
const saveEditBtn = document.getElementById("saveEditBtn");
const editSpinner = document.getElementById("editSpinner");
const saveEditBtnText = document.getElementById("saveEditBtnText");
const closeEditModalBtn = document.getElementById("closeEditModalBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

// Subject Modal Form Elements
const addSubjectForm = document.getElementById("addSubjectForm");
const newSubjectNameInput = document.getElementById("newSubjectName");
const newSubjectIconInput = document.getElementById("newSubjectIcon");
const closeSubjectModalBtn = document.getElementById("closeSubjectModalBtn");
const cancelSubjectBtn = document.getElementById("cancelSubjectBtn");

// Toast Container
const toastContainer = document.getElementById("toastContainer");

/* ============================================================
   TOAST NOTIFICATION HELPER
============================================================ */
function showToast(message, type = "info") {
    if (!toastContainer) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    const icon = type === "success" ? "✓" : type === "error" ? "⚠️" : "ℹ️";
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(10px)";
        toast.style.transition = "all 0.25s ease";
        setTimeout(() => toast.remove(), 250);
    }, 3500);
}

/* ============================================================
   FORMATTING UTILITIES
============================================================ */
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return "";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getFileTypeInfo(type, originalName) {
    let ext = (type || "").toLowerCase().replace(".", "");
    if (!ext && originalName) {
        ext = originalName.split(".").pop().toLowerCase();
    }
    if (["pdf"].includes(ext)) return { cls: "pdf", label: "PDF" };
    if (["doc", "docx"].includes(ext)) return { cls: "doc", label: "DOC" };
    if (["ppt", "pptx"].includes(ext)) return { cls: "ppt", label: "PPT" };
    if (["xls", "xlsx"].includes(ext)) return { cls: "xls", label: "XLS" };
    if (["txt", "md"].includes(ext)) return { cls: "txt", label: ext.toUpperCase() };
    if (["png", "jpg", "jpeg", "webp"].includes(ext)) return { cls: "img", label: "IMG" };
    if (["zip", "rar", "7z"].includes(ext)) return { cls: "zip", label: "ZIP" };
    return { cls: "note", label: (ext || "NOTE").toUpperCase().slice(0, 4) };
}

/* ============================================================
   MODAL CONTROLS
============================================================ */
function openModal(modal) {
    if (!modal) return;
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
}

function closeModal(modal) {
    if (!modal) return;
    modal.style.display = "none";
    document.body.style.overflow = "auto";
}

// Close modals when clicking backdrop
[uploadModal, editModal, subjectModal, viewerModal].forEach(modal => {
    if (!modal) return;
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            closeModal(modal);
        }
    });
});

if (closeViewerModalBtn) {
    closeViewerModalBtn.addEventListener("click", () => closeModal(viewerModal));
}

if (viewerFullscreenBtn && viewerDialog) {
    viewerFullscreenBtn.addEventListener("click", () => {
        viewerDialog.classList.toggle("is-fullscreen");
    });
}

// Global Escape key listener to close modals
window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        [viewerModal, uploadModal, editModal, subjectModal].forEach(m => {
            if (m && m.style.display === "flex") {
                closeModal(m);
            }
        });
    }
});

/* ============================================================
   UPLOAD MODAL & FILE HANDLING
============================================================ */
if (uploadBtn) {
    uploadBtn.addEventListener("click", () => {
        resetUploadForm();

        // Set subject dropdown according to active filter if specific
        if (currentSubjectFilter && currentSubjectFilter !== "all") {
            const match = Array.from(materialSubjectSelect.options).find(
                opt => opt.value.toLowerCase() === currentSubjectFilter.toLowerCase()
            );
            if (match) {
                materialSubjectSelect.value = match.value;
            }
        }

        openModal(uploadModal);
    });
}

if (closeUploadModalBtn) closeUploadModalBtn.addEventListener("click", () => closeModal(uploadModal));
if (cancelUploadBtn) cancelUploadBtn.addEventListener("click", () => closeModal(uploadModal));

function resetUploadForm() {
    uploadMaterialForm.reset();
    modalFileInput.value = "";
    customSubjectInput.style.display = "none";
    customSubjectInput.required = false;
    dropzonePrompt.style.display = "block";
    dropzoneFilePreview.style.display = "none";
    materialTitleInput.value = "";
    materialDescriptionInput.value = "";
    uploadSpinner.style.display = "none";
    uploadBtnText.textContent = "Upload Material";
    submitUploadBtn.disabled = false;
}

// When a file is selected (via picker or drag-drop)
function handleSelectedFile(file) {
    if (!file) return;

    // Display file preview
    dropzonePrompt.style.display = "none";
    dropzoneFilePreview.style.display = "flex";
    previewFilename.textContent = file.name;
    previewFilesize.textContent = formatFileSize(file.size);

    const typeInfo = getFileTypeInfo(file.type, file.name);
    previewIcon.textContent = typeInfo.cls === "pdf" ? "📕" :
                              typeInfo.cls === "doc" ? "📘" :
                              typeInfo.cls === "img" ? "🖼️" : "📄";

    // AUTO-FILL TITLE if not already typed or if empty
    // Automatically cleans up extension (e.g. "Algorithms_Chapter1.pdf" -> "Algorithms Chapter1")
    const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ");
    materialTitleInput.value = cleanName;
}

if (modalFileInput) {
    modalFileInput.addEventListener("change", () => {
        if (modalFileInput.files && modalFileInput.files[0]) {
            handleSelectedFile(modalFileInput.files[0]);
        }
    });
}

if (removeSelectedFileBtn) {
    removeSelectedFileBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        modalFileInput.value = "";
        dropzonePrompt.style.display = "block";
        dropzoneFilePreview.style.display = "none";
        materialTitleInput.value = "";
    });
}

// Drag and Drop support
if (dropzone) {
    ["dragenter", "dragover"].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add("drag-active");
        });
    });

    ["dragleave", "drop"].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove("drag-active");
        });
    });

    dropzone.addEventListener("drop", (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files.length > 0) {
            modalFileInput.files = files;
            handleSelectedFile(files[0]);
        }
    });
}

// Handle Custom Subject Toggle in Upload Form
if (materialSubjectSelect) {
    materialSubjectSelect.addEventListener("change", () => {
        if (materialSubjectSelect.value === "__custom__") {
            customSubjectInput.style.display = "block";
            customSubjectInput.required = true;
            customSubjectInput.focus();
        } else {
            customSubjectInput.style.display = "none";
            customSubjectInput.required = false;
        }
    });
}

// Submit Upload Form (Real file upload via FormData)
if (uploadMaterialForm) {
    uploadMaterialForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const file = modalFileInput.files[0];
        if (!file) {
            showToast("Please choose a file to upload.", "error");
            return;
        }

        const title = materialTitleInput.value.trim() || file.name.replace(/\.[^/.]+$/, "");
        let subject = materialSubjectSelect.value;
        if (subject === "__custom__") {
            subject = customSubjectInput.value.trim();
            if (!subject) {
                showToast("Please enter a subject name.", "error");
                customSubjectInput.focus();
                return;
            }
        }
        const description = materialDescriptionInput.value.trim();

        const token = sessionStorage.getItem("studyTogetherToken");
        if (!token) {
            window.location.replace("/pages/login.html");
            return;
        }

        // Prepare FormData
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", title);
        formData.append("subject", subject);
        formData.append("description", description);

        try {
            submitUploadBtn.disabled = true;
            uploadSpinner.style.display = "inline-block";
            uploadBtnText.textContent = "Uploading...";

            const response = await fetch(`${API_BASE}/api/materials`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to upload material.");
            }

            closeModal(uploadModal);
            showToast("Material uploaded successfully!", "success");

            // Refresh materials list
            await loadMaterials();
        } catch (error) {
            console.error("Upload error:", error);
            showToast(error.message || "Upload failed. Please try again.", "error");
        } finally {
            submitUploadBtn.disabled = false;
            uploadSpinner.style.display = "none";
            uploadBtnText.textContent = "Upload Material";
        }
    });
}

/* ============================================================
   EDIT MODAL HANDLING
============================================================ */
function openEditModal(material) {
    if (!editModal) return;

    editMaterialId.value = material._id;
    editTitleInput.value = material.title || "";
    editSubjectInput.value = material.subject || "";
    editDescriptionInput.value = material.description || "";

    openModal(editModal);
}

if (closeEditModalBtn) closeEditModalBtn.addEventListener("click", () => closeModal(editModal));
if (cancelEditBtn) cancelEditBtn.addEventListener("click", () => closeModal(editModal));

if (editMaterialForm) {
    editMaterialForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const id = editMaterialId.value;
        const title = editTitleInput.value.trim();
        const subject = editSubjectInput.value.trim();
        const description = editDescriptionInput.value.trim();

        if (!title || !subject) {
            showToast("Title and subject are required.", "error");
            return;
        }

        const token = sessionStorage.getItem("studyTogetherToken");
        if (!token) {
            window.location.replace("/pages/login.html");
            return;
        }

        try {
            saveEditBtn.disabled = true;
            editSpinner.style.display = "inline-block";
            saveEditBtnText.textContent = "Saving...";

            const response = await fetch(`${API_BASE}/api/materials/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ title, subject, description })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Could not update material.");
            }

            closeModal(editModal);
            showToast("Material updated successfully!", "success");
            await loadMaterials();
        } catch (error) {
            console.error("Edit error:", error);
            showToast(error.message || "Could not update material.", "error");
        } finally {
            saveEditBtn.disabled = false;
            editSpinner.style.display = "none";
            saveEditBtnText.textContent = "Save Changes";
        }
    });
}

/* ============================================================
   ADD SUBJECT MODAL (NO BROWSER PROMPT!)
============================================================ */
if (addSubjectBtn) {
    addSubjectBtn.addEventListener("click", () => {
        addSubjectForm.reset();
        newSubjectIconInput.value = "📚";
        openModal(subjectModal);
    });
}

if (closeSubjectModalBtn) closeSubjectModalBtn.addEventListener("click", () => closeModal(subjectModal));
if (cancelSubjectBtn) cancelSubjectBtn.addEventListener("click", () => closeModal(subjectModal));

if (addSubjectForm) {
    addSubjectForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const subjectName = newSubjectNameInput.value.trim();
        const subjectIcon = newSubjectIconInput.value.trim() || "📚";

        if (!subjectName) {
            showToast("Please enter a subject name.", "error");
            return;
        }

        // Check if subject already exists
        const exists = availableSubjects.some(
            s => s.name.toLowerCase() === subjectName.toLowerCase()
        );

        if (!exists) {
            availableSubjects.push({ name: subjectName, icon: subjectIcon });
        }

        updateSubjectCardsAndDropdowns();
        closeModal(subjectModal);
        showToast(`Subject "${subjectName}" added!`, "success");

        // Automatically set filter to this new subject
        subjectFilter.value = subjectName;
        currentSubjectFilter = subjectName;
        renderMaterials();
    });
}

/* ============================================================
   ESCAPE HTML UTILITY
============================================================ */
function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* ============================================================
   AUTHENTICATED DOWNLOAD HANDLER
============================================================ */
function downloadMaterial(material) {
    if (!material) return;
    const token = sessionStorage.getItem("studyTogetherToken") || "";
    const downloadUrl = `${API_BASE}/api/materials/${material._id}/download?token=${encodeURIComponent(token)}`;

    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = material.originalName || `${material.title}.${material.fileType || "pdf"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`Downloading "${material.title}"...`, "info");
}

/* ============================================================
   IN-APP DOCUMENT VIEWER
============================================================ */
function openViewerModal(material) {
    if (!viewerModal) return;

    activeViewerMaterial = material;
    const typeInfo = getFileTypeInfo(material.fileType, material.originalName);
    const hasFile = Boolean(material.fileUrl);
    const fullFileUrl = hasFile ? `${API_BASE}${material.fileUrl}` : "";
    const token = sessionStorage.getItem("studyTogetherToken") || "";

    // Set Header
    viewerTitle.textContent = material.title || "Untitled Material";
    viewerTitle.title = material.title || "Untitled Material";
    viewerFileIcon.textContent = typeInfo.cls === "pdf" ? "📕" :
                                typeInfo.cls === "doc" ? "📘" :
                                typeInfo.cls === "ppt" ? "📙" :
                                typeInfo.cls === "xls" ? "📗" :
                                typeInfo.cls === "img" ? "🖼️" :
                                typeInfo.cls === "txt" ? "📄" : "📁";
    viewerSubjectTag.textContent = material.subject || "General";
    viewerTypeTag.textContent = typeInfo.label;
    viewerSizeTag.textContent = formatFileSize(material.fileSize) || "Note Only";

    // Set Footer
    viewerDateTag.textContent = material.createdAt
        ? `Added ${new Date(material.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
        : "Added Recently";

    if (material.description && material.description.trim()) {
        viewerNotesContainer.style.display = "block";
        viewerNotesText.textContent = material.description;
    } else {
        viewerNotesContainer.style.display = "block";
        viewerNotesText.textContent = "No notes provided for this study material.";
    }

    // Configure Download & Raw Tab buttons
    if (hasFile) {
        viewerDownloadBtn.style.display = "inline-flex";
        viewerDownloadBtn.onclick = () => downloadMaterial(material);

        viewerRawTabBtn.style.display = "inline-flex";
        viewerRawTabBtn.href = fullFileUrl;
    } else {
        viewerDownloadBtn.style.display = "none";
        viewerRawTabBtn.style.display = "none";
    }

    viewerEditBtn.onclick = () => {
        closeModal(viewerModal);
        openEditModal(material);
    };

    // Render body content
    viewerContentArea.innerHTML = "";

    if (!hasFile) {
        // Study Note View (materials without an attached file)
        viewerContentArea.innerHTML = `
            <div class="viewer-card-box">
                <div class="viewer-card-icon">📝</div>
                <h4>${escapeHtml(material.title)}</h4>
                <p>${escapeHtml(material.description || "This is a study note without an attached file.")}</p>
                <div class="viewer-card-actions">
                    <button type="button" class="btn btn-primary" id="cardEditNoteBtn">✏️ Edit Note</button>
                </div>
            </div>
        `;
        const cardEditBtn = document.getElementById("cardEditNoteBtn");
        if (cardEditBtn) {
            cardEditBtn.onclick = () => {
                closeModal(viewerModal);
                openEditModal(material);
            };
        }
    } else if (typeInfo.cls === "pdf") {
        // PDF Embed View
        const iframe = document.createElement("iframe");
        iframe.className = "viewer-iframe";
        iframe.title = material.title;
        iframe.src = `${fullFileUrl}#toolbar=1&navpanes=0`;
        viewerContentArea.appendChild(iframe);
    } else if (typeInfo.cls === "img") {
        // High-res Image View
        const imgBox = document.createElement("div");
        imgBox.className = "viewer-image-container";
        const img = document.createElement("img");
        img.src = fullFileUrl;
        img.alt = material.title;
        imgBox.appendChild(img);
        viewerContentArea.appendChild(imgBox);
    } else if (typeInfo.cls === "txt") {
        // In-App Text / Code Reader
        renderTextReader(material, fullFileUrl, token);
    } else if (["doc", "ppt", "xls"].includes(typeInfo.cls)) {
        // Office Document Preview Card
        renderOfficePreview(material, fullFileUrl, typeInfo);
    } else {
        // Generic / ZIP / Other File View
        viewerContentArea.innerHTML = `
            <div class="viewer-card-box">
                <div class="viewer-card-icon">${typeInfo.cls === "zip" ? "📦" : "📁"}</div>
                <h4>${escapeHtml(material.title)}</h4>
                <p>File: <strong>${escapeHtml(material.originalName || material.title)}</strong> (${formatFileSize(material.fileSize)})</p>
                <div class="viewer-card-actions">
                    <button type="button" class="btn btn-primary" id="genericDownloadBtn">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        <span>Download File</span>
                    </button>
                    <a href="${fullFileUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">Open Directly</a>
                </div>
            </div>
        `;
        const genBtn = document.getElementById("genericDownloadBtn");
        if (genBtn) genBtn.onclick = () => downloadMaterial(material);
    }

    openModal(viewerModal);
}

/* ============================================================
   IN-APP TEXT / CODE READER
============================================================ */
async function renderTextReader(material, fullFileUrl, token) {
    viewerContentArea.innerHTML = `
        <div class="viewer-text-reader">
            <div class="viewer-text-toolbar">
                <div class="viewer-text-toolbar-group">
                    <span id="textLineCount">Reading document...</span>
                </div>
                <div class="viewer-text-toolbar-group">
                    <button type="button" class="viewer-tool-btn" id="wrapToggleBtn">Toggle Wrap</button>
                    <button type="button" class="viewer-tool-btn" id="copyTextBtn">📋 Copy</button>
                </div>
            </div>
            <pre class="viewer-text-pre" id="viewerTextPre">Loading file content...</pre>
        </div>
    `;

    try {
        let textContent = "";
        const res = await fetch(`${API_BASE}/api/materials/${material._id}/text?token=${encodeURIComponent(token)}`);
        if (res.ok) {
            const data = await res.json();
            textContent = data.content;
        } else {
            const directRes = await fetch(fullFileUrl);
            textContent = await directRes.text();
        }

        const pre = document.getElementById("viewerTextPre");
        const lineCount = document.getElementById("textLineCount");
        const wrapBtn = document.getElementById("wrapToggleBtn");
        const copyBtn = document.getElementById("copyTextBtn");

        if (pre) pre.textContent = textContent;
        if (lineCount) {
            const lines = textContent.split("\n").length;
            const sizeKb = (new Blob([textContent]).size / 1024).toFixed(1);
            lineCount.textContent = `${lines} ${lines === 1 ? "line" : "lines"} • ${sizeKb} KB`;
        }

        if (wrapBtn && pre) {
            wrapBtn.addEventListener("click", () => {
                pre.classList.toggle("word-wrap");
            });
        }

        if (copyBtn) {
            copyBtn.addEventListener("click", async () => {
                try {
                    await navigator.clipboard.writeText(textContent);
                    copyBtn.textContent = "✓ Copied!";
                    setTimeout(() => { copyBtn.textContent = "📋 Copy"; }, 2000);
                } catch {
                    showToast("Could not copy to clipboard", "error");
                }
            });
        }
    } catch (err) {
        const pre = document.getElementById("viewerTextPre");
        if (pre) pre.textContent = `Could not display file preview: ${err.message}`;
    }
}

/* ============================================================
   OFFICE DOCUMENT PREVIEW CARD
============================================================ */
function renderOfficePreview(material, fullFileUrl, typeInfo) {
    const isPublicWeb = fullFileUrl.startsWith("http") && !fullFileUrl.includes("localhost") && !fullFileUrl.includes("127.0.0.1");

    if (isPublicWeb) {
        viewerContentArea.innerHTML = `
            <iframe class="viewer-iframe" src="https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fullFileUrl)}"></iframe>
        `;
    } else {
        viewerContentArea.innerHTML = `
            <div class="viewer-card-box">
                <div class="viewer-card-icon">${typeInfo.cls === "doc" ? "📘" : typeInfo.cls === "ppt" ? "📙" : "📗"}</div>
                <h4>${escapeHtml(material.title)}</h4>
                <p>This is a <strong>${typeInfo.label} Document</strong> (${formatFileSize(material.fileSize)}).<br>Original file: <em>${escapeHtml(material.originalName || material.title)}</em></p>
                <div class="viewer-card-actions">
                    <button type="button" class="btn btn-primary" id="officeDownloadBtn">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        <span>Download &amp; Open</span>
                    </button>
                    <a href="${fullFileUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">Open in New Tab</a>
                </div>
            </div>
        `;
        const offBtn = document.getElementById("officeDownloadBtn");
        if (offBtn) offBtn.onclick = () => downloadMaterial(material);
    }
}

/* ============================================================
   TABLE ROW CREATION & ACCESS
============================================================ */
function createMaterialRow(material) {
    const row = document.createElement("div");
    row.className = "material-row";
    row.dataset.id = material._id;
    row.dataset.name = (material.title || "").toLowerCase();
    row.dataset.subject = (material.subject || "").toLowerCase();

    const typeInfo = getFileTypeInfo(material.fileType, material.originalName);
    const hasFile = Boolean(material.fileUrl);
    const formattedSize = formatFileSize(material.fileSize);

    // 1. File Info Column (Title + Icon + Size/Description)
    const fileInfo = document.createElement("div");
    fileInfo.className = "file-info";

    const fileIcon = document.createElement("div");
    fileIcon.className = `file-icon ${typeInfo.cls}`;
    fileIcon.textContent = typeInfo.label;
    fileIcon.style.cursor = "pointer";
    fileIcon.title = "Click to open in-app viewer";
    fileIcon.addEventListener("click", () => openViewerModal(material));

    const fileDetails = document.createElement("div");
    fileDetails.className = "file-details";

    // Title is an in-app viewer trigger
    const titleEl = document.createElement("a");
    titleEl.href = "#";
    titleEl.className = "file-title-link";
    titleEl.title = "Click to view document inside StudyTogether";
    titleEl.textContent = material.title || "Untitled Material";
    titleEl.addEventListener("click", (e) => {
        e.preventDefault();
        openViewerModal(material);
    });

    const metaSub = document.createElement("div");
    metaSub.className = "file-meta-sub";

    if (formattedSize) {
        const sizeSpan = document.createElement("span");
        sizeSpan.className = "file-size-badge";
        sizeSpan.textContent = formattedSize;
        metaSub.appendChild(sizeSpan);
    } else {
        const noteSpan = document.createElement("span");
        noteSpan.className = "file-size-badge";
        noteSpan.textContent = "Note";
        metaSub.appendChild(noteSpan);
    }

    if (material.description) {
        const dot = document.createTextNode(" • ");
        metaSub.appendChild(dot);
        const descSpan = document.createElement("span");
        descSpan.textContent = material.description;
        metaSub.appendChild(descSpan);
    }

    fileDetails.append(titleEl, metaSub);
    fileInfo.append(fileIcon, fileDetails);

    // 2. Subject Column
    const subjectCol = document.createElement("div");
    subjectCol.className = "subject-tag";
    subjectCol.textContent = material.subject || "General";

    // 3. Type Column
    const typeCol = document.createElement("div");
    const typeBadge = document.createElement("span");
    typeBadge.className = "file-type";
    typeBadge.textContent = typeInfo.label;
    typeCol.appendChild(typeBadge);

    // 4. Added Date Column
    const dateCol = document.createElement("div");
    dateCol.textContent = material.createdAt
        ? new Date(material.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric"
          })
        : "Recently";

    // 5. Actions Column (View In-App, Download, Edit, Delete)
    const actionsCol = document.createElement("div");
    actionsCol.className = "row-actions";

    // View In-App Button
    const viewBtn = document.createElement("button");
    viewBtn.type = "button";
    viewBtn.className = "action-btn view-btn";
    viewBtn.title = "View document inside StudyTogether";
    viewBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        <span>View</span>
    `;
    viewBtn.addEventListener("click", () => openViewerModal(material));
    actionsCol.appendChild(viewBtn);

    // Download Button (if file exists)
    if (hasFile) {
        const downloadBtn = document.createElement("button");
        downloadBtn.type = "button";
        downloadBtn.className = "action-btn download-btn";
        downloadBtn.title = "Download original file";
        downloadBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>Download</span>
        `;
        downloadBtn.addEventListener("click", () => downloadMaterial(material));
        actionsCol.appendChild(downloadBtn);
    }

    // Edit Button
    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "action-btn edit-btn";
    editBtn.title = "Edit name, subject, or notes";
    editBtn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
    `;
    editBtn.addEventListener("click", () => openEditModal(material));
    actionsCol.appendChild(editBtn);

    // Delete Button
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "action-btn delete-btn";
    deleteBtn.title = "Delete material";
    deleteBtn.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
    `;
    deleteBtn.addEventListener("click", async () => {
        if (!confirm(`Are you sure you want to delete "${material.title}"?`)) return;

        try {
            const token = sessionStorage.getItem("studyTogetherToken");
            const res = await fetch(`${API_BASE}/api/materials/${material._id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to delete.");

            showToast("Material deleted.", "info");
            await loadMaterials();
        } catch (err) {
            showToast(err.message || "Delete failed.", "error");
        }
    });
    actionsCol.appendChild(deleteBtn);

    row.append(fileInfo, subjectCol, typeCol, dateCol, actionsCol);
    return row;
}

/* ============================================================
   RENDER MATERIALS & FILTERING
============================================================ */
function renderMaterials() {
    if (!materialsTable) return;

    // Clear previous rows (preserve table header)
    const rows = materialsTable.querySelectorAll(".material-row:not(.table-header), .empty-state");
    rows.forEach(r => r.remove());

    const searchValue = (searchInput ? searchInput.value : "").toLowerCase().trim();
    const activeSubject = (currentSubjectFilter || "all").toLowerCase();

    const filtered = allMaterials.filter(material => {
        const titleMatch = (material.title || "").toLowerCase().includes(searchValue);
        const descMatch = (material.description || "").toLowerCase().includes(searchValue);
        const matchesSearch = titleMatch || descMatch;

        const matSubject = (material.subject || "").toLowerCase();
        const matchesSubject = activeSubject === "all" || matSubject === activeSubject;

        return matchesSearch && matchesSubject;
    });

    if (filtered.length === 0) {
        const emptyDiv = document.createElement("div");
        emptyDiv.className = "empty-state";
        emptyDiv.innerHTML = `
            <div class="empty-icon">📂</div>
            <h3>No study materials found</h3>
            <p>${allMaterials.length === 0 ? "You haven't uploaded any materials yet. Click 'Upload Material' to get started!" : "No files match your current search or subject filter."}</p>
        `;
        materialsTable.appendChild(emptyDiv);
        return;
    }

    filtered.forEach(material => {
        materialsTable.appendChild(createMaterialRow(material));
    });
}

/* ============================================================
   UPDATE SUBJECT CARDS & DROPDOWNS
============================================================ */
function updateSubjectCardsAndDropdowns() {
    // 1. Gather all subjects from allMaterials and predefined subjects
    const subjectMap = new Map();

    availableSubjects.forEach(s => {
        subjectMap.set(s.name.toLowerCase(), { name: s.name, icon: s.icon, count: 0 });
    });

    allMaterials.forEach(m => {
        if (!m.subject) return;
        const key = m.subject.toLowerCase();
        if (subjectMap.has(key)) {
            subjectMap.get(key).count++;
        } else {
            subjectMap.set(key, { name: m.subject, icon: "📘", count: 1 });
        }
    });

    // 2. Render Subject Cards
    if (subjectGrid) {
        subjectGrid.innerHTML = "";

        // All Materials Card
        const allCard = document.createElement("div");
        allCard.className = `subject-card ${currentSubjectFilter === "all" ? "active-subject" : ""}`;
        allCard.dataset.subject = "all";
        allCard.innerHTML = `
            <div class="subject-card-icon">📚</div>
            <div>
                <h3>All Materials</h3>
                <p>${allMaterials.length} ${allMaterials.length === 1 ? "Material" : "Materials"}</p>
            </div>
            <span class="subject-arrow">→</span>
        `;
        allCard.addEventListener("click", () => {
            setSubjectFilter("all");
        });
        subjectGrid.appendChild(allCard);

        // Subject Specific Cards
        subjectMap.forEach((info) => {
            const card = document.createElement("div");
            card.className = `subject-card ${currentSubjectFilter.toLowerCase() === info.name.toLowerCase() ? "active-subject" : ""}`;
            card.dataset.subject = info.name;
            card.innerHTML = `
                <div class="subject-card-icon">${info.icon || "📘"}</div>
                <div>
                    <h3 title="${info.name}">${info.name}</h3>
                    <p>${info.count} ${info.count === 1 ? "Material" : "Materials"}</p>
                </div>
                <span class="subject-arrow">→</span>
            `;
            card.addEventListener("click", () => {
                setSubjectFilter(info.name);
            });
            subjectGrid.appendChild(card);
        });
    }

    // 3. Update Subject Filter Dropdown
    if (subjectFilter) {
        const prevValue = subjectFilter.value || "all";
        subjectFilter.innerHTML = `<option value="all">All Subjects</option>`;
        subjectMap.forEach((info) => {
            const opt = document.createElement("option");
            opt.value = info.name;
            opt.textContent = info.name;
            subjectFilter.appendChild(opt);
        });
        subjectFilter.value = prevValue;
    }

    // 4. Update Modal Subject Dropdown
    if (materialSubjectSelect) {
        const prevSelect = materialSubjectSelect.value;
        materialSubjectSelect.innerHTML = "";
        subjectMap.forEach((info) => {
            const opt = document.createElement("option");
            opt.value = info.name;
            opt.textContent = info.name;
            materialSubjectSelect.appendChild(opt);
        });
        // Add option to create a custom new subject
        const customOpt = document.createElement("option");
        customOpt.value = "__custom__";
        customOpt.textContent = "＋ New / Other Subject...";
        materialSubjectSelect.appendChild(customOpt);

        if (prevSelect && prevSelect !== "__custom__") {
            materialSubjectSelect.value = prevSelect;
        }
    }
}

function setSubjectFilter(subjectName) {
    currentSubjectFilter = subjectName;
    if (subjectFilter) subjectFilter.value = subjectName;

    // Highlight active card
    if (subjectGrid) {
        subjectGrid.querySelectorAll(".subject-card").forEach(c => {
            if ((c.dataset.subject || "").toLowerCase() === subjectName.toLowerCase()) {
                c.classList.add("active-subject");
            } else {
                c.classList.remove("active-subject");
            }
        });
    }

    renderMaterials();
}

/* ============================================================
   SEARCH & FILTER LISTENERS
============================================================ */
if (searchInput) {
    searchInput.addEventListener("input", () => {
        renderMaterials();
    });
}

if (subjectFilter) {
    subjectFilter.addEventListener("change", () => {
        setSubjectFilter(subjectFilter.value);
    });
}

/* ============================================================
   LOAD MATERIALS FROM API
============================================================ */
async function loadMaterials() {
    try {
        const token = sessionStorage.getItem("studyTogetherToken");
        if (!token) {
            window.location.replace("/pages/login.html");
            return;
        }

        const response = await fetch(`${API_BASE}/api/materials`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Could not load materials.");
        }

        allMaterials = data.materials || [];
        updateSubjectCardsAndDropdowns();
        renderMaterials();
    } catch (error) {
        console.error("Loading materials failed:", error);
        showToast(error.message || "Could not load study materials.", "error");

        const loadingEl = document.getElementById("materialsLoading");
        if (loadingEl) {
            loadingEl.innerHTML = `
                <div class="empty-icon">⚠️</div>
                <h3>Failed to load materials</h3>
                <p>${error.message}</p>
                <button type="button" class="btn btn-secondary" onclick="loadMaterials()">Retry</button>
            `;
        }
    }
}

// Initial load
loadMaterials();
