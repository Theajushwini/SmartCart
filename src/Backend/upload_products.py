import json
import firebase_admin
from firebase_admin import credentials, db

# Step 1: Initialize Firebase Admin
cred = credentials.Certificate("firebase_key.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://smartcart-b7805-default-rtdb.asia-southeast1.firebasedatabase.app'
})

# Step 2: Load products.json
with open("products.json", "r", encoding="utf-8") as f:
    products = json.load(f)

# Step 3: Upload to Firebase under 'products/' node
ref = db.reference("products")
for product in products:
    # Generate a Firebase-safe key from the name
    key = product["name"].lower().replace(" ", "_").replace(".", "").replace("/", "").replace("#", "").replace("$", "").replace("[", "").replace("]", "")
    ref.child(key).set(product)

print("✅ Uploaded all products to Firebase Realtime Database!")
