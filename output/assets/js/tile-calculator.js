(function () {
  const form = document.getElementById("tile-form");
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

  let mode = "floor";
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

  function tileDimensionToMetres(value) {
    return unit === "metric" ? value / 1000 : value * 0.0254;
  }

  function tileTimeline(area) {
    if (area < 10) {
      return [
        { stage: "Prep and setting out", duration: "Half day" },
        { stage: "Tile install", duration: "Half day to 1 day" },
        { stage: "Grout and finish", duration: "Half day" }
      ];
    }
    if (area < 30) {
      return [
        { stage: "Prep and setting out", duration: "Half day to 1 day" },
        { stage: "Tile install", duration: "1 to 2 days" },
        { stage: "Grout and finish", duration: "Half day to 1 day" }
      ];
    }
    return [
      { stage: "Prep and setting out", duration: "1 day" },
      { stage: "Tile install", duration: "2 to 4 days" },
      { stage: "Grout and finish", duration: "1 day" }
    ];
  }

  function applyPreset() {
    const preset = presets[mode];
    document.getElementById("waste").value = preset.waste;
    document.getElementById("tiles-per-box").value = preset.tilesPerBox;
    document.getElementById("price-per-box").value = preset.pricePerBox;
  }

  function tileLabel(count) {
    return `${count} ${mode === "wall" ? "wall tiles" : "floor tiles"} needed`;
  }

  function renderDefaultState() {
    resultMain.textContent = "Enter your measurements";
    resultSub.textContent = "You will see the tile count, box total, rough material cost, and wider estimate view here.";
    resultBreakdown.innerHTML = "";
    if (intelligence) intelligence.clear();
  }

  function calculate(event) {
    if (event) event.preventDefault();

    const length = toMetricLength(getNumber("length"));
    const width = toMetricLength(getNumber("width"));
    const tileLength = tileDimensionToMetres(getNumber("tile-length"));
    const tileWidth = tileDimensionToMetres(getNumber("tile-width"));
    const tilesPerBox = Math.max(getNumber("tiles-per-box"), 1);
    const waste = Math.max(getNumber("waste"), 0) / 100;
    const pricePerBox = Math.max(getNumber("price-per-box"), 0);

    const area = length * width;
    const tileArea = tileLength * tileWidth;
    const tileCount = tileArea > 0 ? Math.ceil((area / tileArea) * (1 + waste)) : 0;
    const boxes = Math.ceil(tileCount / tilesPerBox);
    const estimatedCost = boxes * pricePerBox;

    if (!(tileCount > 0)) {
      renderDefaultState();
      return;
    }

    resultMain.textContent = tileLabel(tileCount);
    resultSub.textContent = `That works out to about ${boxes} boxes and roughly ${money(estimatedCost)} in ${mode === "wall" ? "wall tile" : "floor tile"} cost.`;
    resultBreakdown.innerHTML =
      `<div class="break-row"><span>Tiled area</span><strong>${area.toFixed(2)} m2</strong></div>` +
      `<div class="break-row"><span>Tile face area</span><strong>${tileArea.toFixed(3)} m2</strong></div>` +
      `<div class="break-row"><span>Tiles needed</span><strong>${tileCount}</strong></div>` +
      `<div class="break-row"><span>Boxes needed</span><strong>${boxes}</strong></div>` +
      `<div class="break-row"><span>Price per box</span><strong>${money(pricePerBox)}</strong></div>` +
      `<div class="break-row"><span>Estimated material cost</span><strong>${money(estimatedCost)}</strong></div>` +
      `<div class="calc-note">Calculation: area divided by a single tile face area, then waste added and rounded to full boxes.</div>`;

    if (intelligence) {
      intelligence.render({
        formula: "coverage",
        materialCost: estimatedCost,
        quantity: boxes,
        quantitySuffix: "boxes",
        quantityDecimals: 0,
        scopeValue: area,
        driverText: "Tile size, layout cuts, breakage, and box rounding are the biggest drivers on most tile estimates.",
        confidenceText: "Medium confidence. Diagonal layouts, large-format tiles, and awkward cuts around corners or fittings usually push the result toward the high estimate.",
        comparisonProfiles: [
          { label: "Budget tile route", note: "Lower-spec tile and a simpler install standard.", material: 0.88, labour: 0.92, extras: 0.9, fees: 0.9 },
          { label: "Standard tile route", note: "Typical box count, adhesive, and labour allowance.", material: 1, labour: 1, extras: 1, fees: 1 },
          { label: "Premium tile route", note: "Higher-spec tile, more cuts, and a tighter finish.", material: 1.28, labour: 1.18, extras: 1.12, fees: 1.08 }
        ],
        costModel: { labour: 0.72, extras: 0.18, fees: 0.05 },
        realityItems: [
          "Adhesive, grout, trims, and levelling systems often cost more than people expect.",
          "Waste can climb quickly on diagonal layouts, niches, and cut-heavy rooms.",
          "Substrate prep, waterproofing, and removal of old finishes usually need a separate allowance.",
          "Matching boxes and spare tiles for future repairs are often worth budgeting for."
        ],
        timelineSteps: tileTimeline(area),
        money: money,
        formatQuantity: function (value) {
          return `${Math.max(1, Math.round(value))}`;
        }
      });
    }
  }

  modeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      mode = button.dataset.mode || "floor";
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
  const presets = {
    floor: { waste: 10, tilesPerBox: 8, pricePerBox: 24.99 },
    wall: { waste: 8, tilesPerBox: 10, pricePerBox: 21.99 }
  };
