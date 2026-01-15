import requests
import json

FUNCTION_URL = "https://ymttaaebrqcfrgipqwvy.supabase.co/functions/v1/analyze-invitation"

html_sample = """
<!DOCTYPE html>
<html>
<head><title>Test Invite</title></head>
<body>
    <div id="convite">
        <h1>Laysa 15 Anos</h1>
        <p>Venha celebrar comigo!</p>
        <p>Dia 20/10/2025 às 20:00</p>
        <p>Local: Salão de Festas Crystal</p>
    </div>
</body>
</html>
"""

payload = {
    "htmlContent": html_sample
}

try:
    print(f"Testing Edge Function at {FUNCTION_URL}...")
    response = requests.post(FUNCTION_URL, headers={"Content-Type": "application/json"}, json=payload, timeout=30)
    
    print(f"Status Code: {response.status_code}")
    try:
        data = response.json()
        print("Response JSON:")
        print(json.dumps(data, indent=2))
    except:
        print("Response Text (Not JSON):")
        print(response.text)

except Exception as e:
    print(f"EXCEPTION: {e}")
