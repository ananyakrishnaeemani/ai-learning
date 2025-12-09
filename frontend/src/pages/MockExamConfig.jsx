import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { PenTool, ArrowLeft, BrainCircuit, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const MockExamConfig = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [config, setConfig] = useState({
        topic_name: '',
        difficulty: 'Medium',
        count: 5
    });
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get('/mock-exam/history');
                setHistory(res.data);
            } catch (err) {
                console.error("Failed to fetch history", err);
            }
        };
        fetchHistory();
    }, []);

    const handleStart = async (e) => {
        e.preventDefault();
        if (!config.topic_name.trim()) return toast.error("Please enter a topic");

        setLoading(true);
        try {
            const res = await api.post('/mock-exam/generate', config);
            const examId = res.data.id;
            toast.success("Exam Generated!");
            navigate(`/mock-exam-session/${examId}`);
        } catch (err) {
            console.error(err);
            toast.error("Failed to generate exam. AI might be busy.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(to bottom right, #0f172a, #1e293b)',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '2rem',
            overflowY: 'auto'
        }}>
            <button
                onClick={() => navigate('/dashboard')}
                style={{ position: 'absolute', top: '2rem', left: '2rem', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
                <ArrowLeft size={20} /> Back to Dashboard
            </button>

            <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '3rem', marginTop: '3rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%',
                        background: 'rgba(236, 72, 153, 0.1)', color: '#f472b6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.5rem auto'
                    }}>
                        <PenTool size={40} />
                    </div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Mock Exam</h1>
                    <p style={{ color: '#94a3b8' }}>Test your knowledge with AI-generated questions</p>
                    {user && <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>Logged in as: {user.username}</p>}
                </div>

                <form onSubmit={handleStart} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>Topic</label>
                        <input
                            style={{ width: '100%', padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                            placeholder="e.g. Python AsyncIO, World History..."
                            value={config.topic_name}
                            onChange={e => setConfig({ ...config, topic_name: e.target.value })}
                            required
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>Difficulty</label>
                            <select
                                style={{ width: '100%', padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                                value={config.difficulty}
                                onChange={e => setConfig({ ...config, difficulty: e.target.value })}
                            >
                                <option value="Beginner">Beginner</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                                <option value="Expert">Expert</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#cbd5e1' }}>Questions</label>
                            <input
                                type="number"
                                min="3" max="20"
                                style={{ width: '100%', padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                                value={config.count}
                                onChange={e => setConfig({ ...config, count: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                        style={{
                            padding: '1rem', fontSize: '1.1rem', marginTop: '1rem',
                            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px'
                        }}
                    >
                        {loading ? (
                            <span>Generating Exam...</span>
                        ) : (
                            <>
                                Start Exam <BrainCircuit size={20} />
                            </>
                        )}
                    </button>

                    {loading && (
                        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>
                            Creating unique questions for you...
                        </div>
                    )}
                </form>
            </div>

            <div style={{ width: '100%', maxWidth: '800px', marginTop: '3rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, color: '#cbd5e1' }}>
                        <History size={20} /> Past Attempts ({history.length})
                    </h3>
                    <button
                        onClick={() => {
                            const fetchHistory = async () => {
                                try {
                                    const res = await api.get('/mock-exam/history');
                                    setHistory(res.data);
                                    toast.success("History refreshed");
                                } catch (err) {
                                    console.error("Failed to fetch history", err);
                                    toast.error("Failed to fetch history");
                                }
                            };
                            fetchHistory();
                        }}
                        style={{ background: 'transparent', border: '1px solid #475569', color: '#94a3b8', padding: '0.25rem 0.75rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                        Refresh
                    </button>
                </div>
                {history.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                        No history found. Take your first exam!
                    </div>
                ) : (
                    <div className="glass-panel" style={{ overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: 'rgba(0,0,0,0.2)', color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                                <tr>
                                    <th style={{ padding: '1rem' }}>Topic</th>
                                    <th style={{ padding: '1rem' }}>Difficulty</th>
                                    <th style={{ padding: '1rem' }}>Score</th>
                                    <th style={{ padding: '1rem' }}>Result</th>
                                    <th style={{ padding: '1rem' }}>Date</th>
                                    <th style={{ padding: '1rem' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map(att => (
                                    <tr key={att.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1rem', fontWeight: '500' }}>{att.topic}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)' }}>
                                                {att.difficulty}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{att.score} / {att.total}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ color: att.passed ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>
                                                {att.passed ? 'Passed' : 'Failed'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                                            {new Date(att.date).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <button
                                                onClick={() => navigate(`/mock-exam-review/${att.id}`)}
                                                style={{
                                                    background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)',
                                                    color: '#38bdf8', padding: '0.25rem 0.75rem', borderRadius: '4px',
                                                    cursor: 'pointer', fontSize: '0.8rem'
                                                }}
                                            >
                                                Review
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MockExamConfig;
