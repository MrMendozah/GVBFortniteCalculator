import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'

// Parse shorthand like 100k, 1mil, 500k into actual numbers
const parseNumber = (value) => {
  if (!value) return 0
  const str = value.toString().toLowerCase().trim()
  
  if (str.includes('mil') || str.includes('m')) {
    return parseFloat(str) * 1000000
  } else if (str.includes('k')) {
    return parseFloat(str) * 1000
  }
  return parseFloat(str) || 0
}

// Format number back to display (21300000 -> 21.3mil)
const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'mil'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(0) + 'k'
  }
  return num.toString()
}

// Custom hook for localStorage with SSR safety
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(initialValue)
  const [firstLoadDone, setFirstLoadDone] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const item = window.localStorage.getItem(key)
        if (item) {
          setStoredValue(JSON.parse(item))
        }
      } catch (error) {
        console.error('Error loading from localStorage:', error)
      }
      setFirstLoadDone(true)
    }
  }, [key])

  useEffect(() => {
    if (firstLoadDone && typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(key, JSON.stringify(storedValue))
      } catch (error) {
        console.error('Error saving to localStorage:', error)
      }
    }
  }, [storedValue, firstLoadDone, key])

  return [storedValue, setStoredValue]
}

export default function TradeCalculator() {
  const canvasRef = useRef(null)
  const [player1Total, setPlayer1Total] = useLocalStorage('player1Total', '')
  const [player1TradeSlots, setPlayer1TradeSlots] = useLocalStorage('player1TradeSlots', ['', '', '', '', '', ''])
  const [player1FromInventory, setPlayer1FromInventory] = useLocalStorage('player1FromInventory', [false, false, false, false, false, false])
  const [player2TradeSlots, setPlayer2TradeSlots] = useLocalStorage('player2TradeSlots', ['', '', '', '', '', ''])
  const [lowestPlantDamage, setLowestPlantDamage] = useLocalStorage('lowestPlantDamage', '')
  const [lowestPlantCount, setLowestPlantCount] = useLocalStorage('lowestPlantCount', '')
  const [useManualInventory, setUseManualInventory] = useLocalStorage('useManualInventory', false)
  const [inventoryPlants, setInventoryPlants] = useLocalStorage('inventoryPlants', Array(35).fill(''))

  // Particle animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles = []
    const particleCount = 50

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 3 + 1
        this.speedX = Math.random() * 1 - 0.5
        this.speedY = Math.random() * 1 - 0.5
        this.opacity = Math.random() * 0.5 + 0.2
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY

        if (this.x > canvas.width) this.x = 0
        if (this.x < 0) this.x = canvas.width
        if (this.y > canvas.height) this.y = 0
        if (this.y < 0) this.y = canvas.height
      }

      draw() {
        ctx.fillStyle = `rgba(139, 92, 246, ${this.opacity})`
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle())
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      particles.forEach(particle => {
        particle.update()
        particle.draw()
      })

      // Draw connections
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach(b => {
          const dx = a.x - b.x
          const dy = a.y - b.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 150) {
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.2 * (1 - distance / 150)})`
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        })
      })

      requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Calculate trade outcome
  const calculateTrade = () => {
    // Calculate total - either from manual inventory or from input
    const calculatedTotal = inventoryPlants.reduce((sum, plant) => sum + parseNumber(plant), 0)
    const p1Total = useManualInventory ? calculatedTotal : parseNumber(player1Total)
    
    const lowestDamage = parseNumber(lowestPlantDamage)
    const lowestCount = parseNumber(lowestPlantCount)
    
    // Calculate what you're giving away
    let p1GivingFromBase = 0
    let p1GivingFromInventory = 0
    
    player1TradeSlots.forEach((plant, index) => {
      const value = parseNumber(plant)
      if (player1FromInventory[index]) {
        p1GivingFromInventory += value
      } else {
        p1GivingFromBase += value
      }
    })
    
    const p1TotalGiving = p1GivingFromBase + p1GivingFromInventory
    
    // Calculate what you're receiving and the replacement gain
    const receivedPlants = player2TradeSlots.filter(plant => parseNumber(plant) > 0)
    const p2Giving = receivedPlants.reduce((sum, plant) => sum + parseNumber(plant), 0)
    const receivedPlantCount = receivedPlants.length
    
    // Calculate replacement gain: received plants replace lowest plants
    let actualReceivingGain = 0
    let replacementDetails = []
    
    if (lowestDamage > 0 && receivedPlantCount > 0) {
      // Each received plant replaces a lowest plant
      receivedPlants.forEach(plant => {
        const receivedValue = parseNumber(plant)
        const gainPerPlant = receivedValue - lowestDamage
        actualReceivingGain += gainPerPlant
        replacementDetails.push({
          received: receivedValue,
          replaced: lowestDamage,
          gain: gainPerPlant
        })
      })
    } else {
      // If no lowest plant data, assume full value is gained
      actualReceivingGain = p2Giving
    }
    
    // Calculate total plant damage for lowest plants
    const totalLowestPlantDamage = lowestDamage * lowestCount
    
    // Calculate raw difference (what you receive vs what you give)
    const rawDifference = p2Giving - p1TotalGiving
    
    // Net change calculation
    // From inventory: ADD (removing from storage adds to base)
    // From base: SUBTRACT (trading away reduces base)
    // Receiving: ADD the actual gain (replacement difference)
    const netChange = p1GivingFromInventory - p1GivingFromBase + actualReceivingGain
    
    // New total after trade
    const p1NewTotal = p1Total + netChange
    
    return {
      p1NewTotal,
      netChange,
      rawDifference,
      actualReceivingGain,
      p1IsGood: netChange > 0,
      p1TotalGiving,
      p1GivingFromBase,
      p1GivingFromInventory,
      p2Giving,
      receivedPlantCount,
      replacementDetails,
      totalLowestPlantDamage,
      lowestDamage,
      lowestCount,
      p1Total
    }
  }

  const trade = calculateTrade()

  const updateTradeSlot = (player, index, value) => {
    if (player === 1) {
      const newSlots = [...player1TradeSlots]
      newSlots[index] = value
      setPlayer1TradeSlots(newSlots)
    } else {
      const newSlots = [...player2TradeSlots]
      newSlots[index] = value
      setPlayer2TradeSlots(newSlots)
    }
  }

  const toggleFromInventory = (index) => {
    const newFlags = [...player1FromInventory]
    newFlags[index] = !newFlags[index]
    setPlayer1FromInventory(newFlags)
  }

  const updateInventoryPlant = (index, value) => {
    const newPlants = [...inventoryPlants]
    newPlants[index] = value
    setInventoryPlants(newPlants)
  }

  const clearPlayer1 = () => {
    setPlayer1TradeSlots(['', '', '', '', '', ''])
    setPlayer1FromInventory([false, false, false, false, false, false])
    setPlayer1Total('')
    setLowestPlantDamage('')
    setLowestPlantCount('')
    setInventoryPlants(Array(35).fill(''))
  }

  const clearPlayer2 = () => {
    setPlayer2TradeSlots(['', '', '', '', '', ''])
  }

  return (
    <>
      <Head>
        <title>GVB Fortnite Trade Calculator</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, zIndex: -1, pointerEvents: 'none' }} />

      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #581c87, #1e3a8a, #312e81)', padding: '3rem 1rem', position: 'relative' }}>
        <div style={{ maxWidth: '90rem', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }} className="animate-fade-in">
            <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>
              GVB Fortnite Trade Calculator
            </h1>
            <p style={{ color: '#d1d5db', fontSize: '1.125rem' }}>
              Calculate 2x3 plant trades • Track your inventory • Auto-saves your data
            </p>
          </div>

          {/* Trade Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
            {/* Player 1 */}
            <div className="glass-card animate-slide-up">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', margin: 0 }}>
                  <span style={{ background: '#3b82f6', width: '2.5rem', height: '2.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '0.75rem' }}>1</span>
                  Player 1 (You)
                </h2>
                <button onClick={clearPlayer1} className="clear-btn">
                  Clear All
                </button>
              </div>

              {/* Inventory Mode Toggle */}
              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px', border: '2px solid rgba(139, 92, 246, 0.3)' }}>
                <label style={{ color: '#d1d5db', fontSize: '0.875rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={useManualInventory}
                    onChange={(e) => setUseManualInventory(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  Track all 35 plants manually for accurate total
                </label>
              </div>

              {/* Total Damage Input or Inventory */}
              {!useManualInventory ? (
                <>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ color: '#d1d5db', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                      Total Base Damage
                    </label>
                    <input
                      type="text"
                      value={player1Total}
                      onChange={(e) => setPlayer1Total(e.target.value)}
                      placeholder="e.g., 21.3mil or 100k"
                      className="input-field"
                    />
                  </div>

                  {/* Lowest Plant Info - Only show when NOT using manual inventory */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label style={{ color: '#d1d5db', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                        Lowest Plant Damage
                      </label>
                      <input
                        type="text"
                        value={lowestPlantDamage}
                        onChange={(e) => setLowestPlantDamage(e.target.value)}
                        placeholder="e.g., 700k"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label style={{ color: '#d1d5db', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                        # of Lowest Plants
                      </label>
                      <input
                        type="text"
                        value={lowestPlantCount}
                        onChange={(e) => setLowestPlantCount(e.target.value)}
                        placeholder="e.g., 35"
                        className="input-field"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ color: '#d1d5db', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', display: 'block' }}>
                    All 35 Plants Inventory
                    <span style={{ marginLeft: '0.5rem', color: '#a78bfa', fontSize: '0.875rem' }}>
                      (Total: {formatNumber(trade.p1Total)})
                    </span>
                  </label>
                  <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }} className="custom-scrollbar">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                      {inventoryPlants.map((plant, index) => (
                        <input
                          key={index}
                          type="text"
                          value={plant}
                          onChange={(e) => updateInventoryPlant(index, e.target.value)}
                          placeholder={`Plant ${index + 1}`}
                          className="input-field-small"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Trade Slots */}
              <label style={{ color: '#d1d5db', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', display: 'block' }}>
                Plants Trading Away (2x3 Grid)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.875rem' }}>
                {player1TradeSlots.map((plant, index) => (
                  <div key={index}>
                    <input
                      type="text"
                      value={plant}
                      onChange={(e) => updateTradeSlot(1, index, e.target.value)}
                      placeholder={`Plant ${index + 1}`}
                      className="input-field-small"
                    />
                    <label style={{ color: '#d1d5db', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={player1FromInventory[index]}
                        onChange={() => toggleFromInventory(index)}
                        style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                      />
                      From Inventory
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Player 2 */}
            <div className="glass-card animate-slide-up-delay">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', margin: 0 }}>
                  <span style={{ background: '#22c55e', width: '2.5rem', height: '2.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '0.75rem' }}>2</span>
                  Player 2
                </h2>
                <button onClick={clearPlayer2} className="clear-btn">
                  Clear All
                </button>
              </div>

              <label style={{ color: '#d1d5db', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', display: 'block' }}>
                Plants Trading to You (2x3 Grid)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.875rem' }}>
                {player2TradeSlots.map((plant, index) => (
                  <input
                    key={index}
                    type="text"
                    value={plant}
                    onChange={(e) => updateTradeSlot(2, index, e.target.value)}
                    placeholder={`Plant ${index + 1}`}
                    className="input-field-small"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="glass-card animate-fade-in-delay">
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '1.5rem', textAlign: 'center' }}>
              Trade Analysis
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {/* Trade Summary */}
              <div className="result-card" style={{ borderColor: '#8b5cf6' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: '#d1d5db', marginBottom: '0.75rem', fontSize: '0.875rem' }}>You're Trading (Total)</p>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6', marginBottom: '0.5rem' }}>
                    {formatNumber(trade.p1TotalGiving)}
                  </p>
                  
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    {trade.p1GivingFromInventory > 0 && (
                      <div style={{ fontSize: '0.75rem', color: '#a78bfa', marginBottom: '0.5rem' }}>
                        <p>✓ From Inventory: {formatNumber(trade.p1GivingFromInventory)}</p>
                        <p style={{ fontSize: '0.7rem', color: '#9ca3af' }}>(Adds to base)</p>
                      </div>
                    )}
                    {trade.p1GivingFromBase > 0 && (
                      <div style={{ fontSize: '0.75rem', color: '#f87171' }}>
                        <p>✗ From Base: {formatNumber(trade.p1GivingFromBase)}</p>
                        <p style={{ fontSize: '0.7rem', color: '#9ca3af' }}>(Reduces base)</p>
                      </div>
                    )}
                  </div>
                  
                  <p style={{ color: '#d1d5db', marginTop: '1rem', marginBottom: '0.75rem', fontSize: '0.875rem' }}>You're Receiving (Total Value)</p>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#22c55e', marginBottom: '0.5rem' }}>
                    {formatNumber(trade.p2Giving)}
                  </p>

                  {/* Replacement Gain Breakdown */}
                  {trade.lowestDamage > 0 && trade.receivedPlantCount > 0 && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <p style={{ color: '#d1d5db', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                        Plant Replacement ({trade.receivedPlantCount} plants)
                      </p>
                      {trade.replacementDetails.map((detail, idx) => (
                        <div key={idx} style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                          <p style={{ color: detail.gain >= 0 ? '#4ade80' : '#f87171' }}>
                            {formatNumber(detail.received)} - {formatNumber(detail.replaced)} = 
                            <span style={{ fontWeight: 'bold', marginLeft: '0.25rem' }}>
                              {detail.gain >= 0 ? '+' : ''}{formatNumber(detail.gain)}
                            </span>
                          </p>
                        </div>
                      ))}
                      <p style={{ color: '#22c55e', fontSize: '0.875rem', fontWeight: 'bold', marginTop: '0.75rem' }}>
                        Actual Gain: {trade.actualReceivingGain >= 0 ? '+' : ''}{formatNumber(trade.actualReceivingGain)}
                      </p>
                    </div>
                  )}

                  {/* Raw Difference */}
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <p style={{ color: '#d1d5db', fontSize: '0.75rem', marginBottom: '0.5rem' }}>Raw Trade Difference</p>
                    <p style={{ 
                      fontSize: '1.25rem', 
                      fontWeight: 'bold', 
                      color: trade.rawDifference >= 0 ? '#4ade80' : '#f87171'
                    }}>
                      {trade.rawDifference >= 0 ? '+' : ''}{formatNumber(trade.rawDifference)}
                    </p>
                    <p style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                      (Total Received - Total Given)
                    </p>
                  </div>
                  
                  {!useManualInventory && trade.lowestCount > 0 && (
                    <>
                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <p style={{ color: '#d1d5db', fontSize: '0.75rem', marginBottom: '0.5rem' }}>Your Lowest Plants</p>
                        <p style={{ color: '#a78bfa', fontSize: '0.875rem', fontWeight: '600' }}>
                          {formatNumber(trade.lowestDamage)} × {trade.lowestCount} plants
                        </p>
                        <p style={{ color: '#8b5cf6', fontSize: '1rem', fontWeight: 'bold', marginTop: '0.25rem' }}>
                          Total: {formatNumber(trade.totalLowestPlantDamage)}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Final Result */}
              <div className="result-card" style={{ borderColor: trade.p1IsGood ? '#4ade80' : '#f87171' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: '#d1d5db', marginBottom: '0.5rem', fontSize: '0.75rem' }}>
                    {useManualInventory ? 'Current Total (From Inventory)' : 'Current Total'}
                  </p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#9ca3af', marginBottom: '0.5rem' }}>
                    {formatNumber(trade.p1Total)}
                  </p>
                  
                  <div style={{ margin: '1.5rem 0', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                    <p style={{ color: '#d1d5db', fontSize: '0.75rem', marginBottom: '0.5rem' }}>Net Base Change</p>
                    <p style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: 'bold', 
                      color: trade.netChange >= 0 ? '#4ade80' : '#f87171',
                      marginBottom: '0.5rem'
                    }}>
                      {trade.netChange >= 0 ? '+' : ''}{formatNumber(trade.netChange)}
                    </p>
                    <div style={{ fontSize: '0.7rem', color: '#9ca3af', lineHeight: '1.4' }}>
                      {trade.p1GivingFromInventory > 0 && <p>+{formatNumber(trade.p1GivingFromInventory)} (from inventory)</p>}
                      {trade.p1GivingFromBase > 0 && <p>-{formatNumber(trade.p1GivingFromBase)} (from base)</p>}
                      {trade.actualReceivingGain > 0 && <p>+{formatNumber(trade.actualReceivingGain)} (replacement gain)</p>}
                    </div>
                  </div>
                  
                  <p style={{ color: '#d1d5db', marginBottom: '0.75rem', fontSize: '0.875rem' }}>New Total After Trade</p>
                  <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.75rem' }}>
                    {formatNumber(trade.p1NewTotal)}
                  </p>
                  
                  <p style={{ 
                    marginTop: '0.5rem', 
                    padding: '0.5rem 1.5rem', 
                    borderRadius: '9999px', 
                    display: 'inline-block', 
                    fontSize: '0.875rem', 
                    fontWeight: 'bold',
                    background: trade.p1IsGood ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: trade.p1IsGood ? '#4ade80' : '#f87171'
                  }}>
                    {trade.p1IsGood ? '✓ GOOD TRADE' : '✗ BAD TRADE'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        html, body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 2rem;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }

        .input-field, .input-field-small {
          outline: none !important;
          border: 2px solid rgba(139, 92, 246, 0.3);
        }

        .input-field {
          width: 100%;
          padding: 14px 18px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: white;
          font-size: 16px;
          transition: all 0.3s ease;
          font-family: inherit;
        }

        .input-field:focus {
          border-color: rgba(139, 92, 246, 0.7);
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
        }

        .input-field-small {
          width: 100%;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          color: white;
          font-size: 14px;
          transition: all 0.3s ease;
          font-family: inherit;
        }

        .input-field-small:focus {
          border-color: rgba(139, 92, 246, 0.7);
          background: rgba(255, 255, 255, 0.12);
          transform: scale(1.02);
          box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
        }

        .input-field::placeholder,
        .input-field-small::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .clear-btn {
          background: rgba(239, 68, 68, 0.2);
          border: 2px solid rgba(239, 68, 68, 0.5);
          color: #f87171;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .clear-btn:hover {
          background: rgba(239, 68, 68, 0.3);
          border-color: rgba(239, 68, 68, 0.7);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        .result-card {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 16px;
          padding: 2rem;
          border: 2px solid;
          transition: all 0.3s ease;
        }

        .result-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.5);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.7);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out;
        }

        .animate-fade-in-delay {
          animation: fadeIn 0.8s ease-out 0.3s both;
        }

        .animate-slide-up {
          animation: slideUp 0.6s ease-out;
        }

        .animate-slide-up-delay {
          animation: slideUp 0.6s ease-out 0.2s both;
        }
      `}</style>
    </>
  )
}
