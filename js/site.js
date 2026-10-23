/* ==================================================
   VERÃO FIT — INTERAÇÕES DO SITE
================================================== */

document.addEventListener("DOMContentLoaded", () => {
  /* ==================================================
     MENU PARA CELULAR
  ================================================== */

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

  /* ==================================================
     ANO AUTOMÁTICO NO RODAPÉ
  ================================================== */

  const yearElement = document.querySelector("#current-year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  /* ==================================================
     PERGUNTAS FREQUENTES
  ================================================== */

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

        const otherQuestion =
          otherItem.querySelector(".faq-question");

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

  /* ==================================================
     ANIMAÇÕES AO ROLAR A PÁGINA
  ================================================== */

  const animatedElements = document.querySelectorAll(
    ".benefit-card, .bonus-card, .feature-card, .step-card"
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

  /* ==================================================
     BOTÕES DE COMPRA
  ================================================== */

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
          "O link de pagamento ainda não foi configurado. Entre em contato para obter informações sobre a compra."
        );
      }
    });
  });

  /* ==================================================
     CONFIGURAÇÕES DO PRODUTO
  ================================================== */

  function loadProductSettings() {
    let settings = {};

    try {
      const stored = localStorage.getItem("veraoFitSettings");

      if (stored) {
        const parsed = JSON.parse(stored);

        if (
          parsed &&
          typeof parsed === "object" &&
          !Array.isArray(parsed)
        ) {
          settings = parsed;
        }
      }
    } catch (error) {
      console.warn(
        "Não foi possível carregar as configurações do produto."
      );
    }

    /* Nome do produto */

    document.querySelectorAll("[data-course-name]").forEach((element) => {
      if (settings.courseName) {
        element.textContent = settings.courseName;
      }
    });

    /* Descrição */

    document
      .querySelectorAll("[data-course-description]")
      .forEach((element) => {
        if (settings.courseDescription) {
          element.textContent = settings.courseDescription;
        }
      });

    /* Preço atual */

    document.querySelectorAll("[data-course-price]").forEach((element) => {
      if (settings.price !== undefined && settings.price !== "") {
        const amount = Number(settings.price);

        if (Number.isFinite(amount)) {
          element.textContent = amount.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
          });
        }
      }
    });

    /* Preço anterior */

    document
      .querySelectorAll("[data-course-old-price]")
      .forEach((element) => {
        if (settings.oldPrice) {
          const amount = Number(settings.oldPrice);

          if (Number.isFinite(amount)) {
            element.textContent = amount.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL"
            });
          }
        }
      });

    /* Link de pagamento */

    if (settings.checkoutUrl) {
      try {
        const checkout = new URL(settings.checkoutUrl);

        if (
          checkout.protocol === "https:" ||
          checkout.protocol === "http:"
        ) {
          document
            .querySelectorAll("[data-checkout]")
            .forEach((button) => {
              button.setAttribute("href", checkout.href);
              button.setAttribute("target", "_blank");
              button.setAttribute("rel", "noopener noreferrer");
            });
        }
      } catch (error) {
        console.warn("O link de pagamento configurado é inválido.");
      }
    }

    /* E-mail de contato */

    if (settings.contactEmail) {
      document.querySelectorAll("[data-contact-email]").forEach((element) => {
        element.textContent = settings.contactEmail;
      });

      document
        .querySelectorAll("[data-contact-link]")
        .forEach((element) => {
          element.setAttribute(
            "href",
            `mailto:${settings.contactEmail}`
          );
        });
    }
  }

  loadProductSettings();

  /* ==================================================
     ATUALIZAR CONFIGURAÇÕES QUANDO A ABA VOLTAR
  ================================================== */

  window.addEventListener("pageshow", () => {
    loadProductSettings();
  });

  /* ==================================================
     BOTÃO DE VOLTAR AO TOPO
  ================================================== */

  const backToTop = document.querySelector("#back-to-top");

  if (backToTop) {
    window.addEventListener(
      "scroll",
      () => {
        backToTop.classList.toggle(
          "visible",
          window.scrollY > 400
        );
      },
      { passive: true }
    );

    backToTop.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }

});
