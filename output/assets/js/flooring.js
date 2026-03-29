(function(){
  const modeButtons = document.querySelectorAll('[data-flooring-mode]');
  const modeInput = document.getElementById('flooring-mode');
  const unitSelect = document.getElementById('unit');
  const areaInput = document.getElementById('room-area');
  const plankWidthInput = document.getElementById('plank-width');
  const plankLengthInput = document.getElementById('plank-length');
  const coverageInput = document.getElementById('pack-coverage');
  const wasteInput = document.getElementById('waste');
  const resultMain = document.getElementById('result-main');
  const resultBreakdown = document.getElementById('result-breakdown');
  const resultSteps = document.getElementById('result-steps');
  const modeNote = document.getElementById('mode-note');

  const modeConfig = {
    laminate: { waste: 8, note: 'Laminate preset: lighter waste for straighter runs and cleaner board consistency.' },
    wood: { waste: 10, note: 'Wood preset: slightly higher waste for grade variation, board selection and trimming.' },
    vinyl: { waste: 6, note: 'Vinyl preset: lower waste on regular rooms, though patterned installs may still need more.' }
  };

  function areaToSqM(value, unit){
    return unit === 'imperial' ? value * 0.092903 : value;
  }

  function boardAreaToSqM(width, length, unit){
    if(unit === 'imperial'){
      return (width * length) / 144 * 0.092903;
    }
    return (width / 1000) * (length / 1000);
  }

  function setMode(next){
    modeInput.value = next;
    modeButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.flooringMode === next));
    wasteInput.value = modeConfig[next].waste;
    modeNote.textContent = modeConfig[next].note;
    calculate();
  }

  function calculate(){
    const mode = modeInput.value || 'laminate';
    const unit = unitSelect.value;
    const areaRaw = parseFloat(areaInput.value || '0');
    const width = Math.max(parseFloat(plankWidthInput.value || '0'), 0.1);
    const length = Math.max(parseFloat(plankLengthInput.value || '0'), 0.1);
    const packCoverage = Math.max(parseFloat(coverageInput.value || '0'), 0.01);
    const waste = Math.max(parseFloat(wasteInput.value || '0'), 0);

    const areaSqM = areaToSqM(areaRaw, unit);
    const adjustedSqM = areaSqM * (1 + waste / 100);
    const boardSqM = boardAreaToSqM(width, length, unit);
    const boardsNeeded = boardSqM > 0 ? Math.ceil(adjustedSqM / boardSqM) : 0;
    const packsNeeded = Math.ceil(adjustedSqM / packCoverage);

    resultMain.textContent = packsNeeded + ' pack(s)';
    resultBreakdown.textContent =
      'Estimated for ' + areaRaw + ' ' + (unit === 'imperial' ? 'sq ft' : 'm²') +
      ', ' + mode + ' flooring, ' + waste + '% waste and pack coverage of ' + packCoverage + ' m².';
    resultSteps.innerHTML =
      '<li>Base floor area converted to m²: <strong>' + areaSqM.toFixed(2) + ' m²</strong></li>' +
      '<li>After waste allowance: <strong>' + adjustedSqM.toFixed(2) + ' m²</strong></li>' +
      '<li>One board / plank covers: <strong>' + boardSqM.toFixed(4) + ' m²</strong></li>' +
      '<li>Estimated boards needed: <strong>' + boardsNeeded + '</strong></li>' +
      '<li>Packs needed (rounded up): <strong>' + packsNeeded + '</strong></li>';
  }

  modeButtons.forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.flooringMode)));
  [unitSelect, areaInput, plankWidthInput, plankLengthInput, coverageInput, wasteInput].forEach(el => el.addEventListener('input', calculate));
  setMode('laminate');
})();
