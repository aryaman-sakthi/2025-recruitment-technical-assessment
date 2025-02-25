from dataclasses import dataclass
from typing import List, Dict, Union
from flask import Flask, request, jsonify
import re

# ==== Type Definitions, feel free to add or modify ===========================
@dataclass
class CookbookEntry:
	name: str

@dataclass
class RequiredItem():
	name: str
	quantity: int

@dataclass
class Recipe(CookbookEntry):
	required_items: List[RequiredItem]

@dataclass
class Ingredient(CookbookEntry):
	cook_time: int


# =============================================================================
# ==== HTTP Endpoint Stubs ====================================================
# =============================================================================
app = Flask(__name__)

# Store your recipes here!
cookbook = None

# Task 1 helper (don't touch)
@app.route("/parse", methods=['POST'])
def parse():
	data = request.get_json()
	recipe_name = data.get('input', '')
	parsed_name = parse_handwriting(recipe_name)
	if parsed_name is None:
		return 'Invalid recipe name', 400
	return jsonify({'msg': parsed_name}), 200

# [TASK 1] ====================================================================
# Takes in a recipeName and returns it in a form that 
def parse_handwriting(recipeName: str) -> Union[str | None]:
    # Return none if there is no recipe
	if len(recipeName) == 0:
		return None
    
	# Replace - and _ with whitespace 
	recipeName = re.sub(r'[-_]+', ' ', recipeName)
 
	# Discriminate against non-letter and non-space characters
	recipeName = re.sub(r'[^a-zA-Z ]', '', recipeName)	
 
	# Introduce Capitalizm to the words
	recipeName = recipeName.lower()
	recipeName = recipeName.title()
 
	# Squash the whitespaces 
	recipeName = ' '.join(recipeName.split())
 
	return recipeName


# [TASK 2] ====================================================================
# Endpoint that adds a CookbookEntry to your magical cookbook
@app.route('/entry', methods=['POST'])
def create_entry():
	# Buy a cook book if it doesnt exist
	global cookbook
	if cookbook is None: 
		cookbook = []
  
	entry = request.get_json()
	# Invalid entry
	if not isValid_entry(entry, cookbook):
		return jsonify({'msg': 'Invalid entry'}), 400 

	# Add to cook book if the entry was not invalid
	cookbook.append(entry)
	return {}, 200

# Function to check if the entry is valid
def isValid_entry(entry, cookbook):
	# Validate tyep
	entry_type = entry.get("type")
	if entry_type not in {"recipe", "ingredient"}: return False
 
	# Validate name
	entry_name = entry.get("name")
	if not isinstance(entry_name, str) or not entry_name.strip(): return False
 
	# Make sure that entry names are unique
	if any(entry["name"] == entry_name for entry in cookbook): return False
	
	# Process teh Recipe
	if entry_type == "recipe":
		required_items = entry.get("requiredItems",[])
		if not isinstance(required_items, list): return False
  
		# Check if there are duplicate items
		seen_items = set()
		for item in required_items:
			item_name = item.get("name")
			quantity = item.get("quantity")
   
			# Validate item stats
			if not isinstance(item_name, str) or not item_name.strip(): return False
			if not isinstance(quantity, int) or quantity <= 0: return False
			
			if item_name in seen_items: return False
			print(seen_items)
			# If all looks good then See the item
			seen_items.add(item_name)

	# Process the Ingredient
	elif entry_type == "ingredient":
		cook_time = entry.get("cookTime")
		
		# Validate cook time
		if not isinstance(cook_time, int) or cook_time < 0: return False   
		print("success")
  
	# Redundant else statement but why not be extra careful
	else: return False

	# Everything checks out
	return True


# [TASK 3] ====================================================================
# Endpoint that returns a summary of a recipe that corresponds to a query name
@app.route('/summary', methods=['GET'])
def summary():
	name = request.args.get('name')
	if not exists_recipe(name):
		return 'Recipe Doesn\'t Exist', 400

	# Initialize summary
	summary = {
		"name" : name,
		"cookTime": 0,
		"requiredItems": []
	}
 
	if not summarize_recipe(name, summary):
		return 'What is this recipe brother', 400

	return jsonify(summary), 200

# Function to check if the given name corresponds to a recipe stored in the cookbook
def exists_recipe(name: str) -> bool:
    return any(entry['name'] == name and entry['type'] == 'recipe' for entry in cookbook)

# Function to recursively generate a summary of requried ingredients and calculate the total cook time
def summarize_recipe(name: str, summary: dict) -> bool:
    # Find the recipe in the cookbook with the specified name
    cur_recipe = next((entry for entry in cookbook if entry['name'] == name), None)
    
    # Recipe not found or missing requiredItems key
    if not cur_recipe or 'requiredItems' not in cur_recipe:
        return False
    
    # Iterate through the required items
    for item in cur_recipe['requiredItems']:
        # Check if the required item exists in the cookbook
        cur_item = next((entry for entry in cookbook if entry['name'] == item['name']), None)
        
        # Item not found or missing cookTime key
        if not cur_item or 'cookTime' not in cur_item:
            return False
        
        # If the item is a recipe, recursively get its requirements
        if cur_item['type'] == 'recipe':
            result = summarize_recipe(cur_item['name'], summary)
            
            if not result: 
                return False
        
        # Accumulate the ingredients
        else: 
            existing_entry = next((entry for entry in summary['requiredItems'] if entry['name'] == item['name']), None)
            
            # Entry not in summary
            if not existing_entry: 
                summary['requiredItems'].append(item)
            # If ingredient exists, increment quantity
            else:
                existing_entry['quantity'] += item['quantity']
        
        # Add the cook time to total cook time
        summary['cookTime'] += cur_item['cookTime']
    
    return True
 
# =============================================================================
# ==== DO NOT TOUCH ===========================================================
# =============================================================================

if __name__ == '__main__':
	app.run(debug=True, port=8080)
