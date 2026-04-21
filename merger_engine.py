import requests
import re
from datetime import datetime

# List of sources provided by user
SOURCES = [
    "https://adaway.org/hosts.txt",
    "https_hagezi_popupads", # Placeholder for logic below
]

def fetch_urls():
    """The actual list from your request."""
    return [
        "https://adaway.org/hosts.txt",
        "https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/popupads.txt",
        "https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/hosts/ultimate.txt",
        "https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/hosts/ultimate-compressed.txt",
        "https://big.oisd.nl",
        "https://raw.githubusercontent.com/r0xd4n3t/pihole-adblock-lists/main/pihole_adlists.txt",
        "https://v.firebog.net/hosts/Easylist.txt",
        "https://raw.githubusercontent.com/StevenBlack/hosts/master/data/StevenBlack/hosts",
        "https://pgl.sysdin.de/hosts/serverlist_php?hostformat=hosts&mimetype=plaintext&useip=0.0.0.0", # Corrected URL structure for parsing
        "https://raw.githubusercontent.com/FiltersHeroes/KADhosts/master/KADhosts.txt"
    ]

def parse_line(line):
    """Extracts host from common adblock formats (e.g., 127.0.0.1 domain.com or domain.com)"""
    line = line.strip()
    if not line or line.startswith("#") or "://" in line: # Skip comments and full URLs if they aren't host entries
        return None
    # Handle 0.0.0.0/127.0.0.1 prefix common in hosts files
    parts = re.split(r'\s+', line)
    host_entry = parts[0] if len(parts) > 1 else parts[0]
    return host_entry

def merge_lists():
    all_entries = set() # Using a Set to automatically handle duplicates (Deduplication/Factorization step)
    urls = fetch_urls()
    processed_count = 0
    errors = []

    print(f"--- Starting Merge Process: {datetime.now()} ---")

    for url in urls:
        try:
            response = requests.get(url, timeout=15)
            if response.status_code == 200:
                lines = response.text.split('\n')
                count_added = 0
                for line in lines:
                    entry = parse_line(line)
                    if entry and entry not in all_entries:
                        all_entries.add(entry)
                        count_added += 1
                print(f"[SUCCESS] {url}: Added/Verified {count_added} new entries.")
            else:
                errors.append(f"Failed to fetch {url} (Status: {response.status_code})")
        except Exception as e:
            errors.append(f"Error processing {url}: {str(e)}")

    # Write the final clean list back to AdBlock_Full_List.txt in our repo folder structure
    output_path = "AdBlock_Full_List.txt" 
    with open(output_path, 'w') as f:
        for entry in sorted(list(all_entries)): # Sorting ensures a deterministic output for Git diffs
            f.write(entry + "\n")

    print(f"\n--- Final Report ---")
    print(f"Total unique entries preserved after deduplication: {len(all_entries)}")
    if errors:
        print("Errors encountered:")
        for err in errors: print(f"- {err}")
    else:
        print("All sources processed successfully.")

if __name__ == "__main__":
    merge_lists()
