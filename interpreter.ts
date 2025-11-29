import { Program } from "./ast"; 
import { AccountMetaData } from "./ds";


class Interpreter {
   private account_registry():AccountMetaData{
      
   }


   public evaluator(program: Program){
      for(const types of program.value){

        switch(types.type){

            case "AccountBlock":
                return this.account_registry()
        }
      }
   }
}