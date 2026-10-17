import { getProfile, getExperiences, getTestimonials, getFeaturedProjects } from '@/lib/strapi';
import Hero from '@/components/Hero/Hero';
import About from '@/components/About/About';
import Experience from '@/components/Experience/Experience';
import Testimonials from '@/components/Testimonials/Testimonials';
import Projects from '@/components/Projects/Projects';

export default async function Home() {
  const [profile, experiences, testimonials, featuredProjects] = await Promise.all([
    getProfile(),
    getExperiences(),
    getTestimonials().catch(() => []),
    getFeaturedProjects().catch(() => []),
  ]);

  return (
    <>
      <Hero profile={profile} />
      <About about={profile.About} />
      <Experience experiences={experiences} />
      <Testimonials testimonials={testimonials} />
      <Projects projects={featuredProjects} />
    </>
  );
}
