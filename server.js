const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const store = require("./store");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (dateStr, days) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

function availabilityFor(data, bookId) {
  const book = data.books.find((b) => b.id === bookId);
  if (!book) return 0;
  const borrowedCount = data.loans.filter((l) => l.bookId === bookId && !l.returned).length;
  return book.copies - borrowedCount;
}

function withAvailability(data) {
  return data.books.map((b) => ({ ...b, available: availabilityFor(data, b.id) }));
}

// ---------- Health ----------
app.get("/api/health", (req, res) => res.json({ ok: true }));

// ---------- Dashboard ----------
app.get("/api/dashboard", (req, res) => {
  const data = store.getAll();
  const books = withAvailability(data);
  const activeLoans = data.loans.filter((l) => !l.returned);
  const overdueLoans = activeLoans.filter((l) => l.due < today());
  res.json({
    totalTitles: data.books.length,
    totalCopies: data.books.reduce((s, b) => s + b.copies, 0),
    totalAvailable: books.reduce((s, b) => s + b.available, 0),
    totalMembers: data.members.length,
    activeLoanCount: activeLoans.length,
    overdueLoans: overdueLoans.map((l) => ({
      ...l,
      book: data.books.find((b) => b.id === l.bookId),
      member: data.members.find((m) => m.id === l.memberId)
    }))
  });
});

// ---------- Books ----------
app.get("/api/books", (req, res) => {
  const data = store.getAll();
  res.json(withAvailability(data));
});

app.post("/api/books", (req, res) => {
  const { title, author, isbn, copies } = req.body;
  if (!title || !author) {
    return res.status(400).json({ error: "title and author are required" });
  }
  const data = store.getAll();
  const book = {
    id: uuidv4(),
    title: title.trim(),
    author: author.trim(),
    isbn: (isbn || "").trim() || "—",
    copies: Math.max(1, Number(copies) || 1)
  };
  data.books.push(book);
  store.saveAll(data);
  res.status(201).json({ ...book, available: book.copies });
});

app.delete("/api/books/:id", (req, res) => {
  const data = store.getAll();
  const hasActiveLoan = data.loans.some((l) => l.bookId === req.params.id && !l.returned);
  if (hasActiveLoan) {
    return res.status(409).json({ error: "Book has copies currently checked out" });
  }
  const before = data.books.length;
  data.books = data.books.filter((b) => b.id !== req.params.id);
  if (data.books.length === before) return res.status(404).json({ error: "Book not found" });
  store.saveAll(data);
  res.status(204).end();
});

// ---------- Members ----------
app.get("/api/members", (req, res) => {
  const data = store.getAll();
  const activeLoans = data.loans.filter((l) => !l.returned);
  const members = data.members.map((m) => ({
    ...m,
    booksOut: activeLoans.filter((l) => l.memberId === m.id).length
  }));
  res.json(members);
});

app.post("/api/members", (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "name and email are required" });
  }
  const data = store.getAll();
  const member = { id: uuidv4(), name: name.trim(), email: email.trim(), joined: today() };
  data.members.push(member);
  store.saveAll(data);
  res.status(201).json(member);
});

app.delete("/api/members/:id", (req, res) => {
  const data = store.getAll();
  const hasActiveLoan = data.loans.some((l) => l.memberId === req.params.id && !l.returned);
  if (hasActiveLoan) {
    return res.status(409).json({ error: "Member still has books checked out" });
  }
  const before = data.members.length;
  data.members = data.members.filter((m) => m.id !== req.params.id);
  if (data.members.length === before) return res.status(404).json({ error: "Member not found" });
  store.saveAll(data);
  res.status(204).end();
});

// ---------- Loans / Circulation ----------
app.get("/api/loans", (req, res) => {
  const data = store.getAll();
  let loans = data.loans;
  if (req.query.active === "true") loans = loans.filter((l) => !l.returned);
  const enriched = loans.map((l) => ({
    ...l,
    book: data.books.find((b) => b.id === l.bookId),
    member: data.members.find((m) => m.id === l.memberId)
  }));
  res.json(enriched);
});

app.post("/api/loans", (req, res) => {
  const { bookId, memberId } = req.body;
  if (!bookId || !memberId) {
    return res.status(400).json({ error: "bookId and memberId are required" });
  }
  const data = store.getAll();
  const book = data.books.find((b) => b.id === bookId);
  const member = data.members.find((m) => m.id === memberId);
  if (!book) return res.status(404).json({ error: "Book not found" });
  if (!member) return res.status(404).json({ error: "Member not found" });
  if (availabilityFor(data, bookId) <= 0) {
    return res.status(409).json({ error: "No copies available for that title" });
  }
  const loan = {
    id: uuidv4(),
    bookId,
    memberId,
    borrowed: today(),
    due: addDays(today(), 14),
    returned: null
  };
  data.loans.push(loan);
  store.saveAll(data);
  res.status(201).json({ ...loan, book, member });
});

app.post("/api/loans/:id/return", (req, res) => {
  const data = store.getAll();
  const loan = data.loans.find((l) => l.id === req.params.id);
  if (!loan) return res.status(404).json({ error: "Loan not found" });
  if (loan.returned) return res.status(409).json({ error: "Loan already returned" });
  loan.returned = today();
  store.saveAll(data);
  res.json(loan);
});

app.listen(PORT, () => {
  console.log(`Library backend running at http://localhost:${PORT}`);
});
