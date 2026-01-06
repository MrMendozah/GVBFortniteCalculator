import { useState } from 'react'
import Head from 'next/head'
import { parseNumber, formatNumber } from '../utils/numberParser'

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

      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-5xl font-bold text-white mb-4">
              GVB Fortnite Trade Calculator
            </h1>
            <p className="text-gray-300 text-lg">
              Calculate 2x3 plant trades • Use 100k, 1mil shorthand
            </p>
          </div>

          {/* Trade Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Player 1 */}
            <div className="glass-card animate-slide-up">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="bg-blue-500 w-10 h-10 rounded-full flex items-center justify-center mr-3">1</span>
                Player 1
              </h2>
              
              <div className="mb-6">
                <label className="text-gray-300 text-sm font-semibold mb-2 block">
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

              <label className="text-gray-300 text-sm font-semibold mb-3 block">
                Plants Trading Away (2x3 Grid)
              </label>
              <div className="grid grid-cols-2 gap-3">
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
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="bg-green-500 w-10 h-10 rounded-full flex items-center justify-center mr-3">2</span>
                Player 2
              </h2>
              
              <div className="mb-6">
                <label className="text-gray-300 text-sm font-semibold mb-2 block">
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

              <label className="text-gray-300 text-sm font-semibold mb-3 block">
                Plants Trading Away (2x3 Grid)
              </label>
              <div className="grid grid-cols-2 gap-3">
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
            <h3 className="text-2xl font-bold text-white mb-6 text-center">
              Trade Results
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Player 1 Result */}
              <div className={`result-card ${trade.p1IsGood ? 'border-green-400' : 'border-red-400'}`}>
                <div className="text-center">
                  <p className="text-gray-300 mb-2">Player 1</p>
                  <p className="text-3xl font-bold text-white mb-2">
                    {formatNumber(trade.p1NewTotal)}
                  </p>
                  <p className={`text-lg font-semibold ${trade.p1IsGood ? 'text-green-400' : 'text-red-400'}`}>
                    {trade.p1Difference >= 0 ? '+' : ''}{formatNumber(trade.p1Difference)}
                  </p>
                  <p className={`mt-2 px-4 py-1 rounded-full inline-block text-sm font-bold ${
                    trade.p1IsGood ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {trade.p1IsGood ? '✓ GOOD TRADE' : '✗ BAD TRADE'}
                  </p>
                </div>
              </div>

              {/* Player 2 Result */}
              <div className={`result-card ${trade.p2IsGood ? 'border-green-400' : 'border-red-400'}`}>
                <div className="text-center">
                  <p className="text-gray-300 mb-2">Player 2</p>
                  <p className="text-3xl font-bold text-white mb-2">
                    {formatNumber(trade.p2NewTotal)}
                  </p>
                  <p className={`text-lg font-semibold ${trade.p2IsGood ? 'text-green-400' : 'text-red-400'}`}>
                    {trade.p2Difference >= 0 ? '+' : ''}{formatNumber(trade.p2Difference)}
                  </p>
                  <p className={`mt-2 px-4 py-1 rounded-full inline-block text-sm font-bold ${
                    trade.p2IsGood ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {trade.p2IsGood ? '✓ GOOD TRADE' : '✗ BAD TRADE'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
