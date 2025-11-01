# Valuation Agent - Requirements & Specifications

**Source**: `equityresearcher.txt` (Lines 27-29, 55, 109)  
**Agent Position**: Third in the multi-agent pipeline (after Data Extractor → Financial Understanding)

---

## 🎯 **Core Mission** (Line 27-29)

> "Tự động chọn mô hình định giá phù hợp (DCF, EV/EBITDA, Multiples) và tính toán"

**Translation**: 
"Automatically select appropriate valuation models (DCF, EV/EBITDA, Multiples) and perform calculations"

**Primary Skills Required**: Python, Pandas, Scikit-Learn

---

## 📋 **Specific Tasks**

### **1. Implement Multiple Valuation Methodologies**

#### **A. DCF (Discounted Cash Flow)** 💰
The most comprehensive intrinsic valuation method.

**What to Calculate**:
```
Enterprise Value = ∑ (FCF_t / (1 + WACC)^t) + Terminal Value / (1 + WACC)^n

where:
- FCF_t = Free Cash Flow in year t
- WACC = Weighted Average Cost of Capital (from Financial Understanding Agent)
- Terminal Value = FCF_final × (1 + g) / (WACC - g)
- g = Perpetual growth rate (typically 2-3%)
```

**Required Inputs**:
- ✅ Historical Free Cash Flow (from Financial Understanding Agent)
- ✅ WACC (already calculated)
- 📊 Revenue growth rate (historical or analyst estimates)
- 📊 Operating margin trends
- 📊 Tax rate
- 📊 CapEx as % of revenue
- 📊 Working capital changes
- 📊 Terminal growth rate (user input or default 2.5%)

**Expected Output**:
- Enterprise Value
- Equity Value = Enterprise Value - Net Debt
- Fair Value per Share = Equity Value / Shares Outstanding
- Upside/Downside % vs Current Price

---

#### **B. EV/EBITDA Multiple** 📊
Compare company valuation to peers or historical average.

**What to Calculate**:
```
Enterprise Value = EBITDA × EV/EBITDA Multiple

where:
- EBITDA = Earnings Before Interest, Taxes, Depreciation, Amortization
- Multiple = Industry average or peer median
```

**Required Inputs**:
- ✅ EBITDA (calculate from Income Statement)
- 📊 Peer companies' EV/EBITDA (fetch from Finnhub or AlphaVantage)
- 📊 Industry benchmark

**Expected Output**:
- Implied Enterprise Value
- Implied Share Price
- Comparison to current valuation (overvalued/undervalued)

---

#### **C. P/E Multiple (Price-to-Earnings)** 📈
Simplest relative valuation method.

**What to Calculate**:
```
Fair Value = Earnings Per Share × P/E Multiple

where:
- EPS = Net Income / Shares Outstanding
- P/E Multiple = Industry average or historical average
```

**Required Inputs**:
- ✅ Net Income (already extracted)
- ✅ Shares Outstanding (from Balance Sheet or market data)
- 📊 Peer P/E ratios
- 📊 Industry P/E benchmark

**Expected Output**:
- Implied Fair Value per Share
- Current P/E vs Fair P/E
- Premium/Discount analysis

---

#### **D. Additional Multiples** (Optional for completeness)
- **P/B (Price-to-Book)**: Share Price / Book Value per Share
- **P/S (Price-to-Sales)**: Market Cap / Revenue
- **EV/Revenue**: Enterprise Value / Revenue
- **PEG Ratio**: P/E / Earnings Growth Rate

---

### **2. What-If Sensitivity Analysis** (Line 55)

> "Hỗ trợ 'what-if analysis': thay đổi assumption và xem valuation sensitivity"

**What to Build**:
A sensitivity table showing how valuation changes with different assumptions.

**Example Output**:

**DCF Sensitivity to WACC and Growth Rate**:
```
                Growth Rate →
WACC ↓      2.0%      2.5%      3.0%      3.5%
────────────────────────────────────────────────
 8.0%      $195.50   $205.30   $216.80   $230.20
 9.0%      $175.20   $183.50   $192.80   $203.40
10.0%      $158.40   $165.20   $172.90   $181.70
11.0%      $144.30   $150.10   $156.60   $163.90
12.0%      $132.20   $137.30   $143.00   $149.40
```

**Inputs to Vary**:
1. **WACC** (±2% from base case)
2. **Terminal Growth Rate** (1.5% to 4%)
3. **Revenue Growth Rate** (pessimistic, base, optimistic)
4. **Operating Margin** (±200 bps)
5. **Multiple** (25th percentile, median, 75th percentile)

---

### **3. Bull vs Bear Case Scenarios** (Line 58)

> "Tự tạo bull vs bear case dựa trên dữ liệu lịch sử và sentiment"

**What to Build**:
Three valuation scenarios with different assumptions.

**Example Structure**:

| Scenario | Revenue Growth | Operating Margin | WACC | Terminal Growth | Fair Value | Upside |
|----------|----------------|------------------|------|-----------------|------------|--------|
| **Bear 🐻** | 3% (slow) | 20% (compressed) | 11% (high risk) | 2.0% | $120.50 | -15% |
| **Base 📊** | 5% (steady) | 25% (current) | 9% (normal) | 2.5% | $165.20 | +15% |
| **Bull 🚀** | 8% (strong) | 28% (expansion) | 8% (low risk) | 3.0% | $210.80 | +47% |

**Logic for Auto-Generation**:
- **Bear**: Use lowest historical growth, highest WACC, lowest margin
- **Base**: Use median historical metrics or analyst consensus
- **Bull**: Use highest historical growth, lowest WACC, highest margin

---

### **4. Peer Comparison** (Line 53)

> "Sinh dashboard nội bộ để so sánh cross-firm metrics (ROE, ROIC, WACC, multiples)"

**What to Build**:
A comparison table showing how the target company stacks up against competitors.

**Example Output** (Apple vs Peers):

| Company | Market Cap | P/E | EV/EBITDA | ROE | ROIC | Revenue Growth | Margin |
|---------|------------|-----|-----------|-----|------|----------------|--------|
| **AAPL** | $2.8T | 28.5x | 21.3x | 164% | 70% | 5.2% | 30.1% |
| MSFT | $2.9T | 32.1x | 23.8x | 42% | 35% | 12.3% | 41.5% |
| GOOGL | $1.7T | 24.3x | 16.7x | 28% | 31% | 8.7% | 29.3% |
| META | $1.2T | 25.9x | 18.4x | 35% | 28% | 15.8% | 38.2% |
| **Median** | - | 27.2x | 19.9x | 38% | 32% | 10.5% | 34.9% |

**Data Sources**:
- Finnhub API: `/stock/metric` for ratios
- AlphaVantage: Company overview and fundamentals
- Our calculations: ROE, ROIC, WACC

---

## 📊 **Expected Output Structure** (Line 109)

> "Valuation & Forecast – DCF table, sensitivity, peer multiples"

### **Valuation Dashboard Components**:

#### **1. Valuation Summary Card**
```
┌─────────────────────────────────────┐
│      APPLE INC. (AAPL)              │
│      Valuation Summary              │
├─────────────────────────────────────┤
│ Current Price:       $172.50        │
│ DCF Fair Value:      $165.20        │
│ EV/EBITDA FV:        $178.30        │
│ P/E Fair Value:      $155.80        │
├─────────────────────────────────────┤
│ Avg Fair Value:      $166.43        │
│ Upside/Downside:     -3.5% 📉       │
├─────────────────────────────────────┤
│ Recommendation:      HOLD           │
└─────────────────────────────────────┘
```

#### **2. DCF Model Output**
- **10-year forecast table** (Revenue, EBITDA, FCF)
- **Terminal value calculation**
- **Present value of cash flows**
- **Enterprise Value → Equity Value → Per Share Value**
- **Sensitivity matrix** (WACC × Growth)

#### **3. Multiples Comparison**
- **Current vs Fair Multiples** (P/E, EV/EBITDA, P/B, P/S)
- **Peer comparison chart**
- **Historical average comparison** (5-year)

#### **4. Bull/Base/Bear Table**
- **Three scenarios side-by-side**
- **Key assumptions for each**
- **Probability-weighted fair value**

#### **5. Visualizations**
- 📊 **Waterfall chart**: Current Price → Fair Value components
- 📈 **Line chart**: Historical P/E vs Fair P/E trend
- 🎯 **Gauge chart**: Upside/Downside potential
- 📊 **Bar chart**: Peer multiple comparison

---

## 🔧 **Technical Implementation Plan**

### **Phase 1: Data Pipeline**
1. ✅ Get financial metrics from Financial Understanding Agent
2. 📊 Fetch current stock price (Finnhub)
3. 📊 Fetch shares outstanding (Finnhub or SEC filing)
4. 📊 Fetch peer data (Finnhub bulk query)
5. 📊 Calculate EBITDA (Net Income + Interest + Tax + D&A)

### **Phase 2: Valuation Models**
1. **DCF Calculator**
   - Project 10-year Free Cash Flow
   - Calculate terminal value
   - Discount to present value
   - Convert to per-share value

2. **Multiples Calculator**
   - Calculate current multiples
   - Fetch peer/industry multiples
   - Calculate implied valuations

3. **Scenario Builder**
   - Auto-generate bull/base/bear assumptions
   - Run valuations for each scenario
   - Calculate probability-weighted value

### **Phase 3: Sensitivity Analysis**
1. Build 2D sensitivity matrix (WACC × Growth)
2. Build 1D tornado chart (sensitivity to each assumption)
3. Monte Carlo simulation (optional, Phase 2)

### **Phase 4: UI Components**
1. `ValuationSummaryCard.tsx` - Top-level metrics
2. `DCFModelViewer.tsx` - Full DCF table with assumptions
3. `MultiplesComparison.tsx` - Peer and historical multiples
4. `SensitivityMatrix.tsx` - Interactive sensitivity table
5. `ScenarioAnalysis.tsx` - Bull/Base/Bear comparison
6. `PeerBenchmark.tsx` - Cross-company comparison

### **Phase 5: API Endpoints**
1. `/api/valuation/dcf` - DCF calculation
2. `/api/valuation/multiples` - All multiples calculation
3. `/api/valuation/peers` - Peer comparison data
4. `/api/valuation/sensitivity` - Sensitivity analysis
5. `/api/valuation/scenarios` - Bull/Base/Bear cases

---

## 📁 **Files to Create**

### **Backend**:
- `app/lib/valuationModels.ts` - Core DCF and multiples logic
- `app/lib/scenarioBuilder.ts` - Bull/Base/Bear generation
- `app/lib/peerComparison.ts` - Fetch and compare peers
- `app/api/valuation/dcf/route.ts`
- `app/api/valuation/multiples/route.ts`
- `app/api/valuation/peers/route.ts`
- `app/api/valuation/sensitivity/route.ts`

### **Frontend**:
- `app/valuation/page.tsx` - Main dashboard
- `app/components/ValuationSummaryCard.tsx`
- `app/components/DCFModelViewer.tsx`
- `app/components/MultiplesComparison.tsx`
- `app/components/SensitivityMatrix.tsx`
- `app/components/ScenarioAnalysis.tsx`
- `app/components/PeerBenchmark.tsx`

---

## ✅ **Success Criteria**

**Valuation Agent is complete when**:
1. ✅ DCF model produces reasonable fair value (within ±20% of analyst consensus)
2. ✅ Multiples are calculated correctly and match public data
3. ✅ Sensitivity analysis shows realistic ranges
4. ✅ Bull/Base/Bear scenarios make logical sense
5. ✅ Peer comparison shows accurate relative positioning
6. ✅ UI is interactive and professional
7. ✅ All calculations are transparent (show formulas and assumptions)

---

## 🚀 **Suggested Implementation Order**

1. **Day 1**: DCF model (core engine)
2. **Day 2**: Multiples calculator + peer data fetching
3. **Day 3**: Sensitivity analysis + scenario builder
4. **Day 4**: UI components + visualization
5. **Day 5**: Testing, refinement, documentation

---

## 📊 **Example Expected Output** (Apple Inc.)

```
════════════════════════════════════════════════════════════
                    APPLE INC. (AAPL)
                  VALUATION ANALYSIS
                   November 1, 2025
════════════════════════════════════════════════════════════

CURRENT METRICS
─────────────────────────────────────────────────────────
Current Price:              $172.50
Market Cap:                 $2.68T
Shares Outstanding:         15.12B
52-Week Range:              $124.17 - $237.49

VALUATION SUMMARY
─────────────────────────────────────────────────────────
Method              Fair Value    Upside/Downside
─────────────────────────────────────────────────────────
DCF (10Y)           $165.20       -4.2%
EV/EBITDA           $178.30       +3.4%
P/E Multiple        $155.80       -9.7%
P/B Multiple        $162.40       -5.9%
─────────────────────────────────────────────────────────
Weighted Avg        $166.43       -3.5%

RECOMMENDATION: HOLD (fairly valued)

DCF MODEL ASSUMPTIONS
─────────────────────────────────────────────────────────
Revenue Growth (Y1-5):      5.2%
Revenue Growth (Y6-10):     3.8%
Operating Margin:           30.1%
Tax Rate:                   23.9%
WACC:                       9.0%
Terminal Growth:            2.5%

SCENARIO ANALYSIS
─────────────────────────────────────────────────────────
Scenario        Probability    Fair Value    Upside
─────────────────────────────────────────────────────────
Bear 🐻         25%           $120.50       -30.1%
Base 📊         50%           $165.20       -4.2%
Bull 🚀         25%           $210.80       +22.2%
─────────────────────────────────────────────────────────
Probability-Weighted:        $165.08       -4.3%

PEER COMPARISON (P/E Ratio)
─────────────────────────────────────────────────────────
Company         P/E         Premium to AAPL
─────────────────────────────────────────────────────────
AAPL            28.5x       —
MSFT            32.1x       +12.6%
GOOGL           24.3x       -14.7%
META            25.9x       -9.1%
─────────────────────────────────────────────────────────
Sector Median:  27.2x       -4.6%

CONCLUSION: Apple trades at a slight premium to sector median,
justified by higher ROIC (70% vs 32% median) and strong cash
generation. Current valuation is fair given growth prospects.
════════════════════════════════════════════════════════════
```

---

## 🎯 **Summary**

**The Valuation Agent will**:
1. ✅ Calculate DCF fair value with 10-year projections
2. ✅ Calculate relative valuations (P/E, EV/EBITDA, P/B, P/S)
3. ✅ Generate bull/base/bear scenarios automatically
4. ✅ Create sensitivity analysis (WACC, growth, margin)
5. ✅ Compare to peer companies
6. ✅ Provide clear recommendation (BUY/HOLD/SELL)
7. ✅ Display all assumptions transparently
8. ✅ Create professional, interactive UI

**Status**: Ready to start implementation! 🚀

