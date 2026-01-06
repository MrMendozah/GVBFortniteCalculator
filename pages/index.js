import { useState } from 'react'
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

export default function TradeCalculator() {
  const [player1Total, setPlayer1Total] = useState('')
  const [player2Total, setPlayer2Total] = useState('')
  const [player1Plants, setPlayer1Plants] = useState(['', '', '', '', '', ''])
  const [player2Plants, setPlayer2Plants] = useState(['', '', '', '', '', ''])

  // Calculate trade outcome
  const calculateTrade = () => {
    const p1Total = parseNumber(player1Total)
    const p2Total = parseNumber(player2Total)
    
    const p1Giving = player1Plants.reduce((sum, plant) => sum + parseNumber(plant), 0)
    const p2Giving = player2Plants.reduce((sum, plant) => sum + parseNumber(plant), 0)
    
    const p1NewTotal = p1Total - p1Giving + p2Giving
    const p2NewTotal = p2Total - p2Giving + p1Giving
    
    const p1Difference = p1NewTotal - p1Total
    const p2Difference = p2NewTotal - p2Total
    
    return {
      p1NewTotal,
      p2NewTotal,
      p1Difference,
      p2Difference,
      p1IsGood: p1Difference > 0,
      p2IsGood: p2Difference > 0
    }
  }

  const trade = calculateTrade()

  const updatePlant = (player, index, value) => {
    if (player === 1) {
      const newPlants = [...player1Plants]
      newPlants[index] = value
      setPlayer1Plants(newPlants)
    } else {
      const newPlants = [...player2Plants]
      newPlants[index] = value
      setPlayer2Plants(newPlants)
    }
  }

  return (
    <>
      <Head>
        <title>GVB Fortnite Trade Calculator</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #581c87, #1e3a8a, #312e81)', padding: '3rem 1rem' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }} className="animate-fade-in">
            <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>
              GVB Fortnite Trade Calculator
            </h1>
            <p style={{ color: '#d1d5db', fontSize: '1.125rem' }}>
              Calculate 2x3 plant trades • Use 100k, 1mil shorthand
            </p>
          </div>

          {/* Trade Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
            {/* Player 1 */}
            <div className="glass-card animate-slide-up">
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
                <span style={{ background: '#3b82f6', width: '2.5rem', height: '2.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '0.75rem' }}>1</span>
                Player 1
              </h2>
              
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

              <label style={{ color: '#d1d5db', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', display: 'block' }}>
                Plants Trading Away (2x3 Grid)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                {player1Plants.map((plant, index) => (
                  <input
                    key={index}
                    type="text"
                    value={plant}
                    onChange={(e) => updatePlant(1, index, e.target.value)}
                    placeholder={`Plant ${index + 1}`}
                    className="input-field-small"
                  />
                ))}
              </div>
            </div>

            {/* Player 2 */}
            <div className="glass-card animate-slide-up-delay">
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
                <span style={{ background: '#22c55e', width: '2.5rem', height: '2.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '0.75rem' }}>2</span>
                Player 2
              </h2>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ color: '#d1d5db', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                  Total Base Damage
                </label>
                <input
                  type="text"
                  value={player2Total}
                  onChange={(e) => setPlayer2Total(e.target.value)}
                  placeholder="e.g., 15mil or 500k"
                  className="input-field"
                />
              </div>

              <label style={{ color: '#d1d5db', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', display: 'block' }}>
                Plants Trading Away (2x3 Grid)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                {player2Plants.map((plant, index) => (
                  <input
                    key={index}
                    type="text"
                    value={plant}
                    onChange={(e) => updatePlant(2, index, e.target.value)}
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
              Trade Results
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
              {/* Player 1 Result */}
              <div className="result-card" style={{ borderColor: trade.p1IsGood ? '#4ade80' : '#f87171' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: '#d1d5db', marginBottom: '0.5rem' }}>Player 1</p>
                  <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
                    {formatNumber(trade.p1NewTotal)}
                  </p>
                  <p style={{ fontSize: '1.125rem', fontWeight: '600', color: trade.p1IsGood ? '#4ade80' : '#f87171' }}>
                    {trade.p1Difference >= 0 ? '+' : ''}{formatNumber(trade.p1Difference)}
                  </p>
                  <p style={{ 
                    marginTop: '0.5rem', 
                    padding: '0.25rem 1rem', 
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

              {/* Player 2 Result */}
              <div className="result-card" style={{ borderColor: trade.p2IsGood ? '#4ade80' : '#f87171' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: '#d1d5db', marginBottom: '0.5rem' }}>Player 2</p>
                  <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem' }}>
                    {formatNumber(trade.p2NewTotal)}
                  </p>
                  <p style={{ fontSize: '1.125rem', fontWeight: '600', color: trade.p2IsGood ? '#4ade80' : '#f87171' }}>
                    {trade.p2Difference >= 0 ? '+' : ''}{formatNumber(trade.p2Difference)}
                  </p>
                  <p style={{ 
                    marginTop: '0.5rem', 
                    padding: '0.25rem 1rem', 
                    borderRadius: '9999px', 
                    display: 'inline-block', 
                    fontSize: '0.875rem', 
                    fontWeight: 'bold',
                    background: trade.p2IsGood ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: trade.p2IsGood ? '#4ade80' : '#f87171'
                  }}>
                    {trade.p2IsGood ? '✓ GOOD TRADE' : '✗ BAD TRADE'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 2rem;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }

        .input-field {
          width: 100%;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          color: white;
          font-size: 16px;
          transition: all 0.3s ease;
        }

        .input-field:focus {
          outline: none;
          border-color: rgba(139, 92, 246, 0.6);
          background: rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }

        .input-field-small {
          width: 100%;
          padding: 10px 12px;
          background: rgba(255, 255, 255, 0.08);
          border: 2px solid rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          color: white;
          font-size: 14px;
          transition: all 0.3s ease;
        }

        .input-field-small:focus {
          outline: none;
          border-color: rgba(139, 92, 246, 0.5);
          background: rgba(255, 255, 255, 0.12);
          transform: scale(1.02);
        }

        .input-field::placeholder,
        .input-field-small::placeholder {
          color: rgba(255, 255, 255, 0.4);
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
