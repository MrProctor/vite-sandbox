import { useEffect, useRef, useState } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { useDispatch, useSelector } from 'react-redux';
import { setMyPeerId, addConnection, removeConnection, setError, setConnectionStatus, addMessage } from '../store/peerSlice';
import { RootState } from '../store';

export const usePeer = () => {
    const dispatch = useDispatch();
    const peerRef = useRef<Peer | null>(null);
    const [peerInstance, setPeerInstance] = useState<Peer | null>(null);
    const { myPeerId } = useSelector((state: RootState) => state.peer);

    const handleConnection = (conn: DataConnection) => {
        conn.on('open', () => {
            console.log('Connection opened with:', conn.peer);
            dispatch(addConnection(conn.peer));
            dispatch(setConnectionStatus('CONNECTED'));
        });

        conn.on('data', (data: any) => {
            console.log('Received data:', data);
            if (data && data.type === 'MESSAGE') {
                dispatch(addMessage({
                    id: crypto.randomUUID(),
                    senderId: conn.peer,
                    role: 'OTHER',
                    content: data.content,
                    timestamp: Date.now()
                }));
            }
        });

        conn.on('close', () => {
            console.log('Connection closed with:', conn.peer);
            dispatch(removeConnection(conn.peer));
        });

        conn.on('error', (err) => {
            console.error('Connection error:', err);
            dispatch(setError(err.message));
        });
    };

    useEffect(() => {
        // Only initialize if we haven't already
        if (peerRef.current) return;

        const peer = new Peer({
            host: 'signaling-server-6127.azurewebsites.net',
            port: 443,
            secure: true,
            config: {
                iceServers: [
                    {
                        urls: [
                            'stun:stun1.l.google.com:19302',
                            'stun:stun2.l.google.com:19302',
                        ],
                    },
                ],
            },
        });
        peerRef.current = peer;
        setPeerInstance(peer);

        peer.on('open', (id) => {
            console.log('My peer ID is: ' + id);
            dispatch(setMyPeerId(id));
            dispatch(setError(null));
        });

        peer.on('connection', (conn) => {
            console.log('Incoming connection:', conn.peer);
            // Handle incoming connection
            handleConnection(conn);
        });

        peer.on('error', (err) => {
            console.error('Peer error:', err);
            dispatch(setError(err.message));
            dispatch(setConnectionStatus('ERROR'));
        });

        return () => {
            // Cleanup is tricky with PeerJS in React strict mode / hot reload
            // We often want to keep the peer alive or handle destruction carefully
            // For this demo, we might not destroy it immediately on every re-render to avoid ID thrashing
            // peer.destroy();
        };
    }, [dispatch]);

    const connectToHost = (hostId: string) => {
        if (!peerInstance || !hostId) return;

        dispatch(setConnectionStatus('CONNECTING'));
        const conn = peerInstance.connect(hostId);
        handleConnection(conn);
    };

    const sendMessage = (content: string) => {
        if (!peerInstance || !content.trim()) return;

        const messagePayload = {
            type: 'MESSAGE',
            content,
            senderId: myPeerId
        };

        // Broadcast to all connections
        // peerInstance.connections is an object: { [peerId]: Connection[] }
        Object.values(peerInstance.connections).forEach((conns: any) => {
            if (Array.isArray(conns)) {
                conns.forEach((conn) => {
                    if (conn.open) {
                        conn.send(messagePayload);
                    }
                });
            }
        });

        // Add to own state
        dispatch(addMessage({
            id: crypto.randomUUID(),
            senderId: myPeerId || 'ME',
            role: 'ME',
            content,
            timestamp: Date.now()
        }));
    };

    return {
        peer: peerInstance,
        myPeerId,
        connectToHost,
        sendMessage
    };
};
