import requests
import json

API_KEY = "AIzaSyCsvq9se8VN2nBhCXzDWf0bxadhFjz01Ho"
URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={API_KEY}"

payload = {
    "contents": [{
        "parts": [{"text": "Hello"}]
    }]
}

try:
    print(f"Testing API Key on {URL}...")
    response = requests.post(URL, headers={"Content-Type": "application/json"}, json=payload, timeout=10)
    
    if response.status_code == 200:
        print("SUCCESS! API Key is valid.")
        print("Response:", response.json())
    else:
        print(f"FAILED. Status: {response.status_code}")
        print("Error:", response.text)

except Exception as e:
    print(f"EXCEPTION: {e}")
