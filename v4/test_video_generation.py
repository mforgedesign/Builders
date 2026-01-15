"""
Test the generate-video Edge Function manually.
"""
import requests
import json
import base64

SUPABASE_URL = 'https://ymttaaebrqcfrgipqwvy.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltdHRhYWVicnFjZnJnaXBxd3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMjM0MzAsImV4cCI6MjA4MjY5OTQzMH0.il4DFa2WDfwnqgsj5i5Ny0SklMZz1sta_eZisctuLYs'

# Test image URL (using a publicly accessible image for testing)
# The Supabase Storage images may have download issues with fal.ai
TEST_IMAGE_URL = 'https://images.unsplash.com/photo-1516997121675-4c2d1684aa3e?w=720&h=1280&fit=crop'

# Alternative: use local image encoded as base64
# with open(r'test_image.jpg', 'rb') as f:
#     TEST_IMAGE_URL = 'data:image/jpeg;base64,' + base64.b64encode(f.read()).decode()

def test_generate_video():
    """Test the generate-video Edge Function."""
    
    url = f"{SUPABASE_URL}/functions/v1/generate-video"
    
    headers = {
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json'
    }
    
    payload = {
        "source_image_url": TEST_IMAGE_URL,
        "prompt": "The animation begins with a focus on the closed envelope. The wax seal gracefully detaches and falls, the envelope's flap uplifts slowly. Glittering sparkles and smoke emerge, expanding to fill the scene. The brilliance transitions to a blinding white screen.",
        "model": "hailuo-02",
        "type": "opening"
    }
    
    print(f"Testing generate-video endpoint...")
    print(f"URL: {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    print("-" * 50)
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=300)
        print(f"Status: {response.status_code}")
        
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2)}")
        
        if response.status_code == 200 and result.get('success'):
            video_url = result.get('video_url') or result.get('data', {}).get('video', {}).get('url')
            print(f"\n✅ SUCCESS!")
            print(f"Video URL: {video_url}")
        else:
            print(f"\n❌ FAILED")
            print(f"Error: {result.get('error', 'Unknown error')}")
            
    except requests.exceptions.Timeout:
        print("⏱️ Request timed out (this is expected for video generation, it can take 2-5 minutes)")
    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    test_generate_video()
