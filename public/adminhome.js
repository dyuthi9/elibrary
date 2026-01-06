document.addEventListener("DOMContentLoaded", () => { 
    if (document.getElementById("bookRequestsList")) loadBookRequests();
    if (document.getElementById("returnRequestsList")) loadReturnRequests();
    if (document.getElementById("studentsList")) loadStudentsDetails();
    if (document.getElementById("booksList")) loadBooksDetails();
});


//------------------------------------------------------------------------- ✅ Load Return Requests
async function loadReturnRequests() {
    try {
        const response = await fetch("/return-requests");
        const requests = await response.json();
        displayReturnRequests(requests);
    } catch (error) {
        console.error("❌ Error fetching return requests:", error);
    }
}

//---------------------------------------------------------------------- ✅ Display Return Requests
function displayReturnRequests(requests) {
    const tableBody = document.getElementById("returnRequestsList");
    if (!tableBody) {
        console.error("❌ Error: 'returnRequestsList' element not found.");
        return;
    }

    tableBody.innerHTML = requests.length === 0 
        ? `<tr><td colspan="3">No return requests.</td></tr>` 
        : requests.map(request => `
            <tr>
                <td>${request.username}</td>
                <td>${request.bookId.name}</td>
                <td><button id="approve-btn-${request._id}" onclick="approveReturn('${request._id}')">Accept Return</button></td>
            </tr>
        `).join("");
}

// ✅ Approve Return Request
async function approveReturn(borrowId) {
    try {
        await fetch("/approve-return", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ borrowId })
        });

        const button = document.getElementById(`approve-btn-${borrowId}`);
        if (button) {
            button.innerText = "Accepted ✅";
            button.style.backgroundColor = "green";
            button.disabled = true;
        }
    } catch (error) {
        console.error("❌ Error approving return request:", error);
    }
}

// ✅ Load Student Details
// async function loadStudentsDetails() {
//     try {
//         const response = await fetch("/students");
//         const data = await response.json();
//         const table = document.getElementById("studentsList");
//         if (table) {
//             table.innerHTML = data.map(student => `<tr><td>${student.registerno}</td><td>${student.name}</td><td>${student.email}</td></tr>`).join("");
//         }
//     } catch (error) {
//         console.error("❌ Error fetching student details:", error);
//     }

// }

// ✅ Load Books Details
async function loadBooksDetails() {
    try {
        const response = await fetch("/books");
        const data = await response.json();
        const table = document.getElementById("booksList");
        if (table) {
            table.innerHTML = data.map(book => `<tr><td>${book.title}</td><td>${book.author}</td><td>${book.category}</td><td><img src="${book.cover}" width="50"></td></tr>`).join("");
        }
    } catch (error) {
        console.error("❌ Error fetching book details:", error);
    }
}

// ✅ Logout Function
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        try {
            const response = await fetch("/logout", {
                method: "POST",
                credentials: "include"
            });

            const data = await response.json();
            if (data.success) {
                alert("✅ Logged out successfully!");
                window.location.href = "/home.html";
            } else {
                alert("❌ Logout failed: " + data.error);
            }
        } catch (error) {
            console.error("❌ Error logging out:", error);
        }
    });
}
//----------------------------------------------- ✅ Load Student Details from MongoDB
async function loadStudentsDetails() {
    try {
        const response = await fetch("http://localhost:4040/students");
        const students = await response.json();

        const tableBody = document.getElementById("studentsList");
        if (!tableBody) {
            console.error("❌ Error: 'studentsList' element not found.");
            return;
        }

        tableBody.innerHTML = students.length === 0 
            ? `<tr><td colspan="5">No student records found.</td></tr>` 
            : students.map(student => `
                <tr>
                    <td>${student.registerno}</td>
                    <td>${student.username}</td>
                    <td>${student.name}</td>
                    <td>${student.email}</td>
                    <td>${student.phoneno}</td>
                    <td>${student.year}</td>
                </tr>
            `).join("");
    } catch (error) {
        console.error("❌ Error fetching student details:", error);
    }
}
// --------------------------------------------------------------------✅ Load Book Details from MongoDB
async function loadBooksDetails() {
    try {
        const response = await fetch("http://localhost:4040/books");
        const books = await response.json();

        const tableBody = document.getElementById("booksList");
        if (!tableBody) {
            console.error("❌ Error: 'booksList' element not found.");
            return;
        }

        tableBody.innerHTML = books.length === 0 
            ? `<tr><td colspan="4">No books found.</td></tr>` 
            : books.map(book => `
                <tr>
                    <td>${book.name}</td>
                    <td>${book.author}</td>
                    <td>${book.category}</td>
                    <td>${book.available}</td>
                    <td><img src="${book.image}" width="50" alt="Book Cover"></td>
                </tr>
            `).join("");
    } catch (error) {
        console.error("❌ Error fetching book details:", error);
    }
}
//------------------------------------------------------------------borrowed books
document.addEventListener("DOMContentLoaded", function () {
    fetch("/all-borrowed-books")
        .then(res => res.json())
        .then(books => displayBorrowedBooks(books))
        .catch(err => console.error("❌ Error fetching borrowed books:", err));
});

function displayBorrowedBooks(books) {
    const tableBody = document.getElementById("borrowed-books-body");
    tableBody.innerHTML = "";

    if (books.length === 0) {
        tableBody.innerHTML = "<tr><td colspan='8'>No borrowed books.</td></tr>";
        return;
    }

    books.forEach(book => {
        const borrowDate = new Date(book.borrowDate);
        const dueDate = new Date(book.returnDate);
        const returnDate = book.actualReturnDate ? new Date(book.actualReturnDate) : null;
        const today = new Date();
        const returnedDate = book.returnedDate ? new Date(book.returnedDate) : null;
        let daysLate = 0;
        let fine = 0;
        
        // If the book is not returned and past the due date, calculate fine
        if (!returnDate && today > dueDate) {
            daysLate = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
            fine = daysLate * 5; // ₹5 per day fine
        }
        const returnDateDisplay = returnedDate && !isNaN(returnedDate) ? returnedDate.toLocaleDateString(): "<span style='color: red;'>Not Returned</span>";

        const row = `
            <tr>
                <td>${book.bookId.name}</td>
                <td>${book.bookId.author}</td>
                <td>${book.username}</td>
                <td>${borrowDate.toLocaleDateString()}</td>
                <td>${returnDateDisplay}</td>
                <td>${dueDate.toLocaleDateString()}</td>
                <td>${daysLate > 0 ? daysLate + " days" : "On Time"}</td>
                <td>₹${fine}</td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}

//---------------------------------------------------------Counts
document.addEventListener("DOMContentLoaded", function () {
    fetch("/admin-dashboard-counts")
        .then(res => res.json())
        .then(data => displayDashboardCounts(data))
        .catch(err => console.error("❌ Error fetching dashboard counts:", err));
});

function displayDashboardCounts(data) {
    document.getElementById("total-students").innerText = data.totalStudents;
    document.getElementById("total-books").innerText = data.totalBooks;
    document.getElementById("total-borrow-requests").innerText = data.totalBorrowRequests;
    document.getElementById("total-return-requests").innerText = data.totalReturnRequests;
    document.getElementById("total-borrowed-books").innerText = data.totalBorrowedBooks;
}
//-------------------------------------------------------------AddBook
document.getElementById("addBookForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const formData = new FormData();
    formData.append("name", document.getElementById("name").value);
    formData.append("author", document.getElementById("author").value);
    formData.append("category", document.getElementById("category").value);
    formData.append("available", parseInt(document.getElementById("available").value, 10) || 0);
    formData.append("bookImage", document.getElementById("bookImage").files[0]);

    const response = await fetch("http://localhost:4040/addBook", {
        method: "POST",
        body: formData,
    });

    const result = await response.json();
    alert(result.message);
});
// -------------------------------------------------student
async function loadStudentsDetails() {
    try {
        const response = await fetch("/students");
        const students = await response.json();
        const table = document.getElementById("studentsList");

        if (table) {
            table.innerHTML = students.map(student => `
                <tr>
                    <td>${student.registerno}</td>
                    <td>${student.username}</td>
                    <td>${student.name}</td>
                    <td>${student.email}</td>
                    <td>${student.phoneno}</td>
                    <td>${student.year}</td>
                    <td><button class="more-btn" data-username="${student.username}">more</button></td>
                </tr>
            `).join("");

            // Attach event listeners to all "more" buttons after rendering
            document.querySelectorAll(".more-btn").forEach(btn => {
                btn.addEventListener("click", () => {
                    const username = btn.dataset.username;
                    showModal(username);
                });
            });
        }
    } catch (error) {
        console.error("❌ Error fetching student details:", error);
    }
}
async function showModal(username) {
    const modal = document.getElementById("studentModal");
    const tbody = document.getElementById("modalBorrowedBooksList");
    tbody.innerHTML = "<tr><td colspan='7'>Loading...</td></tr>";
    const bookCountDisplay = document.getElementById("bookCount");
    bookCountDisplay.textContent = "";
   
    try {
        const response = await fetch(`/borrowed-books/${username}`);
        const data = await response.json();
        const totalBooks = data.length;
        const pendingBooks = data.filter(book => !book.returnedDate).length;

        if (Array.isArray(data) && data.length > 0) {
            bookCountDisplay.innerHTML = `
            Total Borrowed Books: <strong>${totalBooks}</strong><br>
            Pending (Not Returned): <strong style="color: red;">${pendingBooks}</strong>
        `;
            tbody.innerHTML = data.map(book => {
                
                const returnedDate = book.returnedDate ? new Date(book.returnedDate) : null;
                const returnDateDisplay = returnedDate && !isNaN(returnedDate)
                    ? returnedDate.toLocaleDateString()
                    : "<span style='color: red;'>Not Returned</span>";

                return `
                    <tr>
                        <td>${book.bookId?.name || "N/A"}</td>
                        <td>${book.bookId?.author || "N/A"}</td>
                        <td>${formatDate(book.borrowDate)}</td>
                        <td>${formatDate(book.returnDate)}</td>
                        <td>${returnDateDisplay}</td>
                        <td>${book.daysLate}</td>
                        <td>₹${book.fine}</td>
                    </tr>
                `;
            }).join("");
        } else {
            bookCountDisplay.textContent = `Total Borrowed Books: 0`;
            tbody.innerHTML = "<tr><td colspan='7'>No borrowed books</td></tr>";
        }

        modal.classList.remove("hidden");
    } catch (error) {
        console.error("Error fetching borrowed books:", error);
        tbody.innerHTML = "<tr><td colspan='7'>Error loading data</td></tr>";
    }
}
function formatDate(dateString) {
    const date = new Date(dateString);
    return isNaN(date) ? "Invalid" : date.toLocaleDateString();
}
document.getElementById("closeModal").addEventListener("click", () => {
    document.getElementById("studentModal").classList.add("hidden");
});