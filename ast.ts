import { TokenType } from "./lexing"

export type NodeType = "Account"|"program" | "AccountBlock" | "Report" |"CloseBlock" |"OpeningBlock"| "Movement" | "JournalBlock" | "CloseBlock" | "ReportBlock" | "Transaction"
export type Account_Types = "asset" | "liability" | "revenue" | "expense" | "equity" | "unknown"
export type Flow_Movement = "->" | "<-"

export interface Stat{
    type: NodeType,
}

export interface Program {
   type: "program",
   value: Stat[] 
}

export interface Account extends Stat {
    type: "Account"
    value: string
}

export interface AccountBlock extends Stat {
    type: "AccountBlock",
    accounts: Record<string, Account_Types>
}

export interface OpeningBlock extends Stat {
    type: "OpeningBlock",
    date: string,
    balances:  Record<string, number>
}

export interface CloseBlock extends Stat {
  type: "CloseBlock",
  date: string,
  movements: Movement[]
}

export interface JournalBlock extends Stat {
    type: "JournalBlock",
    txns: Transaction[]
}

export interface ReportBlock extends Stat {
    type: "Report",
    accounts: Account[]
    
}

export interface Transaction extends Stat {
   type: "Transaction",
   date: string,
   name: string,
   flow: Movement[] 
}

export interface Movement extends Stat {
    type: "Movement",
    account1: string
    flow: Flow_Movement,
    account2: string
    amount: number

}
