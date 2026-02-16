export interface Post {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
  tags: string[];
  body?: unknown[];
}

export interface Project {
  _id: string;
  title: string;
  description: string;
  tags: string[];
  url?: string;
  featured: boolean;
}
