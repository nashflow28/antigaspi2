# 🔬 TEST REFACTORING PLAN - Admin Screens
## Analysis & Strategic Options

**Date:** 2025-10-21
**Status:** 37.76% pass rate (37/98 tests passing)
**Root Cause:** Test architecture fundamentally broken
**Diagnostic Duration:** 2h empirical testing

---

## 📊 CURRENT STATE (Baseline)

### Test Results Summary:
```
Suite                      | Passed | Failed | Pass Rate | Main Issue
---------------------------|--------|--------|-----------|---------------------------
AdminDashboardScreen       |   4/16 |  12/16 |   25.0%   | Unmounted component queries
AdminProductsScreen        |   9/27 |  18/27 |   33.3%   | Unmounted component queries
AdminUsersScreen           |   8/23 |  15/23 |   34.8%   | Unmounted component queries
AdminCategoriesScreen      |   7/18 |  11/18 |   38.9%   | Missing testIDs + unmounted
AdminMerchantsScreen       |   9/14 |   5/14 |   64.3%   | Best, but still issues
---------------------------|--------|--------|-----------|---------------------------
TOTAL                      |  37/98 |  61/98 |   37.76%  | ❌ FAILING
```

### Error Distribution:
- **91.8%** (56/61 failures) = "Unable to find node on unmounted component"
- **8.2%** (5/61 failures) = Missing testID attributes

---

## 🔍 ROOT CAUSE ANALYSIS

### What We Thought Was Wrong (❌ DISPROVEN):

1. **Hypothesis 1:** "Missing cleanup in useEffect"
   - **Fix attempted:** Added isMounted pattern + cleanup return
   - **Result:** 0% improvement
   - **Conclusion:** Not the root cause

2. **Hypothesis 2:** "Missing testID attributes"
   - **Fix attempted:** Added 12 testIDs across 3 screens
   - **Result:** 0% improvement
   - **Conclusion:** Not the root cause

3. **Hypothesis 3:** "Missing cleanup() in afterEach"
   - **Fix attempted:** Added cleanup() + jest.clearAllMocks()
   - **Result:** 0% improvement
   - **Conclusion:** Not the root cause

### What's Actually Wrong (✅ VALIDATED):

**The test architecture uses synchronous queries on asynchronously-rendered components.**

#### Current Architecture (BROKEN):
```typescript
// ❌ This pattern is fundamentally broken
describe('Component Test', () => {
  it('should display data', async () => {
    const { getByText } = render(<Component />)

    // Component is still loading...
    await waitFor(() => {
      expect(getByText('Loaded Data')).toBeTruthy()
      // ❌ Component unmounts before waitFor completes
    })
  })
})
```

**Why it fails:**
1. `getByText()` is **synchronous** - queries DOM immediately
2. Component renders → makes API call → **starts unmounting**
3. `waitFor()` timeout (1000ms default) begins
4. Component fully unmounts at ~500ms
5. `waitFor()` tries to call `getByText()` → **"unmounted component" error**

#### Required Architecture (CORRECT):
```typescript
// ✅ This pattern works correctly
describe('Component Test', () => {
  it('should display data', async () => {
    const { findByText } = render(<Component />)

    // findByText automatically waits for element
    const element = await findByText('Loaded Data', {}, { timeout: 5000 })
    expect(element).toBeTruthy()
  })
})
```

**Why it works:**
1. `findByText()` is **asynchronous** - polls DOM until element appears
2. Component renders → makes API call → updates state
3. `findByText()` keeps polling until element exists
4. Returns element when found, within timeout
5. No unmounting issues because query is reactive

---

## 🎯 STRATEGIC OPTIONS (3 Approaches)

### Option A: **E2E Tests Focus** ⚡ RECOMMENDED

**Strategy:** Replace fragile unit tests with robust E2E tests

**Approach:**
- Write 10-15 critical E2E tests with Maestro or Detox
- Cover main user flows (login → list → detail → action)
- Delete or archive 98 unit tests
- Focus on integration over isolation

**Pros:**
- ✅ **Fast to implement:** 3 days total
- ✅ **Higher confidence:** Tests real user behavior
- ✅ **More maintainable:** Fewer, simpler tests
- ✅ **Catches integration bugs:** Unit tests miss these
- ✅ **Less brittle:** Not coupled to implementation details

**Cons:**
- ⚠️ Slower execution (seconds vs milliseconds)
- ⚠️ Harder to debug failures (more moving parts)
- ⚠️ Lower code coverage percentage (but higher real coverage)

**Effort Breakdown:**
```
Day 1: Setup Maestro/Detox (4h) + First 3 flows (4h)
Day 2: 6 more flows (8h)
Day 3: Polish + CI integration (6h) + documentation (2h)
Total: 24h = 3 days
```

**E2E Test Examples:**
```yaml
# maestro/admin-products-flow.yaml
appId: com.antigaspi.mobile
---
- launchApp
- tapOn: "Admin Login"
- inputText: "admin@antigaspi.com"
- inputText: "password"
- tapOn: "Se connecter"
- assertVisible: "Dashboard"
- tapOn: "Gestion Produits"
- assertVisible: "Tous (320)"
- tapOn: "En attente (7)"
- assertVisible: "7 produit"
- tapOn: "Bananes mûres"
- assertVisible: "Détails Produit"
- tapOn: "Approuver le produit"
- assertVisible: "Succès"
```

**Coverage:**
- Critical paths: 95%+
- Edge cases: 40%
- Code coverage: ~30% (but meaningful)

---

### Option B: **Critical Tests Only** 🎯 BALANCED

**Strategy:** Keep 20-30 tests for core components, rewrite correctly

**Approach:**
- Identify 20-30 most critical test cases
- Rewrite with correct architecture (findBy, act, MSW)
- Archive remaining 68-78 tests
- Accept lower coverage for maintainability

**Pros:**
- ✅ **Good ROI:** 1 week effort for solid foundation
- ✅ **Maintainable:** Small test suite, high quality
- ✅ **Fast execution:** Unit tests still fast
- ✅ **Debugging:** Easier than E2E

**Cons:**
- ⚠️ Lower coverage (40% instead of 80%)
- ⚠️ Still need to learn new testing patterns
- ⚠️ Risk of missing important bugs

**Effort Breakdown:**
```
Day 1: Identify critical tests (4h) + Setup fixtures (4h)
Day 2-3: Rewrite 10 Dashboard/Products tests (16h)
Day 4-5: Rewrite 10 Users/Merchants tests (16h)
Total: 40h = 1 week
```

**Critical Test Selection Criteria:**
1. **User impact:** Login, product approve/reject, user suspend
2. **Bug frequency:** Areas with most production bugs
3. **Business critical:** Revenue-affecting flows
4. **Regulatory:** Admin audit trail

**Example Rewrite:**
```typescript
// ❌ BEFORE (broken)
it('approves product successfully', async () => {
  const { getByText } = render(<AdminProductsScreen />)
  await waitFor(() => expect(getByText('Bananes')).toBeTruthy())
  fireEvent.press(getByText('Approuver'))
  await waitFor(() => expect(getByText('Succès')).toBeTruthy())
})

// ✅ AFTER (correct)
it('approves product successfully', async () => {
  const { findByText } = render(<AdminProductsScreen />)

  // Wait for product to load
  const productCard = await findByText('Bananes mûres')
  expect(productCard).toBeTruthy()

  // Open detail
  fireEvent.press(productCard)
  const approveButton = await findByText('Approuver le produit')

  // Approve with confirmation
  await act(async () => {
    fireEvent.press(approveButton)
  })

  // Verify success (with realistic timeout)
  const successMessage = await findByText('Succès', {}, { timeout: 3000 })
  expect(successMessage).toBeTruthy()
})
```

**Coverage:**
- Critical paths: 90%+
- Edge cases: 30%
- Code coverage: ~40%

---

### Option C: **Complete Refactoring** 🏗️ COMPREHENSIVE

**Strategy:** Rewrite all 98 tests with modern architecture

**Approach:**
- Migrate all tests to findBy queries
- Add act() wrapping for all state updates
- Implement MSW for realistic API mocking
- Create reusable test fixtures
- Achieve 80%+ pass rate

**Pros:**
- ✅ **Maximum coverage:** All features tested
- ✅ **Best long-term:** Solid foundation for future
- ✅ **Catches everything:** No blind spots

**Cons:**
- ⚠️ **Time investment:** 2 weeks effort
- ⚠️ **Maintenance burden:** 98 tests to maintain
- ⚠️ **Diminishing returns:** Many tests, marginal value

**Effort Breakdown:**
```
Day 1-2: Setup MSW + fixtures (16h)
Day 3-4: Rewrite AdminDashboard tests (16 tests, 16h)
Day 5-6: Rewrite AdminProducts tests (27 tests, 16h)
Day 7-8: Rewrite AdminUsers tests (23 tests, 16h)
Day 9-10: Rewrite AdminCategories + Merchants (32 tests, 16h)
Total: 80h = 2 weeks
```

**Modern Test Infrastructure:**

```typescript
// test-utils/fixtures.ts
export const buildMockProduct = (overrides = {}) => ({
  id: 1,
  name: 'Test Product',
  price: 1000,
  ...overrides
})

// test-utils/render.tsx
export const renderWithProviders = async (
  component: React.ReactElement
) => {
  const result = render(
    <Providers>
      {component}
    </Providers>
  )

  // Wait for initial render
  await waitForElementToBeRemoved(() =>
    result.queryByText('Loading...')
  )

  return result
}

// test-utils/msw-handlers.ts
export const handlers = [
  rest.get('/api/products', (req, res, ctx) => {
    return res(
      ctx.delay(100), // Realistic delay
      ctx.json({ data: [buildMockProduct()] })
    )
  })
]

// AdminProductsScreen.test.tsx (modern)
describe('AdminProductsScreen', () => {
  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  it('loads and displays products', async () => {
    const { findByText } = await renderWithProviders(
      <AdminProductsScreen />
    )

    const product = await findByText('Test Product')
    expect(product).toBeTruthy()
  })
})
```

**Coverage:**
- Critical paths: 95%+
- Edge cases: 70%+
- Code coverage: 80%+

---

## 📈 COMPARISON MATRIX

| Criterion | Option A (E2E) | Option B (Critical) | Option C (Complete) |
|-----------|----------------|---------------------|---------------------|
| **Time to Complete** | 3 days | 1 week | 2 weeks |
| **Immediate ROI** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Long-term Value** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Maintenance** | Low | Medium | High |
| **Confidence** | Very High | High | Very High |
| **Debugging** | Harder | Easier | Easier |
| **Coverage** | ~30% | ~40% | ~80% |
| **Execution Speed** | Slow (minutes) | Fast (seconds) | Fast (seconds) |
| **Brittleness** | Low | Low | Medium |
| **Learning Curve** | Low | Medium | High |

---

## 💡 RECOMMENDATION

### For This Project: **Option A (E2E Tests)** ⚡

**Why?**

1. **Time constraint:** You have limited time, 3 days >> 2 weeks
2. **Real confidence:** E2E tests catch what matters (user flows)
3. **Less technical debt:** No 98 tests to maintain
4. **Proven pattern:** Industry trend toward E2E over unit
5. **Mobile context:** E2E tests are standard for mobile apps

**Implementation Plan:**

### Week 1: E2E Test Suite
```
Monday: Setup Maestro + 3 critical flows
Tuesday: 6 more flows (admin CRUD operations)
Wednesday: Polish + CI integration

Deliverable: 10-15 E2E tests, 95% critical path coverage
```

### Future (Optional): Add Strategic Unit Tests
```
Later sprint: Add 10-20 unit tests for complex logic only
Focus: Pure functions, custom hooks, business logic
Skip: Component rendering (E2E covers this)
```

---

## 🛠️ IMPLEMENTATION GUIDES

### Option A: E2E with Maestro

**1. Setup (2h):**
```bash
# Install Maestro
curl -Ls "https://get.maestro.mobile.dev" | bash

# Create test directory
mkdir mobile/e2e
cd mobile/e2e

# Initialize
maestro init
```

**2. First Test (1h):**
```yaml
# e2e/smoke-test.yaml
appId: com.antigaspi.mobile
---
- launchApp
- assertVisible: "Connexion"
- tapOn: "Admin Login"
- inputText: "admin@antigaspi.com"
- tapOn: "Mot de passe"
- inputText: "password"
- tapOn: "Se connecter"
- assertVisible: "Dashboard"
- assertVisible: "250" # total_users
```

**3. Run Tests:**
```bash
# Local
maestro test e2e/

# CI (GitHub Actions)
- uses: mobile-dev-inc/action-maestro-cloud@v1
  with:
    api-key: ${{ secrets.MAESTRO_CLOUD_API_KEY }}
    app-file: app-release.apk
```

**4. Full Flow Example:**
```yaml
# e2e/admin-approve-product.yaml
appId: com.antigaspi.mobile
---
- launchApp
- tapOn: "Admin Login"
- inputText: "admin@antigaspi.com"
- inputText: "password"
- tapOn: "Se connecter"
- tapOn: "Gestion Produits"
- tapOn: "En attente"
- tapOn: "Bananes mûres"
- assertVisible: "Détails Produit"
- assertVisible: "Approuver le produit"
- tapOn: "Approuver le produit"
- tapOn: "Approuver" # Confirmation
- assertVisible: "Succès"
- assertVisible: "Produit approuvé"
- tapOn: "✕" # Close modal
- assertNotVisible: "Bananes mûres" # Product removed from pending
```

### Option B: Critical Tests Refactoring

**1. Setup Test Fixtures (4h):**
```typescript
// test-utils/fixtures/makeProduct.ts
export const makeProduct = (overrides = {}) => ({
  id: faker.number.int(),
  name: faker.commerce.productName(),
  description: faker.commerce.productDescription(),
  original_price: '1000',
  discounted_price: '700',
  discount_percentage: 30,
  quantity_available: 10,
  expiration_date: faker.date.future().toISOString(),
  is_active: true,
  needs_approval: false,
  image_url: 'product.jpg',
  category: makeCategory(),
  merchant: makeMerchant(),
  ...overrides
})
```

**2. Rewrite Test Template:**
```typescript
// __tests__/AdminProductsScreen.test.tsx
import { makeProduct } from '../../test-utils/fixtures'

describe('AdminProductsScreen - Critical Tests', () => {
  it('[CRITICAL] Admin can approve pending product', async () => {
    const pendingProduct = makeProduct({
      needs_approval: true,
      name: 'Bananes mûres'
    })

    apiService.get.mockResolvedValue({
      data: { data: [pendingProduct] }
    })

    const { findByText } = await renderWithProviders(
      <AdminProductsScreen />
    )

    // Wait for product list
    const productCard = await findByText('Bananes mûres')
    expect(productCard).toBeTruthy()

    // Open detail
    await act(async () => {
      fireEvent.press(productCard)
    })

    // Find and press approve
    const approveBtn = await findByText('Approuver le produit')
    await act(async () => {
      fireEvent.press(approveBtn)
    })

    // Verify API call
    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/admin/products/1/approve'
      )
    })
  })
})
```

### Option C: Complete Refactoring

**1. Setup MSW (8h):**
```typescript
// test-utils/msw/server.ts
import { setupServer } from 'msw/native'
import { handlers } from './handlers'

export const server = setupServer(...handlers)

// test-utils/msw/handlers.ts
import { rest } from 'msw'

export const handlers = [
  rest.get('http://localhost:8000/api/products', (req, res, ctx) => {
    return res(
      ctx.delay(100),
      ctx.json({
        data: [makeProduct(), makeProduct(), makeProduct()]
      })
    )
  }),

  rest.post('http://localhost:8000/api/admin/products/:id/approve', (req, res, ctx) => {
    return res(
      ctx.delay(200),
      ctx.json({ success: true })
    )
  })
]
```

**2. Test Setup Template:**
```typescript
// setupTests.ts
import { server } from './test-utils/msw/server'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

**3. Migration Script:**
```bash
# Convert all getBy → findBy
find src/__tests__ -name "*.test.tsx" -exec sed -i 's/getByText/findByText/g' {} +

# Add await to all find queries
# Manual review needed for proper async/await
```

---

## 📅 TIMELINE ESTIMATES

### Option A (E2E - RECOMMENDED):
```
Week 1:
  Mon: Setup (4h) + Smoke tests (4h)
  Tue: Admin flows (8h)
  Wed: Polish + CI (6h) + Docs (2h)

Deliverable: 15 E2E tests, production-ready
```

### Option B (Critical Tests):
```
Week 1:
  Mon-Tue: Setup + fixtures (16h)
  Wed-Thu: Rewrite Dashboard/Products (16h)
  Fri: Users/Merchants (8h)

Deliverable: 20-30 solid unit tests
```

### Option C (Complete Refactoring):
```
Week 1:
  Mon-Tue: Infrastructure (16h)
  Wed-Fri: Dashboard + Products (24h)

Week 2:
  Mon-Wed: Users + Categories + Merchants (24h)
  Thu-Fri: Polish + documentation (16h)

Deliverable: 98 tests refactored, 80%+ pass rate
```

---

## 🎯 DECISION MATRIX

**Choose Option A if:**
- ✅ Time is limited (3 days available)
- ✅ Need high confidence fast
- ✅ Team has mobile testing experience
- ✅ Prefer fewer, robust tests

**Choose Option B if:**
- ✅ Want balance (1 week available)
- ✅ Need fast test execution
- ✅ Comfortable with lower coverage
- ✅ Good unit testing skills

**Choose Option C if:**
- ✅ Time is available (2 weeks)
- ✅ Need maximum coverage
- ✅ Strong testing culture
- ✅ Long-term investment mindset

---

## 📝 NEXT STEPS

### Immediate (Today):
1. ✅ Review this plan with team
2. ✅ Choose option (A/B/C)
3. ✅ Allocate time in sprint

### Short-term (This Week):
1. Start implementation of chosen option
2. Setup infrastructure (Maestro or MSW)
3. Write first 5-10 tests

### Medium-term (Next Sprint):
1. Complete test suite
2. Integrate with CI/CD
3. Document patterns for team

---

## 🔗 RESOURCES

### E2E Testing:
- Maestro: https://maestro.mobile.dev
- Detox: https://wix.github.io/Detox
- Comparison: https://blog.mobile.dev/maestro-vs-detox

### Modern React Testing:
- Testing Library: https://testing-library.com/docs/react-native-testing-library/intro
- Kent C. Dodds: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library
- MSW: https://mswjs.io/docs/getting-started

### Best Practices:
- Test Architecture: https://testingjavascript.com
- E2E vs Unit: https://martinfowler.com/articles/practical-test-pyramid.html

---

**Document Owner:** Claude Code
**Last Updated:** 2025-10-21
**Status:** Ready for decision
**Recommended Option:** A (E2E Tests)
