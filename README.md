# graviet.io

Personal portfolio and blog site.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **CMS**: [Sanity v5](https://www.sanity.io) with embedded Studio at `/studio`
- **Icons**: Lucide React

## Project Structure

```
src/
├── app/
│   ├── about/
│   ├── blog/
│   ├── contact/
│   ├── projects/
│   ├── studio/        # Sanity Studio
│   ├── api/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   ├── BlogCard.tsx
│   ├── ProjectCard.tsx
│   └── ...
├── lib/               # Utilities
└── sanity/            # Sanity schemas and client config
```

## Getting Started

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site, or [http://localhost:3000/studio](http://localhost:3000/studio) for the Sanity Studio.

## Scripts

| Command       | Description              |
|---------------|--------------------------|
| `bun dev`     | Start development server |
| `bun build`   | Build for production     |
| `bun start`   | Start production server  |
| `bun lint`    | Run ESLint               |
