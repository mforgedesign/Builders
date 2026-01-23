"""
Upload blank.jpg to Supabase Storage
"""
import requests
import base64
import os

# Supabase config
SUPABASE_URL = 'https://ymttaaebrqcfrgipqwvy.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltdHRhYWVicnFjZnJnaXBxd3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjM0MzAsImV4cCI6MjA4MjY5OTQzMH0.il4DFa2WDfwnqgsj5i5Ny0SklMZz1sta_eZisctuLYs'

# Read blank.jpg
blank_path = r'G:\Meu Drive\Convites Interativos Builder\AutoBuilder v4\blank.jpg'
with open(blank_path, 'rb') as f:
    file_data = f.read()

print(f"File size: {len(file_data)} bytes")

# Upload to Storage
url = f"{SUPABASE_URL}/storage/v1/object/invitation-assets/system/blank.jpg"
headers = {
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'apikey': SUPABASE_KEY,
    'Content-Type': 'image/jpeg',
    'x-upsert': 'true'  # Overwrite if exists
}

response = requests.post(url, headers=headers, data=file_data)
print(f"Status: {response.status_code}")
print(f"Response: {response.text}")

if response.status_code in [200, 201]:
    public_url = f"{SUPABASE_URL}/storage/v1/object/public/invitation-assets/system/blank.jpg"
    print(f"\n✅ Upload successful!")
    print(f"Public URL: {public_url}")
else:
    print(f"\n❌ Upload failed")
