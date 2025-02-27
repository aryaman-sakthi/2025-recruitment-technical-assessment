import express, { Request, Response } from "express";

// ==== Type Definitions, feel free to add or modify ==========================
interface cookbookEntry {
  name: string;
  type: string;
}

interface requiredItem {
  name: string;
  quantity: number;
}

interface recipe extends cookbookEntry {
  requiredItems: requiredItem[];
}

interface ingredient extends cookbookEntry {
  cookTime: number;
}

// =============================================================================
// ==== HTTP Endpoint Stubs ====================================================
// =============================================================================
const app = express();
app.use(express.json());

// Store your recipes here!
let cookbook: any = null;

// Task 1 helper (don't touch)
app.post("/parse", (req:Request, res:Response) => {
  const { input } = req.body;

  const parsed_string = parse_handwriting(input)
  if (parsed_string == null) {
    res.status(400).send("this string is cooked");
    return;
  } 
  res.json({ msg: parsed_string });
  return;
  
});

// [TASK 1] ====================================================================
// Takes in a recipeName and returns it in a form that 
const parse_handwriting = (recipeName: string): string | null => {
  // Return null if there is no recipe
  if (recipeName.length === 0) {
    return null;
  }

  // Replace - and _ with whitespace
  recipeName = recipeName.replace(/[-_]+/g, ' ');

  // Discriminate against non-letter and non-space characters
  recipeName = recipeName.replace(/[^a-zA-Z ]/g, '');

  // Introduce Capitalizm to the words
  recipeName = recipeName.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

  // Trim extra whitespaces
  recipeName = recipeName.trim().replace(/\s+/g, ' ');

  return recipeName
}

// [TASK 2] ====================================================================
// Endpoint that adds a CookbookEntry to your magical cookbook
app.post("/entry", (req:Request, res:Response) => {
  // Buy a cookbook if it doesn’t exist
  if (!cookbook) {
    cookbook = [];
  }

  const entry = req.body;

  // Invalid entry
  if (!isValidEntry(entry, cookbook)) {
    res.status(400).json({ msg: "Invalid entry" });
    return;
  }

  // Add to cookbook if the entry is valid
  cookbook.push(entry);
  res.status(200).send({});
});

// Function to check if the entry is valid
function isValidEntry(entry: any, cookbook: any[]): boolean {
  // Validate type
  const entryType = entry?.type;
  if (entryType !== "recipe" && entryType !== "ingredient") return false;

  // Validate name
  const entryName = entry?.name;
  if (typeof entryName !== "string" || !entryName.trim()) return false;

  // Ensure entry names are unique
  if (cookbook.some(e => e.name === entryName)) return false;

  // Process the Recipe
  if (entryType === "recipe") {
      const requiredItems = entry?.requiredItems ?? [];
      if (!Array.isArray(requiredItems)) return false;

      // Check for duplicate items
      const seenItems = new Set<string>();
      for (const item of requiredItems) {
          const itemName = item?.name;
          const quantity = item?.quantity;

          // Validate item properties
          if (typeof itemName !== "string" || !itemName.trim()) return false;
          if (typeof quantity !== "number" || quantity <= 0) return false;

          if (seenItems.has(itemName)) return false;
          seenItems.add(itemName);
      }
  }
  // Process the Ingredient
  else if (entryType === "ingredient") {
      const cookTime = entry?.cookTime;

      // Validate cook time
      if (typeof cookTime !== "number" || cookTime < 0) return false;
  }

  // Everything checks out
  return true;
}

// [TASK 3] ====================================================================
// Endpoint that returns a summary of a recipe that corresponds to a query name
app.get("/summary", (req:Request, res:Request) => {
  const name = req.query.name as string;

    if (!existsRecipe(name)) {
        res.status(400).send("Recipe Doesn't Exist");
        return;
    }

    // Initialize summary
    const summaryData: any = {
        name: name,
        cookTime: 0,
        requiredItems: [],
    };

    if (!summarizeRecipe(name, summaryData)) {
        res.status(400).send("What is this recipe, brother");
        return;
    }

    res.status(200).json(summaryData);
});

// Function to check if the given name corresponds to a recipe stored in the cookbook
function existsRecipe(name: string): boolean {
  return cookbook.some(entry => entry.name === name && entry.type === "recipe");
}

// Function to recursively generate a summary of required ingredients and calculate the total cook time
function summarizeRecipe(name: string, summary: any): boolean {
  // Find the recipe in the cookbook with the specified name
  const curRecipe = cookbook.find(entry => entry.name === name);

  // Recipe not found or missing requiredItems key
  if (!curRecipe || !curRecipe.requiredItems) {
      return false;
  }

  // Iterate through the required items
  for (const item of curRecipe.requiredItems) {
      // Check if the required item exists in the cookbook
      const curItem = cookbook.find(entry => entry.name === item.name);

      // Item not found or missing cookTime key
      if (!curItem || curItem.cookTime === undefined) {
          return false;
      }

      // If the item is a recipe, recursively get its requirements
      if (curItem.type === "recipe") {
          if (!summarizeRecipe(curItem.name, summary)) {
              return false;
          }
      } 
      // Accumulate the ingredients
      else {
          const existingEntry = summary.requiredItems.find((entry: any) => entry.name === item.name);

          // Entry not in summary
          if (!existingEntry) {
              summary.requiredItems.push({ ...item });
          } 
          // If ingredient exists, increment quantity
          else {
              existingEntry.quantity += item.quantity;
          }
      }

      // Add the cook time to total cook time
      summary.cookTime += curItem.cookTime;
  }

  return true;
}

// =============================================================================
// ==== DO NOT TOUCH ===========================================================
// =============================================================================
const port = 8080;
app.listen(port, () => {
  console.log(`Running on: http://127.0.0.1:8080`);
});
