(function(){
  const modeButtons = document.querySelectorAll('[data-concrete-mode]');
  const modeInput = document.getElementById('concrete-mode');
  const unitSelect = document.getElementById('unit');
  const lengthInput = document.getElementById('length');
  const widthInput = document.getElementById('width');
  const depthInput = document.getElementById('depth');
  const countInput = document.getElementById('count');
  const countField = document.getElementById('count-field');
  const wasteInput = document.getElementById('waste');
  const widthNote = document.getElementById('width-note');
  const modeNote = document.getElementById('mode-note');
  const resultMain = document.getElementById('result-main');
  const resultBreakdown = document.getElementById('result-breakdown');
  const resultSteps = document.getElementById('result-steps');

  const config = {
    slab: {
      widthLabel: 'For slabs, use the full slab width. For footings, use the trench width. For post holes, use the hole diameter.',
      note: 'Slab preset: a modest waste allowance for over-ordering, spillage and uneven sub-base conditions.',
      waste: 10,
      showCount: false,
      defaults: { length: 5, width: 3, depth: 0.1 }
    },
    footing: {
      widthLabel: 'For footings, use the trench width across the concrete section you are filling.',
      note: 'Footing preset: slightly higher waste because trenches can vary in depth and shape along the run.',
      waste: 12,
      showCount: false,
      defaults: { length: 12, width: 0.45, depth: 0.25 }
    },
    post: {
      widthLabel: 'For post holes, enter the hole diameter rather than the width of the structure itself.',
      note: 'Post hole preset: higher waste to cover irregular excavation, bell-shaped bases and small overfills.',
      waste: 15,
      showCount: true,
      defaults: { length: 0.3, width: 0.3, depth: 0.6, count: 8 }
    }
  };

  function feetToMeters(v){ return v * 0.3048; }
  function cubicMetersToCubicYards(v){ return v * 1.30795; }

  function applyMode(mode){
    const cfg = config[mode];
    modeInput.value = mode;
    modeButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.concreteMode === mode));
    countField.style.display = cfg.showCount ? 'grid' : 'none';
    widthNote.textContent = cfg.widthLabel;
    modeNote.textContent = cfg.note;
    wasteInput.value = cfg.waste;
    lengthInput.value = cfg.defaults.length;
    widthInput.value = cfg.defaults.width;
    depthInput.value = cfg.defaults.depth;
    if(cfg.defaults.count){ countInput.value = cfg.defaults.count; }
    calculate();
  }

  function calculate(){
    const mode = modeInput.value || 'slab';
    const unit = unitSelect.value;
    const rawLength = parseFloat(lengthInput.value || '0');
    const rawWidth = parseFloat(widthInput.value || '0');
    const rawDepth = parseFloat(depthInput.value || '0');
    const count = Math.max(parseFloat(countInput.value || '1'), 1);
    const waste = Math.max(parseFloat(wasteInput.value || '0'), 0);

    const lengthM = unit === 'imperial' ? feetToMeters(rawLength) : rawLength;
    const widthM = unit === 'imperial' ? feetToMeters(rawWidth) : rawWidth;
    const depthM = unit === 'imperial' ? feetToMeters(rawDepth) : rawDepth;

    let cubicMeters = 0;
    if(mode === 'post'){
      const radius = widthM / 2;
      cubicMeters = Math.PI * radius * radius * depthM * count;
    } else {
      cubicMeters = lengthM * widthM * depthM;
    }
    const total = cubicMeters * (1 + waste / 100);
    const displayVolume = unit === 'imperial' ? cubicMetersToCubicYards(total) : total;
    const displayUnit = unit === 'imperial' ? 'yd³' : 'm³';

    resultMain.textContent = displayVolume.toFixed(2) + ' ' + displayUnit;
    resultBreakdown.textContent =
      (mode === 'post'
        ? count + ' post hole(s), '
        : rawLength + ' × ' + rawWidth + ' × ' + rawDepth + ' ' + (unit === 'imperial' ? 'ft' : 'm') + ', '
      ) + waste + '% waste included.';

    const modeLabel = mode === 'slab' ? 'slab' : (mode === 'footing' ? 'footing' : 'post holes');
    const rawBase = unit === 'imperial' ? cubicMetersToCubicYards(cubicMeters) : cubicMeters;

    resultSteps.innerHTML =
      '<li>Mode selected: <strong>' + modeLabel + '</strong></li>' +
      '<li>Base concrete volume: <strong>' + rawBase.toFixed(2) + ' ' + displayUnit + '</strong></li>' +
      '<li>Waste allowance added: <strong>' + waste + '%</strong></li>' +
      '<li>Total to order: <strong>' + displayVolume.toFixed(2) + ' ' + displayUnit + '</strong></li>';
  }

  modeButtons.forEach(btn => btn.addEventListener('click', () => applyMode(btn.dataset.concreteMode)));
  [unitSelect, lengthInput, widthInput, depthInput, countInput, wasteInput].forEach(el => el.addEventListener('input', calculate));
  applyMode('slab');
})();
