import type { Metadata } from "next";
import SectionHeading from "@/components/SectionHeading";

export const metadata: Metadata = {
  title: "Library",
};

const sections: {
  heading: string;
  books: { title: string; author: string; note?: string }[];
}[] = [
  {
    heading: "Currently Reading",
    books: [
      {
        title: "The Pragmatic Programmer",
        author: "David Thomas & Andrew Hunt",
        note: "Timeless advice on writing better software.",
      },
    ],
  },
  {
    heading: "Favorites",
    books: [
      {
        title: "Zero to One",
        author: "Peter Thiel",
        note: "Changed how I think about building things.",
      },
      {
        title: "Deep Work",
        author: "Cal Newport",
        note: "Why focused work is the real competitive advantage.",
      },
      {
        title: "The Almanack of Naval Ravikant",
        author: "Eric Jorgenson",
        note: "Wealth, health, and happiness distilled.",
      },
      {
        title: "Atomic Habits",
        author: "James Clear",
      },
    ],
  },
  {
    heading: "Want to Read",
    books: [
      { title: "Thinking, Fast and Slow", author: "Daniel Kahneman" },
      { title: "The Art of Doing Science and Engineering", author: "Richard Hamming" },
      { title: "Gödel, Escher, Bach", author: "Douglas Hofstadter" },
    ],
  },
];

export default function LibraryPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6 md:py-12">
      <SectionHeading title="Library" subtitle="Books that have shaped how I think" />
      <div className="space-y-12">
        {sections.map((section) => (
          <div key={section.heading}>
            <p className="mb-4 text-xs uppercase tracking-[0.2em] text-text-secondary">
              {section.heading}
            </p>
            <div className="border-t border-border">
              {section.books.map((book) => (
                <div
                  key={book.title}
                  className="flex flex-col gap-0.5 border-b border-border py-4"
                >
                  <span className="text-sm font-semibold">{book.title}</span>
                  <span className="text-xs text-text-secondary">{book.author}</span>
                  {book.note && (
                    <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                      {book.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
