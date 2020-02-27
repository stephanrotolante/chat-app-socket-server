import React, {useState, useEffect, useRef} from 'react';
import io from 'socket.io-client';

import {getUUID} from './util/getUUID';


export default () => {

    const [id] = useState(getUUID());
    const [text,setText] = useState('');
    const { current: socket } = useRef(io("/"));
    const [messages,setMessages] = useState([])
    const [isMatched,setIsMatched] = useState(false);


    // Tells client that a match has been made
    socket.on('match-found',() => {
        setIsMatched(true);
        setMessages([]);
    });

    window.addEventListener("beforeunload", () => {  
        socket.emit('client-disconnected', id);
    });

    socket.on('partner-disconnected',() => {
        setIsMatched(false);

    });

    socket.on('message', text => {

        let temp = [...messages];

        temp.push({name: 'Stranger', message:text});

        setMessages(temp);
    })


    useEffect(() => {
        console.log("Mounted");

        // Creates new instance of client in the server
        socket.emit('new-client',id);

    }, []);

   

    const handleInputChange = ({target:{value}}) => {

        setText(value);

    }

    const handleSubmit = () => {

        if(isMatched){
             // Sends message to the server
            socket.emit("message",{id,message:text});

            setText('');

            let temp = [...messages];

            temp.push({name: 'Me', message:text});

            setMessages(temp);
        }
    }

    const handleNewPartner = () => {

        setIsMatched(false);

        socket.emit('find-new-match', id)
    }

    const Loading = () => {
        if(isMatched){
            return (
                <div>
                    Pair has been found
                </div>
            );
        } else {
            return (
                <div>
                    Looking for pair
                </div>
            );
        }
    }
    return (
        <div>
            <Loading />
            <input type="text" value={text} onChange={handleInputChange}/>
            <button onClick={handleSubmit}>Submit</button>
            <button onClick={handleNewPartner}>New Partner</button>
            {messages.map(({name,message},index) => {
                return (
                    <div key={index}>
                        {name}: {message}
                    </div>
                )
            })}
        </div>
    );
};