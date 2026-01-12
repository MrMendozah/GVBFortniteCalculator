# 🌱 GVB Fortnite Trade Calculator

<div align="center">

![GVB Calculator Banner](https://img.shields.io/badge/Fortnite-GVB%20Calculator-7C3AED?style=for-the-badge&logo=epic-games&logoColor=white)
[![Live Demo](https://img.shields.io/badge/Live-Calculator-22C55E?style=for-the-badge)](https://gvb-fortnite-calculator.vercel.app/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)

**The ultimate trade calculator for Garden Vs Brainrot (GVB/PVB) in Fortnite**

*Fortnite Map Code: `0497-4522-9912`*

[Visit Calculator](https://gvb-fortnite-calculator.vercel.app/) • [Features](#-features) • [How to Use](#-how-to-use) • [How It Works](#-how-it-works)

</div>

---

## 📖 About

**GVB Trade Calculator** is a free, web-based tool designed to help players of the Fortnite custom game "Garden Vs Brainrot" (also known as Plants vs Brainrot) make fair and optimal trades. Whether you're a new player or a seasoned trader, this calculator ensures you never get scammed and always maximize the value of every trade!

Built with **React** and **Next.js**, this calculator runs entirely in your browser with instant calculations and automatic data saving.

### Why Use This Calculator?

- 🎯 **Prevent Bad Trades** - Instantly see if a trade will benefit you or harm your progress
- 📊 **Accurate Calculations** - Complex logic accounts for base slots, lowest plants, and inventory items
- 💾 **Auto-Save** - Your data is automatically saved in your browser (no account needed!)
- 📱 **Mobile Friendly** - Works perfectly on phones, tablets, and desktops
- ⚡ **Lightning Fast** - Real-time calculations as you type
- 🚀 **100% Free** - No ads, no payments, no sign-ups required
- 🔒 **Privacy First** - All data stays in your browser, never sent to servers

---

## ✨ Features

### 🔢 Two Calculation Modes

<details open>
<summary><b>Quick Mode</b> - Fast and Simple</summary>

Perfect for experienced players who know their stats:

- **Total Base Damage** - Enter your overall base damage (e.g., "21.3mil" or "21300000")
- **Lowest Plant Damage** - Input your lowest plant value (e.g., "500k")
- **Number of Lowest Plants** - How many of your lowest plants you have (e.g., "35")
- **Random Variance** - Automatically applies 20% variance to simulate real game conditions

**Best for:** Quick trades where you know your total and lowest plants
</details>

<details>
<summary><b>Manual Inventory Mode</b> - Most Accurate (Recommended)</summary>

The most precise way to calculate trades:

- **All 35 Plants** - Input each plant's exact damage value
- **Auto-Detection** - Automatically identifies your lowest plants
- **Real-Time Tracking** - Shows which plants are currently in trades
- **Smart Sorting** - Sort by highest to lowest or vice versa
- **Base vs. Inventory** - Distinguishes between plants on base and in inventory

**Best for:** Important trades, new players, or when accuracy matters most
</details>

### 🎮 Trade Analysis Features

| Feature | Description |
|---------|-------------|
| **2x3 Trade Grid** | Matches the exact in-game trade window layout |
| **Player 1 (You)** | Your side of the trade with base/inventory tracking |
| **Player 2** | What the other player is offering you |
| **From Inventory Toggle** | Mark plants as "From Inventory" (not on base) |
| **Clear Trade** | Remove all trade slots without clearing your inventory |
| **Clear All** | Reset everything with safety confirmation |

### 📊 Real-Time Results

The calculator shows you:

- ✅ **You're Trading** - Total value you're giving away (split by base/inventory)
- ✅ **You're Receiving** - Total value you're getting
- ✅ **Raw Trade Difference** - Simple math: Received - Given
- ✅ **Net Base Change** - How much your base will actually improve
- ✅ **Replacement Details** - Which plants fill empty slots vs. replace lowest
- ✅ **New Total** - Your total damage after the trade
- ✅ **Final Verdict** - Clear ✓ GOOD TRADE or ✗ BAD TRADE indicator

---

## 📱 How to Use

### Step 1: Choose Your Mode

**Option A: Quick Mode**
1. Enter your "Total Base Damage" (e.g., `21.3mil`)
2. Enter "Lowest Plant Damage" (e.g., `540k`)
3. Enter "# of Lowest Plants" (e.g., `4`)

**Option B: Manual Inventory Mode** *(Recommended)*
1. Check ☑️ "Add all 35 plants manually (more accurate)"
2. Fill in all 35 plant values in the grid
3. Use the sort dropdown to organize plants
4. Your total is calculated automatically

### Step 2: Enter Your Trade

**What You're Trading Away (Player 1):**
1. Type plant values in the 2x3 grid (e.g., `1mil`, `800k`)
2. Check "From Inventory" if the plant is NOT on your base
3. The calculator auto-detects if plants are in your base or not

**What You're Receiving (Player 2):**
1. Type the other player's offered plants in their 2x3 grid
2. Simple! Just enter the values they're giving you

### Step 3: Read the Results

Look at the bottom section:
- **Green border** = GOOD TRADE (you gain base damage)
- **Red border** = BAD TRADE (you lose base damage)
- Check the "Net Base Change" for exact gains/losses

### Step 4: Make Your Decision!

Trade or decline based on the calculator's analysis. Don't get scammed! 💪

---

## 🧮 How It Works

### Understanding GVB Mechanics

In Garden Vs Brainrot, your **base** consists of exactly **35 plant slots**. Each plant generates passive damage. When you trade:

1. **Removing plants from base** = You lose those slots temporarily
2. **Receiving plants** = They either fill empty slots or replace your lowest plants
3. **Inventory plants** = Extra plants you own but can't place (base is full)

### The Calculator's Smart Logic

#### 1️⃣ **Base Plant Detection**

