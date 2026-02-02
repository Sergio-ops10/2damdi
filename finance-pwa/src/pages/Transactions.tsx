import React, { useState } from 'react';
import { dataService } from '../services/dataService';
import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { PlusCircle, History, ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react';

const Transactions = () => {
    const { t } = useTranslation();
    const transactions = useLiveQuery(() => dataService.getTransactions());

    const [formData, setFormData] = useState({
        amount: '',
        type: 'expense' as 'income' | 'expense',
        category: 'General',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(formData.amount);
        if (!amount || !formData.description) return;

        // Validation: Cannot spend more than balance
        if (formData.type === 'expense') {
            const currentIncome = transactions?.reduce((acc, tx) => tx.type === 'income' ? acc + tx.amount : acc, 0) || 0;
            const currentExpense = transactions?.reduce((acc, tx) => tx.type === 'expense' ? acc + tx.amount : acc, 0) || 0;
            const currentBalance = currentIncome - currentExpense;

            if (amount > currentBalance) {
                alert(t('transactions.insufficient_funds', 'Saldo insuficiente para realizar este gasto'));
                return;
            }
        }

        await dataService.addTransaction({
            amount: amount,
            type: formData.type,
            category: formData.category,
            description: formData.description,
            date: formData.date
        });

        setFormData({ ...formData, amount: '', description: '' });
    };

    return (
        <div className="main-content animate-fade-in">
            <div className="page-header">
                <h1>{t('transactions.title', 'Mis Transacciones')}</h1>
            </div>

            <div className="grid grid-2">
                {/* Form Section */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <PlusCircle size={24} className="text-primary" />
                        <h2 style={{ margin: 0 }}>{t('transactions.add_new', 'Añadir Transacción')}</h2>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <label>{t('transactions.amount', 'Cantidad')}</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="0.00"
                                    required
                                />
                                <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>$</span>
                            </div>
                        </div>

                        <div className="input-group">
                            <label>{t('transactions.type', 'Tipo')}</label>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    type="button"
                                    className="btn"
                                    style={{
                                        flex: 1,
                                        background: formData.type === 'income' ? 'var(--success-color)' : 'rgba(255,255,255,0.05)',
                                        color: 'white'
                                    }}
                                    onClick={() => setFormData({ ...formData, type: 'income' })}
                                >
                                    <ArrowUpCircle size={18} />
                                    {t('transactions.income', 'Ingreso')}
                                </button>
                                <button
                                    type="button"
                                    className="btn"
                                    style={{
                                        flex: 1,
                                        background: formData.type === 'expense' ? 'var(--danger-color)' : 'rgba(255,255,255,0.05)',
                                        color: 'white'
                                    }}
                                    onClick={() => setFormData({ ...formData, type: 'expense' })}
                                >
                                    <ArrowDownCircle size={18} />
                                    {t('transactions.expense', 'Gasto')}
                                </button>
                            </div>
                        </div>

                        <div className="input-group">
                            <label>{t('transactions.category', 'Categoría')}</label>
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="General">{t('transactions.categories.general', 'General')}</option>
                                <option value="Food">{t('transactions.categories.food', 'Alimentación')}</option>
                                <option value="Transport">{t('transactions.categories.transport', 'Transporte')}</option>
                                <option value="Entertainment">{t('transactions.categories.entertainment', 'Ocio')}</option>
                                <option value="Health">{t('transactions.categories.health', 'Salud')}</option>
                                <option value="Home">{t('transactions.categories.home', 'Vivienda')}</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label>{t('transactions.description', 'Descripción')}</label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder={formData.type === 'income'
                                    ? t('transactions.desc_placeholder_income', '¿En qué quieres gastar este dinero?')
                                    : t('transactions.desc_placeholder_expense', '¿En qué has gastado este dinero?')
                                }
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                            <Wallet size={20} />
                            {t('transactions.save_btn', 'Guardar Movimiento')}
                        </button>
                    </form>
                </div>

                {/* List Section */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <History size={24} className="text-muted" />
                        <h2 style={{ margin: 0 }}>{t('transactions.history', 'Historial Reciente')}</h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {transactions?.length === 0 && (
                            <div className="text-muted" style={{ textAlign: 'center', padding: '2rem' }}>
                                {t('transactions.no_history', 'No hay movimientos registrados aún.')}
                            </div>
                        )}

                        {transactions?.map((tx) => (
                            <div key={tx.id} className="tx-item" style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '1rem 1.25rem',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '1rem',
                                borderLeft: `4px solid ${tx.type === 'income' ? 'var(--success-color)' : 'var(--danger-color)'}`
                            }}>
                                <div>
                                    <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>{tx.description}</div>
                                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>{tx.date} • {t(`transactions.categories.${tx.category.toLowerCase()}`, tx.category)}</div>
                                </div>
                                <div style={{
                                    fontWeight: '700',
                                    fontSize: '1.1rem',
                                    color: tx.type === 'income' ? 'var(--success-color)' : 'var(--danger-color)'
                                }}>
                                    {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Transactions;
