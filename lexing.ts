import fs = require('fs');
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
    Colon,
    EOF,
    Account_Types
}

export interface Token {
    type: TokenType,
    value: any
}

const KEYWORDS : Record<string,TokenType> = {
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
}

function isAlpha(src: string):boolean{
    return src.toUpperCase() !== src.toLowerCase()  
}

function isNum(src: string){
    const c = src.charCodeAt(0)
    const bound = ["0".charCodeAt(0),"9".charCodeAt(0)]
    return c >= bound[0] && c <= bound[1]
}

function readNumber(code: string[]):string{
  let num = ""
  if (code[0]== "-" && isNum(code[1])){
    num += code.shift()!
  }
   while(code.length > 0 && isNum(code[0])){
    num += code.shift()!
   }
  
  if(code[0] == "." && isNum(code[1])){
    num+=code.shift()!
    while (code.length > 0 && isNum(code[0])){
     num+=code.shift()!
    }
  }
  return num 
}
function isSkippable(src:string){
    return src == " " || src == "\r" || src == "\n" 
}

function makeToken(type: TokenType,value: string ): Token{
   return {type, value}
}

export function tokenizer(src: string): Token[]{
    const code = src.split('')
    const tokens : Token[] = [];
    while(code.length > 0){
    if(code[0] == ":"){
     tokens.push(makeToken(TokenType.Colon, code.shift()! ))
    }
    else if ((code[0] == "-" && code[1] == ">") || (code[0] == "<" && code[1] == "-" )){
      const pointer = code.shift()! + code.shift()!
        tokens.push(makeToken(TokenType.Flow_Movement, pointer))
    }
    else if(code[0] == "{"){
        tokens.push(makeToken(TokenType.OpenBrace, code.shift()!))
    }
    else if(code[0] == "}"){
        tokens.push(makeToken(TokenType.CloseBrace, code.shift()!))
    }
    else if (code[0] == "+" || code[0] == "-") {
    if (code[0] == "-" && isNum(code[1])) {
        const num = readNumber(code)
        tokens.push(makeToken(TokenType.Number, num));
        continue
      }
     else {
        tokens.push(makeToken(TokenType.BinaryOp, code.shift()!));
        continue;
    }}
    else if(code[0] == "'" || code[0] == '"'){
        let quoteType = code.shift()!;
        let str = "";
        while(code.length > 0 && code[0] !== quoteType ){
            str += code.shift()! ;
        }
        code.shift()!
        tokens.push(makeToken(TokenType.String, str))
    }
    else {
        if (isNum(code[0])){
          let num = "";
          let hasDot = false;
          
          // Check for date (YYYY-MM-DD)
          
          if (
          code.length >= 10 && 
          isNum(code[0]) && isNum(code[1]) && 
          isNum(code[2]) && isNum(code[3]) && code[4] == '-' && 
          isNum(code[5]) && isNum(code[6]) && code[7] == '-' && 
          isNum(code[8]) && isNum(code[9])) {
            
            num = code.splice(0,10).join("");
            tokens.push(makeToken(TokenType.Date, num));
          } else {
            while (code.length > 0 && (isNum(code[0]) || (code[0] === '.' && isNum(code[1])))) {
              if (code[0] === '.') {
                hasDot = true;
              }
              num += code.shift()!;
            }
            tokens.push(makeToken(TokenType.Number, num));
          }
        }
        
        else if (isAlpha(code[0])){
          let ident = "";
          while (code.length > 0 && isAlpha(code[0])!){
            ident += code.shift();
          }
          const key = KEYWORDS[ident];

          if ( key == undefined){
            tokens.push(makeToken(TokenType.Identifier, ident))
          }
          else {
            tokens.push(makeToken(key, ident))
        }
      }
        else if (isSkippable(code[0])){
            code.shift()!
          
    }
        else {
          console.log("Unrecognized Character:",code[0])
          code.shift()!
        }
  }
}
 tokens.push({type: TokenType.EOF, value: "End of file"})
 return tokens
}


//const test = fs.readFileSync("test.txt","utf-8");
//console.log(tokenizer(test))
