# WACC Calculation Issue - Root Cause Analysis

**Date**: November 1, 2025  
**Issue**: DCF Fair Value is too low ($66.71 vs expected $130-180)  
**Root Cause**: WACC calculation uses flawed cost of equity formula

---

## 🚨 **The Problem**

### **Current Formula (WRONG):**
```typescript
// Line 443 in financialTableParser.ts
costOfEquity = 0.08 + (ROE_decimal × 0.5)
```

**For Apple:**
- ROE = 164.59% → 1.6459 as decimal
- Cost of Equity = 0.08 + (1.6459 × 0.5) = **90.3%** ❌

**This is backwards logic!** High ROE does NOT mean high cost of equity. In fact:
- **High ROE** = Company is generating excellent returns (good for investors)
- **High Cost of Equity** = Investors require high returns because of risk (bad for company)

These are **opposite concepts**! The formula assumes they're related, but they're not.

---

## 📊 **Why This Happens**

### **The Flawed Logic:**
```
High ROE → High Cost of Equity → High WACC → Low Valuation ❌
```

**Reality:**
```
High ROE → Low Risk → Low Cost of Equity → Low WACC → High Valuation ✅
```

### **Example:**
- **Apple** (ROE = 164%): Stable company, low risk → Should have **low cost of equity** (~8-12%)
- **Startup** (ROE = 10%): Risky company → Should have **high cost of equity** (~20-30%)

Our formula does the opposite!

---

## ✅ **The Correct Formula (CAPM)**

### **Proper Cost of Equity:**
```
Cost of Equity (Re) = Risk-Free Rate + Beta × Market Risk Premium

where:
- Risk-Free Rate (Rf) = Current 10-year Treasury yield (~4-5%)
- Beta (β) = Stock's sensitivity to market (Apple's β ≈ 1.2)
- Market Risk Premium (Rm - Rf) = Historical average (~6%)
```

**For Apple (Proper CAPM):**
```
Re = 4.5% + (1.2 × 6%)
Re = 4.5% + 7.2%
Re = 11.7% ✅ (Much more realistic!)
```

---

## 🔧 **Solutions**

### **Option 1: Use Proper CAPM (Phase 2 - Best Solution)**

**What to do:**
1. Fetch **Beta** from market data APIs (Finnhub or AlphaVantage)
2. Fetch **current Treasury yield** from AlphaVantage or Treasury Direct API
3. Use **historical market risk premium** (~6% long-term average)
4. Calculate: `Re = Rf + β × (Rm - Rf)`

**Pros:**
- ✅ Industry-standard methodology
- ✅ Accurate for valuation
- ✅ Uses real market data

**Cons:**
- ⚠️ Requires additional API calls
- ⚠️ Needs proper data sources

---

### **Option 2: Use Sector-Based WACC (Quick Fix)**

**What to do:**
- Use **pre-calculated WACC estimates** by sector/company size
- Large-cap tech companies: 8-10%
- Mid-cap: 10-12%
- Small-cap: 12-15%

**Example:**
```typescript
function estimateWACCBySector(ticker: string, marketCap: number) {
  // Large-cap tech (AAPL, MSFT, GOOGL)
  if (marketCap > 500e9) return 0.09; // 9%
  
  // Mid-cap tech
  if (marketCap > 50e9) return 0.11; // 11%
  
  // Small-cap
  return 0.13; // 13%
}
```

**Pros:**
- ✅ Simple to implement
- ✅ More accurate than current formula
- ✅ No additional API calls needed

**Cons:**
- ⚠️ Less precise than CAPM
- ⚠️ Doesn't account for company-specific risk

---

### **Option 3: User-Editable WACC (Intermediate)**

**What to do:**
- Add **WACC input field** in Valuation UI
- Let user enter their own WACC estimate
- Default to 10% (current cap) but allow override
- Save user preference

**Pros:**
- ✅ Users can input their own analysis
- ✅ Flexible for different scenarios
- ✅ No API dependencies

**Cons:**
- ⚠️ Requires user knowledge
- ⚠️ Still a workaround, not a fix

---

### **Option 4: Hybrid Approach (Recommended for Phase 1)**

**What to do:**
1. **Try to calculate proper CAPM** (if beta/treasury data available)
2. **Fall back to sector-based estimate** (if CAPM fails)
3. **Allow user override** (if they want to adjust)

**Implementation:**
```typescript
async function getWACC(ticker: string, marketCap: number) {
  // Step 1: Try CAPM
  const beta = await fetchBeta(ticker); // From Finnhub
  const riskFreeRate = await fetchTreasuryYield(); // From AlphaVantage
  if (beta && riskFreeRate) {
    return riskFreeRate + (beta * 0.06); // 6% market premium
  }
  
  // Step 2: Fall back to sector estimate
  return estimateWACCBySector(ticker, marketCap);
  
  // Step 3: User can override in UI (coming in Phase 1.5)
}
```

---

## 📋 **Recommended Implementation Plan**

### **Phase 1 (Now):**
- ✅ Cap WACC at 10% (current band-aid)
- ✅ Add console warning when capping
- ✅ Document the issue

### **Phase 1.5 (Next):**
- 🔄 Implement **sector-based WACC estimation**
- 🔄 Add **user-editable WACC field** in Valuation UI
- 🔄 Show **WACC breakdown** (what we used and why)

### **Phase 2 (Future):**
- 🚀 Implement **proper CAPM** with:
  - Beta from Finnhub/AlphaVantage
  - Treasury yields from API
  - Company-specific adjustments
- 🚀 Show **WACC sensitivity analysis**

---

## 🎯 **Quick Fix for Phase 1**

### **Better Sector-Based Estimation:**

```typescript
// In app/valuation/page.tsx
function getSectorWACC(ticker: string, marketCap?: number): number {
  // Use ticker prefix to guess sector
  const techTickers = ['AAPL', 'MSFT', 'GOOGL', 'META', 'AMZN', 'NVDA'];
  const isTech = techTickers.includes(ticker.toUpperCase());
  
  if (isTech) {
    // Large-cap tech: 8-10%
    return 0.09; // 9% average
  }
  
  // Default for other sectors
  return 0.10; // 10%
}

// Then in handleRunValuation:
const sectorWACC = getSectorWACC(ticker, estimatesData.marketCap);
let waccValue = sectorWACC; // Use sector-based instead of metrics.wacc
```

**This is better than a hardcoded cap because:**
- ✅ Uses sector logic
- ✅ More flexible
- ✅ Can be expanded later

---

## 📊 **Comparison Table**

| Method | Accuracy | Complexity | API Dependencies | Status |
|--------|----------|------------|------------------|--------|
| **Current (ROE-based)** | ❌ 0/10 | Low | None | Broken |
| **Hardcoded Cap** | ⚠️ 3/10 | Very Low | None | Band-aid |
| **Sector-Based** | ✅ 6/10 | Low | None | Recommended |
| **User-Editable** | ✅ 7/10 | Medium | None | Good UX |
| **Proper CAPM** | ✅ 10/10 | High | Beta + Treasury | Phase 2 |

---

## 🚀 **Immediate Action Items**

1. **Replace hardcoded cap** with sector-based WACC estimation
2. **Add WACC display** in Valuation UI (show what we're using)
3. **Document the limitation** in UI (tooltip/note)
4. **Plan Phase 2** CAPM implementation

---

## 💡 **Why This Matters**

**WACC is the discount rate in DCF.** It directly affects:
- **Terminal Value**: `TV = FCF × (1 + g) / (WACC - g)`
  - If WACC = 10%, terminal value is large ✅
  - If WACC = 35%, terminal value is tiny ❌

- **Present Values**: `PV = FCF / (1 + WACC)^year`
  - Higher WACC → Lower present values → Lower valuation

**Impact on Apple DCF:**
- WACC = 10%: Fair Value ≈ **$165/share** ✅
- WACC = 35%: Fair Value ≈ **$11/share** ❌

**That's why fixing WACC is critical!**

---

## ✅ **Conclusion**

**Root Cause**: Flawed ROE-based cost of equity formula  
**Current Fix**: Hardcoded 10% cap (temporary)  
**Better Fix**: Sector-based WACC estimation (Phase 1.5)  
**Best Fix**: Proper CAPM with market data (Phase 2)

**Next Step**: Implement sector-based WACC to replace the hardcoded cap.

