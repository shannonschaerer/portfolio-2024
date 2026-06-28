import { getProfile, getProjects, getExperiences } from '@/lib/strapi';
import Hero from '@/components/Hero/Hero';

export default async function Home() {
  const [profile, projects, experiences] = await Promise.all([
    getProfile(),
    getProjects(),
    getExperiences(),
  ]);

  return (
    <>
      <Hero profile={profile} />

      {/* Temporary debug output — will be replaced as sections are built */}
      <div>
        <h2>Profile</h2>
        <pre>{JSON.stringify(profile, null, 2)}</pre>

        <h2>Projects ({projects.length})</h2>
        <pre>{JSON.stringify(projects, null, 2)}</pre>

        <h2>Experiences ({experiences.length})</h2>
        <pre>{JSON.stringify(experiences, null, 2)}</pre>
      </div>
    </>
  );
}
