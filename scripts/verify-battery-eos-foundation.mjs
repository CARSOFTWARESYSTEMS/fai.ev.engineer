#!/usr/bin/env node
/**
 * Battery EOS Foundation Verification Script
 * Run: node scripts/verify-battery-eos-foundation.mjs
 *
 * Verifies all Sprint 2 deliverables for the Battery Intelligence EOS workspace.
 * Exits with code 0 on PASS, 1 on FAIL.
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT  = resolve(__dir, '..')

// ─── Helpers ──────────────────────────────────────────────────────────────────

let passed  = 0
let failed  = 0
const fails = []

function read(rel) {
  const p = resolve(ROOT, rel)
  if (!existsSync(p)) return null
  return readFileSync(p, 'utf8')
}

function check(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅  ${label}`)
    passed++
  } else {
    console.log(`  ❌  ${label}${detail ? ` — ${detail}` : ''}`)
    failed++
    fails.push(label)
  }
}

function section(title) {
  console.log(`\n${'─'.repeat(60)}`)
  console.log(`  ${title}`)
  console.log('─'.repeat(60))
}

// ─── 1. Product Catalogue ─────────────────────────────────────────────────────

section('1. Product Catalogue')

const catalogue = read('src/modules/platform/productCatalogue.ts')
check('productCatalogue.ts exists',         catalogue !== null)
check("battery_pm product key present",     catalogue?.includes("'battery_pm'") ?? false)
check("Battery Intelligence name present",  catalogue?.includes('Battery Intelligence') ?? false)
check("routeBase /products/battery-intelligence", catalogue?.includes('/products/battery-intelligence') ?? false)
check("battery_pm status is active",        /productKey:\s*'battery_pm'[\s\S]{0,700}status:\s*'active'/.test(catalogue ?? ''))

// ─── 2. Router ────────────────────────────────────────────────────────────────

section('2. Router & Route Guard')

const router = read('src/app/router.tsx')
check('router.tsx exists',                      router !== null)
check('/products/battery-intelligence route',   router?.includes('/products/battery-intelligence') ?? false)
check('BatteryIntelligencePage imported',       router?.includes('BatteryIntelligencePage') ?? false)
check('ProductRoute guard wraps battery route', router?.includes("product=\"battery_pm\"") ?? false)

const productRoute = read('src/auth/ProductRoute.tsx')
check('ProductRoute.tsx exists',                productRoute !== null)
check("battery_pm label updated",               productRoute?.includes('Battery Intelligence') ?? false)

// ─── 3. BatteryIntelligencePage ───────────────────────────────────────────────

section('3. BatteryIntelligencePage (EOS Workspace)')

const page = read('src/pages/BatteryIntelligencePage.tsx')
check('BatteryIntelligencePage.tsx exists',     page !== null)
check('useEosRole hook used',                   page?.includes('useEosRole') ?? false)
check('useDailyCheckin hook used',              page?.includes('useDailyCheckin') ?? false)
check('DailyCheckinPanel imported',             page?.includes('DailyCheckinPanel') ?? false)
check('WorkPackageCard imported',               page?.includes('WorkPackageCard') ?? false)
check('WorkPackageDetail imported',             page?.includes('WorkPackageDetail') ?? false)
check('EngineerDashboard imported',             page?.includes('EngineerDashboard') ?? false)
check('ManagerDashboard imported',              page?.includes('ManagerDashboard') ?? false)
check('ReviewQueue imported',                   page?.includes('ReviewQueue') ?? false)
check('WP001 seed imported',                    page?.includes('WP001_BATTERY_AADHAAR') ?? false)
check('WP005 seed imported',                    page?.includes('WP005_BATTERY_CYBERSECURITY') ?? false)
check('Engineer check-in gate logic',           page?.includes('needsCheckin') ?? false)
check('Tab navigation present',                 page?.includes("activeTab === 'overview'") ?? false)
check('My Work tab (engineer)',                 page?.includes("activeTab === 'my_work'") ?? false)
check('Team tab (manager)',                     page?.includes("activeTab === 'team'") ?? false)
check('Reviews tab (reviewer)',                 page?.includes("activeTab === 'reviews'") ?? false)

// ─── 4. EOS Type System ───────────────────────────────────────────────────────

section('4. EOS Type System')

const types = read('src/features/batteryEos/types/eos.types.ts')
check('eos.types.ts exists',                    types !== null)
check('EosWorkPackage interface',               types?.includes('interface EosWorkPackage') ?? false)
check('EosMilestone interface',                 types?.includes('interface EosMilestone') ?? false)
check('EosStory interface',                     types?.includes('interface EosStory') ?? false)
check('EosDailyCheckin interface',              types?.includes('interface EosDailyCheckin') ?? false)
check('EosReview interface',                    types?.includes('interface EosReview') ?? false)
check('EosRoleAccess interface',                types?.includes('interface EosRoleAccess') ?? false)
check('EosReviewScore interface',               types?.includes('interface EosReviewScore') ?? false)
check('EOS_STORY_STATUS_LABELS exported',       types?.includes('EOS_STORY_STATUS_LABELS') ?? false)
check('EOS_WP_STATUS_LABELS exported',          types?.includes('EOS_WP_STATUS_LABELS') ?? false)

// ─── 5. WP-001 Seed Data (Battery Aadhaar) ────────────────────────────────────

section('5. WP-001 Seed Data — Battery Aadhaar')

const wp001 = read('src/features/batteryEos/data/wp001.seed.ts')
check('wp001.seed.ts exists',                   wp001 !== null)
check("workPackageId: 'WP-001'",                wp001?.includes("workPackageId:   'WP-001'") ?? false)
check('3+ milestones',                          (wp001?.match(/milestoneId:/g) ?? []).length >= 3)
check('5+ stories',                             (wp001?.match(/storyId:/g) ?? []).length >= 5)

// Verify every story has required hours (expect 5 occurrences of each)
const eng001  = (wp001?.match(/engineeringHours: 8/g) ?? []).length
const qa001   = (wp001?.match(/qaHours:\s*2/g) ?? []).length
const rev001  = (wp001?.match(/reviewHours:\s*2/g) ?? []).length
check(`All stories have 8h engineering (${eng001}/5)`,  eng001 >= 5)
check(`All stories have 2h QA (${qa001}/5)`,            qa001  >= 5)
check(`All stories have 2h review (${rev001}/5)`,       rev001 >= 5)

// Required arrays
const ac001   = (wp001?.match(/acceptanceCriteria:/g) ?? []).length
const dod001  = (wp001?.match(/definitionOfDone:/g) ?? []).length
const tc001   = (wp001?.match(/testCases:/g) ?? []).length
const stc001  = (wp001?.match(/securityTestCases:/g) ?? []).length
check(`All stories have acceptanceCriteria (${ac001}/5)`,   ac001  >= 5)
check(`All stories have definitionOfDone (${dod001}/5)`,    dod001 >= 5)
check(`All stories have testCases (${tc001}/5)`,            tc001  >= 5)
check(`All stories have securityTestCases (${stc001}/5)`,   stc001 >= 5)

// ─── 6. WP-005 Seed Data (Battery Cybersecurity) ─────────────────────────────

section('6. WP-005 Seed Data — Battery Cybersecurity')

const wp005 = read('src/features/batteryEos/data/wp005.seed.ts')
check('wp005.seed.ts exists',                   wp005 !== null)
check("workPackageId: 'WP-005'",                wp005?.includes("workPackageId:   'WP-005'") ?? false)
check('3+ milestones',                          (wp005?.match(/milestoneId:/g) ?? []).length >= 3)
check('5+ stories',                             (wp005?.match(/storyId:/g) ?? []).length >= 5)

const eng005  = (wp005?.match(/engineeringHours: 8/g) ?? []).length
const qa005   = (wp005?.match(/qaHours:\s*2/g) ?? []).length
const rev005  = (wp005?.match(/reviewHours:\s*2/g) ?? []).length
check(`All stories have 8h engineering (${eng005}/5)`,  eng005 >= 5)
check(`All stories have 2h QA (${qa005}/5)`,            qa005  >= 5)
check(`All stories have 2h review (${rev005}/5)`,       rev005 >= 5)

const ac005   = (wp005?.match(/acceptanceCriteria:/g) ?? []).length
const dod005  = (wp005?.match(/definitionOfDone:/g) ?? []).length
const tc005   = (wp005?.match(/testCases:/g) ?? []).length
const stc005  = (wp005?.match(/securityTestCases:/g) ?? []).length
check(`All stories have acceptanceCriteria (${ac005}/5)`,   ac005  >= 5)
check(`All stories have definitionOfDone (${dod005}/5)`,    dod005 >= 5)
check(`All stories have testCases (${tc005}/5)`,            tc005  >= 5)
check(`All stories have securityTestCases (${stc005}/5)`,   stc005 >= 5)

// ─── 7. Services ──────────────────────────────────────────────────────────────

section('7. EOS Services')

const checkinSvc = read('src/features/batteryEos/services/dailyCheckin.service.ts')
check('dailyCheckin.service.ts exists',         checkinSvc !== null)
check("Collection: engineeringCheckins",        checkinSvc?.includes('engineeringCheckins') ?? false)
check('getTodayCheckin exported',               checkinSvc?.includes('getTodayCheckin') ?? false)
check('submitDailyCheckin exported',            checkinSvc?.includes('submitDailyCheckin') ?? false)
check('getRecentCheckins exported',             checkinSvc?.includes('getRecentCheckins') ?? false)

const reviewSvc = read('src/features/batteryEos/services/engineeringReview.service.ts')
check('engineeringReview.service.ts exists',    reviewSvc !== null)
check("Collection: engineeringReviews",         reviewSvc?.includes('engineeringReviews') ?? false)
check('submitReview exported',                  reviewSvc?.includes('submitReview') ?? false)
check('calculateOverallScore exported',         reviewSvc?.includes('calculateOverallScore') ?? false)

// ─── 8. Hooks ─────────────────────────────────────────────────────────────────

section('8. EOS Hooks')

const eosRole = read('src/features/batteryEos/hooks/useEosRole.ts')
check('useEosRole.ts exists',                   eosRole !== null)
check('useDeveloperAccess used',                eosRole?.includes('useDeveloperAccess') ?? false)
check('usePartnerAccess used',                  eosRole?.includes('usePartnerAccess') ?? false)
check('isEngineer mapped',                      eosRole?.includes('isEngineer') ?? false)
check('isManager mapped',                       eosRole?.includes('isManager') ?? false)
check('isReviewer mapped',                      eosRole?.includes('isReviewer') ?? false)

const dailyCheckinHook = read('src/features/batteryEos/hooks/useDailyCheckin.ts')
check('useDailyCheckin.ts exists',              dailyCheckinHook !== null)
check('hasCheckedIn returned',                  dailyCheckinHook?.includes('hasCheckedIn') ?? false)
check('refresh function returned',              dailyCheckinHook?.includes('refresh') ?? false)

// ─── 9. Components ────────────────────────────────────────────────────────────

section('9. EOS Components')

const componentFiles = [
  'RoleCTAButtons',
  'WorkPackageCard',
  'StoryCard',
  'DailyCheckinPanel',
  'WorkPackageDetail',
  'EngineerDashboard',
  'ManagerDashboard',
  'ReviewQueue',
]
for (const name of componentFiles) {
  const src = read(`src/features/batteryEos/components/${name}.tsx`)
  check(`${name}.tsx exists`, src !== null)
  check(`${name} exported`,   src?.includes(`export function ${name}`) ?? false)
}

// ─── 10. No Paid AI Imports ───────────────────────────────────────────────────

section('10. No Paid AI Provider Imports')

const PAID_AI_PATTERNS = ['openai', '@anthropic', 'anthropic', 'google-generativeai', '@google/generative-ai', 'gemini']
const SRC_FILES = [
  'src/features/batteryEos/types/eos.types.ts',
  'src/features/batteryEos/data/wp001.seed.ts',
  'src/features/batteryEos/data/wp005.seed.ts',
  'src/features/batteryEos/services/dailyCheckin.service.ts',
  'src/features/batteryEos/services/engineeringReview.service.ts',
  'src/features/batteryEos/hooks/useEosRole.ts',
  'src/features/batteryEos/hooks/useDailyCheckin.ts',
  'src/pages/BatteryIntelligencePage.tsx',
]
for (const file of SRC_FILES) {
  const content = read(file) ?? ''
  const hit     = PAID_AI_PATTERNS.find(p => content.toLowerCase().includes(p))
  check(`No paid AI in ${file.split('/').pop()}`, hit === undefined, hit ? `found: ${hit}` : '')
}

// ─── 11. FAI Reports Not Broken ───────────────────────────────────────────────

section('11. FAI Reports Routes Preserved')

check("fai_reports product route guard present", router?.includes('product="fai_reports"') ?? false)
check('/projects route (FAI Reports) present',  router?.includes("path: '/projects'") ?? false)

// ─── Result ───────────────────────────────────────────────────────────────────

console.log('\n' + '═'.repeat(60))
console.log(`  PASSED: ${passed}   FAILED: ${failed}   TOTAL: ${passed + failed}`)
console.log('═'.repeat(60))

if (failed === 0) {
  console.log('\n  ✅  ALL CHECKS PASS — Battery EOS Foundation verified.\n')
  process.exit(0)
} else {
  console.log(`\n  ❌  ${failed} CHECK(S) FAILED:\n`)
  fails.forEach(f => console.log(`       • ${f}`))
  console.log()
  process.exit(1)
}
