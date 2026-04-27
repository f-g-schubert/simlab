// MARK: - PARALLAX
/* =========================
   PARALLAX BACKGROUND
========================= */
const enableParallax = true;

if (enableParallax) {
    window.addEventListener("scroll", () => {
        document.querySelectorAll(".parallax").forEach(el => {
            const speed = el.dataset.speed || 0.5;
            el.style.backgroundPositionY = window.scrollY * speed + "px";
        });
    });
}