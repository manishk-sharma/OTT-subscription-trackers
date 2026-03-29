/**
 * gmailScanner.js
 * 
 * Scans Gmail inbox for OTT subscription/billing emails using the Gmail REST API.
 * Requires an OAuth 2.0 access token with gmail.readonly scope.
 * 
 * Setup: Set VITE_GOOGLE_CLIENT_ID in a .env file in your project root:
 *   VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
 */

export const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';
export const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';

// ─── Known Indian OTT email senders ───────────────────────────────────────────
export const OTT_SENDERS = [
    {
        name: 'Netflix',
        color: '#E50914',
        icon: '🎬',
        from: ['no-reply@netflix.com', 'info@account.netflix.com'],
        keywords: ['netflix', 'membership', 'charged', 'renewed'],
        cycle: 'monthly',
    },
    {
        name: 'JioHotstar',
        color: '#1f5dbf',
        icon: '🔵',
        from: ['alerts@hotstar.com', 'noreply@hotstar.com', 'no-reply@jiohotstar.com', 'hotstar@emails.hotstar.com'],
        keywords: ['hotstar', 'jiohotstar', 'subscription', 'renewed', 'activated'],
        cycle: 'monthly',
    },
    {
        name: 'Zee5',
        color: '#7b2d8b',
        icon: '🟣',
        from: ['noreply@zee5.com', 'info@zee5.com', 'support@zee5.com'],
        keywords: ['zee5', 'subscription', 'payment', 'renewed'],
        cycle: 'yearly',
    },
    {
        name: 'Sony LIV',
        color: '#e8171f',
        icon: '🔴',
        from: ['noreply@sonyliv.com', 'support@sonyliv.com', 'info@sonyliv.com'],
        keywords: ['sonyliv', 'sony liv', 'pack', 'renewed', 'payment'],
        cycle: 'monthly',
    },
    {
        name: 'YouTube Premium',
        color: '#FF0000',
        icon: '▶️',
        from: ['googleplay-noreply@google.com', 'no-reply@youtube.com'],
        keywords: ['youtube premium', 'youtube music', 'google play', 'subscription confirmed'],
        cycle: 'monthly',
    },
    {
        name: 'Google One',
        color: '#1a73e8',
        icon: '🔷',
        from: ['googleplay-noreply@google.com', 'noreply@google.com'],
        keywords: ['google one', 'storage', 'google play'],
        cycle: 'yearly',
    },
    {
        name: 'Prime Video',
        color: '#00a8e1',
        icon: '📦',
        from: ['digital-no-reply@amazon.in', 'no-reply@amazon.in', 'prime@amazon.in'],
        keywords: ['prime', 'amazon prime', 'prime video', 'renewed', 'membership'],
        cycle: 'yearly',
    },
    {
        name: 'Apple TV+',
        color: '#555555',
        icon: '🍎',
        from: ['no_reply@email.apple.com', 'noreply@apple.com'],
        keywords: ['apple tv', 'apple one', 'subscription'],
        cycle: 'monthly',
    },
    {
        name: 'Aha',
        color: '#f7b21a',
        icon: '🌟',
        from: ['noreply@aha.video', 'support@aha.video'],
        keywords: ['aha', 'subscription', 'renewed', 'activated'],
        cycle: 'yearly',
    },
];

// Build the Gmail search query for all known senders
function buildGmailQuery() {
    const fromQueries = OTT_SENDERS
        .flatMap(s => s.from)
        .map(email => `from:${email}`)
        .join(' OR ');
    return `(${fromQueries}) newer_than:12m`;
}

// Extract the plain-text body from a Gmail message payload
function extractBody(payload) {
    if (!payload) return '';
    if (payload.body?.data) {
        return atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    }
    if (payload.parts) {
        for (const part of payload.parts) {
            const text = extractBody(part);
            if (text) return text;
        }
    }
    return '';
}

// Extract a price (in ₹) from a string
function extractPrice(text) {
    const patterns = [
        /₹\s*([0-9,]+(?:\.[0-9]{1,2})?)/,
        /Rs\.?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
        /INR\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
        /charged\s+(?:₹|Rs\.?|INR)?\s*([0-9,]+)/i,
        /amount\s+(?:of\s+)?(?:₹|Rs\.?)?\s*([0-9,]+)/i,
    ];
    for (const pat of patterns) {
        const m = text.match(pat);
        if (m) {
            const val = parseFloat(m[1].replace(/,/g, ''));
            if (val > 0 && val < 50000) return val; // sanity range
        }
    }
    return null;
}

// Extract upcoming renewal/charge date from text
function extractDate(text) {
    const patterns = [
        /(?:next (?:billing|renewal|charge) date|renews? on|valid (?:till|until)|expires? on)[:\s]+([A-Za-z]+ \d{1,2},? \d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
        /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
        /([A-Za-z]+ \d{1,2},? \d{4})/,
    ];
    for (const pat of patterns) {
        const m = text.match(pat);
        if (m) {
            const d = new Date(m[1]);
            if (!isNaN(d.getTime()) && d > new Date()) {
                return d.toISOString().split('T')[0];
            }
        }
    }
    // Default: 30 days from today
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 30);
    return fallback.toISOString().split('T')[0];
}

// Match a Gmail message to a known OTT service
function matchOTT(message) {
    const headers = message.payload?.headers || [];
    const fromHeader = headers.find(h => h.name.toLowerCase() === 'from')?.value?.toLowerCase() || '';
    const subjectHeader = headers.find(h => h.name.toLowerCase() === 'subject')?.value?.toLowerCase() || '';
    const body = extractBody(message.payload).toLowerCase();
    const combined = `${fromHeader} ${subjectHeader} ${body}`;

    for (const ott of OTT_SENDERS) {
        const fromMatch = ott.from.some(f => fromHeader.includes(f.toLowerCase()));
        const keywordMatch = ott.keywords.some(k => combined.includes(k.toLowerCase()));
        if (fromMatch || keywordMatch) {
            // Avoid matching payment-failure or cancellation emails as active subscriptions
            if (/cancel|fail|refund|dispute|declined/i.test(combined)) continue;
            return ott;
        }
    }
    return null;
}

// ─── Main scanner function ─────────────────────────────────────────────────────
export async function scanGmailForSubscriptions(accessToken, onProgress) {
    const query = buildGmailQuery();
    const searchUrl = `${GMAIL_API}/messages?q=${encodeURIComponent(query)}&maxResults=50`;

    onProgress?.({ stage: 'searching', message: 'Searching inbox for OTT emails…' });

    const searchRes = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!searchRes.ok) throw new Error(`Gmail search failed: ${searchRes.status}`);

    const searchData = await searchRes.json();
    const messages = searchData.messages || [];

    onProgress?.({ stage: 'found', message: `Found ${messages.length} matching emails. Analyzing…` });

    const detected = new Map(); // service name → subscription object

    for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        onProgress?.({ stage: 'reading', message: `Reading email ${i + 1} of ${messages.length}…`, progress: (i + 1) / messages.length });

        const msgRes = await fetch(`${GMAIL_API}/messages/${msg.id}?format=full`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!msgRes.ok) continue;

        const msgData = await msgRes.json();
        const ott = matchOTT(msgData);
        if (!ott) continue;

        const headers = msgData.payload?.headers || [];
        const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '';
        const body = extractBody(msgData.payload);
        const combined = `${subject} ${body}`;

        const price = extractPrice(combined);
        const nextRenewal = extractDate(combined);

        // Keep the most recently detected entry per service
        if (!detected.has(ott.name) || price) {
            detected.set(ott.name, {
                name: ott.name,
                color: ott.color,
                icon: ott.icon,
                price: price || ott.defaultPrice || 0,
                cycle: ott.cycle,
                nextRenewal,
                source: 'gmail',
            });
        }
    }

    onProgress?.({ stage: 'done', message: `Scan complete! Found ${detected.size} subscription(s).` });
    return Array.from(detected.values());
}

// ─── Phone carrier bundle map ──────────────────────────────────────────────────
const CARRIER_BUNDLES = {
    jio: {
        name: 'Jio',
        description: 'JioHotstar bundled for free. YouTube Premium & Google One may be included in some plans.',
        bundles: [
            { name: 'JioHotstar', color: '#1f5dbf', icon: '🔵', price: 0, cycle: 'monthly', nextRenewal: '', bundled: true, carrier: 'Jio' },
        ],
        prefixes: ['6', '7', '8', '9'],
        keywords: ['jio'],
    },
    airtel: {
        name: 'Airtel',
        description: 'Airtel Xstream Premium includes Amazon Prime Video. Some plans include Disney+ Hotstar.',
        bundles: [
            { name: 'Prime Video', color: '#00a8e1', icon: '📦', price: 0, cycle: 'yearly', nextRenewal: '', bundled: true, carrier: 'Airtel' },
            { name: 'JioHotstar', color: '#1f5dbf', icon: '🔵', price: 0, cycle: 'monthly', nextRenewal: '', bundled: true, carrier: 'Airtel' },
        ],
        prefixes: ['9', '8', '7', '6'],
        keywords: ['airtel'],
    },
    vi: {
        name: 'Vi (Vodafone Idea)',
        description: 'Vi Hero plans include SonyLIV and ZEE5 subscriptions.',
        bundles: [
            { name: 'Sony LIV', color: '#e8171f', icon: '🔴', price: 0, cycle: 'monthly', nextRenewal: '', bundled: true, carrier: 'Vi' },
            { name: 'Zee5', color: '#7b2d8b', icon: '🟣', price: 0, cycle: 'monthly', nextRenewal: '', bundled: true, carrier: 'Vi' },
        ],
        prefixes: ['9', '8', '7'],
        keywords: ['vi', 'vodafone', 'idea'],
    },
    bsnl: {
        name: 'BSNL',
        description: 'BSNL includes SonyLIV in some fiber plans.',
        bundles: [
            { name: 'Sony LIV', color: '#e8171f', icon: '🔴', price: 0, cycle: 'monthly', nextRenewal: '', bundled: true, carrier: 'BSNL' },
        ],
        prefixes: ['9', '7'],
        keywords: ['bsnl'],
    },
};

// Guess carrier from number (heuristic only — not 100% accurate)
export function detectCarrier(phone) {
    const clean = phone.replace(/\D/g, '');
    const last10 = clean.slice(-10);
    if (!last10 || last10.length < 10) return null;

    // Jio MNCs: mostly 6XXXXXXXXX, 7XXXXXXXXX, 8XXXXXXXXX
    // This is a rough heuristic; real detection needs carrier lookup API
    const prefix3 = last10.slice(0, 3);
    const jioPrefixes = ['620','621','622','623','624','625','626','627','628','629',
        '630','631','632','633','634','635','636','637','638','639',
        '700','701','702','703','704','705','706','707','708','709',
        '710','711','712','713','714','715','716','717','718','719',
        '720','721','722','723','724','725','726','727','728','729',
        '730','731','732','733','734','735','736','737','738','739',
        '740','741','742','743','744','745','746','747','748','749',
        '750','751','752','753','754','755','756','757','758','759',
        '760','761','762','763','764','765','766','767','768','769',
        '900','901','902','903','904','905','906','907','908','909',
        '850','851','852','853','854','855','856','857','858','859'];

    const airtelPrefixes = ['700','706','707','708','720','730','740','750','760','800',
        '801','802','803','804','805','806','807','808','809','810',
        '811','812','813','814','815','816','817','818','819',
        '820','821','822','823','824','825','826','827','828','829',
        '830','831','832','833','834','835','836','837','838','839',
        '840','841','842','843','844','845','846','847','848','849',
        '860','861','862','863','864','865','866','867','868','869',
        '870','871','872','873','874','875','876','877','878','879',
        '880','881','882','883','884','885','886','887','888','889',
        '890','891','892','893','894','895','896','897','898','899',
        '910','911','912','913','914','915','916','917','918','919'];

    if (jioPrefixes.includes(prefix3)) return CARRIER_BUNDLES.jio;
    if (airtelPrefixes.includes(prefix3)) return CARRIER_BUNDLES.airtel;

    // First digit heuristic
    const firstDigit = last10[0];
    if (['9', '8'].includes(firstDigit)) return CARRIER_BUNDLES.airtel;
    if (['7', '6'].includes(firstDigit)) return CARRIER_BUNDLES.jio;

    return null;
}
