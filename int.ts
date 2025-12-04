import { Runtime } from "inspector/promises";
import { Account_Types, AccountBlock, JournalBlock, Movement, OpeningBlock, Program, Transaction, CloseBlock } from "./ast"; 
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

   private process_close_block(block: CloseBlock){
    // For each movement, transfer the full balance from source to target
    for (const move of block.movements) {
        const source = move.account1;
        const target = move.account2;
        const amount = this.get_balance(source);
        // If the balance is zero, nothing to close
        if (Math.abs(amount) < 0.01) continue

        // Determine posting sides based on amount sign
        // If amount > 0, debit source, credit target
        // If amount < 0, credit source, debit target
        let postingSource = {} as Posting
        let  postingTarget = {} as Posting;
        if (amount > 0) {
            postingSource = {
                account: source,
                side: "debit",
                amount: amount,
                ID: `CLOSE-${block.date}`,
                date: block.date,
                description: `Closing ${source} to ${target}`
            } ;
            postingTarget = {
                account: target,
                side: "credit",
                amount: amount,
                ID: `CLOSE-${block.date}`,
                date: block.date,
                description: `Closing ${source} to ${target}`
            };
        } 
        else if (amount < 0) {
            postingSource = {
                account: source,
                side: "credit",
                amount: Math.abs(amount),
                ID: `CLOSE-${block.date}`,
                date: block.date,
                description: `Closing ${source} to ${target}`
            };
            postingTarget = {
                account: target,
                side: "debit",
                amount: Math.abs(amount),
                ID: `CLOSE-${block.date}`,
                date: block.date,
                description: `Closing ${source} to ${target}`
            };
        }
        // Append postings to ledger
        if (!this.ledger[source]){
            
            this.ledger[source] = [];
        }
        if (!this.ledger[target]) {
            this.ledger[target] = [];

        }
        this.ledger[source].push(postingSource);
        this.ledger[target].push(postingTarget);
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

   public get_account_registry(account_name?: string): Record<string, AccountMetaData>{
    if(account_name){
        const md = this.accountRegistry[account_name];
        return {md}
    }
    return this.accountRegistry
   }

   public get_ledger(account_name?: string): Record<string, Posting[]>{
    if (account_name){
        const posting = this.ledger[account_name];
        return {posting}
    }
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
console.log("Balance for Cash");
console.log("=====================");
console.log(JSON.stringify(int.get_balance("Cash"),null,2));