// Strapi v5 REST API response envelopes
export type StrapiSingle<T> = {
  data: T;
  meta: Record<string, unknown>;
};

export type StrapiCollection<T> = {
  data: T[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
};

// Media object returned for Image fields
export type StrapiImage = {
  id: number;
  url: string;
  alternativeText: string | null;
  width: number | null;
  height: number | null;
};

// Shared component types
export type Badge = {
  id: number;
  Label: string | null;
  Color: string | null;
};

export type Button = {
  id: number;
  Label: string | null;
  URL: string | null;
};

export type Tags = {
  id: number;
  Development: boolean | null;
  Design: boolean | null;
  Collaboration: boolean | null;
  Other: boolean | null;
  Collaborators: string | null;
};

// Content types
export type Project = {
  id: number;
  documentId: string;
  Name: string;
  Description: string | null;
  Featured: boolean | null;
  Image: StrapiImage | null;
  Year: string | null;
  Tags: Tags | null;
  Badge: Badge[];
  Button: Button | null;
};

export type Experience = {
  id: number;
  documentId: string;
  Company: string | null;
  Role: string | null;
  StartDate: string | null;
  EndDate: string | null;
  Location: string | null;
  Responsibilities: string | null;
  Badges: Badge[];
};

export type Testimonial = {
  id: number;
  documentId: string;
  Quote: string | null;
  QuoteOriginal: string | null;
  Translated: boolean | null;
  Author: string | null;
  Company: string | null;
  Role: string | null;
  Year: string | null;
  Order: number | null;
};

export type Profile = {
  id: number;
  documentId: string;
  Name: string | null;
  Role: string | null;
  Tagline: string | null;
  About: string | null;
  Email: string | null;
  Github: { id: number; URL: string | null } | null;
  LinkedIn: { id: number; URL: string | null } | null;
  // Logo.Logo (nested image) requires a deeper populate query — handled in getProfile()
  Logo: { id: number; Label: string | null; Logo: StrapiImage | null } | null;
  Availability: Array<{
    id: number;
    openToWork: boolean | null;
    freelanceAvailable: boolean | null;
    notAvailable: boolean | null;
  }>;
};
