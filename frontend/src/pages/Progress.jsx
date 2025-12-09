import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import StatsCard from '../components/StatsCard';
import ActivityHeatmap from '../components/ActivityHeatmap';
import { Trophy, Target, Award, Zap, BrainCircuit, ArrowRight, User, BookOpen, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProfileDropdown from '../components/ProfileDropdown';

const Progress = () => {
    const [data, setData] = useState(null);
    const [aiInsights, setAiInsights] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        const loadDat = async () => {
            try {
                const [statsRes, aiRes] = await Promise.all([
                    api.get('/progress/dashboard'),
                    api.get('/progress/ai-insights')
                ]);
                setData(statsRes.data);
                setAiInsights(aiRes.data);
            } catch (err) {
                console.error("Failed to load progress data", err);
            } finally {
                setLoading(false);
            }
        };
        loadDat();
    }, []);

    if (loading) return <div className="layout">Loading your progress...</div>;
    if (!data) return <div className="layout">Failed to load data.</div>;

    const { stats, heatmap, topics } = data;

    return (
        <div className="layout">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', margin: 0 }}>Hello, {user?.username || 'Learner'}!</h1>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Here is your progress report.</p>
                </div>
                <ProfileDropdown />
            </header>

            {/* AI Insights Section */}
            {aiInsights && aiInsights.motivation && (
                <div className="glass-panel" style={{
                    padding: '2rem', marginBottom: '2rem',
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1))',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <BrainCircuit color="var(--accent)" />
                        <h3 style={{ margin: 0 }}>AI Coach Insights</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <div>
                            <p><strong>Strength:</strong> {aiInsights.strength}</p>
                            <p><strong>Focus Area:</strong> {aiInsights.weakness}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', fontStyle: 'italic', borderLeft: '3px solid var(--accent)', paddingLeft: '1rem' }}>
                            "{aiInsights.motivation}"
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <StatsCard title="Streak" value={`${stats.streak} Days`} icon={<Zap />} color="#F59E0B" />
                <StatsCard title="Total XP" value={stats.total_xp} icon={<Award />} color="#3B82F6" />
                <StatsCard title="Modules Done" value={stats.modules_completed} icon={<Target />} color="#10B981" />
                <StatsCard title="Avg Score" value={`${stats.avg_score}%`} icon={<Trophy />} color="#8B5CF6" />
                <StatsCard title="Topics Completed" value={`${stats.topics_done} / ${stats.total_topics}`} icon={<CheckCircle size={24} />} color="#6366F1" />
                <StatsCard title="Mock Exams" value={`${stats.mock_exams_passed || 0} / ${stats.mock_exams_taken || 0}`} icon={<BrainCircuit />} color="#EC4899" />
            </div>

            {/* Heatmap & topic list layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div>
                    <ActivityHeatmap data={heatmap} />

                    <div className="glass-panel" style={{ padding: '1.5rem', marginTop: '2rem' }}>
                        <h3>Recent Activity</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>No other recent activity logged.</p>
                    </div>
                </div>

                <div>
                    <h3 style={{ marginTop: 0 }}>Your Topics</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {topics.map(topic => (
                            <div key={topic.id} className="glass-panel" style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <h4 style={{ margin: 0 }}>{topic.title}</h4>
                                    <span style={{ color: 'var(--text-secondary)' }}>{topic.percent}%</span>
                                </div>
                                <div style={{
                                    height: '6px', width: '100%',
                                    background: 'rgba(255,255,255,0.1)',
                                    borderRadius: '3px', marginBottom: '1rem', overflow: 'hidden'
                                }}>
                                    <div style={{
                                        height: '100%', width: `${topic.percent}%`,
                                        background: 'var(--success)', borderRadius: '3px'
                                    }} />
                                </div>
                                <Link to={`/roadmap/${topic.id}`} style={{
                                    textDecoration: 'none', color: 'var(--accent)',
                                    fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
                                }}>
                                    Continue Learning <ArrowRight size={14} />
                                </Link>
                            </div>
                        ))}
                        {topics.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>You haven't enrolled in any topics yet.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Progress;
