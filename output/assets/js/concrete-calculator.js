(function () {
  const form = document.getElementById("concrete-form");
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

  let mode = "slab";
  let unit = "metric";
  let currency = "GBP";

  const presets = {
    slab: { depthMetric: 0.1, depthImperial: 4, waste: 10, price: 140 },
    footing: { depthMetric: 0.3, depthImperial: 12, waste: 10, price: 145 },
    post: { depthMetric: 0.6, depthImperial: 24, waste: 12, price: 150 }
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
    document.getElementById("price-per-m3").value = preset.price;
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
    return unit === "metric" ? value : value * 0.0254;
  }

  function concreteTimeline(volume) {
    if (volume < 1.5) {
      return [
        { stage: "Set out and prep", duration: "Half day to 1 day" },
        { stage: "Pour and place", duration: "Half day to 1 day" },
        { stage: "Finish and cure", duration: "1 to 3 days" }
      ];
    }
    if (volume < 5) {
      return [
        { stage: "Set out and prep", duration: "1 day" },
        { stage: "Pour and place", duration: "1 day" },
        { stage: "Finish and cure", duration: "2 to 5 days" }
      ];
    }
    return [
      { stage: "Set out and prep", duration: "1 to 2 days" },
      { stage: "Pour and place", duration: "1 to 2 days" },
      { stage: "Finish and cure", duration: "3 to 7 days" }
    ];
  }

  function renderDefaultState() {
    resultMain.textContent = "Enter your measurements";
    resultSub.textContent = "You will see the concrete volume and rough material cost here.";
    resultBreakdown.innerHTML = "";
    if (intelligence) intelligence.clear();
  }

  function calculate(event) {
    if (event) event.preventDefault();

    const length = toMetricLength(getNumber("length"));
    const width = toMetricLength(getNumber("width"));
    const depth = toMetricDepth(getNumber("depth"));
    const count = Math.max(getNumber("count"), 1);
    const waste = Math.max(getNumber("waste"), 0) / 100;
    const pricePerM3 = Math.max(getNumber("price-per-m3"), 0);

    const baseVolume = mode === "post" ? length * width * depth * count : length * width * depth;
    const totalVolume = baseVolume * (1 + waste);
    const estimatedCost = totalVolume * pricePerM3;

    if (!(totalVolume > 0)) {
      renderDefaultState();
      return;
    }

    resultMain.textContent = `${totalVolume.toFixed(3)} m3 of concrete`;
    resultSub.textContent = `That is the estimated pour volume including waste, with a rough material cost of ${money(estimatedCost)}.`;
    resultBreakdown.innerHTML =
      `<div class="break-row"><span>Base volume</span><strong>${baseVolume.toFixed(3)} m3</strong></div>` +
      `<div class="break-row"><span>Volume incl. waste</span><strong>${totalVolume.toFixed(3)} m3</strong></div>` +
      `<div class="break-row"><span>Price per m3</span><strong>${money(pricePerM3)}</strong></div>` +
      `<div class="break-row"><span>Estimated material cost</span><strong>${money(estimatedCost)}</strong></div>` +
      `<div class="calc-note">Calculation: length x width x depth, then waste added. Post-hole mode also multiplies by the number of holes.</div>`;

    if (intelligence) {
      intelligence.render({
        formula: "volume",
        materialCost: estimatedCost,
        quantity: totalVolume,
        quantitySuffix: "m3",
        quantityDecimals: 3,
        scopeValue: totalVolume,
        driverText: "Depth, excavation irregularity, pour method, and whether the job is ready-mix or bagged are the biggest drivers here.",
        confidenceText: "Medium confidence. Use the higher estimate where overbreak, difficult access, or uncertain trench and hole sizes could push the real order upward.",
        comparisonProfiles: [
          { label: "Bagged DIY route", note: "Works on small pours with more handling time.", material: 1.12, labour: 1.2, extras: 1.05, fees: 0.9 },
          { label: "Standard ready-mix route", note: "Typical domestic supply assumption.", material: 1, labour: 1, extras: 1, fees: 1 },
          { label: "Pump or access-heavy route", note: "Higher access and placement costs on awkward sites.", material: 1.08, labour: 1.22, extras: 1.2, fees: 1.08 }
        ],
        costModel: { labour: 0.36, extras: 0.2, fees: 0.06 },
        realityItems: [
          "Pump hire, barrowing time, or awkward access can materially change the labour bill.",
          "Spoil removal, formwork, and reinforcement are often separate from the concrete-only figure.",
          "Minimum loads, delivery waiting time, and wasted part-loads can push the total upward.",
          "Finishing, curing protection, and return visits should be allowed for on visible work."
        ],
        timelineSteps: concreteTimeline(totalVolume),
        money: money,
        formatQuantity: function (value) {
          return Number(value).toFixed(3);
        }
      });
    }
  }

  modeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      mode = button.dataset.mode || "slab";
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
