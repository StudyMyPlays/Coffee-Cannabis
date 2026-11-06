import { Hero } from "@/components/sections/Hero";
import { NextGathering } from "@/components/sections/NextGathering";
import { WhyClub } from "@/components/sections/WhyClub";
import { Rituals } from "@/components/sections/Rituals";
import { Community } from "@/components/sections/Community";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { FoundingMembers } from "@/components/sections/FoundingMembers";
import { PastGatherings } from "@/components/sections/PastGatherings";
import { FinalJoin } from "@/components/sections/FinalJoin";
import { getDataAdapter } from "@/lib/data";
import { getNextGathering, getPastGatherings, getPublicDrinks, getSecretDrinks } from "@/lib/data/public";

/** Static shell refreshed every minute; RSVP counts also refresh client-side. Admin saves revalidate immediately. */
export const revalidate = 60;

export default async function HomePage() {
  const adapter = getDataAdapter();
  const now = Date.now();
  const [next, past, drinks, secrets, memberCount] = await Promise.all([
    getNextGathering(adapter, now),
    getPastGatherings(adapter, now),
    getPublicDrinks(adapter),
    getSecretDrinks(adapter),
    adapter.countMembers(),
  ]);

  return (
    <>
      <Hero next={next} />
      <NextGathering gathering={next} now={now} />
      <WhyClub />
      <Rituals drinks={drinks} secret={secrets[0] ?? null} />
      <Community />
      <HowItWorks />
      <FoundingMembers memberCount={memberCount} />
      <PastGatherings past={past} drinks={drinks} />
      <FinalJoin />
    </>
  );
}
