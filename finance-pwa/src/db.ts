import Dexie, { type Table } from 'dexie';

export interface Transaction {
    id?: number; // Auto-incremented for local
    uuid: string; // Sync ID
    amount: number;
    type: 'income' | 'expense';
    category: string;
    description: string;
    date: string;
    synced: number; // 0 = false, 1 = true
    file_url?: string;
}

export interface FileRecord {
    id?: number;
    name: string;
    url: string;
    type: string;
    date: string;
}

export class FinanceDatabase extends Dexie {
    transactions!: Table<Transaction>;
    files!: Table<FileRecord>;

    constructor() {
        super('FinanceDatabase');
        this.version(2).stores({
            transactions: '++id, uuid, type, category, date, synced',
            files: '++id, name, date'
        });
    }
}

export const db = new FinanceDatabase();
