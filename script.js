document.addEventListener('DOMContentLoaded', () => {
    // Add IDs to body tags in your HTML for this to work
    // e.g., <body id="home-page"> for index.html
    // e.g., <body id="recipe-page"> for recipe.html
    const bodyId = document.body.id;

    if (bodyId === 'home-page') {
        loadHomePageContent();
    } else if (bodyId === 'recipe-page') {
        loadRecipeDetailsPageContent();
    }
});

let allRecipes = []; // To store all recipe data

async function fetchRecipes() {
    if (allRecipes.length > 0) {
        return allRecipes; // Return cached data if already fetched
    }
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        allRecipes = data.recipes;
        return allRecipes;
    } catch (error) {
        console.error("Could not fetch recipes:", error);
        return [];
    }
}

// --- Home Page Logic ---
async function loadHomePageContent() {
    const recipes = await fetchRecipes();
    const itemList = document.querySelector('.item-list');
    const categoryButtons = document.querySelectorAll('.category-btn');

    function displayRecipes(filterCategory = 'all') {
        itemList.innerHTML = ''; // Clear current items

        const filteredRecipes = recipes.filter(recipe => {
            if (filterCategory === 'all') return true;
            if (filterCategory === 'veg') return recipe.category === 'veg';
            if (filterCategory === 'non-veg') return recipe.category === 'non-veg';
            if (filterCategory === 'popular') return recipe.isPopular === true;
            return false;
        });

        if (filteredRecipes.length === 0) {
            itemList.innerHTML = '<p>No recipes found in this category.</p>';
            return;
        }

        filteredRecipes.forEach(recipe => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('food-item');
            itemDiv.setAttribute('data-category', recipe.category);

            itemDiv.innerHTML = `
                <img src="${recipe.image}" alt="${recipe.name}">
                <h3>${recipe.name}</h3>
                <p class="description">${recipe.description}</p>
                <div class="item-actions">
                    <a href="recipe.html?name=${recipe.id}" class="btn view-details">View Recipe</a>
                </div>
            `;
            itemList.appendChild(itemDiv);
        });
    }

    // Initial display
    displayRecipes('all');

    // Add event listeners to category buttons
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const category = button.getAttribute('data-category');
            displayRecipes(category);
        });
    });
}

// --- Recipe Details Page Logic ---
async function loadRecipeDetailsPageContent() {
    const recipes = await fetchRecipes();

    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('name');

    if (!recipeId) {
        document.getElementById('recipe-title').textContent = 'Recipe Not Found';
        return;
    }

    const recipe = recipes.find(r => r.id === recipeId);

    if (recipe) {
        document.getElementById('recipe-page-title').textContent = `Fresco - ${recipe.name}`;
        document.getElementById('recipe-image').src = recipe.image;
        document.getElementById('recipe-image').alt = recipe.name;
        document.getElementById('recipe-title').textContent = recipe.name;
        document.getElementById('recipe-description').textContent = recipe.description;

        const ingredientsContainer = document.getElementById('ingredients-container');
        const personsSelector = document.getElementById('persons');
        const displayPersons = document.getElementById('display-persons');

        function updateIngredients(numPersons) {
            ingredientsContainer.innerHTML = ''; // Clear previous ingredients
            displayPersons.textContent = numPersons;

            recipe.ingredients.forEach(ingredient => {
                const li = document.createElement('li');
                let originalQuantityText = ingredient.quantity_per_person;
                let finalQuantityText = originalQuantityText;

                // --- THIS IS THE CORRECTED LOGIC ---
                if (numPersons > 1 && originalQuantityText) {
                    const parts = originalQuantityText.match(/^(\d+\.?\d*)\s*(.*)/);

                    if (parts && parts[1]) {
                        const baseQuantity = parseFloat(parts[1]);
                        const unitAndDescription = parts[2] || '';
                        const scaledQuantity = baseQuantity * numPersons;

                        const formattedQuantity = Number.isInteger(scaledQuantity)
                            ? scaledQuantity
                            : scaledQuantity.toFixed(1);

                        // **NEW LOGIC ADDED HERE**
                        // If the description contains parentheses, clarify it's a per-serving note.
                        let finalUnitDescription = unitAndDescription;
                        if (unitAndDescription.includes('(')) {
                            finalUnitDescription = unitAndDescription.replace(')', ' per serving)');
                        }

                        finalQuantityText = `${formattedQuantity} ${finalUnitDescription}`;
                    }
                }
                // --- END OF CORRECTION ---

                li.textContent = `${ingredient.name}: ${finalQuantityText || 'As needed'}`;
                ingredientsContainer.appendChild(li);
            });
        }

        // Initial load for 1 person
        updateIngredients(1);

        // Update ingredients when persons selector changes
        personsSelector.addEventListener('change', (event) => {
            updateIngredients(parseInt(event.target.value, 10));
        });

        // "Buy Now" button functionality (placeholder)
        const buyNowBtn = document.querySelector('.buy-now');
        buyNowBtn.addEventListener('click', () => {
            const selectedPersons = document.getElementById('persons').value;
            alert(`Added "${recipe.name}" for ${selectedPersons} person(s) to your cart! (This is a prototype action)`);
        });

    } else {
        // Handle case where recipe is not found
        document.getElementById('recipe-page-title').textContent = 'Fresco - Recipe Not Found';
        document.getElementById('recipe-title').textContent = 'Recipe Not Found';
        document.getElementById('recipe-description').textContent = 'The selected recipe could not be found. Please return to the home page.';
        document.getElementById('recipe-image').src = 'images/placeholder_error.jpg';
        document.querySelector('.recipe-actions').style.display = 'none';
        document.querySelector('.ingredients-list').style.display = 'none';
    }
}