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
        title: "Crossing the Chasm",
        author: "Geoffrey A. Moore",
      },
    ],
  },
  {
    heading: "Favorites",
    books: [
      {
        title: "Unreasonable Hospitality",
        author: "Will Guidara",
      },
      {
        title: "Deep Work",
        author: "Cal Newport",
        note: "Why focused work is the real competitive advantage.",
      },
      {
        title: "Essentialism",
        author: "Greg McKeown",
        note: "Focusing on the essential and eliminating the non-essential.",
      },
      {
        title: "Atomic Habits",
        author: "James Clear",
        note: "Small changes, big results.",
      },
    ],
  },
  {
    heading: "Want to Read",
    books: [
      { title: "Effortless", author: "Greg McKeown" },
      { title: "Outliers", author: "Malcolm Gladwell" },
      { title: "Fahrenheit 451", author: "Ray Bradbury" },
      { title: "1984", author: "George Orwell" },
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
            <p className="mb-4 text-sm font-semibold text-text-secondary">
              {section.heading}
            </p>
            <div className="border-t border-border">
              {section.books.map((book) => (
                <div
                  key={book.title}
                  className="flex flex-col gap-0.5 border-b border-border py-4"
                >
                  <span className="text-base font-semibold">{book.title}</span>
                  <span className="text-sm text-text-secondary">{book.author}</span>
                  {book.note && (
                    <p className="mt-1 text-sm leading-relaxed text-text-secondary">
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
