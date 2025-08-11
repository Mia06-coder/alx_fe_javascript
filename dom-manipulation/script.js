// Array holding quote objects with text and category
const quotes = [
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

// Function to display a random quote in the quoteDisplay element
function displayRandomQuote() {
  const quoteContainer = document.getElementById("quoteDisplay");
  if (!quoteContainer) {
    console.error("Quote display container not found.");
    return;
  }

  if (quotes.length === 0) {
    quoteContainer.textContent = "No quotes available.";
    return;
  }

  const randomIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[randomIndex];

  quoteContainer.textContent = `"${quote.text}" (${quote.category})`;
}

// Function to create the add quote form inside the form-container element
function createAddQuoteForm() {
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

    addQuote(newQuote);
    displayRandomQuote();
    form.reset();
  });

  formContainer.appendChild(form);
}

// Function to add a new quote to the quotes array
function addQuote(quote) {
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
}

// Initial setup: create containers and event listeners on DOM content load
document.addEventListener("DOMContentLoaded", function () {
  // Ensure quote display container exists
  let quoteContainer = document.getElementById("quoteDisplay");
  if (!quoteContainer) {
    quoteContainer = document.createElement("div");
    quoteContainer.id = "quoteDisplay";
    document.body.appendChild(quoteContainer);
  }

  // Ensure form container exists
  let formContainer = document.getElementById("form-container");
  if (!formContainer) {
    formContainer = document.createElement("div");
    formContainer.id = "form-container";
    document.body.appendChild(formContainer);
  }

  // Set up the button to show a new random quote
  const showQuoteBtn = document.getElementById("newQuote");
  if (showQuoteBtn) {
    showQuoteBtn.addEventListener("click", displayRandomQuote);
  } else {
    console.warn("Show quote button with id 'newQuote' not found.");
  }

  // Display a random quote initially and create the add quote form
  displayRandomQuote();
  createAddQuoteForm();
});
