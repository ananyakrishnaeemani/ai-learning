import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const ReviewMockExam = () => {
    const { attemptId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAttempt = async () => {
            try {
                const res = await api.get(`/mock-exam/attempt/${attemptId}`);
                setData(res.data);
            } catch (err) {
                console.error("Failed to fetch attempt details", err);
                setError("Failed to load review. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        fetchAttempt();
    }, [attemptId]);

    if (loading) return <div style={{ color: 'white', padding: '2rem', textAlign: 'center' }}>Loading review...</div>;
    if (error) return <div style={{ color: '#f87171', padding: '2rem', textAlign: 'center' }}>{error}</div>;
    if (!data) return null;

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(to bottom right, #0f172a, #1e293b)',
            color: 'white',
            padding: '2rem',
            overflowY: 'auto'
        }}>
            <button
                onClick={() => navigate('/mock-exam')}
                style={{
                    background: 'transparent', border: 'none', color: '#94a3b8',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                    marginBottom: '2rem'
                }}
            >
                <ArrowLeft size={20} /> Back to History
            </button>

            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Exam Review</h1>
                    <h2 style={{ fontSize: '1.2rem', color: '#38bdf8', marginBottom: '1rem' }}>{data.topic} ({data.difficulty})</h2>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', fontSize: '1.1rem' }}>
                        <div>
                            Score: <span style={{ fontWeight: 'bold', color: data.passed ? '#4ade80' : '#f87171' }}>{data.score} / {data.total}</span>
                        </div>
                        <div>
                            Status: <span style={{ fontWeight: 'bold', color: data.passed ? '#4ade80' : '#f87171' }}>{data.passed ? 'PASSED' : 'FAILED'}</span>
                        </div>
                        <div style={{ color: '#94a3b8' }}>
                            {new Date(data.date).toLocaleDateString()}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {data.review_data.map((item, index) => (
                        <div key={index} className="glass-panel" style={{
                            padding: '1.5rem',
                            borderLeft: `4px solid ${item.is_correct ? '#4ade80' : '#f87171'}`
                        }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{
                                    background: 'rgba(255,255,255,0.05)', borderRadius: '50%',
                                    width: '30px', height: '30px', flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 'bold', color: '#cbd5e1'
                                }}>
                                    {index + 1}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0', lineHeight: '1.5' }}>{item.question}</h3>
                                </div>
                                <div>
                                    {item.is_correct ? <CheckCircle color="#4ade80" /> : <XCircle color="#f87171" />}
                                </div>
                            </div>

                            <div style={{ marginLeft: 'calc(30px + 1rem)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{
                                    padding: '1rem', borderRadius: '8px',
                                    background: item.is_correct ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                                    border: `1px solid ${item.is_correct ? 'rgba(74, 222, 128, 0.2)' : 'rgba(248, 113, 113, 0.2)'}`
                                }}>
                                    <span style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.2rem' }}>Your Answer:</span>
                                    {item.user_answer || <span style={{ fontStyle: 'italic', color: '#64748b' }}>No Answer</span>}
                                </div>

                                {!item.is_correct && (
                                    <div style={{
                                        padding: '1rem', borderRadius: '8px',
                                        background: 'rgba(74, 222, 128, 0.05)',
                                        border: '1px solid rgba(74, 222, 128, 0.1)'
                                    }}>
                                        <span style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.2rem' }}>Correct Answer:</span>
                                        {item.correct_answer}
                                    </div>
                                )}

                                {item.explanation && (
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1', display: 'flex', gap: '8px' }}>
                                        <AlertCircle size={16} style={{ marginTop: '3px', flexShrink: 0, color: '#38bdf8' }} />
                                        <div>
                                            <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>Explanation: </span>
                                            {item.explanation}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ReviewMockExam;
