# Story Standard — Battery EOS

## Engineering Standard

Every story in the Battery EOS must follow this fixed effort allocation:

| Phase | Hours |
|-------|-------|
| Engineering | **8h** |
| QA / Verification | **2h** |
| Technical Review | **2h** |
| **Total** | **12h** |

This is enforced at the TypeScript type level (`engineeringHours: 8`, `qaHours: 2`, `reviewHours: 2`) and verified by the verification script.

## Story Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `storyId` | string | ✅ | Format: `WP-NNN-SN` |
| `workPackageId` | string | ✅ | Parent WP |
| `milestoneId` | string | ✅ | Parent milestone |
| `title` | string | ✅ | Short story title |
| `description` | string | ✅ | Detailed description of what the story delivers |
| `userStory` | string | ✅ | "As a [role], I want [capability], so that [outcome]" |
| `engineeringHours` | 8 | ✅ | Fixed at 8 |
| `qaHours` | 2 | ✅ | Fixed at 2 |
| `reviewHours` | 2 | ✅ | Fixed at 2 |
| `priority` | EosPriority | ✅ | `low \| medium \| high \| critical` |
| `status` | EosStoryStatus | ✅ | See status lifecycle below |
| `dueDate` | string | — | ISO date |
| `assignedEngineer` | string | — | Email of assigned engineer |
| `reviewer` | string | — | Email of reviewer |
| `approver` | string | — | Email of approver |
| `acceptanceCriteria` | string[] | ✅ | 5+ criteria that must pass |
| `definitionOfDone` | string[] | ✅ | 5+ DoD checklist items |
| `useCases` | string[] | ✅ | 3+ positive use cases |
| `negativeUseCases` | string[] | ✅ | 3+ negative / edge cases |
| `testCases` | string[] | ✅ | 5+ functional test cases |
| `securityTestCases` | string[] | ✅ | 3+ security-specific test cases |
| `evidenceLinks` | string[] | — | URLs to design docs, test reports |
| `githubPR` | string | — | GitHub PR URL |
| `githubCommit` | string | — | Git commit SHA |
| `reviewScore` | EosReviewScore | — | Set after technical review |
| `reviewComments` | string | — | Reviewer feedback |
| `approvalDecision` | EosApprovalDecision | — | `approved \| rework_requested \| pending` |

## Story Status Lifecycle

```
planned
  └── assigned
        └── in_development
              └── ready_for_verification
                    └── verification
                          └── technical_review
                                ├── approved  ──► released
                                └── (rework_requested → back to in_development)
blocked  (can exit from any active status)
```

## Required Arrays — Minimum Counts

| Array | Minimum |
|-------|---------|
| `acceptanceCriteria` | 5 |
| `definitionOfDone` | 5 |
| `useCases` | 3 |
| `negativeUseCases` | 3 |
| `testCases` | 5 |
| `securityTestCases` | 3 |

## Definition of Done (DoD) Template

Every story's `definitionOfDone` must include:
1. Code reviewed by a second engineer
2. Unit tests written and passing
3. Security test cases executed
4. Acceptance criteria all verified
5. Documentation updated
6. PR merged to main branch
7. QA sign-off received

## Security Test Case Guidelines

Security test cases must cover at least one of:
- Input validation (injection, overflow)
- Authentication / authorisation check
- Data integrity verification
- Replay or tamper detection
- Audit trail / logging verification
