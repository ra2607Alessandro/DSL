"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Interpreter = /** @class */ (function () {
    function Interpreter() {
        this.accountRegistry = {};
        this.ledger = {};
        this.openings = {};
        this.report = [];
        this.txnCounter = 0;
    }
    Interpreter.prototype.process_account_blocks = function (block) {
        for (var account_name in block.accounts) {
            var type = block.accounts[account_name];
            this.accountRegistry[account_name] = { type: type, isExplicit: true };
        }
    };
    Interpreter.prototype.process_journal_blok = function (block) {
        if (block.type !== "JournalBlock") {
            throw new Error("The required type is: 'JournalBlock', yours is:".concat(console.log(block.type)));
        }
        for (var _i = 0, _a = block.txns; _i < _a.length; _i++) {
            var txn = _a[_i];
            this.process_transaction(txn);
        }
    };
    Interpreter.prototype.process_transaction = function (txn) {
        this.txnCounter++;
        var ID = "TXN-".concat(String(this.txnCounter));
        var postings = [];
        for (var _i = 0, _a = txn.flow; _i < _a.length; _i++) {
            var movement = _a[_i];
            postings.push.apply(postings, this.convert_movement_into_postings(movement, ID, txn.date, txn.name));
        }
        var totalDebits = 0;
        var totalCredits = 0;
        for (var _b = 0, postings_1 = postings; _b < postings_1.length; _b++) {
            var posting = postings_1[_b];
            if (posting.side === "credit") {
                totalCredits += posting.amount;
            }
            else if (posting.side === "debit") {
                totalDebits += posting.amount;
            }
        }
        if (Math.abs(totalDebits - totalCredits) > 0.01) {
            throw new Error("Transaction ".concat(ID, " doesn't balance: debits=").concat(totalDebits, ", credits=").concat(totalCredits));
        }
        for (var _c = 0, postings_2 = postings; _c < postings_2.length; _c++) {
            var posting = postings_2[_c];
            this.post_to_ledger(posting.account, posting);
        }
    };
    Interpreter.prototype.convert_movement_into_postings = function (movement, ID, date, description) {
        var postings = new Array();
        if (movement.flow == "->") {
            postings = [
                {
                    account: movement.account1,
                    side: "debit",
                    amount: movement.amount,
                    ID: ID,
                    date: date,
                    description: description
                },
                {
                    account: movement.account2,
                    side: "credit",
                    amount: movement.amount,
                    ID: ID,
                    date: date,
                    description: description
                }
            ];
        }
        return postings;
    };
    Interpreter.prototype.post_to_ledger = function (account_name, posting) {
        if (!this.ledger[account_name]) {
            this.ledger[account_name] = [];
        }
        if (!this.accountRegistry[account_name]) {
            this.accountRegistry[account_name] = { type: "unknown", isExplicit: false };
        }
        this.ledger[account_name].push(posting);
    };
    Interpreter.prototype.process_opening_blocks = function (block) {
        var ID = "OPEN-".concat(String(this.txnCounter));
        var amount = 0;
        var postings = {};
        for (var account in block.balances) {
            amount = block.balances[account];
            if (amount < 0) {
                postings[account] = {
                    account: account,
                    side: "debit",
                    amount: amount,
                    ID: ID,
                    date: block.date,
                    description: block.type
                };
            }
            else if (amount > 0) {
                {
                    postings[account] = {
                        account: account,
                        side: "credit",
                        amount: amount,
                        ID: ID,
                        date: block.date,
                        description: block.type
                    };
                }
            }
            this.openings[account] = postings[account];
        }
    };
    Interpreter.prototype.process_close_block = function (block) {
        // For each movement, transfer the full balance from source to target
        for (var _i = 0, _a = block.movements; _i < _a.length; _i++) {
            var move = _a[_i];
            var source = move.account1;
            var target = move.account2;
            var amount = this.get_balance(source);
            // If the balance is zero, nothing to close
            if (Math.abs(amount) < 0.01)
                continue;
            // Determine posting sides based on amount sign
            // If amount > 0, debit source, credit target
            // If amount < 0, credit source, debit target
            var postingSource = {};
            var postingTarget = {};
            if (amount > 0) {
                postingSource = {
                    account: target,
                    side: "debit",
                    amount: amount,
                    ID: "CLOSE-".concat(block.date),
                    date: block.date,
                    description: "Closing ".concat(source, " to ").concat(target)
                };
                postingTarget = {
                    account: source,
                    side: "credit",
                    amount: amount,
                    ID: "CLOSE-".concat(block.date),
                    date: block.date,
                    description: "Closing ".concat(source, " to ").concat(target)
                };
            }
            else if (amount < 0) {
                postingSource = {
                    account: source,
                    side: "credit",
                    amount: Math.abs(amount),
                    ID: "CLOSE-".concat(block.date),
                    date: block.date,
                    description: "Closing ".concat(source, " to ").concat(target)
                };
                postingTarget = {
                    account: target,
                    side: "debit",
                    amount: Math.abs(amount),
                    ID: "CLOSE-".concat(block.date),
                    date: block.date,
                    description: "Closing ".concat(source, " to ").concat(target)
                };
            }
            // Append postings to ledger
            if (!this.ledger[source]) {
                this.ledger[source] = [];
            }
            if (!this.ledger[target]) {
                this.ledger[target] = [];
            }
            this.ledger[source].push(postingSource);
            this.ledger[target].push(postingTarget);
        }
    };
    Interpreter.prototype.process_report_block = function (block) {
        console.log("REPORT");
        if (block.all == true && !block.accounts) {
            for (var account_name in this.accountRegistry) {
                this.report.push("BALANCE OF ACCOUNT: ".concat(account_name));
                this.report.push(this.get_balance(account_name));
            }
        }
        else if (block.accounts && block.all == false) {
            for (var _i = 0, _a = block.accounts; _i < _a.length; _i++) {
                var account = _a[_i];
                if (this.get_account_registry(account.value)) {
                    this.report.push("BALANCE OF ACCOUNT: ".concat(account.value));
                    this.report.push(this.get_balance(account.value));
                }
            }
        }
    };
    Interpreter.prototype.Interpret = function (program) {
        for (var _i = 0, _a = program.value; _i < _a.length; _i++) {
            var block = _a[_i];
            switch (block.type) {
                case "AccountBlock":
                    this.process_account_blocks(block);
                    break;
                case "JournalBlock":
                    this.process_journal_blok(block);
                    break;
                case "OpeningBlock":
                    this.process_opening_blocks(block);
                    break;
                case "CloseBlock":
                    this.process_close_block(block);
                    break;
                case "ReportBlock":
                    this.process_report_block(block);
                    return this.report;
                default:
                    throw new Error("The block type of ".concat(console.log(block), " has not been recognized"));
            }
        }
    };
    Interpreter.prototype.get_account_registry = function (account_name) {
        if (account_name) {
            var md = this.accountRegistry[account_name];
            return { md: md };
        }
        return this.accountRegistry;
    };
    Interpreter.prototype.get_ledger = function (account_name) {
        if (account_name) {
            var posting = this.ledger[account_name];
            return { posting: posting };
        }
        return this.ledger;
    };
    Interpreter.prototype.get_openings = function () {
        return this.openings;
    };
    Interpreter.prototype.get_balance = function (account_name) {
        var balance = 0;
        if (this.openings[account_name]) {
            balance = this.openings[account_name].amount;
        }
        if (this.ledger[account_name]) {
            for (var _i = 0, _a = this.ledger[account_name]; _i < _a.length; _i++) {
                var posting = _a[_i];
                if (posting.side == "debit") {
                    balance -= posting.amount;
                }
                else if (posting.side == "credit") {
                    balance += posting.amount;
                }
            }
        }
        return balance;
    };
    return Interpreter;
}());
exports.default = Interpreter;
//const int = new Interpreter();
//const parser = new Parser();
//const test = fs.readFileSync("test.txt", "utf-8");
//const t = parser.ProduceAst(test);
//int.Interpret(t);
