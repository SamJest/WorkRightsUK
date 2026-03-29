(function(){
  const modeButtons = document.querySelectorAll('[data-mode]');
  const modeInput = document.getElementById('mode');
  const unitSelect = document.getElementById('unit');
  const areaLabel = document.getElementById('area-label');
  const areaHint = document.getElementById('area-hint');
  const presetNote = document.getElementById('preset-note');
  const areaInput = document.getElementById('area');
  const coatsInput = document.getElementById('coats');
  const coverageInput = document.getElementById('coverage');
  const wasteInput = document.getElementById('waste');
  const resultMain = document.getElementById('result-main');
  const resultBreakdown = document.getElementById('result-breakdown');
  const resultSteps = document.getElementById('result-steps');

  const modeConfig = {
    walls: {
      label: 'Wall area',
      hintMetric: 'Enter the total wall area you plan to paint, after subtracting large openings if you want a tighter estimate.',
      hintImperial: 'Enter the total wall area in sq ft. Subtract large openings if you want a tighter estimate.',
      placeholderMetric: 'e.g. 42',
      placeholderImperial: 'e.g. 450',
      coverage: 10,
      waste: 10,
      note: 'Walls preset: standard emulsion coverage and a typical cut-in / roller waste allowance.'
    },
    ceiling: {
      label: 'Ceiling area',
      hintMetric: 'Enter the ceiling area only. Ceilings often waste slightly less paint than walls on simple rooms.',
      hintImperial: 'Enter the ceiling area in sq ft. Ceilings often waste slightly less paint than walls on simple rooms.',
      placeholderMetric: 'e.g. 15',
      placeholderImperial: 'e.g. 160',
      coverage: 11,
      waste: 8,
      note: 'Ceiling preset: slightly higher spread rate and a lower waste allowance for flatter, simpler surfaces.'
    },
    single: {
      label: 'Single-surface area',
      hintMetric: 'Use this for one surface such as a door, feature wall, panel or small section that you want to price separately.',
      hintImperial: 'Use this for one surface in sq ft such as a door, feature wall, panel or small section.',
      placeholderMetric: 'e.g. 8',
      placeholderImperial: 'e.g. 86',
      coverage: 9,
      waste: 12,
      note: 'Single-surface preset: slightly more cautious because small jobs usually have proportionally more edge work and leftover paint.'
    }
  };

  function convertAreaToSqM(value, unit){
    return unit === 'imperial' ? value * 0.092903 : value;
  }

  function updateModeUi(mode){
    const cfg = modeConfig[mode];
    const unit = unitSelect.value;
    areaLabel.textContent = cfg.label;
    areaHint.textContent = unit === 'imperial' ? cfg.hintImperial : cfg.hintMetric;
    areaInput.placeholder = unit === 'imperial' ? cfg.placeholderImperial : cfg.placeholderMetric;
    coverageInput.value = cfg.coverage;
    wasteInput.value = cfg.waste;
    presetNote.textContent = cfg.note;
  }

  function setMode(next){
    modeInput.value = next;
    modeButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.mode === next));
    updateModeUi(next);
    calculate();
  }

  function calculate(){
    const unit = unitSelect.value;
    const areaRaw = parseFloat(areaInput.value || '0');
    const coats = Math.max(parseFloat(coatsInput.value || '1'), 1);
    const coverage = Math.max(parseFloat(coverageInput.value || '10'), 0.1);
    const waste = Math.max(parseFloat(wasteInput.value || '0'), 0);
    const mode = modeInput.value || 'walls';

    const sqm = convertAreaToSqM(areaRaw, unit);
    const adjusted = sqm * coats * (1 + (waste / 100));
    const litres = adjusted / coverage;

    let tins = [];
    const sizes = [10, 5, 2.5, 1];
    let remaining = litres;
    sizes.forEach(size => {
      const count = Math.floor(remaining / size);
      if(count > 0){
        tins.push(count + ' × ' + size + 'L');
        remaining -= count * size;
      }
    });
    if(remaining > 0.01){
      tins.push('1 × 1L (top-up)');
    }

    const modeLabel = mode === 'walls' ? 'wall area' : (mode === 'ceiling' ? 'ceiling area' : 'single-surface area');

    resultMain.textContent = litres.toFixed(2) + ' litres';
    resultBreakdown.textContent =
      'Estimated for ' + areaRaw + ' ' + (unit === 'imperial' ? 'sq ft' : 'm²') +
      ' of ' + modeLabel + ', ' + coats + ' coat(s), ' + coverage + ' m²/L coverage, and ' + waste + '% waste.';
    resultSteps.innerHTML =
      '<li>Mode selected: <strong>' + mode.charAt(0).toUpperCase() + mode.slice(1).replace('-', ' ') + '</strong></li>' +
      '<li>Base area converted to m²: <strong>' + sqm.toFixed(2) + ' m²</strong></li>' +
      '<li>After coats and waste: <strong>' + adjusted.toFixed(2) + ' m² paintable area</strong></li>' +
      '<li>Paint needed: <strong>' + litres.toFixed(2) + ' litres</strong></li>' +
      '<li>Suggested tins: <strong>' + (tins.length ? tins.join(', ') : '1 × 1L') + '</strong></li>';
  }

  modeButtons.forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.mode)));
  unitSelect.addEventListener('input', () => {
    updateModeUi(modeInput.value || 'walls');
    calculate();
  });
  [areaInput, coatsInput, coverageInput, wasteInput].forEach(el => el.addEventListener('input', calculate));
  setMode('walls');
})();
