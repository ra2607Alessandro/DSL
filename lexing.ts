export enum TokenType {
    Number,
    Date,
    Identifier,
    String,
    OpenBrace,
    CloseBrace,
    ACCOUNTS,
    JOURNAL,
    Transaction,
    Opening,
    Closing,
    REPORT
}

const KEYWORDS : Record<string,TokenType> = {
    "ACCOUNTS": TokenType.ACCOUNTS,
    "JOURNAL": TokenType.JOURNAL,
    "TXN": TokenType.Transaction,
    "OPEN": TokenType.Opening,
    "CLOSE": TokenType.Closing,
    "REPORT": TokenType.REPORT
}

function isAlpha(src: string):boolean{
    return src.toUpperCase() !== src.toLowerCase()  
}

function isNum(src: string){
    const c = src.charCodeAt(0)
    const bound = ["0".charCodeAt(0),"9".charCodeAt(0)]
    return c == bound[0] || c == bound[1]
}

