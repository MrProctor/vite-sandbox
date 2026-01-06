import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PeerState {
    myPeerId: string | null;
    role: 'HOST' | 'CLIENT' | null;
    connections: { id: string; type?: string }[]; // List of connected peer IDs with metadata
    connectionStatus: 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'ERROR';
    error: string | null;
    messages: Message[];
    peerVideoStatus: Record<string, boolean>; // true = ON, false = OFF
}

export interface Message {
    id: string;
    senderId: string;
    role: 'ME' | 'OTHER';
    content: string;
    timestamp: number;
}

const initialState: PeerState = {
    myPeerId: null,
    role: null,
    connections: [],
    connectionStatus: 'IDLE',
    error: null,
    messages: [],
    peerVideoStatus: {}
};

const peerSlice = createSlice({
    name: 'peer',
    initialState,
    reducers: {
        setMyPeerId(state, action: PayloadAction<string>) {
            state.myPeerId = action.payload;
        },
        setRole(state, action: PayloadAction<'HOST' | 'CLIENT'>) {
            state.role = action.payload;
        },
        addConnection(state, action: PayloadAction<string>) {
            if (!state.connections.find(c => c.id === action.payload)) {
                state.connections.push({ id: action.payload, type: 'Connecting...' });
            }
        },
        updateConnectionType(state, action: PayloadAction<{ id: string, type: string }>) {
            const conn = state.connections.find(c => c.id === action.payload.id);
            if (conn) {
                conn.type = action.payload.type;
            }
        },
        removeConnection(state, action: PayloadAction<string>) {
            state.connections = state.connections.filter(c => c.id !== action.payload);
        },
        setConnectionStatus(state, action: PayloadAction<'IDLE' | 'CONNECTING' | 'CONNECTED' | 'ERROR'>) {
            state.connectionStatus = action.payload;
        },
        setError(state, action: PayloadAction<string | null>) {
            state.error = action.payload;
        },
        addMessage(state, action: PayloadAction<Message>) {
            state.messages.push(action.payload);
        },
        setPeerVideoStatus(state, action: PayloadAction<{ id: string, enabled: boolean }>) {
            state.peerVideoStatus[action.payload.id] = action.payload.enabled;
        },
        resetPeerState() {
            return initialState;
        }
    },
});

export const { setMyPeerId, setRole, addConnection, updateConnectionType, removeConnection, setConnectionStatus, setError, addMessage, setPeerVideoStatus, resetPeerState } = peerSlice.actions;
export default peerSlice.reducer;
