# Technical Review Scoring Standard — Battery EOS

## Overview

Every story that reaches `technical_review` status must undergo a scored technical review by an authorised reviewer. The review produces a numeric score, written comments, and an approval decision.

## Reviewer Roles

| Platform Role | Can Review |
|--------------|-----------|
| Developer / Admin | ✅ |
| Partner Admin | ✅ |
| Org Owner | ✅ |
| Org Manager | ✅ |
| Org Approver | ✅ |
| Org Engineer | ❌ |
| Inspector / Auditor / Viewer | ❌ |

## Scoring Categories

Each category is scored from **0 to 10**. The overall score is the arithmetic mean of all 7 categories.

| # | Category | What It Measures |
|---|----------|-----------------|
| 1 | Requirements Compliance | Does the implementation satisfy all acceptance criteria? |
| 2 | Architecture Quality | Is the design sound, scalable, and consistent with platform patterns? |
| 3 | Implementation Quality | Is the code clean, readable, and maintainable? |
| 4 | Testing Quality | Are tests comprehensive, covering positive and negative cases? |
| 5 | Security Quality | Have security test cases been executed? Are there no obvious vulnerabilities? |
| 6 | Documentation Quality | Is the story, description, and evidence documentation complete? |
| 7 | Demo Quality | Was the feature demonstrated end-to-end with all edge cases? |

## Score Thresholds

| Score | Classification | Interpretation |
|-------|---------------|---------------|
| 9.0 – 10.0 | Excellent | Approve without conditions |
| 7.0 – 8.9 | Good | Approve with minor notes |
| 5.0 – 6.9 | Acceptable | Approve with required follow-up actions |
| 3.0 – 4.9 | Below Standard | Request rework before approval |
| 0.0 – 2.9 | Unacceptable | Request rework; escalate to manager |

## Approval Decisions

| Decision | When To Use |
|----------|-------------|
| `approved` | Overall score ≥ 7.0 and all critical criteria met |
| `rework_requested` | Score < 7.0, or a critical category scored < 5, or security gaps found |

## Firestore Schema

```
Collection: engineeringReviews
  Document ID: auto-generated
  Fields:
    reviewId:       string
    storyId:        string        // WP-NNN-SN
    workPackageId:  string        // WP-NNN
    productKey:     string        // battery_pm
    reviewerEmail:  string
    reviewerUid:    string
    organisationId: string?
    partnerId:      string?
    score:          EosReviewScore   // 7 fields + overallScore
    comments:       string
    decision:       approved | rework_requested | pending
    submittedAt:    string        // ISO datetime
    createdAt:      string
    updatedAt:      string
```

## Overall Score Calculation

```typescript
overallScore = (
  requirementsCompliance +
  architectureQuality +
  implementationQuality +
  testingQuality +
  securityQuality +
  documentationQuality +
  demoQuality
) / 7
```

Rounded to 1 decimal place for display.

## Post-Rework Cycle

If `rework_requested`:
1. Story status returns to `in_development`
2. Engineer addresses reviewer comments
3. Story moves through `ready_for_verification → verification → technical_review` again
4. A new review is submitted (previous reviews are preserved in Firestore)

There is no limit on the number of rework cycles.
