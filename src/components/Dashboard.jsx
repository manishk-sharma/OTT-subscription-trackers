import React from 'react';
import { LayoutDashboard, Plus, TrendingDown, Clock, CreditCard, Zap } from 'lucide-react';
import SubscriptionCard from './SubscriptionCard';
import AddSubscriptionModal from './AddSubscriptionModal';
import SmartImportModal from './SmartImportModal';
import BundleRecommendation from './BundleRecommendation';
import DashboardSkeleton from './DashboardSkeleton';
import { useSubscriptions, CREDIT_CARDS } from '../hooks/useSubscriptions';

const Dashboard = () => {
    const { 
        subscriptions, 
        loading, 
        stats, 
        deleteSubscription, 
        addSubscription, 
        editSubscription, 
        importSubscriptions,
        selectedCardId,
        updateSelectedCard
    } = useSubscriptions();
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [isSmartImportOpen, setIsSmartImportOpen] = React.useState(false);
    const [editingSub, setEditingSub] = React.useState(null);
    const [toast, setToast] = React.useState(null);

    const handleSave = (data) => {
        if (editingSub) {
            editSubscription(editingSub.id, data);
        } else {
            addSubscription(data);
        }
    };

    const handleImport = (subs) => {
        const count = importSubscriptions(subs);
        setToast(count > 0 ? `✅ Imported ${count} subscription${count > 1 ? 's' : ''}!` : '⚠️ All detected services are already in your dashboard.');
        setTimeout(() => setToast(null), 4000);
    };

    if (loading) return <DashboardSkeleton />;

    return (
        <div className="dashboard-wrapper fade-in">
            <header className="flex-between dashboard-header">
                <div>
                    <h1>🇮🇳 My OTT Subscriptions</h1>
                    <p className="subtitle">Track all your Indian streaming services in one place</p>
                </div>
                <div className="header-actions">
                    <select 
                        className="cc-optimizer"
                        value={selectedCardId}
                        onChange={(e) => updateSelectedCard(e.target.value)}
                        title="Select your Credit Card to optimize costs"
                    >
                        {CREDIT_CARDS.map(card => (
                            <option key={card.id} value={card.id}>{card.name}</option>
                        ))}
                    </select>
                    <button className="btn-smart" onClick={() => setIsSmartImportOpen(true)}>
                        <Zap size={16} /> Smart Import
                    </button>
                    <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                        <Plus size={18} /> Add
                    </button>
                </div>
            </header>

            <AddSubscriptionModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingSub(null); }}
                onSave={handleSave}
                initialData={editingSub}
            />
            <SmartImportModal
                isOpen={isSmartImportOpen}
                onClose={() => setIsSmartImportOpen(false)}
                onImport={handleImport}
            />
            {toast && (
                <div className="toast-notification">{toast}</div>
            )}
            
            <BundleRecommendation subscriptions={subscriptions} />

            <section className="stats-grid">
                <div className="glass stat-card">
                    <div className="stat-icon" style={{ color: 'var(--accent-primary)' }}>
                        <CreditCard size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>₹{Number(stats.effectiveMonthly).toLocaleString('en-IN')}</h3>
                        <p>
                            Monthly Spend
                            {stats.effectiveMonthly !== stats.totalMonthly && (
                                <span className="stat-discount"> (was ₹{stats.totalMonthly})</span>
                            )}
                        </p>
                    </div>
                </div>
                <div className="glass stat-card">
                    <div className="stat-icon" style={{ color: 'var(--accent-warning)' }}>
                        <TrendingDown size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>₹{Number(stats.effectiveYearly).toLocaleString('en-IN')}</h3>
                        <p>Yearly Spend</p>
                    </div>
                </div>
                <div className="glass stat-card">
                    <div className="stat-icon" style={{ color: 'var(--accent-success)' }}>
                        <LayoutDashboard size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>{stats.activeCount}</h3>
                        <p>Active Services</p>
                    </div>
                </div>
                <div className="glass stat-card">
                    <div className="stat-icon" style={{ color: '#00d2ff' }}>
                        <Clock size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>{stats.nextRenewal ? new Date(stats.nextRenewal).toLocaleDateString('en-IN') : 'N/A'}</h3>
                        <p>Next Renewal</p>
                    </div>
                </div>
            </section>

            <section className="subscriptions-grid">
                {subscriptions.map(sub => (
                    <SubscriptionCard 
                        key={sub.id} 
                        sub={sub} 
                        onDelete={deleteSubscription} 
                        onEdit={(subData) => { setEditingSub(subData); setIsModalOpen(true); }}
                    />
                ))}
            </section>

            <style>{`
                .dashboard-wrapper {
                    display: flex;
                    flex-direction: column;
                    gap: 32px;
                }
                .dashboard-header h1 {
                    font-size: 32px;
                    letter-spacing: -0.5px;
                }
                .header-actions {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex-wrap: wrap;
                }
                .cc-optimizer {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid var(--glass-border);
                    color: var(--text-dim);
                    padding: 10px 14px;
                    border-radius: 12px;
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    font-family: var(--font-body);
                    transition: all 0.2s;
                }
                .cc-optimizer:hover { background: rgba(255,255,255,0.1); color: white; }
                .cc-optimizer option { background: #121420; color: white; }
                .subtitle {
                    color: var(--text-dim);
                    font-size: 14px;
                    margin-top: 4px;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                    gap: 20px;
                }
                .stat-card {
                    padding: 24px;
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }
                .stat-icon {
                    width: 50px;
                    height: 50px;
                    background: rgba(255,255,255,0.03);
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .stat-info h3 {
                    font-size: 24px;
                    font-weight: 700;
                    margin: 0;
                }
                .stat-info p {
                    color: var(--text-dim);
                    font-size: 13px;
                    margin: 4px 0 0 0;
                }
                .stat-discount {
                    text-decoration: line-through;
                    opacity: 0.6;
                    font-size: 11px;
                }
                .subscriptions-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 24px;
                }
                
                @media (max-width: 768px) {
                    .dashboard-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 16px;
                    }
                    .header-actions {
                        width: 100%;
                    }
                    .header-actions button {
                        flex: 1;
                        justify-content: center;
                    }
                    .stats-grid {
                        grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
                        gap: 12px;
                    }
                    .stat-card {
                        padding: 16px;
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 12px;
                    }
                    .stat-info h3 {
                        font-size: 20px;
                    }
                    .subscriptions-grid {
                        grid-template-columns: 1fr;
                        gap: 16px;
                    }
                    .dashboard-header h1 {
                        font-size: 24px;
                    }
                }
            `}</style>
        </div>
    );
};

export default Dashboard;
