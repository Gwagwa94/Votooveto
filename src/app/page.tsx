'use client'

import Image from "next/image";
import RestoList from "@/components/RestoList";
import {Button} from "@mui/material";
import { useSession, signIn, signOut } from "next-auth/react"; // Import from next-auth
// import {getVotes} from "@/app/api/votes";

export default function Home() {
  const { data: session } = useSession();

  return (
    <main style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
      <div style={{ padding: '2%', marginBottom: "-4%", display: 'flex', justifyContent: 'flex-end', alignItems: 'center', width: "100%"}}>
        {session ? (
          <>
            <span style={{ marginRight: '1rem' }}>Signed in as {session.user?.email}</span>
            <Button variant="contained" onClick={() => signOut()}>Sign Out</Button>
          </>
        ) : (
          <Button variant="contained" onClick={() => signIn('google')}>Sign In with Google</Button>
        )}
      </div>
      <Image src={"/img.png"} alt="logo" width={600} height={600}/>
      <RestoList />
        {/*<Button onClick={async () => {console.log(await getVotes('myuser'))}}/>*/}
    </main>
  );
}
