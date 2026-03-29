import { useState, useEffect } from 'react';

const STORAGE_KEY = 'ott_subscriptions_india';
const CC_STORAGE_KEY = 'ott_credit_card';

export const CREDIT_CARDS = [
    { id: 'none', name: 'No Specific Card', rate: 0 },
    { id: 'sbi_cashback', name: 'SBI Cashback Card (5%)', rate: 0.05 },
    { id: 'hdfc_millennia', name: 'HDFC Millennia (5%)', rate: 0.05 },
    { id: 'axis_ace', name: 'Axis Ace (2%)', rate: 0.02 },
    { id: 'amazon_icici', name: 'Amazon Pay ICICI (2%)', rate: 0.02 },
];


export const INDIAN_OTT_PRESETS = [
    { name: 'JioHotstar', color: '#1f5dbf', icon: '🔵', defaultPrice: 299, cycle: 'monthly' },
    { name: 'Sony LIV', color: '#e8171f', icon: '🔴', defaultPrice: 299, cycle: 'monthly' },
    { name: 'Zee5', color: '#7b2d8b', icon: '🟣', defaultPrice: 99, cycle: 'monthly' },
    { name: 'YouTube Premium', color: '#FF0000', icon: '▶️', defaultPrice: 189, cycle: 'monthly' },
    { name: 'Google One', color: '#1a73e8', icon: '🔷', defaultPrice: 130, cycle: 'monthly' },
    { name: 'Netflix', color: '#E50914', icon: '🎬', defaultPrice: 499, cycle: 'monthly' },
    { name: 'Prime Video', color: '#00a8e1', icon: '📦', defaultPrice: 1499, cycle: 'yearly' },
    { name: 'Apple TV+', color: '#555', icon: '🍎', defaultPrice: 199, cycle: 'monthly' },
    { name: 'MX Player', color: '#f30026', icon: '▶', defaultPrice: 0, cycle: 'monthly' },
    { name: 'Aha', color: '#f7b21a', icon: '🌟', defaultPrice: 149, cycle: 'monthly' },
];

export const useSubscriptions = () => {
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCardId, setSelectedCardId] = useState('none');

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            setSubscriptions(JSON.parse(saved));
        } else {
            const mock = [
                { id: 1, name: 'JioHotstar', price: 299, cycle: 'monthly', nextRenewal: '2026-04-20', color: '#1f5dbf', icon: '🔵' },
                { id: 2, name: 'Sony LIV', price: 299, cycle: 'monthly', nextRenewal: '2026-04-12', color: '#e8171f', icon: '🔴' },
                { id: 3, name: 'Zee5', price: 999, cycle: 'yearly', nextRenewal: '2026-12-01', color: '#7b2d8b', icon: '🟣' },
                { id: 4, name: 'YouTube Premium', price: 189, cycle: 'monthly', nextRenewal: '2026-04-08', color: '#FF0000', icon: '▶️' },
                { id: 5, name: 'Google One', price: 1300, cycle: 'yearly', nextRenewal: '2027-02-14', color: '#1a73e8', icon: '🔷' },
                { id: 6, name: 'Netflix', price: 499, cycle: 'monthly', nextRenewal: '2026-04-25', color: '#E50914', icon: '🎬' },
            ];
            setSubscriptions(mock);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(mock));
        }
        setLoading(false);
        const savedCard = localStorage.getItem(CC_STORAGE_KEY);
        if (savedCard) setSelectedCardId(savedCard);
    }, []);

    const updateSelectedCard = (id) => {
        setSelectedCardId(id);
        localStorage.setItem(CC_STORAGE_KEY, id);
    };

    const addSubscription = (sub) => {
        const newSubs = [...subscriptions, { ...sub, id: Date.now() }];
        setSubscriptions(newSubs);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSubs));
    };

    const deleteSubscription = (id) => {
        const newSubs = subscriptions.filter(s => s.id !== id);
        setSubscriptions(newSubs);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSubs));
    };

    const editSubscription = (id, updatedData) => {
        const newSubs = subscriptions.map(s => s.id === id ? { ...s, ...updatedData } : s);
        setSubscriptions(newSubs);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSubs));
    };


    const rawTotalMonthly = subscriptions.reduce((acc, s) => {
        return acc + (s.cycle === 'monthly' ? s.price : s.price / 12);
    }, 0);
    
    const rawTotalYearly = subscriptions.reduce((acc, s) => {
        return acc + (s.cycle === 'monthly' ? s.price * 12 : s.price);
    }, 0);

    const card = CREDIT_CARDS.find(c => c.id === selectedCardId) || CREDIT_CARDS[0];
    const discountRate = card.rate;

    const stats = {
        totalMonthly: rawTotalMonthly.toFixed(0),
        effectiveMonthly: (rawTotalMonthly * (1 - discountRate)).toFixed(0),
        totalYearly: rawTotalYearly.toFixed(0),
        effectiveYearly: (rawTotalYearly * (1 - discountRate)).toFixed(0),
        activeCount: subscriptions.length,
        nextRenewal: [...subscriptions].sort((a, b) => new Date(a.nextRenewal) - new Date(b.nextRenewal))[0]?.nextRenewal
    };

    const importSubscriptions = (newSubs) => {
        const today = new Date().toISOString().split('T')[0];
        const toAdd = newSubs
            .filter(ns => !subscriptions.some(s => s.name.toLowerCase() === ns.name.toLowerCase()))
            .map(ns => ({
                ...ns,
                id: Date.now() + Math.random(),
                nextRenewal: ns.nextRenewal || today,
            }));
        if (toAdd.length === 0) return 0;
        const merged = [...subscriptions, ...toAdd];
        setSubscriptions(merged);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return toAdd.length;
    };

    return { 
        subscriptions, 
        loading, 
        addSubscription, 
        deleteSubscription, 
        editSubscription, 
        importSubscriptions, 
        stats,
        selectedCardId,
        updateSelectedCard
    };
};
