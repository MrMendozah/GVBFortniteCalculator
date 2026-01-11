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
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error)
    }
    setIsLoaded(true)
  }, [key])

  useEffect(() => {
    if (isLoaded) {
      try {
        window.localStorage.setItem(key, JSON.stringify(storedValue))
      } catch (error) {
        console.error('Error saving to localStorage:', error)
      }
    }
  }, [storedValue, isLoaded, key])

  return [storedValue, setStoredValue]
}

export default function TradeCalculator() {
  const canvasRef = useRef(null)
  const [isMounted, setIsMounted] = useState(false)
  const [player1Total, setPlayer1Total] = useLocalStorage('player1Total', '')
  const [player1TradeSlots, setPlayer1TradeSlots] = useLocalStorage('player1TradeSlots', ['', '', '', '', '', ''])
  const [player1FromInventory, setPlayer1FromInventory] = useLocalStorage('player1FromInventory', [false, false, false, false, false, false])
  const [player2TradeSlots, setPlayer2TradeSlots] = useLocalStorage('player2TradeSlots', ['', '', '', '', '', ''])
  const [lowestPlantDamage, setLowestPlantDamage] = useLocalStorage('lowestPlantDamage', '')
  const [lowestPlantCount, setLowestPlantCount] = useLocalStorage('lowestPlantCount', '')
  const [useManualInventory, setUseManualInventory] = useLocalStorage('useManualInventory', false)
  const [inventoryPlants, setInventoryPlants] = useLocalStorage('inventoryPlants', Array(35).fill(''))
  const [sortOrder, setSortOrder] = useLocalStorage('sortOrder', 'none')

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Particle animation
  useEffect(() => {
    if (!isMounted) return
    
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
  }, [isMounted])

  // Check if a plant value exists in base
  const isPlantInBase = (plantValue) => {
    if (!plantValue || !useManualInventory) return false
    return inventoryPlants.some(plant => plant === plantValue)
  }

  // Get sorted inventory for display
  const getSortedInventory = () => {
    const indexed = inventoryPlants.map((plant, index) => ({ plant, index }))
    
    if (sortOrder === 'high') {
      return indexed.sort((a, b) => parseNumber(b.plant) - parseNumber(a.plant))
    } else if (sortOrder === 'low') {
      return indexed.sort((a, b) => parseNumber(a.plant) - parseNumber(b.plant))
    }
    return indexed
  }

  // Add plant to trade slot (only add one instance)
  const addToTrade = (plantValue) => {
    const emptyIndex = player1TradeSlots.findIndex(slot => !slot || slot === '')
    if (emptyIndex !== -1) {
      const newSlots = [...player1TradeSlots]
      newSlots[emptyIndex] = plantValue
      setPlayer1TradeSlots(newSlots)
      
      const newFlags = [...player1FromInventory]
      newFlags[emptyIndex] = false // From base when clicking + button
      setPlayer1FromInventory(newFlags)
    }
  }

  // Remove from trade slot
  const removeFromTrade = (index) => {
    const newSlots = [...player1TradeSlots]
    newSlots[index] = ''
    setPlayer1TradeSlots(newSlots)
    
    const newFlags = [...player1FromInventory]
    newFlags[index] = false
    setPlayer1FromInventory(newFlags)
  }

  // Count how many times this value appears in trade slots (not from inventory)
  const countInTrade = (plantValue) => {
    if (!plantValue) return 0
    return player1TradeSlots.filter((slot, idx) => slot === plantValue && !player1FromInventory[idx]).length
  }

  // Count how many times this value appears in inventory
  const countInInventory = (plantValue) => {
    if (!plantValue) return 0
    return inventoryPlants.filter(plant => plant === plantValue).length
  }

  // Can add more of this plant to trade?
  const canAddToTrade = (plantValue) => {
    if (!plantValue) return false
    const inTrade = countInTrade(plantValue)
    const inInventory = countInInventory(plantValue)
    const hasEmptySlot = player1TradeSlots.some(slot => !slot || slot === '')
    return hasEmptySlot && inTrade < inInventory
  }

  // Calculate trade outcome
  const calculateTrade = () => {
    // Get base plants (excluding those marked as "from inventory" in trade slots)
    const basePlantsList = useManualInventory ? inventoryPlants.filter(p => parseNumber(p) > 0) : []
    
    // Calculate total
    const calculatedTotal = basePlantsList.reduce((sum, plant) => sum + parseNumber(plant), 0)
    const p1Total = useManualInventory ? calculatedTotal : parseNumber(player1Total)
    
    let lowestDamage = 0
    let lowestCount = 0
    
    if (useManualInventory) {
      // Auto-detect from base plants
      const plantValues = basePlantsList
        .map(plant => parseNumber(plant))
        .sort((a, b) => a - b)
      
      if (plantValues.length > 0) {
        lowestDamage = plantValues[0]
        lowestCount = plantValues.filter(val => val === lowestDamage).length
      }
    } else {
      // Use manual input with random variation
      const baseLowest = parseNumber(lowestPlantDamage)
      if (baseLowest > 0) {
        // Random variation: if lowest is 500k, actual could be 500k-599k
        const variation = Math.floor(baseLowest * 0.2) // 20% variation max (e.g., 500k -> up to 600k)
        lowestDamage = baseLowest + Math.floor(Math.random() * variation)
      }
      lowestCount = parseNumber(lowestPlantCount)
    }
    
    // Separate what you're trading from base vs inventory
    let basePlants = []
    let inventoryPlantsGiven = []
    
    player1TradeSlots.forEach((plant, index) => {
      const value = parseNumber(plant)
      if (value > 0) {
        if (player1FromInventory[index]) {
          inventoryPlantsGiven.push(value)
        } else {
          basePlants.push(value)
        }
      }
    })
    
    const p1GivingFromBase = basePlants.reduce((sum, val) => sum + val, 0)
    const p1GivingFromInventory = inventoryPlantsGiven.reduce((sum, val) => sum + val, 0)
    const p1TotalGiving = p1GivingFromBase + p1GivingFromInventory
    
    // Get received plants
    const receivedPlants = player2TradeSlots
      .map(plant => parseNumber(plant))
      .filter(val => val > 0)
      .sort((a, b) => b - a)
    
    const p2Giving = receivedPlants.reduce((sum, val) => sum + val, 0)
    
    // Calculate the actual gain
    let netChange = 0
    let replacementDetails = []
    
    // Step 1: Match received plants with traded base plants
    let receivedIndex = 0
    basePlants.sort((a, b) => b - a)
    
    for (let i = 0; i < basePlants.length && receivedIndex < receivedPlants.length; i++) {
      const tradedValue = basePlants[i]
      const receivedValue = receivedPlants[receivedIndex]
      
      // Check if the traded plant is one of the lowest
      const isLowestPlant = useManualInventory 
        ? (lowestDamage > 0 && tradedValue === lowestDamage)
        : (lowestDamage > 0 && tradedValue >= parseNumber(lowestPlantDamage) && tradedValue < parseNumber(lowestPlantDamage) * 1.2)
      
      const gain = receivedValue - tradedValue
      
      netChange += gain
      replacementDetails.push({
        type: isLowestPlant ? 'lowest-slot' : 'slot',
        received: receivedValue,
        replaced: tradedValue,
        gain: gain,
        wasLowest: isLowestPlant
      })
      receivedIndex++
    }
    
    // Step 2: Remaining received plants replace lowest plants (if better)
    for (let i = receivedIndex; i < receivedPlants.length; i++) {
      const receivedValue = receivedPlants[i]
      
      if (lowestDamage > 0 && receivedValue > lowestDamage) {
        const gain = receivedValue - lowestDamage
        netChange += gain
        replacementDetails.push({
          type: 'lowest',
          received: receivedValue,
          replaced: lowestDamage,
          gain: gain,
          wasLowest: false
        })
      } else {
        replacementDetails.push({
          type: 'none',
          received: receivedValue,
          replaced: lowestDamage || 0,
          gain: 0,
          wasLowest: false
        })
      }
    }
    
    const totalLowestPlantDamage = lowestDamage * lowestCount
    const rawDifference = p2Giving - p1TotalGiving
    const p1NewTotal = p1Total + netChange
    
    return {
      p1NewTotal,
      netChange,
      rawDifference,
      p1IsGood: netChange > 0,
      p1TotalGiving,
      p1GivingFromBase,
      p1GivingFromInventory,
      p2Giving,
      receivedPlantCount: receivedPlants.length,
      basePlantCount: basePlants.length,
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
      
      // Auto-detect if from inventory
      if (value && useManualInventory) {
        const newFlags = [...player1FromInventory]
        newFlags[index] = !isPlantInBase(value)
        setPlayer1FromInventory(newFlags)
      }
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
    
    // Update trade slots that have this value - mark them as from base
    player1TradeSlots.forEach((slot, slotIndex) => {
      if (slot === value) {
        const newFlags = [...player1FromInventory]
        newFlags[slotIndex] = false // It's now in base, so not from inventory
        setPlayer1FromInventory(newFlags)
      }
    })
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

  if (!isMounted) {
    return null
  }

  return (
    <>
      <Head>
        <title>GVB Plant Calculator</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Primary Meta Tags */}
        <meta name="title" content="GVB Plant Calculator - Fortnite Garden Vs Brainrot Trade Calculator" />
        <meta name="description" content="Fortnite map code 0497-4522-9912. Calculate the best plant trades for Garden Vs Brainrot (GVB). Independent project made for fun, non-profit with no ads. Optimize your trades and maximize your damage!" />
        <meta name="keywords" content="Fortnite, Fortnite GVB, Fortnite Garden Vs Brainrot, Plants vs brainrot, PVB, GVB Calculator, Fortnite Plant Calculator, Garden Vs Brainrot Calculator, 0497-4522-9912" />
        <meta name="author" content="GVB Community" />
        <meta name="robots" content="index, follow" />
        <meta name="google-site-verification" content="CYg00kX0vlgS8O26vKScA2FiqTGG6QylMkkMTpev8nc" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://gvb-fortnite-calculator.vercel.app/" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://gvb-fortnite-calculator.vercel.app/" />
        <meta property="og:title" content="GVB Plant Calculator - Fortnite Garden Vs Brainrot" />
        <meta property="og:description" content="Fortnite map code 0497-4522-9912. Calculate the best plant trades for Garden Vs Brainrot. Free tool with no ads!" />
        <meta property="og:site_name" content="GVB Plant Calculator" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://gvb-fortnite-calculator.vercel.app/" />
        <meta property="twitter:title" content="GVB Plant Calculator - Fortnite Garden Vs Brainrot" />
        <meta property="twitter:description" content="Fortnite map code 0497-4522-9912. Calculate the best plant trades for Garden Vs Brainrot. Free tool with no ads!" />
        
        {/* Additional Meta Tags */}
        <meta name="theme-color" content="#581c87" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
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
                  Add all 35 plants manually (more accurate)
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div>
                      <label style={{ color: '#d1d5db', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                        Lowest Plant Damage
                      </label>
                      <input
                        type="text"
                        value={lowestPlantDamage}
                        onChange={(e) => setLowestPlantDamage(e.target.value)}
                        placeholder="e.g., 500k"
                        className="input-field"
                      />
                      <p style={{ color: '#9ca3af', fontSize: '0.65rem', marginTop: '0.25rem' }}>
                        Actual range: {lowestPlantDamage ? `${lowestPlantDamage}-${formatNumber(parseNumber(lowestPlantDamage) * 1.2)}` : '500k-600k'}
                      </p>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <label style={{ color: '#d1d5db', fontSize: '0.875rem', fontWeight: '600' }}>
                      35 Plants on Base
                      <span style={{ marginLeft: '0.5rem', color: '#a78bfa', fontSize: '0.875rem' }}>
                        (Total: {formatNumber(trade.p1Total)})
                      </span>
                    </label>
                    <select 
                      value={sortOrder} 
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="sort-select"
                    >
                      <option value="none">Original Order</option>
                      <option value="high">High to Low</option>
                      <option value="low">Low to High</option>
                    </select>
                  </div>
                  
                  {trade.lowestDamage > 0 && (
                    <div style={{ marginBottom: '0.75rem', padding: '0.75rem', background: 'rgba(139, 92, 246, 0.15)', borderRadius: '8px' }}>
                      <p style={{ color: '#a78bfa', fontSize: '0.75rem' }}>
                        Auto-detected: {formatNumber(trade.lowestDamage)} × {trade.lowestCount} lowest plant{trade.lowestCount > 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                  
                  <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }} className="custom-scrollbar">
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                      {getSortedInventory().map(({ plant, index }) => (
                        <div key={index} style={{ position: 'relative' }}>
                          <input
                            type="text"
                            value={plant}
                            onChange={(e) => updateInventoryPlant(index, e.target.value)}
                            placeholder={`Plant ${index + 1}`}
                            className="input-field-small"
                            style={{ paddingRight: plant && parseNumber(plant) > 0 ? '35px' : '12px' }}
                          />
                          {plant && parseNumber(plant) > 0 && (
                            <button
                              onClick={() => addToTrade(plant)}
                              disabled={!canAddToTrade(plant)}
                              className="add-btn"
                              title={canAddToTrade(plant) ? "Add to trade" : "All added or slots full"}
                            >
                              {canAddToTrade(plant) ? '+' : '✓'}
                            </button>
                          )}
                        </div>
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
                  <div key={index} style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={plant}
                      onChange={(e) => updateTradeSlot(1, index, e.target.value)}
                      placeholder={`Plant ${index + 1}`}
                      className="input-field-small"
                      style={{ paddingRight: plant ? '60px' : '12px' }}
                    />
                    {plant && (
                      <button
                        onClick={() => removeFromTrade(index)}
                        className="remove-btn"
                        title="Remove from trade"
                      >
                        ×
                      </button>
                    )}
                    <label style={{ color: '#d1d5db', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={player1FromInventory[index]}
                        onChange={() => toggleFromInventory(index)}
                        style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                      />
                      From Inventory
                      {useManualInventory && plant && (
                        <span style={{ fontSize: '0.65rem', color: player1FromInventory[index] ? '#fbbf24' : '#4ade80' }}>
                          ({player1FromInventory[index] ? 'not in base' : 'in base'})
                        </span>
                      )}
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
                  <p style={{ color: '#d1d5db', marginBottom: '0.75rem', fontSize: '0.875rem' }}>You&apos;re Trading (Total)</p>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6', marginBottom: '0.5rem' }}>
                    {formatNumber(trade.p1TotalGiving)}
                  </p>
                  
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    {trade.p1GivingFromInventory > 0 && (
                      <div style={{ fontSize: '0.75rem', color: '#a78bfa', marginBottom: '0.5rem' }}>
                        <p>⚡ From Inventory: {formatNumber(trade.p1GivingFromInventory)}</p>
                        <p style={{ fontSize: '0.7rem', color: '#9ca3af' }}>(Not counted in base)</p>
                      </div>
                    )}
                    {trade.p1GivingFromBase > 0 && (
                      <div style={{ fontSize: '0.75rem', color: '#f87171' }}>
                        <p>✗ From Base: {formatNumber(trade.p1GivingFromBase)}</p>
                        <p style={{ fontSize: '0.7rem', color: '#9ca3af' }}>({trade.basePlantCount} plant{trade.basePlantCount > 1 ? 's' : ''} creating {trade.basePlantCount} slot{trade.basePlantCount > 1 ? 's' : ''})</p>
                      </div>
                    )}
                  </div>
                  
                  <p style={{ color: '#d1d5db', marginTop: '1rem', marginBottom: '0.75rem', fontSize: '0.875rem' }}>You&apos;re Receiving (Total Value)</p>
                  <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#22c55e', marginBottom: '0.5rem' }}>
                    {formatNumber(trade.p2Giving)}
                  </p>

                  {trade.replacementDetails.length > 0 && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <p style={{ color: '#d1d5db', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                        Plant Replacement Breakdown
                      </p>
                      {trade.replacementDetails.map((detail, idx) => (
                        <div key={idx} style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                          {(detail.type === 'slot' || detail.type === 'lowest-slot') && (
                            <p style={{ color: detail.gain >= 0 ? '#4ade80' : '#f87171' }}>
                              {formatNumber(detail.received)} fills {formatNumber(detail.replaced)} slot
                              {detail.wasLowest && <span style={{ color: '#fbbf24' }}> (was lowest!)</span>} = 
                              <span style={{ fontWeight: 'bold', marginLeft: '0.25rem' }}>
                                {detail.gain >= 0 ? '+' : ''}{formatNumber(detail.gain)}
                              </span>
                            </p>
                          )}
                          {detail.type === 'lowest' && (
                            <p style={{ color: detail.gain >= 0 ? '#4ade80' : '#f87171' }}>
                              {formatNumber(detail.received)} replaces lowest ({formatNumber(detail.replaced)}) = 
                              <span style={{ fontWeight: 'bold', marginLeft: '0.25rem' }}>
                                {detail.gain >= 0 ? '+' : ''}{formatNumber(detail.gain)}
                              </span>
                            </p>
                          )}
                          {detail.type === 'none' && (
                            <p style={{ color: '#9ca3af' }}>
                              {formatNumber(detail.received)} ≤ lowest ({formatNumber(detail.replaced)}) = 
                              <span style={{ fontWeight: 'bold', marginLeft: '0.25rem', color: '#9ca3af' }}>
                                +0 (not added)
                              </span>
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

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
                  
                  {trade.lowestCount > 0 && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <p style={{ color: '#d1d5db', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                        {useManualInventory ? 'Auto-Detected Lowest Plants' : 'Your Lowest Plants'}
                      </p>
                      <p style={{ color: '#a78bfa', fontSize: '0.875rem', fontWeight: '600' }}>
                        {formatNumber(trade.lowestDamage)} × {trade.lowestCount} plants
                      </p>
                      <p style={{ color: '#8b5cf6', fontSize: '1rem', fontWeight: 'bold', marginTop: '0.25rem' }}>
                        Total: {formatNumber(trade.totalLowestPlantDamage)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Final Result */}
              <div className="result-card" style={{ borderColor: trade.p1IsGood ? '#4ade80' : '#f87171' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: '#d1d5db', marginBottom: '0.5rem', fontSize: '0.75rem' }}>
                    {useManualInventory ? 'Current Total (From Base)' : 'Current Total'}
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
                      {trade.replacementDetails.map((detail, idx) => (
                        <p key={idx}>
                          {detail.gain >= 0 ? '+' : ''}{formatNumber(detail.gain)} 
                          {detail.type === 'slot' && ' (slot fill)'}
                          {detail.type === 'lowest-slot' && ' (lowest slot fill)'}
                          {detail.type === 'lowest' && ' (lowest replace)'}
                          {detail.type === 'none' && ' (below lowest)'}
                        </p>
                      ))}
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

        .sort-select {
          padding: 0.5rem 0.75rem;
          background: rgba(139, 92, 246, 0.2);
          border: 2px solid rgba(139, 92, 246, 0.5);
          border-radius: 8px;
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          outline: none;
        }

        .sort-select:hover {
          background: rgba(139, 92, 246, 0.3);
          border-color: rgba(139, 92, 246, 0.7);
        }

        .sort-select option {
          background: #1e3a8a;
          color: white;
        }

        .add-btn {
          position: absolute;
          right: 5px;
          top: 50%;
          transform: translateY(-50%);
          width: 28px;
          height: 28px;
          background: rgba(34, 197, 94, 0.2);
          border: 2px solid rgba(34, 197, 94, 0.5);
          border-radius: 6px;
          color: #4ade80;
          font-size: 1.25rem;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          -webkit-tap-highlight-color: transparent;
        }

        .add-btn:hover:not(:disabled) {
          background: rgba(34, 197, 94, 0.3);
          border-color: rgba(34, 197, 94, 0.7);
          transform: translateY(-50%) scale(1.1);
        }

        .add-btn:active:not(:disabled) {
          transform: translateY(-50%) scale(0.95);
        }

        .add-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: rgba(139, 92, 246, 0.2);
          border-color: rgba(139, 92, 246, 0.5);
          color: #a78bfa;
        }

        .remove-btn {
          position: absolute;
          right: 5px;
          top: 5px;
          width: 28px;
          height: 28px;
          background: rgba(239, 68, 68, 0.2);
          border: 2px solid rgba(239, 68, 68, 0.5);
          border-radius: 6px;
          color: #f87171;
          font-size: 1.5rem;
          font-weight: bold;
          line-height: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          -webkit-tap-highlight-color: transparent;
        }

        .remove-btn:hover {
          background: rgba(239, 68, 68, 0.3);
          border-color: rgba(239, 68, 68, 0.7);
          transform: scale(1.1);
        }

        .remove-btn:active {
          transform: scale(0.95);
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
          -webkit-tap-highlight-color: transparent;
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

        @media (max-width: 768px) {
          .glass-card {
            padding: 1.5rem;
          }
          
          h1 {
            font-size: 2rem !important;
          }
          
          .add-btn, .remove-btn {
            width: 32px;
            height: 32px;
          }
        }
      `}</style>
    </>
  )
}
