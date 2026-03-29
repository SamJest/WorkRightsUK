(function () {
  const form = document.getElementById("flooring-form");
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

  let mode = "laminate";
  let unit = "metric";
  let currency = "GBP";

  const presets = {
    laminate: { waste: 8, packCoverage: 1.84, pricePerPack: 29.99 },
    wood: { waste: 10, packCoverage: 1.6, pricePerPack: 54.0 },
    vinyl: { waste: 6, packCoverage: 2.2, pricePerPack: 39.99 }
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

  function areaInSquareMetres(rawArea) {
    return unit === "metric" ? rawArea : rawArea * 0.092903;
  }

  function flooringTimeline(area) {
    if (area < 20) {
      return [
        { stage: "Prep and acclimatise", duration: "Half day" },
        { stage: "Lay boards or planks", duration: "Half day to 1 day" },
        { stage: "Trims and snagging", duration: "Half day" }
      ];
    }
    if (area < 50) {
      return [
        { stage: "Prep and acclimatise", duration: "Half day to 1 day" },
        { stage: "Lay boards or planks", duration: "1 to 2 days" },
        { stage: "Trims and snagging", duration: "Half day to 1 day" }
      ];
    }
    return [
      { stage: "Prep and acclimatise", duration: "1 day" },
      { stage: "Lay boards or planks", duration: "2 to 3 days" },
      { stage: "Trims and snagging", duration: "1 day" }
    ];
  }

  function applyPreset() {
    const preset = presets[mode];
    document.getElementById("waste").value = preset.waste;
    document.getElementById("pack-coverage").value = preset.packCoverage;
    document.getElementById("price-per-pack").value = preset.pricePerPack;
  }

  function modeLabel() {
    if (mode === "wood") return "wood flooring";
    if (mode === "vinyl") return "vinyl plank flooring";
    return "laminate flooring";
  }

  function renderDefaultState() {
    resultMain.textContent = "Enter your measurements";
    resultSub.textContent = "You will see the pack count, rough material cost, and wider estimate view here.";
    resultBreakdown.innerHTML = "";
    if (intelligence) intelligence.clear();
  }

  function calculate(event) {
    if (event) event.preventDefault();

    const area = areaInSquareMetres(getNumber("room-area"));
    const waste = Math.max(getNumber("waste"), 0) / 100;
    const packCoverage = Math.max(getNumber("pack-coverage"), 0.01);
    const pricePerPack = Math.max(getNumber("price-per-pack"), 0);

    const totalArea = area * (1 + waste);
    const packs = Math.ceil(totalArea / packCoverage);
    const estimatedCost = packs * pricePerPack;

    if (!(packs > 0)) {
      renderDefaultState();
      return;
    }

    resultMain.textContent = `${packs} packs of ${modeLabel()}`;
    resultSub.textContent = `That covers about ${totalArea.toFixed(2)} m2 including waste and roughly ${money(estimatedCost)} in ${modeLabel()} cost.`;
    resultBreakdown.innerHTML =
      `<div class="break-row"><span>Floor area</span><strong>${area.toFixed(2)} m2</strong></div>` +
      `<div class="break-row"><span>Area incl. waste</span><strong>${totalArea.toFixed(2)} m2</strong></div>` +
      `<div class="break-row"><span>Coverage per pack</span><strong>${packCoverage.toFixed(2)} m2</strong></div>` +
      `<div class="break-row"><span>Packs needed</span><strong>${packs}</strong></div>` +
      `<div class="break-row"><span>Price per pack</span><strong>${money(pricePerPack)}</strong></div>` +
      `<div class="break-row"><span>Estimated material cost</span><strong>${money(estimatedCost)}</strong></div>` +
      `<div class="calc-note">Calculation: room area plus waste allowance, then rounded up to full packs.</div>`;

    if (intelligence) {
      intelligence.render({
        formula: "coverage",
        materialCost: estimatedCost,
        quantity: packs,
        quantitySuffix: "packs",
        quantityDecimals: 0,
        scopeValue: totalArea,
        driverText: "Pack coverage, room shape, underlay choice, and trimming waste around edges usually move the flooring total most.",
        confidenceText: "Medium confidence. Awkward rooms, herringbone layouts, and the need to keep spare matching boards usually push the result toward the high estimate.",
        comparisonProfiles: [
          { label: "Budget finish", note: "Entry-level boards and a simpler fitting allowance.", material: 0.85, labour: 0.9, extras: 0.9, fees: 0.9 },
          { label: "Standard finish", note: "Typical domestic flooring spec.", material: 1, labour: 1, extras: 1, fees: 1 },
          { label: "Premium finish", note: "Higher-spec boards, extra prep, and more cautious spares.", material: 1.3, labour: 1.12, extras: 1.15, fees: 1.05 }
        ],
        costModel: { labour: 0.48, extras: 0.16, fees: 0.04 },
        realityItems: [
          "Underlay, trims, thresholds, and moisture layers are often missed from the first basket.",
          "Floor prep and levelling can cost more than the visible finish in poor rooms.",
          "Spare packs for matching repairs are often worth budgeting for up front.",
          "Furniture moving, skirting adjustments, and disposal of old flooring can add labour."
        ],
        timelineSteps: flooringTimeline(totalArea),
        money: money,
        formatQuantity: function (value) {
          return `${Math.max(1, Math.round(value))}`;
        }
      });
    }
  }

  modeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      mode = button.dataset.mode || "laminate";
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
