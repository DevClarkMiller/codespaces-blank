import React, { Dispatch, SetStateAction, createContext, useEffect, useState } from 'react';
import { NavigateFunction, useNavigate } from 'react-router-dom';
import { Socket } from 'socket.io-client';


// Custom hooks
import { useSocket } from '../hooks/useSocket';

type JoinedUser = {
    name?: string; // If not provided, a random one will be generated
    roomId: string;
}

type Room = {
    id: string;
    url: string;
}

export type SocketContextType = {
    // State
    isConnected: boolean;
    events: any[];
    currentRoom: Room | undefined;
    loading: boolean;

    // State setters
    setIsConnected: Dispatch<SetStateAction<boolean>>;
    setEvents: Dispatch<React.SetStateAction<any[]>>;
    setCurrentRoom: Dispatch<SetStateAction<Room | undefined>>;
    setLoading: Dispatch<React.SetStateAction<boolean>>;


    // Functions
    joinRoom: (name: string, roomId: string) => void;
    createRoom: (hostName: string) => void;
}

export const SocketContext = createContext<SocketContextType>({
    loading: true,
    currentRoom: undefined,
    isConnected: false,
    events: [],
    joinRoom: () => {},
    createRoom: () => {},
    setIsConnected: () => {}, 
    setEvents: () => {},
    setCurrentRoom: () => {},
    setLoading: () => {}
});
function SocketProvider({children}: {children: React.ReactNode}) {
    const navigate: NavigateFunction = useNavigate();

    const socket: Socket = useSocket(process.env.SERVER_URL as string || "http://localhost:5170");
    const [isConnected, setIsConnected] = useState<boolean>(socket?.connected);
    const [loading, setLoading] = useState<boolean>(false);
    const [currentRoom, setCurrentRoom] = useState<Room | undefined>(undefined);
    const [events, setEvents] = useState<any[]>([]);

    function joinRoom(name: string, roomId: string){
        console.log("NOW GOING TO JOIN ROOM");
        if (!isConnected) socket?.connect();
        const joinedUser: JoinedUser = {name, roomId};
        socket.emit("joinRoom", joinedUser);
    }

    function createRoom(hostName: string){
        setLoading(true);
        socket.emit("createRoom", hostName);
    }

    useEffect(() =>{
        function onConnect(){
            setIsConnected(true);
        }

        function onDisconnect() {
            setIsConnected(false);
        }

        function createdRoom(room: Room){
            setCurrentRoom(room);
            setLoading(false);
            navigate('/manageRoom');
            console.log(room);
        }

        function onUserJoined(value: any){
            console.log(value);
        }

        function roomNotFound(msg: string){
            alert(msg);
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('userJoined', onUserJoined);
        socket.on('createdRoom', createdRoom);
        socket.on('roomNotFound', roomNotFound);

        return () =>{
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('userJoined', onUserJoined);
            socket.off('createdRoom', createdRoom);
            socket.off('roomNotFound', roomNotFound);
        }

    }, []);

    return (
        <SocketContext.Provider value={{
            loading, setLoading,
            events, setEvents, 
            isConnected, setIsConnected, 
            joinRoom, createRoom,
            currentRoom, setCurrentRoom
        }}>
            {children}
        </SocketContext.Provider>
    );
}

export default SocketProvider;