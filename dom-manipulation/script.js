// ========================
// Constants
// ========================
const QUOTES_KEY = "quotes";
const LAST_VIEWED_QUOTE_KEY = "lastViewedQuote";
const LAST_SELECTED_CATEGORY = "lastSelectedCategory";
const SERVER_API_URL = "https://jsonplaceholder.typicode.com/posts";

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

// ========================
// Utilities
// ========================

// Remove duplicate quotes based on text and category
function deduplicateQuotes(quotes) {
  const seen = new Set();

  return quotes.filter((q) => {
    const key = `${q.text}|${q.category}`;

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Sanitize quote text and category
function sanitizeQuote(quote) {
  return {
    text: quote.text.trim(),
    category: quote.category.trim(),
  };
}

// Deduplicate quotes after importing or server sync
function mergeQuotes(existing, incoming) {
  return deduplicateQuotes([...existing, ...incoming.map(sanitizeQuote)]);
}

// ========================
// Storage Helpers
// ========================

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
  try {
    const stored = sessionStorage.getItem(LAST_VIEWED_QUOTE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.error("Failed to parse last viewed quote from sessionStorage:", e);
    return null;
  }
}

// ========================
// UI Functions
// ========================

// Display a quote object in the quoteDisplay element
function displayQuote(quote) {
  const quoteContainer = document.getElementById("quoteDisplay");
  if (!quoteContainer) {
    return console.error("Quote display container not found.");
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
  if (quotes.length === 0) return displayQuote(null);

  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  displayQuote(quote);
}

// Populate the categories dropdown with available categories
function populateCategories(quotes) {
  const categoryFilter = document.getElementById("categoryFilter");
  if (!categoryFilter)
    return console.error("Category filter select element not found");

  const categories = ["all", ...new Set(quotes.map((q) => q.category))];
  categoryFilter.innerHTML = categories
    .map((cat) => `<option value="${cat}">${cat}</option>`)
    .sort()
    .join("");

  // Restore last selected category from localStorage if available
  const lastCategory = localStorage.getItem(LAST_SELECTED_CATEGORY);
  categoryFilter.value =
    lastCategory && categories.includes(lastCategory) ? lastCategory : "all";
}

// Ensure only filtered category is displayed
function filterQuotes(quotes) {
  const selectedCategory =
    document.getElementById("categoryFilter")?.value || "all";
  localStorage.setItem(LAST_SELECTED_CATEGORY, selectedCategory); // Save the filter selection to localStorage

  return selectedCategory === "all"
    ? quotes
    : quotes.filter((q) => q.category === selectedCategory);
}

// ========================
// CRUD & File Import/Export
// ========================

// Add a new quote to the array, save it to localStorage, and update display
async function addQuote(quotes, quote) {
  // Simple validation to avoid adding incomplete quotes
  if (!quote.text || !quote.category) {
    console.error(
      "Invalid quote. Text and category must be non-empty strings."
    );
    return;
  }

  try {
    // Post to simulated server
    const server_res = await postQuotesToServer(quote);

    quotes.push(server_res);
    alert("Quote added successfully (and sent to server)!");
  } catch (error) {
    console.error("Failed to post to server:", error);

    // Still save locally so the app works offline
    quotes.push(quote);
    alert("Quote added locally (server unavailable).");
  }

  saveQuotes(quotes);
  populateCategories(quotes);
}

// Export quotes to JSON file
function exportQuotesToJSON(quotes) {
  if (quotes.length === 0) return alert("No quotes to export.");

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
async function importFromJsonFile(event, quotes) {
  const file = event.target.files[0];
  if (!file) return alert("No file selected.");

  const fileReader = new FileReader();

  fileReader.onload = async (e) => {
    try {
      const importedQuotes = JSON.parse(e.target.result);

      // Validate the imported content is an array of valid quote objects
      if (!Array.isArray(importedQuotes))
        throw new Error("JSON is not an array.");

      const validQuotes = importedQuotes.filter((q) => q?.text && q?.category);

      if (validQuotes.length === 0)
        return alert("No valid quotes found in the imported file.");

      // Post each imported quote to server
      for (const quote of validQuotes) {
        try {
          const serverRes = await postQuotesToServer(quote);
          quotes.push(serverRes);
        } catch (err) {
          console.error("Failed to post imported quote to server:", quote, err);
          // fallback: add locally if server fails
          quotes.push(quote);
        }
      }

      // Remove duplicates after adding all
      const merged = mergeQuotes(quotes, []);
      quotes.length = 0; // clear current array
      quotes.push(...merged);

      // Save updated quotes to localStorage
      saveQuotes(quotes);

      // Update the UI (e.g., refresh displayed quote)
      populateCategories(quotes);
      showRandomQuote(filterQuotes(quotes));

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
    populateCategories(quotes);
    showRandomQuote(filterQuotes(quotes));
    form.reset();
  });

  formContainer.appendChild(form);
}

// ========================
// Server Interaction
// ========================

// Simulate server fetch using JSONPlaceholder
async function fetchQuotesFromServer() {
  try {
    const res = await fetch(SERVER_API_URL);
    if (!res.ok) throw new Error(`Server error: ${res.status}`);

    const data = await res.json();

    // Map server data to match {text, category} structure
    return data.map((item, index) => ({
      text: item.title,
      category: ["Motivation", "Inspiration", "Resilience"][index % 3], // rotate categories
    }));
  } catch (e) {
    console.error(`Error fetching quotes: ${e}`);
    return [];
  }
}

// Simulate posting a new quote to the server
async function postQuotesToServer(quote) {
  const res = await fetch(SERVER_API_URL, {
    method: "POST",
    body: JSON.stringify(quote),
    headers: { "Content-Type": "application/json" },
  });

  return res.json();
}

// Periodically fetch updates every 30 seconds
function syncQuotes(quotes) {
  setInterval(async () => {
    console.log("Checking server for updates...");
    const serverQuotes = await fetchQuotesFromServer();

    if (serverQuotes.length > 0) {
      console.log(
        "Merging server quotes with local quotes (server precedence)..."
      );

      // Merge with server taking precedence
      const merged = mergeWithServerPrecedence(quotes, serverQuotes);
      quotes.length = 0;
      quotes.push(...merged);

      saveQuotes(quotes);
      populateCategories(quotes);
      showRandomQuote(filterQuotes(quotes)); // refresh UI after sync
      console.log("Quotes updated from server with server precedence");
    }
  }, 30000); // every 30s
}

// Give server quotes precedance on merge
function mergeWithServerPrecedence(localQuotes, serverQuotes) {
  const sanitizedLocal = localQuotes.map(sanitizeQuote);
  const sanitizedServer = serverQuotes.map(sanitizeQuote);

  const localMap = new Map(
    sanitizedLocal.map((q) => [`${q.text}|${q.category}`, q])
  );

  // Server overwrites local on matching keys
  sanitizedServer.forEach((sq) => {
    const key = `${sq.text}|${sq.category}`;
    localMap.set(key, sq);
  });

  return deduplicateQuotes(Array.from(localMap.values()));
}

// ========================
// DOM Setup
// ========================

document.addEventListener("DOMContentLoaded", async () => {
  // Load quotes from localStorage or defaults
  let quotes = loadQuotes();

  // Fetch initial quotes from server and merge
  const serverQuotes = await fetchQuotesFromServer();
  if (serverQuotes.length > 0) {
    const merged = mergeWithServerPrecedence(quotes, serverQuotes);
    quotes.length = 0;
    quotes.push(...merged);
    saveQuotes(quotes);
  }

  // Ensure quote display container exists
  if (!document.getElementById("quoteDisplay")) {
    const div = document.createElement("div");
    div.id = "quoteDisplay";
    document.body.appendChild(div);
  }

  // Ensure form container exists
  if (!document.getElementById("form-container")) {
    div = document.createElement("div");
    div.id = "form-container";
    document.body.appendChild(div);
  }

  // Create add quote form, passing quotes array and update callback
  createAddQuoteForm(quotes);

  // Filtering
  populateCategories(quotes);
  let filteredQuotes = filterQuotes(quotes);

  document.getElementById("categoryFilter")?.addEventListener("change", () => {
    filteredQuotes = filterQuotes(quotes);
    showRandomQuote(filteredQuotes);
  });

  // Set click listener on button to show new random quote
  document
    .getElementById("newQuote")
    ?.addEventListener("click", () => showRandomQuote(filteredQuotes));

  // Set click listener on button to export quotes
  document
    .getElementById("exportQuotesBtn")
    ?.addEventListener("click", () => exportQuotesToJSON(quotes));

  // Set onchange listener on input to import quotes
  document
    .getElementById("importFile")
    ?.addEventListener("change", (event) => importFromJsonFile(event, quotes));

  // Update quote display with last viewed or random filtered quote
  displayQuote(
    loadLastViewedQuote() ||
      filteredQuotes[Math.floor(Math.random() * filterQuotes.length)]
  );

  // Start simulated real-time updates
  syncQuotes(quotes);
});
