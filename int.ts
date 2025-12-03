import { Runtime } from "inspector/promises";
import { Account_Types, AccountBlock, JournalBlock, Movement, OpeningBlock, Program, Transaction } from "./ast"; 
import { AccountMetaData, Posting } from "./ds";
import Parser from "./parser"
import fs = require('fs');

export default class Interpreter {
   private accountRegistry : Record<string, AccountMetaData> = {};
   private ledger : Record<string, Posting[]> = {} ;
   private openings : Record<string,Posting> = {} ;
   private txnCounter = 0;

   private process_account_blocks(block: AccountBlock){
      for(const account_name in block.accounts){
        let type = block.accounts[account_name] ;
        this.accountRegistry[account_name] = {type: type, isExplicit: true} as AccountMetaData
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
     this.txnCounter++;
     let ID : string = `TXN-${String(this.txnCounter)}`;
     const postings = [] ;
     for (const movement of txn.flow){
        postings.push(...this.convert_movement_into_postings(movement, ID, txn.date, txn.name))
     }

     let totalDebits = 0;
     let totalCredits = 0;

     for (const posting of postings){

        if(posting.side === "credit"){
            totalCredits += posting.amount
        }

        else if(posting.side === "debit"){
            totalDebits += posting.amount
        }
        }
        if(Math.abs(totalDebits - totalCredits) > 0.01){
            throw new Error (`Transaction ${ID} doesn't balance: debits=${totalDebits}, credits=${totalCredits}`)
        }
        
        for (const posting of postings){
             this.post_to_ledger(posting.account , posting) 
            } 
   }

   private convert_movement_into_postings(movement: Movement, ID: string, date: string, description: string): Posting[]{
    let postings = new Array<Posting>()
        if(movement.flow == "->"){
             postings =  [
            { 
                account: movement.account1,
                side: "debit",
                amount: movement.amount,
                ID, date, description 
            } as Posting ,
            {
                account: movement.account2,
                side: "credit",
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
        this.accountRegistry[account_name] = {type: "unknown",isExplicit: false} as AccountMetaData
    }
    this.ledger[account_name].push(posting)
   }

   private process_opening_blocks(block: OpeningBlock){

     let ID : string = `OPEN-${String(this.txnCounter)}`;
     let amount = 0;
     const postings :  Record<string,Posting> = {}
     
     for ( const account in block.balances){
        amount = block.balances[account];
        if( amount < 0 ){
            postings[account] = ({ 
                account: account,
                side: "debit",
                amount: amount,
                ID: ID,
                date: block.date,
                description: block.type
            } as Posting ) 
        }

        else if (amount > 0) {
            {
                postings[account] = ({ 
                account: account,
                side: "credit",
                amount: amount,
                ID: ID,
                date: block.date,
                description: block.type
               } as Posting)
           }
          }
         
         this.openings[account] = postings[account]

         }
        }

   public Interpret(program: Program){
      for(const block of program.value){

        switch(block.type){

            case "AccountBlock":
                this.process_account_blocks(block as AccountBlock) ;
                 break
            case "JournalBlock":
                this.process_journal_blok(block as JournalBlock);
                break
            case "OpeningBlock":
                this.process_opening_blocks(block as OpeningBlock);
                break
            default:
                throw new Error("The block type has not been recognized")
                
        }
      }
   }

   public get_account_registry(): Record<string, AccountMetaData>{
    return this.accountRegistry
   }

   public get_ledger(): Record<string, Posting[]>{
    return this.ledger
   }
   
   public get_openings(): Record<string, Posting>{
    return this.openings
   }

   public get_balance(account_name: string){
    if(!this.ledger[account_name]){
        return 0;
    }

    let balance = 0;
     
    if(this.openings[account_name]){
        balance = this.openings[account_name].amount
    }
    
    for(const posting of this.ledger[account_name]){
       if(posting.side == "debit"){
            balance -= posting.amount
        }

        else if(posting.side == "credit"){
            balance += posting.amount
        }
       }
    
    return balance
    }
}

const int = new Interpreter();
const parser = new Parser();
const test = fs.readFileSync("test.txt", "utf-8");
const t = parser.ProduceAst(test);
int.Interpret(t);
console.log("Account Registry:");
console.log("=====================");
console.log(JSON.stringify(int.get_account_registry(), null, 2));
console.log("=====================");
console.log("Ledger:");
console.log("=====================");
console.log(JSON.stringify(int.get_ledger(), null, 2));
console.log("Openings Registry");
console.log("=====================");
console.log(JSON.stringify(int.get_openings(), null, 2));
console.log("Balance for VatDebit");
console.log("=====================");
console.log(JSON.stringify(int.get_balance("VATDebit"),null,2));