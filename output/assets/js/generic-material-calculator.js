(function () {
  const config = window.__calculatorConfig || { formula: "coverage", name: "Material" };
  const form = document.querySelector(".generic-calculator-form");
  if (!form) return;

  const currencyMap = {
    GBP: { symbol: "\u00A3", code: "GBP" },
    USD: { symbol: "$", code: "USD" },
    EUR: { symbol: "\u20AC", code: "EUR" }
  };

  let currency = "GBP";
  let unit = "metric";

  const currencyButtons = Array.from(document.querySelectorAll(".currency-pill"));
  const unitButtons = Array.from(document.querySelectorAll(".unit-toggle"));
  const resultMain = document.querySelector(".result-main");
  const resultSub = document.querySelector(".result-sub");
  const resultBreakdown = document.getElementById("result-breakdown");
  const intelligence = window.BuildCostLabCostIntel;

  function unitLabel(count) {
    return count === 1 ? (config.unitNameSingular || "unit") : (config.unitNamePlural || "units");
  }

  function money(value) {
    const info = currencyMap[currency] || currencyMap.GBP;
    return `${info.symbol}${Number(value).toFixed(2)} ${info.code}`;
  }

  function getNumber(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    const value = parseFloat(el.value);
    return Number.isFinite(value) ? value : 0;
  }

  function toMetricLength(value) {
    return unit === "metric" ? value : value * 0.3048;
  }

  function setActive(buttons, matcher) {
    buttons.forEach(function (button) {
      button.classList.toggle("is-active", matcher(button));
    });
  }

  function renderDefaultState() {
    resultMain.textContent = "Enter your measurements";
    resultSub.textContent = config.resultIntro || "You will see the buying quantity, rough material cost, and wider estimate view here.";
    resultBreakdown.innerHTML = "";
    if (intelligence) intelligence.clear();
  }

  function renderIntelligence(payload) {
    if (!intelligence) return;
    intelligence.render({
      formula: config.formula,
      materialCost: payload.materialCost,
      quantity: payload.quantity,
      quantitySuffix: payload.quantitySuffix,
      quantityDecimals: payload.quantityDecimals,
      scopeValue: payload.scopeValue,
      driverText: config.driverText || payload.driverText,
      confidenceText: config.confidenceText || payload.confidenceText,
      comparisonProfiles: config.comparisonProfiles && config.comparisonProfiles.length ? config.comparisonProfiles : payload.comparisonProfiles,
      realityItems: config.realityItems && config.realityItems.length ? config.realityItems : payload.realityItems,
      costModel: config.costModel || payload.costModel,
      timelineSteps: config.timelineSteps && config.timelineSteps.length ? config.timelineSteps : payload.timelineSteps,
      money: money,
      formatQuantity: payload.formatQuantity
    });
  }

  function calculate() {
    const wasteFactor = 1 + (getNumber("waste") / 100);
    const pricePerUnit = getNumber("price-per-unit");
    let units = 0;

    if (config.formula === "coverage") {
      const area = toMetricLength(getNumber("length")) * toMetricLength(getNumber("width"));
      const coveredArea = area * wasteFactor;
      const coverageRate = getNumber("coverage-per-unit");
      const coverageMode = config.coverageMode || "area_per_unit";
      units = coverageRate > 0
        ? (
            coverageMode === "units_per_area"
              ? Math.ceil(coveredArea * coverageRate)
              : Math.ceil(coveredArea / coverageRate)
          )
        : 0;

      if (!(units > 0)) {
        renderDefaultState();
        return;
      }

      resultMain.textContent = `${units} ${unitLabel(units)}`;
      resultSub.textContent = coverageMode === "units_per_area"
        ? `That is based on about ${coveredArea.toFixed(2)} m2 after waste and roughly ${money(units * pricePerUnit)} in material cost.`
        : `That covers about ${coveredArea.toFixed(2)} m2 after waste and roughly ${money(units * pricePerUnit)} in material cost.`;
      resultBreakdown.innerHTML =
        `<div class="break-row"><span>Covered area incl. waste</span><strong>${coveredArea.toFixed(2)} m2</strong></div>` +
        `<div class="break-row"><span>${config.coverageLabel || "Coverage per unit"}</span><strong>${coverageRate.toFixed(2)}${coverageMode === "units_per_area" ? "" : " m2"}</strong></div>` +
        `<div class="break-row"><span>Buying total</span><strong>${units} ${unitLabel(units)}</strong></div>` +
        `<div class="break-row"><span>Estimated cost</span><strong>${money(units * pricePerUnit)}</strong></div>` +
        `<div class="calc-note">${coverageMode === "units_per_area" ? "Calculation: area plus waste, then multiplied by the unit rate and rounded to whole buying units." : "Calculation: area plus waste, then rounded to whole buying units by coverage."}</div>`;

      renderIntelligence({
        materialCost: units * pricePerUnit,
        quantity: units,
        quantitySuffix: unitLabel(units),
        quantityDecimals: 0,
        scopeValue: coveredArea,
        driverText: coverageMode === "units_per_area"
          ? "Unit rate per square metre, waste allowance, openings, and supplier pack breaks are the main levers on this estimate."
          : "Coverage rate, waste allowance, and whole-pack rounding usually change this estimate most.",
        formatQuantity: function (value) {
          return `${Math.max(1, Math.round(value))}`;
        }
      });
      return;
    }

    if (config.formula === "volume") {
      const volume = toMetricLength(getNumber("length")) * toMetricLength(getNumber("width")) * toMetricLength(getNumber("depth"));
      const density = getNumber("density");
      const unitSize = getNumber("unit-size");
      const totalVolume = volume * wasteFactor;
      const tonnes = totalVolume * density;
      units = unitSize > 0 ? Math.ceil(tonnes / unitSize) : 0;

      if (!(units > 0)) {
        renderDefaultState();
        return;
      }

      resultMain.textContent = `${units} ${unitLabel(units)}`;
      resultSub.textContent = `That works out to about ${totalVolume.toFixed(3)} m3, roughly ${tonnes.toFixed(2)} tonnes, and about ${money(units * pricePerUnit)} in material cost.`;
      resultBreakdown.innerHTML =
        `<div class="break-row"><span>Volume incl. waste</span><strong>${totalVolume.toFixed(3)} m3</strong></div>` +
        `<div class="break-row"><span>Tonnage</span><strong>${tonnes.toFixed(2)} t</strong></div>` +
        `<div class="break-row"><span>Buying total</span><strong>${units} ${unitLabel(units)}</strong></div>` +
        `<div class="break-row"><span>Estimated cost</span><strong>${money(units * pricePerUnit)}</strong></div>` +
        `<div class="calc-note">Calculation: length x width x depth, then waste, then density, then rounded to whole units.</div>`;

      renderIntelligence({
        materialCost: units * pricePerUnit,
        quantity: tonnes,
        quantitySuffix: "tonnes",
        quantityDecimals: 2,
        scopeValue: totalVolume,
        driverText: "Installed depth, loose-vs-compacted assumptions, density, and delivery format are the biggest cost drivers here.",
        formatQuantity: function (value) {
          return Number(value).toFixed(2);
        }
      });
      return;
    }

    const run = toMetricLength(getNumber("length")) * wasteFactor;
    const pieceLength = toMetricLength(getNumber("piece-length"));
    units = pieceLength > 0 ? Math.ceil(run / pieceLength) : 0;

    if (!(units > 0)) {
      renderDefaultState();
      return;
    }

    resultMain.textContent = `${units} ${unitLabel(units)}`;
    resultSub.textContent = `That covers about ${run.toFixed(2)} linear metres after waste and roughly ${money(units * pricePerUnit)} in material cost.`;
    resultBreakdown.innerHTML =
      `<div class="break-row"><span>Run incl. waste</span><strong>${run.toFixed(2)} m</strong></div>` +
      `<div class="break-row"><span>Unit length</span><strong>${pieceLength.toFixed(2)} m</strong></div>` +
      `<div class="break-row"><span>Buying total</span><strong>${units} ${unitLabel(units)}</strong></div>` +
      `<div class="break-row"><span>Estimated cost</span><strong>${money(units * pricePerUnit)}</strong></div>` +
      `<div class="calc-note">Calculation: total run plus waste, then rounded to whole-length buying pieces.</div>`;

    renderIntelligence({
      materialCost: units * pricePerUnit,
      quantity: units,
      quantitySuffix: unitLabel(units),
      quantityDecimals: 0,
      scopeValue: run,
      driverText: "Run length, stock size, waste from cuts, and accessory pieces usually change this estimate most.",
      formatQuantity: function (value) {
        return `${Math.max(1, Math.round(value))}`;
      }
    });
  }

  currencyButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      currency = button.dataset.currency;
      setActive(currencyButtons, function (item) {
        return item.dataset.currency === currency;
      });
      if (resultBreakdown.innerHTML.trim()) calculate();
    });
  });

  unitButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      unit = button.dataset.unit;
      setActive(unitButtons, function (item) {
        return item.dataset.unit === unit;
      });
      if (resultBreakdown.innerHTML.trim()) calculate();
    });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    calculate();
  });
})();
