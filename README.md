Accounting DSL 

A small, semantic, **transaction-first** DSL for double-entry accounting.
Write chronological journal entries (giornale); the interpreter posts them to a hidden *libro mastro* (T-accounts), computes saldi dei conti, performs chiusura, and produces Conto Economico, Stato Patrimoniale, and Rendiconto Finanziario automatically.

This README documents the language logic, developer roadmap (lexer → parser → interpreter), runtime model, and example programs so you can implement the engine starting from the spec and tests.

---

## Philosophy & Goals

* **Human-first**: Authors write transactions exactly as taught in school — chronological, per-event. No need to think in debits/credits.
* **Semantic**: Postings use `+` / `-` (increase / decrease). The compiler infers debit/credit from account classification (asset/liability/equity/revenue/expense).
* **Transaction-first**: Journal entries are the source of truth. The *libro mastro* (ledger/T-accounts) is derived and stored internally.
* **Explicit classification**: Users can (and should) declare account types to control how accounts appear in statements and how flows are categorized for the cash flow statement.
* **Auditable & versionable**: Text files are git-friendly, diffs are small and meaningful, and CI can validate balancing and assertions.

---

Example:
ACCOUNTS {
    Cash:              asset
    Bank:              asset
    Inventory:         asset
    AccountsReceivable: asset
    Equipment:         asset

    AccountsPayable:   liability
    VatPayable:        liability

    SalesRevenue:      revenue
    InterestRevenue:   revenue
    Cogs:              expense
    Salaries:          expense
    Rent:              expense
}

JOURNAL {
  TXN 2024-10-01 "Sale (principal)" {
      CreditsClients -> SalesRevenue   70010.00
      CreditsClients -> VATDebit       15402.20
  }

  TXN 2024-10-01 "Payment (principal)" {
      Cash -> CreditsClients 85412.20
  }
}

Economic Statement
revenue
expense

Balance Sheet:
asset
liability
equity

Financial (Cash Flow) Statement:
Cash Flow from Operating Activities:
  Customer receipts:          85,412.20
  VAT movements:               ...
  Supplier payments:           ...

Net Cash from Operations:     85,412.20


Running the interpreter produces:

* Canonical Journal (chronological with generated DR/CR)
* Libro Mastro (hidden ledger; can print T-accounts for any account)
* Saldo dei Conti (trial balance)
* Conto Economico (Income Statement)
* Stato Patrimoniale (Balance Sheet)
* Rendiconto Finanziario (Cash Flow Statement)


## Core language concepts

### Transaction-first model

* `TXN date "Description" { postings... }` — chronological journal entries.
* Each `posting` is `Account + amount` (increase) or `Account - amount` (decrease).
* All postings are appended to the *libro mastro* (hidden ledger) immediately.

### Implicit vs explicit accounts

* **Implicit**: An account referenced in any `TXN` is created automatically (type inference or unknown until declared).
* **Explicit (recommended)**: `ACCOUNTS` block declares account names and types (asset/liability/equity/revenue/expense). This controls statement assembly.

### Opening balances

* `OPENING date { Account amount ... }`
* For convenience: Assets/Expenses positive; Liabilities/Equity may be negative; interpreter normalizes.

### Closing

* `CLOSE date { move Source -> Target ... }` — convenience for closing P&L to Retained Earnings (or equivalent).
* Alternately, allow manual `TXN` closing entries.

### Reports

* `REPORT all|journal|ledger|trial|pnl|bs|cf` — CLI can emit one or more reports.

---

## Semantics — mapping +/- to debit/credit

When interpreting a posting `(Account op amount)`:

1. Lookup `Account` type. If unknown, use heuristics or error/warning.

2. Map `(type, op)` → posting side:

   * Asset: `+` → **Debit**, `-` → **Credit**
   * Liability: `+` → **Credit**, `-` → **Debit**
   * Equity: `+` → **Credit**, `-` → **Debit**
   * Revenue: `+` → **Credit**, `-` → **Debit**
   * Expense: `+` → **Debit**, `-` → **Credit**

3. Store canonical posting `(debit|credit, account, amount, txn_id, date, memo)` in the *libro mastro*.

4. Validate transaction balancing: sum(debits) == sum(credits) within rounding epsilon (1 cent).

   * If unbalanced: surface helpful diagnostics (likely sign error, missing counterpart, unknown account).

---

## Internal data model

* **Journal**: ordered list of transactions as authored.
* **Journal Entry**: `{ id, date, description, postings:[{account, op, amount, memo}], metadata }`.
* **Ledger (Libro Mastro)**: map `account_name -> [posting_records]`. Posting records are canonical debit/credit records with running balance if needed.
* **Account metadata**: `{ name, type, contra_flag?, currency? }`.
* **Balances**: `balance(account) = sum(all postings)`, tracked in minor units (cents) to avoid float errors.
* **Reports**: derived queries over ledger + account metadata.

---

## Statement assembly rules

### Income Statement (Conto Economico)

* All accounts classified `revenue` or `expense`.
* `TotalRevenue = sum(balances of revenue accounts)`
* `TotalExpenses = sum(balances of expense accounts)`
* `NetIncome = TotalRevenue - TotalExpenses`

### Balance Sheet (Stato Patrimoniale)

* Assets: all `asset` accounts (ending balances)
* Liabilities: all `liability` accounts
* Equity: all `equity` accounts (include Retained Earnings after close)
* Verify `sum(assets) == sum(liabilities) + sum(equity)`

### Cash Flow (Rendiconto Finanziario)

* Default: **indirect method**

  * Start from `NetIncome`
  * Adjust for non-cash operations (depreciation if tracked)
  * Add/subtract changes in working capital (ΔAR, ΔAP, ΔInventory)
  * Investing: cash flows from `asset` accounts identified as long-term (e.g., PPE)
  * Financing: cash flows involving `liabilities` or `equity` (loans, capital injections, repayments)
* Alternative: **direct method** by extracting all `TXN` postings involving accounts marked `cash` or `bank` and grouping them by operation type (operating/investing/financing) according to configured mapping rules.




Which do you want me to do next?

