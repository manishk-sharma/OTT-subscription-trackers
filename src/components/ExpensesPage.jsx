import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, IndianRupee, Lightbulb, ArrowRight, Zap } from 'lucide-react';
import { useSubscriptions } from '../hooks/useSubscriptions';
import getServiceLogo from '../services/logoMap';

const COLORS = [
    '#7c4dff', '#00d2ff', '#ff3b30', '#00ff88', '#ffcc00',
    '#ff6b9d', '#45a0f5', '#f7b21a', '#e8171f', '#1f5dbf'
];

// Annual plan savings data for Indian OTT services
const ANNUAL_SAVINGS = {
    'sony liv': { annualPrice: 999, monthlyPrice: 299, label: 'Sony LIV Annual' },
    'sonyliv':  { annualPrice: 999, monthlyPrice: 299, label: 'Sony LIV Annual' },
    'zee5':     { annualPrice: 699, monthlyPrice: 99,  label: 'Zee5 Annual' },
    'netflix':  { annualPrice: 1788, monthlyPrice: 199, label: 'Netflix Mobile (Annual)' },
    'jiohotstar': { annualPrice: 799, monthlyPrice: 299, label: 'JioHotstar Super (Annual)' },
    'hotstar':    { annualPrice: 799, monthlyPrice: 299, label: 'JioHotstar Super (Annual)' },
};

// Bundle comparison data
const BUNDLES = [
    {
        name: 'Tata Play Binge Mega',
        price: 399,
        includes: ['hotstar', 'jiohotstar', 'zee5', 'sonyliv', 'sony liv'],
        extras: '+ SunNXT, Eros Now, Hungama & 15 more',
    },
    {
        name: 'Airtel Black (₹998 plan)',
        price: 998 / 3, // Split across 3 months effectively for 3 OTTs
        includes: ['hotstar', 'jiohotstar', 'netflix'],
        extras: '+ 200 TV channels + broadband',
    },
];

const ServiceIcon = ({ name, color, size = 24 }) => {
    const [failed, setFailed] = useState(false);
    const logoUrl = getServiceLogo(name);
    if (!logoUrl || failed) {
        return <span style={{ fontSize: size * 0.7, fontWeight: 800, color }}>{name.charAt(0)}</span>;
    }
    return <img src={logoUrl} alt={name} style={{ width: size, height: size, borderRadius: 4, objectFit: 'contain' }} onError={() => setFailed(true)} />;
};

const ExpensesPage = () => {
    const { subscriptions, stats } = useSubscriptions();
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const chartData = useMemo(() => {
        const totalMonthly = subscriptions.reduce((acc, s) => {
            return acc + (s.cycle === 'monthly' ? s.price : s.price / 12);
        }, 0);

        if (totalMonthly === 0) return [];

        let cumulativeAngle = 0;
        return subscriptions.map((sub, i) => {
            const monthlyCost = sub.cycle === 'monthly' ? sub.price : sub.price / 12;
            const daysRemaining = Math.max(0, Math.ceil((new Date(sub.nextRenewal) - new Date()) / (1000 * 60 * 60 * 24)));
            const percentage = (monthlyCost / totalMonthly) * 100;
            const angle = (percentage / 100) * 360;
            const startAngle = cumulativeAngle;
            cumulativeAngle += angle;

            // Check annual savings
            const key = sub.name.toLowerCase().trim();
            const annualData = ANNUAL_SAVINGS[key];
            let savingsTip = null;
            if (annualData && sub.cycle === 'monthly' && sub.price >= annualData.monthlyPrice) {
                const effectiveMonthly = (annualData.annualPrice / 12).toFixed(0);
                const yearlySavings = (sub.price * 12) - annualData.annualPrice;
                if (yearlySavings > 0) {
                    savingsTip = {
                        label: annualData.label,
                        effectiveMonthly,
                        yearlySavings,
                    };
                }
            }

            return {
                ...sub,
                monthlyCost: monthlyCost.toFixed(0),
                percentage: percentage.toFixed(1),
                color: sub.color || COLORS[i % COLORS.length],
                startAngle,
                endAngle: cumulativeAngle,
                daysRemaining,
                savingsTip,
            };
        });
    }, [subscriptions]);

    // Bundle optimization calculation
    const optimizationTip = useMemo(() => {
        if (chartData.length === 0) return null;

        const normalizedNames = subscriptions.map(s => s.name.toLowerCase().replace(/\s+/g, ''));

        for (const bundle of BUNDLES) {
            const matchedSubs = chartData.filter(item =>
                bundle.includes.some(keyword =>
                    item.name.toLowerCase().replace(/\s+/g, '').includes(keyword.replace(/\s+/g, ''))
                )
            );

            if (matchedSubs.length >= 2) {
                const currentCost = matchedSubs.reduce((sum, s) => sum + Number(s.monthlyCost), 0);
                if (currentCost > bundle.price) {
                    return {
                        bundleName: bundle.name,
                        bundlePrice: bundle.price,
                        currentCost,
                        savings: currentCost - bundle.price,
                        matchedNames: matchedSubs.map(s => s.name),
                        extras: bundle.extras,
                    };
                }
            }
        }
        return null;
    }, [chartData, subscriptions]);

    // SVG pie chart helpers
    const size = 300;
    const cx = size / 2;
    const cy = size / 2;
    const radius = 120;
    const innerRadius = 78;

    const polarToCartesian = (cxp, cyp, r, angleDeg) => {
        const rad = ((angleDeg - 90) * Math.PI) / 180;
        return { x: cxp + r * Math.cos(rad), y: cyp + r * Math.sin(rad) };
    };

    const describeArc = (cxp, cyp, outerR, innerR, startAngle, endAngle) => {
        const clampedEnd = endAngle - startAngle >= 359.99 ? startAngle + 359.99 : endAngle;
        const outerStart = polarToCartesian(cxp, cyp, outerR, clampedEnd);
        const outerEnd = polarToCartesian(cxp, cyp, outerR, startAngle);
        const innerStart = polarToCartesian(cxp, cyp, innerR, clampedEnd);
        const innerEnd = polarToCartesian(cxp, cyp, innerR, startAngle);
        const largeArc = clampedEnd - startAngle > 180 ? 1 : 0;

        return [
            `M ${outerStart.x} ${outerStart.y}`,
            `A ${outerR} ${outerR} 0 ${largeArc} 0 ${outerEnd.x} ${outerEnd.y}`,
            `L ${innerEnd.x} ${innerEnd.y}`,
            `A ${innerR} ${innerR} 0 ${largeArc} 1 ${innerStart.x} ${innerStart.y}`,
            'Z',
        ].join(' ');
    };

    const hoveredData = hoveredIndex !== null ? chartData[hoveredIndex] : null;

    return (
        <div className="expenses-page fade-in">
            <header className="expenses-header">
                <div>
                    <h1>📊 Expenses</h1>
                    <p className="subtitle">Your OTT spending breakdown</p>
                </div>
            </header>

            <div className="expenses-layout">
                {/* Pie Chart Panel */}
                <div className="glass chart-panel">
                    <h2>Monthly Breakdown</h2>
                    <div className="chart-area">
                        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="pie-svg">
                            {chartData.map((slice, i) => {
                                const isHovered = hoveredIndex === i;
                                const scale = isHovered ? 1.08 : 1;
                                return (
                                    <g key={slice.id || i}>
                                        <path
                                            d={describeArc(cx, cy, radius, innerRadius, slice.startAngle, slice.endAngle)}
                                            fill={slice.color}
                                            stroke="rgba(15,17,26,0.8)"
                                            strokeWidth="2"
                                            style={{
                                                transform: `scale(${scale})`,
                                                transformOrigin: `${cx}px ${cy}px`,
                                                transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.3s, opacity 0.3s',
                                                filter: isHovered ? `drop-shadow(0 0 14px ${slice.color})` : 'none',
                                                cursor: 'pointer',
                                                opacity: hoveredIndex !== null && !isHovered ? 0.3 : 1,
                                            }}
                                            onMouseEnter={() => setHoveredIndex(i)}
                                            onMouseLeave={() => setHoveredIndex(null)}
                                        />
                                    </g>
                                );
                            })}
                            {/* Center hero number */}
                            <text x={cx} y={cy - 12} textAnchor="middle" fill="white" fontSize="34" fontWeight="900" fontFamily="var(--font-heading)" letterSpacing="-1">
                                {hoveredData ? `${hoveredData.percentage}%` : `₹${Number(stats.totalMonthly).toLocaleString('en-IN')}`}
                            </text>
                            <text x={cx} y={cy + 12} textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="500" letterSpacing="1" textTransform="uppercase">
                                {hoveredData ? hoveredData.name : 'per month'}
                            </text>
                        </svg>
                    </div>

                    {/* Tooltip on hover */}
                    <AnimatePresence>
                        {hoveredData && (
                            <motion.div
                                className="chart-tooltip"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ duration: 0.2 }}
                                style={{ borderColor: hoveredData.color }}
                            >
                                <ServiceIcon name={hoveredData.name} color={hoveredData.color} size={28} />
                                <div className="tooltip-text">
                                    <strong>{hoveredData.name}</strong>
                                    <span>₹{Number(hoveredData.monthlyCost).toLocaleString('en-IN')}/mo — {hoveredData.percentage}% of total</span>
                                    {hoveredData.daysRemaining <= 7 && (
                                        <span className="tooltip-urgency">⚠️ Renews in {hoveredData.daysRemaining} days</span>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Detail Panel */}
                <div className="glass detail-panel">
                    <h2>Service Breakdown</h2>
                    <div className="breakdown-list">
                        {chartData.map((item, i) => {
                            const isActive = hoveredIndex === i;
                            const isDimmed = hoveredIndex !== null && !isActive;
                            const statusColor = item.daysRemaining <= 3 ? '#ff3b30' : item.daysRemaining <= 10 ? '#ffcc00' : '#00ff88';

                            return (
                                <motion.div
                                    key={item.id || i}
                                    className={`breakdown-row ${isActive ? 'active' : ''}`}
                                    onMouseEnter={() => setHoveredIndex(i)}
                                    onMouseLeave={() => setHoveredIndex(null)}
                                    whileHover={{ x: 6 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                    style={{
                                        opacity: isDimmed ? 0.35 : 1,
                                        transition: 'opacity 0.3s, background 0.25s, border-color 0.25s',
                                    }}
                                >
                                    <div className="row-left">
                                        <div className="status-dot" style={{
                                            backgroundColor: statusColor,
                                            boxShadow: `0 0 6px ${statusColor}60`,
                                        }}></div>
                                        <ServiceIcon name={item.name} color={item.color} size={28} />
                                        <div className="row-name-group">
                                            <span className="row-name">{item.name}</span>
                                            <span className="row-cycle">{item.cycle === 'monthly' ? 'Monthly' : 'Yearly'}</span>
                                        </div>
                                    </div>
                                    <div className="row-right">
                                        <span className="row-price">₹{Number(item.monthlyCost).toLocaleString('en-IN')}</span>
                                        <span className="row-pct">{item.percentage}%</span>
                                    </div>
                                    {/* Savings tip badge */}
                                    {item.savingsTip && (
                                        <div className="savings-badge">
                                            <Lightbulb size={12} />
                                            <span>Switch to annual — save ₹{item.savingsTip.yearlySavings}/yr (₹{item.savingsTip.effectiveMonthly}/mo)</span>
                                        </div>
                                    )}
                                    {/* Mini bar */}
                                    <div className="mini-bar-track">
                                        <motion.div
                                            className="mini-bar-fill"
                                            style={{ backgroundColor: item.color }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${item.percentage}%` }}
                                            transition={{ duration: 0.8, delay: i * 0.1 }}
                                        />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Summary Footer */}
                    <div className="summary-footer">
                        <div className="summary-item">
                            <TrendingUp size={16} color="#00ff88" />
                            <span>Monthly: <strong>₹{Number(stats.totalMonthly).toLocaleString('en-IN')}</strong></span>
                        </div>
                        <div className="summary-item">
                            <TrendingDown size={16} color="#ffcc00" />
                            <span>Yearly: <strong>₹{Number(stats.totalYearly).toLocaleString('en-IN')}</strong></span>
                        </div>
                        <div className="summary-item">
                            <IndianRupee size={16} color="#00d2ff" />
                            <span>Daily Avg: <strong>₹{(Number(stats.totalMonthly) / 30).toFixed(0)}</strong></span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Optimization Tip Card */}
            {optimizationTip && (
                <motion.div
                    className="glass optimization-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <div className="opt-left">
                        <div className="opt-icon">
                            <Zap size={22} color="#ffcc00" />
                        </div>
                        <div className="opt-info">
                            <h3>💡 Optimization Tip</h3>
                            <p>
                                You're spending <strong>₹{optimizationTip.currentCost}/mo</strong> on {optimizationTip.matchedNames.join(', ')}.
                                Switch to <strong>{optimizationTip.bundleName}</strong> and get all of them {optimizationTip.extras} for just <strong>₹{optimizationTip.bundlePrice}/mo</strong>.
                            </p>
                            <div className="opt-savings-pill">
                                🎉 Potential Savings: ₹{optimizationTip.savings}/month (₹{optimizationTip.savings * 12}/year)
                            </div>
                        </div>
                    </div>
                    <button className="opt-action">
                        Learn More <ArrowRight size={14} />
                    </button>
                </motion.div>
            )}

            <style>{`
                .expenses-page { display: flex; flex-direction: column; gap: 32px; }
                .expenses-header h1 { font-size: 32px; letter-spacing: -0.5px; }

                .expenses-layout {
                    display: grid;
                    grid-template-columns: 1fr 1.2fr;
                    gap: 24px;
                    align-items: start;
                }

                .chart-panel, .detail-panel { padding: 28px; }
                .chart-panel h2, .detail-panel h2 { font-size: 18px; margin: 0 0 24px 0; }

                .chart-area {
                    display: flex;
                    justify-content: center;
                    position: relative;
                    padding: 12px 0;
                }
                .pie-svg { overflow: visible; }

                /* Tooltip */
                .chart-tooltip {
                    display: flex; align-items: center; gap: 14px;
                    background: rgba(14, 16, 28, 0.97);
                    border: 1px solid; border-radius: 14px;
                    padding: 14px 18px; margin-top: 16px;
                    backdrop-filter: blur(10px);
                }
                .tooltip-text { display: flex; flex-direction: column; gap: 2px; }
                .tooltip-text strong { display: block; font-size: 15px; }
                .tooltip-text span { font-size: 12px; color: var(--text-dim); }
                .tooltip-urgency { color: #ff3b30 !important; font-weight: 600; }

                /* Breakdown List */
                .breakdown-list {
                    display: flex; flex-direction: column; gap: 6px;
                    max-height: 480px; overflow-y: auto;
                }
                .breakdown-row {
                    padding: 16px 18px;
                    border-radius: 14px;
                    border: 1px solid transparent;
                    background: rgba(255,255,255,0.02);
                    cursor: pointer;
                    position: relative;
                }
                .breakdown-row:hover, .breakdown-row.active {
                    background: rgba(255,255,255,0.06);
                    border-color: var(--glass-border);
                }
                .row-left { display: flex; align-items: center; gap: 12px; }

                /* Glowing status dot */
                .status-dot {
                    width: 10px; height: 10px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }

                .row-name-group { display: flex; flex-direction: column; gap: 1px; }
                .row-name { font-weight: 600; font-size: 14px; }
                .row-cycle { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; }

                .row-right {
                    display: flex; align-items: center; gap: 12px;
                    margin-top: 6px; padding-left: 34px;
                }
                .row-price {
                    font-weight: 700; font-size: 17px;
                    font-family: var(--font-heading);
                }
                .row-pct {
                    font-size: 11px; color: var(--text-dim);
                    background: rgba(255,255,255,0.06);
                    padding: 3px 10px; border-radius: 20px;
                    font-weight: 600;
                }

                /* Annual savings badge */
                .savings-badge {
                    display: inline-flex; align-items: center; gap: 6px;
                    margin-top: 8px; margin-left: 34px;
                    padding: 4px 10px;
                    background: rgba(255, 204, 0, 0.08);
                    border: 1px solid rgba(255, 204, 0, 0.2);
                    border-radius: 8px;
                    font-size: 11px; font-weight: 600;
                    color: #ffcc00;
                }

                .mini-bar-track {
                    height: 4px;
                    background: rgba(255,255,255,0.08);
                    border-radius: 10px;
                    margin-top: 10px;
                    overflow: hidden;
                }
                .mini-bar-fill { height: 100%; border-radius: 10px; }

                /* Summary Footer */
                .summary-footer {
                    display: flex; gap: 16px;
                    margin-top: 24px; padding-top: 20px;
                    border-top: 1px solid var(--glass-border);
                    flex-wrap: wrap;
                }
                .summary-item {
                    display: flex; align-items: center; gap: 8px;
                    font-size: 13px; color: var(--text-dim);
                }
                .summary-item strong { color: var(--text-main); }

                /* Optimization Card */
                .optimization-card {
                    padding: 24px;
                    display: flex; align-items: center; gap: 20px;
                    border-left: 4px solid #ffcc00;
                    background: linear-gradient(135deg, rgba(255, 204, 0, 0.06), rgba(0, 210, 255, 0.03));
                    position: relative;
                    overflow: hidden;
                }
                .opt-left { display: flex; gap: 16px; flex: 1; align-items: flex-start; }
                .opt-icon {
                    width: 44px; height: 44px;
                    background: rgba(255, 204, 0, 0.12);
                    border-radius: 12px;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                }
                .opt-info h3 { font-size: 16px; margin: 0 0 6px 0; color: #ffcc00; }
                .opt-info p { font-size: 13px; line-height: 1.6; margin: 0; color: var(--text-main); }
                .opt-info p strong { color: white; }
                .opt-savings-pill {
                    display: inline-block; margin-top: 10px;
                    padding: 6px 14px;
                    background: rgba(0, 255, 136, 0.1);
                    border: 1px solid rgba(0, 255, 136, 0.2);
                    border-radius: 20px;
                    font-size: 12px; font-weight: 700;
                    color: #00ff88;
                }
                .opt-action {
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    color: white; padding: 10px 18px;
                    border-radius: 10px; font-weight: 600;
                    font-size: 13px; cursor: pointer;
                    display: flex; align-items: center; gap: 6px;
                    transition: all 0.2s; white-space: nowrap;
                    font-family: var(--font-body);
                }
                .opt-action:hover {
                    background: rgba(255, 255, 255, 0.15);
                    transform: translateX(2px);
                }

                @media (max-width: 900px) {
                    .expenses-layout { grid-template-columns: 1fr; }
                }
                @media (max-width: 768px) {
                    .expenses-header h1 { font-size: 24px; }
                    .chart-panel, .detail-panel { padding: 20px; }
                    .summary-footer { flex-direction: column; gap: 10px; }
                    .optimization-card { flex-direction: column; align-items: flex-start; padding: 20px; }
                    .opt-action { width: 100%; justify-content: center; }
                }
            `}</style>
        </div>
    );
};

export default ExpensesPage;
