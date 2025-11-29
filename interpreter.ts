import { Account_Types, AccountBlock, Program } from "./ast"; 
import { AccountMetaData, LedgerMetadata } from "./ds";


class Interpreter {
   private accountRegistry : Record<string, AccountMetaData> = {};
   private ledger : Record<string, LedgerMetadata> = {};
   private txnCounter = 0

   private process_account_blocks(block: AccountBlock){
      if(block.type !== "AccountBlock"){
        throw new Error(`The required type is: 'AccountBlock', yours is:${console.log(type.type)}`)
      }
      if(block.accounts){
        let name : string = "";
        let type = block.accounts[name] ; 
        const md = {type: type ,isExplicit: true}  as AccountMetaData
        return this.accountRegistry[name] = md 
      }
   }


   public Interpret(program: Program){
      for(const block of program.value){

        switch(block.type){

            case "AccountBlock":
                return this.process_account_blocks(block as AccountBlock)
        }
      }
   }
}