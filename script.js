const CROPS = [
    { id: 'tomato', name: 'Tomato', emoji: '🍅', family: 'Solanaceae', good: ['basil', 'marigold', 'carrot', 'onion'], bad: ['potato', 'cabbage', 'fennel'], days: '60-85 days' },
    { id: 'basil', name: 'Basil', emoji: '🌿', family: 'Lamiaceae', good: ['tomato', 'pepper'], bad: ['rue'], days: '50-60 days' },
    { id: 'carrot', name: 'Carrot', emoji: '🥕', family: 'Apiaceae', good: ['tomato', 'lettuce', 'rosemary', 'onion'], bad: ['dill', 'parsnip'], days: '70-80 days' },
    { id: 'onion', name: 'Onion', emoji: '🧅', family: 'Amaryllidaceae', good: ['carrot', 'tomato', 'lettuce', 'cabbage'], bad: ['beans', 'peas'], days: '90-100 days' },
    { id: 'cabbage', name: 'Cabbage', emoji: '🥬', family: 'Brassicaceae', good: ['onion', 'celery', 'thyme', 'sage'], bad: ['tomato', 'strawberry', 'pole-beans'], days: '60-85 days' },
    { id: 'lettuce', name: 'Lettuce', emoji: '🥗', family: 'Asteraceae', good: ['carrot', 'onion', 'radish'], bad: [], days: '45-55 days' },
    { id: 'pepper', name: 'Pepper', emoji: '🫑', family: 'Solanaceae', good: ['basil', 'onion', 'carrot'], bad: ['fennel', 'kohlrabi'], days: '60-90 days' },
    { id: 'potato', name: 'Potato', emoji: '🥔', family: 'Solanaceae', good: ['beans', 'horseradish', 'marigold'], bad: ['tomato', 'cucumber', 'pumpkin'], days: '70-120 days' },
    { id: 'marigold', name: 'Marigold', emoji: '🌼', family: 'Asteraceae', good: ['tomato', 'potato', 'cabbage', 'pepper'], bad: [], days: '45-50 days' },
    { id: 'radish', name: 'Radish', emoji: '🔴', family: 'Brassicaceae', good: ['lettuce', 'spinach', 'peas'], bad: ['hyssop'], days: '25-30 days' },
    { id: 'beans', name: 'Bush Beans', emoji: '🫘', family: 'Fabaceae', good: ['potato', 'carrot', 'cucumber'], bad: ['onion', 'garlic'], days: '50-60 days' },
    { id: 'cucumber', name: 'Cucumber', emoji: '🥒', family: 'Cucurbitaceae', good: ['beans', 'radish', 'dill'], bad: ['potato', 'sage'], days: '50-70 days' }
];

let gridRows = 6;
let gridCols = 8;
let gridData = {}; // key: "row-col", value: cropId
let selectedCropForPlacement = null; // for click-to-place fallback

// DOM Elements
const gridEl = document.getElementById('garden-grid');
const cropListEl = document.getElementById('crop-list');
const searchCropsEl = document.getElementById('search-crops');
const rowsInput = document.getElementById('grid-rows');
const colsInput = document.getElementById('grid-cols');
const btnResize = document.getElementById('btn-resize');
const btnClear = document.getElementById('btn-clear');
const btnExport = document.getElementById('btn-export');
const scoreValEl = document.getElementById('score-val');
const ledgerContentEl = document.getElementById('ledger-content');

// Modal Elements
const exportModal = document.getElementById('export-modal');
const modalClose = document.getElementById('modal-close');
const exportText = document.getElementById('export-text');
const btnCopy = document.getElementById('btn-copy');

function init() {
    renderCropPalette(CROPS);
    buildGrid();
    setupEventListeners();
    updateAnalysis();
}

function renderCropPalette(cropsToRender) {
    cropListEl.innerHTML = '';
    if (cropsToRender.length === 0) {
        cropListEl.innerHTML = '<p class="hint">No crops found.</p>';
        return;
    }

    cropsToRender.forEach(crop => {
        const card = document.createElement('div');
        card.className = 'crop-card';
        card.draggable = true;
        card.dataset.cropId = crop.id;
        
        card.innerHTML = `
            <span class="crop-emoji">${crop.emoji}</span>
            <div class="crop-info">
                <h4>${crop.name}</h4>
                <span>${crop.days}</span>
            </div>
        `;

        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', crop.id);
        });

        card.addEventListener('click', () => {
            // Toggle active selection state
            document.querySelectorAll('.crop-card').forEach(c => c.style.borderColor = '');
            if (selectedCropForPlacement === crop.id) {
                selectedCropForPlacement = null;
            } else {
                selectedCropForPlacement = crop.id;
                card.style.borderColor = 'var(--primary)';
            }
        });

        cropListEl.appendChild(card);
    });
}

function buildGrid() {
    gridEl.style.gridTemplateColumns = `repeat(${gridCols}, var(--cell-size))`;
    gridEl.innerHTML = '';

    for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
            const key = `${r}-${c}`;
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.dataset.row = r;
            cell.dataset.col = c;

            if (gridData[key]) {
                const crop = CROPS.find(item => item.id === gridData[key]);
                if (crop) {
                    cell.classList.add('has-crop');
                    cell.innerHTML = `
                        <div class="cell-content">
                            <span class="cell-emoji">${crop.emoji}</span>
                            <span class="cell-name">${crop.name}</span>
                        </div>
                        <button class="cell-remove" title="Remove crop">&times;</button>
                    `;
                }
            }

            // Drag & Drop events
            cell.addEventListener('dragover', (e) => {
                e.preventDefault();
                cell.classList.add('drag-over');
            });

            cell.addEventListener('dragleave', () => {
                cell.classList.remove('drag-over');
            });

            cell.addEventListener('drop', (e) => {
                e.preventDefault();
                cell.classList.remove('drag-over');
                const cropId = e.dataTransfer.getData('text/plain');
                if (cropId) {
                    gridData[key] = cropId;
                    buildGrid();
                    updateAnalysis();
                }
            });

            // Click interaction (placement or removal)
            cell.addEventListener('click', (e) => {
                if (e.target.classList.contains('cell-remove')) {
                    delete gridData[key];
                    buildGrid();
                    updateAnalysis();
                    return;
                }

                if (selectedCropForPlacement) {
                    gridData[key] = selectedCropForPlacement;
                    buildGrid();
                    updateAnalysis();
                } else if (gridData[key]) {
                    // Click filled cell without selection clears it
                    delete gridData[key];
                    buildGrid();
                    updateAnalysis();
                }
            });

            gridEl.appendChild(cell);
        }
    }
}

function setupEventListeners() {
    searchCropsEl.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = CROPS.filter(c => c.name.toLowerCase().includes(term) || c.family.toLowerCase().includes(term));
        renderCropPalette(filtered);
    });

    btnResize.addEventListener('click', () => {
        const r = parseInt(rowsInput.value);
        const c = parseInt(colsInput.value);
        if (r >= 3 && r <= 12 && c >= 3 && c <= 12) {
            gridRows = r;
            gridCols = c;
            // Clean up out of bounds data
            Object.keys(gridData).forEach(key => {
                const [row, col] = key.split('-').map(Number);
                if (row >= gridRows || col >= gridCols) {
                    delete gridData[key];
                }
            });
            buildGrid();
            updateAnalysis();
        }
    });

    btnClear.addEventListener('click', () => {
        if (Object.keys(gridData).length > 0 && confirm('Are you sure you want to clear your garden grid?')) {
            gridData = {};
            selectedCropForPlacement = null;
            document.querySelectorAll('.crop-card').forEach(c => c.style.borderColor = '');
            buildGrid();
            updateAnalysis();
        }
    });

    btnExport.addEventListener('click', () => {
        generateExportSummary();
        exportModal.classList.add('active');
        exportModal.setAttribute('aria-hidden', 'false');
    });

    modalClose.addEventListener('click', () => {
        exportModal.classList.remove('active');
        exportModal.setAttribute('aria-hidden', 'true');
    });

    exportModal.addEventListener('click', (e) => {
        if (e.target === exportModal) {
            exportModal.classList.remove('active');
            exportModal.setAttribute('aria-hidden', 'true');
        }
    });

    btnCopy.addEventListener('click', () => {
        navigator.clipboard.writeText(exportText.textContent).then(() => {
            const originalText = btnCopy.textContent;
            btnCopy.textContent = 'Copied!';
            setTimeout(() => btnCopy.textContent = originalText, 2000);
        });
    });
}

function getAdjacentPairs() {
    const pairs = [];
    const placedKeys = Object.keys(gridData);

    for (let i = 0; i < placedKeys.length; i++) {
        for (let j = i + 1; j < placedKeys.length; j++) {
            const [r1, c1] = placedKeys[i].split('-').map(Number);
            const [r2, c2] = placedKeys[j].split('-').map(Number);

            // Check Manhattan distance or Chebyshev distance for neighborhood (adjacent or diagonal)
            const dist = Math.max(Math.abs(r1 - r2), Math.abs(c1 - c2));
            if (dist === 1) {
                pairs.push({
                    cell1: placedKeys[i],
                    cell2: placedKeys[j],
                    crop1: gridData[placedKeys[i]],
                    crop2: gridData[placedKeys[j]]
                });
            }
        }
    }
    return pairs;
}

function updateAnalysis() {
    const pairs = getAdjacentPairs();
    let goodCount = 0;
    let badCount = 0;
    let ledgerHTML = '';

    const cellStatuses = {}; // key -> 'good' | 'bad'

    pairs.forEach(pair => {
        const cropObj1 = CROPS.find(c => c.id === pair.crop1);
        const cropObj2 = CROPS.find(c => c.id === pair.crop2);

        if (!cropObj1 || !cropObj2) return;

        const isGood = cropObj1.good.includes(cropObj2.id) || cropObj2.good.includes(cropObj1.id);
        const isBad = cropObj1.bad.includes(cropObj2.id) || cropObj2.bad.includes(cropObj1.id);

        if (isGood) {
            goodCount++;
            cellStatuses[pair.cell1] = 'good';
            cellStatuses[pair.cell2] = 'good';
            ledgerHTML += `<div class="ledger-item good"><span>💚</span> <strong>${cropObj1.name}</strong> & <strong>${cropObj2.name}</strong> are wonderful companions!</div>`;
        } else if (isBad) {
            badCount++;
            if (cellStatuses[pair.cell1] !== 'good') cellStatuses[pair.cell1] = 'bad';
            if (cellStatuses[pair.cell2] !== 'good') cellStatuses[pair.cell2] = 'bad';
            ledgerHTML += `<div class="ledger-item bad"><span>⚠️</span> <strong>${cropObj1.name}</strong> & <strong>${cropObj2.name}</strong> conflict and should be separated.</div>`;
        }
    });

    // Highlight cells on grid based on status
    document.querySelectorAll('.grid-cell').forEach(cell => {
        const r = cell.dataset.row;
        const c = cell.dataset.col;
        const key = `${r}-${c}`;
        cell.classList.remove('status-good', 'status-bad');
        if (cellStatuses[key] === 'good') {
            cell.classList.add('status-good');
        } else if (cellStatuses[key] === 'bad') {
            cell.classList.add('status-bad');
        }
    });

    // Calculate Score
    const totalPlaced = Object.keys(gridData).length;
    let score = 100;
    if (totalPlaced > 1) {
        const totalInteractions = goodCount + badCount;
        if (totalInteractions > 0) {
            score = Math.round((goodCount / totalInteractions) * 100);
        }
    }
    scoreValEl.textContent = totalPlaced === 0 ? '100' : score;

    if (ledgerHTML === '') {
        if (totalPlaced === 0) {
            ledgerContentEl.innerHTML = '<p class="empty-ledger">Add crops to your garden grid to analyze companion relationships and harvest tips.</p>';
        } else {
            ledgerContentEl.innerHTML = '<p class="empty-ledger">Place compatible crops next to each other (orthogonal or diagonal) to establish synergistic pairs.</p>';
        }
    } else {
        ledgerContentEl.innerHTML = ledgerHTML;
    }
}

function generateExportSummary() {
    const totalPlaced = Object.keys(gridData).length;
    const counts = {};
    Object.values(gridData).forEach(id => {
        counts[id] = (counts[id] || 0) + 1;
    });

    let summary = `=== FLORAGRID GARDEN MASTER PLAN ===\n`;
    summary += `Grid Size: ${gridRows} Rows x ${gridCols} Columns\n`;
    summary += `Total Plants: ${totalPlaced}\n`;
    summary += `Synergy Score: ${scoreValEl.textContent}%\n\n`;

    summary += `--- INVENTORY ---\n`;
    if (totalPlaced === 0) {
        summary += `No crops planted yet.\n`;
    } else {
        Object.entries(counts).forEach(([id, count]) => {
            const crop = CROPS.find(c => c.id === id);
            if (crop) {
                summary += `- ${crop.emoji} ${crop.name}: ${count} planted (${crop.days})\n`;
            }
        });
    }

    summary += `\n--- LAYOUT GRID MAP ---\n`;
    for (let r = 0; r < gridRows; r++) {
        let rowStr = `Row ${r + 1}: `;
        for (let c = 0; c < gridCols; c++) {
            const key = `${r}-${c}`;
            if (gridData[key]) {
                const crop = CROPS.find(item => item.id === gridData[key]);
                rowStr += `[${crop ? crop.emoji : ' '}]`;
            } else {
                rowStr += `[ ]`;
            }
        }
        summary += rowStr + '\n';
    }

    exportText.textContent = summary;
}

window.addEventListener('DOMContentLoaded', init);
