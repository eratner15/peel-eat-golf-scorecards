// Import core modules
import { currentRoundState, saveState, loadState, clearState } from './state.js';
import { showAlert } from './ui.js';
import { formatCurrency, formatMatchStatus, getStatusClass, validateScore } from './utils.js';
import { validateNumericInput, sanitizeInput } from './validation.js';
import { performanceMonitor } from './performance.js';
import { initializeRecovery, attemptStateRecovery } from './recovery.js';

// Import game implementations
import { 
    generateNassauRows,
    initializeNassau,
    resetNassauDisplay,
    handleNassauPress,
    findCurrentNassauHole,
    populateNassau,
    updateNassau,
    updateNassauSettlement
} from '../games/nassau.js';

import { initializeWolf, updateWolf, resetWolfDisplay } from '../games/wolf.js';

// === GAME IMPLEMENTATION: VEGAS ===

/**
 * Initialize Vegas: Add listeners for team name changes
 */
function initializeVegas() {
    console.log("Init Vegas");
    
    // Listener for Team 1 names
    const t1Header = document.getElementById('vegas-th-t1');
    const pAInput = document.getElementById('vegas-pA-name');
    const pBInput = document.getElementById('vegas-pB-name');
    const pAHeader = document.getElementById('vegas-th-pA');
    const pBHeader = document.getElementById('vegas-th-pB');
    
    const updateT1Names = () => {
        const pA = pAInput?.value || 'A';
        const pB = pBInput?.value || 'B';
        if (t1Header) t1Header.textContent = `Team 1 (${pA}/${pB})`;
        if (pAHeader) pAHeader.textContent = `Score ${pA}`;
        if (pBHeader) pBHeader.textContent = `Score ${pB}`;
        updateVegas(); // Recalculate if names change affects settlement display
    };
    
    pAInput?.addEventListener('input', updateT1Names);
    pBInput?.addEventListener('input', updateT1Names);

    // Listener for Team 2 names
    const t2Header = document.getElementById('vegas-th-t2');
    const pCInput = document.getElementById('vegas-pC-name');
    const pDInput = document.getElementById('vegas-pD-name');
    const pCHeader = document.getElementById('vegas-th-pC');
    const pDHeader = document.getElementById('vegas-th-pD');
    
    const updateT2Names = () => {
        const pC = pCInput?.value || 'C';
        const pD = pDInput?.value || 'D';
        if (t2Header) t2Header.textContent = `Team 2 (${pC}/${pD})`;
        if (pCHeader) pCHeader.textContent = `Score ${pC}`;
        if (pDHeader) pDHeader.textContent = `Score ${pD}`;
        updateVegas(); // Recalculate if names change affects settlement display
    };
    
    pCInput?.addEventListener('input', updateT2Names);
    pDInput?.addEventListener('input', updateT2Names);
    
    // Listeners for point value changes
    document.getElementById('vegas-point-value')?.addEventListener('input', updateVegas);
    
    // Generate scorecard rows if needed
    generateVegasRows();
}

/**
 * Generate Vegas scorecard rows
 */
function generateVegasRows() {
    const tbody = document.getElementById('vegas-scorecard-body');
    if (!tbody || tbody.children.length > 0) return; // Already populated
    
    let html = '';
    
    for (let i = 1; i <= 18; i++) {
        html += `
            <tr id="vegas-row-h${i}">
                <td class="td-std font-medium">${i}</td>
                <td class="td-std"><input type="number" id="vegas-pA-h${i}-score" min="1" max="20" class="input-std input-score" aria-label="Player A Score Hole ${i}"></td>
                <td class="td-std"><input type="number" id="vegas-pB-h${i}-score" min="1" max="20" class="input-std input-score" aria-label="Player B Score Hole ${i}"></td>
                <td class="td-std"><input type="number" id="vegas-pC-h${i}-score" min="1" max="20" class="input-std input-score" aria-label="Player C Score Hole ${i}"></td>
                <td class="td-std"><input type="number" id="vegas-pD-h${i}-score" min="1" max="20" class="input-std input-score" aria-label="Player D Score Hole ${i}"></td>
                <td class="td-std vegas-number" id="vegas-h${i}-t1-num"></td>
                <td class="td-std vegas-number" id="vegas-h${i}-t2-num"></td>
                <td class="td-std font-semibold" id="vegas-h${i}-diff"></td>
            </tr>`;
        
        // Add summary rows
        if (i === 9) {
            html += `
                <tr class="bg-gray-100 font-semibold">
                    <td class="td-std">OUT</td>
                    <td id="vegas-pA-out-score" class="td-std"></td>
                    <td id="vegas-pB-out-score" class="td-std"></td>
                    <td id="vegas-pC-out-score" class="td-std"></td>
                    <td id="vegas-pD-out-score" class="td-std"></td>
                    <td class="td-std" colspan="2"></td>
                    <td id="vegas-out-diff" class="td-std font-bold"></td>
                </tr>`;
        } else if (i === 18) {
            html += `
                <tr class="bg-gray-100 font-semibold">
                    <td class="td-std">IN</td>
                    <td id="vegas-pA-in-score" class="td-std"></td>
                    <td id="vegas-pB-in-score" class="td-std"></td>
                    <td id="vegas-pC-in-score" class="td-std"></td>
                    <td id="vegas-pD-in-score" class="td-std"></td>
                    <td class="td-std" colspan="2"></td>
                    <td id="vegas-in-diff" class="td-std font-bold"></td>
                </tr>
                <tr class="bg-gray-200 font-bold">
                    <td class="td-std">TOTAL</td>
                    <td id="vegas-pA-total-score" class="td-std"></td>
                    <td id="vegas-pB-total-score" class="td-std"></td>
                    <td id="vegas-pC-total-score" class="td-std"></td>
                    <td id="vegas-pD-total-score" class="td-std"></td>
                    <td class="td-std" colspan="2"></td>
                    <td id="vegas-total-diff" class="td-std font-extrabold"></td>
                </tr>`;
        }
    }
    
    tbody.innerHTML = html;
}

/**
 * Reset Vegas Display: Clear calculated values in the UI
 */
function resetVegasDisplay() {
    console.log("Reset Vegas Display");
    
    // Clear hole-by-hole team numbers and diffs
    for (let i = 1; i <= 18; i++) {
        document.getElementById(`vegas-h${i}-t1-num`)?.textContent = '';
        document.getElementById(`vegas-h${i}-t2-num`)?.textContent = '';
        const diffCell = document.getElementById(`vegas-h${i}-diff`);
        if(diffCell) {
            diffCell.textContent = '';
            diffCell.className = 'td-std font-semibold'; // Reset class
        }
    }
    
    // Clear summary rows (scores cleared elsewhere)
    document.getElementById('vegas-out-diff')?.textContent = '';
    document.getElementById('vegas-in-diff')?.textContent = '';
    document.getElementById('vegas-total-diff')?.textContent = '';
    document.getElementById('vegas-total-diff')?.className = 'td-std font-extrabold'; // Reset class

    // Clear settlement text
    document.getElementById('vegas-settlement-summary-text')?.textContent = 'Team -- owes Team -- $0.00';

    // Reset headers (names cleared elsewhere)
    document.getElementById('vegas-th-t1').textContent = `Team 1`;
    document.getElementById('vegas-th-t2').textContent = `Team 2`;
    document.getElementById('vegas-th-pA').textContent = `Score A`;
    document.getElementById('vegas-th-pB').textContent = `Score B`;
    document.getElementById('vegas-th-pC').textContent = `Score C`;
    document.getElementById('vegas-th-pD').textContent = `Score D`;
}

/**
 * Populate Vegas inputs from state
 */
function populateVegas() {
    console.log("Populate Vegas");
    if (!currentRoundState || currentRoundState.gameType !== 'vegas') return;

    // Populate setup fields
    document.getElementById('vegas-pA-name').value = currentRoundState.teams?.t1?.pA || '';
    document.getElementById('vegas-pB-name').value = currentRoundState.teams?.t1?.pB || '';
    document.getElementById('vegas-pC-name').value = currentRoundState.teams?.t2?.pC || '';
    document.getElementById('vegas-pD-name').value = currentRoundState.teams?.t2?.pD || '';
    document.getElementById('vegas-point-value').value = currentRoundState.pointValue ?? 1;

    // Update headers immediately
    const pA = currentRoundState.teams?.t1?.pA || 'A';
    const pB = currentRoundState.teams?.t1?.pB || 'B';
    const pC = currentRoundState.teams?.t2?.pC || 'C';
    const pD = currentRoundState.teams?.t2?.pD || 'D';
    document.getElementById('vegas-th-t1').textContent = `Team 1 (${pA}/${pB})`;
    document.getElementById('vegas-th-t2').textContent = `Team 2 (${pC}/${pD})`;
    document.getElementById('vegas-th-pA').textContent = `Score ${pA}`;
    document.getElementById('vegas-th-pB').textContent = `Score ${pB}`;
    document.getElementById('vegas-th-pC').textContent = `Score ${pC}`;
    document.getElementById('vegas-th-pD').textContent = `Score ${pD}`;

    // Populate individual scores
    const players = ['pA', 'pB', 'pC', 'pD'];
    for (let i = 0; i < 18; i++) {
        players.forEach(pKey => {
            const scoreInput = document.getElementById(`vegas-${pKey}-h${i + 1}-score`);
            if (scoreInput) scoreInput.value = currentRoundState.scores?.[pKey]?.[i] ?? '';
        });
    }
    // Calculated fields (team nums, diff, settlement) will be populated by updateVegas()
}

/**
 * Helper to calculate Vegas team number (low score * 10 + high score)
 * @param {number} score1 - First player's score
 * @param {number} score2 - Second player's score
 * @returns {number|null} - Vegas team number or null if scores not complete
 */
function calculateVegasTeamNumber(score1, score2) {
    if (score1 === null || score2 === null) return null;
    const low = Math.min(score1, score2);
    const high = Math.max(score1, score2);
    // Handle scores >= 10 for high score correctly
    return low * 10 + high;
}

/**
 * Update Vegas: Calculate team numbers, points difference, settlement, and update UI
 */
function updateVegas() {
    console.log("Update Vegas");
    if (!currentRoundState || currentRoundState.gameType !== 'vegas') return;

    // --- 1. Read Inputs into State ---
    currentRoundState.teams = {
        t1: {
            pA: document.getElementById('vegas-pA-name')?.value || '',
            pB: document.getElementById('vegas-pB-name')?.value || ''
        },
        t2: {
            pC: document.getElementById('vegas-pC-name')?.value || '',
            pD: document.getElementById('vegas-pD-name')?.value || ''
        }
    };
    
    currentRoundState.pointValue = parseFloat(document.getElementById('vegas-point-value')?.value) || 0;

    let scores = { pA: [], pB: [], pC: [], pD: [] };
    let totalScores = { pA: 0, pB: 0, pC: 0, pD: 0 };
    let outScores = { pA: 0, pB: 0, pC: 0, pD: 0 };
    let inScores = { pA: 0, pB: 0, pC: 0, pD: 0 };
    const players = ['pA', 'pB', 'pC', 'pD'];

    for (let i = 0; i < 18; i++) {
        players.forEach(pKey => {
            const scoreVal = document.getElementById(`vegas-${pKey}-h${i + 1}-score`)?.value;
            if (scoreVal) {
                const score = parseInt(scoreVal);
                scores[pKey].push(score);
                totalScores[pKey] += score;
                if (i < 9) outScores[pKey] += score;
                else inScores[pKey] += score;
            }
        });
    }
    
    currentRoundState.scores = scores;
    currentRoundState.totalScores = totalScores;
    currentRoundState.outScores = outScores;
    currentRoundState.inScores = inScores;
    
    // Calculate team numbers
    const t1Num = calculateVegasTeamNumber(scores.pA[0], scores.pA[1]);
    const t2Num = calculateVegasTeamNumber(scores.pC[0], scores.pC[1]);
    
    currentRoundState.results.t1Num = t1Num;
    currentRoundState.results.t2Num = t2Num;
    
    // Calculate points difference
    const diff = t2Num - t1Num;
    currentRoundState.results.diff = diff;
    
    // Calculate settlement
    let settlementText = '';
    let settlementAmount = 0;
    let winner = null;
    
    if (diff === 0) {
        settlementText = "All square - no money changes hands";
        settlementAmount = 0;
        winner = null;
    } else if (diff > 0) {
        settlementText = `Team 2 owes Team 1 ${Math.abs(diff)} points`;
        settlementAmount = Math.abs(diff);
        winner = 'Team 1';
    } else {
        settlementText = `Team 1 owes Team 2 ${Math.abs(diff)} points`;
        settlementAmount = Math.abs(diff);
        winner = 'Team 2';
    }
    
    currentRoundState.settlement = {
        summaryText: settlementText,
        amount: settlementAmount,
        winner: winner
    };
    
    // Update UI
    document.getElementById('vegas-out-diff').textContent = outScores.pA.join(' / ') || '';
    document.getElementById('vegas-in-diff').textContent = inScores.pA.join(' / ') || '';
    document.getElementById('vegas-total-diff').textContent = diff.toString();
    
    document.getElementById('vegas-pA-out-score').textContent = outScores.pA.join(' / ') || '';
    document.getElementById('vegas-pA-in-score').textContent = inScores.pA.join(' / ') || '';
    document.getElementById('vegas-pA-total-score').textContent = totalScores.pA.toString();
    
    document.getElementById('vegas-pC-out-score').textContent = outScores.pC.join(' / ') || '';
    document.getElementById('vegas-pC-in-score').textContent = inScores.pC.join(' / ') || '';
    document.getElementById('vegas-pC-total-score').textContent = totalScores.pC.toString();
    
    document.getElementById('vegas-out-diff').textContent = outScores.pA.join(' / ') || '';
    document.getElementById('vegas-in-diff').textContent = inScores.pA.join(' / ') || '';
    document.getElementById('vegas-total-diff').textContent = diff.toString();
    
    document.getElementById('vegas-settlement-summary-text').textContent = settlementText;
    document.getElementById('vegas-settlement-amount').textContent = formatCurrency(settlementAmount);
    document.getElementById('vegas-settlement-winner').textContent = winner || '';
}

// === GAME IMPLEMENTATION: NASSAU ===

/**
 * Initialize Nassau: Add listeners for press buttons and player name changes
 */
function initializeNassau() {
    console.log("Initializing Nassau");
    
    // Add press button event handlers
    document.getElementById('nassau-press-btn-p1')?.addEventListener('click', handleNassauPress);
    document.getElementById('nassau-press-btn-p2')?.addEventListener('click', handleNassauPress);
    
    // Update header names when players change
    const p1Input = document.getElementById('nassau-player1-name');
    const p2Input = document.getElementById('nassau-player2-name');
    const p1Header = document.getElementById('nassau-th-p1');
    const p2Header = document.getElementById('nassau-th-p2');
    
    const updateHeaders = () => {
        if (p1Header) p1Header.textContent = p1Input?.value || 'Player 1';
        if (p2Header) p2Header.textContent = p2Input?.value || 'Player 2';
    };
    
    p1Input?.addEventListener('input', updateHeaders);
    p2Input?.addEventListener('input', updateHeaders);
    
    // Add listener for press rule changes
    document.getElementById('nassau-press-rule')?.addEventListener('change', function() {
        currentRoundState.pressRule = this.value;
        updateNassau();
    });
    
    // Initialize scorecard rows if needed
    generateNassauRows();
}

/**
 * Generate Nassau scorecard rows
 */
function generateNassauRows() {
    const tbody = document.getElementById('nassau-scorecard-body');
    if (!tbody || tbody.children.length > 0) return; // Already populated
    
    let html = '';
    
    for (let i = 1; i <= 18; i++) {
        html += `
            <tr id="nassau-row-h${i}">
                <td class="td-std font-medium">${i}</td>
                <td class="td-std"><input type="number" id="nassau-h${i}-par" min="3" max="6" class="input-std input-par" aria-label="Hole ${i} Par"></td>
                <td class="td-std"><input type="number" id="nassau-p1-h${i}-score" min="1" class="input-std input-score" aria-label="Player 1 Score Hole ${i}"></td>
                <td class="td-std"><input type="number" id="nassau-p2-h${i}-score" min="1" class="input-std input-score" aria-label="Player 2 Score Hole ${i}"></td>
                <td class="td-std text-gray-500" id="nassau-h${i}-result"></td>
                <td class="td-std font-semibold" id="nassau-h${i}-status"></td>
                <td class="td-std text-xs text-gray-500" id="nassau-h${i}-presses"></td>
            </tr>`;
        
        // Add summary rows
        if (i === 9) {
            html += `
                <tr class="bg-gray-100 font-semibold">
                    <td class="td-std">OUT</td>
                    <td class="td-std" id="nassau-out-par"></td>
                    <td class="td-std" id="nassau-p1-out-score"></td>
                    <td class="td-std" id="nassau-p2-out-score"></td>
                    <td class="td-std">Front 9:</td>
                    <td class="td-std" id="nassau-front9-status"></td>
                    <td class="td-std" id="nassau-front9-presses"></td>
                </tr>`;
        } else if (i === 18) {
            html += `
                <tr class="bg-gray-100 font-semibold">
                    <td class="td-std">IN</td>
                    <td class="td-std" id="nassau-in-par"></td>
                    <td class="td-std" id="nassau-p1-in-score"></td>
                    <td class="td-std" id="nassau-p2-in-score"></td>
                    <td class="td-std">Back 9:</td>
                    <td class="td-std" id="nassau-back9-status"></td>
                    <td class="td-std" id="nassau-back9-presses"></td>
                </tr>
                <tr class="bg-gray-200 font-bold">
                    <td class="td-std">TOTAL</td>
                    <td class="td-std" id="nassau-total-par"></td>
                    <td class="td-std" id="nassau-p1-total-score"></td>
                    <td class="td-std" id="nassau-p2-total-score"></td>
                    <td class="td-std">Overall:</td>
                    <td class="td-std" id="nassau-overall-status"></td>
                    <td class="td-std" id="nassau-total-presses"></td>
                </tr>`;
        }
    }
    
    tbody.innerHTML = html;
}

/**
 * Reset Nassau Display: Clear calculated values in the UI
 */
function resetNassauDisplay() {
    console.log("Reset Nassau Display");
    
    // Reset hole results and status displays
    for (let i = 1; i <= 18; i++) {
        document.getElementById(`nassau-h${i}-result`)?.textContent = '';
        document.getElementById(`nassau-h${i}-status`)?.textContent = '';
        document.getElementById(`nassau-h${i}-status`)?.className = 'td-std font-semibold';
        document.getElementById(`nassau-h${i}-presses`)?.textContent = '';
    }
    
    // Reset summary fields
    document.getElementById('nassau-out-par')?.textContent = '';
    document.getElementById('nassau-in-par')?.textContent = '';
    document.getElementById('nassau-total-par')?.textContent = '';
    
    document.getElementById('nassau-p1-out-score')?.textContent = '';
    document.getElementById('nassau-p1-in-score')?.textContent = '';
    document.getElementById('nassau-p1-total-score')?.textContent = '';
    
    document.getElementById('nassau-p2-out-score')?.textContent = '';
    document.getElementById('nassau-p2-in-score')?.textContent = '';
    document.getElementById('nassau-p2-total-score')?.textContent = '';
    
    document.getElementById('nassau-front9-status')?.textContent = '';
    document.getElementById('nassau-back9-status')?.textContent = '';
    document.getElementById('nassau-overall-status')?.textContent = '';
    
    document.getElementById('nassau-front9-presses')?.textContent = '';
    document.getElementById('nassau-back9-presses')?.textContent = '';
    document.getElementById('nassau-total-presses')?.textContent = '';
    
    // Reset headers
    document.getElementById('nassau-th-p1')?.textContent = 'Player 1';
    document.getElementById('nassau-th-p2')?.textContent = 'Player 2';
    
    // Reset settlement section
    document.getElementById('nassau-settlement-front9-status')?.textContent = '--';
    document.getElementById('nassau-settlement-back9-status')?.textContent = '--';
    document.getElementById('nassau-settlement-overall-status')?.textContent = '--';
    document.getElementById('nassau-settlement-presses-count')?.textContent = '0';
    
    document.getElementById('nassau-settlement-front9-amount')?.textContent = '$0.00';
    document.getElementById('nassau-settlement-back9-amount')?.textContent = '$0.00';
    document.getElementById('nassau-settlement-overall-amount')?.textContent = '$0.00';
    document.getElementById('nassau-settlement-presses-amount')?.textContent = '$0.00';
    
    document.getElementById('nassau-settlement-winner-name')?.textContent = 'Player --';
    document.getElementById('nassau-settlement-total-amount')?.textContent = '$0.00';
    document.getElementById('nassau-settlement-summary-text')?.textContent = 'Player 1 owes Player 2 $0.00';
    
    // Hide press buttons
    document.getElementById('nassau-press-btn-p1')?.classList.add('hidden');
    document.getElementById('nassau-press-btn-p2')?.classList.add('hidden');
}

/**
 * Handler for Nassau press buttons
 * @param {Event} event - Click event from press button
 */
function handleNassauPress(event) {
    if (!currentRoundState || currentRoundState.gameType !== 'nassau') return;
    
    const button = event.target;
    const playerNum = button.dataset.player;
    
    if (!playerNum) return;
    
    const currentHole = findCurrentNassauHole();
    if (currentHole === null) {
        showAlert("Please enter scores before adding a press", "warning");
        return;
    }
    
    // Create a new press
    const newPress = {
        hole: currentHole,
        player: playerNum,
        // Get the current match status at this hole
        initialMatchStatus: currentRoundState.results.matchStatus[currentHole - 1] || 0
    };
    
    // Add the press to the state
    if (!currentRoundState.presses) currentRoundState.presses = [];
    currentRoundState.presses.push(newPress);
    
    console.log(`Added press for P${playerNum} at hole ${currentHole}`);
    
    // Update display
    updateNassau();
    saveState();
}

/**
 * Finds the current hole in Nassau (last hole with scores entered)
 * @returns {number|null} - Hole number or null if no scores yet
 */
function findCurrentNassauHole() {
    if (!currentRoundState || !currentRoundState.scores) return null;
    
    const { p1, p2 } = currentRoundState.scores;
    
    // Find the last hole where both players have a score
    for (let i = 17; i >= 0; i--) {
        if (p1[i] !== null && p2[i] !== null) {
            return i + 1; // Return 1-based hole number
        }
    }
    
    return null; // No holes with both scores yet
}

/**
 * Populate Nassau inputs from state
 */
function populateNassau() {
    if (!currentRoundState || currentRoundState.gameType !== 'nassau') return;
    
    // Player names
    document.getElementById('nassau-player1-name').value = currentRoundState.players?.[0] || '';
    document.getElementById('nassau-player2-name').value = currentRoundState.players?.[1] || '';
    
    // Update headers
    document.getElementById('nassau-th-p1').textContent = currentRoundState.players?.[0] || 'Player 1';
    document.getElementById('nassau-th-p2').textContent = currentRoundState.players?.[1] || 'Player 2';
    
    // Wager and press rule
    document.getElementById('nassau-wager').value = currentRoundState.wager ?? 5;
    document.getElementById('nassau-press-rule').value = currentRoundState.pressRule || 'manual';
    
    // Par and scores
    for (let i = 0; i < 18; i++) {
        const hole = i + 1;
        const parInput = document.getElementById(`nassau-h${hole}-par`);
        const p1ScoreInput = document.getElementById(`nassau-p1-h${hole}-score`);
        const p2ScoreInput = document.getElementById(`nassau-p2-h${hole}-score`);
        
        if (parInput) parInput.value = currentRoundState.par?.[i] || '';
        if (p1ScoreInput) p1ScoreInput.value = currentRoundState.scores?.p1?.[i] ?? '';
        if (p2ScoreInput) p2ScoreInput.value = currentRoundState.scores?.p2?.[i] ?? '';
    }
}

/**
 * Update Nassau: Calculate match status, handle presses, update settlement
 * @param {Event} event - The event that triggered the update (optional)
 */
function updateNassau(event = null) {
    if (!currentRoundState || currentRoundState.gameType !== 'nassau') return;
    
    // --- 1. Read inputs into state ---
    currentRoundState.players = [
        document.getElementById('nassau-player1-name')?.value || '',
        document.getElementById('nassau-player2-name')?.value || ''
    ];
    
    currentRoundState.wager = parseFloat(document.getElementById('nassau-wager')?.value) || 5;
    currentRoundState.pressRule = document.getElementById('nassau-press-rule')?.value || 'manual';
    
    // Read par and scores
    const par = [];
    const p1Scores = [];
    const p2Scores = [];
    
    for (let i = 1; i <= 18; i++) {
        const parVal = document.getElementById(`nassau-h${i}-par`)?.value;
        const p1Val = document.getElementById(`nassau-p1-h${i}-score`)?.value;
        const p2Val = document.getElementById(`nassau-p2-h${i}-score`)?.value;
        
        par.push(parVal === '' ? null : parseInt(parVal));
        p1Scores.push(p1Val === '' ? null : parseInt(p1Val));
        p2Scores.push(p2Val === '' ? null : parseInt(p2Val));
    }
    
    currentRoundState.par = par;
    currentRoundState.scores = { p1: p1Scores, p2: p2Scores };
    
    // --- 2. Calculate match status and handle auto-presses ---
    const holeResults = []; // Difference between p1 and p2 scores (negative means p1 wins the hole)
    const matchStatus = []; // Running status (positive means p1 is up X holes)
    
    // Calculate hole-by-hole results and match status
    let currentStatus = 0;
    
    for (let i = 0; i < 18; i++) {
        const p1Score = p1Scores[i];
        const p2Score = p2Scores[i];
        
        let result = null;
        if (p1Score !== null && p2Score !== null) {
            result = p1Score - p2Score;
            
            // Update match status
            if (result < 0) currentStatus++; // P1 won hole
            else if (result > 0) currentStatus--; // P2 won hole
            // If result === 0, halved hole, no change to status
        }
        
        holeResults.push(result);
        matchStatus.push(currentStatus);
        
        // Handle auto 2-down presses if enabled
        if (currentRoundState.pressRule === 'auto-2down' && i > 0) {
            const prevStatus = matchStatus[i-1];
            
            // Check if just went 2 down
            if ((prevStatus === -1 && currentStatus === -2) || (prevStatus === 1 && currentStatus === 2)) {
                // Add auto press if not already pressed on this hole
                const playerDown = currentStatus > 0 ? '2' : '1'; // Player who is down
                
                // Check if we already have a press on this hole
                const existingPress = currentRoundState.presses?.find(p => p.hole === i + 1);
                
                if (!existingPress && p1Score !== null && p2Score !== null) {
                    if (!currentRoundState.presses) currentRoundState.presses = [];
                    currentRoundState.presses.push({
                        hole: i + 1,
                        player: playerDown,
                        initialMatchStatus: currentStatus,
                        auto: true
                    });
                    
                    console.log(`Auto press added at hole ${i+1} for player ${playerDown}`);
                }
            }
        }
    }
    
    currentRoundState.results.holeResults = holeResults;
    currentRoundState.results.matchStatus = matchStatus;
    
    // --- 3. Calculate press results ---
    const pressResults = [];
    
    if (currentRoundState.presses && currentRoundState.presses.length > 0) {
        for (const press of currentRoundState.presses) {
            const startHole = press.hole - 1; // 0-based index
            
            if (startHole >= 0 && startHole < 18) {
                const initialStatus = press.initialMatchStatus;
                let finalStatus = null;
                
                // Find the final hole that has scores
                let endHole = 17; // Default to 18th hole
                while (endHole >= startHole) {
                    if (p1Scores[endHole] !== null && p2Scores[endHole] !== null) {
                        break;
                    }
                    endHole--;
                }
                
                if (endHole >= startHole) {
                    // Calculate final status for the press
                    finalStatus = matchStatus[endHole] - initialStatus;
                    
                    pressResults.push({
                        press: press,
                        startHole: startHole,
                        endHole: endHole,
                        initialStatus: initialStatus,
                        finalStatus: finalStatus
                    });
                }
            }
        }
    }
    
    currentRoundState.results.pressResults = pressResults;
    
    // --- 4. Update UI ---
    // Update hole results and match status
    for (let i = 0; i < 18; i++) {
        const hole = i + 1;
        const result = holeResults[i];
        const status = matchStatus[i];
        
        const resultCell = document.getElementById(`nassau-h${hole}-result`);
        const statusCell = document.getElementById(`nassau-h${hole}-status`);
        const pressesCell = document.getElementById(`nassau-h${hole}-presses`);
        
        // Show hole result
        if (resultCell) {
            if (result === null) {
                resultCell.textContent = '';
            } else if (result === 0) {
                resultCell.textContent = 'HALVE';
            } else {
                const winner = result < 0 ? currentRoundState.players[0] || 'P1' : currentRoundState.players[1] || 'P2';
                resultCell.textContent = `${winner} +${Math.abs(result)}`;
            }
        }
        
        // Show match status
        if (statusCell) {
            if (status === null || p1Scores[i] === null || p2Scores[i] === null) {
                statusCell.textContent = '';
                statusCell.className = 'td-std font-semibold';
            } else {
                const holesRemaining = 18 - (i + 1);
                statusCell.textContent = formatMatchStatus(status, holesRemaining, false, currentRoundState.players[0] || 'P1', currentRoundState.players[1] || 'P2');
                statusCell.className = `td-std font-semibold ${getStatusClass(status)}`;
            }
        }
        
        // Show presses
        if (pressesCell) {
            const holeHasPresses = currentRoundState.presses?.some(p => p.hole === hole);
            pressesCell.textContent = holeHasPresses ? '📌' : '';
        }
    }
    
    // Calculate and display summary statistics
    let frontPar = 0, backPar = 0, totalPar = 0;
    let p1Front = 0, p1Back = 0, p1Total = 0;
    let p2Front = 0, p2Back = 0, p2Total = 0;
    let frontValid = true, backValid = true;
    
    for (let i = 0; i < 18; i++) {
        const holeNum = i + 1;
        const curPar = par[i];
        const p1Score = p1Scores[i];
        const p2Score = p2Scores[i];
        
        if (curPar !== null) {
            if (holeNum <= 9) frontPar += curPar;
            else backPar += curPar;
            totalPar += curPar;
        }
        
        if (p1Score !== null) {
            if (holeNum <= 9) p1Front += p1Score;
            else p1Back += p1Score;
            p1Total += p1Score;
        } else {
            if (holeNum <= 9) frontValid = false;
            else backValid = false;
        }
        
        if (p2Score !== null) {
            if (holeNum <= 9) p2Front += p2Score;
            else p2Back += p2Score;
            p2Total += p2Score;
        } else {
            if (holeNum <= 9) frontValid = false;
            else backValid = false;
        }
    }
    
    // Update summary row cells
    document.getElementById('nassau-out-par').textContent = frontPar || '';
    document.getElementById('nassau-in-par').textContent = backPar || '';
    document.getElementById('nassau-total-par').textContent = totalPar || '';
    
    document.getElementById('nassau-p1-out-score').textContent = frontValid ? p1Front : '';
    document.getElementById('nassau-p1-in-score').textContent = backValid ? p1Back : '';
    document.getElementById('nassau-p1-total-score').textContent = (frontValid || backValid) ? p1Total : '';
    
    document.getElementById('nassau-p2-out-score').textContent = frontValid ? p2Front : '';
    document.getElementById('nassau-p2-in-score').textContent = backValid ? p2Back : '';
    document.getElementById('nassau-p2-total-score').textContent = (frontValid || backValid) ? p2Total : '';
    
    // Calculate and display 9-hole and overall status
    const front9Status = frontValid ? matchStatus[8] : null;
    const back9StartStatus = frontValid ? matchStatus[8] : 0;
    const back9Status = backValid ? (matchStatus[17] - back9StartStatus) : null;
    const overallStatus = (frontValid || backValid) ? matchStatus[17] : null;
    
    if (front9Status !== null) {
        const elem = document.getElementById('nassau-front9-status');
        elem.textContent = formatMatchStatus(front9Status, 0, true, currentRoundState.players[0] || 'P1', currentRoundState.players[1] || 'P2');
        elem.className = `td-std ${getStatusClass(front9Status)}`;
    } else {
        document.getElementById('nassau-front9-status').textContent = '';
    }
    
    if (back9Status !== null) {
        const elem = document.getElementById('nassau-back9-status');
        elem.textContent = formatMatchStatus(back9Status, 0, true, currentRoundState.players[0] || 'P1', currentRoundState.players[1] || 'P2');
        elem.className = `td-std ${getStatusClass(back9Status)}`;
    } else {
        document.getElementById('nassau-back9-status').textContent = '';
    }
    
    if (overallStatus !== null) {
        const elem = document.getElementById('nassau-overall-status');
        elem.textContent = formatMatchStatus(overallStatus, 0, true, currentRoundState.players[0] || 'P1', currentRoundState.players[1] || 'P2');
        elem.className = `td-std ${getStatusClass(overallStatus)}`;
    } else {
        document.getElementById('nassau-overall-status').textContent = '';
    }
    
    // Update press counts
    document.getElementById('nassau-front9-presses').textContent = currentRoundState.presses?.filter(p => p.hole <= 9).length || '';
    document.getElementById('nassau-back9-presses').textContent = currentRoundState.presses?.filter(p => p.hole > 9).length || '';
    document.getElementById('nassau-total-presses').textContent = currentRoundState.presses?.length || '';
    
    // --- 5. Handle press button visibility ---
    const p1PressBtn = document.getElementById('nassau-press-btn-p1');
    const p2PressBtn = document.getElementById('nassau-press-btn-p2');
    
    // Only show if press rule is manual and game has started
    const canPress = currentRoundState.pressRule === 'manual' && holeResults.some(r => r !== null);
    
    if (canPress) {
        const currentHole = findCurrentNassauHole();
        
        // Determine which player can press (generally the one who is down)
        if (currentHole && currentHole <= 18) {
            const status = matchStatus[currentHole - 1];
            
            // Show press button for player who is down
            if (status !== 0) {
                if (p1PressBtn) {
                    p1PressBtn.classList.toggle('hidden', status >= 0); // P1 can press if down (status negative)
                }
                if (p2PressBtn) {
                    p2PressBtn.classList.toggle('hidden', status <= 0); // P2 can press if down (status positive)
                }
            } else {
                // All square, hide both
                p1PressBtn?.classList.add('hidden');
                p2PressBtn?.classList.add('hidden');
            }
        } else {
            // No scores entered yet, hide both
            p1PressBtn?.classList.add('hidden');
            p2PressBtn?.classList.add('hidden');
        }
    } else {
        // Not manual press or no scores, hide both
        p1PressBtn?.classList.add('hidden');
        p2PressBtn?.classList.add('hidden');
    }
    
    // --- 6. Calculate and update settlement ---
    updateNassauSettlement();
}

/**
 * Update Nassau settlement information
 */
function updateNassauSettlement() {
    if (!currentRoundState || currentRoundState.gameType !== 'nassau') return;
    
    const matchStatus = currentRoundState.results.matchStatus;
    const pressResults = currentRoundState.results.pressResults;
    const wager = currentRoundState.wager || 5;
    const p1Name = currentRoundState.players[0] || 'Player 1';
    const p2Name = currentRoundState.players[1] || 'Player 2';
    
    // Extract statuses
    const front9Status = matchStatus[8] || 0; // Status after 9 holes
    const back9StartStatus = front9Status;
    const overallStatus = matchStatus[17] || 0; // Final status
    const back9Status = overallStatus - back9StartStatus; // Change in status on back 9
    
    // Calculate monetary values
    const front9Value = front9Status === 0 ? 0 : (front9Status > 0 ? wager : -wager);
    const back9Value = back9Status === 0 ? 0 : (back9Status > 0 ? wager : -wager);
    const overallValue = overallStatus === 0 ? 0 : (overallStatus > 0 ? wager : -wager);
    
    // Calculate press values
    let pressesTotal = 0;
    for (const press of pressResults || []) {
        if (press.finalStatus !== 0) {
            pressesTotal += (press.finalStatus > 0) ? wager : -wager;
        }
    }
    
    // Calculate total and determine winner
    const totalValue = front9Value + back9Value + overallValue + pressesTotal;
    const settlement = {
        front9StatusText: formatMatchStatus(front9Status, 0, true, p1Name, p2Name),
        front9AmountText: formatCurrency(Math.abs(front9Value)),
        back9StatusText: formatMatchStatus(back9Status, 0, true, p1Name, p2Name),
        back9AmountText: formatCurrency(Math.abs(back9Value)),
        overallStatusText: formatMatchStatus(overallStatus, 0, true, p1Name, p2Name),
        overallAmountText: formatCurrency(Math.abs(overallValue)),
        pressesCount: pressResults?.length || 0,
        pressesAmountText: formatCurrency(Math.abs(pressesTotal)),
    };
    
    // Determine final outcome
    if (totalValue === 0) {
        settlement.summaryText = "All square - no money changes hands";
        settlement.winnerName = "Match Tied";
        settlement.totalAmount = formatCurrency(0);
    } else if (totalValue > 0) {
        settlement.summaryText = `${p2Name} owes ${p1Name} ${formatCurrency(totalValue)}`;
        settlement.winnerName = p1Name;
        settlement.totalAmount = formatCurrency(totalValue);
    } else {
        settlement.summaryText = `${p1Name} owes ${p2Name} ${formatCurrency(Math.abs(totalValue))}`;
        settlement.winnerName = p2Name;
        settlement.totalAmount = formatCurrency(Math.abs(totalValue));
    }
    
    currentRoundState.settlement = settlement;
    
    // Update UI
    document.getElementById('nassau-settlement-front9-status').textContent = settlement.front9StatusText;
    document.getElementById('nassau-settlement-back9-status').textContent = settlement.back9StatusText;
    document.getElementById('nassau-settlement-overall-status').textContent = settlement.overallStatusText;
    document.getElementById('nassau-settlement-presses-count').textContent = settlement.pressesCount;
    
    document.getElementById('nassau-settlement-front9-amount').textContent = settlement.front9AmountText;
    document.getElementById('nassau-settlement-back9-amount').textContent = settlement.back9AmountText;
    document.getElementById('nassau-settlement-overall-amount').textContent = settlement.overallAmountText;
    document.getElementById('nassau-settlement-presses-amount').textContent = settlement.pressesAmountText;
    
    document.getElementById('nassau-settlement-winner-name').textContent = settlement.winnerName;
    document.getElementById('nassau-settlement-total-amount').textContent = settlement.totalAmount;
    document.getElementById('nassau-settlement-summary-text').textContent = settlement.summaryText;
}

// Global state
let currentRoundState = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const startTime = performanceMonitor.startTimer();
    
    try {
        // Initialize state recovery
        initializeRecovery();
        
        // Load saved state or attempt recovery
        if (!loadState() && !attemptStateRecovery()) {
            showGameSelection();
        }
        
        // Set up event listeners
        setupEventListeners();
        
        performanceMonitor.endTimer(startTime, 'init');
    } catch (error) {
        console.error('Initialization error:', error);
        showAlert('Failed to initialize application', 'error');
    }
});

/**
 * Show the scorecard for a specific game type
 * @param {string} gameType - The type of game to show
 */
export function showScorecard(gameType) {
    // Hide all game cards
    document.querySelectorAll('.game-card').forEach(card => {
        card.classList.add('hidden');
    });
    
    // Show the selected game card
    const selectedCard = document.getElementById(`${gameType}-card`);
    if (selectedCard) {
        selectedCard.classList.remove('hidden');
    }
    
    // Set current game type
    currentRoundState.gameType = gameType;
    
    // Initialize game-specific functionality
    switch (gameType) {
        case 'nassau':
            generateNassauRows();
            initializeNassau();
            populateNassau();
            break;
        case 'vegas':
            generateVegasRows();
            initializeVegas();
            populateVegas();
            break;
        // Add other game types here
    }
    
    // Save state
    saveState();
}

/**
 * Show the game selection screen
 */
export function showGameSelection() {
    // Hide all game cards
    document.querySelectorAll('.game-card').forEach(card => {
        card.classList.add('hidden');
    });
    
    // Show game selection
    document.getElementById('game-selection').classList.remove('hidden');
    
    // Clear current round
    clearCurrentRound();
}

/**
 * Clear the current round
 */
export function clearCurrentRound() {
    // Clear state
    clearState();
    
    // Reset displays
    resetNassauDisplay();
    resetVegasDisplay();
    // Add other game resets here
    
    // Show game selection
    showGameSelection();
}

// Update game state with performance monitoring
export function updateGameState() {
    const startTime = performanceMonitor.startTimer();
    
    try {
        switch (currentRoundState.gameType) {
            case 'nassau':
                updateNassau();
                break;
            case 'wolf':
                updateWolf();
                break;
            // ... other game types ...
        }
        
        saveState();
        performanceMonitor.endTimer(startTime, 'update');
    } catch (error) {
        console.error('State update error:', error);
        showAlert('Failed to update game state', 'error');
    }
}

// Handle input changes with validation
function handleInputChange(event) {
    const input = event.target;
    const value = sanitizeInput(input.value);
    
    if (input.type === 'number') {
        const min = parseInt(input.min) || 0;
        const max = parseInt(input.max) || 100;
        
        if (!validateNumericInput(value, min, max)) {
            showAlert(`Please enter a number between ${min} and ${max}`, 'error');
            input.value = input.defaultValue;
            return;
        }
    }
    
    input.value = value;
    updateGameState();
}

// Set up event listeners with error handling
function setupEventListeners() {
    try {
        // Game selection
        document.querySelectorAll('.game-selection-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const gameType = e.target.dataset.gameType;
                if (gameType) {
                    showScorecard(gameType);
                }
            });
        });
        
        // Input handling
        document.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', handleInputChange);
        });
        
        // New round button
        const newRoundBtn = document.getElementById('newRoundBtn');
        if (newRoundBtn) {
            newRoundBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to start a new round? All current progress will be lost.')) {
                    clearCurrentRound();
                }
            });
        }
    } catch (error) {
        console.error('Event listener setup error:', error);
        showAlert('Failed to set up event listeners', 'error');
    }
}

// ... rest of existing code ...