import Image from "next/image";
import RestoList from "@/components/RestoList";

export default function Home() {
  return (
      <main style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
        <Image src={"/img.png"} alt="logo" width={600} height={600}/>
        <RestoList />
      </main>
  );
}
