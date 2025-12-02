"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var parser_1 = require("./parser");
var fs = require("fs");
var Interpreter = /** @class */ (function () {
    function Interpreter() {
        this.accountRegistry = {};
        this.ledger = {};
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
        else if (movement.flow == "<-") {
            postings = [{
                    account: movement.account2,
                    side: "debit",
                    amount: movement.amount,
                    ID: ID,
                    date: date,
                    description: description
                },
                {
                    account: movement.account1,
                    side: "credit",
                    amount: movement.amount,
                    ID: ID,
                    date: date,
                    description: description
                }];
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
                default:
                    throw new Error("The block type has not been recognized");
            }
        }
    };
    Interpreter.prototype.get_account_registry = function () {
        return this.accountRegistry;
    };
    Interpreter.prototype.get_ledger = function () {
        return this.ledger;
    };
    Interpreter.prototype.get_balance = function (account_name) {
        if (!this.ledger[account_name]) {
            return 0;
        }
        var balance = 0;
        for (var _i = 0, _a = this.ledger[account_name]; _i < _a.length; _i++) {
            var posting = _a[_i];
            if (posting.side = "credit") {
                balance += posting.amount;
            }
            if (posting.side = "debit") {
                balance -= posting.amount;
            }
        }
        return balance;
    };
    return Interpreter;
}());
exports.default = Interpreter;
var int = new Interpreter();
var parser = new parser_1.default();
var test = fs.readFileSync("test.txt", "utf-8");
var t = parser.ProduceAst(test);
int.Interpret(t);
console.log("Account Registry:");
console.log(JSON.stringify(int.get_account_registry(), null, 2));
console.log("Ledger:");
console.log(JSON.stringify(int.get_ledger(), null, 2));
