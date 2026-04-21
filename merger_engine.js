/**
 * @file merger_engine.js
 * @description Advanced Ad-Block Merger Engine v2.0
 * Features: Modular architecture, Error-resilient fetching, and Auto-Deduplication.
 * @author OpenClaw Assistant
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

/**
 * CONFIGURATION
 * Add or remove blocklist sources here.
 */
const SOURCES = [
    { name: "AdAway", url: "https://adaway.org/hosts.txt", category: "General" },
    { name: "Hagezi-Popup", url: "https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/popupads.txt", category: "Popups" },
    { name: "Hagezi-Ultimate", url: "https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/hosts/ultimate.txt", category: "Privacy" },
    { name: "OISD-Big", url: "https://big.oisd.nl", category: "Ads" },
    { name: "PiHole-r0xd4n3t", url: "https://raw.githubusercontent.com/r0xd4n3t/pihole-adblock-lists/main/pihole_adlists.txt", category: "Ads" },
    { name: "Firebog-Easylist", url: "https://v.firebog.net/hosts/Easylist.txt", category: "General" },
    { name: "StevenBlack", url: "https://raw.githubusercontent.com/StevenBlack/hosts/master/data/StevenBlack/hosts", category: "Privacy" },
    { name: "Yoyo", url: "https://pgl.yoyo.org/adservers/serverlist.php?hostformat=hosts&mimetype=plaintext&useip=0.0.0.0", category: "Ads" },
    { name: "KADhosts", url: "https://raw.githubusercontent.com/FiltersHeroes/KADhosts/master/KADhosts.txt", category: "Regional" }
];

const OUTPUT_FILE = path.join(__dirname, 'AdBlock_Full_List.txt');

/**
 * MODULE: Fetcher
 * @param {string} url - The URL to download
 * @returns {Promise<string>} The raw text content
 */
async function fetchSource(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { timeout: 10000 }, (res) => {
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error(`HTTP ${res.statusCode}`));
            }
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(body));
        }).on('error', reject);
    });
}

/**
 * MODULE: Parser
 * Extracts valid hostnames from raw data, cleaning comments and whitespace.
 * @param {string} data - Raw text from a source
 * @returns {string[]} Array of cleaned hostnames
 */
function parseData(data) {
    return data.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#')) // Remove comments
        .map(line => {
            const parts = line.split(/\s+/);
            // Handle both "0.0.0.0 domain.com" and "domain.com" formats
            return parts.length > 1 ? parts[1] : parts[0];
        })
        .filter(entry => entry && entry.includes('.') && !entry.includes('://')); // Basic domain validation
}

/**
 * MAIN EXECUTION LOOP
 */
async function runEngine() {
    console.log(`🚀 Starting Modular Merge Engine at ${new Date().toLocaleString()}`);
    const MasterSet = new Set();
    let totalStats = { success: 0, failed: 0 };

    for (const source of SOURCES) {
        try {
            process.stdout.write(`📥 Fetching ${source.name}... `);
            const raw = await fetchSource(source.url);
            const cleaned = parseData(raw);
            
            cleaned.forEach(item => MasterSet.add(item));
            console.log(`Done! (+${cleaned.length} items)`);
            totalStats.success++;
        } catch (err) {
            console.log(`❌ FAILED: ${err.message}`);
            totalStats.failed++;
        }
    }

    // Sort alphabetically for clean Git diffs
    const sortedResult = Array.from(MasterSet).sort();
    
    // Header for the output file
    const header = `# AdBlock Full List
# Generated: ${new Date().toISOString()}
# Total Unique Entries: ${MasterSet.size}
# Sources Processed: ${totalStats.success}/${SOURCES.length}
# ------------------------------------------------------------\n`;

    fs.writeFileSync(OUTPUT_FILE, header + sortedResult.join('\n') + '\n');

    console.log(`\n✅ MERGE COMPLETE`);
    console.log(`📊 Total Unique Domains: ${MasterSet.size}`);
    console.log(`📂 Output saved to: ${OUTPUT_FILE}`);
}

runEngine();
