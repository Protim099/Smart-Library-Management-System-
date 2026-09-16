const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "data.json");

const SEED = {
  books: [
    { id: "b1", title: "The Ministry for the Future", author: "Kim Stanley Robinson", isbn: "9780316300131", copies: 3 },
    { id: "b2", title: "Braiding Sweetgrass", author: "Robin Wall Kimmerer", isbn: "9781571313560", copies: 2 },
    { id: "b3", title: "Piranesi", author: "Susanna Clarke", isbn: "9781635575637", copies: 4 },
    { id: "b4", title: "The Overstory", author: "Richard Powers", isbn: "9780393635522", copies: 2 },
    { id: "b5", title: "Klara and the Sun", author: "Kazuo Ishiguro", isbn: "9780571364886", copies: 1 }
  ],
  members: [
    { id: "m1", name: "Nadia Rahman", email: "nadia.rahman@example.com", joined: "2024-02-11" },
    { id: "m2", name: "Tomas Ibarra", email: "tomas.ibarra@example.com", joined: "2023-11-03" },
    { id: "m3", name: "Priya Chandran", email: "priya.chandran@example.com", joined: "2025-01-20" }
  ],
  loans: []
};

function load() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(SEED, null, 2));
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function save(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Simple synchronous read-modify-write. Fine for a small app / demo;
// swap this module out for a real database (Postgres, SQLite, etc.)
// for production / concurrent-write scenarios.
module.exports = {
  getAll() {
    return load();
  },
  saveAll(data) {
    save(data);
  }
};
