import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, BookOpen, MessageSquare, PenTool } from 'lucide-react';
import ProfileDropdown from '../components/ProfileDropdown';

const Dashboard = () => {
    const [topics, setTopics] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newTopic, setNewTopic] = useState({ title: '', difficulty: 'Medium', duration_days: 7, description: '' });
    const [loading, setLoading] = useState(false);

    const [dashboardData, setDashboardData] = useState(null);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const [topicsRes, progressRes] = await Promise.all([
                    api.get('/topics/'),
                    api.get('/progress/dashboard')
                ]);
                setTopics(topicsRes.data);
                setDashboardData(progressRes.data);
            } catch (err) {
                console.error(err);
            }
        };
        loadDashboard();
    }, []);

    // Use real chart data or fallback if empty
    const chartData = dashboardData?.chart_data || [
        { name: 'Mon', progress: 0 },
        { name: 'Tue', progress: 0 },
        { name: 'Wed', progress: 0 },
        { name: 'Thu', progress: 0 },
        { name: 'Fri', progress: 0 },
        { name: 'Sat', progress: 0 },
        { name: 'Sun', progress: 0 },
    ];

    const handleCreateTopic = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/topics/', newTopic);
            setShowModal(false);
            setNewTopic({ title: '', difficulty: 'Medium', duration_days: 7, description: '' });
            // Refresh
            const res = await api.get('/topics/');
            setTopics(res.data);
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
            // Refresh
            const res = await api.get('/topics/');
            setTopics(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="layout">
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', margin: 0, fontWeight: '700', letterSpacing: '-0.02em' }}>Dashboard</h1>
                    <p style={{ color: '#94a3b8', margin: '0.25rem 0 0 0' }}>Overview of your learning journey</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => setShowModal(true)}
                    style={{
                        boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
                        display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                >
                    <Plus size={18} /> New Roadmap
                </button>
            </header>

            {dashboardData?.resume_module && (
                <div className="glass-panel" style={{
                    padding: '1.5rem', marginBottom: '2rem',
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                }}>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div style={{
                            background: 'rgba(139, 92, 246, 0.2)',
                            padding: '1rem',
                            borderRadius: '12px',
                            color: '#a78bfa'
                        }}>
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <div style={{ color: '#a78bfa', fontSize: '0.8rem', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>Continue Learning</div>
                            <h3 style={{ margin: '0.25rem 0 0.25rem 0', fontSize: '1.2rem' }}>{dashboardData.resume_module.title}</h3>
                            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>{dashboardData.resume_module.topic_title}</p>
                        </div>
                    </div>
                    <Link to={`/learn/${dashboardData.resume_module.id}`} className="btn-primary" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', background: 'white', color: '#0f172a' }}>
                        Resume <BookOpen size={16} style={{ marginLeft: '8px' }} />
                    </Link>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '3rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0 }}>Activity</h3>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Last 7 Days</span>
                    </div>
                    <div style={{ height: '220px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} />
                                <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                                    itemStyle={{ color: '#a78bfa' }}
                                    cursor={{ stroke: '#334155' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="progress"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 0 }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-panel" style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Active Roadmaps</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'white' }}>{topics.length}</div>
                    </div>
                    <div className="glass-panel" style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Hours Learned</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#34d399' }}>{dashboardData?.stats?.estimated_hours || 0}</div>
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
