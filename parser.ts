import { AccountBlock, OpeningBlock, Program, Stat, JournalBlock, Transaction, Account_Types } from "./ast";
import { Token, tokenizer, TokenType } from "./lexing";

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
        const accounts = new Map<string, Account_Types>() 
        while(this.peek().type !== TokenType.CloseBrace ){
            const name = this.expect(TokenType.Identifier, "Every account needs to be named");
            this.expect(TokenType.Colon, "Expected character: ':'");
            const type = this.expect(TokenType.Account_Types, "Expected character: Account type (i.e. : revenue, expense, liability, asset ...)" )
            accounts.set(name.value,type.value)
        }
        this.expect(TokenType.CloseBrace, "Expected '}'")
        return {type: "AccountBlock", accounts: accounts} as AccountBlock
    }

    private parseOpeningBlock() : OpeningBlock{
        this.advance();
        const date = this.expect(TokenType.Date, "Expected a Date type").value;
        this.expect(TokenType.OpenBrace, "Expected '{'");
        const balances = new Map<string, number>();
        while(this.peek().type !== TokenType.CloseBrace){
            const name = this.expect(TokenType.Identifier, "Expected an Identifier").value;
            const number = this.expect(TokenType.Number, "Expected a Number").value;
            balances.set(name,number)
        }
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
        return {type: "JournalBlock", txns: txns} as JournalBlock

    }
    private parseTransaction(): Transaction{

    }
    
    private parse_program(tokens: Token[]): Program{
        this.tokens = tokens;
        this.position = 0;
        const body : Stat[] = [];
        while(!this.is_eof() && this.tokens.length > 0){
            if (this.match(TokenType.ACCOUNTS)){
                const AccountBlock = this.parseAccountBlock();
                body.push(AccountBlock)
            }
            else if(this.match(TokenType.Opening)){
                const OpeningBlock = this.parseOpeningBlock();
                body.push(OpeningBlock)
            }
            else if(this.match(TokenType.JOURNAL)){
                const JournalBlock = this.parseJournalBlock();
                body.push(JournalBlock)
            }
            else {
                throw new Error(`Unrecognized Token could not be parsed: ${this.peek()}` )
            }
            this.position++
        }
        return {type: "program", value: body} as Program

    }
}