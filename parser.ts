import { Program } from "./ast";
import { Token, tokenizer } from "./lexing";

export default class Parser {
    private peek(){
       return this
    }
    private advance(){
        return this.peek().shift()!
    }

    private expect(){

    }

    public ProduceAst(source_code: string): Program{
       const code = tokenizer(source_code);
       return this.parse_program(code)
    }
    
    private parse_program(tokens: Token[]): Program{

    }
}