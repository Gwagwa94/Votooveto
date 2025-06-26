'use client'

import React, {useState} from 'react'
import { IconButton } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RestoItem from "./RestoItem"
import Image from "next/image";

function RestoList() {
    const [restos, setRestos] = useState([
        {
            name: "Italian bug",
            url: "https://wikipedia.org/wiki/Insect",
            upvotes: 0,
            downvotes: 0,
        },
        {
            name: "Tierra Burrito",
            url: "https://www.tierraburritos.com/",
            upvotes: 0,
            downvotes: 0,
        }
    ])
    const [newName, setNewName] = useState("")
    function handleVotes(id: number, vote: number) {
        const nextRestos = restos.map((resto, i) => {
            if (i === id) {
                if (vote === 1) resto.upvotes += 1
                else if (vote === 2 && resto.upvotes > 0) resto.upvotes -= 1
                else if (vote === -1) resto.downvotes += 1
                else if (vote === -2 && resto.downvotes > 0) resto.downvotes -= 1
            }
            return resto
        })
        setRestos(nextRestos)
    }
    function addResto() {
        setRestos([...restos, {name: newName, url: "", upvotes: 0, downvotes: 0}])
        setNewName("")
    }
    return <div style={{display: 'flex', flexDirection: 'column', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', color:'black'}}>
        <Image src={"/img.png"} alt="logo" width={600} height={600}/>
        {restos.map((resto, id) => <RestoItem key={id} resto={resto} restoId={id} handleVotes={handleVotes} />)}
        <div style={{display: 'flex', width: 300, alignItems: 'center', justifyContent: 'space-between'}}>
            <input style={{height: 20, width:'100%'}} value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => {if (e.key === 'Enter') {addResto()}}}/>
            <IconButton size="large">
                <AddIcon color="action" onClick={addResto} />
            </IconButton>
        </div>
    </div>
}

export default RestoList;