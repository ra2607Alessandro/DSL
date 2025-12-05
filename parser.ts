import { AccountBlock, OpeningBlock, Program, Stat, JournalBlock, Transaction, Account_Types, Movement, CloseBlock, ReportBlock, Account } from "./ast";
import { Token, tokenizer, TokenType } from "./lexing";
import fs = require('fs');

export default class Parser {
    private tokens: Token[] = [];

    private position : number = 0

    private peek(){
       return this.tokens[this.position]
    }

    private advance(){
        const prev = this.tokens[this.position];
        this.position++
        return prev
    }

    private expect(token: TokenType, message: string){
        if (!this.match(token)){
          throw new Error(message)
        }
        return this.advance()
    }
  
    private match(token: TokenType):boolean{
        return this.peek().type === token
    }

    private is_eof(){
        return this.peek().type === TokenType.EOF
    }

    public ProduceAst(source_code: string): Program{
       this.tokens = tokenizer(source_code);
       return this.parse_program(this.tokens)
    }

    private parseAccountBlock(): AccountBlock{
        this.advance();
        this.expect(TokenType.OpenBrace, "Accounts have to start with an '{'")
        const accounts : Record<string, Account_Types> = {}
        while(this.peek().type !== TokenType.CloseBrace ){
            const name = this.expect(TokenType.Identifier, "Every account needs to be named");
            this.expect(TokenType.Colon, "Expected character: ':'");
            const type = this.expect(TokenType.Account_Types, "Expected character: Account type (i.e. : revenue, expense, liability, asset ...)" )
            accounts[name.value] = type.value
        }
        this.expect(TokenType.CloseBrace, "Expected '}'")
        return {type: "AccountBlock", accounts: accounts} as AccountBlock
    }

    private parseOpeningBlock() : OpeningBlock{
        this.advance();
        const date = this.expect(TokenType.Date, "Expected a Date type").value;
        this.expect(TokenType.OpenBrace, "Expected '{'");
        const balances : Record<string, number> = {};
        while(this.peek().type !== TokenType.CloseBrace){
            const name = this.expect(TokenType.Identifier, "Expected an Identifier").value;
            const number = parseFloat(this.expect(TokenType.Number, "Expected a Number").value);
            balances[name] = number
        }
        this.expect(TokenType.CloseBrace, "Expected '}'")
        return {type: "OpeningBlock", date: date, balances: balances} as OpeningBlock
    } 

    private parseJournalBlock(): JournalBlock{
        this.expect(TokenType.JOURNAL, "Expected 'JOURNAL'");
        this.expect(TokenType.OpenBrace, "Expected '{'");
        const txns = new Array<Transaction>();
        while(this.peek().type !== TokenType.CloseBrace){
            if(this.match(TokenType.Transaction)){
            const txn = this.parseTransaction();
            txns.push(txn)
            }
            else {
                throw new Error("Expected a Transaction")
            }
        }
        this.expect(TokenType.CloseBrace, "Expected '}'")
        return {type: "JournalBlock", txns: txns} as JournalBlock

    }

    private parseClosingBlock(): CloseBlock{
        this.expect(TokenType.Closing, "Expected: 'CLOSE'");
        const date = this.expect(TokenType.Date, "Expected a Date").value;
        this.expect(TokenType.OpenBrace,"Expected: '{'")
        const movements = new Array<Movement>();
        while(this.peek().type !== TokenType.CloseBrace){
            const movement = this.parseMovement();
            movements.push(movement);
        }
        this.expect(TokenType.CloseBrace, "Expected: '}'");
        return {type: "CloseBlock", date: date, movements: movements} as CloseBlock
    }
   

    private parseAccounts():Account[]{
       const accounts = new Array<Account>()
       while(!this.is_eof()){
        const account = this.advance().value;
          accounts.push({type: "Account", value: account} as Account);
       
       }
       return accounts

    }
    private parseReport(): ReportBlock {
        this.expect(TokenType.REPORT, "Expected: 'REPORT'");
        this.expect(TokenType.Colon, "Expected: ':' ")
       
        const accounts = new Array<Account>()
        while(!this.is_eof() && this.match(TokenType.Identifier)){
            if( this.peek().value == "ALL"){
                const account = this.peek().value;
                return {type: "Report", accounts: account} as ReportBlock
            }
            else {
            accounts.push(...this.parseAccounts())
            }
        }
       
        return {type: "Report", accounts: accounts} as ReportBlock
    }


    private parseTransaction(): Transaction{
        this.expect(TokenType.Transaction,"Expected 'TXN'");
        const date = this.expect(TokenType.Date, "Expected a Date");
        const name = this.expect(TokenType.String, "Expected a name in form of String type");
        this.expect(TokenType.OpenBrace, "Expected '{'");
        const flow = new Array<Movement>();
        while(this.peek().type !== TokenType.CloseBrace ){
            const movement = this.parseMovement();
            flow.push(movement)
        }
        this.expect(TokenType.CloseBrace, "Expected '}'")
        return {type: "Transaction", date: date.value, name: name.value, flow: flow} as Transaction
    }

    private parseMovement(): Movement {
        const nameI = this.expect(TokenType.Identifier, "Expected Identifier to name the account");
        const flow = this.expect(TokenType.Flow_Movement, "Expected flow movement sign (i.e. : ->, <-)");
        const nameII = this.expect(TokenType.Identifier, "Expected Identifier to name the account");
        const amount = parseFloat(this.expect(TokenType.Number, "Expected number amount $$").value);
        return {type: "Movement",account1: nameI.value, flow: flow.value, account2: nameII.value, amount: amount } as Movement

    }
    
    private parse_program(tokens: Token[]): Program{
        this.tokens = tokens;
        this.position = 0;
        const body : Stat[] = [];
        while(!this.is_eof() && this.tokens.length > 0){
            if (this.match(TokenType.ACCOUNTS)){
                const AccountBlock = this.parseAccountBlock();
                body.push(AccountBlock);
            }
            else if(this.match(TokenType.Opening)){
                const OpeningBlock = this.parseOpeningBlock();
                body.push(OpeningBlock)
            }
            else if(this.match(TokenType.JOURNAL)){
                const JournalBlock = this.parseJournalBlock();
                body.push(JournalBlock);
            }
            else if(this.match(TokenType.Closing)){
                const ClosingBlock = this.parseClosingBlock();
                body.push(ClosingBlock)
            }
            else if(this.match(TokenType.REPORT)){
                const ReportBlock = this.parseReport();
                body.push(ReportBlock)
            }
            else {
                throw new Error(`Unrecognized Token could not be parsed: ${this.peek()}` );
            }
            
        }
        return {type: "program", value: body} as Program

    }
}


//const parser = new Parser();
//const test = fs.readFileSync("test.txt", "utf-8");
//const t = parser.ProduceAst(test);
//console.log(JSON.stringify(t, null, 2));
