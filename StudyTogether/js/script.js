const startStudyBtn = document.getElementById("startStudyBtn");

startStudyBtn.addEventListener("click", function () {

    alert("Study session started!");

});
const askAiBtn = document.getElementById("askAiBtn");

if (askAiBtn) {

    askAiBtn.addEventListener("click", function () {

        window.location.href = "pages/ai-chat.html";

    });

}