(function () {
  function track(eventName, payload) {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, payload || {});
    }
  }

  document.querySelectorAll("[data-ad-slot]").forEach(function (slot) {
    track("ad_slot_visible", {
      slot_name: slot.getAttribute("data-ad-slot"),
      page_type: document.querySelector('meta[name="page-type"]')?.content || "unknown"
    });
  });

  document.querySelectorAll(".mini-tool-card, .text-link, .tool-card a").forEach(function (link) {
    link.addEventListener("click", function () {
      track("internal_link_click", {
        href: link.getAttribute("href") || "",
        page_type: document.querySelector('meta[name="page-type"]')?.content || "unknown"
      });
    });
  });

  document.querySelectorAll(".calculator-form").forEach(function (form) {
    form.addEventListener("submit", function () {
      track("calculator_submit", {
        form_id: form.getAttribute("id") || "calculator-form"
      });
    });
  });
})();
