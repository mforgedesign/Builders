import requests
import json

API_KEY = "AIzaSyCsvq9se8VN2nBhCXzDWf0bxadhFjz01Ho"
URL = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"

try:
    response = requests.get(URL)
    data = response.json()
    
    if "models" in data:
        print("Available Models:")
        for m in data["models"]:
            print(m["name"])
    else:
        print("No models found or error structure.")
        print(data)

except Exception as e:
    print(f"Error: {e}")
