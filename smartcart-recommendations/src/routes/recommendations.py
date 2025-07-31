import json
import sqlite3
import subprocess
import os
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin

recommendations_bp = Blueprint('recommendations', __name__)

def load_product_list(json_path="products.json"):
    """Load product list from JSON file"""
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        # Return a default product list if file doesn't exist
        return [
            {"name": "Apple iPhone 14", "category": "Electronics"},
            {"name": "Samsung Galaxy S23", "category": "Electronics"},
            {"name": "Nike Air Max", "category": "Footwear"},
            {"name": "Adidas Ultraboost", "category": "Footwear"},
            {"name": "Coca Cola", "category": "Beverages"},
            {"name": "Pepsi", "category": "Beverages"}
        ]

def prompt_llama_for_product_info(user_product, product_list):
    """Use LLaMA to match product and get category"""
    prompt = f"""
You're a smart product assistant.

Given a customer input and a full product catalog, match the exact product name (or closest match), and return:
- The exact name (from the list)
- Its category

Customer input: "{user_product}"

Product catalog:
{json.dumps(product_list, indent=2)}

Respond ONLY in this JSON format:
{{ "matched_name": "<product_name>", "category": "<category>" }}
"""

    try:
        process = subprocess.Popen(
            ["ollama", "run", "llama3"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="replace"
        )

        stdout, stderr = process.communicate(input=prompt)

        if stderr:
            raise RuntimeError(f"LLaMA error: {stderr}")

        start = stdout.find("{")
        end = stdout.rfind("}") + 1
        response_json = stdout[start:end]
        return json.loads(response_json)
    except Exception as e:
        # Fallback: simple string matching if LLaMA fails
        user_product_lower = user_product.lower()
        for product in product_list:
            if user_product_lower in product["name"].lower():
                return {
                    "matched_name": product["name"],
                    "category": product["category"]
                }
        # If no match found, return the first product
        if product_list:
            return {
                "matched_name": product_list[0]["name"],
                "category": product_list[0]["category"]
            }
        return {"matched_name": user_product, "category": "Unknown"}

def get_related_products(category, exclude_name, db_path="product_inventory.db"):
    """Get related products from SQLite database"""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT name, category, stock, price FROM products
            WHERE category = ? AND name != ?
            LIMIT 5
        """, (category, exclude_name))

        rows = cursor.fetchall()
        conn.close()

        return [{
            "name": row[0],
            "category": row[1],
            "stock": row[2],
            "price": row[3]
        } for row in rows]
    except Exception as e:
        # Fallback: return dummy related products
        return [
            {"name": f"Related Product 1 for {category}", "category": category, "stock": 10, "price": 299},
            {"name": f"Related Product 2 for {category}", "category": category, "stock": 5, "price": 399},
            {"name": f"Related Product 3 for {category}", "category": category, "stock": 8, "price": 199}
        ]

def get_recommendations_for_cart_items(cart_items):
    """Get recommendations based on cart items"""
    product_list = load_product_list()
    all_recommendations = []
    processed_categories = set()

    for item in cart_items:
        try:
            # Get product info using LLaMA
            matched = prompt_llama_for_product_info(item["name"], product_list)
            matched_name = matched["matched_name"]
            matched_category = matched["category"]

            # Avoid duplicate recommendations for same category
            if matched_category not in processed_categories:
                related_products = get_related_products(matched_category, matched_name)
                all_recommendations.extend(related_products)
                processed_categories.add(matched_category)

        except Exception as e:
            print(f"Error processing item {item['name']}: {e}")
            continue

    # Remove duplicates and limit to 6 recommendations
    unique_recommendations = []
    seen_names = set()
    for rec in all_recommendations:
        if rec["name"] not in seen_names:
            unique_recommendations.append(rec)
            seen_names.add(rec["name"])
        if len(unique_recommendations) >= 6:
            break

    return unique_recommendations

@recommendations_bp.route('/recommendations', methods=['POST'])
@cross_origin()
def get_recommendations():
    """API endpoint to get product recommendations based on cart items"""
    try:
        data = request.get_json()
        
        if not data or 'cartItems' not in data:
            return jsonify({"error": "cartItems is required"}), 400

        cart_items = data['cartItems']
        
        if not cart_items:
            return jsonify({"recommendations": []}), 200

        recommendations = get_recommendations_for_cart_items(cart_items)
        
        return jsonify({
            "success": True,
            "recommendations": recommendations,
            "count": len(recommendations)
        }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "recommendations": []
        }), 500

@recommendations_bp.route('/health', methods=['GET'])
@cross_origin()
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "recommendations"}), 200

