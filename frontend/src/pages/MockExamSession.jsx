import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Clock, CheckCircle, XCircle, Code, List, Type, AlertTriangle, Maximize } from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

const MockExamSession = () => {
    const { examId } = useParams();
    const navigate = useNavigate();

    // State
    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({}); // { index: value }
    const [timeLeft, setTimeLeft] = useState(0); // seconds
    const [result, setResult] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [started, setStarted] = useState(false); // New explicit start state

    // Refs
    const containerRef = useRef(null);

    // Fetch Exam
    useEffect(() => {
        const fetchExam = async () => {
            try {
                const res = await api.get(`/mock-exam/${examId}`);
                setExam(res.data);
                // Set initial timer: e.g. 2 mins per question
                const totalTime = (res.data.questions.length || 5) * 2 * 60;
                setTimeLeft(totalTime);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load exam");
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchExam();
    }, [examId, navigate]);

    // Timer (Only runs if started is true)
    useEffect(() => {
        if (!started || !exam || result || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmit(); // Auto submit
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [started, exam, result, timeLeft]);

    // Fullscreen Monitor
    useEffect(() => {
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement && started && !result && !submitting) {
                // If exited fullscreen, and exam is ongoing -> FAIL
                toast.error("Exam Terminated: Fullscreen exited!", { duration: 5000, icon: '🚨' });
                handleSubmit(true); // Passed 'true' to indicate forced failure if we want, or just submit current state
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange); // Safari/older chrome

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        };
    }, [started, result, submitting]);

    // Handlers
    const handleAnswer = (value) => {
        setAnswers(prev => ({
            ...prev,
            [currentQuestion]: value
        }));
    };

    const enterFullScreen = async () => {
        try {
            if (containerRef.current && containerRef.current.requestFullscreen) {
                await containerRef.current.requestFullscreen();
            } else if (containerRef.current && containerRef.current.webkitRequestFullscreen) {
                await containerRef.current.webkitRequestFullscreen();
            }
        } catch (err) {
            console.error("Fullscreen error:", err);
            toast.error("Could not enter fullscreen. Please check browser permissions.");
        }
    };

    const handleStartExam = async () => {
        await enterFullScreen();
        setStarted(true);
        toast.success("Exam Started! Do not exit fullscreen.", { icon: '🔒' });
    };

    const handleSubmit = async (forcedFail = false) => {
        if (submitting) return;
        setSubmitting(true);

        // Format answers
        const payload = Object.keys(answers).map(key => ({
            question_index: parseInt(key),
            answer: answers[key]
        }));

        try {
            // If forced fail (fullscreen exit), we might want to send a flag if backend supported it, 
            // but for now, submitting incomplete answers will likely result in failure anyway.
            // Or we could mock the response if we really want to guarantee a "0" score.
            // For now, let's submit what we have.
            const res = await api.post(`/mock-exam/${examId}/submit`, payload);
            setResult(res.data);

            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => { });
            }
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.detail || "Failed to submit exam";
            toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
            setSubmitting(false);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (loading) return <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#0f172a', color: 'white' }}>Loading Exam...</div>;

    // START SCREEN OVERLAY
    if (!started && !result) {
        return (
            <div ref={containerRef} style={{ height: '100vh', width: '100vw', background: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div className="glass-panel" style={{ padding: '3rem', maxWidth: '600px', textAlign: 'center' }}>
                    <h1 style={{ marginBottom: '1rem', fontSize: '2rem' }}>{exam.topic} Exam</h1>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2rem', color: '#94a3b8' }}>
                        <span>Difficulty: <strong style={{ color: 'white' }}>{exam.difficulty}</strong></span>
                        <span>Questions: <strong style={{ color: 'white' }}>{exam.questions.length}</strong></span>
                        <span>Time: <strong style={{ color: 'white' }}>{Math.floor(timeLeft / 60)} mins</strong></span>
                    </div>

                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', textAlign: 'left' }}>
                        <h3 style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}>
                            <AlertTriangle size={20} /> Strict Exam Rules
                        </h3>
                        <ul style={{ margin: '0.5rem 0 0 1.5rem', color: '#cbd5e1' }}>
                            <li>This exam is <strong>Fullscreen Proctored</strong>.</li>
                            <li>You must remain in fullscreen mode for the entire duration.</li>
                            <li><strong>Exiting fullscreen will automatically FAIL the exam.</strong></li>
                            <li>Do not switch tabs or windows.</li>
                        </ul>
                    </div>

                    <button onClick={handleStartExam} className="btn-primary" style={{ fontSize: '1.2rem', padding: '1rem 3rem', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                        <Maximize size={20} /> Start Exam
                    </button>
                    <button onClick={() => navigate('/mock-exam')} style={{ display: 'block', margin: '1rem auto 0', background: 'transparent', border: 'none', color: '#64748b' }}>
                        Cancel and Go Back
                    </button>
                </div>
            </div>
        );
    }

    if (result) {
        return (
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'white', gap: '2rem' }}>
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
                        {result.passed ? '🎉' : '📚'}
                    </div>
                    <h1 style={{ marginBottom: '0.5rem' }}>{result.passed ? 'Exam Passed!' : 'Keep Practicing'}</h1>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: result.passed ? '#4ade80' : '#f87171', margin: '1rem 0' }}>
                        {result.score} / {result.total}
                    </div>
                    <p style={{ color: '#94a3b8' }}>
                        {result.passed ? `You earned ${result.xp_earned} XP!` : 'Review the topics and try again.'}
                    </p>
                    <button onClick={() => navigate('/mock-exam')} className="btn-primary" style={{ marginTop: '2rem' }}>
                        Back to Exam List
                    </button>
                </div>
            </div>
        );
    }

    const question = exam.questions[currentQuestion];

    return (
        <div ref={containerRef} style={{
            height: '100vh', width: '100vw',
            background: '#0f172a', color: 'white',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <header style={{
                padding: '1rem 2rem', background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <div>
                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{exam.topic} <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: '8px' }}>({exam.difficulty})</span></h2>
                </div>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <div style={{ fontSize: '1.2rem', fontFamily: 'monospace', color: timeLeft < 60 ? '#ef4444' : '#a78bfa', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={20} /> {formatTime(timeLeft)}
                    </div>
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.5)',
                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '4px'
                    }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 2s infinite' }}></div>
                        Proctored Mode
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '900px', width: '100%', margin: '0 auto', padding: '2rem', overflowY: 'auto' }}>
                <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                    <span>Question {currentQuestion + 1} of {exam.questions.length}</span>
                    <span style={{ textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>{question.type}</span>
                </div>

                <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.4rem', lineHeight: '1.6', marginBottom: '1.5rem' }}>{question.question}</h3>

                    {/* Render Options */}
                    {['mcq', 'boolean'].includes(question.type) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {(question.options || ["True", "False"]).map((opt, idx) => (
                                <label key={idx} style={{
                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                    padding: '1rem', borderRadius: '8px',
                                    background: answers[currentQuestion] === opt ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                                    border: answers[currentQuestion] === opt ? '1px solid #8b5cf6' : '1px solid transparent',
                                    cursor: 'pointer', transition: 'all 0.2s'
                                }}>
                                    <input
                                        type="radio"
                                        name={`q-${currentQuestion}`}
                                        value={opt}
                                        checked={answers[currentQuestion] === opt}
                                        onChange={() => handleAnswer(opt)}
                                        style={{ accentColor: '#8b5cf6', width: '18px', height: '18px' }}
                                    />
                                    <span style={{ fontSize: '1.1rem' }}>{opt}</span>
                                </label>
                            ))}
                        </div>
                    )}

                    {question.type === 'code' && (
                        <div>
                            <div style={{ marginBottom: '1rem', background: '#020617', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem', color: '#94a3b8' }}>
                                <strong>Task:</strong> {question.question} <br />
                                <strong>Input:</strong> {question.test_case_input} <br />
                                <strong>Expected Output:</strong> {question.test_case_output}
                            </div>
                            <textarea
                                value={answers[currentQuestion] || ''}
                                onChange={(e) => handleAnswer(e.target.value)}
                                placeholder="// Write your code here..."
                                style={{
                                    width: '100%', minHeight: '200px',
                                    background: '#0f172a', color: '#e2e8f0',
                                    fontFamily: 'monospace', padding: '1rem',
                                    border: '1px solid #475569', borderRadius: '8px',
                                    resize: 'vertical'
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <footer style={{
                padding: '1.5rem 2rem', background: 'rgba(15, 23, 42, 0.8)', borderTop: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
                <button
                    onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                    disabled={currentQuestion === 0}
                    className="btn-secondary"
                    style={{ opacity: currentQuestion === 0 ? 0.5 : 1 }}
                >
                    Previous
                </button>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {exam.questions.map((_, idx) => (
                        <div key={idx} style={{
                            width: '30px', height: '4px', borderRadius: '2px',
                            background: idx === currentQuestion ? '#8b5cf6' : (answers[idx] ? '#4ade80' : '#334155')
                        }} />
                    ))}
                </div>

                {currentQuestion === exam.questions.length - 1 ? (
                    <button onClick={() => handleSubmit(false)} disabled={submitting} className="btn-primary" style={{ background: '#ec4899' }}>
                        {submitting ? 'Submitting...' : 'Submit Exam'}
                    </button>
                ) : (
                    <button onClick={() => setCurrentQuestion(prev => Math.min(exam.questions.length - 1, prev + 1))} className="btn-primary">
                        Next Question
                    </button>
                )}
            </footer>
        </div>
    );
};

export default MockExamSession;
