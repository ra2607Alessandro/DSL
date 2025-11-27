import { AccountBlock, OpeningBlock, Program, Stat, JournalBlock, Transaction,  } from "./ast";
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

    }

    private parseOpeningBlock() : OpeningBlock{

    } 

    private parseJournalBlock(): JournalBlock{

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