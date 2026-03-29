(function () {
  const form = document.getElementById("paving-form");
  if (!form) return;

  const modeButtons = Array.from(document.querySelectorAll(".mode-toggle"));
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

  let mode = "slabs";
  let unit = "metric";
  let currency = "GBP";

  const presets = {
    slabs: { length: 600, width: 600, price: 8.5, waste: 10 },
    pavers: { length: 200, width: 100, price: 1.2, waste: 8 }
  };

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

  function unitDimensionToMetres(value) {
    return unit === "metric" ? value / 1000 : value * 0.0254;
  }

  function pavingTimeline(area) {
    if (area < 12) {
      return [
        { stage: "Set out and prep", duration: "Half day" },
        { stage: "Lay units", duration: "1 day" },
        { stage: "Joint and finish", duration: "Half day" }
      ];
    }
    if (area < 30) {
      return [
        { stage: "Set out and prep", duration: "Half day to 1 day" },
        { stage: "Lay units", duration: "1 to 2 days" },
        { stage: "Joint and finish", duration: "Half day to 1 day" }
      ];
    }
    return [
      { stage: "Set out and prep", duration: "1 day" },
      { stage: "Lay units", duration: "2 to 4 days" },
      { stage: "Joint and finish", duration: "1 day" }
    ];
  }

  function applyPreset() {
    const preset = presets[mode];
    document.getElementById("slab-length").value = preset.length;
    document.getElementById("slab-width").value = preset.width;
    document.getElementById("price-per-unit").value = preset.price;
    document.getElementById("waste").value = preset.waste;
  }

  function unitLabel(count) {
    return `${count} ${mode === "pavers" ? "pavers" : "paving slabs"}`;
  }

  function renderDefaultState() {
    resultMain.textContent = "Enter your measurements";
    resultSub.textContent = "You will see the paving count, rough material cost, and wider estimate view here.";
    resultBreakdown.innerHTML = "";
    if (intelligence) intelligence.clear();
  }

  function calculate(event) {
    if (event) event.preventDefault();

    const length = toMetricLength(getNumber("length"));
    const width = toMetricLength(getNumber("width"));
    const unitLength = unitDimensionToMetres(getNumber("slab-length"));
    const unitWidth = unitDimensionToMetres(getNumber("slab-width"));
    const waste = Math.max(getNumber("waste"), 0) / 100;
    const pricePerUnit = Math.max(getNumber("price-per-unit"), 0);

    const area = length * width;
    const singleUnitArea = unitLength * unitWidth;
    const unitCount = singleUnitArea > 0 ? Math.ceil((area / singleUnitArea) * (1 + waste)) : 0;
    const estimatedCost = unitCount * pricePerUnit;

    if (!(unitCount > 0)) {
      renderDefaultState();
      return;
    }

    resultMain.textContent = unitLabel(unitCount);
    resultSub.textContent = `That covers about ${area.toFixed(2)} m2 and roughly ${money(estimatedCost)} in ${mode === "pavers" ? "paver" : "paving slab"} cost before bedding and jointing are added.`;
    resultBreakdown.innerHTML =
      `<div class="break-row"><span>Paved area</span><strong>${area.toFixed(2)} m2</strong></div>` +
      `<div class="break-row"><span>Single unit area</span><strong>${singleUnitArea.toFixed(3)} m2</strong></div>` +
      `<div class="break-row"><span>Units needed</span><strong>${unitCount}</strong></div>` +
      `<div class="break-row"><span>Price per unit</span><strong>${money(pricePerUnit)}</strong></div>` +
      `<div class="break-row"><span>Estimated material cost</span><strong>${money(estimatedCost)}</strong></div>` +
      `<div class="calc-note">Calculation: paved area divided by single-unit coverage, then waste added and rounded to whole units.</div>`;

    if (intelligence) {
      intelligence.render({
        formula: "coverage",
        materialCost: estimatedCost,
        quantity: unitCount,
        quantitySuffix: "units",
        quantityDecimals: 0,
        scopeValue: area,
        driverText: "Unit size, cut-heavy edges, joint width, and whether the patio includes several layers usually change the real paving cost most.",
        confidenceText: "Medium confidence. Use the higher estimate when the layout has lots of cuts, mixed sizes, awkward features, or uncertain bedding and jointing quantities.",
        comparisonProfiles: [
          { label: "Budget patio route", note: "Simple slab choice with leaner finishing allowances.", material: 0.88, labour: 0.92, extras: 0.9, fees: 0.92 },
          { label: "Standard patio route", note: "Typical domestic paving build.", material: 1, labour: 1, extras: 1, fees: 1 },
          { label: "Premium patio route", note: "Higher-spec paving, detailing, and stronger allowances.", material: 1.26, labour: 1.15, extras: 1.18, fees: 1.06 }
        ],
        costModel: { labour: 0.54, extras: 0.2, fees: 0.03 },
        realityItems: [
          "Bedding sand, jointing compound, base layers, and edge restraints often cost more than people expect.",
          "Cut-heavy layouts and awkward borders usually add both waste and labour time.",
          "Removal of old paving, skip hire, and spoil handling often need their own budget line.",
          "Drainage falls, access issues, and extra finishing materials can push the total upward."
        ],
        timelineSteps: pavingTimeline(area),
        money: money,
        formatQuantity: function (value) {
          return `${Math.max(1, Math.round(value))}`;
        }
      });
    }
  }

  modeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      mode = button.dataset.mode || "slabs";
      setActive(modeButtons, "mode", mode);
      applyPreset();
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

  applyPreset();
  renderDefaultState();
})();
