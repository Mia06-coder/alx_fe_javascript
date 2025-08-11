const QUOTES_KEY = "quotes";
const LAST_VIEWED_QUOTE_KEY = "lastViewedQuote";

// Default quotes to load if nothing is in localStorage
const defaultQuotes = [
  {
    text: "The best way to get started is to quit talking and begin doing.",
    category: "Motivation",
  },
  {
    text: "Don't let yesterday take up too much of today.",
    category: "Inspiration",
  },
  {
    text: "It's not whether you get knocked down, it's whether you get up.",
    category: "Resilience",
  },
];

// Load quotes from localStorage or return default quotes
function loadQuotes() {
  const stored = localStorage.getItem(QUOTES_KEY);
  try {
    return stored ? JSON.parse(stored) : [...defaultQuotes];
  } catch (e) {
    console.error("Failed to parse quotes from localStorage:", e);
    return [...defaultQuotes];
  }
}

// Save quotes to localStorage
function saveQuotes(quotes) {
  try {
    localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));
  } catch (e) {
    console.error("Failed to save quotes to localStorage:", e);
  }
}

// Save last viewed quote to sessionStorage
function saveLastViewedQuote(quote) {
  try {
    sessionStorage.setItem(LAST_VIEWED_QUOTE_KEY, JSON.stringify(quote));
  } catch (e) {
    console.error("Failed to save last viewed quote to sessionStorage:", e);
  }
}

// Load last viewed quote from sessionStorage
function loadLastViewedQuote() {
  const stored = sessionStorage.getItem(LAST_VIEWED_QUOTE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to parse last viewed quote from sessionStorage:", e);
    return null;
  }
}

// Display a quote object in the quoteDisplay element
function displayQuote(quote) {
  const quoteContainer = document.getElementById("quoteDisplay");
  if (!quoteContainer) {
    console.error("Quote display container not found.");
    return;
  }
  if (!quote) {
    quoteContainer.textContent = "No quote available.";
    return;
  }
  quoteContainer.textContent = `"${quote.text}" (${quote.category})`;
  saveLastViewedQuote(quote); // Save to sessionStorage whenever displayed
}

// Show a random quote from quotes array and save to sessionStorage
function showRandomQuote(quotes) {
  if (quotes.length === 0) {
    displayQuote(null);
    return;
  }

  const randomIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[randomIndex];
  displayQuote(quote);
}

// Create the form to add a new quote
function createAddQuoteForm(quotes) {
  const formContainer = document.getElementById("form-container");
  if (!formContainer) {
    console.error("Form container element not found.");
    return;
  }

  // Clear previous form content to avoid duplication
  formContainer.innerHTML = "";

  // Create form element
  const form = document.createElement("form");

  // Create input for quote text
  const textInput = document.createElement("input");
  textInput.id = "newQuoteText";
  textInput.type = "text";
  textInput.placeholder = "Enter a new quote";
  textInput.required = true;

  // Create input for quote category
  const categoryInput = document.createElement("input");
  categoryInput.id = "newQuoteCategory";
  categoryInput.type = "text";
  categoryInput.placeholder = "Enter quote category";
  categoryInput.required = true;

  // Create submit button
  const addButton = document.createElement("button");
  addButton.type = "submit";
  addButton.textContent = "Add Quote";

  // Append inputs and button to form
  form.appendChild(textInput);
  form.appendChild(categoryInput);
  form.appendChild(addButton);

  // Handle form submission
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const newQuote = {
      text: textInput.value.trim(),
      category: categoryInput.value.trim(),
    };

    // Validate inputs are not empty
    if (!newQuote.text || !newQuote.category) {
      alert("Please provide both quote text and category.");
      return;
    }

    addQuote(quotes, newQuote);
    form.reset();
  });

  formContainer.appendChild(form);
}

// Add a new quote to the array, save it to localStorage, and update display
function addQuote(quotes, quote) {
  // Simple validation to avoid adding incomplete quotes
  if (
    typeof quote.text !== "string" ||
    quote.text === "" ||
    typeof quote.category !== "string" ||
    quote.category === ""
  ) {
    console.error(
      "Invalid quote. Text and category must be non-empty strings."
    );
    return;
  }

  quotes.push(quote);
  alert("Quote added successfully!");
  saveQuotes(quotes);
}

// Export quotes to JSON file
function exportQuotesToJSON(quotes) {
  if (!quotes || quotes.length === 0) {
    alert("No quotes to export.");
    return;
  }

  const blob = new Blob([JSON.stringify(quotes, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

// Import quotes from a selected JSON file
function importFromJsonFile(event, quotes) {
  const file = event.target.files[0];
  if (!file) {
    alert("No file selected.");
    return;
  }

  const fileReader = new FileReader();

  fileReader.onload = function (e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);

      // Validate the imported content is an array of valid quote objects
      if (!Array.isArray(importedQuotes)) {
        throw new Error("JSON is not an array.");
      }

      const validQuotes = importedQuotes.filter(
        (q) =>
          q &&
          typeof q.text === "string" &&
          q.text.trim() !== "" &&
          typeof q.category === "string" &&
          q.category.trim() !== ""
      );

      if (validQuotes.length === 0) {
        alert("No valid quotes found in the imported file.");
        return;
      }

      // Append valid quotes to the existing quotes array
      quotes.push(...validQuotes);

      // Save updated quotes to localStorage
      saveQuotes(quotes);

      // Update the UI (e.g., refresh displayed quote)
      showRandomQuote(quotes);

      alert(`Successfully imported ${validQuotes.length} quotes!`);
    } catch (error) {
      alert("Failed to import quotes: " + error.message);
      console.error("Import error:", error);
    } finally {
      // Clear the file input so user can import again if needed
      event.target.value = "";
    }
  };

  fileReader.onerror = () => {
    alert("Error reading file");
    event.target.value = "";
  };

  fileReader.readAsText(file);
}

// Initial setup on DOM load
document.addEventListener("DOMContentLoaded", function () {
  // Load quotes from localStorage or defaults
  const quotes = loadQuotes();

  // Ensure quote display container exists
  let quoteContainer = document.getElementById("quoteDisplay");
  if (!quoteContainer) {
    quoteContainer = document.createElement("div");
    quoteContainer.id = "quoteDisplay";
    document.body.appendChild(quoteContainer);
  }

  // Set click listener on button to export quotes
  const exportToJsonBtn = document.getElementById("exportQuotesBtn");
  if (exportToJsonBtn) {
    exportToJsonBtn.addEventListener("click", () => exportQuotesToJSON(quotes));
  } else {
    console.warn("Export quotes button with id 'exportQuotesBtn' not found.");
  }

  // Set onchange listener on input to import quotes
  const importInput = document.getElementById("importFile");
  if (importInput) {
    importInput.addEventListener("change", () =>
      importFromJsonFile(event, quotes)
    );
  } else {
    console.warn("Export quotes button with id 'exportQuotesBtn' not found.");
  }

  // Ensure form container exists
  let formContainer = document.getElementById("form-container");
  if (!formContainer) {
    formContainer = document.createElement("div");
    formContainer.id = "form-container";
    document.body.appendChild(formContainer);
  }

  // Update the quote display (from last viewed or random)
  function updateQuoteDisplay() {
    const lastQuote = loadLastViewedQuote();
    if (lastQuote) {
      displayQuote(lastQuote);
    } else {
      showRandomQuote(quotes);
    }
  }

  // Set click listener on button to show new random quote
  const showQuoteBtn = document.getElementById("newQuote");
  if (showQuoteBtn) {
    showQuoteBtn.addEventListener("click", () => showRandomQuote(quotes));
  } else {
    console.warn("Show quote button with id 'newQuote' not found.");
  }

  // Initially display a random quote
  updateQuoteDisplay();

  // Create add quote form, passing quotes array and update callback
  createAddQuoteForm(quotes);
});
