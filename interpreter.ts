import { Account_Types, AccountBlock, JournalBlock, Movement, OpeningBlock, Program, Transaction } from "./ast"; 
import { AccountMetaData, Posting } from "./ds";
import Parser from "./parser"
import fs = require('fs');

export default class Interpreter {
   private accountRegistry : Record<string, AccountMetaData> = {};
   private ledger : Record<string, Posting[]> = {};
   private txnCounter = 0

   private process_account_blocks(block: AccountBlock){
      for(const account_name in block.accounts){
        let name = block.accounts[account_name]
        let type = block.accounts[name] ; 
        const md = {type: type ,isExplicit: true}  as AccountMetaData
        return this.accountRegistry[name] = md 
      }
      
   }
   
   private process_journal_blok(block: JournalBlock){
        if(block.type !== "JournalBlock"){
           throw new Error(`The required type is: 'JournalBlock', yours is:${console.log(block.type)}`)
        }
        for (const txn of block.txns){
            this.process_transaction(txn)
        }

   }

   private process_transaction(txn: Transaction){
     if (txn.type !== "Transaction"){
        throw new Error(`The required type is: 'Transaction', yours is:${console.log(txn.type)}`)
     }
     this.txnCounter++;
     let ID : string = `TXN-${String(this.txnCounter)}`;
     const postings = [] ;
     for (const movement of txn.flow){
        postings.push(...this.convert_movement_into_postings(movement, ID, txn.date, txn.name))
     }

     let totalDebits = 0;
     let totalCredits = 0;

     for (const posting of postings){

        if(posting.side == "credit"){
            totalCredits += posting.amount
        }

        else if(posting.side == "debit"){
            totalDebits += posting.amount
        }

        if(Math.abs(totalCredits - totalDebits) > 0.01){
            throw new Error ("Total amount of credits must be equal to total amount of debits and viceversa")
        }
        
        else{
             this.post_to_ledger(posting.account , posting) 
            } 
    }


   }

   private convert_movement_into_postings(movement: Movement, ID: string, date: string, description: string): Posting[]{
    let postings = new Array<Posting>()
        if(movement.flow == "->"){
             postings =  [
            { 
                account: movement.account1,
                side: "credit",
                amount: movement.amount,
                ID, date, description 
            } as Posting ,
            {
                account: movement.account2,
                side: "debit",
                amount: movement.amount,
                ID,date,description
            } as Posting]
        }
        else if(movement.flow == "<-"){
            postings  = [{ 
                account: movement.account2,
                side: "credit",
                amount: movement.amount,
                ID, date, description 
            } as Posting  ,
            {
                account: movement.account1,
                side: "debit",
                amount: movement.amount,
                ID,date,description
            } as Posting]
        }
        return postings
        
   }
   
   private post_to_ledger(account_name: string, posting: Posting){
    if(!this.ledger[account_name]){
        this.ledger[account_name] = []
    }
    if(!this.accountRegistry[account_name]){
        this.accountRegistry[account_name] = {isExplicit: false} as AccountMetaData
    }
    this.ledger[account_name].push(posting)
   }

   private process_opening_blocks(block: OpeningBlock){
     let ID : string = `OPEN-${String(this.txnCounter)}`

   }

   public Interpret(program: Program){
      for(const block of program.value){

        switch(block.type){

            case "AccountBlock":
                this.process_account_blocks(block as AccountBlock);
                 break
            case "JournalBlock":
                this.process_journal_blok(block as JournalBlock);
                break
            case "OpeningBlock":
                this.process_opening_blocks(block as OpeningBlock);
                break
        }
      }
   }
}

const int = new Interpreter();
const parser = new Parser();
const test = fs.readFileSync("test.txt", "utf-8");
const t = parser.ProduceAst(test);
console.log(JSON.stringify(int.Interpret(t), null, 2));

