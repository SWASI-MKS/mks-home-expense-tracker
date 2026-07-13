- [x] Gather current TS build errors (TS6133/7006/2305/2339 and balance architecture references)
- [ ] Fix missing exported type `FamilyMember` (export from src/types)
- [ ] Replace all `Account.balance` usages with opening balance + computed running/current balance from `useBalanceEngine`
- [ ] Fix TS7006 implicit `any` parameters by adding explicit types
- [ ] Fix TS6133 unused imports/variables
- [ ] Re-run `npm run build` / `tsc -b` until `✓ 0 TypeScript errors` and `✓ 0 build errors`
- [ ] Validate no business logic changes beyond type-safe compilation fixes


