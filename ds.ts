import { Account_Types } from "./ast";

export interface AccountMetaData {
    type: Account_Types,
    isExplicit: boolean
}

export interface LedgerMetadata {
    data: string,
    description: string,
    side: "debit" | "credit",
    amount: number
}