import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Markdown from 'react-markdown';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';

const LearningSession = () => {
    const { moduleId } = useParams();
    const navigate = useNavigate();
    const [content, setContent] = useState(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [mode, setMode] = useState('reading'); // 'reading' or 'quiz'
    const [selectedOption, setSelectedOption] = useState(null);
    const [quizResult, setQuizResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                const res = await api.get(`/learning/module/${moduleId}`);
                setContent(res.data);
            } catch (err) {
                console.error(err);
                alert("Error loading content. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
    }, [moduleId]);

    if (loading) return <div className="layout" style={{ textAlign: 'center', marginTop: '5rem' }}>Generating personalized AI content for you...</div>;
    if (!content) return <div className="layout">Failed to load content.</div>;

    const totalSlides = content.slides.length;

    const handleNext = () => {
        if (currentSlide < totalSlides - 1) {
            setCurrentSlide(curr => curr + 1);
        } else {
            if (content.quiz) {
                setMode('quiz');
            } else {
                handleFinish();
            }
        }
    };

    const handlePrev = () => {
        if (currentSlide > 0) setCurrentSlide(curr => curr - 1);
    };

    const handleSubmitQuiz = async () => {
        if (!selectedOption) return;
        try {
            const res = await api.post(`/learning/module/${moduleId}/submit_quiz`, { selected_option: selectedOption });
            setQuizResult(res.data);
            if (res.data.correct) {
                setTimeout(() => {
                    handleFinish();
                }, 2000);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleFinish = () => {
        navigate(-1); // Go back to roadmap
    };

    return (
        <div className="layout" style={{ maxWidth: '900px', height: '90vh', display: 'flex', flexDirection: 'column' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>{content.title}</h2>
                <div style={{ color: 'var(--text-secondary)' }}>
                    {mode === 'reading' ? `Slide ${currentSlide + 1} of ${totalSlides}` : 'Quiz Mode'}
                </div>
            </header>

            <div className="glass-panel" style={{ flex: 1, padding: '3rem', overflowY: 'auto' }}>
                {mode === 'reading' ? (
                    <div className="markdown-content">
                        <Markdown>{content.slides[currentSlide].content}</Markdown>
                    </div>
                ) : (
                    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <h3>Quiz Time!</h3>
                        <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>{content.quiz.question}</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {content.quiz.options.map((option, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => !quizResult && setSelectedOption(option)}
                                    className="glass-panel"
                                    style={{
                                        padding: '1rem', textAlign: 'left',
                                        background: selectedOption === option ? 'rgba(139, 92, 246, 0.3)' : 'transparent',
                                        border: selectedOption === option ? '1px solid var(--accent)' : undefined,
                                        cursor: quizResult ? 'default' : 'pointer'
                                    }}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>

                        {quizResult && (
                            <div style={{ marginTop: '2rem', padding: '1rem', borderRadius: '8px', background: quizResult.correct ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' }}>
                                {quizResult.correct ? "Correct! Moving to next module..." : `Incorrect. The correct answer was: ${quizResult.correct_answer}`}
                            </div>
                        )}

                        <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                            {!quizResult ? (
                                <button className="btn-primary" onClick={handleSubmitQuiz} disabled={!selectedOption}>Submit Answer</button>
                            ) : (
                                <button className="btn-primary" onClick={handleFinish}>Finish Module</button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {mode === 'reading' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                    <button
                        onClick={handlePrev}
                        style={{ display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', color: 'white', opacity: currentSlide === 0 ? 0.3 : 1 }}
                        disabled={currentSlide === 0}
                    >
                        <ChevronLeft /> Previous
                    </button>
                    <button className="btn-primary" onClick={handleNext} style={{ display: 'flex', alignItems: 'center' }}>
                        {currentSlide === totalSlides - 1 ? 'Take Quiz' : 'Next'} <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default LearningSession;
