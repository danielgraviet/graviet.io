export interface Post {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
  tags: string[];
  featured: boolean;
  externalUrl?: string;
  body?: string;
}

export interface Project {
  _id: string;
  title: string;
  description: string;
  tags: string[];
  url?: string;
  featured: boolean;
}
