import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from './store';
import { setRole } from './store/peerSlice';
import { usePeer } from './hooks/usePeer';

export default function WebRTCChat() {
    const dispatch = useDispatch();
    const { myPeerId, role, connections, connectionStatus, error, messages } = useSelector((state: RootState) => state.peer);
    const { connectToHost, sendMessage, startVideo, localStream, remoteStreams } = usePeer();
    const [hostIdInput, setHostIdInput] = useState('');
    const [messageInput, setMessageInput] = useState('');

    const handleRoleSelect = (selectedRole: 'HOST' | 'CLIENT') => {
        dispatch(setRole(selectedRole));
    };

    const onConnect = () => {
        connectToHost(hostIdInput);
    };

    const onSendMessage = () => {
        sendMessage(messageInput);
        setMessageInput('');
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-gray-900 text-white">
            <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
                <h1 className="text-4xl font-bold mb-8 text-center text-blue-400">Peer Logic Redux Integration</h1>

                {error && (
                    <div className="bg-red-500 text-white p-4 rounded mb-4">
                        Error: {error}
                    </div>
                )}

                <div className="mb-8 p-6 bg-gray-800 rounded-lg border border-gray-700 flex justify-between items-center">
                    <div>
                        <p className="mb-2 text-gray-400">My Peer ID:</p>
                        <p className="text-xl font-bold text-green-400 break-all">{myPeerId || 'Initializing...'}</p>
                    </div>
                </div>

                {!role ? (
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={() => handleRoleSelect('HOST')}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-lg font-semibold transition"
                        >
                            I am HOST
                        </button>
                        <button
                            onClick={() => handleRoleSelect('CLIENT')}
                            className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg text-lg font-semibold transition"
                        >
                            I am CLIENT
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center w-full">
                        <h2 className="text-2xl mb-6">Role: <span className={role === 'HOST' ? 'text-blue-400' : 'text-purple-400'}>{role}</span></h2>

                        {role === 'CLIENT' && (
                            <div className="flex gap-2 mb-8">
                                <input
                                    type="text"
                                    placeholder="Enter Host ID"
                                    value={hostIdInput}
                                    onChange={(e) => setHostIdInput(e.target.value)}
                                    className="px-4 py-2 rounded text-black w-64"
                                />
                                <button
                                    onClick={onConnect}
                                    disabled={connectionStatus === 'CONNECTED' || connectionStatus === 'CONNECTING'}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded disabled:opacity-50"
                                >
                                    {connectionStatus === 'CONNECTING' ? 'Connecting...' : 'Connect'}
                                </button>
                            </div>
                        )}

                        <div className="flex flex-col gap-6 w-full max-w-6xl">
                            {/* Connections & Video Grid */}
                            <div className="w-full bg-gray-800 p-6 rounded-lg">
                                <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-2">
                                    <h3 className="text-2xl font-bold">Connections & Video</h3>
                                    <div className="text-sm text-gray-400">
                                        Status: <span className={connectionStatus === 'CONNECTED' ? 'text-green-400' : 'text-yellow-400'}>{connectionStatus}</span>
                                    </div>
                                </div>

                                {connections.length === 0 ? (
                                    <p className="text-gray-500 italic text-center py-8">No connections yet. Waiting for peers...</p>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {/* Local Video Card - Moved here for "Bigger Picture" feel */}
                                        <div className="bg-gray-700 rounded-lg overflow-hidden flex flex-col shadow-lg border border-gray-600">
                                            <div className="bg-gray-900 px-4 py-2 flex justify-between items-center">
                                                <span className="font-bold text-green-400">Me ({role})</span>
                                            </div>
                                            <div className="aspect-video bg-black relative">
                                                {localStream ? (
                                                    <Video stream={localStream} muted={true} allowUnmute={false} />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-4">
                                                        <span>Camera Off</span>
                                                        {connectionStatus === 'CONNECTED' && (
                                                            <button
                                                                onClick={startVideo}
                                                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded font-semibold text-white transition shadow-lg"
                                                            >
                                                                Start Video
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {connections.map((conn) => (
                                            <div key={conn.id} className="bg-gray-700 rounded-lg overflow-hidden flex flex-col shadow-lg border border-gray-600">
                                                <div className="bg-gray-900 px-4 py-2 flex justify-between items-center text-xs">
                                                    <div className="flex items-center gap-2 text-gray-300 break-all truncate max-w-[150px]">
                                                        <span className="w-2 h-2 min-w-[8px] rounded-full bg-green-500"></span>
                                                        {conn.id}
                                                    </div>
                                                    <div className={`uppercase border rounded px-1 font-bold ${conn.type === 'STUN' ? 'border-yellow-500 text-yellow-500' :
                                                        conn.type === 'TURN' ? 'border-red-500 text-red-500' :
                                                            'border-blue-500 text-blue-500'
                                                        }`}>
                                                        {conn.type || 'CONN'}
                                                    </div>
                                                </div>

                                                <div className="aspect-video bg-black relative">
                                                    {remoteStreams[conn.id] ? (
                                                        <Video stream={remoteStreams[conn.id]} muted={false} allowUnmute={true} />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-500 italic">
                                                            No Video
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Chat Panel - Full Width below videos */}
                            <div className="w-full bg-gray-800 p-6 rounded-lg flex flex-col h-[300px]">
                                <h3 className="text-xl mb-4 border-b border-gray-700 pb-2">Chat</h3>

                                <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-2 bg-gray-900 rounded">
                                    {messages.length === 0 ? (
                                        <p className="text-gray-500 italic text-center mt-4">No messages yet. Say hello!</p>
                                    ) : (
                                        messages.map((msg) => (
                                            <div key={msg.id} className={`flex flex-col ${msg.role === 'ME' ? 'items-end' : 'items-start'}`}>
                                                <div className={`max-w-[80%] px-4 py-2 rounded-lg ${msg.role === 'ME' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                                                    {msg.content}
                                                </div>
                                                <span className="text-xs text-gray-500 mt-1">
                                                    {msg.role === 'ME' ? 'You' : 'Peer'} • {new Date(msg.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Type a message..."
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && onSendMessage()}
                                        disabled={connectionStatus !== 'CONNECTED' && connections.length === 0}
                                        className="flex-1 px-4 py-2 rounded text-black disabled:opacity-50"
                                    />
                                    <button
                                        onClick={onSendMessage}
                                        disabled={!messageInput.trim() || (connectionStatus !== 'CONNECTED' && connections.length === 0)}
                                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

const Video = ({ stream, muted = false, allowUnmute = true }: { stream: MediaStream, muted?: boolean, allowUnmute?: boolean }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isMuted, setIsMuted] = useState(muted);

    useEffect(() => {
        setIsMuted(muted);
    }, [muted]);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="relative w-full h-full group">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isMuted} // Controlled by state
                className="w-full h-full object-cover bg-black"
            />
            {allowUnmute && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsMuted(!isMuted);
                    }}
                    className="absolute bottom-2 right-2 p-1.5 bg-gray-900/80 hover:bg-gray-700 rounded-full text-white transition-opacity opacity-0 group-hover:opacity-100"
                    title={isMuted ? "Unmute" : "Mute"}
                >
                    {isMuted ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-red-400">
                            <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 2.485.637 4.819 1.751 6.84.254.44.757.705 1.259.664h1.94c.583 0 1.137.234 1.549.646l4.5 4.5c.944.945 2.56.276 2.56-1.06V4.06zM17.78 9.22a.75.75 0 10-1.06 1.06L18.44 12l-1.72 1.72a.75.75 0 101.06 1.06l1.72-1.72 1.72 1.72a.75.75 0 101.06-1.06L20.56 12l1.72-1.72a.75.75 0 10-1.06-1.06l-1.72 1.72-1.72-1.72z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-green-400">
                            <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 2.485.637 4.819 1.751 6.84.254.44.757.705 1.259.664h1.94c.583 0 1.137.234 1.549.646l4.5 4.5c.944.945 2.56.276 2.56-1.06V4.06zM18.59 16.91a.75.75 0 101.06 1.06 7.485 7.485 0 000-11.94.75.75 0 00-1.06 1.06 5.985 5.985 0 010 9.82zM16.47 14.79a.75.75 0 101.06 1.06 4.485 4.485 0 000-7.7.75.75 0 00-1.06 1.06 2.985 2.985 0 010 5.58z" />
                        </svg>
                    )}
                </button>
            )}
        </div>
    );
};