import { generateMetadata } from "@/lib/farcaster-embed";
import Game2048 from "@/components/2048-game";

export { generateMetadata };

export default function Home() {
  return (
    <main className="flex flex-col gap-3 place-items-center place-content-center px-4 grow">
      <Game2048 />
    </main>
  );
}
