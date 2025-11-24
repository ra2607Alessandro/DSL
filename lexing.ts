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
    REPORT,
    BinaryOp,
    Flow_Movement,
    Colon
}

export interface Token {
    type: TokenType,
    value: string
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

function makeToken(token: TokenType,src: string ): Token{
   return {type: token, value: src} as Token
}

export function tokenizer(src: string): Token[]{
    const splitted = src.split('')
    const tokens : Token[] = [];
    for (const splits of splitted){
    if(splits == ":"){
     tokens.push( makeToken(TokenType.Colon, splits))
     
    }
    }
    return tokens

    
}
