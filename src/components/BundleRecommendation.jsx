import React from 'react';
import { Gift, ArrowRight } from 'lucide-react';

const BundleRecommendation = ({ subscriptions }) => {
    // Standardize names for matching
    const standardSubs = subscriptions.map(s => ({
        ...s,
        normalizedName: s.name.toLowerCase().replace(/\s+/g, ''),
        monthlyCost: s.cycle === 'monthly' ? s.price : s.price / 12
    }));

    // Target services for Tata Play Binge Mega
    const targetKeywords = ['hotstar', 'jiohotstar', 'zee5', 'sonyliv'];
    
    // Find matching subscriptions
    const matches = standardSubs.filter(s => 
        targetKeywords.some(keyword => s.normalizedName.includes(keyword))
    );

    // If we have at least 2 of the target services, check the price
    if (matches.length >= 2) {
        const currentTotalCost = matches.reduce((sum, s) => sum + s.monthlyCost, 0);
        const bingeMegaCost = 399; // Price of Tata Play Binge Mega

        if (currentTotalCost > bingeMegaCost) {
            const savings = currentTotalCost - bingeMegaCost;
            const names = matches.map(m => m.name).join(', ');

            return (
                <div className="bundle-alert">
                    <div className="bundle-icon">
                        <Gift size={24} color="#00ff88" />
                    </div>
                    <div className="bundle-info">
                        <h3>Savings Alert: Tata Play Binge Mega</h3>
                        <p>You're paying <strong>₹{currentTotalCost.toFixed(0)}/mo</strong> for {names}. Switch to Tata Play Binge to get these (and 20+ more) for just <strong>₹399/mo</strong>.</p>
                        <p className="bundle-savings">Save ≈ ₹{savings.toFixed(0)} every month!</p>
                    </div>
                    <button className="bundle-action">
                        Explore <ArrowRight size={14} />
                    </button>

                    <style>{`
                        .bundle-alert {
                            background: linear-gradient(135deg, rgba(0, 255, 136, 0.1) 0%, rgba(0, 210, 255, 0.05) 100%);
                            border: 1px solid rgba(0, 255, 136, 0.2);
                            border-radius: 16px;
                            padding: 20px;
                            display: flex;
                            align-items: center;
                            gap: 20px;
                            position: relative;
                            overflow: hidden;
                        }
                        .bundle-alert::before {
                            content: '';
                            position: absolute;
                            top: 0; left: 0; width: 4px; height: 100%;
                            background: #00ff88;
                        }
                        .bundle-icon {
                            width: 48px; height: 48px;
                            background: rgba(0, 255, 136, 0.1);
                            border-radius: 12px;
                            display: flex; align-items: center; justify-content: center;
                            flex-shrink: 0;
                        }
                        .bundle-info { flex: 1; }
                        .bundle-info h3 {
                            font-size: 16px; margin: 0 0 6px 0;
                            color: #00ff88;
                        }
                        .bundle-info p {
                            font-size: 14px; margin: 0;
                            color: var(--text-main);
                            line-height: 1.5;
                        }
                        .bundle-savings {
                            display: inline-block;
                            margin-top: 8px !important;
                            font-size: 12px !important;
                            font-weight: 600;
                            color: #fff !important;
                            background: rgba(0, 255, 136, 0.2);
                            padding: 4px 10px;
                            border-radius: 20px;
                        }
                        .bundle-action {
                            background: rgba(255, 255, 255, 0.1);
                            border: 1px solid rgba(255, 255, 255, 0.2);
                            color: white;
                            padding: 10px 16px;
                            border-radius: 10px;
                            font-weight: 600;
                            font-size: 13px;
                            cursor: pointer;
                            display: flex; align-items: center; gap: 6px;
                            transition: all 0.2s;
                            white-space: nowrap;
                            font-family: var(--font-body);
                        }
                        .bundle-action:hover {
                            background: rgba(255, 255, 255, 0.2);
                            transform: translateX(2px);
                        }
                        
                        @media (max-width: 768px) {
                            .bundle-alert {
                                flex-direction: column;
                                align-items: flex-start;
                                padding: 16px;
                            }
                            .bundle-action {
                                width: 100%;
                                justify-content: center;
                            }
                        }
                    `}</style>
                </div>
            );
        }
    }

    return null;
};

export default BundleRecommendation;
