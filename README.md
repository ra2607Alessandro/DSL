# DSL: Programming Language for Accountants

A domain-specific language (DSL) designed for accountants to express and process financial transactions using double-entry bookkeeping principles.

## Overview

This DSL provides a simple, readable syntax for defining accounts, recording opening balances, journaling transactions, closing accounts at period-end, and generating reports. It automatically ensures that all transactions balance according to double-entry accounting rules.

## Core Features

### 1. ACCOUNTS Block

Define your chart of accounts by specifying account names and their types.

**Syntax:**
```
ACCOUNTS {
    AccountName: account_type
    ...
}
```

**Account Types:**
- `asset` - Resources owned by the entity
- `liability` - Obligations owed to others
- `equity` - Owner's capital and retained earnings
- `revenue` - Income from operations
- `expense` - Costs of doing business

**Example:**
```
ACCOUNTS {
    Cash: asset
    AccountsReceivable: asset
    Inventory: asset
    Loan: liability
    OwnerCapital: equity
    SalesRevenue: revenue
}
```

### 2. OPEN Block

Record opening balances for accounts at the start of a period.

**Syntax:**
```
OPEN YYYY-MM-DD {
    AccountName amount
    ...
}
```

**Convention:**
- Positive amounts represent credit balances
- Negative amounts represent debit balances

**Example:**
```
OPEN 2024-01-01 {
    Cash 10000.00
    AccountsReceivable 2000.00
    Loan -2000.00
    OwnerCapital -7000.00
}
```

### 3. JOURNAL Block

Record transactions throughout the accounting period. Each transaction uses flow movements to show how money moves between accounts.

**Syntax:**
```
JOURNAL {
    TXN YYYY-MM-DD "Description" {
        Account1 -> Account2 amount
        ...
    }
}
```

**Flow Movement:**
- `Account1 -> Account2 amount` - Debits Account1 and credits Account2

**Features:**
- Automatic balance validation (debits must equal credits)
- Multiple movements per transaction
- Descriptive transaction names
- Date tracking for each transaction

**Example:**
```
JOURNAL {
    TXN 2024-10-01 "Sale to customer" {
        Cash -> SalesRevenue 1000.00
    }
    
    TXN 2024-10-15 "Purchase inventory" {
        Inventory -> Cash 500.00
    }
}
```

### 4. CLOSE Block

Transfer account balances at period-end, typically to close temporary accounts (revenue/expense) into retained earnings.

**Syntax:**
```
CLOSE YYYY-MM-DD {
    SourceAccount -> TargetAccount 0
    ...
}
```

**Behavior:**
- Automatically transfers the full balance from source to target account
- The `0` amount is a placeholder; the actual balance is transferred
- Commonly used to close revenue and expense accounts into equity

**Example:**
```
CLOSE 2024-12-31 {
    SalesRevenue -> RetainedEarnings 0
    Expenses -> RetainedEarnings 0
}
```

### 5. REPORT Block

Generate balance reports for accounts.

**Syntax:**
```
REPORT: ALL
```
or
```
REPORT: AccountName1 AccountName2 ...
```

**Options:**
- `REPORT: ALL` - Shows balances for all defined accounts
- `REPORT: AccountName1 AccountName2` - Shows balances only for specified accounts

**Example:**
```
REPORT: ALL
```
or
```
REPORT: Cash AccountsReceivable
```

## Complete Example

```
ACCOUNTS {
    Cash: asset
    SalesRevenue: revenue
    RetainedEarnings: equity
}

OPEN 2024-01-01 {
    Cash 5000.00
    RetainedEarnings -5000.00
}

JOURNAL {
    TXN 2024-06-15 "Product sale" {
        Cash -> SalesRevenue 2000.00
    }
}

CLOSE 2024-12-31 {
    SalesRevenue -> RetainedEarnings 0
}

REPORT: ALL
```

## Technical Details

- **Date Format:** YYYY-MM-DD
- **String Format:** Enclosed in single `'` or double `"` quotes
- **Number Format:** Supports decimals (e.g., 1000.00, -500.50)
- **Balance Checking:** All transactions are automatically validated to ensure debits equal credits

## Usage

The DSL is implemented in TypeScript with three main components:
1. **Lexer** - Tokenizes the input
2. **Parser** - Builds an Abstract Syntax Tree (AST)
3. **Interpreter** - Executes the accounting logic and generates reports

To run a program:
```typescript
import Interpreter from "./int";
import Parser from "./parser";
import fs = require('fs');

const interpreter = new Interpreter();
const parser = new Parser();
const source = fs.readFileSync("your-file.txt", "utf-8");
const ast = parser.ProduceAst(source);
const report = interpreter.Interpret(ast);
console.log(report);
```

write a .txt file and connect it to the program attached and you won't have to write anymore Typescript.  

## Error Handling

The language includes validation for:
- Transaction balance errors (debits ≠ credits)
- Missing required syntax elements (braces, colons, etc.)
- Invalid account types
- Malformed dates and numbers
