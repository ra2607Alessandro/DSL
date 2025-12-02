"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenType = void 0;
exports.tokenizer = tokenizer;
var TokenType;
(function (TokenType) {
    TokenType[TokenType["Number"] = 0] = "Number";
    TokenType[TokenType["Date"] = 1] = "Date";
    TokenType[TokenType["Identifier"] = 2] = "Identifier";
    TokenType[TokenType["String"] = 3] = "String";
    TokenType[TokenType["OpenBrace"] = 4] = "OpenBrace";
    TokenType[TokenType["CloseBrace"] = 5] = "CloseBrace";
    TokenType[TokenType["ACCOUNTS"] = 6] = "ACCOUNTS";
    TokenType[TokenType["JOURNAL"] = 7] = "JOURNAL";
    TokenType[TokenType["Transaction"] = 8] = "Transaction";
    TokenType[TokenType["Opening"] = 9] = "Opening";
    TokenType[TokenType["Closing"] = 10] = "Closing";
    TokenType[TokenType["REPORT"] = 11] = "REPORT";
    TokenType[TokenType["BinaryOp"] = 12] = "BinaryOp";
    TokenType[TokenType["Flow_Movement"] = 13] = "Flow_Movement";
    TokenType[TokenType["Colon"] = 14] = "Colon";
    TokenType[TokenType["EOF"] = 15] = "EOF";
    TokenType[TokenType["Account_Types"] = 16] = "Account_Types";
})(TokenType || (exports.TokenType = TokenType = {}));
var KEYWORDS = {
    "ACCOUNTS": TokenType.ACCOUNTS,
    "JOURNAL": TokenType.JOURNAL,
    "TXN": TokenType.Transaction,
    "OPEN": TokenType.Opening,
    "CLOSE": TokenType.Closing,
    "REPORT": TokenType.REPORT,
    "asset": TokenType.Account_Types,
    "liability": TokenType.Account_Types,
    "revenue": TokenType.Account_Types,
    "expense": TokenType.Account_Types,
    "equity": TokenType.Account_Types
};
function isAlpha(src) {
    return src.toUpperCase() !== src.toLowerCase();
}
function isNum(src) {
    var c = src.charCodeAt(0);
    var bound = ["0".charCodeAt(0), "9".charCodeAt(0)];
    return c >= bound[0] && c <= bound[1];
}
function readNumber(code) {
    var num = "";
    if (code[0] == "-" && isNum(code[1])) {
        num += code.shift();
    }
    while (code.length > 0 && isNum(code[0])) {
        num += code.shift();
    }
    if (code[0] == "." && isNum(code[1])) {
        num += code.shift();
        while (code.length > 0 && isNum(code[0])) {
            num += code.shift();
        }
    }
    return num;
}
function isSkippable(src) {
    return src == " " || src == "\r" || src == "\n";
}
function makeToken(type, value) {
    return { type: type, value: value };
}
function tokenizer(src) {
    var code = src.split('');
    var tokens = [];
    while (code.length > 0) {
        if (code[0] == ":") {
            tokens.push(makeToken(TokenType.Colon, code.shift()));
        }
        else if ((code[0] == "-" && code[1] == ">") || (code[0] == "<" && code[1] == "-")) {
            var pointer = code.shift() + code.shift();
            tokens.push(makeToken(TokenType.Flow_Movement, pointer));
        }
        else if (code[0] == "{") {
            tokens.push(makeToken(TokenType.OpenBrace, code.shift()));
        }
        else if (code[0] == "}") {
            tokens.push(makeToken(TokenType.CloseBrace, code.shift()));
        }
        else if (code[0] == "+" || code[0] == "-") {
            if (code[0] == "-" && isNum(code[1])) {
                var num = readNumber(code);
                tokens.push(makeToken(TokenType.Number, num));
                continue;
            }
            else {
                tokens.push(makeToken(TokenType.BinaryOp, code.shift()));
                continue;
            }
        }
        else if (code[0] == "'" || code[0] == '"') {
            var quoteType = code.shift();
            var str = "";
            while (code.length > 0 && code[0] !== quoteType) {
                str += code.shift();
            }
            code.shift();
            tokens.push(makeToken(TokenType.String, str));
        }
        else {
            if (isNum(code[0])) {
                var num = "";
                var hasDot = false;
                // Check for date (YYYY-MM-DD)
                if (code.length >= 10 &&
                    isNum(code[0]) && isNum(code[1]) &&
                    isNum(code[2]) && isNum(code[3]) && code[4] == '-' &&
                    isNum(code[5]) && isNum(code[6]) && code[7] == '-' &&
                    isNum(code[8]) && isNum(code[9])) {
                    num = code.splice(0, 10).join("");
                    tokens.push(makeToken(TokenType.Date, num));
                }
                else {
                    while (code.length > 0 && (isNum(code[0]) || (code[0] === '.' && isNum(code[1])))) {
                        if (code[0] === '.') {
                            hasDot = true;
                        }
                        num += code.shift();
                    }
                    tokens.push(makeToken(TokenType.Number, num));
                }
            }
            else if (isAlpha(code[0])) {
                var ident = "";
                while (code.length > 0 && isAlpha(code[0])) {
                    ident += code.shift();
                }
                var key = KEYWORDS[ident];
                if (key == undefined) {
                    tokens.push(makeToken(TokenType.Identifier, ident));
                }
                else {
                    tokens.push(makeToken(key, ident));
                }
            }
            else if (isSkippable(code[0])) {
                code.shift();
            }
            else {
                console.log("Unrecognized Character:", code[0]);
                code.shift();
            }
        }
    }
    tokens.push({ type: TokenType.EOF, value: "End of file" });
    return tokens;
}
