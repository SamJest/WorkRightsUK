(function () {
  const form = document.getElementById("decking-form");
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

  function boardWidthToMetres(value) {
    return unit === "metric" ? value / 1000 : value * 0.0254;
  }

  function spacingToMetres(value) {
    return unit === "metric" ? value / 1000 : value * 0.0254;
  }

  function deckingTimeline(area) {
    if (area < 15) {
      return [
        { stage: "Set out and prep", duration: "Half day" },
        { stage: "Fix boards and joists", duration: "1 day" },
        { stage: "Trim and finish", duration: "Half day" }
      ];
    }
    if (area < 35) {
      return [
        { stage: "Set out and prep", duration: "Half day to 1 day" },
        { stage: "Fix boards and joists", duration: "1 to 2 days" },
        { stage: "Trim and finish", duration: "Half day to 1 day" }
      ];
    }
    return [
      { stage: "Set out and prep", duration: "1 day" },
      { stage: "Fix boards and joists", duration: "2 to 3 days" },
      { stage: "Trim and finish", duration: "1 day" }
    ];
  }

  function renderDefaultState() {
    resultMain.textContent = "Enter your measurements";
    resultSub.textContent = "You will see deck area, boards, joists and rough material cost here.";
    resultBreakdown.innerHTML = "";
    if (intelligence) intelligence.clear();
  }

  function calculate(event) {
    if (event) event.preventDefault();

    const length = toMetricLength(getNumber("length"));
    const width = toMetricLength(getNumber("width"));
    const boardWidth = boardWidthToMetres(getNumber("board-width"));
    const boardLength = toMetricLength(getNumber("board-length"));
    const joistSpacing = spacingToMetres(getNumber("joist-spacing"));
    const waste = Math.max(getNumber("waste"), 0) / 100;
    const pricePerBoard = Math.max(getNumber("price-per-board"), 0);
    const pricePerJoist = Math.max(getNumber("price-per-joist"), 0);

    const area = length * width;
    const boardCoverage = boardWidth * boardLength;
    const boards = boardCoverage > 0 ? Math.ceil((area / boardCoverage) * (1 + waste)) : 0;
    const joists = joistSpacing > 0 ? Math.ceil(width / joistSpacing) + 1 : 0;
    const estimatedCost = boards * pricePerBoard + joists * pricePerJoist;

    if (!(boards > 0)) {
      renderDefaultState();
      return;
    }

    resultMain.textContent = `${boards} decking boards`;
    resultSub.textContent = `You will likely need about ${joists} joists as well, with a rough material cost of ${money(estimatedCost)}.`;
    resultBreakdown.innerHTML =
      `<div class="break-row"><span>Deck area</span><strong>${area.toFixed(2)} m2</strong></div>` +
      `<div class="break-row"><span>Single board coverage</span><strong>${boardCoverage.toFixed(3)} m2</strong></div>` +
      `<div class="break-row"><span>Boards needed</span><strong>${boards}</strong></div>` +
      `<div class="break-row"><span>Estimated joists</span><strong>${joists}</strong></div>` +
      `<div class="break-row"><span>Price per board</span><strong>${money(pricePerBoard)}</strong></div>` +
      `<div class="break-row"><span>Price per joist</span><strong>${money(pricePerJoist)}</strong></div>` +
      `<div class="break-row"><span>Estimated material cost</span><strong>${money(estimatedCost)}</strong></div>` +
      `<div class="calc-note">Calculation: deck area divided by board coverage, then waste added. Joists are estimated from deck width and joist spacing.</div>`;

    if (intelligence) {
      intelligence.render({
        formula: "coverage",
        materialCost: estimatedCost,
        quantity: boards,
        quantitySuffix: "boards",
        quantityDecimals: 0,
        scopeValue: area,
        driverText: "Board width, joist spacing, waste from edge cuts, and whether the framing detail is finalised usually move the decking total most.",
        confidenceText: "Medium confidence. Picture framing, stairs, awkward edges, and upgraded subframes usually push the final build toward the high estimate.",
        comparisonProfiles: [
          { label: "Budget timber deck", note: "Basic board spec with a simpler finish allowance.", material: 0.9, labour: 0.92, extras: 0.92, fees: 0.9 },
          { label: "Standard deck build", note: "Typical domestic deck framing and finish.", material: 1, labour: 1, extras: 1, fees: 1 },
          { label: "Higher-spec deck", note: "Stronger finish, more detailing, and a safer allowance.", material: 1.24, labour: 1.14, extras: 1.14, fees: 1.06 }
        ],
        costModel: { labour: 0.58, extras: 0.16, fees: 0.03 },
        realityItems: [
          "Fixings, posts, footings, fascia boards, and weed control often sit outside the first timber count.",
          "Ground prep and levelling can materially change time and cost before the deck starts.",
          "Edge details, stairs, and picture framing usually increase board waste.",
          "Protective finish coats, end-grain treatment, and delivery charges are easy to miss."
        ],
        timelineSteps: deckingTimeline(area),
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
