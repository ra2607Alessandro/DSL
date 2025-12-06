"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var lexing_1 = require("./lexing");
var Parser = /** @class */ (function () {
    function Parser() {
        this.tokens = [];
        this.position = 0;
    }
    Parser.prototype.peek = function () {
        return this.tokens[this.position];
    };
    Parser.prototype.advance = function () {
        var prev = this.tokens[this.position];
        this.position++;
        return prev;
    };
    Parser.prototype.expect = function (token, message) {
        if (!this.match(token)) {
            throw new Error(message);
        }
        return this.advance();
    };
    Parser.prototype.match = function (token) {
        return this.peek().type === token;
    };
    Parser.prototype.is_eof = function () {
        return this.peek().type === lexing_1.TokenType.EOF;
    };
    Parser.prototype.ProduceAst = function (source_code) {
        this.tokens = (0, lexing_1.tokenizer)(source_code);
        return this.parse_program(this.tokens);
    };
    Parser.prototype.parseAccountBlock = function () {
        this.advance();
        this.expect(lexing_1.TokenType.OpenBrace, "Accounts have to start with an '{'");
        var accounts = {};
        while (this.peek().type !== lexing_1.TokenType.CloseBrace) {
            var name_1 = this.expect(lexing_1.TokenType.Identifier, "Every account needs to be named");
            this.expect(lexing_1.TokenType.Colon, "Expected character: ':'");
            var type = this.expect(lexing_1.TokenType.Account_Types, "Expected character: Account type (i.e. : revenue, expense, liability, asset ...)");
            accounts[name_1.value] = type.value;
        }
        this.expect(lexing_1.TokenType.CloseBrace, "Expected '}'");
        return { type: "AccountBlock", accounts: accounts };
    };
    Parser.prototype.parseOpeningBlock = function () {
        this.advance();
        var date = this.expect(lexing_1.TokenType.Date, "Expected a Date type").value;
        this.expect(lexing_1.TokenType.OpenBrace, "Expected '{'");
        var balances = {};
        while (this.peek().type !== lexing_1.TokenType.CloseBrace) {
            var name_2 = this.expect(lexing_1.TokenType.Identifier, "Expected an Identifier").value;
            var number = parseFloat(this.expect(lexing_1.TokenType.Number, "Expected a Number").value);
            balances[name_2] = number;
        }
        this.expect(lexing_1.TokenType.CloseBrace, "Expected '}'");
        return { type: "OpeningBlock", date: date, balances: balances };
    };
    Parser.prototype.parseJournalBlock = function () {
        this.expect(lexing_1.TokenType.JOURNAL, "Expected 'JOURNAL'");
        this.expect(lexing_1.TokenType.OpenBrace, "Expected '{'");
        var txns = new Array();
        while (this.peek().type !== lexing_1.TokenType.CloseBrace) {
            if (this.match(lexing_1.TokenType.Transaction)) {
                var txn = this.parseTransaction();
                txns.push(txn);
            }
            else {
                throw new Error("Expected a Transaction");
            }
        }
        this.expect(lexing_1.TokenType.CloseBrace, "Expected '}'");
        return { type: "JournalBlock", txns: txns };
    };
    Parser.prototype.parseClosingBlock = function () {
        this.expect(lexing_1.TokenType.Closing, "Expected: 'CLOSE'");
        var date = this.expect(lexing_1.TokenType.Date, "Expected a Date").value;
        this.expect(lexing_1.TokenType.OpenBrace, "Expected: '{'");
        var movements = new Array();
        while (this.peek().type !== lexing_1.TokenType.CloseBrace) {
            var movement = this.parseMovement();
            movements.push(movement);
        }
        this.expect(lexing_1.TokenType.CloseBrace, "Expected: '}'");
        return { type: "CloseBlock", date: date, movements: movements };
    };
    Parser.prototype.parseAccounts = function () {
        var accounts = new Array();
        while (!this.is_eof()) {
            var account = this.advance().value;
            accounts.push({ type: "Account", value: account });
        }
        return accounts;
    };
    Parser.prototype.parseReport = function () {
        this.expect(lexing_1.TokenType.REPORT, "Expected: 'REPORT'");
        this.expect(lexing_1.TokenType.Colon, "Expected: ':' ");
        if (this.advance().type == lexing_1.TokenType.ALL) {
            return { type: "ReportBlock", all: true };
        }
        var accounts = new Array();
        while (!this.is_eof() && this.match(lexing_1.TokenType.Identifier)) {
            accounts.push.apply(accounts, this.parseAccounts());
        }
        return { type: "ReportBlock", accounts: accounts, all: false };
    };
    Parser.prototype.parseTransaction = function () {
        this.expect(lexing_1.TokenType.Transaction, "Expected 'TXN'");
        var date = this.expect(lexing_1.TokenType.Date, "Expected a Date");
        var name = this.expect(lexing_1.TokenType.String, "Expected a name in form of String type");
        this.expect(lexing_1.TokenType.OpenBrace, "Expected '{'");
        var flow = new Array();
        while (this.peek().type !== lexing_1.TokenType.CloseBrace) {
            var movement = this.parseMovement();
            flow.push(movement);
        }
        this.expect(lexing_1.TokenType.CloseBrace, "Expected '}'");
        return { type: "Transaction", date: date.value, name: name.value, flow: flow };
    };
    Parser.prototype.parseMovement = function () {
        var nameI = this.expect(lexing_1.TokenType.Identifier, "Expected Identifier to name the account");
        var flow = this.expect(lexing_1.TokenType.Flow_Movement, "Expected flow movement sign (i.e. : ->, <-)");
        var nameII = this.expect(lexing_1.TokenType.Identifier, "Expected Identifier to name the account");
        var amount = parseFloat(this.expect(lexing_1.TokenType.Number, "Expected number amount $$").value);
        return { type: "Movement", account1: nameI.value, flow: flow.value, account2: nameII.value, amount: amount };
    };
    Parser.prototype.parse_program = function (tokens) {
        this.tokens = tokens;
        this.position = 0;
        var body = [];
        while (!this.is_eof() && this.tokens.length > 0) {
            if (this.match(lexing_1.TokenType.ACCOUNTS)) {
                var AccountBlock = this.parseAccountBlock();
                body.push(AccountBlock);
            }
            else if (this.match(lexing_1.TokenType.Opening)) {
                var OpeningBlock = this.parseOpeningBlock();
                body.push(OpeningBlock);
            }
            else if (this.match(lexing_1.TokenType.JOURNAL)) {
                var JournalBlock = this.parseJournalBlock();
                body.push(JournalBlock);
            }
            else if (this.match(lexing_1.TokenType.Closing)) {
                var ClosingBlock = this.parseClosingBlock();
                body.push(ClosingBlock);
            }
            else if (this.match(lexing_1.TokenType.REPORT)) {
                var ReportBlock = this.parseReport();
                body.push(ReportBlock);
            }
            else {
                throw new Error("Unrecognized Token could not be parsed: ".concat(console.log(this.peek())));
            }
        }
        return { type: "program", value: body };
    };
    return Parser;
}());
exports.default = Parser;
//const parser = new Parser();
//const test = fs.readFileSync("test.txt", "utf-8");
//const t = parser.ProduceAst(test);
//console.log(JSON.stringify(t, null, 2));
