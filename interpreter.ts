import { AccountBlock, Program } from "./ast"; 
import { AccountMetaData } from "./ds";


class Interpreter {
   private account_registry(type: AccountBlock):AccountMetaData{
      if(type.type !== "AccountBlock"){
        throw new Error(`The required type is: 'AccountBlock', yours is:${console.log(type.type)}`)
      }
      const account : AccountMetaData[] = []
      if(type.accounts){

        
      }
   }


   public evaluator(program: Program){
      for(const types of program.value){

        switch(types.type){

            case "AccountBlock":
                return this.account_registry(types as AccountBlock)
        }
      }
   }
}