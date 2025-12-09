import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { CheckCircle, Circle, ArrowDown, Lock } from 'lucide-react';
import ProfileDropdown from '../components/ProfileDropdown';

const Roadmap = () => {
    const { topicId } = useParams();
    const [topic, setTopic] = useState(null);

    useEffect(() => {
        const fetchTopic = async () => {
            try {
                const res = await api.get(`/topics/${topicId}`);
                setTopic(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchTopic();
    }, [topicId]);

    if (!topic) return <div className="layout">Loading...</div>;

    return (
        <div className="layout">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <Link to="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>&larr; Back to Dashboard</Link>
                <ProfileDropdown />
            </div>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>{topic.title} Roadmap</h1>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>{topic.description}</p>
            </div>

            <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
                {/* Vertical Line */}
                <div style={{
                    position: 'absolute', left: '50%', top: 0, bottom: 0, width: '4px',
                    background: 'var(--bg-secondary)', transform: 'translateX(-50%)', zIndex: 0
                }} />

                {topic.modules.map((module, index) => {
                    const isLocked = index > 0 && !(topic.modules[index - 1].score >= 80);

                    return (
                        <div key={module.id} style={{ display: 'flex', justifyContent: index % 2 === 0 ? 'flex-start' : 'flex-end', marginBottom: '3rem', position: 'relative', zIndex: 1 }}>
                            {isLocked ? (
                                <div className="card" style={{
                                    border: '1px solid var(--border)',
                                    position: 'relative',
                                    width: '45%',
                                    opacity: 0.6,
                                    cursor: 'not-allowed'
                                }}>
                                    <div style={{
                                        position: 'absolute', top: '20px',
                                        [index % 2 === 0 ? 'right' : 'left']: '-64px',
                                        color: 'var(--text-secondary)',
                                        background: 'var(--bg-primary)', borderRadius: '50%'
                                    }}>
                                        <Lock size={32} />
                                    </div>
                                    <h3 style={{ color: 'var(--text-secondary)' }}>{module.title}</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Locked</p>
                                </div>
                            ) : (
                                <Link to={`/learn/${module.id}`} style={{ textDecoration: 'none', width: '45%' }}>
                                    <div className="card" style={{
                                        border: module.is_completed ? '1px solid var(--success)' : '1px solid transparent',
                                        position: 'relative'
                                    }}>
                                        <div style={{
                                            position: 'absolute', top: '20px',
                                            [index % 2 === 0 ? 'right' : 'left']: '-64px',
                                            color: module.is_completed ? 'var(--success)' : 'var(--text-secondary)',
                                            background: 'var(--bg-primary)', borderRadius: '50%'
                                        }}>
                                            {module.is_completed ? <CheckCircle size={32} /> : <Circle size={32} />}
                                        </div>
                                        <h3 style={{ color: 'white' }}>{module.title}</h3>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{module.description}</p>
                                        {module.score > 0 && (
                                            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: module.score >= 80 ? 'var(--success)' : 'var(--warning)' }}>
                                                Score: {module.score}%
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Roadmap;
