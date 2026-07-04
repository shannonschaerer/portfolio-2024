import { getProfile, getExperiences, getTestimonials } from '@/lib/strapi';
import Hero from '@/components/Hero/Hero';
import About from '@/components/About/About';
import Experience from '@/components/Experience/Experience';
import Testimonials from '@/components/Testimonials/Testimonials';

export default async function Home() {
  const [profile, experiences, testimonials] = await Promise.all([
    getProfile(),
    getExperiences(),
    getTestimonials().catch(() => []),
  ]);

  return (
    <>
      <Hero profile={profile} />
      <About about={profile.About} />
      <Experience experiences={experiences} />
      <Testimonials testimonials={testimonials} />
    </>
  );
}
