import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, BookOpen } from 'lucide-react';

const Dashboard = () => {
    const [topics, setTopics] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newTopic, setNewTopic] = useState({ title: '', difficulty: 'Medium', duration_days: 7, description: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchTopics();
    }, []);

    const fetchTopics = async () => {
        try {
            const res = await api.get('/topics/');
            setTopics(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateTopic = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/topics/', newTopic);
            setShowModal(false);
            setNewTopic({ title: '', difficulty: 'Medium', duration_days: 7, description: '' });
            fetchTopics();
        } catch (err) {
            alert('Failed to create topic');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this topic?")) return;
        try {
            await api.delete(`/topics/${id}`);
            fetchTopics();
        } catch (err) {
            console.error(err);
        }
    };

    // Dummy data for chart
    const data = [
        { name: 'Week 1', progress: 20 },
        { name: 'Week 2', progress: 45 },
        { name: 'Week 3', progress: 30 },
        { name: 'Week 4', progress: 80 },
    ];

    return (
        <div className="layout">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <h1>My Learning Dashboard</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link to="/progress" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
                        Your Progress
                    </Link>
                    <button className="btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={18} style={{ marginRight: '8px' }} />
                        New Topic
                    </button>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                <div className="card">
                    <h3>Learning Progress</h3>
                    <div style={{ height: '200px', marginTop: '1rem' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none' }} />
                                <Line type="monotone" dataKey="progress" stroke="#8b5cf6" strokeWidth={3} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="card">
                    <h3>Stats</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                        <div className="glass-panel" style={{ padding: '1rem' }}>
                            <div style={{ color: 'var(--text-secondary)' }}>Active Topics</div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{topics.length}</div>
                        </div>
                        <div className="glass-panel" style={{ padding: '1rem' }}>
                            <div style={{ color: 'var(--text-secondary)' }}>Hours Learned</div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>12.5</div>
                        </div>
                    </div>
                </div>
            </div>

            <h2>Your Topics</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem', marginTop: '1.5rem' }}>
                {topics.map(topic => (
                    <div key={topic.id} className="card" style={{ position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem' }}>
                                {topic.difficulty}
                            </span>
                            <button onClick={() => handleDelete(topic.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', padding: 0 }}>
                                <Trash2 size={18} />
                            </button>
                        </div>
                        <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>{topic.title}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            {topic.description}
                        </p>
                        <Link to={`/roadmap/${topic.id}`} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
                            <BookOpen size={18} style={{ marginRight: '8px' }} />
                            Start Learning
                        </Link>
                    </div>
                ))}
            </div>

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '500px' }}>
                        <h2>Create New Topic</h2>
                        <form onSubmit={handleCreateTopic} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                            <input
                                placeholder="Topic Name (e.g. Machine Learning)"
                                value={newTopic.title}
                                onChange={e => setNewTopic({ ...newTopic, title: e.target.value })}
                                required
                            />
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <select
                                    value={newTopic.difficulty}
                                    onChange={e => setNewTopic({ ...newTopic, difficulty: e.target.value })}
                                >
                                    <option value="Beginner">Beginner</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Hard">Hard</option>
                                </select>
                                <input
                                    type="number"
                                    placeholder="Days"
                                    value={newTopic.duration_days}
                                    onChange={e => setNewTopic({ ...newTopic, duration_days: parseInt(e.target.value) })}
                                />
                            </div>
                            <textarea
                                placeholder="Description / Focus areas..."
                                rows={4}
                                value={newTopic.description}
                                onChange={e => setNewTopic({ ...newTopic, description: e.target.value })}
                            />
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, background: 'transparent', border: '1px solid #475569', color: 'white', padding: '0.75rem', borderRadius: '8px' }}>Cancel</button>
                                <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1 }}>
                                    {loading ? 'Generating...' : 'Create Roadmap'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
