'use client'

import Image from "next/image";
import RestoList from "@/components/RestoList";
// import {Button} from "@mui/material";
// import {getVotes} from "@/app/api/votes";

export default function Home() {
  return (
      <main style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
        <Image src={"/img.png"} alt="logo" width={600} height={600}/>
        <RestoList />
          {/*<Button onClick={async () => {console.log(await getVotes('myuser'))}}/>*/}
      </main>
  );
}
