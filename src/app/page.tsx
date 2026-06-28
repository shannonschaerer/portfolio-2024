import { getProfile, getExperiences } from '@/lib/strapi';
import Hero from '@/components/Hero/Hero';
import About from '@/components/About/About';
import Experience from '@/components/Experience/Experience';

export default async function Home() {
  const [profile, experiences] = await Promise.all([
    getProfile(),
    getExperiences(),
  ]);

  return (
    <>
      <Hero profile={profile} />
      <About about={profile.About} />
      <Experience experiences={experiences} />
    </>
  );
}
