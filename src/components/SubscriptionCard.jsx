import React, { useState } from 'react';
import { Trash2, Edit2, ExternalLink } from 'lucide-react';
import getServiceLogo from '../services/logoMap';

const WATCH_URLS = {
    'netflix':          'https://www.netflix.com',
    'jiohotstar':       'https://www.hotstar.com',
    'hotstar':          'https://www.hotstar.com',
    'zee5':             'https://www.zee5.com',
    'sony liv':         'https://www.sonyliv.com',
    'sonyliv':          'https://www.sonyliv.com',
    'youtube premium':  'https://www.youtube.com',
    'youtube':          'https://www.youtube.com',
    'google one':       'https://one.google.com',
    'prime video':      'https://www.primevideo.com',
    'amazon prime':     'https://www.primevideo.com',
    'apple tv+':        'https://tv.apple.com',
    'apple tv':         'https://tv.apple.com',
    'mx player':        'https://www.mxplayer.in',
    'aha':              'https://www.aha.video',
    'disney+':          'https://www.disneyplus.com',
    'jio cinema':       'https://www.jiocinema.com',
};

function getWatchUrl(name) {
    if (!name) return null;
    const key = name.toLowerCase().trim();
    if (WATCH_URLS[key]) return WATCH_URLS[key];
    for (const [k, url] of Object.entries(WATCH_URLS)) {
        if (key.includes(k) || k.includes(key)) return url;
    }
    return null;
}

const SubscriptionCard = ({ sub, onDelete, onEdit }) => {
    const daysRemaining = Math.max(0, Math.ceil((new Date(sub.nextRenewal) - new Date()) / (1000 * 60 * 60 * 24)));
    const totalDays = sub.cycle === 'monthly' ? 30 : 365;
    const percentageUsed = Math.min(100, ((totalDays - daysRemaining) / totalDays) * 100);
    const monthlyEquiv = sub.cycle === 'yearly' ? (sub.price / 12).toFixed(0) : null;
    const urgencyColor = (percentageUsed >= 85 || daysRemaining <= 3) ? '#ff3b30' : (percentageUsed >= 60 || daysRemaining <= 10) ? '#ffcc00' : sub.color;
    const isImminent = daysRemaining <= 1;

    return (
        <div className="glass subscription-card" style={{ '--sub-color': sub.color }}>
            <div className="card-header">
                <div className="service-icon">
                    <ServiceLogo name={sub.name} color={sub.color} />
                </div>

                <div className="service-info">
                    <h3>{sub.name}</h3>
                    <p>
                        <span className={`cycle-badge ${sub.cycle}`}>
                            {sub.cycle === 'monthly' ? 'Monthly' : 'Yearly'}
                        </span>
                    </p>
                </div>
                <div className="card-actions">
                    <button className="icon-btn edit-btn" onClick={() => onEdit(sub)}>
                        <Edit2 size={13} />
                    </button>
                    <button className="icon-btn delete-btn" onClick={() => onDelete(sub.id)}>
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <div className="price-section">
                <div className="price-tag">
                    <span className="currency">₹</span>
                    <span className="amount">{sub.price.toLocaleString('en-IN')}</span>
                    <span className="price-period">/{sub.cycle === 'monthly' ? 'mo' : 'yr'}</span>
                </div>
                {monthlyEquiv && (
                    <span className="monthly-equiv">≈ ₹{monthlyEquiv}/mo</span>
                )}
            </div>

            <div className="renewal-tracker">
                <div className="flex-between meta-info">
                    <span style={{ color: urgencyColor, fontWeight: (percentageUsed >= 85 || daysRemaining <= 3) ? 700 : 500 }}>
                        {(percentageUsed >= 85 || daysRemaining <= 3) ? '⚠️ ' : ''}{daysRemaining} Days Left
                    </span>
                    <span>{new Date(sub.nextRenewal).toLocaleDateString('en-IN')}</span>
                </div>
                <div 
                    className={`progress-bar ${isImminent ? 'pulse-danger' : ''}`}
                    title={`${(100 - percentageUsed).toFixed(0)}% of billing cycle remaining`}
                >
                    <div
                        className="progress-fill striped-bar"
                        style={{ width: `${percentageUsed}%`, backgroundColor: urgencyColor, boxShadow: (percentageUsed >= 85 || daysRemaining <= 3) ? `0 0 10px ${urgencyColor}` : 'none' }}
                    ></div>
                </div>
            </div>

            <a 
                className="watch-btn"
                href={getWatchUrl(sub.name) || '#'}
                target="_blank"
                rel="noopener noreferrer"
                style={{ '--sub-color': sub.color }}
                onClick={(e) => !getWatchUrl(sub.name) && e.preventDefault()}
            >
                <ExternalLink size={14} />
                Watch Now
            </a>

            <style>{`
                .subscription-card {
                    padding: 22px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }
                .subscription-card::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 3px;
                    background: var(--sub-color);
                }
                .subscription-card:hover {
                    transform: translateY(-6px);
                    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
                }
                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    position: relative;
                }
                .service-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .service-logo { width: 42px; height: 42px; border-radius: 8px; object-fit: contain; background: transparent; box-shadow: none; border: none; }
                .letter-icon { font-size: 20px; font-weight: 800; }
                .service-info { flex: 1; }
                .service-info h3 { font-size: 17px; margin: 0; }
                .cycle-badge {
                    font-size: 11px;
                    font-weight: 600;
                    padding: 2px 8px;
                    border-radius: 20px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .cycle-badge.monthly { background: rgba(0, 255, 136, 0.1); color: #00ff88; }
                .cycle-badge.yearly  { background: rgba(255, 179, 0, 0.12); color: #ffb300; }
                .card-actions {
                    position: absolute;
                    top: -8px; right: -8px;
                    display: flex;
                    gap: 6px;
                    opacity: 0;
                    transition: all 0.2s;
                }
                .subscription-card:hover .card-actions { opacity: 1; }
                .icon-btn {
                    border-radius: 50%;
                    width: 28px; height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .edit-btn {
                    background: rgba(255,255,255,0.06);
                    color: var(--text-dim);
                    border: 1px solid var(--glass-border);
                }
                .edit-btn:hover { background: rgba(255,255,255,0.1); color: white; }
                
                .delete-btn {
                    background: rgba(255,77,77,0.1);
                    color: #ff4d4d;
                    border: 1px solid rgba(255,77,77,0.2);
                }
                .delete-btn:hover { background: rgba(255,77,77,0.3); }

                .price-section {
                    display: flex;
                    align-items: baseline;
                    gap: 10px;
                }
                .price-tag {
                    font-family: var(--font-heading);
                    font-weight: 700;
                    display: flex;
                    align-items: baseline;
                    gap: 2px;
                }
                .currency { font-size: 14px; color: var(--text-dim); }
                .amount { font-size: 26px; }
                .price-period { font-size: 13px; color: var(--text-dim); font-weight: 500; }
                .monthly-equiv { font-size: 11px; color: var(--text-dim); }
                .meta-info {
                    font-size: 12px;
                    color: var(--text-dim);
                    margin-bottom: 8px;
                }
                .progress-bar {
                    height: 6px;
                    background: rgba(255,255,255,0.15); /* Higher contrast track */
                    border-radius: 10px;
                    overflow: hidden;
                    position: relative;
                }
                .progress-fill {
                    height: 100%;
                    border-radius: 10px;
                    transition: width 1s ease-out, background-color 0.5s;
                }
                /* Striped pattern overlay */
                .striped-bar {
                    background-image: linear-gradient(
                        45deg,
                        rgba(255, 255, 255, 0.15) 25%,
                        transparent 25%,
                        transparent 50%,
                        rgba(255, 255, 255, 0.15) 50%,
                        rgba(255, 255, 255, 0.15) 75%,
                        transparent 75%,
                        transparent
                    );
                    background-size: 20px 20px;
                }
                /* Pulse animation for imminent renewal */
                .pulse-danger {
                    animation: pulse-border 1.5s infinite;
                }
                @keyframes pulse-border {
                    0% { box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.4); }
                    70% { box-shadow: 0 0 0 6px rgba(255, 59, 48, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(255, 59, 48, 0); }
                }
                .watch-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 10px;
                    border-radius: 12px;
                    background: color-mix(in srgb, var(--sub-color) 12%, transparent);
                    border: 1px solid color-mix(in srgb, var(--sub-color) 25%, transparent);
                    color: var(--text-main);
                    font-size: 13px;
                    font-weight: 600;
                    font-family: var(--font-body);
                    text-decoration: none;
                    cursor: pointer;
                    transition: all 0.25s ease;
                }
                .watch-btn:hover {
                    background: color-mix(in srgb, var(--sub-color) 25%, transparent);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 16px color-mix(in srgb, var(--sub-color) 30%, transparent);
                }
            `}</style>
        </div>
    );
};
const ServiceLogo = ({ name, color }) => {
    const [failed, setFailed] = useState(false);
    const logoUrl = getServiceLogo(name);
    
    if (!logoUrl || failed) {
        return <span className="letter-icon" style={{ color }}>{name.charAt(0)}</span>;
    }
    return (
        <img
            className="service-logo"
            src={logoUrl}
            alt={name}
            onError={() => setFailed(true)}
            loading="lazy"
        />
    );
};

export default SubscriptionCard;
