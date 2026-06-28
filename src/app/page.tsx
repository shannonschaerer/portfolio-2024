import { getProfile } from '@/lib/strapi';
import Hero from '@/components/Hero/Hero';

export default async function Home() {
  const profile = await getProfile();

  return <Hero profile={profile} />;
}
