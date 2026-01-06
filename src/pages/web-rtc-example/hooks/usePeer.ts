import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as signalR from '@microsoft/signalr';
import { RootState } from '../store';
import { setMyPeerId, addConnection, removeConnection, setError, setConnectionStatus, addMessage } from '../store/peerSlice';

const SIGNALING_URL = 'https://signaling-server-2032.azurewebsites.net/signal';

const RTC_CONFIG: RTCConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

export const usePeer = () => {
    const dispatch = useDispatch();
    const { myPeerId } = useSelector((state: RootState) => state.peer);

    // Store SignalR connection
    const hubConnectionRef = useRef<signalR.HubConnection | null>(null);

    // Store RTCPeerConnections: peerId -> RTCPeerConnection
    const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

    // Store DataChannels: peerId -> RTCDataChannel
    const dataChannelsRef = useRef<Map<string, RTCDataChannel>>(new Map());

    // Helper to create or get RTCPeerConnection
    const getOrCreateConnection = useCallback((remotePeerId: string, isInitiator: boolean) => {
        if (peerConnectionsRef.current.has(remotePeerId)) {
            return peerConnectionsRef.current.get(remotePeerId)!;
        }

        console.log(`Creating RTCPeerConnection for ${remotePeerId}`);
        const pc = new RTCPeerConnection(RTC_CONFIG);
        peerConnectionsRef.current.set(remotePeerId, pc);

        pc.onicecandidate = (event) => {
            if (event.candidate && hubConnectionRef.current) {
                console.log('Sending ICE candidate');
                hubConnectionRef.current.invoke('SendIce', remotePeerId, JSON.stringify(event.candidate))
                    .catch(err => console.error('Error sending ICE:', err));
            }
        };

        pc.onconnectionstatechange = () => {
            console.log(`Connection state with ${remotePeerId}: ${pc.connectionState}`);
            if (pc.connectionState === 'connected') {
                dispatch(addConnection(remotePeerId));
                dispatch(setConnectionStatus('CONNECTED'));
            } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'closed') {
                dispatch(removeConnection(remotePeerId));
                peerConnectionsRef.current.delete(remotePeerId);
                dataChannelsRef.current.delete(remotePeerId);
            } else if (pc.connectionState === 'failed') {
                dispatch(setConnectionStatus('ERROR'));
                dispatch(setError(`Connection failed with ${remotePeerId}`));
            }
        };

        if (isInitiator) {
            // Create Data Channel if we are the initiator
            const dc = pc.createDataChannel("chat");
            setupDataChannel(remotePeerId, dc);
        } else {
            // Listen for Data Channel if we are the receiver
            pc.ondatachannel = (event) => {
                setupDataChannel(remotePeerId, event.channel);
            };
        }

        return pc;
    }, [dispatch]);

    const setupDataChannel = (remotePeerId: string, dc: RTCDataChannel) => {
        dc.onopen = () => {
            console.log(`DataChannel open with ${remotePeerId}`);
            dataChannelsRef.current.set(remotePeerId, dc);
        };

        dc.onmessage = (event) => {
            console.log('Received message:', event.data);
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'MESSAGE') {
                    dispatch(addMessage({
                        id: crypto.randomUUID(),
                        senderId: remotePeerId,
                        role: 'OTHER',
                        content: data.content,
                        timestamp: Date.now()
                    }));
                }
            } catch (e) {
                console.error('Failed to parse message:', e);
            }
        };

        dc.onclose = () => {
            console.log(`DataChannel closed with ${remotePeerId}`);
            dataChannelsRef.current.delete(remotePeerId);
        };
    };

    // Initialize SignalR
    useEffect(() => {
        if (hubConnectionRef.current) return;

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(SIGNALING_URL, {
                skipNegotiation: true,
                transport: signalR.HttpTransportType.WebSockets
            })
            .configureLogging(signalR.LogLevel.Debug)
            .withAutomaticReconnect()
            .build();

        connection.start()
            .then(async () => {
                console.log('SignalR Connected');

                // Manually get connection ID since we skipped negotiation
                try {
                    const id = await connection.invoke<string>('GetConnectionId');
                    console.log('My Connection ID:', id);
                    dispatch(setMyPeerId(id));
                    dispatch(setError(null));
                } catch (e: any) {
                    console.error('Failed to get connection ID:', e);
                    dispatch(setError(`Failed to get ID: ${e.message}`));
                }
            })
            .catch(err => {
                console.error('SignalR Connection Error: ', err);
                dispatch(setError(`SignalR Error: ${err.message}`));
                dispatch(setConnectionStatus('ERROR'));
            });

        // Handle incoming Offer
        connection.on('ReceiveOffer', async (senderId: string, offerJson: string) => {
            console.log('Received Offer from:', senderId);
            const offer = JSON.parse(offerJson);
            const pc = getOrCreateConnection(senderId, false);

            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await connection.invoke('SendAnswer', senderId, JSON.stringify(answer));
        });

        // Handle incoming Answer
        connection.on('ReceiveAnswer', async (senderId: string, answerJson: string) => {
            console.log('Received Answer from:', senderId);
            const answer = JSON.parse(answerJson);
            const pc = getOrCreateConnection(senderId, true); // We must have been the initiator
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
        });

        // Handle incoming ICE
        connection.on('ReceiveIce', async (senderId: string, candidateJson: string) => {
            console.log('Received ICE from:', senderId);
            const candidate = JSON.parse(candidateJson);
            const pc = getOrCreateConnection(senderId, false); // Doesn't matter if initiator or not here
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        });

        hubConnectionRef.current = connection;

        return () => {
            connection.stop();
        };
    }, [dispatch, getOrCreateConnection]);

    const connectToHost = async (hostId: string) => {
        if (!hubConnectionRef.current || !hostId) return;

        if (hubConnectionRef.current.state !== signalR.HubConnectionState.Connected) {
            alert('Connection not ready yet. Please wait a moment.');
            return;
        }

        dispatch(setConnectionStatus('CONNECTING'));
        console.log('Connecting to host:', hostId);

        const pc = getOrCreateConnection(hostId, true);

        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            await hubConnectionRef.current.invoke('SendOffer', hostId, JSON.stringify(offer));
        } catch (err: any) {
            console.error('Error creating offer:', err);
            dispatch(setError(err.message));
        }
    };

    const sendMessage = (content: string) => {
        if (!content.trim()) return;

        const messagePayload = {
            type: 'MESSAGE',
            content,
            senderId: myPeerId
        };
        const payloadStr = JSON.stringify(messagePayload);

        // Send to all open data channels
        dataChannelsRef.current.forEach((dc) => {
            if (dc.readyState === 'open') {
                dc.send(payloadStr);
            }
        });

        // Add to own state only once
        dispatch(addMessage({
            id: crypto.randomUUID(),
            senderId: myPeerId || 'ME',
            role: 'ME',
            content,
            timestamp: Date.now()
        }));
    };

    return {
        myPeerId,
        connectToHost,
        sendMessage
    };
};
