import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_pharmacie.settings')
django.setup()

from django.test.client import Client

def run_test():
    client = Client()
    
    # 1. Start Client Registration
    print("--- Step 1: Requesting Registration ---")
    res = client.post('/api/register/client/', {
        'nom': 'Test',
        'prenom': 'User',
        'username': 'testemailuser',
        'email': 'sidiboukhari9@gmail.com',
        'password': 'password123'
    }, content_type='application/json')
    
    print(f"Status Code: {res.status_code}")
    try:
        print(f"Response: {res.json()}")
    except:
        print(f"Raw Response: {res.content}")
        
    if res.status_code == 200:
        # 2. Extract OTP from DB (to simulate email receipt)
        print("\n--- Step 2: Extracting OTP ---")
        from api.models import PendingRegistration
        try:
            pending = PendingRegistration.objects.get(email='sidiboukhari9@gmail.com')
            print(f"Found PendingRegistration for {pending.email} with OTP: {pending.otp}")
            
            # 3. Verify OTP
            print("\n--- Step 3: Verifying OTP ---")
            res2 = client.post('/api/register/verify-otp/', {
                'email': 'sidiboukhari9@gmail.com',
                'otp': pending.otp
            }, content_type='application/json')
            
            print(f"Status Code: {res2.status_code}")
            try:
                print(f"Response: {res2.json()}")
            except:
                print(f"Raw Response: {res2.content}")
                
        except PendingRegistration.DoesNotExist:
            print("ERROR: PendingRegistration record not found after successful registration call.")
    else:
        print("Registration request failed.")

if __name__ == '__main__':
    try:
        from api.models import User
        # Clean up existing test user if present
        User.objects.filter(email='sidiboukhari9@gmail.com').delete()
        from api.models import PendingRegistration
        PendingRegistration.objects.filter(email='sidiboukhari9@gmail.com').delete()
    except:
        pass
    
    run_test()
