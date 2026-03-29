(function () {
  const form = document.getElementById("gravel-form");
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

  let mode = "driveway";
  let unit = "metric";
  let currency = "GBP";

  const presets = {
    driveway: { depthMetric: 50, depthImperial: 2, waste: 10, density: 1.7, price: 65 },
    base: { depthMetric: 100, depthImperial: 4, waste: 12, density: 1.8, price: 55 },
    decorative: { depthMetric: 40, depthImperial: 1.5, waste: 8, density: 1.6, price: 75 }
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

  function applyPreset() {
    const preset = presets[mode];
    document.getElementById("depth").value = unit === "metric" ? preset.depthMetric : preset.depthImperial;
    document.getElementById("waste").value = preset.waste;
    document.getElementById("density").value = preset.density;
    document.getElementById("price-per-tonne").value = preset.price;
  }

  function getNumber(id) {
    const field = document.getElementById(id);
    const value = field ? parseFloat(field.value) : 0;
    return Number.isFinite(value) ? value : 0;
  }

  function toMetricLength(value) {
    return unit === "metric" ? value : value * 0.3048;
  }

  function toMetricDepth(value) {
    return unit === "metric" ? value / 1000 : value * 0.0254;
  }

  function labelForMode() {
    if (mode === "base") return "base layer";
    if (mode === "decorative") return "decorative gravel";
    return "driveway or path gravel";
  }

  function gravelTimeline(volume) {
    if (volume < 2) {
      return [
        { stage: "Set out and prep", duration: "Half day" },
        { stage: "Delivery and spread", duration: "Half day to 1 day" },
        { stage: "Final rake and tidy", duration: "Half day" }
      ];
    }
    if (volume < 8) {
      return [
        { stage: "Set out and prep", duration: "Half day to 1 day" },
        { stage: "Delivery and spread", duration: "1 day" },
        { stage: "Final rake and tidy", duration: "Half day to 1 day" }
      ];
    }
    return [
      { stage: "Set out and prep", duration: "1 day" },
      { stage: "Delivery and spread", duration: "1 to 2 days" },
      { stage: "Final rake and tidy", duration: "1 day" }
    ];
  }

  function renderDefaultState() {
    resultMain.textContent = "Enter your measurements";
    resultSub.textContent = "You will see the area, volume, tonnage, bulk bag estimate and rough cost here.";
    resultBreakdown.innerHTML = "";
    if (intelligence) intelligence.clear();
  }

  function calculate(event) {
    if (event) event.preventDefault();

    const length = toMetricLength(getNumber("length"));
    const width = toMetricLength(getNumber("width"));
    const depth = toMetricDepth(getNumber("depth"));
    const waste = Math.max(getNumber("waste"), 0) / 100;
    const density = Math.max(getNumber("density"), 0);
    const bagSize = Math.max(getNumber("bag-size"), 0.01);
    const pricePerTonne = Math.max(getNumber("price-per-tonne"), 0);

    const area = length * width;
    const volume = area * depth;
    const totalVolume = volume * (1 + waste);
    const tonnes = totalVolume * density;
    const bags = tonnes / bagSize;
    const estimatedCost = tonnes * pricePerTonne;

    if (!(tonnes > 0)) {
      renderDefaultState();
      return;
    }

    resultMain.textContent = `${tonnes.toFixed(2)} tonnes of ${labelForMode()}`;
    resultSub.textContent = `That is about ${bags.toFixed(1)} bulk bags and roughly ${money(estimatedCost)} in material cost.`;
    resultBreakdown.innerHTML =
      `<div class="break-row"><span>Area</span><strong>${area.toFixed(2)} m2</strong></div>` +
      `<div class="break-row"><span>Loose volume</span><strong>${volume.toFixed(3)} m3</strong></div>` +
      `<div class="break-row"><span>Volume incl. waste</span><strong>${totalVolume.toFixed(3)} m3</strong></div>` +
      `<div class="break-row"><span>Estimated weight</span><strong>${tonnes.toFixed(2)} tonnes</strong></div>` +
      `<div class="break-row"><span>Bulk bags</span><strong>${bags.toFixed(1)}</strong></div>` +
      `<div class="break-row"><span>Price per tonne</span><strong>${money(pricePerTonne)}</strong></div>` +
      `<div class="break-row"><span>Estimated material cost</span><strong>${money(estimatedCost)}</strong></div>` +
      `<div class="calc-note">Calculation: length x width x depth, then waste allowance and density applied.</div>`;

    if (intelligence) {
      intelligence.render({
        formula: "volume",
        materialCost: estimatedCost,
        quantity: tonnes,
        quantitySuffix: "tonnes",
        quantityDecimals: 2,
        scopeValue: totalVolume,
        driverText: "Installed depth, stone density, delivery route, and whether you buy by bulk bag or loose load usually move gravel costs most.",
        confidenceText: "Medium confidence. Use the higher estimate if the depth is uncertain, the surface is uneven, or you still need to decide between decorative and structural aggregate.",
        comparisonProfiles: [
          { label: "Bagged route", note: "Convenient for small jobs but usually dearer per tonne.", material: 1.16, labour: 1.05, extras: 1, fees: 0.95 },
          { label: "Standard bulk-bag route", note: "Typical domestic delivery assumption.", material: 1, labour: 1, extras: 1, fees: 1 },
          { label: "Loose-load route", note: "Stronger value on larger quantities but more site prep.", material: 0.92, labour: 1.08, extras: 1.1, fees: 1.02 }
        ],
        costModel: { labour: 0.24, extras: 0.16, fees: 0.03 },
        realityItems: [
          "Geotextile membrane, edging, and sub-base layers often sit outside the gravel-only number.",
          "Delivery access and barrowing time can materially change labour cost on awkward sites.",
          "Ground prep, spoil removal, and levelling are easy to undercount on first pass.",
          "Decorative gravel often needs a slightly more cautious waste allowance than flat structural fills."
        ],
        timelineSteps: gravelTimeline(totalVolume),
        money: money,
        formatQuantity: function (value) {
          return Number(value).toFixed(2);
        }
      });
    }
  }

  modeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      mode = button.dataset.mode || "driveway";
      setActive(modeButtons, "mode", mode);
      applyPreset();
      calculate();
    });
  });

  unitButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      unit = button.dataset.unit || "metric";
      setActive(unitButtons, "unit", unit);
      applyPreset();
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
