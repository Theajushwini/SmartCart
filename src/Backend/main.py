from flask import Flask, request, jsonify
from flask_cors import CORS
from suggest_product import (
    load_product_list,
    prompt_llama_for_product_info,
    get_related_products
)
import traceback

app = Flask(__name__)

# ✅ Enable CORS globally
CORS(app)

@app.route('/api/recommendations', methods=['POST'])
def recommend():
    try:
        cart_data = request.get_json()
        print("📦 Received cart items:", cart_data)

        product_list = load_product_list()
        print("✅ Loaded", len(product_list), "products from Firebase")

        all_suggestions = []

        for item in cart_data.get("cartItems", []):
            user_product = item["name"]
            print("🎯 Matching for:", user_product)
            matched = prompt_llama_for_product_info(user_product, product_list)
            print("✅ Matched:", matched)

            related = get_related_products(matched["category"], matched["matched_name"])
            all_suggestions.extend(related)

        # Deduplicate by name
        seen = set()
        unique = []
        for r in all_suggestions:
            if r["name"] not in seen:
                seen.add(r["name"])
                unique.append(r)

        return jsonify({"success": True, "recommendations": unique[:2]})
    except Exception as e:
        print("❌ Error occurred:")
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500

# ✅ Make sure app only runs when called directly
if __name__ == '__main__':
    app.run(port=5000)
