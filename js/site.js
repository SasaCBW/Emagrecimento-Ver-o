import { getPublicSettings } from "./firestore-config.js";

document.addEventListener("DOMContentLoaded", async () => {
  const menuToggle = document.querySelector("#menu-toggle");
  const navigation = document.querySelector("#main-navigation");

  // MENU PARA CELULARES
  if (menuToggle && navigation) {
    menuToggle.addEventListener("click", () => {
      const isOpen = navigation.classList.toggle("is-open");

      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute(
        "aria-label",
        isOpen ? "Fechar menu" : "Abrir menu"
      );
    });

    navigation.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navigation.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Abrir menu");
      });
    });

    document.addEventListener("click", (event) => {
      if (
        !navigation.contains(event.target) &&
        !menuToggle.contains(event.target)
      ) {
        navigation.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Abrir menu");
      }
    });
  }

  // ANO AUTOMÁTICO NO RODAPÉ
  const currentYear = document.querySelector("#current-year");

  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

  // PERGUNTAS FREQUENTES
  const faqItems = document.querySelectorAll(".faq-item");

  faqItems.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;

      faqItems.forEach((otherItem) => {
        if (otherItem !== item) {
          otherItem.open = false;
        }
      });
    });
  });

  // ANIMAÇÕES DE ENTRADA
  const animatedElements = document.querySelectorAll(
    ".benefit-card, .content-card, .highlight-item, .about-content, .section-heading"
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
      element.classList.add("reveal");
      observer.observe(element);
    });
  } else {
    animatedElements.forEach((element) => {
      element.classList.add("is-visible");
    });
  }

  // CONFIGURAÇÕES DO PRODUTO
  const checkoutButton = document.querySelector("[data-checkout]");
  const checkoutNotice = document.querySelector("[data-checkout-notice]");

  function setText(selector, value) {
    if (value === undefined || value === null || value === "") return;

    document.querySelectorAll(selector).forEach((element) => {
      element.textContent = String(value);
    });
  }

  function formatCurrency(value) {
    const number = Number(value);

    if (!Number.isFinite(number) || number < 0) {
      return "";
    }

    return number.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function setPrice(value) {
    const formattedPrice = formatCurrency(value);

    if (!formattedPrice) return;

    document.querySelectorAll("[data-course-price]").forEach((element) => {
      element.textContent = formattedPrice;
    });
  }

  function setOldPrice(value) {
    const elements = document.querySelectorAll("[data-course-old-price]");
    const oldPrice = Number(value);

    elements.forEach((element) => {
      if (
        Number.isFinite(oldPrice) &&
        oldPrice > 0
      ) {
        element.textContent = formatCurrency(oldPrice);
        element.hidden = false;
      } else {
        element.textContent = "";
        element.hidden = true;
      }
    });
  }

  function isValidCheckoutUrl(value) {
    if (!value) return false;

    try {
      const url = new URL(value);

      return (
        url.protocol === "https:" &&
        url.hostname.includes(".") &&
        url.hostname !== "localhost"
      );
    } catch {
      return false;
    }
  }

  function configureCheckout(url) {
    if (!checkoutButton) return;

    if (isValidCheckoutUrl(url)) {
      checkoutButton.href = url;
      checkoutButton.target = "_blank";
      checkoutButton.rel = "noopener noreferrer";
      checkoutButton.removeAttribute("aria-disabled");

      if (checkoutNotice) {
        checkoutNotice.textContent =
          "Você será direcionado à página de pagamento configurada pelo responsável pelo site.";
      }
    } else {
      checkoutButton.href = "#comprar";
      checkoutButton.removeAttribute("target");
      checkoutButton.removeAttribute("rel");
      checkoutButton.setAttribute("aria-disabled", "true");

      if (checkoutNotice) {
        checkoutNotice.textContent =
          "A página de pagamento ainda não foi configurada.";
      }
    }
  }

  if (checkoutButton) {
    checkoutButton.addEventListener("click", (event) => {
      const url = checkoutButton.href;

      if (
        checkoutButton.getAttribute("aria-disabled") === "true" ||
        !isValidCheckoutUrl(url)
      ) {
        event.preventDefault();

        if (checkoutNotice) {
          checkoutNotice.textContent =
            "A compra ainda não está disponível. Entre em contato para obter informações.";
        }
      }
    });
  }

  // CARREGAMENTO DAS CONFIGURAÇÕES DO FIRESTORE
  try {
    const settings = await getPublicSettings();

    if (!settings) {
      configureCheckout("");
      return;
    }

    setText("[data-course-name]", settings.courseName);
    setText("[data-course-description]", settings.courseDescription);

    if (settings.price !== undefined && settings.price !== null) {
      setPrice(settings.price);
    }

    setOldPrice(settings.oldPrice);

    if (settings.contactEmail) {
      const email = String(settings.contactEmail).trim();

      const validEmail =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      if (validEmail) {
        document.querySelectorAll("[data-contact-email]").forEach((element) => {
          element.textContent = email;
        });

        document.querySelectorAll("[data-contact-link]").forEach((element) => {
          element.href = `mailto:${email}`;
        });
      }
    }

    configureCheckout(settings.checkoutUrl);
  } catch (error) {
    console.error("Não foi possível carregar as configurações:", error);
    configureCheckout("");

    if (checkoutNotice) {
      checkoutNotice.textContent =
        "Não foi possível carregar as informações da compra. Tente novamente mais tarde.";
    }
  }
});
