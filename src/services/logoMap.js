/**
 * Maps OTT service names to their official logo image URLs.
 * Uses Google Favicon API (always available) for reliable logo delivery.
 */

const G = (domain) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

const LOGO_MAP = {
    'netflix':          G('netflix.com'),
    'jiohotstar':       G('hotstar.com'),
    'hotstar':          G('hotstar.com'),
    'zee5':             G('zee5.com'),
    'sony liv':         G('sonyliv.com'),
    'sonyliv':          G('sonyliv.com'),
    'youtube premium':  G('youtube.com'),
    'youtube':          G('youtube.com'),
    'google one':       G('one.google.com'),
    'prime video':      G('primevideo.com'),
    'amazon prime':     G('primevideo.com'),
    'apple tv+':        G('tv.apple.com'),
    'apple tv':         G('tv.apple.com'),
    'mx player':        G('mxplayer.in'),
    'aha':              G('aha.video'),
    'disney+':          G('disneyplus.com'),
    'jio cinema':       G('jiocinema.com'),
};

/**
 * Get logo URL for a service name. Falls back to Google Favicon.
 */
export function getServiceLogo(name) {
    if (!name) return null;
    const key = name.toLowerCase().trim();
    
    if (LOGO_MAP[key]) return LOGO_MAP[key];
    
    // Partial match
    for (const [k, url] of Object.entries(LOGO_MAP)) {
        if (key.includes(k) || k.includes(key)) return url;
    }
    
    // Fallback: guess domain
    const domain = key.replace(/\s+/g, '') + '.com';
    return G(domain);
}

export default getServiceLogo;

