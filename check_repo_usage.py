import requests
import os
import json

# Configuration
REPO_OWNER = "mforgedesign"
REPO_NAME = "Convites"
BRANCH = "recuperaçãohoje"
API_BASE = "https://api.github.com"
TOKEN = os.environ.get("GITHUB_TOKEN") # Will need to ask user for token or use one if available

print(f"📊 Analisando uso de disco do repositório: {REPO_OWNER}/{REPO_NAME} ({BRANCH})")
print("=" * 60)

def get_headers():
    headers = {
        "Accept": "application/vnd.github.v3+json"
    }
    if TOKEN:
        headers["Authorization"] = f"token {TOKEN}"
    return headers

def format_bytes(size):
    power = 2**10
    n = 0
    power_labels = {0 : '', 1: 'KB', 2: 'MB', 3: 'GB', 4: 'TB'}
    while size > power:
        size /= power
        n += 1
    return f"{size:.2f} {power_labels[n]}"

try:
    # 1. Get HEAD SHA
    print("1️⃣ Obtendo referência do branch...")
    ref_url = f"{API_BASE}/repos/{REPO_OWNER}/{REPO_NAME}/git/refs/heads/{BRANCH}"
    ref_res = requests.get(ref_url, headers=get_headers())
    
    if ref_res.status_code == 404:
        print(f"❌ Branch '{BRANCH}' não encontrado.")
        exit(1)
    
    ref_data = ref_res.json()
    sha = ref_data['object']['sha']
    print(f"   SHA: {sha[:7]}")

    # 2. Get Recursive Tree
    print("\n2️⃣ Baixando árvore de arquivos (pode demorar)...")
    tree_url = f"{API_BASE}/repos/{REPO_OWNER}/{REPO_NAME}/git/trees/{sha}?recursive=1"
    tree_res = requests.get(tree_url, headers=get_headers())
    
    if tree_res.status_code != 200:
        print(f"❌ Erro ao obter árvore: {tree_res.status_code}")
        print(tree_res.text)
        exit(1)
        
    tree_data = tree_res.json()
    
    # 3. Analyze Sizes
    print("\n3️⃣ Calculando tamanhos...")
    folder_sizes = {}
    total_size = 0
    file_count = 0
    
    if tree_data.get('truncated'):
        print("⚠️  AVISO: A árvore retornada está truncada! O repositório é muito grande.")
        
    print(f"   Total items in tree: {len(tree_data.get('tree', []))}")
    debug_count = 0

    for item in tree_data.get('tree', []):
        if item['type'] == 'blob':
            size = item.get('size', 0)
            path = item['path']
            
            # Debug: Print first few paths
            if debug_count < 10:
                print(f"   [Sample Path]: {path}")
                debug_count += 1

            total_size += size
            file_count += 1
            
            # Group by top-level folder
            parts = path.split('/')
            if len(parts) > 1:
                root_folder = parts[0]
                # If it's inside 'convites' folder, maybe we want to group by subdirectory?
                # But seeing the debug output, most are at root. 
                # Let's just group by the top-level directory.
                folder_sizes[root_folder] = folder_sizes.get(root_folder, 0) + size
            else:
                 folder_sizes['(Root Files)'] = folder_sizes.get('(Root Files)', 0) + size

    # 4. Report
    print("\n" + "=" * 60)
    print("📁 RELATÓRIO DE USO POR CONVITE (SLUG)")
    print("=" * 60)
    print(f"{'SLUG':<40} | {'TAMANHO':<15}")
    print("-" * 60)
    
    sorted_folders = sorted(folder_sizes.items(), key=lambda x: x[1], reverse=True)
    
    for slug, size in sorted_folders:
        print(f"{slug:<40} | {format_bytes(size):<15}")
        
    print("-" * 60)
    print(f"TOTAL: {format_bytes(total_size)} ({file_count} arquivos)")
    print("=" * 60)

except Exception as e:
    print(f"\n❌ Erro crítico: {e}")
