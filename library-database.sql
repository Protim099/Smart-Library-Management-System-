-- Enables gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS books (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title   TEXT NOT NULL,
  author  TEXT NOT NULL,
  isbn    TEXT,
  copies  INTEGER NOT NULL DEFAULT 1 CHECK (copies >= 1)
);

CREATE TABLE IF NOT EXISTS members (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name    TEXT NOT NULL,
  email   TEXT NOT NULL UNIQUE,
  joined  DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS loans (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id    UUID NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
  member_id  UUID NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
  borrowed   DATE NOT NULL DEFAULT CURRENT_DATE,
  due        DATE NOT NULL,
  returned   DATE
);

CREATE INDEX IF NOT EXISTS idx_loans_book_id ON loans(book_id);
CREATE INDEX IF NOT EXISTS idx_loans_member_id ON loans(member_id);
CREATE INDEX IF NOT EXISTS idx_loans_returned ON loans(returned);
INSERT INTO books (title, author, isbn, copies) VALUES
  ('The Ministry for the Future', 'Kim Stanley Robinson', '9780316300131', 3),
  ('Braiding Sweetgrass', 'Robin Wall Kimmerer', '9781571313560', 2),
  ('Piranesi', 'Susanna Clarke', '9781635575637', 4),
  ('The Overstory', 'Richard Powers', '9780393635522', 2),
  ('Klara and the Sun', 'Kazuo Ishiguro', '9780571364886', 1)
ON CONFLICT DO NOTHING;

INSERT INTO members (name, email, joined) VALUES
  ('Nadia Rahman', 'nadia.rahman@example.com', '2024-02-11'),
  ('Tomas Ibarra', 'tomas.ibarra@example.com', '2023-11-03'),
  ('Priya Chandran', 'priya.chandran@example.com', '2025-01-20')
ON CONFLICT (email) DO NOTHING;
