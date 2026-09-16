import { useEffect, useState, useCallback } from "react";
import {
  BookOpen,
  Users,
  ArrowLeftRight,
  LayoutGrid,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  X
} from "lucide-react";
import { api } from "./api";

const fmt = (dateStr) =>
  new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
const today = () => new Date().toISOString().slice(0, 10);

function StampButton({ children, onClick, tone = "ink", disabled, type = "button", full }) {
  const tones = {
    ink: "bg-[#2B3A2F] text-[#F5F1E8] hover:bg-[#233026] border-[#2B3A2F]",
    oak: "bg-[#8B5E34] text-[#F5F1E8] hover:bg-[#77502c] border-[#8B5E34]",
    ghost: "bg-transparent text-[#2B3A2F] hover:bg-[#EAE3D2] border-[#2B3A2F]",
    danger: "bg-transparent text-[#8B3A2F] hover:bg-[#F3E4DE] border-[#8B3A2F]"
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${full ? "w-full" : ""} inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wide text-[#6B6355] mb-1">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full bg-[#FBF9F3] border border-[#D9D0B8] rounded-sm px-3 py-2 text-sm text-[#2A2620] placeholder-[#A79E88] focus:outline-none focus:ring-2 focus:ring-[#8B5E34] focus:border-transparent";

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1712]/50 p-4">
      <div className="bg-[#FBF9F3] border border-[#D9D0B8] rounded-sm w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E4DCC6]">
          <h3 className="font-serif-lora text-lg text-[#2A2620]">{title}</h3>
          <button onClick={onClose} className="text-[#6B6355] hover:text-[#2A2620]">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Toast({ message, tone = "ok" }) {
  if (!message) return null;
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-sm border text-sm shadow-md ${
        tone === "ok"
          ? "bg-[#EEF3EC] border-[#3D5A40] text-[#2B3A2F]"
          : "bg-[#F6E9E4] border-[#8B3A2F] text-[#8B3A2F]"
      }`}
    >
      {tone === "ok" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      {message}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [dashboard, setDashboard] = useState(null);
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loans, setLoans] = useState([]);

  const [bookModal, setBookModal] = useState(false);
  const [memberModal, setMemberModal] = useState(false);
  const [bookQuery, setBookQuery] = useState("");
  const [memberQuery, setMemberQuery] = useState("");
  const [borrowBookId, setBorrowBookId] = useState("");
  const [borrowMemberId, setBorrowMemberId] = useState("");

  function flash(message, tone = "ok") {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 2600);
  }

  const refreshAll = useCallback(async () => {
    const [d, b, m, l] = await Promise.all([
      api.getDashboard(),
      api.getBooks(),
      api.getMembers(),
      api.getLoans(true)
    ]);
    setDashboard(d);
    setBooks(b);
    setMembers(m);
    setLoans(l);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await refreshAll();
      } catch (err) {
        flash(err.message || "Could not reach the server.", "err");
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshAll]);

  async function addBook(data) {
    try {
      await api.addBook(data);
      setBookModal(false);
      flash(`Added "${data.title}" to the catalog.`);
      await refreshAll();
    } catch (err) {
      flash(err.message, "err");
    }
  }

  async function removeBook(id, title) {
    try {
      await api.deleteBook(id);
      flash(`Removed "${title}" from the catalog.`);
      await refreshAll();
    } catch (err) {
      flash(err.message, "err");
    }
  }

  async function addMember(data) {
    try {
      await api.addMember(data);
      setMemberModal(false);
      flash(`${data.name} is now a member.`);
      await refreshAll();
    } catch (err) {
      flash(err.message, "err");
    }
  }

  async function removeMember(id, name) {
    try {
      await api.deleteMember(id);
      flash(`${name} removed from members.`);
      await refreshAll();
    } catch (err) {
      flash(err.message, "err");
    }
  }

  async function checkout() {
    if (!borrowBookId || !borrowMemberId) {
      flash("Choose a book and a member first.", "err");
      return;
    }
    try {
      const loan = await api.checkout(borrowBookId, borrowMemberId);
      flash(`${loan.member.name} checked out "${loan.book.title}".`);
      setBorrowBookId("");
      setBorrowMemberId("");
      await refreshAll();
    } catch (err) {
      flash(err.message, "err");
    }
  }

  async function returnLoan(id, title) {
    try {
      await api.returnLoan(id);
      flash(`"${title}" marked returned.`);
      await refreshAll();
    } catch (err) {
      flash(err.message, "err");
    }
  }

  const filteredBooks = books.filter((b) =>
    `${b.title} ${b.author} ${b.isbn}`.toLowerCase().includes(bookQuery.toLowerCase())
  );
  const filteredMembers = members.filter((m) =>
    `${m.name} ${m.email}`.toLowerCase().includes(memberQuery.toLowerCase())
  );

  const navItems = [
    { key: "dashboard", label: "Overview", icon: LayoutGrid },
    { key: "books", label: "Catalog", icon: BookOpen },
    { key: "members", label: "Members", icon: Users },
    { key: "circulation", label: "Circulation", icon: ArrowLeftRight }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F1E8] text-[#6B6355]">
        Loading the library&hellip;
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F5F1E8] text-[#2A2620] flex">
      <aside className="w-56 shrink-0 bg-[#2B3A2F] text-[#F5F1E8] flex flex-col py-6 px-4">
        <div className="mb-8 px-1">
          <div className="font-serif-lora text-xl leading-tight">Hollow Oak</div>
          <div className="text-xs text-[#B9C2B4] tracking-wide">Public Library</div>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-3 px-3 py-2 rounded-sm text-sm transition-colors ${
                tab === key ? "bg-[#F5F1E8] text-[#2B3A2F] font-medium" : "text-[#DCE3D8] hover:bg-[#374A3B]"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>
        <div className="mt-auto pt-6 text-xs text-[#8FA189] border-t border-[#3E4F41] px-1">
          {books.length} titles &middot; {members.length} members
        </div>
      </aside>

      <main className="flex-1 p-8 max-w-5xl">
        {tab === "dashboard" && <Dashboard dashboard={dashboard} />}

        {tab === "books" && (
          <section>
            <SectionHeader
              title="Catalog"
              subtitle="Every title the library holds, and how many copies are free right now."
              action={
                <StampButton tone="oak" onClick={() => setBookModal(true)}>
                  <Plus size={16} /> Add book
                </StampButton>
              }
            />
            <SearchBox value={bookQuery} onChange={setBookQuery} placeholder="Search title, author, or ISBN" />
            <div className="mt-4 border border-[#D9D0B8] rounded-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#EFE9D8] text-left text-xs uppercase tracking-wide text-[#6B6355]">
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Author</th>
                    <th className="px-4 py-3 font-medium">ISBN</th>
                    <th className="px-4 py-3 font-medium text-center">Available</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.map((b) => (
                    <tr key={b.id} className="border-t border-[#E4DCC6]">
                      <td className="px-4 py-3 font-serif-lora">{b.title}</td>
                      <td className="px-4 py-3 text-[#4A4536]">{b.author}</td>
                      <td className="px-4 py-3 text-[#8A8266] font-mono text-xs">{b.isbn}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-sm text-xs font-medium ${
                            b.available > 0 ? "bg-[#E4EDE1] text-[#2B3A2F]" : "bg-[#F3E1DA] text-[#8B3A2F]"
                          }`}
                        >
                          {b.available} / {b.copies}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => removeBook(b.id, b.title)} className="text-[#A6725B] hover:text-[#8B3A2F]">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredBooks.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-[#8A8266]">
                        No titles match that search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === "members" && (
          <section>
            <SectionHeader
              title="Members"
              subtitle="Everyone registered to borrow from the library."
              action={
                <StampButton tone="oak" onClick={() => setMemberModal(true)}>
                  <Plus size={16} /> Add member
                </StampButton>
              }
            />
            <SearchBox value={memberQuery} onChange={setMemberQuery} placeholder="Search name or email" />
            <div className="mt-4 border border-[#D9D0B8] rounded-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#EFE9D8] text-left text-xs uppercase tracking-wide text-[#6B6355]">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                    <th className="px-4 py-3 font-medium text-center">Books out</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((m) => (
                    <tr key={m.id} className="border-t border-[#E4DCC6]">
                      <td className="px-4 py-3 font-serif-lora">{m.name}</td>
                      <td className="px-4 py-3 text-[#4A4536]">{m.email}</td>
                      <td className="px-4 py-3 text-[#8A8266]">{fmt(m.joined)}</td>
                      <td className="px-4 py-3 text-center">{m.booksOut}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => removeMember(m.id, m.name)} className="text-[#A6725B] hover:text-[#8B3A2F]">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredMembers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-[#8A8266]">
                        No members match that search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === "circulation" && (
          <section>
            <SectionHeader title="Circulation" subtitle="Check books out, and check them back in." />

            <div className="mt-4 border border-[#D9D0B8] rounded-sm bg-[#FBF9F3] p-5">
              <div className="font-serif-lora text-base mb-4">New checkout</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <Field label="Book">
                  <select className={inputCls} value={borrowBookId} onChange={(e) => setBorrowBookId(e.target.value)}>
                    <option value="">Select a title&hellip;</option>
                    {books.map((b) => (
                      <option key={b.id} value={b.id} disabled={b.available <= 0}>
                        {b.title} ({b.available} left)
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Member">
                  <select className={inputCls} value={borrowMemberId} onChange={(e) => setBorrowMemberId(e.target.value)}>
                    <option value="">Select a member&hellip;</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <StampButton tone="ink" onClick={checkout} full>
                  <ArrowLeftRight size={16} /> Check out (14 days)
                </StampButton>
              </div>
            </div>

            <div className="mt-6">
              <div className="font-serif-lora text-base mb-3">Currently checked out</div>
              <div className="border border-[#D9D0B8] rounded-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#EFE9D8] text-left text-xs uppercase tracking-wide text-[#6B6355]">
                      <th className="px-4 py-3 font-medium">Book</th>
                      <th className="px-4 py-3 font-medium">Member</th>
                      <th className="px-4 py-3 font-medium">Borrowed</th>
                      <th className="px-4 py-3 font-medium">Due</th>
                      <th className="px-4 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {loans.map((l) => {
                      const overdue = l.due < today();
                      return (
                        <tr key={l.id} className="border-t border-[#E4DCC6]">
                          <td className="px-4 py-3 font-serif-lora">{l.book?.title}</td>
                          <td className="px-4 py-3">{l.member?.name}</td>
                          <td className="px-4 py-3 text-[#8A8266]">{fmt(l.borrowed)}</td>
                          <td className="px-4 py-3">
                            <span className={overdue ? "text-[#8B3A2F] font-medium" : "text-[#4A4536]"}>
                              {fmt(l.due)} {overdue && "(overdue)"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <StampButton tone="ghost" onClick={() => returnLoan(l.id, l.book?.title)}>
                              Return
                            </StampButton>
                          </td>
                        </tr>
                      );
                    })}
                    {loans.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-[#8A8266]">
                          Nothing checked out right now.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>

      {bookModal && (
        <Modal title="Add a book" onClose={() => setBookModal(false)}>
          <BookForm onSubmit={addBook} onCancel={() => setBookModal(false)} />
        </Modal>
      )}
      {memberModal && (
        <Modal title="Add a member" onClose={() => setMemberModal(false)}>
          <MemberForm onSubmit={addMember} onCancel={() => setMemberModal(false)} />
        </Modal>
      )}

      <Toast message={toast?.message} tone={toast?.tone} />
    </div>
  );
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-5 gap-4">
      <div>
        <h1 className="font-serif-lora text-2xl text-[#2A2620]">{title}</h1>
        {subtitle && <p className="text-sm text-[#6B6355] mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="relative max-w-sm">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A79E88]" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputCls} pl-9`}
      />
    </div>
  );
}

function Dashboard({ dashboard }) {
  if (!dashboard) return null;
  const stats = [
    { label: "Titles in catalog", value: dashboard.totalTitles },
    { label: "Copies on shelf", value: `${dashboard.totalAvailable} / ${dashboard.totalCopies}` },
    { label: "Registered members", value: dashboard.totalMembers },
    { label: "Books checked out", value: dashboard.activeLoanCount }
  ];

  return (
    <section>
      <SectionHeader title="Overview" subtitle="How the library is doing today." />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="border border-[#D9D0B8] bg-[#FBF9F3] rounded-sm p-4">
            <div className="font-serif-lora text-2xl text-[#2B3A2F]">{s.value}</div>
            <div className="text-xs uppercase tracking-wide text-[#8A8266] mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="font-serif-lora text-base mb-3">
        {dashboard.overdueLoans.length > 0 ? `${dashboard.overdueLoans.length} overdue` : "Nothing overdue"}
      </div>
      {dashboard.overdueLoans.length > 0 ? (
        <div className="border border-[#E0B7A6] bg-[#F6E9E4] rounded-sm divide-y divide-[#E0B7A6]">
          {dashboard.overdueLoans.map((l) => (
            <div key={l.id} className="px-4 py-3 flex items-center justify-between text-sm">
              <span>
                <span className="font-serif-lora">{l.book?.title}</span> &mdash; {l.member?.name}
              </span>
              <span className="text-[#8B3A2F] font-medium">due {fmt(l.due)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#6B6355]">Every borrowed book is on time.</p>
      )}
    </section>
  );
}

function BookForm({ onSubmit, onCancel }) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [copies, setCopies] = useState(1);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim() || !author.trim()) return;
        onSubmit({ title: title.trim(), author: author.trim(), isbn: isbn.trim(), copies });
      }}
    >
      <Field label="Title">
        <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} required />
      </Field>
      <Field label="Author">
        <input className={inputCls} value={author} onChange={(e) => setAuthor(e.target.value)} required />
      </Field>
      <Field label="ISBN">
        <input className={inputCls} value={isbn} onChange={(e) => setIsbn(e.target.value)} />
      </Field>
      <Field label="Copies">
        <input type="number" min={1} className={inputCls} value={copies} onChange={(e) => setCopies(e.target.value)} />
      </Field>
      <div className="flex gap-2 pt-2">
        <StampButton tone="oak" type="submit" full>
          Add to catalog
        </StampButton>
        <StampButton tone="ghost" onClick={onCancel} full>
          Cancel
        </StampButton>
      </div>
    </form>
  );
}

function MemberForm({ onSubmit, onCancel }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim() || !email.trim()) return;
        onSubmit({ name: name.trim(), email: email.trim() });
      }}
    >
      <Field label="Full name">
        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} required />
      </Field>
      <Field label="Email">
        <input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} required />
      </Field>
      <div className="flex gap-2 pt-2">
        <StampButton tone="oak" type="submit" full>
          Add member
        </StampButton>
        <StampButton tone="ghost" onClick={onCancel} full>
          Cancel
        </StampButton>
      </div>
    </form>
  );
}
