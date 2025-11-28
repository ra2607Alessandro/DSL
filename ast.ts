import { TokenType } from "./lexing"

export type NodeType = "identifier"|"program" | "AccountBlock" | "OpeningBlock"| "Movement" | "JournalBlock" | "CloseBlock" | "ReportBlock" | "Transaction"
export type Account_Types = "asset" | "liability" | "revenue" | "expense"

export interface Stat{
    type: NodeType,
}

export interface Program {
   type: "program",
   value: Stat[] 
}

export interface AccountBlock extends Stat {
    type: "AccountBlock",
    accounts: Map<string, Account_Types>
}

export interface OpeningBlock extends Stat {
    type: "OpeningBlock",
    date: string,
    balances: Map<string, number>
}

export interface JournalBlock extends Stat {
    type: "JournalBlock",
    txns: Transaction[]
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
    flow: TokenType.Flow_Movement,
    account2: string
    amount: number

}