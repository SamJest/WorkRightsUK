(function () {
  function byId(id) {
    return document.getElementById(id);
  }

  function formatPlainNumber(value, decimals) {
    return Number(value).toFixed(typeof decimals === "number" ? decimals : 2);
  }

  function defaultMoney(value) {
    return "GBP " + Number(value).toFixed(2);
  }

  function formulaDefaults(formula) {
    if (formula === "volume") {
      return {
        lowFactor: 0.94,
        highFactor: 1.18,
        drivers: "Depth, density, overbreak, delivery format, and waste allowance usually change volume-based estimates the most.",
        confidence: "Medium confidence. Use the higher estimate if the excavation is irregular, access is awkward, or the delivery route is still uncertain.",
        costModel: { labour: 0.38, extras: 0.18, fees: 0.06 },
        reality: [
          "Delivery minimums or short-load charges can move the final bill.",
          "Waste removal, spoil, and cleanup often sit outside the first material number.",
          "Pump hire, barrowing time, or site access can add meaningful labour cost.",
          "Curing, weather delays, and finishing materials may need their own allowance."
        ]
      };
    }

    if (formula === "linear") {
      return {
        lowFactor: 0.96,
        highFactor: 1.12,
        drivers: "Stock length, cutting waste, corners, fittings, and awkward end details usually change linear estimates the most.",
        confidence: "Fairly strong confidence on straight runs. Use the higher estimate when corners, joins, or accessory pieces are still uncertain.",
        costModel: { labour: 0.34, extras: 0.12, fees: 0.03 },
        reality: [
          "Corners, trims, brackets, and fixings often need their own budget line.",
          "An extra stock length is often cheaper than running short on site.",
          "Delivery charges can outweigh small savings on a bare unit rate.",
          "Finishing materials, sealants, and touch-up items are easy to forget."
        ]
      };
    }

    return {
      lowFactor: 0.92,
      highFactor: 1.14,
      drivers: "Coverage rates, waste allowance, pack rounding, and product choice usually move area-based estimates the most.",
      confidence: "Medium confidence. Use the higher estimate where there are awkward cuts, textured surfaces, extra coats, or uncertain product coverage.",
      costModel: { labour: 0.46, extras: 0.14, fees: 0.04 },
      reality: [
        "Prep work, primers, trims, or adhesives often add to the material-only figure.",
        "Waste disposal and cleanup can sit outside the first shopping list.",
        "Access equipment, deliveries, and return visits are easy to undercount.",
        "A contingency is sensible when the finish level or exact product is not fixed yet."
      ]
    };
  }

  function defaultComparisons() {
    return [
      {
        label: "Budget route",
        note: "Lower-spec materials, simpler finish, tighter labour allowance.",
        material: 0.9,
        labour: 0.88,
        extras: 0.92,
        fees: 0.85
      },
      {
        label: "Standard route",
        note: "Typical buying plan with balanced allowances.",
        material: 1,
        labour: 1,
        extras: 1,
        fees: 1
      },
      {
        label: "Higher-spec route",
        note: "Better finish, extra caution, and more generous allowances.",
        material: 1.18,
        labour: 1.12,
        extras: 1.15,
        fees: 1.08
      }
    ];
  }

  function buildRange(data, defaults) {
    const quantity = Number(data.quantity || 0);
    const materialCost = Number(data.materialCost || 0);
    return [
      { label: "Low", factor: defaults.lowFactor },
      { label: "Mid", factor: 1 },
      { label: "High", factor: defaults.highFactor }
    ].map(function (entry) {
      return {
        label: entry.label,
        quantity: quantity * entry.factor,
        materialCost: materialCost * entry.factor
      };
    });
  }

  function buildCostBreakdown(materialCost, defaults, overrideModel) {
    const model = overrideModel || defaults.costModel;
    const labour = materialCost * model.labour;
    const extras = materialCost * model.extras;
    const fees = materialCost * model.fees;
    return {
      materials: materialCost,
      labour: labour,
      extras: extras,
      fees: fees,
      total: materialCost + labour + extras + fees
    };
  }

  function timelineFor(formula, scopeValue) {
    const scope = Number(scopeValue || 0);

    if (formula === "volume") {
      if (scope < 1.5) {
        return [
          { stage: "Set out and prep", duration: "Half day to 1 day" },
          { stage: "Delivery and pour", duration: "Half day to 1 day" },
          { stage: "Finish and cure", duration: "1 to 3 days" }
        ];
      }
      if (scope < 6) {
        return [
          { stage: "Set out and prep", duration: "1 day" },
          { stage: "Delivery and place", duration: "1 day" },
          { stage: "Finish and cure", duration: "2 to 5 days" }
        ];
      }
      return [
        { stage: "Set out and prep", duration: "1 to 2 days" },
        { stage: "Delivery and place", duration: "1 to 2 days" },
        { stage: "Finish and cure", duration: "3 to 7 days" }
      ];
    }

    if (formula === "linear") {
      if (scope < 15) {
        return [
          { stage: "Measure and cut list", duration: "Half day" },
          { stage: "Install", duration: "Half day to 1 day" },
          { stage: "Finish and snag", duration: "Half day" }
        ];
      }
      if (scope < 40) {
        return [
          { stage: "Measure and cut list", duration: "Half day to 1 day" },
          { stage: "Install", duration: "1 day" },
          { stage: "Finish and snag", duration: "Half day to 1 day" }
        ];
      }
      return [
        { stage: "Measure and cut list", duration: "1 day" },
        { stage: "Install", duration: "1 to 2 days" },
        { stage: "Finish and snag", duration: "1 day" }
      ];
    }

    if (scope < 20) {
      return [
        { stage: "Prep and ordering", duration: "Half day" },
        { stage: "Install or apply", duration: "Half day to 1 day" },
        { stage: "Snag and finish", duration: "Half day" }
      ];
    }
    if (scope < 60) {
      return [
        { stage: "Prep and ordering", duration: "Half day to 1 day" },
        { stage: "Install or apply", duration: "1 to 2 days" },
        { stage: "Snag and finish", duration: "Half day to 1 day" }
      ];
    }
    return [
      { stage: "Prep and ordering", duration: "1 day" },
      { stage: "Install or apply", duration: "2 to 4 days" },
      { stage: "Snag and finish", duration: "1 day" }
    ];
  }

  function clear() {
    var range = byId("estimate-range");
    var drivers = byId("estimate-drivers");
    var confidence = byId("confidence-note");
    var costBreakdown = byId("cost-intelligence-breakdown");
    var comparison = byId("comparison-output");
    var timeline = byId("timeline-output");
    var reality = byId("reality-output");

    if (range) {
      range.innerHTML = '<div class="scenario-card"><strong>Waiting for inputs</strong><span>Complete the calculator to see a range.</span></div>';
    }
    if (drivers) {
      drivers.textContent = "The biggest cost drivers and uncertainty notes will appear here.";
    }
    if (confidence) {
      confidence.textContent = "Confidence guidance updates once the calculator has a live result.";
    }
    if (costBreakdown) {
      costBreakdown.innerHTML = '<div class="break-row"><span>Materials</span><strong>Waiting for inputs</strong></div>';
    }
    if (comparison) {
      comparison.innerHTML = '<div class="compare-card"><strong>Waiting for inputs</strong><span>Option comparisons appear after a calculation.</span></div>';
    }
    if (timeline) {
      timeline.innerHTML = '<div class="break-row"><span>Timeline</span><strong>Waiting for inputs</strong></div>';
    }
    if (reality) {
      reality.innerHTML = "<li>Complete the calculator to see the extra items that commonly catch budgets out.</li>";
    }
  }

  function render(data) {
    var rangeEl = byId("estimate-range");
    if (!rangeEl) {
      return;
    }

    var formula = data.formula || "coverage";
    var defaults = formulaDefaults(formula);
    var money = data.money || defaultMoney;
    var formatQuantity = data.formatQuantity || function (value) {
      return formatPlainNumber(value, typeof data.quantityDecimals === "number" ? data.quantityDecimals : 2);
    };
    var unitSuffix = data.quantitySuffix || "";
    var builtRange = buildRange(data, defaults);
    var breakdown = buildCostBreakdown(Number(data.materialCost || 0), defaults, data.costModel);
    var comparisons = data.comparisonProfiles || defaultComparisons();
    var timeline = data.timelineSteps || timelineFor(formula, data.scopeValue);
    var reality = data.realityItems || defaults.reality;

    rangeEl.innerHTML = builtRange.map(function (entry) {
      return (
        '<div class="scenario-card">' +
        "<strong>" + entry.label + " estimate</strong>" +
        "<span>" + formatQuantity(entry.quantity) + (unitSuffix ? " " + unitSuffix : "") + "</span>" +
        "<span>" + money(entry.materialCost) + " materials</span>" +
        "</div>"
      );
    }).join("");

    byId("estimate-drivers").textContent = data.driverText || defaults.drivers;
    byId("confidence-note").textContent = data.confidenceText || defaults.confidence;

    byId("cost-intelligence-breakdown").innerHTML =
      '<div class="break-row"><span>Materials</span><strong>' + money(breakdown.materials) + "</strong></div>" +
      '<div class="break-row"><span>Labour</span><strong>' + money(breakdown.labour) + "</strong></div>" +
      '<div class="break-row"><span>Hidden or extra costs</span><strong>' + money(breakdown.extras) + "</strong></div>" +
      '<div class="break-row"><span>Delivery and admin extras</span><strong>' + money(breakdown.fees) + "</strong></div>" +
      '<div class="break-row"><span>Broader planning total</span><strong>' + money(breakdown.total) + "</strong></div>";

    byId("comparison-output").innerHTML = comparisons.map(function (profile) {
      var total =
        breakdown.materials * profile.material +
        breakdown.labour * profile.labour +
        breakdown.extras * profile.extras +
        breakdown.fees * profile.fees;
      return (
        '<div class="compare-card">' +
        "<strong>" + profile.label + "</strong>" +
        "<span>" + money(total) + "</span>" +
        "<span>" + profile.note + "</span>" +
        "</div>"
      );
    }).join("");

    byId("timeline-output").innerHTML = timeline.map(function (entry) {
      return '<div class="break-row"><span>' + entry.stage + "</span><strong>" + entry.duration + "</strong></div>";
    }).join("");

    byId("reality-output").innerHTML = reality.map(function (item) {
      return "<li>" + item + "</li>";
    }).join("");
  }

  window.BuildCostLabCostIntel = {
    clear: clear,
    render: render
  };

  clear();
})();
