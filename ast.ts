import { TokenType } from "./lexing"

export type NodeType = "program" | "AccountBlock" | "OpeningBlock"| "Movement" | "JournalBlock" | "CloseBlock" | "ReportBlock" | "Transaction"
export type AccountTypes= "asset" | "liability" | "revenue" | "expense" 

export interface Stat{
    type: NodeType,
}

export interface Program {
   type: "program",
   value: Stat[] 
}


export interface AccountBlock extends Stat {
    type: "AccountBlock",
    name: string,
    identifier: AccountTypes[]
}

export interface OpeningBlock extends Stat {
    type: "OpeningBlock",
    date: TokenType.Date,
    name: string,
    number: number
}

export interface JournalBlock extends Stat {
    type: "JournalBlock",
    txn: Transaction[]
}

export interface Transaction extends Stat {
   type: "Transaction",
   date: TokenType.Date,
   name: string,
   flow: Movement[] 
}

export interface Movement extends Stat {
    type: "Movement",
    account1: string
    flow: TokenType.Flow_Movement,
    account2: string
    amount: number

}