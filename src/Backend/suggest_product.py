import json
import re
import firebase_admin
from firebase_admin import credentials, db
import requests

# ✅ Initialize Firebase
cred = credentials.Certificate("firebase_key.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://smartcart-b7805-default-rtdb.asia-southeast1.firebasedatabase.app'
})


# ✅ Utility to extract only the first valid JSON object from any messy LLaMA output
def extract_first_json(text):
    match = re.search(r'\{.*?\}', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            print("⚠️ Could not decode JSON.")
            raise
    raise RuntimeError("No valid JSON object found in LLaMA output.")


# ✅ Load all products from Firebase database
def load_product_list():
    ref = db.reference("products")
    products = ref.get()
    return [v for v in products.values()] if products else []


# ✅ Talk to LLaMA model via Ollama to get category-based recommendation
def prompt_llama_for_product_info(user_product, product_list):
    prompt = f"""
You're a smart product assistant.

Given a customer input and a full product catalog, find the category of the user product and take another product from the same category in the catalog and not the same product(caution!) and return:

- matched_name (must exactly match name from product list)
- category (must exactly match from product list)

Customer input: "{user_product}"

Product catalog:
{json.dumps(product_list, indent=2)}

Respond ONLY with a single-line JSON in this exact format:
{{"matched_name": "<product_name>", "category": "<category>"}}
Do not add any explanation or text.
"""

    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3",
                "prompt": prompt,
                "stream": False
            }
        )
        data = response.json()
        output = data.get("response", "").strip()

        print("📥 Raw LLaMA Output:")
        print(output)

        return extract_first_json(output)

    except Exception as e:
        print("❌ Ollama API call failed:", e)
        raise RuntimeError("Failed to get a valid response from LLaMA.")


# ✅ Get 2 products from the same category but different name
def get_related_products(category, exclude_name):
    ref = db.reference("products")
    all_products = ref.get()

    suggestions = []
    for key, product in all_products.items():
        if product["category"] == category and product["name"] != exclude_name:
            suggestions.append(product)
            if len(suggestions) == 2:
                break
    return suggestions


# ✅ Combined entry point (use in your backend route)
def get_recommendations(user_product):
    product_list = load_product_list()
    match = prompt_llama_for_product_info(user_product, product_list)
    category = match["category"]
    exclude_name = match["matched_name"]
    return get_related_products(category, exclude_name)
