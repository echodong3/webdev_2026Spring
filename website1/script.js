const cards = document.querySelectorAll(".image_container");

cards.forEach(card => {
  card.addEventListener("click", () => {
    const fact = card.querySelector(".fact");

    document.querySelectorAll(".fact").forEach(f => {
      if (f !== fact) {
        f.classList.remove("show");
      }
    });

    fact.classList.toggle("show");
  });
});
