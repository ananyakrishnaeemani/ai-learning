import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Send, Plus, MessageSquare, Paperclip, Menu, Bot, User, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ChatMentor = () => {
    const { user } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [pendingFile, setPendingFile] = useState(null);
    const messagesEndRef = useRef(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    useEffect(() => {
        loadSessions();
        if (window.innerWidth < 768) setIsSidebarOpen(false);
    }, []);

    useEffect(() => {
        if (currentSessionId) {
            loadMessages(currentSessionId);
            if (window.innerWidth < 768) setIsSidebarOpen(false);
        } else {
            setMessages([]);
        }
    }, [currentSessionId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const loadSessions = async () => {
        try {
            const res = await api.get('/chat/sessions');
            setSessions(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const loadMessages = async (id) => {
        try {
            const res = await api.get(`/chat/sessions/${id}`);
            setMessages(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleNewChat = async () => {
        setLoading(true);
        try {
            const res = await api.post('/chat/sessions');
            setSessions([res.data, ...sessions]);
            setCurrentSessionId(res.data.id);
            setMessages([]);
            setPendingFile(null);
            if (window.innerWidth < 768) setIsSidebarOpen(false);
        } catch (err) {
            toast.error("Failed to create new chat");
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPendingFile(file);
            e.target.value = null;
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!input.trim() && !pendingFile) || !currentSessionId) return;

        setLoading(true);
        const messageContent = input;

        try {
            let fileContext = "";
            let fileName = "";

            if (pendingFile) {
                setUploading(true);
                const formData = new FormData();
                formData.append('file', pendingFile);

                try {
                    const uploadRes = await api.post('/chat/upload', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    fileContext = uploadRes.data.text;
                    fileName = pendingFile.name;
                    toast.success("File processed");
                } catch (uploadErr) {
                    console.error(uploadErr);
                    toast.error("Failed to process file");
                    setLoading(false);
                    setUploading(false);
                    return;
                }
                setUploading(false);
                setPendingFile(null);
            }

            let finalContent = messageContent;
            if (fileContext) {
                finalContent = `<<<FILE_TYPE_START>>>${fileName}<<<FILE_NAME_END>>>\n${fileContext}\n<<<FILE_CONTENT_END>>>\n\n${messageContent}`;
            }

            const optimisticMsg = { role: 'user', content: finalContent };
            setMessages(prev => [...prev, optimisticMsg]);
            setInput('');

            const res = await api.post(`/chat/sessions/${currentSessionId}/messages`, { content: finalContent });
            setMessages(prev => [...prev, res.data]);

            // If it's a new chat, refresh to get the AI-generated title
            if (messages.length === 0) loadSessions();

        } catch (err) {
            console.error(err);
            toast.error("Failed to send message");
        } finally {
            setLoading(false);
        }
    };

    const renderMessageContent = (content) => {
        const fileBlockRegex = /<<<FILE_TYPE_START>>>(.*?)<<<FILE_NAME_END>>>([\s\S]*?)<<<FILE_CONTENT_END>>>/;
        const match = content.match(fileBlockRegex);

        if (match) {
            const fileName = match[1];
            const userText = content.replace(fileBlockRegex, '').trim();

            return (
                <div>
                    <div style={{
                        background: 'rgba(139, 92, 246, 0.1)',
                        border: '1px solid var(--accent)',
                        borderRadius: '8px',
                        padding: '0.5rem 1rem',
                        marginBottom: '1rem',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        fontSize: '0.9rem', color: 'var(--accent-light)'
                    }}>
                        <Paperclip size={16} />
                        <strong>Attached Context:</strong> {fileName}
                    </div>
                    {userText && (
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                code({ node, inline, className, children, ...props }) {
                                    return !inline ? (
                                        <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', overflowX: 'auto', margin: '1rem 0', border: '1px solid rgba(255,255,255,0.1)' }}>
                                            <code {...props} style={{ fontFamily: 'monospace', color: '#e2e8f0' }}>{children}</code>
                                        </div>
                                    ) : (
                                        <code {...props} style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontFamily: 'monospace', color: 'var(--accent-light)' }}>
                                            {children}
                                        </code>
                                    )
                                },
                            }}
                        >
                            {userText}
                        </ReactMarkdown>
                    )}
                </div>
            );
        }

        return (
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    code({ node, inline, className, children, ...props }) {
                        return !inline ? (
                            <div style={{ background: '#020617', padding: '1rem', borderRadius: '8px', overflowX: 'auto', margin: '1rem 0', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <code {...props} style={{ fontFamily: 'monospace', color: '#e2e8f0' }}>{children}</code>
                            </div>
                        ) : (
                            <code {...props} style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontFamily: 'monospace', color: '#f472b6' }}>
                                {children}
                            </code>
                        )
                    },
                    table: ({ node, ...props }) => <div style={{ overflowX: 'auto', marginBottom: '1rem' }}><table {...props} style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid rgba(255,255,255,0.1)' }} /></div>,
                    th: ({ node, ...props }) => <th {...props} style={{ padding: '0.8rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', textAlign: 'left', color: '#a78bfa' }} />,
                    td: ({ node, ...props }) => <td {...props} style={{ padding: '0.8rem', border: '1px solid rgba(255,255,255,0.1)' }} />,
                    blockquote: ({ node, ...props }) => <blockquote {...props} style={{ borderLeft: '4px solid #a78bfa', paddingLeft: '1rem', fontStyle: 'italic', margin: '1rem 0', color: '#94a3b8' }} />,
                }}
            >
                {content}
            </ReactMarkdown>
        );
    }
    const handleDeleteSession = async (e, sessionId) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this chat?")) return;

        try {
            await api.delete(`/chat/sessions/${sessionId}`);
            const updatedSessions = sessions.filter(s => s.id !== sessionId);
            setSessions(updatedSessions);

            if (currentSessionId === sessionId) {
                setCurrentSessionId(null);
                setMessages([]);
            }
            toast.success("Chat deleted");
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete chat");
        }
    };

    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            background: 'linear-gradient(to bottom right, #0f172a, #1e293b)',
            color: '#e2e8f0',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: "'Inter', sans-serif"
        }}>
            {/* Sidebar Overlay for Mobile */}
            {isSidebarOpen && window.innerWidth < 768 && (
                <div
                    onClick={() => setIsSidebarOpen(false)}
                    style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 20 }}
                />
            )}

            {/* Sidebar */}
            <div style={{
                width: isSidebarOpen ? '280px' : '0',
                background: 'rgba(15, 23, 42, 0.6)',
                backdropFilter: 'blur(10px)',
                borderRight: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', flexDirection: 'column',
                transition: 'width 0.3s ease',
                overflow: 'hidden',
                zIndex: 25,
                position: window.innerWidth < 768 ? 'absolute' : 'relative',
                height: '100%',
                flexShrink: 0
            }}>
                <div style={{ padding: '1.5rem 1rem' }}>
                    <button onClick={handleNewChat} className="btn-primary" style={{
                        width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', padding: '0.8rem',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.4)'
                    }}>
                        <Plus size={18} /> New Session
                    </button>
                </div>

                <h3 style={{ padding: '0 1rem', fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '0.75rem', fontWeight: '600' }}>Your Learning History</h3>

                <div style={{ flex: 1, overflowY: 'auto', padding: '0 0.5rem' }}>
                    {sessions.map(session => (
                        <div
                            key={session.id}
                            onClick={() => setCurrentSessionId(session.id)}
                            className={currentSessionId === session.id ? "active-session" : "hover-bg"}
                            style={{
                                padding: '0.85rem 1rem', margin: '0.25rem 0',
                                borderRadius: '12px', cursor: 'pointer',
                                background: currentSessionId === session.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                                border: currentSessionId === session.id ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                                color: currentSessionId === session.id ? 'white' : '#94a3b8',
                                display: 'flex', alignItems: 'center', gap: '12px',
                                transition: 'all 0.2s',
                                position: 'relative'
                            }}
                            onMouseEnter={(e) => {
                                const btn = e.currentTarget.querySelector('.delete-btn');
                                if (btn) btn.style.opacity = '1';
                            }}
                            onMouseLeave={(e) => {
                                const btn = e.currentTarget.querySelector('.delete-btn');
                                if (btn) btn.style.opacity = '0';
                            }}
                        >
                            <MessageSquare size={16} flexShrink={0} />
                            <span style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: currentSessionId === session.id ? '500' : '400', flex: 1 }}>
                                {session.title || "New Session"}
                            </span>
                            <button
                                className="delete-btn"
                                onClick={(e) => handleDeleteSession(e, session.id)}
                                style={{
                                    background: 'transparent', border: 'none', color: '#ef4444',
                                    padding: '4px', cursor: 'pointer', opacity: 0, transition: 'opacity 0.2s',
                                    display: 'flex', alignItems: 'center'
                                }}
                                title="Delete Chat"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    {sessions.length === 0 && (
                        <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem', fontStyle: 'italic' }}>
                            No past sessions found. Start a new topic!
                        </div>
                    )}
                </div>

                {/* User Info Footnote */}
                <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', color: '#cbd5e1', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 'bold'
                    }}>
                        {user?.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontWeight: '500' }}>{user?.username}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Student</div>
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', background: 'transparent', overflow: 'hidden' }}>
                {/* Header */}
                <header style={{
                    padding: '1rem 2rem',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    background: 'rgba(15, 23, 42, 0.4)',
                    backdropFilter: 'blur(10px)',
                    zIndex: 10
                }}>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}>
                        <Menu size={24} />
                    </button>
                    <div>
                        <h2 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: 'white', fontWeight: '600' }}>
                            <Bot size={24} color="#a78bfa" /> AI Tutor
                        </h2>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Always here to help you learn</span>
                    </div>
                    <button style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#94a3b8' }} onClick={() => window.location.href = '/dashboard'}>
                        <X size={20} />
                    </button>
                </header>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {!currentSessionId ? (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                            <div style={{
                                padding: '3rem',
                                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))',
                                borderRadius: '50%', marginBottom: '2rem',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                <Bot size={80} strokeWidth={1} color="#a78bfa" />
                            </div>
                            <h2 style={{ color: 'white', marginBottom: '1rem', fontSize: '2rem', fontWeight: '300' }}>Ready to learn something new?</h2>
                            <p style={{ maxWidth: '500px', textAlign: 'center', lineHeight: '1.6', fontSize: '1.1rem' }}>
                                I can explain complex concepts, quiz you on topics, or review your study notes.
                            </p>
                            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '0.9rem' }}>"Explain Quantum Physics"</div>
                                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '0.9rem' }}>"Quiz me on History"</div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            {messages.map((msg, idx) => (
                                <div key={idx} style={{
                                    display: 'flex',
                                    gap: '1.5rem',
                                    animation: 'fadeIn 0.3s ease',
                                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                                }}>
                                    {/* Avatar */}
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                                        background: msg.role === 'user' ? '#334155' : 'linear-gradient(135deg, #6366f1, #a855f7)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'white',
                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                                    }}>
                                        {msg.role === 'user' ? <User size={20} /> : <Bot size={22} />}
                                    </div>

                                    {/* Content */}
                                    <div style={{
                                        maxWidth: '80%',
                                        background: msg.role === 'user' ? 'rgba(51, 65, 85, 0.5)' : 'rgba(15, 23, 42, 0.6)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                                        padding: '1.5rem',
                                    }}>
                                        <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: msg.role === 'user' ? '#94a3b8' : '#a78bfa', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            {msg.role === 'user' ? 'You' : 'AI Tutor'}
                                        </div>
                                        <div style={{
                                            color: '#e2e8f0',
                                            lineHeight: '1.7',
                                            fontSize: '1.05rem',
                                            wordWrap: 'break-word'
                                        }} className="markdown-content">
                                            {msg.role === 'user' ? (
                                                renderMessageContent(msg.content)
                                            ) : (
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={{
                                                        code({ node, inline, className, children, ...props }) {
                                                            return !inline ? (
                                                                <div style={{ background: '#020617', padding: '1rem', borderRadius: '8px', overflowX: 'auto', margin: '1rem 0', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                                    <code {...props} style={{ fontFamily: 'monospace', color: '#e2e8f0' }}>{children}</code>
                                                                </div>
                                                            ) : (
                                                                <code {...props} style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontFamily: 'monospace', color: '#f472b6' }}>
                                                                    {children}
                                                                </code>
                                                            )
                                                        },
                                                        a: ({ node, ...props }) => <a {...props} style={{ color: '#38bdf8', textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer" />,
                                                        ul: ({ node, ...props }) => <ul {...props} style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }} />,
                                                        ol: ({ node, ...props }) => <ol {...props} style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }} />,
                                                        li: ({ node, ...props }) => <li {...props} style={{ marginBottom: '0.5rem' }} />,
                                                        table: ({ node, ...props }) => <div style={{ overflowX: 'auto', marginBottom: '1rem' }}><table {...props} style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid rgba(255,255,255,0.1)' }} /></div>,
                                                        th: ({ node, ...props }) => <th {...props} style={{ padding: '0.8rem', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', textAlign: 'left', color: '#a78bfa' }} />,
                                                        td: ({ node, ...props }) => <td {...props} style={{ padding: '0.8rem', border: '1px solid rgba(255,255,255,0.1)' }} />,
                                                        blockquote: ({ node, ...props }) => <blockquote {...props} style={{ borderLeft: '4px solid #a78bfa', paddingLeft: '1rem', fontStyle: 'italic', margin: '1rem 0', color: '#94a3b8' }} />,
                                                        h1: ({ node, ...props }) => <h1 {...props} style={{ fontSize: '1.5rem', color: 'white', marginTop: '1.5rem', marginBottom: '1rem' }} />,
                                                        h2: ({ node, ...props }) => <h2 {...props} style={{ fontSize: '1.3rem', color: 'white', marginTop: '1.2rem', marginBottom: '0.8rem' }} />,
                                                        h3: ({ node, ...props }) => <h3 {...props} style={{ fontSize: '1.1rem', color: '#e2e8f0', marginTop: '1rem', marginBottom: '0.5rem' }} />,
                                                    }}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                        <Bot size={22} />
                                    </div>
                                    <div style={{ color: '#94a3b8', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div className="typing-dot" style={{ width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%' }}></div>
                                        <div className="typing-dot" style={{ width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%' }}></div>
                                        <div className="typing-dot" style={{ width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%' }}></div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Input Area */}
                {currentSessionId && (
                    <div style={{ padding: '2rem 1rem 2rem 1rem' }}>
                        <div style={{
                            maxWidth: '900px', margin: '0 auto',
                        }}>
                            {/* Pending File Indicator */}
                            {pendingFile && (
                                <div style={{
                                    padding: '0.75rem 1rem',
                                    display: 'inline-flex', alignItems: 'center', gap: '10px',
                                    background: 'rgba(15, 23, 42, 0.8)',
                                    border: '1px solid rgba(99, 102, 241, 0.3)',
                                    borderRadius: '12px 12px 12px 0',
                                    marginBottom: '1rem',
                                    animation: 'fadeIn 0.2s'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0', fontSize: '0.9rem' }}>
                                        <div style={{ padding: '4px', background: 'rgba(99, 102, 241, 0.2)', borderRadius: '4px' }}>
                                            <Paperclip size={14} color="#818cf8" />
                                        </div>
                                        <span style={{ fontWeight: '500' }}>{pendingFile.name}</span>
                                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>({(pendingFile.size / 1024).toFixed(0)} KB)</span>
                                    </div>
                                    <button
                                        onClick={() => setPendingFile(null)}
                                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', padding: '4px', display: 'flex', cursor: 'pointer' }}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}

                            <div style={{
                                background: '#1e293b', borderRadius: '16px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                padding: '1rem',
                                display: 'flex', flexDirection: 'column', gap: '1rem',
                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                                position: 'relative'
                            }}>
                                <textarea
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    placeholder={pendingFile ? "Ask a question about your file..." : "Type your question here..."}
                                    disabled={loading || uploading}
                                    style={{
                                        width: '100%',
                                        padding: '0',
                                        background: 'transparent', border: 'none',
                                        color: 'white', resize: 'none', height: 'fit-content', minHeight: '48px', maxHeight: '150px',
                                        fontFamily: 'inherit', fontSize: '1.1rem', lineHeight: '1.5',
                                        outline: 'none'
                                    }}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage(e);
                                        }
                                    }}
                                />

                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                                    <label style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        cursor: 'pointer', color: '#94a3b8', fontSize: '0.9rem',
                                        padding: '0.5rem 1rem', borderRadius: '8px', transition: 'all 0.2s',
                                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)'
                                    }} className="hover-bg-button">
                                        <Paperclip size={16} />
                                        <span>Upload Materials</span>
                                        <input
                                            type="file"
                                            style={{ display: 'none' }}
                                            onChange={handleFileSelect}
                                            accept=".txt,.pdf,.md,.py,.js"
                                            disabled={uploading || loading}
                                        />
                                    </label>

                                    <button
                                        onClick={handleSendMessage}
                                        disabled={loading || (!input.trim() && !pendingFile)}
                                        style={{
                                            padding: '0.6rem 1.2rem',
                                            borderRadius: '8px',
                                            background: loading || (!input.trim() && !pendingFile) ? '#334155' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                            color: loading || (!input.trim() && !pendingFile) ? '#64748b' : 'white',
                                            border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.2s',
                                            display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500'
                                        }}
                                    >
                                        Send <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.75rem', marginTop: '1rem' }}>
                            AI Tutor can make mistakes. Double check important info.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatMentor;
