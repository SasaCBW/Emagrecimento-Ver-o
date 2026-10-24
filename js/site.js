import { getPublicSettings } from "./firestore-config.js";

document.addEventListener("DOMContentLoaded", () => {
  /* =========================================
     MENU PARA CELULAR
  ========================================= */

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

  /* =========================================
     PERGUNTAS FREQUENTES
  ========================================= */

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

  /* =========================================
     ANO AUTOMÁTICO NO RODAPÉ
  ========================================= */

  const yearElement = document.querySelector("#current-year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  /* =========================================
     ANIMAÇÕES AO ROLAR A PÁGINA
  ========================================= */

  const animatedElements = document.querySelectorAll(
    ".benefit-card, .bonus-card, .content-card"
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

  /* =========================================
     LINK DE COMPRA
  ========================================= */

  const checkoutButtons = document.querySelectorAll("[data-checkout]");

  checkoutButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      const checkoutUrl = button.getAttribute("href");

      if (
        !checkoutUrl ||
        checkoutUrl === "#" ||
        checkoutUrl.includes("COLOQUE_SEU_LINK")
      ) {
        event.preventDefault();

        alert(
          "O link de compra ainda não foi configurado. Entre em contato para obter informações."
        );
      }
    });
  });

  /* =========================================
     FORMATAÇÃO DE MOEDA
  ========================================= */

  function formatCurrency(value) {
    const amount = Number(value);

    if (!Number.isFinite(amount) || amount < 0) {
      return null;
    }

    return amount.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  /* =========================================
     ATUALIZAR INFORMAÇÕES DO SITE
  ========================================= */

  async function loadPublicSettings() {
    try {
      const settings = await getPublicSettings();

      if (!settings) {
        console.info(
          "O site ainda está usando as informações padrão."
        );

        return;
      }

      /* Nome do projeto */

      if (settings.courseName) {
        document.querySelectorAll("[data-course-name]").forEach((element) => {
          element.textContent = settings.courseName;
        });

        document.title = `${settings.courseName} | Seu verão, seu ritmo`;
      }

      /* Descrição */

      if (settings.courseDescription) {
        document.querySelectorAll("[data-course-description]").forEach((element) => {
          element.textContent = settings.courseDescription;
        });
      }

      /* Preço atual */

      const currentPrice = formatCurrency(settings.price);

      if (currentPrice) {
        document.querySelectorAll("[data-course-price]").forEach((element) => {
          element.textContent = currentPrice;
        });
      }

      /* Preço de referência */

      const oldPrice = formatCurrency(settings.oldPrice);

      document.querySelectorAll("[data-course-old-price]").forEach((element) => {
        if (oldPrice && Number(settings.oldPrice) > Number(settings.price)) {
          element.textContent = oldPrice;
          element.hidden = false;
        } else {
          element.textContent = "";
          element.hidden = true;
        }
      });

      /* Link de compra */

      document.querySelectorAll("[data-checkout]").forEach((button) => {
        if (settings.checkoutUrl) {
          try {
            const checkout = new URL(settings.checkoutUrl);

            if (checkout.protocol !== "https:") {
              throw new Error("O link precisa utilizar HTTPS.");
            }

            button.href = checkout.href;
            button.setAttribute("target", "_blank");
            button.setAttribute("rel", "noopener noreferrer");
            button.setAttribute("aria-label", "Acessar a página de compra");
          } catch (error) {
            console.warn("O link de compra não é válido.");
            button.href = "#comprar";
          }
        } else {
          button.href = "#comprar";
        }
      });

      /* E-mail de contato */

      if (settings.contactEmail) {
        document.querySelectorAll("[data-contact-email]").forEach((element) => {
          element.textContent = settings.contactEmail;
        });

        document.querySelectorAll("[data-contact-link]").forEach((element) => {
          element.href = `mailto:${settings.contactEmail}`;
        });
      }

    } catch (error) {
      console.error(
        "Não foi possível carregar as configurações públicas:",
        error
      );

      // A página mantém seu conteúdo padrão caso o Firestore
      // esteja indisponível ou ainda não tenha sido configurado.
    }
  }

  loadPublicSettings();
});
