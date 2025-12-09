import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Sparkles, BrainCircuit, ArrowRight, BookOpen, Target } from 'lucide-react';

const Home = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '100vh',
            background: 'radial-gradient(ellipse at top, #1e293b 0%, #0f172a 100%)',
            color: 'white',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Nav (Simple) */}
            <nav style={{
                padding: '2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                maxWidth: '1200px',
                width: '100%',
                margin: '0 auto'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                        padding: '8px', borderRadius: '12px'
                    }}>
                        <GraduationCap size={24} color="white" />
                    </div>
                    <span style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.5px' }}>LearnWise</span>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <button
                        onClick={() => navigate('/login')}
                        style={{
                            background: 'transparent', color: '#cbd5e1', border: 'none', fontSize: '1rem', fontWeight: '500'
                        }}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => navigate('/signup')}
                        className="btn-primary"
                        style={{
                            borderRadius: '999px',
                            boxShadow: '0 4px 14px 0 rgba(139, 92, 246, 0.39)'
                        }}
                    >
                        Get Started
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <main style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                textAlign: 'center'
            }}>
                <div style={{ maxWidth: '900px' }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)',
                        padding: '0.5rem 1rem', borderRadius: '999px',
                        color: '#a78bfa', fontSize: '0.9rem', marginBottom: '2rem'
                    }}>
                        <Sparkles size={16} /> Powering the future of education
                    </div>
                    <h1 style={{
                        fontSize: '5rem', fontWeight: '900',
                        lineHeight: '1.1',
                        marginBottom: '1.5rem',
                        background: 'linear-gradient(to bottom right, #ffffff, #94a3b8)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Master Any Subject <br /> with AI precision.
                    </h1>
                    <p style={{
                        fontSize: '1.25rem', color: '#94a3b8', maxWidth: '600px', margin: '0 auto 3rem auto', lineHeight: '1.6'
                    }}>
                        Generate personalized roadmaps, taking mock exams to test your knowledge, and track your progress with our state-of-the-art AI Mentor.
                    </p>

                    <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                        <button
                            onClick={() => navigate('/signup')}
                            style={{
                                padding: '1rem 2.5rem', borderRadius: '999px',
                                background: 'white', color: '#0f172a',
                                border: 'none', fontSize: '1.1rem', fontWeight: 'bold',
                                display: 'flex', alignItems: 'center', gap: '10px',
                                cursor: 'pointer', transition: 'transform 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            Start Learning Free <ArrowRight size={20} />
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            style={{
                                padding: '1rem 2.5rem', borderRadius: '999px',
                                background: 'rgba(255,255,255,0.05)', color: 'white',
                                border: '1px solid rgba(255,255,255,0.1)', fontSize: '1.1rem', fontWeight: 'bold',
                                cursor: 'pointer', transition: 'background 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        >
                            Log In
                        </button>
                    </div>

                    {/* Features Grid */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem',
                        marginTop: '6rem', textAlign: 'left'
                    }}>
                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <div style={{ marginBottom: '1rem', color: '#a78bfa' }}><BrainCircuit size={32} /></div>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>AI Mentor</h3>
                            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Chat with our advanced AI to clear doubts and get deep explanations instantly.</p>
                        </div>
                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <div style={{ marginBottom: '1rem', color: '#f472b6' }}><Target size={32} /></div>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Mock Exams</h3>
                            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Generate infinite mock exams for any difficulty and topic to test your skills.</p>
                        </div>
                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <div style={{ marginBottom: '1rem', color: '#34d399' }}><BookOpen size={32} /></div>
                            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Smart Roadmaps</h3>
                            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Get structured learning paths generated specifically for your goals.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Home;
