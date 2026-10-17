import type { StrapiSingle, StrapiCollection, Profile, Project, Experience, Testimonial } from './types';

const STRAPI_URL = process.env.STRAPI_URL;
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

async function fetchStrapi<T>(path: string): Promise<T> {
  if (!STRAPI_URL || !STRAPI_API_TOKEN) {
    throw new Error('STRAPI_URL and STRAPI_API_TOKEN must be set in .env');
  }

  const res = await fetch(`${STRAPI_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${STRAPI_API_TOKEN}`,
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`Strapi request failed: ${res.status} ${res.statusText} — ${path}`);
  }

  return res.json() as Promise<T>;
}

export async function getProfile(): Promise<Profile> {
  const res = await fetchStrapi<StrapiSingle<Profile>>(
    '/api/profile?populate[Logo][populate]=*&populate[Github]=*&populate[LinkedIn]=*&populate[Availability]=*'
  );
  return res.data;
}

export async function getFeaturedProjects(): Promise<Project[]> {
  const res = await fetchStrapi<StrapiCollection<Project>>(
    '/api/projects?populate=*&filters[Featured][$eq]=true'
  );
  return res.data;
}

export async function getExperiences(): Promise<Experience[]> {
  const res = await fetchStrapi<StrapiCollection<Experience>>(
    '/api/experiences?populate=*&sort=StartDate:desc'
  );
  return res.data;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const res = await fetchStrapi<StrapiCollection<Testimonial>>(
    '/api/testimonials?sort=Order:asc'
  );
  return res.data;
}
