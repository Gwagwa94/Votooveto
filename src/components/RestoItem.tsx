'use client'

import React from 'react'

function RestoItem(props: {resto: {
    name: string,
    url: string,
    upvotes: number,
    downvotes: number,}, restoId: number, handleVotes: Function}) {

    return <div style={{display: 'flex', flexDirection: 'row', width: 300, alignItems: 'center', justifyContent: 'space-between', fontSize: 20}}
                onClick={() => {if (props.resto.url === "") {

                } else {
                    window.open(props.resto.url, '_blank', 'noreferrer')
                }}}
    >
        <b>{props.resto.name ?? "what?"}</b>
        <div style={{display: 'flex', flexDirection: 'row', width: '30%', justifyContent: 'space-between'}}>
            <div style={{color: "#00aa69", display: 'flex', width: '50%', justifyContent: 'center', userSelect: 'none', cursor: 'pointer'}}
                 onClick={e => {
                     e.stopPropagation()
                     props.handleVotes(props.restoId, 1)
                 }}
                 onContextMenu={e => {
                     e.preventDefault()
                     e.stopPropagation()
                     props.handleVotes(props.restoId, 2)
                 }}
            >
                <b>{props.resto.upvotes}</b>
            </div>
            <div style={{color: "#f00", display: 'flex', width: '50%', justifyContent: 'center', userSelect: 'none', cursor: 'pointer'}}
                 onClick={e => {
                     e.stopPropagation()
                     props.handleVotes(props.restoId, -1)
                 }}
                onContextMenu={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    props.handleVotes(props.restoId, -2)
                }}>
                <b>
                    {props.resto.downvotes}
                </b>
            </div>
        </div>


    </div>
}

export default RestoItem;