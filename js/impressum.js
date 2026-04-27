const overlay = document.getElementById("teamOverlay");

function openMember(card) {
    overlay.style.display = "flex";

    setTimeout(() => overlay.classList.add("active"), 10);

    document.getElementById("overlayImg").src =
        card.querySelector("img").src;

    document.getElementById("overlayName").innerText =
        card.querySelector("h3").innerText;

    document.getElementById("overlayRole").innerText =
        card.querySelector("span").innerText;

    document.getElementById("overlayText").innerText =
        card.querySelector("p").innerText;

    document.getElementById("overlayEmail").innerText =
        card.dataset.email;

    document.getElementById("overlayPhone").innerText =
        card.dataset.phone;
}

function closeMember() {
    overlay.classList.remove("active");

    setTimeout(() => {
        overlay.style.display = "none";
    }, 300);
}

/* Klick außerhalb = schließen */
overlay.addEventListener("click", () => closeMember());

/* ESC = schließen */
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMember();
});