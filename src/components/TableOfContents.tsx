import { useEffect, useState } from "react";

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  className?: string;
  headingSelector?: string;
}

/**
 * Table of Contents component that dynamically generates links to headings
 * and highlights the active section while scrolling
 */
export function TableOfContents({
  className = "",
  headingSelector = ".prose h1, .prose h2, .prose h3",
}: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // Find all headings in the article
    const articleHeadings = Array.from(
      document.querySelectorAll(headingSelector),
    );

    const items: TOCItem[] = articleHeadings
      .filter((heading) => heading.id) // Only include headings with IDs
      .map((heading) => {
        const id = heading.id;
        const text = heading.textContent || "";
        const level = Number(heading.tagName.substring(1)); // Extract level from H1, H2, etc.

        return { id, text, level };
      });

    setHeadings(items);

    // Set up intersection observer to highlight active section
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -66%" },
    );

    articleHeadings.forEach((heading) => {
      if (heading.id) {
        observer.observe(heading);
      }
    });

    return () => {
      articleHeadings.forEach((heading) => {
        if (heading.id) {
          observer.unobserve(heading);
        }
      });
    };
  }, [headingSelector]);

  if (headings.length < 2) return null;

  return (
    <div className={`toc ${className}`}>
      <h2 className="text-lg font-semibold mb-3">Table of Contents</h2>
      <nav aria-label="Table of contents">
        <ul className="space-y-1">
          {headings.map((heading) => (
            <li
              key={heading.id}
              style={{
                paddingLeft: `${(heading.level - 1) * 0.75}rem`,
              }}
            >
              <a
                href={`#${heading.id}`}
                className={`block py-1 text-sm hover:text-primary transition-colors ${
                  activeId === heading.id
                    ? "text-primary font-medium"
                    : "text-gray-600"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(heading.id)?.scrollIntoView({
                    behavior: "smooth",
                  });
                }}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
