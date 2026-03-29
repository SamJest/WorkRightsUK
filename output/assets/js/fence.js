(function () {
  const form = document.getElementById("fence-form");
  if (!form) return;

  const unitButtons = Array.from(document.querySelectorAll(".unit-toggle"));
  const currencyButtons = Array.from(document.querySelectorAll(".currency-pill"));
  const resultMain = document.querySelector(".result-main");
  const resultSub = document.querySelector(".result-sub");
  const resultBreakdown = document.getElementById("result-breakdown");
  const intelligence = window.BuildCostLabCostIntel;

  const currencyMap = {
    GBP: { symbol: "\u00A3", code: "GBP" },
    USD: { symbol: "$", code: "USD" },
    EUR: { symbol: "\u20AC", code: "EUR" }
  };

  let unit = "metric";
  let currency = "GBP";

  function money(value) {
    const info = currencyMap[currency] || currencyMap.GBP;
    return `${info.symbol}${Number(value).toFixed(2)} ${info.code}`;
  }

  function setActive(buttons, key, value) {
    buttons.forEach(function (button) {
      button.classList.toggle("is-active", button.dataset[key] === value);
    });
  }

  function getNumber(id) {
    const field = document.getElementById(id);
    const value = field ? parseFloat(field.value) : 0;
    return Number.isFinite(value) ? value : 0;
  }

  function toMetricLength(value) {
    return unit === "metric" ? value : value * 0.3048;
  }

  function fenceTimeline(run) {
    if (run < 15) {
      return [
        { stage: "Set out and mark posts", duration: "Half day" },
        { stage: "Install posts and panels", duration: "1 day" },
        { stage: "Concrete and tidy", duration: "Half day" }
      ];
    }
    if (run < 35) {
      return [
        { stage: "Set out and mark posts", duration: "Half day to 1 day" },
        { stage: "Install posts and panels", duration: "1 to 2 days" },
        { stage: "Concrete and tidy", duration: "Half day to 1 day" }
      ];
    }
    return [
      { stage: "Set out and mark posts", duration: "1 day" },
      { stage: "Install posts and panels", duration: "2 to 3 days" },
      { stage: "Concrete and tidy", duration: "1 day" }
    ];
  }

  function renderDefaultState() {
    resultMain.textContent = "Enter your measurements";
    resultSub.textContent = "You will see panels, posts, concrete and rough material cost here.";
    resultBreakdown.innerHTML = "";
    if (intelligence) intelligence.clear();
  }

  function calculate(event) {
    if (event) event.preventDefault();

    const length = toMetricLength(getNumber("length"));
    const panelWidth = Math.max(toMetricLength(getNumber("panel-width")), 0.01);
    const postDepth = toMetricLength(getNumber("post-depth"));
    const waste = Math.max(getNumber("waste"), 0) / 100;
    const pricePerPanel = Math.max(getNumber("price-per-panel"), 0);
    const pricePerPost = Math.max(getNumber("price-per-post"), 0);
    const concretePerPost = Math.max(getNumber("concrete-per-post"), 0);
    const pricePerConcrete = Math.max(getNumber("price-per-concrete"), 0);

    const panels = Math.ceil((length / panelWidth) * (1 + waste));
    const posts = panels + 1;
    const concreteVolume = posts * concretePerPost;
    const panelCost = panels * pricePerPanel;
    const postCost = posts * pricePerPost;
    const concreteCost = concreteVolume * pricePerConcrete;
    const estimatedCost = panelCost + postCost + concreteCost;

    if (!(panels > 0)) {
      renderDefaultState();
      return;
    }

    resultMain.textContent = `${panels} fence panels`;
    resultSub.textContent = `That includes about ${posts} posts, ${concreteVolume.toFixed(2)} m3 of post concrete, and roughly ${money(estimatedCost)} in material cost.`;
    resultBreakdown.innerHTML =
      `<div class="break-row"><span>Total fence run</span><strong>${length.toFixed(2)} m</strong></div>` +
      `<div class="break-row"><span>Panels</span><strong>${panels}</strong></div>` +
      `<div class="break-row"><span>Posts</span><strong>${posts}</strong></div>` +
      `<div class="break-row"><span>Concrete volume</span><strong>${concreteVolume.toFixed(2)} m3</strong></div>` +
      `<div class="break-row"><span>Estimated material cost</span><strong>${money(estimatedCost)}</strong></div>` +
      `<div class="calc-note">Calculation: fence run divided by panel width, then waste added. Post count and post concrete are then added to the main panel order.</div>`;

    if (intelligence) {
      intelligence.render({
        formula: "linear",
        materialCost: estimatedCost,
        quantity: panels,
        quantitySuffix: "panels",
        quantityDecimals: 0,
        scopeValue: length,
        driverText: "Panel width, end details, gate openings, post concrete, and awkward boundary lines usually move fence costs most.",
        confidenceText: "Fairly strong confidence on a straight run. Use the higher estimate if there are level changes, awkward corners, or uncertain gate and end-post details.",
        comparisonProfiles: [
          { label: "Budget boundary", note: "Simple panel-and-post route with leaner extras.", material: 0.88, labour: 0.9, extras: 0.92, fees: 0.9 },
          { label: "Standard fence build", note: "Typical domestic fence replacement allowance.", material: 1, labour: 1, extras: 1, fees: 1 },
          { label: "Upgraded fence build", note: "Stronger materials, extra concrete, and cleaner finish.", material: 1.22, labour: 1.12, extras: 1.15, fees: 1.04 }
        ],
        costModel: { labour: 0.44, extras: 0.14, fees: 0.03 },
        realityItems: [
          "Old fence removal, skip hire, and spoil handling often need a separate budget line.",
          "Gate openings, corners, and changes in level can materially change both labour and materials.",
          "Postcrete, gravel boards, fixings, and preservative treatment are easy to undercount.",
          "Access through the property can affect labour more than the straight run length suggests."
        ],
        timelineSteps: fenceTimeline(length),
        money: money,
        formatQuantity: function (value) {
          return `${Math.max(1, Math.round(value))}`;
        }
      });
    }
  }

  unitButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      unit = button.dataset.unit || "metric";
      setActive(unitButtons, "unit", unit);
      calculate();
    });
  });

  currencyButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      currency = button.dataset.currency || "GBP";
      setActive(currencyButtons, "currency", currency);
      calculate();
    });
  });

  form.addEventListener("submit", calculate);
  form.querySelectorAll("input").forEach(function (input) {
    input.addEventListener("input", calculate);
  });

  renderDefaultState();
})();
