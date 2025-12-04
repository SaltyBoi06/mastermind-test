// Simple Mastermind implementation (4 pegs, 6 colors, 10 tries)

// CONFIG
const PEGS = 4;
const COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#facc15', // yellow
  '#4ade80', // green
  '#60a5fa', // blue
  '#a78bfa'  // purple
];
const MAX_TRIES = 10;

// STATE
let secret = [];       // array of numbers 0..5
let attempts = [];
let currentGuess = [];
let selectedColor = 0;

// DOM refs
const boardEl = document.getElementById('board');
const paletteEl = document.getElementById('palette');
const currentRowEl = document.getElementById('current-row');
const submitBtn = document.getElementById('submit-btn');
const clearBtn = document.getElementById('clear-btn');
const newBtn = document.getElementById('new-btn');
const statusEl = document.getElementById('status');

// --- helper functions
function randInt(n){ return Math.floor(Math.random()*n); }

function makeSecret(){
  secret = [];
  for(let i=0;i<PEGS;i++){
    secret.push(randInt(COLORS.length));
  }
}

function resetState(){
  attempts = [];
  currentGuess = [];
  selectedColor = 0;
  boardEl.innerHTML = '';
  currentRowEl.innerHTML = '';
  statusEl.textContent = '';
  createBoardRows();
  createPalette();
  createCurrentSlots();
  makeSecret();
  console.log('Secret (dev):', secret); // remove in production
}

// create empty visual rows
function createBoardRows(){
  for(let i=0;i<MAX_TRIES;i++){
    const row = document.createElement('div');
    row.className = 'row';
    row.dataset.index = i;

    const slots = document.createElement('div');
    slots.className = 'slots';
    for(let s=0;s<PEGS;s++){
      const p = document.createElement('div');
      p.className = 'peg';
      slots.appendChild(p);
    }

    const feedback = document.createElement('div');
    feedback.className = 'feedback';
    for(let f=0;f<PEGS;f++){
      const d = document.createElement('div');
      d.className = 'fb-dot';
      feedback.appendChild(d);
    }

    row.appendChild(slots);
    row.appendChild(feedback);
    boardEl.appendChild(row);
  }
}

// create palette buttons
function createPalette(){
  paletteEl.innerHTML = '';
  COLORS.forEach((c, idx)=>{
    const b = document.createElement('button');
    b.className = 'color-btn' + (idx===selectedColor?' selected':'');
    b.style.background = c;
    b.title = `Color ${idx+1}`;
    b.addEventListener('click', ()=> {
      document.querySelectorAll('.color-btn').forEach(x=>x.classList.remove('selected'));
      b.classList.add('selected');
      selectedColor = idx;
    });
    paletteEl.appendChild(b);
  });
}

// create current slots where user places pegs before submitting
function createCurrentSlots(){
  currentRowEl.innerHTML = '';
  for(let i=0;i<PEGS;i++){
    const s = document.createElement('div');
    s.className = 'slot-temp';
    s.dataset.pos = i;
    s.addEventListener('click', ()=> {
      // place selected color at that position (toggle)
      currentGuess[i] = selectedColor;
      renderCurrentGuess();
    });
    currentRowEl.appendChild(s);
  }
  renderCurrentGuess();
}

function renderCurrentGuess(){
  const slots = currentRowEl.querySelectorAll('.slot-temp');
  slots.forEach((el, i)=>{
    el.style.background = currentGuess[i] !== undefined ? COLORS[currentGuess[i]] : 'transparent';
    el.style.borderStyle = currentGuess[i] !== undefined ? 'solid' : 'dashed';
  });
}

// evaluate guess -> returns {black, white}
function evaluateGuess(guess, code){
  // both are arrays of ints
  let black = 0, white = 0;
  const codeCopy = code.slice();
  const guessCopy = guess.slice();

  // first pass: exact matches
  for(let i=0;i<PEGS;i++){
    if(guessCopy[i] === codeCopy[i]){
      black++;
      guessCopy[i] = codeCopy[i] = null;
    }
  }

  // second pass: color-only matches
  for(let i=0;i<PEGS;i++){
    if(guessCopy[i] === null) continue;
    const pos = codeCopy.indexOf(guessCopy[i]);
    if(pos !== -1){
      white++;
      codeCopy[pos] = null;
    }
  }

  return {black, white};
}

// render attempt to board visual
function renderAttempt(attemptIndex, guess, feedback){
  const rows = boardEl.querySelectorAll('.row');
  // show from top to bottom: we want earliest attempt at top -> row 0 is top; but we inverted board to visually show newest bottom via flex-direction column-reverse
  const row = rows[attemptIndex];
  const pegs = row.querySelectorAll('.peg');
  guess.forEach((g,i)=> {
    pegs[i].style.background = COLORS[g];
  });
  const fb = row.querySelectorAll('.fb-dot');
  // fill black first then white
  let idx=0;
  for(let i=0;i<feedback.black;i++){
    fb[idx].classList.add('fb-black');
    idx++;
  }
  for(let i=0;i<feedback.white;i++){
    fb[idx].classList.add('fb-white');
    idx++;
  }
}

// UI actions
submitBtn.addEventListener('click', () => {
  if(currentGuess.length !== PEGS || currentGuess.some(x=>x===undefined)){
    statusEl.textContent = 'Fill all pegs before submitting.';
    return;
  }

  if(attempts.length >= MAX_TRIES){
    statusEl.textContent = 'No tries left — start a new game.';
    return;
  }

  const guess = currentGuess.slice();
  const feedback = evaluateGuess(guess, secret);
  const attemptIndex = attempts.length;

  attempts.push({guess, feedback});
  renderAttempt(attemptIndex, guess, feedback);

  // check win / lose
  if(feedback.black === PEGS){
    statusEl.textContent = `You cracked it in ${attempts.length} tries! Secret: ${secret.map(i=>i+1).join(',')}`;
    disableInputs();
    return;
  } else {
    statusEl.textContent = `Result — black: ${feedback.black}, white: ${feedback.white} (tries left: ${MAX_TRIES - attempts.length})`;
  }

  if(attempts.length >= MAX_TRIES){
    statusEl.textContent = `Out of tries — you lose. Secret was: ${secret.map(i=>i+1).join(',')}`;
    disableInputs();
    return;
  }

  // prepare for next guess
  currentGuess = [];
  renderCurrentGuess();
});

clearBtn.addEventListener('click', ()=>{
  currentGuess = [];
  renderCurrentGuess();
  statusEl.textContent = '';
});

newBtn.addEventListener('click', resetState);

function disableInputs(){
  // prevent further interaction (simple)
  document.querySelectorAll('.slot-temp').forEach(s => s.style.pointerEvents = 'none');
  submitBtn.disabled = true;
  clearBtn.disabled = true;
}

// initialize on load
resetState();
