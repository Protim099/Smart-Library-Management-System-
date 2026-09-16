const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.error) message = body.error;
    } catch {
      /* ignore parse errors */
    }
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  getDashboard: () => request("/dashboard"),

  getBooks: () => request("/books"),
  addBook: (data) => request("/books", { method: "POST", body: JSON.stringify(data) }),
  deleteBook: (id) => request(`/books/${id}`, { method: "DELETE" }),

  getMembers: () => request("/members"),
  addMember: (data) => request("/members", { method: "POST", body: JSON.stringify(data) }),
  deleteMember: (id) => request(`/members/${id}`, { method: "DELETE" }),

  getLoans: (activeOnly = false) => request(`/loans${activeOnly ? "?active=true" : ""}`),
  checkout: (bookId, memberId) =>
    request("/loans", { method: "POST", body: JSON.stringify({ bookId, memberId }) }),
  returnLoan: (id) => request(`/loans/${id}/return`, { method: "POST" })
};
