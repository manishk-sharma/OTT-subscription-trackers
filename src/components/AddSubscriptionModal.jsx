import React, { useState } from 'react';
import { X, IndianRupee, Calendar, Zap, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { INDIAN_OTT_PRESETS } from '../hooks/useSubscriptions';
import getServiceLogo from '../services/logoMap';

const AddSubscriptionModal = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        cycle: 'monthly',
        nextRenewal: '',
        color: '#7c4dff',
        icon: ''
    });
    const [showPresets, setShowPresets] = useState(!initialData);

    React.useEffect(() => {
        if (initialData) {
            // Edit mode
            setFormData({
                name: initialData.name,
                price: initialData.price,
                cycle: initialData.cycle,
                nextRenewal: initialData.nextRenewal,
                color: initialData.color || '#7c4dff',
                icon: initialData.icon || ''
            });
            setShowPresets(false);
        } else {
            // Add mode
            setFormData({ name: '', price: '', cycle: 'monthly', nextRenewal: '', color: '#7c4dff', icon: '' });
            setShowPresets(true);
        }
    }, [initialData, isOpen]);

    const handlePreset = (preset) => {
        setFormData({
            ...formData,
            name: preset.name,
            price: preset.defaultPrice,
            cycle: preset.cycle,
            color: preset.color,
            icon: preset.icon
        });
        setShowPresets(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...formData, price: parseFloat(formData.price) });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 24 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 24 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    className="glass modal-content"
                >
                    <div className="flex-between modal-header">
                        <div>
                            <h2>{initialData ? 'Edit Subscription' : 'Add Subscription'}</h2>
                            <p className="modal-subtitle">{initialData ? 'Update your subscription details' : 'Track your Indian OTT services'}</p>
                        </div>
                        <button className="close-btn" onClick={onClose}><X size={20} /></button>
                    </div>

                    {/* Quick-select presets (only show when adding) */}
                    {!initialData && (
                    <div className="presets-section">
                        <button className="presets-toggle" onClick={() => setShowPresets(!showPresets)}>
                            <span>🚀 Quick Select a Service</span>
                            <ChevronDown size={16} style={{ transform: showPresets ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                        </button>
                        {showPresets && (
                            <div className="presets-grid">
                                {INDIAN_OTT_PRESETS.map(preset => (
                                    <button
                                        key={preset.name}
                                        className="preset-chip"
                                        style={{ '--chip-color': preset.color }}
                                        onClick={() => handlePreset(preset)}
                                    >
                                        <img className="preset-logo" src={getServiceLogo(preset.name)} alt="" onError={e => e.target.replaceWith(document.createTextNode(preset.name.charAt(0)))} />
                                        <span>{preset.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    )}

                    <form onSubmit={handleSubmit} className="modal-form">
                        <div className="form-group">
                            <label>Service Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Zee5, JioHotstar..."
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label><IndianRupee size={13} /> Price (₹)</label>
                                <input
                                    type="number"
                                    step="1"
                                    placeholder="e.g. 299"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label><Zap size={13} /> Billing Cycle</label>
                                <select
                                    value={formData.cycle}
                                    onChange={(e) => setFormData({ ...formData, cycle: e.target.value })}
                                >
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label><Calendar size={13} /> Next Renewal Date</label>
                            <input
                                type="date"
                                value={formData.nextRenewal}
                                onChange={(e) => setFormData({ ...formData, nextRenewal: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Card Color</label>
                            <div className="color-picker">
                                {['#E50914', '#1f5dbf', '#7b2d8b', '#e8171f', '#FF0000', '#1a73e8', '#f7b21a', '#00ff88'].map(color => (
                                    <div
                                        key={color}
                                        className={`color-option ${formData.color === color ? 'active' : ''}`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setFormData({ ...formData, color })}
                                    />
                                ))}
                            </div>
                        </div>

                        <button type="submit" className="btn-primary full-width">
                            {initialData ? '💾 Save Changes' : '✅ Add to Dashboard'}
                        </button>
                    </form>
                </motion.div>

                <style>{`
                    .modal-overlay {
                        position: fixed;
                        top: 0; left: 0;
                        width: 100vw; height: 100vh;
                        background: rgba(0, 0, 0, 0.75);
                        backdrop-filter: blur(6px);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 1000;
                        padding: 20px;
                    }
                    .modal-content {
                        width: 100%;
                        max-width: 500px;
                        padding: 32px;
                        background: rgba(18, 20, 32, 0.97);
                        max-height: 90vh;
                        overflow-y: auto;
                    }
                    .modal-header h2 { font-size: 22px; margin: 0; }
                    .modal-subtitle { color: var(--text-dim); font-size: 13px; margin-top: 4px; }
                    .close-btn {
                        background: var(--bg-card);
                        border: 1px solid var(--glass-border);
                        color: var(--text-dim);
                        cursor: pointer;
                        border-radius: 10px;
                        width: 36px; height: 36px;
                        display: flex; align-items: center; justify-content: center;
                        transition: all 0.2s;
                    }
                    .close-btn:hover { color: white; border-color: rgba(255,255,255,0.3); }

                    /* Presets */
                    .presets-section {
                        margin: 20px 0 0;
                        border: 1px solid var(--glass-border);
                        border-radius: 14px;
                        overflow: hidden;
                    }
                    .presets-toggle {
                        width: 100%;
                        background: rgba(255,255,255,0.04);
                        border: none;
                        color: var(--text-dim);
                        padding: 12px 16px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        font-size: 13px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: background 0.2s;
                    }
                    .presets-toggle:hover { background: rgba(255,255,255,0.08); color: white; }
                    .presets-grid {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 8px;
                        padding: 12px;
                        background: rgba(0,0,0,0.2);
                    }
                    .preset-chip {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        padding: 6px 12px;
                        border-radius: 20px;
                        border: 1px solid var(--chip-color, var(--glass-border));
                        background: color-mix(in srgb, var(--chip-color, transparent) 10%, transparent);
                        color: white;
                        font-size: 12px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .preset-chip:hover {
                        background: color-mix(in srgb, var(--chip-color, transparent) 25%, transparent);
                        transform: translateY(-1px);
                    }
                    .preset-logo {
                        width: 18px;
                        height: 18px;
                        border-radius: 4px;
                        object-fit: contain;
                    }

                    /* Form */
                    .modal-form {
                        margin-top: 20px;
                        display: flex;
                        flex-direction: column;
                        gap: 18px;
                    }
                    .form-group { display: flex; flex-direction: column; gap: 8px; }
                    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                    .form-group label {
                        font-size: 13px;
                        color: var(--text-dim);
                        display: flex;
                        align-items: center;
                        gap: 5px;
                        font-weight: 500;
                    }
                    .modal-form input, .modal-form select {
                        background: rgba(255, 255, 255, 0.04);
                        border: 1px solid var(--glass-border);
                        padding: 11px 14px;
                        border-radius: 12px;
                        color: white;
                        font-family: var(--font-body);
                        font-size: 15px;
                        transition: all 0.2s;
                    }
                    .modal-form input::placeholder { color: rgba(255,255,255,0.2); }
                    .modal-form select option { background: #1a1c2e; }
                    .modal-form input:focus, .modal-form select:focus {
                        outline: none;
                        border-color: var(--accent-primary);
                        background: rgba(124, 77, 255, 0.06);
                        box-shadow: 0 0 0 3px rgba(124, 77, 255, 0.12);
                    }
                    .color-picker { display: flex; gap: 10px; flex-wrap: wrap; }
                    .color-option {
                        width: 28px; height: 28px;
                        border-radius: 8px;
                        cursor: pointer;
                        border: 2px solid transparent;
                        transition: all 0.2s;
                    }
                    .color-option.active {
                        border-color: white;
                        transform: scale(1.15);
                        box-shadow: 0 0 10px currentColor;
                    }
                    .full-width {
                        width: 100%;
                        justify-content: center;
                        padding: 14px;
                        font-size: 15px;
                        letter-spacing: 0.3px;
                    }
                    
                    @media (max-width: 480px) {
                        .modal-content {
                            padding: 20px;
                        }
                        .form-row {
                            grid-template-columns: 1fr;
                            gap: 16px;
                        }
                        .modal-overlay {
                            padding: 12px;
                        }
                    }
                `}</style>
            </div>
        </AnimatePresence>
    );
};

export default AddSubscriptionModal;
