import './style.css'

const app = document.querySelector('#app')

app.innerHTML = `
  <main class="machine">
    <section class="machine-body">
      <section class="reels-frame">
        <div class="reel-window"><div class="reel-track" id="reel-0"></div></div>
        <div class="reel-window"><div class="reel-track" id="reel-1"></div></div>
        <div class="reel-window"><div class="reel-track" id="reel-2"></div></div>
      </section>

      <div class="lever-wrap" aria-hidden="true">
        <div class="lever-base"></div>
        <div id="lever">
          <span class="lever-rod"></span>
          <span class="lever-knob"></span>
        </div>
      </div>
    </section>

    <section class="controls">
      <button id="spin-btn" type="button">SPIN</button>
    </section>

    <footer class="status">
      <p id="result">Press spin.</p>
    </footer>
  </main>
`

const symbols = [
  { id: 'choco', name: 'Chocolate Chip', icon: '🍪', mark: '' },
  { id: 'sugar', name: 'Sugar Dollar', icon: '🍘', mark: '$' },
  { id: 'gold', name: 'Golden 7', icon: '🍪', mark: '7' }
]

const reelCount = 3
const tileHeight = 180
const stripLength = 220
const tracks = [...Array(reelCount)].map((_, i) => document.querySelector(`#reel-${i}`))
const spinButton = document.querySelector('#spin-btn')
const lever = document.querySelector('#lever')
const result = document.querySelector('#result')

let isSpinning = false
let pendingStops = 0

function createTile(symbol) {
  const tile = document.createElement('div')
  tile.className = `cookie cookie-${symbol.id}`
  tile.innerHTML = `
    <span class="cookie-icon">${symbol.icon}</span>
    <span class="cookie-mark">${symbol.mark}</span>
  `
  return tile
}

function randomSymbolIndex() {
  return Math.floor(Math.random() * symbols.length)
}

function randomStrip(targetSymbolIndex) {
  const values = []
  for (let i = 0; i < stripLength; i += 1) {
    values.push(randomSymbolIndex())
  }

  // Keep stop inside strip so reels never hit blank space.
  const stopIndex = 150 + Math.floor(Math.random() * 40)
  values[stopIndex] = targetSymbolIndex
  return { values, stopIndex }
}

function applyStrip(track, values) {
  const fragment = document.createDocumentFragment()
  values.forEach((value) => fragment.appendChild(createTile(symbols[value])))
  track.innerHTML = ''
  track.appendChild(fragment)
}

function chooseOutcome() {
  const roll = Math.random()
  
  if (roll < 0.01) {
    // #region agent log
    fetch('http://127.0.0.1:7821/ingest/b27507fc-d476-4071-b428-c2c8b22fa287',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'91ebaa'},body:JSON.stringify({sessionId:'91ebaa',runId:'post-fix',hypothesisId:'H2',location:'src/main.js:chooseOutcome',message:'Outcome selected',data:{roll,outcomeType:'jackpot',stops:[2,2,2]},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return { type: 'jackpot', stops: [2, 2, 2] } // 1%
  }
  
  if (roll < 0.21) {
    // #region agent log
    fetch('http://127.0.0.1:7821/ingest/b27507fc-d476-4071-b428-c2c8b22fa287',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'91ebaa'},body:JSON.stringify({sessionId:'91ebaa',runId:'post-fix',hypothesisId:'H2',location:'src/main.js:chooseOutcome',message:'Outcome selected',data:{roll,outcomeType:'sugar',stops:[1,1,1]},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return { type: 'sugar', stops: [1, 1, 1] } // 20%
  }
  
  if (roll < 0.30) {
    // #region agent log
    fetch('http://127.0.0.1:7821/ingest/b27507fc-d476-4071-b428-c2c8b22fa287',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'91ebaa'},body:JSON.stringify({sessionId:'91ebaa',runId:'post-fix',hypothesisId:'H2',location:'src/main.js:chooseOutcome',message:'Outcome selected',data:{roll,outcomeType:'cookie',stops:[0,0,0]},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return { type: 'cookie', stops: [0, 0, 0] } // 9%
  }

  // 70% loss: guarantee not triple.
  let a = randomSymbolIndex()
  let b = randomSymbolIndex()
  let c = randomSymbolIndex()
  while (a === b && b === c) {
    a = randomSymbolIndex()
    b = randomSymbolIndex()
    c = randomSymbolIndex()
  }
  // #region agent log
  fetch('http://127.0.0.1:7821/ingest/b27507fc-d476-4071-b428-c2c8b22fa287',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'91ebaa'},body:JSON.stringify({sessionId:'91ebaa',runId:'post-fix',hypothesisId:'H2',location:'src/main.js:chooseOutcome',message:'Outcome selected',data:{roll,outcomeType:'loss',stops:[a,b,c]},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  return { type: 'loss', stops: [a, b, c] }
}

function settleSpin(outcome) {
  if (outcome.type === 'jackpot') {
    result.textContent = '777 JACKPOT!'
  } else if (outcome.type === 'sugar') {
    result.textContent = 'Sugar triple!'
  } else if (outcome.type === 'cookie') {
    result.textContent = 'Chocolate chip triple!'
  } else {
    result.textContent = 'No win. Spin again.'
  }
}

function seedReels() {
  tracks.forEach((track) => {
    const seed = randomStrip(randomSymbolIndex())
    applyStrip(track, seed.values)
    const topIndex = seed.stopIndex - 1
    track.style.transition = 'none'
    track.style.transform = `translateY(${-topIndex * tileHeight}px)`
  })
}

function spin() {
  if (isSpinning) return
  isSpinning = true
  spinButton.disabled = true
  result.textContent = 'Spinning...'
  lever.classList.add('pull')
  window.setTimeout(() => lever.classList.remove('pull'), 300)

  const outcome = chooseOutcome()
  pendingStops = reelCount
  const actualStops = []

  tracks.forEach((track, reelIdx) => {
    const targetSymbol = outcome.stops[reelIdx]
    const strip = randomStrip(targetSymbol)
    applyStrip(track, strip.values)

    const topStopIndex = strip.stopIndex - 1
    const totalSteps = topStopIndex
    const duration = 1200 + reelIdx * 450
    const topVisibleIndex = totalSteps
    const visibleSequence = [
      strip.values[topVisibleIndex % stripLength],
      strip.values[(topVisibleIndex + 1) % stripLength],
      strip.values[(topVisibleIndex + 2) % stripLength],
      strip.values[(topVisibleIndex + 3) % stripLength]
    ]
    const centerSymbol = strip.values[(topVisibleIndex + 1) % stripLength]
    actualStops[reelIdx] = centerSymbol

    // #region agent log
    fetch('http://127.0.0.1:7821/ingest/b27507fc-d476-4071-b428-c2c8b22fa287',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'91ebaa'},body:JSON.stringify({sessionId:'91ebaa',runId:'post-fix',hypothesisId:'H3',location:'src/main.js:spin.reel',message:'Reel stop computation',data:{reelIdx,targetSymbol,stopIndex:strip.stopIndex,topStopIndex,totalSteps,topVisibleIndex,visibleSequence,centerSymbol},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    track.style.transition = 'none'
    track.style.transform = 'translateY(0px)'

    requestAnimationFrame(() => {
      track.style.transition = `transform ${duration}ms cubic-bezier(0.1, 0.72, 0.1, 1)`
      const finalOffset = -(totalSteps * tileHeight)
      track.style.transform = `translateY(${finalOffset}px)`
    })

    window.setTimeout(() => {
      pendingStops -= 1
      if (pendingStops === 0) {
        // #region agent log
        fetch('http://127.0.0.1:7821/ingest/b27507fc-d476-4071-b428-c2c8b22fa287',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'91ebaa'},body:JSON.stringify({sessionId:'91ebaa',runId:'post-fix',hypothesisId:'H1',location:'src/main.js:spin.complete',message:'Spin finished and UI dimensions sampled',data:{outcomeType:outcome.type,intendedStops:outcome.stops,actualStops,reelWindowHeight:document.querySelector('.reel-window')?.clientHeight,tileHeight},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        isSpinning = false
        spinButton.disabled = false
        settleSpin({ ...outcome, stops: actualStops })
      }
    }, duration + 40)
  })
}

spinButton.addEventListener('click', spin)
seedReels()
