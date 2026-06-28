import { getProfile } from '@/lib/strapi';
import Hero from '@/components/Hero/Hero';
import About from '@/components/About/About';

export default async function Home() {
  const profile = await getProfile();

  return (
    <>
      <Hero profile={profile} />
      <About about={profile.About} />
    </>
  );
}
