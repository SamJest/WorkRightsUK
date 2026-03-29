(function(){
  const unitSelect = document.getElementById('unit');
  const roomAreaInput = document.getElementById('room-area');
  const tileWidthInput = document.getElementById('tile-width');
  const tileHeightInput = document.getElementById('tile-height');
  const tilesPerBoxInput = document.getElementById('tiles-per-box');
  const wasteInput = document.getElementById('waste');
  const resultMain = document.getElementById('result-main');
  const resultBreakdown = document.getElementById('result-breakdown');
  const resultSteps = document.getElementById('result-steps');

  function getTileAreaSqM(unit, w, h){
    if(unit === 'metric'){
      return (w/1000) * (h/1000);
    }
    return (w*h) * 0.00064516;
  }

  function getRoomAreaSqM(unit, area){
    return unit === 'metric' ? area : area * 0.092903;
  }

  function calculate(){
    const unit = unitSelect.value;
    const roomAreaRaw = parseFloat(roomAreaInput.value || '0');
    const tileW = Math.max(parseFloat(tileWidthInput.value || '0'), 0.1);
    const tileH = Math.max(parseFloat(tileHeightInput.value || '0'), 0.1);
    const tilesPerBox = Math.max(parseFloat(tilesPerBoxInput.value || '1'), 1);
    const waste = Math.max(parseFloat(wasteInput.value || '0'), 0);

    const roomSqM = getRoomAreaSqM(unit, roomAreaRaw);
    const tileSqM = getTileAreaSqM(unit, tileW, tileH);
    const tileCountBase = tileSqM > 0 ? (roomSqM / tileSqM) : 0;
    const tileCountWithWaste = Math.ceil(tileCountBase * (1 + waste/100));
    const boxes = Math.ceil(tileCountWithWaste / tilesPerBox);

    resultMain.textContent = tileCountWithWaste + ' tiles / ' + boxes + ' boxes';
    resultBreakdown.textContent =
      'Estimated from ' + roomAreaRaw + ' ' + (unit === 'metric' ? 'm²' : 'sq ft') +
      ', tile size ' + tileW + ' × ' + tileH + ' ' + (unit === 'metric' ? 'mm' : 'in') +
      ', ' + waste + '% waste.';
    resultSteps.innerHTML =
      '<li>Room area converted to m²: <strong>' + roomSqM.toFixed(2) + ' m²</strong></li>' +
      '<li>Tile face area: <strong>' + tileSqM.toFixed(4) + ' m²</strong></li>' +
      '<li>Base tile count: <strong>' + Math.ceil(tileCountBase) + '</strong></li>' +
      '<li>Tiles with waste: <strong>' + tileCountWithWaste + '</strong></li>' +
      '<li>Boxes needed: <strong>' + boxes + '</strong></li>';
  }

  [unitSelect, roomAreaInput, tileWidthInput, tileHeightInput, tilesPerBoxInput, wasteInput].forEach(el => el.addEventListener('input', calculate));
  calculate();
})();
