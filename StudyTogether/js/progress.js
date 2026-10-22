// ================================
// PROGRESS PAGE
// ================================

const goalBtn = document.getElementById("goalBtn");


// Set study goal

goalBtn.addEventListener("click", function () {

    const currentGoal = prompt(
        "How many hours do you want to study this week?",
        "20"
    );

    if (currentGoal === null) {
        return;
    }

    const goal = Number(currentGoal);

    if (isNaN(goal) || goal <= 0) {

        alert("Please enter a valid number.");

        return;
    }

    alert(
        `Your weekly study goal has been set to ${goal} hours.`
    );
});