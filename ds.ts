import { Account_Types } from "./ast";


const Account_Registry = new Set<AccountMetaData>() 

export interface AccountMetaData {
    name: string,
    type: Account_Types,
    isExplicit?: boolean
}
