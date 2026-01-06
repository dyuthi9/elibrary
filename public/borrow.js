document.addEventListener("DOMContentLoaded", function () {
    fetch("http://localhost:4040/borrowed-books")
        .then(res => res.json())
        .then(books => displayBorrowedBooks(books))
        .catch(err => console.error("❌ Error fetching borrowed books:", err));
});
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response1 = await fetch("/user-borrow-requests"); // ✅ Fetch user's borrow requests
        const requestedBooks = await response1.json();

        const response2 = await fetch("/borrowed-books"); // ✅ Fetch user's borrowed books
        const borrowedBooks = await response2.json();

        displayRequestedBooks(requestedBooks);
        displayBorrowedBooks(borrowedBooks);
    } catch (err) {
        console.error("❌ Error fetching data:", err);
    }
});

// ✅ Display requested books of logged-in user
function displayRequestedBooks(requests) {
    const container = document.getElementById("requested-books-container");
    container.innerHTML = "";

    if (requests.length === 0) {
        container.innerHTML = "<p>No requested books.</p>";
        return;
    }

    requests.forEach(request => {
        const div = document.createElement("div");
        div.innerHTML = `<p><strong>${request.bookId.name}</strong> - Status: ${request.status}</p>`;
        container.appendChild(div);
    });
}

function displayBorrowedBooks(borrows) {
    const container = document.getElementById("borrowed-books-container");
    container.innerHTML = "";

    if (borrows.length === 0) {
        container.innerHTML = "<p>No borrowed books.</p>";
        return;
    }

    borrows.forEach(borrow => {
        const borrowDate = new Date(borrow.borrowDate);
        const returnDate = new Date(borrow.returnDate);
        const returnedDate=null;
        const div = document.createElement("div");
        div.innerHTML = `
            <p><strong>${borrow.bookId.name}</strong> - Borrowed on ${borrowDate.toLocaleDateString()} - Return by ${returnDate.toLocaleDateString()}</p>
        `;
        container.appendChild(div);
    });
}

// // ✅ Display borrowed books with return date
// function displayBorrowedBooks(books) {
//     const container = document.getElementById("borrowed-books-container");
//     container.innerHTML = "";

//     if (books.length === 0) {
//         container.innerHTML = "<p>No books borrowed yet.</p>";
//         return;
//     }

//     books.forEach(book => {
//         const borrowDate = new Date(book.borrowDate);
//         const returnDate = new Date(borrowDate);
//         returnDate.setMonth(returnDate.getMonth() + 1); // Add 1 month to borrow date

//         const div = document.createElement("div");
//         div.innerHTML = `
//             <p>
//                 <strong>${book.bookId.name}</strong> by ${book.bookId.author} <br>
//                 - Borrowed on ${borrowDate.toLocaleDateString()} <br>
//                 - <strong>Return by ${returnDate.toLocaleDateString()}</strong>
//             </p><button type="submit" id="return"> Return</button>`;
//         container.appendChild(div);
//     });
// }
// document.addEventListener("DOMContentLoaded", function () {
//     fetch("/borrowed-books")
//         .then(res => res.json())
//         .then(books => displayBorrowedBooks(books))
//         .catch(err => console.error("❌ Error fetching borrowed books:", err));
// });

// ✅ Display borrowed books with correct return button states
function displayBorrowedBooks(books) {
    const container = document.getElementById("borrowed-books-container");
    container.innerHTML = "";

    if (books.length === 0) {
        container.innerHTML = "<p>No books borrowed yet.</p>";
        return;
    }

    books.forEach(book => {
        const borrowDate = new Date(book.borrowDate);
        const returnDate = new Date(book.returnDate);
        const today = new Date();
        
        let fine = 0;
        if (today > returnDate) {
            const daysLate = Math.floor((today - returnDate) / (1000 * 60 * 60 * 24));
            fine = daysLate * 5; // ₹5 per day fine
        }

        const buttonText = book.returnApproved ? "Accepted ✅" : 
                           book.returnRequested ? "Return Requested" : "Return";

        const buttonColor = book.returnApproved ? "green" : book.returnRequested ? "orange" : "blue";

        const div = document.createElement("div");
        div.innerHTML = `
            <p>
                <strong>${book.bookId.name}</strong> by ${book.bookId.author} <br>
                - Borrowed on ${borrowDate.toLocaleDateString()} <br>
                - <strong>Return by ${returnDate.toLocaleDateString()}</strong> <br>
                - Fine: ₹${fine}
            </p>
            <button id="return-btn-${book._id}" style="background-color: ${buttonColor};" 
                onclick="requestReturn('${book._id}')" 
                ${book.returnApproved ? 'disabled' : ''}>
                ${buttonText}
            </button>
        `;
        container.appendChild(div);
    });
}

// ✅ Send Return Request and update button text dynamically
async function requestReturn(borrowId) {
    await fetch("/request-return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ borrowId })
    });

    // Change button to "Return Requested" without reloading
    const button = document.getElementById(`return-btn-${borrowId}`);
    
    if (button) {

        button.innerText = "Return Requested";
        button.style.backgroundColor = "orange";
        button.disabled = true;
    }
}
