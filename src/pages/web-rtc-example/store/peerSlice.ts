import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PeerState {
  myPeerId: string | null;
  role: 'HOST' | 'CLIENT' | null;
  connections: string[]; // List of connected peer IDs
  connectionStatus: 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'ERROR';
  error: string | null;
  messages: Message[];
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
            if (!state.connections.includes(action.payload)) {
                state.connections.push(action.payload);
            }
        },
        removeConnection(state, action: PayloadAction<string>) {
            state.connections = state.connections.filter(id => id !== action.payload);
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
        resetPeerState() {
            return initialState;
        }
    },
});

export const { setMyPeerId, setRole, addConnection, removeConnection, setConnectionStatus, setError, addMessage, resetPeerState } = peerSlice.actions;
export default peerSlice.reducer;
