document.addEventListener("DOMContentLoaded", () => {
  // Menu para celulares
  const menuButton = document.querySelector("#mobile-menu-button");
  const navigation = document.querySelector("#nav-links");

  if (menuButton && navigation) {
    menuButton.addEventListener("click", () => {
      const isOpen = navigation.classList.toggle("open");

      menuButton.setAttribute("aria-expanded", String(isOpen));
      menuButton.setAttribute(
        "aria-label",
        isOpen ? "Fechar menu" : "Abrir menu"
      );

      menuButton.textContent = isOpen ? "✕" : "☰";
    });

    navigation.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navigation.classList.remove("open");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Abrir menu");
        menuButton.textContent = "☰";
      });
    });
  }

  // Perguntas frequentes
  const faqItems = document.querySelectorAll(".faq-item");

  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question");

    if (!question) return;

    question.setAttribute(
      "aria-expanded",
      String(item.classList.contains("active"))
    );

    question.addEventListener("click", () => {
      const wasActive = item.classList.contains("active");

      faqItems.forEach((otherItem) => {
        otherItem.classList.remove("active");

        const otherQuestion = otherItem.querySelector(".faq-question");

        if (otherQuestion) {
          otherQuestion.setAttribute("aria-expanded", "false");
        }
      });

      if (!wasActive) {
        item.classList.add("active");
        question.setAttribute("aria-expanded", "true");
      }
    });
  });

  // Ano atual no rodapé
  const yearElement = document.querySelector("#current-year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // Evita que links de checkout vazios pareçam funcionar
  document.querySelectorAll("[data-checkout]").forEach((button) => {
    button.addEventListener("click", (event) => {
      const checkoutUrl = button.getAttribute("href");

      if (
        !checkoutUrl ||
        checkoutUrl === "#" ||
        checkoutUrl.includes("COLOQUE_SEU_LINK")
      ) {
        event.preventDefault();

        alert(
          "O checkout ainda precisa ser configurado pelo administrador."
        );
      }
    });
  });

  // Animação discreta ao aparecerem as seções
  const animatedElements = document.querySelectorAll(
    ".benefit-card, .bonus-card"
  );

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            currentObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12
      }
    );

    animatedElements.forEach((element) => {
      observer.observe(element);
    });
  } else {
    animatedElements.forEach((element) => {
      element.classList.add("is-visible");
    });
  }
});
