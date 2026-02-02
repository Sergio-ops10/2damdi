import { db, type Transaction } from '../db';
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export const dataService = {
    async addTransaction(transaction: Omit<Transaction, 'id' | 'uuid' | 'synced'>) {
        const newTx: Transaction = {
            ...transaction,
            uuid: uuidv4(),
            synced: 0
        };

        // 1. Add to Local DB
        const id = await db.transactions.add(newTx);

        // 2. Try to sync to Supabase if online
        if (navigator.onLine) {
            try {
                const { error } = await supabase
                    .from('transactions')
                    .insert([{
                        uuid: newTx.uuid,
                        amount: newTx.amount,
                        type: newTx.type,
                        category: newTx.category,
                        description: newTx.description,
                        date: newTx.date
                    }]);

                if (!error) {
                    await db.transactions.update(id, { synced: 1 });
                } else {
                    console.error('Supabase Sync Error:', error);
                }
            } catch (err) {
                console.error('Network Error:', err);
            }
        }

        return id;
    },

    async getTransactions() {
        return await db.transactions.orderBy('date').reverse().toArray();
    },

    async syncPending() {
        if (!navigator.onLine) return;

        const pending = await db.transactions.where('synced').equals(0).toArray();

        for (const tx of pending) {
            const { error } = await supabase
                .from('transactions')
                .insert([{
                    uuid: tx.uuid,
                    amount: tx.amount,
                    type: tx.type,
                    category: tx.category,
                    description: tx.description,
                    date: tx.date,
                    file_url: tx.file_url
                }]);

            if (!error) {
                await db.transactions.update(tx.id!, { synced: 1 });
            }
        }
    },

    async uploadFile(file: File) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error } = await supabase.storage
            .from('files')
            .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage.from('files').getPublicUrl(filePath);

        // Save metadata to local DB
        await db.files.add({
            name: file.name,
            url: publicUrl,
            type: file.type,
            date: new Date().toISOString()
        });

        return publicUrl;
    },

    async getFiles() {
        return await db.files.orderBy('date').reverse().toArray();
    },

    async deleteFile(id: number, url: string) {
        // 1. Delete from Supabase Storage
        const fileName = url.split('/').pop();
        if (fileName) {
            const { error } = await supabase.storage
                .from('files')
                .remove([fileName]);

            if (error) console.error('Error deleting from Supabase:', error);
        }

        // 2. Delete from Local DB
        await db.files.delete(id);
    },

    async clearAllData() {
        await db.transactions.clear();
        await db.files.clear();
        if (navigator.onLine) {
            const { error } = await supabase.from('transactions').delete().neq('uuid', '00000000-0000-0000-0000-000000000000');
            if (error) console.error('Error clearing Supabase:', error);
        }
    },

    async clearLocalData() {
        await db.transactions.clear();
        await db.files.clear();
    },

    async pullUserData() {
        if (!navigator.onLine) return;

        const { data, error } = await supabase.from('transactions').select('*');
        if (error) {
            console.error('Error pulling from Supabase:', error);
            return;
        }

        if (data) {
            await db.transactions.clear(); // Clear local to avoid duplicates/mixed data
            for (const tx of data) {
                await db.transactions.add({
                    uuid: tx.uuid,
                    amount: tx.amount,
                    type: tx.type,
                    category: tx.category,
                    description: tx.description,
                    date: tx.date,
                    synced: 1
                });
            }
        }
    }
};
