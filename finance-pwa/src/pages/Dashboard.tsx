import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, Wallet, Activity, PieChart } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { dataService } from '../services/dataService';

const Dashboard = () => {
    const { t } = useTranslation();
    const transactions = useLiveQuery(() => dataService.getTransactions());

    // Calculate metrics
    const incomeTotal = transactions?.reduce((acc, tx) => tx.type === 'income' ? acc + tx.amount : acc, 0) || 0;
    const expenseTotal = transactions?.reduce((acc, tx) => tx.type === 'expense' ? acc + tx.amount : acc, 0) || 0;
    const balance = incomeTotal - expenseTotal;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(val);
    };

    const getDistribution = (type: 'income' | 'expense') => {
        if (!transactions) return [];
        const filtered = transactions.filter(tx => tx.type === type);
        const totals = filtered.reduce((acc, tx) => {
            acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
            return acc;
        }, {} as Record<string, number>);

        const totalAmount = type === 'income' ? incomeTotal : expenseTotal;
        return Object.entries(totals).map(([category, amount]) => ({
            category,
            amount,
            percentage: (amount / totalAmount) * 100
        }));
    };

    return (
        <div className="main-content animate-fade-in">
            <div className="page-header">
                <h1>{t('dashboard.title', 'Panel Principal')}</h1>
            </div>

            <div className="grid grid-3">
                <div className="card" style={{ borderBottom: '4px solid var(--primary-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h2 className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>{t('dashboard.balance', 'Balance Total')}</h2>
                            <p style={{ fontSize: '2.2rem', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
                                {formatCurrency(balance)}
                            </p>
                        </div>
                        <Wallet className="text-primary" size={24} />
                    </div>
                </div>

                <div className="card" style={{ borderBottom: '4px solid var(--success-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h2 className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--success-color)' }}>{t('dashboard.income', 'Ingresos')}</h2>
                            <p style={{ fontSize: '2.2rem', fontWeight: '800', margin: 0 }}>
                                {formatCurrency(incomeTotal)}
                            </p>
                        </div>
                        <TrendingUp color="var(--success-color)" size={24} />
                    </div>
                </div>

                <div className="card" style={{ borderBottom: '4px solid var(--danger-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h2 className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--danger-color)' }}>{t('dashboard.expense', 'Gastos')}</h2>
                            <p style={{ fontSize: '2.2rem', fontWeight: '800', margin: 0 }}>
                                {formatCurrency(expenseTotal)}
                            </p>
                        </div>
                        <TrendingDown color="var(--danger-color)" size={24} />
                    </div>
                </div>
            </div>

            <div className="grid grid-2 mt-1">
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <Activity className="text-primary" size={20} />
                        <h2 style={{ margin: 0 }}>{t('dashboard.recent_activity', 'Actividad Reciente')}</h2>
                    </div>
                    {transactions && transactions.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {transactions.slice(0, 5).map(tx => (
                                <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                                    <span>{tx.description}</span>
                                    <span style={{ color: tx.type === 'income' ? 'var(--success-color)' : 'var(--danger-color)', fontWeight: 'bold' }}>
                                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted">{t('dashboard.no_data', 'No hay datos disponibles aún.')}</p>
                    )}
                </div>

                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <PieChart className="text-primary" size={20} />
                        <h2 style={{ margin: 0 }}>{t('dashboard.distribution', 'Distribución')}</h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Expense Distribution */}
                        <div>
                            <h3 style={{ fontSize: '0.9rem', color: 'var(--danger-color)', marginBottom: '1rem' }}>{t('dashboard.distribution')}</h3>
                            {expenseTotal > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {getDistribution('expense').map(({ category, amount, percentage }) => (
                                        <div key={category}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                                                <span>{t(`transactions.categories.${category.toLowerCase()}`, category)}</span>
                                                <span>{percentage.toFixed(0)}%</span>
                                            </div>
                                            <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${percentage}%`, background: 'var(--danger-color)' }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-muted" style={{ fontSize: '0.8rem' }}>{t('dashboard.no_data')}</p>}
                        </div>

                        {/* Income Distribution */}
                        <div>
                            <h3 style={{ fontSize: '0.9rem', color: 'var(--success-color)', marginBottom: '1rem' }}>{t('dashboard.income_distribution', 'Distribución de Ingresos')}</h3>
                            {incomeTotal > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {getDistribution('income').map(({ category, amount, percentage }) => (
                                        <div key={category}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                                                <span>{t(`transactions.categories.${category.toLowerCase()}`, category)}</span>
                                                <span>{percentage.toFixed(0)}%</span>
                                            </div>
                                            <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${percentage}%`, background: 'var(--success-color)' }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-muted" style={{ fontSize: '0.8rem' }}>{t('dashboard.no_data')}</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
