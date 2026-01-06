import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from './store';
import { setRole } from './store/peerSlice';
import { usePeer } from './hooks/usePeer';

export default function WebRTCChat() {
    const dispatch = useDispatch();
    const { myPeerId, role, connections, connectionStatus, error, messages, peerVideoStatus } = useSelector((state: RootState) => state.peer);
    const { connectToHost, sendMessage, startVideo, toggleVideo, toggleAudio, localStream, remoteStreams } = usePeer();
    const [hostIdInput, setHostIdInput] = useState('');
    const [messageInput, setMessageInput] = useState('');
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isMicOn, setIsMicOn] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleRoleSelect = (selectedRole: 'HOST' | 'CLIENT') => {
        dispatch(setRole(selectedRole));
    };

    const handleToggleCamera = () => {
        const newState = toggleVideo();
        setIsCameraOn(newState);
    };

    const handleToggleAudio = () => {
        const newState = toggleAudio();
        setIsMicOn(newState);
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

                {/* ID Header - HOST ONLY */}
                {(!role || role === 'HOST') && (
                    <div className="mb-8 p-6 bg-gray-800 rounded-lg border border-gray-700 flex justify-between items-center">
                        <div>
                            <p className="mb-2 text-gray-400">My Peer ID:</p>
                            <p className="text-xl font-bold text-green-400 break-all">{myPeerId || 'Initializing...'}</p>
                        </div>
                    </div>
                )}

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
                            {/* MAIN UI GRID: Videos + Chat */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                {/* LEFT COLUMN: Remote Videos (Takes 2 columns on large screens) */}
                                <div className="lg:col-span-2 flex flex-col gap-4">
                                    <div className="bg-gray-800 p-4 rounded-lg">
                                        <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                                            <h3 className="text-xl font-bold">Remote Feed</h3>
                                            <div className="text-sm text-gray-400">
                                                Status: <span className={connectionStatus === 'CONNECTED' ? 'text-green-400' : 'text-yellow-400'}>{connectionStatus}</span>
                                            </div>
                                        </div>

                                        {connections.length === 0 ? (
                                            <div className="aspect-video bg-gray-700 rounded-lg flex items-center justify-center text-gray-500">
                                                Waiting for peers...
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-4">
                                                {connections.map((conn) => (
                                                    <div key={conn.id} className="bg-gray-700 rounded-lg overflow-hidden flex flex-col shadow-lg border border-gray-600">
                                                        <div className="bg-gray-900 px-4 py-2 flex justify-between items-center text-xs">
                                                            <div className="flex items-center gap-2 text-gray-300">
                                                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                                Peer: {conn.id.substring(0, 8)}...
                                                            </div>
                                                            <div className={`uppercase border rounded px-1 font-bold ${conn.type === 'STUN' ? 'border-yellow-500 text-yellow-500' :
                                                                    conn.type?.startsWith('TURN') ? 'border-purple-500 text-purple-500' :
                                                                        conn.type === 'LAN' ? 'border-green-500 text-green-500' :
                                                                            'border-blue-500 text-blue-500'
                                                                }`}>{conn.type || 'CONN'}</div>
                                                        </div>
                                                        {/* BIGGER VIDEO for Remote */}
                                                        <div className="aspect-video bg-black relative">
                                                            {peerVideoStatus[conn.id] === false ? (
                                                                <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-400 font-bold border-2 border-dashed border-gray-600">
                                                                    Peer turned off the camera
                                                                </div>
                                                            ) : remoteStreams[conn.id] ? (
                                                                <Video stream={remoteStreams[conn.id]} muted={false} allowUnmute={true} />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-500">No Video</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* RIGHT COLUMN: Local Video + Chat (Takes 1 column) */}
                                <div className="flex flex-col gap-4">

                                    {/* Local Video - Smaller, Sidebar Style */}
                                    <div className="bg-gray-800 p-4 rounded-lg">
                                        <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                                            <h3 className="text-lg font-bold">My Camera</h3>
                                            {localStream && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={handleToggleAudio}
                                                        className={`text-xs px-2 py-1 rounded ${!isMicOn ? 'bg-red-500/20 text-red-400 border border-red-500' : 'bg-green-500/20 text-green-400 border border-green-500'}`}
                                                    >
                                                        {isMicOn ? 'Mic ON' : 'Mic OFF'}
                                                    </button>
                                                    <button
                                                        onClick={handleToggleCamera}
                                                        className={`text-xs px-2 py-1 rounded ${!isCameraOn ? 'bg-red-500/20 text-red-400 border border-red-500' : 'bg-green-500/20 text-green-400 border border-green-500'}`}
                                                    >
                                                        {isCameraOn ? 'Cam ON' : 'Cam OFF'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="bg-gray-700 rounded-lg overflow-hidden flex flex-col shadow-lg border border-gray-600">
                                            <div className="aspect-video bg-black relative">
                                                {localStream ? (
                                                    <Video stream={localStream} muted={true} allowUnmute={false} />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-2 p-4 text-center">
                                                        <span className="text-xs">Camera Off</span>
                                                        {connectionStatus === 'CONNECTED' && (
                                                            <button onClick={startVideo} className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs font-semibold text-white transition">
                                                                Enable Media
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Chat Panel - Sidebar */}
                                    <div className="bg-gray-800 p-4 rounded-lg flex flex-col h-[400px]">
                                        <h3 className="text-lg font-bold mb-4 border-b border-gray-700 pb-2">Chat</h3>

                                        <div className="flex-1 overflow-y-auto mb-4 space-y-3 p-2 bg-gray-900 rounded custom-scrollbar">
                                            {messages.length === 0 ? <p className="text-gray-500 italic text-center text-xs mt-4">No messages yet.</p> : (
                                                messages.map((msg) => (
                                                    <div key={msg.id} className={`flex flex-col ${msg.role === 'ME' ? 'items-end' : 'items-start'}`}>
                                                        <div className={`max-w-[90%] px-3 py-2 rounded-lg text-sm ${msg.role === 'ME' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                                                            {msg.content}
                                                        </div>
                                                        <span className="text-[10px] text-gray-500 mt-1">{msg.role === 'ME' ? 'You' : 'Peer'} • {new Date(msg.timestamp).toLocaleTimeString()}</span>
                                                    </div>
                                                ))
                                            )}
                                            <div ref={messagesEndRef} />
                                        </div>

                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Type a message..."
                                                value={messageInput}
                                                onChange={(e) => setMessageInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && onSendMessage()}
                                                disabled={connectionStatus !== 'CONNECTED' && connections.length === 0}
                                                className="flex-1 px-3 py-2 rounded text-black text-sm disabled:opacity-50"
                                            />
                                            <button
                                                onClick={onSendMessage}
                                                disabled={!messageInput.trim() || (connectionStatus !== 'CONNECTED' && connections.length === 0)}
                                                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded font-bold text-sm disabled:opacity-50"
                                            >
                                                Send
                                            </button>
                                        </div>
                                    </div>

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