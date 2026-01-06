document.addEventListener("DOMContentLoaded", () => {
    fetchCategories(); // Load categories when the page loads
});

// ✅ Fetch categories from the backend
function fetchCategories() {
    fetch("http://localhost:4040/categories") // API Endpoint
        .then(response => response.json())
        .then(categories => {
            displayCategories(categories);
        })
        .catch(error => console.error("❌ Error fetching categories:", error));
}

// ✅ Display categories as buttons
function displayCategories(categories) {
    const container = document.getElementById("categories-container");
    container.innerHTML = ""; 
    categories.forEach(category => {
        const button = document.createElement("button");
        button.classList.add("category-btn");
        button.textContent = category;
        button.onclick = () => fetchBooksByCategory(category);
        container.appendChild(button);
    });
}

// ✅ Fetch books based on the selected category
function fetchBooksByCategory(category) {
    fetch(`http://localhost:4040/books/${category}`) 
        .then(response => response.json())
        .then(books => {
            displayBooks(books);
        })
        .catch(error => console.error("❌ Error fetching books:", error));
}
//  Function to Borrow a Book
function borrowBook(bookId) {
    fetch("http://localhost:4040/borrow-request", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        location.reload(); 
    })
    .catch(err => console.error("❌ Error borrowing book:", err));
}

// -----------------------------------------------------------------------------------------------------search
document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get("search");

    if (searchQuery) {
        fetchBooks(searchQuery);
    } else {
        fetchBooks(); 
    }
});

function fetchBooks(query = "") {
    let url = `http://localhost:4040/search-books`;
    if (query) {
        url += `?q=${encodeURIComponent(query)}`;
    }

    fetch(url)
        .then(response => response.json())
        .then(books => displayBooks(books))
        .catch(error => console.error(" Error fetching books:", error));
}
//--------------------------------------------------------------------------------------------------
async function fetchWishlist() {
    const res = await fetch("/api/user-wishlist");
    return res.ok ? await res.json() : [];
  }

  async function displayBooks(books) {
    const container = document.getElementById("books-container");
    container.innerHTML = "";

    const wishlist = await fetchWishlist();

    books.forEach(book => {
      const bookCard = document.createElement("div");
      bookCard.classList.add("book-card");

      const imageUrl = book.image ? `/` + book.image : "default.jpg";
      const isDisabled = book.available === 0 ? "disabled" : "";
      const isWished = wishlist.includes(book._id);

      bookCard.innerHTML = `
        <img src="${imageUrl}" alt="${book.name}" class="book-image">
        <h3>${book.name}
          <span class="wishlist-icon ${isWished ? 'active' : ''}" data-id="${book._id}">&#10084;</span>
        </h3>
        <p>Author: ${book.author}</p>
        <p>Category: ${book.category}</p>
        <p>Available: ${book.available}</p>
        <button class="borrow-btn" onclick="borrowBook('${book._id}')" ${isDisabled}> ${book.available === 0 ? "Not Available" : "Borrow"}
      `;

      container.appendChild(bookCard);

      const heart = bookCard.querySelector(".wishlist-icon");
      heart.addEventListener("click", async () => {
        const bookId = heart.dataset.id;
        const method = heart.classList.contains("active") ? "DELETE" : "POST";

        await fetch("/api/user-wishlist", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookId })
        });

        heart.classList.toggle("active");
      });
    });
  }

  fetchBooks();