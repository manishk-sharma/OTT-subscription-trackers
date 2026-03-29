import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Phone, Zap, CheckCircle, AlertCircle, ChevronRight, RefreshCw, Info } from 'lucide-react';
import { scanGmailForSubscriptions, detectCarrier, GMAIL_SCOPE } from '../services/gmailScanner';
import getServiceLogo from '../services/logoMap';


// ─── Replace with your Google Cloud OAuth Client ID ───────────────────────────
// Get one free at: https://console.cloud.google.com
// 1. Create project → Enable Gmail API → Create OAuth 2.0 Web credential
// 2. Add http://localhost:5173 to Authorized JavaScript Origins
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// ─── Sub-components ────────────────────────────────────────────────────────────
const StepIndicator = ({ current, steps }) => (
    <div className="step-indicator">
        {steps.map((s, i) => (
            <React.Fragment key={i}>
                <div className={`step-dot ${i < current ? 'done' : i === current ? 'active' : ''}`}>
                    {i < current ? <CheckCircle size={14} /> : i + 1}
                </div>
                {i < steps.length - 1 && <div className={`step-line ${i < current ? 'done' : ''}`} />}
            </React.Fragment>
        ))}
    </div>
);

const DetectedCard = ({ sub, selected, onToggle }) => (
    <div
        className={`detected-card ${selected ? 'selected' : ''}`}
        onClick={onToggle}
        style={{ '--card-color': sub.color }}
    >
        <div className="detected-icon">
            <img className="detected-logo" src={getServiceLogo(sub.name)} alt={sub.name} onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
            <span className="detected-fallback" style={{ display:'none', color: sub.color, fontWeight: 800, fontSize: 16 }}>{sub.name.charAt(0)}</span>
        </div>
        <div className="detected-info">
            <span className="detected-name">{sub.name}</span>
            <span className="detected-meta">
                {sub.bundled ? (
                    <span className="bundled-tag">🎁 Bundled with {sub.carrier}</span>
                ) : (
                    <>₹{sub.price} / {sub.cycle === 'monthly' ? 'mo' : (sub.cycle === 'quarterly' ? 'qtr' : 'yr')}</>
                )}
            </span>
            {sub.source === 'gmail' && (
                <span className="source-tag">📧 Found in email</span>
            )}
        </div>
        <div className={`select-check ${selected ? 'active' : ''}`}>
            {selected ? <CheckCircle size={18} /> : <div className="empty-check" />}
        </div>
    </div>
);

// ─── Main Modal ────────────────────────────────────────────────────────────────
const SmartImportModal = ({ isOpen, onClose, onImport }) => {
    const [tab, setTab] = useState('email'); // 'email' | 'phone'
    const [step, setStep] = useState(0);     // 0=intro, 1=scanning, 2=review

    // Gmail state
    const [accessToken, setAccessToken] = useState(null);
    const [scanProgress, setScanProgress] = useState({ stage: 'idle', message: '', progress: 0 });
    const [detectedSubs, setDetectedSubs] = useState([]);
    const [selectedSubs, setSelectedSubs] = useState(new Set());
    const [scanError, setScanError] = useState(null);

    // Phone state
    const [phone, setPhone] = useState('');
    const [carrier, setCarrier] = useState(null);
    const [phoneStep, setPhoneStep] = useState(0); // 0=input, 1=bundles
    const [selectedPhone, setSelectedPhone] = useState(new Set());

    const reset = useCallback(() => {
        setStep(0); setPhoneStep(0);
        setAccessToken(null);
        setScanProgress({ stage: 'idle', message: '', progress: 0 });
        setDetectedSubs([]); setSelectedSubs(new Set());
        setScanError(null);
        setPhone(''); setCarrier(null); setSelectedPhone(new Set());
    }, []);

    const handleClose = () => { reset(); onClose(); };

    // ── Gmail OAuth ──
    const connectGmail = () => {
        if (!GOOGLE_CLIENT_ID) {
            setScanError('no_client_id');
            return;
        }
        setScanError(null);
        if (!window.google?.accounts?.oauth2) {
            setScanError('gis_not_loaded');
            return;
        }
        const client = window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: GMAIL_SCOPE,
            callback: async (resp) => {
                if (resp.error) { setScanError(resp.error); return; }
                setAccessToken(resp.access_token);
                await runScan(resp.access_token);
            },
        });
        client.requestAccessToken();
    };

    const runScan = async (token) => {
        setStep(1);
        setScanError(null);
        try {
            const results = await scanGmailForSubscriptions(token, (p) => {
                setScanProgress({ ...p, progress: p.progress || 0 });
            });
            setDetectedSubs(results);
            setSelectedSubs(new Set(results.map(s => s.name)));
            setStep(2);
        } catch (e) {
            setScanError('scan_failed');
            setStep(0);
        }
    };

    // ── Phone ──
    const handlePhoneLookup = () => {
        const result = detectCarrier(phone);
        setCarrier(result);
        setSelectedPhone(new Set(result ? result.bundles.map(b => b.name) : []));
        setPhoneStep(1);
    };

    const togglePhone = (name) => {
        setSelectedPhone(prev => {
            const next = new Set(prev);
            next.has(name) ? next.delete(name) : next.add(name);
            return next;
        });
    };

    const toggleSub = (name) => {
        setSelectedSubs(prev => {
            const next = new Set(prev);
            next.has(name) ? next.delete(name) : next.add(name);
            return next;
        });
    };

    const handleImportEmail = () => {
        const toImport = detectedSubs.filter(s => selectedSubs.has(s.name));
        onImport(toImport);
        handleClose();
    };

    const handleImportPhone = () => {
        if (!carrier) return;
        const today = new Date();
        today.setMonth(today.getMonth() + 1);
        const nextRenewal = today.toISOString().split('T')[0];
        const toImport = carrier.bundles
            .filter(b => selectedPhone.has(b.name))
            .map(b => ({ ...b, nextRenewal }));
        onImport(toImport);
        handleClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="si-overlay" onClick={e => e.target === e.currentTarget && handleClose()}>
                <motion.div
                    className="glass si-modal"
                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 40, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 26 }}
                >
                    {/* Header */}
                    <div className="si-header">
                        <div>
                            <h2>⚡ Smart Import</h2>
                            <p className="si-subtitle">Auto-detect subscriptions from Gmail or phone</p>
                        </div>
                        <button className="si-close" onClick={handleClose}><X size={18} /></button>
                    </div>

                    {/* Tab switcher */}
                    <div className="si-tabs">
                        <button className={`si-tab ${tab === 'email' ? 'active' : ''}`} onClick={() => { setTab('email'); reset(); }}>
                            <Mail size={15} /> Email / Gmail
                        </button>
                        <button className={`si-tab ${tab === 'phone' ? 'active' : ''}`} onClick={() => { setTab('phone'); reset(); }}>
                            <Phone size={15} /> Phone Number
                        </button>
                    </div>

                    {/* ── EMAIL TAB ── */}
                    {tab === 'email' && (
                        <div className="si-body">
                            {step === 0 && (
                                <motion.div key="step0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="si-step">
                                    <StepIndicator current={0} steps={['Connect', 'Scan', 'Review']} />

                                    <div className="si-illustration">
                                        <div className="si-orbit">
                                            <img className="orbit-logo" src={getServiceLogo('Netflix')} alt="" />
                                            <img className="orbit-logo" src={getServiceLogo('JioHotstar')} alt="" />
                                            <img className="orbit-logo" src={getServiceLogo('Zee5')} alt="" />
                                            <img className="orbit-logo" src={getServiceLogo('Sony LIV')} alt="" />
                                            <img className="orbit-logo" src={getServiceLogo('YouTube Premium')} alt="" />
                                        </div>
                                    </div>

                                    <h3 className="si-step-title">Connect your Gmail</h3>
                                    <p className="si-step-desc">
                                        We'll scan your inbox for OTT billing emails (Netflix, JioHotstar, Zee5, Sony LIV, etc.) and auto-fill your subscriptions. <strong>Read-only access</strong> — we never store your emails.
                                    </p>

                                    {scanError === 'no_client_id' && (
                                        <div className="si-alert warning">
                                            <AlertCircle size={16} />
                                            <div>
                                                <strong>OAuth Client ID missing.</strong> Add <code>VITE_GOOGLE_CLIENT_ID=your_id</code> to a <code>.env</code> file in your project root.
                                                <br /><a href="https://console.cloud.google.com" target="_blank" rel="noreferrer">→ Get a free Client ID</a>
                                            </div>
                                        </div>
                                    )}
                                    {scanError === 'gis_not_loaded' && (
                                        <div className="si-alert error">
                                            <AlertCircle size={16} />
                                            Google Identity Services not loaded. Check your internet connection and refresh.
                                        </div>
                                    )}
                                    {scanError === 'scan_failed' && (
                                        <div className="si-alert error">
                                            <AlertCircle size={16} />
                                            Scan failed. Please check your internet connection and try again.
                                        </div>
                                    )}

                                    <div className="si-privacy-note">
                                        <Info size={13} />
                                        Google will show a consent screen. Only read permission is requested.
                                    </div>

                                    <button className="si-gmail-btn" onClick={connectGmail}>
                                        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 5.457c-5.12 0-9.89 1.883-13.501 4.982L17.5 16.44A11.01 11.01 0 0124 13c3.046 0 5.832 1.235 7.844 3.233l6.876-6.876C34.624 6.437 29.71 5.457 24 5.457z"/><path fill="#FBBC05" d="M11.5 16.44L4.999 10.439C2.001 14.05.5 18.82.5 24c0 5.18 1.501 9.95 4 13.561l6.5-6.001A11.022 11.022 0 0113 24c0-2.817.994-5.4 2.5-7.56z"/><path fill="#34A853" d="M24 43.543c5.71 0 10.624-.98 14.22-4.297l-6.876-5.877A11.011 11.011 0 0124 35c-3.046 0-5.832-1.235-7.844-3.233l-6.876 6.877C12.89 42.341 18.29 43.543 24 43.543z"/><path fill="#4285F4" d="M43 24c0-1.24-.13-2.46-.37-3.638H24v7.438h10.74c-.51 2.628-2.02 4.853-4.156 6.306l6.876 5.877C40.996 36.456 43 30.53 43 24z"/></svg>
                                        Connect with Google
                                    </button>

                                    {!GOOGLE_CLIENT_ID && (
                                        <div className="si-setup-guide">
                                            <h4>📋 Quick Setup (2 min)</h4>
                                            <ol>
                                                <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer">Google Cloud Console</a></li>
                                                <li>Create a project → Enable <strong>Gmail API</strong></li>
                                                <li>Create <strong>OAuth 2.0 Web Client</strong> credentials</li>
                                                <li>Add <code>http://localhost:5173</code> as authorized origin</li>
                                                <li>Create <code>.env</code> file in project root:<br /><code>VITE_GOOGLE_CLIENT_ID=your_client_id</code></li>
                                                <li>Restart the dev server</li>
                                            </ol>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {step === 1 && (
                                <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="si-step si-scanning">
                                    <StepIndicator current={1} steps={['Connect', 'Scan', 'Review']} />
                                    <div className="si-radar">
                                        <div className="radar-ring r1" />
                                        <div className="radar-ring r2" />
                                        <div className="radar-ring r3" />
                                        <div className="radar-center">📧</div>
                                        <div className="radar-sweep" />
                                    </div>
                                    <p className="si-scanning-msg">{scanProgress.message || 'Connecting to Gmail…'}</p>
                                    {scanProgress.progress > 0 && (
                                        <div className="si-scan-progress">
                                            <div className="si-scan-bar" style={{ width: `${scanProgress.progress * 100}%` }} />
                                        </div>
                                    )}
                                    <p className="si-scanning-sub">Checking for: Netflix · JioHotstar · Zee5 · Sony LIV · YouTube · Google One · Prime Video</p>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="si-step">
                                    <StepIndicator current={2} steps={['Connect', 'Scan', 'Review']} />
                                    <h3 className="si-step-title">
                                        {detectedSubs.length > 0
                                            ? `🎉 Found ${detectedSubs.length} subscription${detectedSubs.length > 1 ? 's' : ''}`
                                            : '😐 No subscriptions found'}
                                    </h3>
                                    {detectedSubs.length === 0 ? (
                                        <p className="si-step-desc">No OTT billing emails were detected in the last 12 months. Try adding subscriptions manually using the "Add Subscription" button.</p>
                                    ) : (
                                        <>
                                            <p className="si-step-desc">Select which to import:</p>
                                            <div className="detected-list">
                                                {detectedSubs.map(sub => (
                                                    <DetectedCard
                                                        key={sub.name}
                                                        sub={sub}
                                                        selected={selectedSubs.has(sub.name)}
                                                        onToggle={() => toggleSub(sub.name)}
                                                    />
                                                ))}
                                            </div>
                                            <div className="si-actions">
                                                <button className="si-secondary" onClick={() => { setStep(0); setDetectedSubs([]); }}>
                                                    <RefreshCw size={14} /> Rescan
                                                </button>
                                                <button
                                                    className="btn-primary"
                                                    onClick={handleImportEmail}
                                                    disabled={selectedSubs.size === 0}
                                                >
                                                    Import {selectedSubs.size} selected <ChevronRight size={16} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    )}

                    {/* ── PHONE TAB ── */}
                    {tab === 'phone' && (
                        <div className="si-body">
                            {phoneStep === 0 && (
                                <motion.div key="ph0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="si-step">
                                    <div className="si-illustration">
                                        <div className="phone-icon-wrap">📱</div>
                                    </div>
                                    <h3 className="si-step-title">Detect carrier bundles</h3>
                                    <p className="si-step-desc">Enter your mobile number. We'll detect your carrier (Jio, Airtel, Vi, BSNL) and show OTT services bundled with your plan.</p>

                                    <div className="si-phone-input-wrap">
                                        <span className="phone-prefix">🇮🇳 +91</span>
                                        <input
                                            className="si-phone-input"
                                            type="tel"
                                            maxLength={10}
                                            placeholder="Enter 10-digit number"
                                            value={phone}
                                            onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        />
                                    </div>

                                    <div className="si-alert info">
                                        <Info size={14} />
                                        Your number is never sent anywhere — carrier detection happens entirely on your device.
                                    </div>

                                    <button
                                        className="btn-primary si-full-btn"
                                        onClick={handlePhoneLookup}
                                        disabled={phone.length < 10}
                                    >
                                        <Zap size={16} /> Detect Carrier & Bundles
                                    </button>
                                </motion.div>
                            )}

                            {phoneStep === 1 && (
                                <motion.div key="ph1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="si-step">
                                    {carrier ? (
                                        <>
                                            <div className="carrier-badge">
                                                <span className="carrier-name">📡 {carrier.name}</span>
                                                <span className="carrier-number">+91 {phone}</span>
                                            </div>
                                            <p className="si-step-desc">{carrier.description}</p>
                                            <div className="detected-list">
                                                {carrier.bundles.map(b => (
                                                    <DetectedCard
                                                        key={b.name}
                                                        sub={b}
                                                        selected={selectedPhone.has(b.name)}
                                                        onToggle={() => togglePhone(b.name)}
                                                    />
                                                ))}
                                            </div>
                                            <div className="si-actions">
                                                <button className="si-secondary" onClick={() => setPhoneStep(0)}>
                                                    ← Back
                                                </button>
                                                <button
                                                    className="btn-primary"
                                                    onClick={handleImportPhone}
                                                    disabled={selectedPhone.size === 0}
                                                >
                                                    Import {selectedPhone.size} selected <ChevronRight size={16} />
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="si-illustration">❓</div>
                                            <h3 className="si-step-title">Carrier not detected</h3>
                                            <p className="si-step-desc">We couldn't identify your carrier from the number <strong>+91 {phone}</strong>. Please add subscriptions manually using the "Add Subscription" button.</p>
                                            <button className="si-secondary" onClick={() => setPhoneStep(0)}>← Try again</button>
                                        </>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    )}
                </motion.div>

                <style>{`
                    .si-overlay {
                        position: fixed; inset: 0;
                        background: rgba(0,0,0,0.78);
                        backdrop-filter: blur(8px);
                        display: flex; align-items: center; justify-content: center;
                        z-index: 1001; padding: 16px;
                    }
                    .si-modal {
                        width: 100%; max-width: 520px;
                        background: rgba(14, 16, 28, 0.98);
                        border-radius: 24px;
                        overflow: hidden;
                        display: flex; flex-direction: column;
                        max-height: 92vh;
                    }
                    .si-header {
                        display: flex; justify-content: space-between; align-items: flex-start;
                        padding: 28px 28px 0;
                    }
                    .si-header h2 { font-size: 22px; margin: 0; }
                    .si-subtitle { color: var(--text-dim); font-size: 13px; margin-top: 4px; }
                    .si-close {
                        background: rgba(255,255,255,0.06); border: 1px solid var(--glass-border);
                        color: var(--text-dim); border-radius: 10px; width: 34px; height: 34px;
                        display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink:0;
                        transition: all 0.2s;
                    }
                    .si-close:hover { color: white; border-color: rgba(255,255,255,0.3); }

                    /* Tabs */
                    .si-tabs {
                        display: flex; gap: 4px;
                        margin: 20px 28px 0;
                        background: rgba(255,255,255,0.04);
                        border-radius: 12px; padding: 4px;
                    }
                    .si-tab {
                        flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
                        padding: 10px; border: none; border-radius: 9px;
                        color: var(--text-dim); background: transparent;
                        font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
                        font-family: var(--font-body);
                    }
                    .si-tab.active { background: var(--accent-primary); color: white; }
                    .si-tab:hover:not(.active) { color: white; background: rgba(255,255,255,0.06); }

                    /* Body */
                    .si-body { padding: 24px 28px 28px; overflow-y: auto; }
                    .si-step { display: flex; flex-direction: column; gap: 18px; }

                    /* Step indicator */
                    .step-indicator {
                        display: flex; align-items: center; gap: 0; justify-content: center; gap: 4px;
                    }
                    .step-dot {
                        width: 28px; height: 28px; border-radius: 50%;
                        border: 2px solid var(--glass-border);
                        display: flex; align-items: center; justify-content: center;
                        font-size: 12px; font-weight: 700; color: var(--text-dim);
                        flex-shrink: 0; transition: all 0.3s;
                    }
                    .step-dot.active { border-color: var(--accent-primary); color: var(--accent-primary); }
                    .step-dot.done { border-color: var(--accent-success); background: rgba(0,255,136,0.1); color: var(--accent-success); }
                    .step-line { flex: 1; height: 2px; background: var(--glass-border); max-width: 48px; transition: background 0.3s; }
                    .step-line.done { background: var(--accent-success); }

                    /* Illustration */
                    .si-illustration { display: flex; justify-content: center; margin: 8px 0; }
                    .si-orbit {
                        position: relative; width: 100px; height: 100px;
                        display: flex; align-items:center; justify-content:center;
                        font-size: 38px;
                        animation: orbit-spin 8s linear infinite;
                    }
                    @keyframes orbit-spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    .si-orbit span, .si-orbit .orbit-logo {
                        position: absolute; width: 28px; height: 28px; border-radius: 6px; object-fit: contain;
                        animation: counter-rotate 8s linear infinite;
                    }
                    @keyframes counter-rotate { 0%{transform:rotate(0deg)} 100%{transform:rotate(-360deg)} }
                    .si-orbit .orbit-logo:nth-child(1) { top: 0; left: 50%; margin-left: -14px; }
                    .si-orbit .orbit-logo:nth-child(2) { right: 0; top: 50%; margin-top: -14px; }
                    .si-orbit .orbit-logo:nth-child(3) { bottom: 0; left: 50%; margin-left: -14px; }
                    .si-orbit .orbit-logo:nth-child(4) { left: 0; top: 50%; margin-top: -14px; }
                    .si-orbit .orbit-logo:nth-child(5) { top: 15%; right: 15%; }
                    .phone-icon-wrap { font-size: 64px; }

                    h3.si-step-title { font-size: 20px; margin: 0; text-align: center; }
                    .si-step-desc { color: var(--text-dim); font-size: 13px; line-height: 1.6; text-align: center; margin: 0; }

                    /* Gmail button */
                    .si-gmail-btn {
                        display: flex; align-items: center; justify-content: center; gap: 10px;
                        width: 100%; padding: 14px;
                        background: white; color: #333;
                        border: none; border-radius: 12px;
                        font-size: 15px; font-weight: 600;
                        cursor: pointer; transition: all 0.2s;
                        font-family: var(--font-body);
                    }
                    .si-gmail-btn:hover { background: #f0f0f0; transform: translateY(-1px); box-shadow: 0 4px 20px rgba(255,255,255,0.1); }

                    /* Privacy note */
                    .si-privacy-note {
                        display: flex; align-items: center; gap: 6px;
                        font-size: 11px; color: var(--text-dim);
                        justify-content: center;
                    }

                    /* Alerts */
                    .si-alert {
                        display: flex; align-items: flex-start; gap: 10px;
                        padding: 12px 14px; border-radius: 10px; font-size: 12px; line-height: 1.5;
                    }
                    .si-alert.warning { background: rgba(255,179,0,0.08); border: 1px solid rgba(255,179,0,0.2); color: #ffb300; }
                    .si-alert.error { background: rgba(255,77,77,0.08); border: 1px solid rgba(255,77,77,0.2); color: #ff4d4d; }
                    .si-alert.info { background: rgba(0,210,255,0.06); border: 1px solid rgba(0,210,255,0.15); color: #00d2ff; }
                    .si-alert a { color: inherit; font-weight: 700; }
                    .si-alert code { background: rgba(255,255,255,0.1); padding: 1px 5px; border-radius: 4px; font-size: 11px; }

                    /* Setup guide */
                    .si-setup-guide {
                        background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border);
                        border-radius: 12px; padding: 16px;
                    }
                    .si-setup-guide h4 { font-size: 13px; margin: 0 0 10px; }
                    .si-setup-guide ol { padding-left: 18px; font-size: 12px; color: var(--text-dim); line-height: 1.8; margin: 0; }
                    .si-setup-guide a { color: var(--accent-secondary); }
                    .si-setup-guide code { background: rgba(255,255,255,0.08); padding: 1px 5px; border-radius: 4px; font-size: 11px; color: #00ff88; }

                    /* Radar */
                    .si-scanning { align-items: center; }
                    .si-radar {
                        position: relative; width: 120px; height: 120px;
                        margin: 8px auto;
                    }
                    .radar-ring {
                        position: absolute; border-radius: 50%;
                        border: 1px solid rgba(124, 77, 255, 0.3);
                        animation: radar-pulse 2s ease-out infinite;
                    }
                    .r1 { inset: 20px; animation-delay: 0s; }
                    .r2 { inset: 8px; animation-delay: 0.5s; }
                    .r3 { inset: 0; animation-delay: 1s; }
                    @keyframes radar-pulse {
                        0%,100% { opacity: 0.3; transform: scale(1); }
                        50% { opacity: 1; transform: scale(1.03); }
                    }
                    .radar-center {
                        position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
                        font-size: 32px; z-index: 1;
                    }
                    .radar-sweep {
                        position: absolute; inset: 0; border-radius: 50%;
                        background: conic-gradient(rgba(124,77,255,0.3) 0deg, transparent 90deg, transparent 360deg);
                        animation: sweep 2s linear infinite;
                    }
                    @keyframes sweep { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
                    .si-scanning-msg { font-size: 14px; font-weight: 600; text-align: center; margin: 0; }
                    .si-scanning-sub { font-size: 11px; color: var(--text-dim); text-align: center; margin: 0; }
                    .si-scan-progress {
                        width: 100%; height: 4px; background: rgba(255,255,255,0.06); border-radius: 10px; overflow: hidden;
                    }
                    .si-scan-bar {
                        height: 100%; background: var(--accent-primary); border-radius: 10px; transition: width 0.5s ease;
                    }

                    /* Detected cards */
                    .detected-list { display: flex; flex-direction: column; gap: 8px; max-height: 240px; overflow-y: auto; }
                    .detected-card {
                        display: flex; align-items: center; gap: 12px;
                        padding: 12px 14px; border-radius: 12px;
                        border: 1px solid var(--glass-border);
                        background: rgba(255,255,255,0.03); cursor: pointer;
                        transition: all 0.2s;
                    }
                    .detected-card:hover { border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); }
                    .detected-card.selected { border-color: var(--card-color, var(--accent-primary)); background: rgba(124,77,255,0.06); }
                    .detected-icon {
                        width: 40px; height: 40px; border-radius: 10px;
                        display: flex; align-items: center; justify-content: center;
                        flex-shrink: 0; overflow: hidden;
                    }
                    .detected-logo { width: 36px; height: 36px; border-radius: 6px; object-fit: contain; background: transparent; }
                    .detected-fallback { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
                    .detected-info { flex: 1; display: flex; flex-direction: column; gap: 3px; }
                    .detected-name { font-weight: 600; font-size: 14px; }
                    .detected-meta { font-size: 12px; color: var(--text-dim); }
                    .bundled-tag { color: var(--accent-success); }
                    .source-tag { font-size: 11px; color: var(--text-dim); }
                    .select-check { color: var(--accent-success); flex-shrink: 0; }
                    .empty-check { width: 18px; height: 18px; border: 2px solid var(--glass-border); border-radius: 50%; }

                    /* Phone */
                    .si-phone-input-wrap {
                        display: flex; align-items: center; gap: 0;
                        border: 1px solid var(--glass-border); border-radius: 12px; overflow: hidden;
                        background: rgba(255,255,255,0.04);
                    }
                    .phone-prefix {
                        padding: 12px 14px; background: rgba(255,255,255,0.03);
                        border-right: 1px solid var(--glass-border);
                        font-size: 14px; color: var(--text-dim); white-space: nowrap;
                    }
                    .si-phone-input {
                        flex: 1; background: transparent; border: none;
                        color: white; padding: 12px 14px; font-size: 16px; font-family: var(--font-body);
                        letter-spacing: 2px;
                    }
                    .si-phone-input:focus { outline: none; }
                    .si-phone-input::placeholder { letter-spacing: 0; color: rgba(255,255,255,0.2); }
                    .si-full-btn { width: 100%; justify-content: center; padding: 14px; font-size: 15px; }
                    .si-full-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none !important; }

                    .carrier-badge {
                        display: flex; align-items: center; justify-content: space-between;
                        padding: 12px 16px; background: rgba(124,77,255,0.1);
                        border: 1px solid rgba(124,77,255,0.2); border-radius: 12px;
                    }
                    .carrier-name { font-weight: 700; font-size: 16px; }
                    .carrier-number { font-size: 13px; color: var(--text-dim); }

                    /* Actions */
                    .si-actions { display: flex; gap: 10px; margin-top: 4px; }
                    .si-secondary {
                        display: flex; align-items: center; gap: 6px;
                        background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border);
                        color: var(--text-dim); padding: 12px 16px; border-radius: 12px;
                        font-family: var(--font-body); font-size: 13px; cursor: pointer; transition: all 0.2s;
                    }
                    .si-secondary:hover { color: white; background: rgba(255,255,255,0.1); }
                    .si-actions .btn-primary { flex: 1; justify-content: center; }
                    .si-actions .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none !important; box-shadow: none; }

                    @media (max-width: 480px) {
                        .si-header { padding: 20px 20px 0; }
                        .si-body { padding: 20px; }
                        .si-orbit { width: 140px; height: 140px; margin: 20px auto; }
                        .si-orbit .orbit-logo { width: 28px; height: 28px; border-radius: 6px; }
                        .si-radar { width: 90px; height: 90px; }
                        .si-actions { flex-direction: column; }
                        .si-secondary { justify-content: center; width: 100%; }
                        h3.si-step-title { font-size: 18px; }
                        .phone-icon-wrap { font-size: 48px; }
                    }
                `}</style>
            </div>
        </AnimatePresence>
    );
};

export default SmartImportModal;
