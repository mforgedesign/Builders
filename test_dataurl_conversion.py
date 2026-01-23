"""
Test Edge Function v8 with a data URL to verify the data URL -> Storage conversion
"""
import requests
import json
import base64

# Edge Function URL
EDGE_FUNCTION_URL = "https://ymttaaebrqcfrgipqwvy.supabase.co/functions/v1/generate-video"

# Create a small test data URL (1x1 red pixel PNG)
# This is a valid tiny image that should work for testing
TINY_RED_PIXEL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="

# Test with a public image URL (should work)
PUBLIC_IMAGE_URL = "https://images.unsplash.com/photo-1516997121675-4c2d1684aa3e?w=720&h=1280&fit=crop"

def test_with_data_url():
    print("Testing with DATA URL...")
    print("-" * 50)
    
    payload = {
        "source_image_url": TINY_RED_PIXEL,
        "prompt": "Simple test animation",
        "model": "hailuo-02",
        "type": "opening"
    }
    
    print(f"Sending request to Edge Function...")
    
    try:
        response = requests.post(
            EDGE_FUNCTION_URL,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=180
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:500]}...")
        
    except Exception as e:
        print(f"Error: {e}")

def test_with_public_url():
    print("\nTesting with PUBLIC URL...")
    print("-" * 50)
    
    payload = {
        "source_image_url": PUBLIC_IMAGE_URL,
        "prompt": "Simple test animation",
        "model": "hailuo-02",
        "type": "opening"
    }
    
    print(f"Sending request to Edge Function...")
    
    try:
        response = requests.post(
            EDGE_FUNCTION_URL,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=180
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:500]}...")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # First test with data URL to see if conversion works
    test_with_data_url()
