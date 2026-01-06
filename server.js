const express = require("express");
const dotEnv = require("dotenv");
const app = express();
const PORT = 4040;
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const bcrypt = require("bcrypt");
const session = require("express-session");
const MongoStore = require('connect-mongo');//--------------------------------
// ✅ Use .env for sensitive data like MONGO_URI
dotEnv.config();

// ✅ MongoDB Atlas Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("✅ Mongoose connected to Atlas");
}).catch((err) => {
    console.error("❌ Mongoose connection error:", err);
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// ✅ Session Middleware
app.use(
    session({
        secret: "super-secret-key", 
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }, 
        store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })//--------------
    })
);

// ✅ Serve home.html on "/"
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "home.html"));
});
// ✅ Ensure uploads folder exists
// const uploadDir = "public/uploads";
// if (!fs.existsSync(uploadDir)) {
//     fs.mkdirSync(uploadDir, { recursive: true });
// }
require("dotenv").config();
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

/* ===================== CLOUDINARY CONFIG ===================== */
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

/* ===================== MULTER + CLOUDINARY ===================== */
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "elibrary",
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

const upload = multer({ storage });

////////////////////////////////////////////////////////////////////////////////////////////
// ✅ Define User Schema & Model
const userSchema = new mongoose.Schema({
    name: String,
    username: { type: String, required: true, unique: true },
    registerno: { type: String, required: true, unique: true },
    password: String,
    year: String,
    photo: String, // Store the filename
    email: String, // ✅ Fixed typo
    phoneno:String,
});

const User = mongoose.model("User", userSchema);

// ✅ Set up Multer storage
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, uploadDir);
//     },
//     filename: (req, file, cb) => {
//         cb(null, Date.now() + "-" + file.originalname);
//     },
// });

// const upload = multer({
//     storage: storage,
//     limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
//     fileFilter: (req, file, cb) => {
//         if (file.mimetype.startsWith("image/")) {
//             cb(null, true);
//         } else {
//             cb(new Error("Only image files are allowed!"), false);
//         }
//     },
// });

// ✅ Serve home.html on "/"
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "home.html"));
});

// ✅ Handle Registration with File Upload
app.post("/register", upload.single("photo"), async (req, res) => {
    try {
        console.log("📩 Received Data:", req.body);  // Debugging
        console.log("📷 Uploaded File:", req.file);  // Debugging

        const { name, username, registerno, password, year, email,phoneno } = req.body;
        console.log("📧 Email received:", email);  // Debugging

        console.log("✅ Extracted Email:", email); // Log email to verify

        if (!email) {
            return res.status(400).json({ error: "❌ Email is required." });
        }
        if (!username || !password) {
            return res.status(400).json({ error: "❌ Username and password are required." });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ 
            name, 
            username, 
            registerno, 
            password: hashedPassword, 
            year, 
            photo: req.file ? req.file.path : null,
            email,
            phoneno
        });

        await newUser.save();
        console.log("✅ User saved:", newUser);
        res.send("✅ Registration successful!");
    } catch (error) {
        console.error("❌ Error saving data:", error);
        res.status(500).json({ error: "❌ Error saving data." });
    }
});

// ✅ Login Route
app.post("/login", async (req, res) => {
    console.log("🔹 Login request received:", req.body); // Debugging log

    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            console.log("❌ User not found");
            return res.status(400).json({ error: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log("❌ Invalid password");
            return res.status(400).json({ error: "Invalid password" });
        }

        // ✅ Save user in session
        req.session.username = user.username;

        console.log("✅ Login successful! Redirecting...");
        res.json({ success: true, message: "Login successful", redirect: "/userhome.html" });
    } catch (err) {
        console.error("❌ Server error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

//✅ Fetch Logged-in User Details
app.get("/getUser", async (req, res) => {
    if (!req.session.username) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const user = await User.findOne({ username: req.session.username });

        if (user) {
            console.log("👤 User fetched:", user);  // Debugging
            res.json({
                name: user.name,
                username: user.username,
                registerno: user.registerno,
                year: user.year || "Year not found",  // ✅ Debugging missing year
                email: user.email || "Email not found", // ✅ Debugging missing email
                phoneno:user.phoneno
            });
        }else  {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        console.error("❌ Error fetching user:", error);
        res.status(500).json({ error: "Server error" });
    }
});


// ✅ Logout Route
app.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: "Logout failed" });
        }
        res.json({ success: true, message: "Logged out successfully" });
    });
});

// ✅ Start Server
module.exports = app;

//------------------------------------------------------------------------------------------bookschema


const bookSchema = new mongoose.Schema({
    name: String,
    author: String,
    category: String,
    available:Number,
    image: String  // Path to the book image
});

const Book = mongoose.model("Book", bookSchema);
module.exports = Book;

app.get("/categories", async (req, res) => {
    try {
        const categories = await Book.distinct("category"); // Get unique categories
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: "Error fetching categories" });
    }
});
app.get("/books/:category", async (req, res) => {
    try {
        const category = req.params.category;
        const books = await Book.find({ category }, { name: 1, author: 1, available: 1, image: 1,category: 1 }); // ✅ Ensure available is included
        res.json(books);
    } catch (error) {
        res.status(500).json({ error: "Error fetching books" });
    }
});

//---------------------------------------------------------------------------------------------borrowschema
const borrowSchema = new mongoose.Schema({
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book" },
    username: String,
    borrowDate: { type: Date, default: Date.now },
    returnDate: { type: Date }, // Return date is stored in DB
    returnRequested: { type: Boolean, default: false }, 
    returnApproved: { type: Boolean, default: false },
    returnedDate :{type: Date, default:null}//---------------------------------------------------------------------------
});

const Borrow = mongoose.model("Borrow", borrowSchema);
app.post("/borrow", async (req, res) => {
    if (!req.session.username) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const { bookId } = req.body;

    // Calculate return date (30 days from today)
    const returnDate = new Date();
    returnDate.setDate(returnDate.getDate() + 30);
    const returnedDate = null; //-------------------------------------------------------------------------------------

    const newBorrow = new Borrow({ 
        bookId, 
        username: req.session.username, 
        returnDate ,
        returnedDate: null  //-----------------------------------------------------------------------------------------------------
    });

    try {
        await newBorrow.save();
        res.json({ message: "Book borrowed successfully!", returnDate });
    } catch (error) {
        res.status(500).json({ error: "Error borrowing book" });
    }
});
app.post("/request-return", async (req, res) => {
    const { borrowId } = req.body;

    try {
        await Borrow.findByIdAndUpdate(borrowId, { returnRequested: true });
        res.json({ message: "Return request sent to admin." });
    } catch (error) {
        res.status(500).json({ error: "Error sending return request" });
    }
});

app.get("/search-books", async (req, res) => {
    try {
        let query = req.query.q;
        if (!query) return res.json([]);

        let books = await Book.find({
            $or: [
                { name: { $regex: query, $options: "i" } },
                { author: { $regex: query, $options: "i" } }
            ]
        });

        res.json(books);
    } catch (err) {
        console.error("Error searching books:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});




// ---------------------------------------------------------------------------------------------    -Admin

// ✅ Define Admin Schema & Model
const adminSchema = new mongoose.Schema({
    adminname: { type: String, required: true },
    password: { type: String, required: true }
});

const Admin = mongoose.model("admin", adminSchema); // ✅ Use "admin", not "User"


app.post("/login1", async (req, res) => {
    console.log("🔹 Login request received:", req.body); // Debugging log

    const { adminname, password } = req.body;

    if (!adminname || !password) {
        return res.status(400).json({ error: "Please fill all fields" });
    }

    try {
        // ✅ Fix: Use the correct model name
        const admin = await Admin.findOne({ adminname });

        if (!admin) {
            console.log("❌ Admin not found in database");
            return res.status(400).json({ error: "Admin not found" });
        }

        if (admin.password !== password) {
            console.log("❌ Incorrect password");
            return res.status(400).json({ error: "Invalid password" });
        }

        req.session.adminname = admin.adminname;
        console.log("✅ Login successful!");
        res.json({ success: true, message: "Login successful", redirect: "/adminhome.html" });

    } catch (err) {
        console.error("❌ Server error:", err);
        res.status(500).json({ error: "Server error" });
    }
});
//////////----------------------------------------------------request for admin
// ✅ Add `returnRequested` and `returnApproved` to Borrow Schema


// ✅ Request Return API
app.post("/request-return", async (req, res) => {
    const { borrowId } = req.body;
    try {
        await Borrow.findByIdAndUpdate(borrowId, { returnRequested: true });
        res.json({ message: "Return request sent." });
    } catch (error) {
        res.status(500).json({ error: "Error sending return request" });
    }
});

// ✅ Admin approves return request
app.post("/approve-return", async (req, res) => {
    const { borrowId } = req.body;
    try {
        const borrow = await Borrow.findByIdAndUpdate(
            borrowId,
            { returnApproved: true ,returnedDate: new Date() }, //------------------------------------------------------------------
            { new: true }
        ).populate("bookId");

        if (borrow && borrow.bookId) {
            await Book.findByIdAndUpdate(borrow.bookId._id, { $inc: { available: 1 } });
        }

        res.json({ message: "Return approved." });
    } catch (error) {
        res.status(500).json({ error: "Error approving return" });
    }
});

// ✅ Fetch return requests for admin
app.get("/return-requests", async (req, res) => {
    try {
        const requests = await Borrow.find({ returnRequested: true, returnApproved: false }).populate("bookId");
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: "Error fetching return requests" });
    }
});
//-----------------------------------------------------borrow book request
const BorrowRequest = mongoose.model("BorrowRequest", new mongoose.Schema({
    bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book" },
    username: String,
    status: { type: String, default: "Pending" } // "Pending", "Accepted", "Rejected"
}));

// 📌 User Requests to Borrow a Book
app.post("/borrow-request", async (req, res) => {
    if (!req.session.username) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const { bookId } = req.body;
    try {
        // Check if the book has available copies
        const book = await Book.findById(bookId);
        if (!book || book.available <= 0) {
            return res.status(400).json({ error: "Book is not available" });
        }

        // Create a new borrow request
        const newRequest = new BorrowRequest({
            bookId,
            username: req.session.username
        });

        await newRequest.save();
        res.json({ message: "Borrow request sent!" });
    } catch (error) {
        res.status(500).json({ error: "Error sending borrow request" });
    }
});

// 📌 Admin Fetches Borrow Requests
app.get("/borrow-requests", async (req, res) => {
    try {
        const requests = await BorrowRequest.find({ status: "Pending" }).populate("bookId");
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: "Error fetching borrow requests" });
    }
});

// 📌 Admin Accepts Borrow Request
app.post("/approve-borrow", async (req, res) => {
    const { requestId } = req.body;

    try {
        const request = await BorrowRequest.findById(requestId);
        if (!request) return res.status(404).json({ error: "Request not found" });

        // Check if the book is available
        const book = await Book.findById(request.bookId);
        if (!book || book.available <= 0) {
            return res.status(400).json({ error: "Book is not available for borrowing" });
        }

        // Move book to Borrow collection
        const borrowEntry = new Borrow({
            bookId: request.bookId,
            username: request.username,
            borrowDate: new Date(),
            returnDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 1 month later
        });
        await borrowEntry.save();

        // Mark request as accepted & update availability
        await BorrowRequest.findByIdAndDelete(requestId);
        await Book.findByIdAndUpdate(request.bookId, { $inc: { available: -1 } });

        res.json({ message: "Borrow request approved!" });
    } catch (error) {
        res.status(500).json({ error: "Error approving borrow request" });
    }
});

// 📌 Fetch Borrowed Books for User
app.get("/borrowed-books", async (req, res) => {
    if (!req.session.username) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const borrows = await Borrow.find({ username: req.session.username }).populate("bookId");
        res.json(borrows);
    } catch (error) {
        res.status(500).json({ error: "Error fetching borrowed books" });
    }
});

app.get("/students", async (req, res) => {
    try {
        const students = await User.find({});
        res.json(students);
    } catch (error) {
        console.error("❌ Error fetching students:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
app.get("/books", async (req, res) => {
    try {
        const books = await Book.find({});
        res.json(books);
    } catch (error) {
        console.error("❌ Error fetching books:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

//------------------------------------------------------ 📌 Fetch Borrow Requests for the Logged-in User
app.get("/user-borrow-requests", async (req, res) => {
    if (!req.session.username) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const requests = await BorrowRequest.find({ username: req.session.username }).populate("bookId");
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: "Error fetching borrow requests" });
    }
});
//-------------------------------------------------------------------display borrowed books
app.get("/all-borrowed-books", async (req, res) => {
    try {
        const borrowedBooks = await Borrow.find()
            .populate("bookId") // Get book details
            .populate("username"); // If user details are stored

        // Calculate overdue days and fine
        const today = new Date();
        const booksWithFine = borrowedBooks.map(book => {
            let daysLate = 0;
            let fine = 0;

            if (today > book.returnDate) {
                daysLate = Math.floor((today - book.returnDate) / (1000 * 60 * 60 * 24));
                fine = daysLate * 5; // ₹5 per day fine
            }

            return {
                ...book._doc,
                daysLate,
                fine
            };
        });

        res.json(booksWithFine);
    } catch (error) {
        res.status(500).json({ error: "Error fetching borrowed books" });
    }
});
//----------------------------------------------------Counts
app.get("/admin-dashboard-counts", async (req, res) => {
    try {
        const totalStudents = await User.countDocuments(); // Assuming "User" is the model for students
        const totalBooks = await Book.countDocuments();
        const totalBorrowRequests = await BorrowRequest.countDocuments({ status: "Pending" });
        const totalReturnRequests = await Borrow.countDocuments({ returnRequested: true, returnApproved: false });
        const totalBorrowedBooks = await Borrow.countDocuments();

        res.json({
            totalStudents,
            totalBooks,
            totalBorrowRequests,
            totalReturnRequests,
            totalBorrowedBooks
        });
    } catch (error) {
        res.status(500).json({ error: "Error fetching counts" });
    }
});
//----------------------------------------AddBook
app.post("/addBook", upload.single("bookImage"), async (req, res) => {
    try {
        const { name, author, category } = req.body;
        let available = parseInt(req.body.available, 10) || 0; // Ensure it's a valid number
        const imagePath = req.file ? req.file.path : null;

        console.log("Received Book Data:", req.body);
        console.log("Uploaded Image Path:", imagePath);
        console.log("Available Books to Add:", available);

        // Check if the book already exists in the database
        let book = await Book.findOne({ name, author, category });

        if (book) {
            console.log(`Existing Available Count: ${book.available}`);
            book.available += available; // Correctly increment available count
            await book.save();
            console.log(`Updated Available Count: ${book.available}`);
            return res.json({ message: "Book already exists. Available count updated.", book });
        }

        // If the book does not exist, create a new one
        book = new Book({
            name,
            author,
            category,
            available, // Store new available value
            image: imagePath,
        });

        await book.save();
        console.log("New book added:", book);
        res.json({ message: "New book added successfully!", book });

    } catch (error) {
        console.error("Error saving book:", error);
        res.status(500).json({ message: "Error adding book" });
    }
});

//-------------------------------------------------------Delete
app.post("/deleteBook", async (req, res) => {
    try {
        const { bookTitle } = req.body;

        if (!bookTitle) return res.status(400).json({ message: "❌ Book title is required" });

        const book = await Book.findOne({ name: bookTitle });
        if (!book) return res.status(404).json({ message: "❌ Book not found" });

        await Book.deleteOne({ name: bookTitle });
        res.json({ message: `✅ Book "${bookTitle}" deleted successfully` });
    } catch (error) {
        console.error("❌ Error deleting book:", error);
        res.status(500).json({ message: "❌ Internal Server Error" });
    }
});
// ---------------------------------------------------------------------------------
app.get("/borrowed-books/:username", async (req, res) => {
    try {
        const { username } = req.params;
        // Assuming your Borrow model has a field 'username' that stores the username
        const books = await Borrow.find({ username })
            .populate("bookId"); // Populate book details if needed

        // Calculate overdue days and fine
        const today = new Date();
        const booksWithFine = books.map(book => {
            let daysLate = 0, fine = 0;
            if (today > book.returnDate) {
                daysLate = Math.floor((today - book.returnDate) / (1000 * 60 * 60 * 24));
                fine = daysLate * 5; // ₹5 per day fine
            }
            return { ...book._doc, daysLate, fine };
        });

        res.json(booksWithFine);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch borrowed books" });
    }
});
//------------------------------------------------------------------------------like
const Wishlist = mongoose.model("Wishlist", new mongoose.Schema({
    username: String,
    bookId: String,
  }));
  
  // Get wishlist of logged-in user
  app.get("/api/user-wishlist", async (req, res) => {
    if (!req.session.username) return res.status(401).json({ error: "Login required" });
  
    const wishlistItems = await Wishlist.find({ username: req.session.username });
    res.json(wishlistItems.map(w => w.bookId));
  });
  
  // Add to wishlist
  app.post("/api/user-wishlist", async (req, res) => {
    const { bookId } = req.body;
    const username = req.session.username;
    if (!username) return res.status(401).json({ error: "Login required" });
  
    const exists = await Wishlist.findOne({ username, bookId });
    if (!exists) {
      await Wishlist.create({ username, bookId });
    }
  
    res.json({ message: "Added to wishlist" });
  });
  
  // Remove from wishlist
  app.delete("/api/user-wishlist", async (req, res) => {
    const { bookId } = req.body;
    const username = req.session.username;
    if (!username) return res.status(401).json({ error: "Login required" });
  
    await Wishlist.deleteOne({ username, bookId });
    res.json({ message: "Removed from wishlist" });
  });
  app.get("/api/books", async (req, res) => {
    try {
      const books = await Book.find(); // Assuming `Book` is your model
      res.json(books);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch books" });
    }
  });
//--------------------------------------------------------------------------------------------forgot
// Route to request password reset
app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) return res.status(404).send('User not found');
  
    res.send('User found, now show reset password form on frontend');
  });
  
  // Route to reset the password
  app.post('/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });
  
    if (!user) return res.status(404).send('User not found');
  
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
  
    res.send('Password reset successful');
  });
// Admin Forgot Password - check if adminname exists
app.post('/admin-forgot-password', async (req, res) => {
    const { adminname } = req.body;
  
    try {
      const admin = await Admin.findOne({ adminname });
  
      if (!admin) return res.status(404).send('Admin not found');
  
      res.send('Admin found, now show reset password form on frontend');
    } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
    }
  });
  
  // Admin Reset Password
  app.post('/admin-reset-password', async (req, res) => {
    const { adminname, newPassword } = req.body;
  
    try {
      const admin = await Admin.findOne({ adminname });
  
      if (!admin) return res.status(404).send('Admin not found');
  
      admin.password = newPassword; // Save plain password directly
      await admin.save();
  
      res.send('Admin password reset successful');
    } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
    }
  });

