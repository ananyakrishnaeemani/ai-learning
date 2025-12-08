import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { CheckCircle, Circle, ArrowDown } from 'lucide-react';

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
            <Link to="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '1rem', display: 'block' }}>&larr; Back to Dashboard</Link>
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

                {topic.modules.map((module, index) => (
                    <div key={module.id} style={{ display: 'flex', justifyContent: index % 2 === 0 ? 'flex-start' : 'flex-end', marginBottom: '3rem', position: 'relative', zIndex: 1 }}>
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
                            </div>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Roadmap;
