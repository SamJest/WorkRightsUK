(function () {
  const form = document.getElementById("paint-form");
  if (!form) return;

  const modeButtons = Array.from(document.querySelectorAll(".mode-toggle"));
  const unitButtons = Array.from(document.querySelectorAll(".unit-toggle"));
  const currencyButtons = Array.from(document.querySelectorAll(".currency-pill"));
  const resultMain = document.querySelector(".result-main");
  const resultSub = document.querySelector(".result-sub");
  const resultBreakdown = document.getElementById("result-breakdown");
  const intelligence = window.BuildCostLabCostIntel;

  const currencyMap = {
    GBP: { symbol: "\u00A3", rate: 1, code: "GBP" },
    USD: { symbol: "$", rate: 1.27, code: "USD" },
    EUR: { symbol: "\u20AC", rate: 1.17, code: "EUR" }
  };

  let mode = "walls";
  let unit = "metric";
  let currency = "GBP";

  function getNumber(id) {
    const field = document.getElementById(id);
    const value = field ? parseFloat(field.value) : 0;
    return Number.isFinite(value) ? value : 0;
  }

  function money(value) {
    const info = currencyMap[currency] || currencyMap.GBP;
    return `${info.symbol}${(value * info.rate).toFixed(2)} ${info.code}`;
  }

  function setActive(buttons, key, value) {
    buttons.forEach(function (button) {
      button.classList.toggle("is-active", button.dataset[key] === value);
    });
  }

  function toMetricLength(value) {
    return unit === "metric" ? value : value * 0.3048;
  }

  function currentArea(length, width, height) {
    if (mode === "ceiling") return length * width;
    if (mode === "single") return length * height;
    return 2 * (length + width) * height;
  }

  function modeLabel() {
    if (mode === "ceiling") return "ceiling area";
    if (mode === "single") return "single surface";
    return "wall area";
  }

  function paintTimeline(area) {
    if (area < 20) {
      return [
        { stage: "Prep and masking", duration: "Half day" },
        { stage: "Apply coats", duration: "Half day to 1 day" },
        { stage: "Drying and touch-ups", duration: "Half day" }
      ];
    }
    if (area < 60) {
      return [
        { stage: "Prep and masking", duration: "Half day to 1 day" },
        { stage: "Apply coats", duration: "1 to 2 days" },
        { stage: "Drying and touch-ups", duration: "Half day to 1 day" }
      ];
    }
    return [
      { stage: "Prep and masking", duration: "1 day" },
      { stage: "Apply coats", duration: "2 to 4 days" },
      { stage: "Drying and touch-ups", duration: "1 day" }
    ];
  }

  function renderDefaultState() {
    resultMain.textContent = "Enter your measurements";
    resultSub.textContent = "You will see the painted area, litres, tin suggestion and rough material cost here.";
    resultBreakdown.innerHTML = "";
    if (intelligence) intelligence.clear();
  }

  function calculate(event) {
    if (event) event.preventDefault();

    const length = toMetricLength(getNumber("length"));
    const width = toMetricLength(getNumber("width"));
    const height = toMetricLength(getNumber("height"));
    const coats = Math.max(getNumber("coats"), 1);
    const coverage = Math.max(getNumber("coverage"), 0.1);
    const waste = Math.max(getNumber("waste"), 0);
    const pricePerLitre = Math.max(getNumber("price-per-litre"), 0);

    const baseArea = currentArea(length, width, height);
    const adjustedArea = baseArea * coats * (1 + waste / 100);
    const litres = adjustedArea / coverage;
    const estimatedCost = litres * pricePerLitre;

    if (!(litres > 0)) {
      renderDefaultState();
      return;
    }

    const tenLitreTins = Math.floor(litres / 10);
    const remainderAfterTen = litres - tenLitreTins * 10;
    const fiveLitreTins = Math.floor(remainderAfterTen / 5);
    const topUpLitres = Math.max(remainderAfterTen - fiveLitreTins * 5, 0);

    resultMain.textContent = `${litres.toFixed(2)} litres of paint`;
    resultSub.textContent = `That covers about ${adjustedArea.toFixed(2)} m2 across ${coats} coat(s), with a rough material cost of ${money(estimatedCost)}.`;
    resultBreakdown.innerHTML =
      `<div class="break-row"><span>Estimated ${modeLabel()}</span><strong>${baseArea.toFixed(2)} m2</strong></div>` +
      `<div class="break-row"><span>Area incl. coats and waste</span><strong>${adjustedArea.toFixed(2)} m2</strong></div>` +
      `<div class="break-row"><span>Coverage per litre</span><strong>${coverage.toFixed(2)} m2/L</strong></div>` +
      `<div class="break-row"><span>Paint needed</span><strong>${litres.toFixed(2)} litres</strong></div>` +
      `<div class="break-row"><span>Price per litre</span><strong>${money(pricePerLitre)}</strong></div>` +
      `<div class="break-row"><span>Estimated material cost</span><strong>${money(estimatedCost)}</strong></div>` +
      `<div class="calc-note">Suggested buying mix: ${tenLitreTins ? `${tenLitreTins} x 10L` : "0 x 10L"}${fiveLitreTins ? `, ${fiveLitreTins} x 5L` : ""}${topUpLitres > 0.05 ? ", plus a small top-up tin" : ""}.</div>`;

    if (intelligence) {
      intelligence.render({
        formula: "coverage",
        materialCost: estimatedCost,
        quantity: litres,
        quantitySuffix: "litres",
        quantityDecimals: 2,
        scopeValue: adjustedArea,
        driverText: "Surface texture, coats, coverage rate, and how much cutting-in or patching the room needs usually move the paint total most.",
        confidenceText: "Medium confidence. Fresh plaster, strong colour changes, and rough or absorbent surfaces usually push the real order toward the high estimate.",
        comparisonProfiles: [
          { label: "Budget finish", note: "Basic trade paint with a tighter finish allowance.", material: 0.88, labour: 0.9, extras: 0.92, fees: 0.85 },
          { label: "Standard finish", note: "Typical domestic repaint allowance.", material: 1, labour: 1, extras: 1, fees: 1 },
          { label: "Premium finish", note: "Higher-spec paint, more prep, and extra touch-up margin.", material: 1.22, labour: 1.15, extras: 1.12, fees: 1.05 }
        ],
        costModel: { labour: 0.52, extras: 0.16, fees: 0.03 },
        realityItems: [
          "Primer, filler, caulk, and masking materials often sit outside the paint-only number.",
          "Moving furniture, protecting floors, and extra prep time can add labour quickly.",
          "Colour matching, touch-up tins, and awkward cut-ins usually increase the final buy.",
          "Access steps, high stairwells, or exterior exposure can push both time and cost upward."
        ],
        timelineSteps: paintTimeline(adjustedArea),
        money: money,
        formatQuantity: function (value) {
          return Number(value).toFixed(2);
        }
      });
    }
  }

  modeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      mode = button.dataset.mode || "walls";
      setActive(modeButtons, "mode", mode);
      calculate();
    });
  });

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

  calculate();
})();
