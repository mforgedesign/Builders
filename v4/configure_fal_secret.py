"""
Configure FAL_API_KEY secret in Supabase Edge Functions.
Uses Supabase Management API to set secrets.
"""
import requests
import os

# Supabase Management API requires a service role key or personal access token
# For now, we'll use the Dashboard API method
PROJECT_ID = 'ymttaaebrqcfrgipqwvy'

# The FAL API Key
FAL_API_KEY = '73618b95-f8c7-430d-9817-fce2b036691f:9f9d1d697581e82f3566eb5360697671'

print("To configure the FAL_API_KEY secret in Supabase:")
print("=" * 60)
print(f"1. Go to: https://supabase.com/dashboard/project/{PROJECT_ID}/settings/functions")
print("2. Scroll to 'Edge Function Secrets'")
print("3. Click 'Add new secret'")
print("4. Name: FAL_API_KEY")
print(f"5. Value: {FAL_API_KEY}")
print("6. Click 'Add secret'")
print("=" * 60)
print("\nAlternatively, you can use the Supabase CLI:")
print(f'supabase secrets set FAL_API_KEY="{FAL_API_KEY}" --project-ref {PROJECT_ID}')
