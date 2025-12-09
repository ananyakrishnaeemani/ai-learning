import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Markdown from 'react-markdown';
import { ChevronRight, ChevronLeft, Check, RefreshCcw, BookOpen, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

const LearningSession = () => {
    const { moduleId } = useParams();
    const navigate = useNavigate();
    const [content, setContent] = useState(null);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [mode, setMode] = useState('reading'); // 'reading', 'quiz', 'result'

    // Quiz State
    const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
    const [quizAnswers, setQuizAnswers] = useState({}); // Map quizId -> selectedOption
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
    const totalQuestions = content.quizzes ? content.quizzes.length : 0;

    const handleNextSlide = () => {
        if (currentSlide < totalSlides - 1) {
            setCurrentSlide(curr => curr + 1);
        } else {
            if (content.quizzes && content.quizzes.length > 0) {
                setMode('quiz');
                setCurrentQuizIndex(0);
            } else {
                handleFinish();
            }
        }
    };

    const handlePrevSlide = () => {
        if (currentSlide > 0) setCurrentSlide(curr => curr - 1);
    };

    const handleOptionSelect = (option) => {
        if (quizResult) return; // Read only if result is shown (though usually we show result in separate mode)

        const currentQuiz = content.quizzes[currentQuizIndex];
        setQuizAnswers(prev => ({
            ...prev,
            [currentQuiz.id]: option
        }));
    };

    const handleNextQuestion = () => {
        if (currentQuizIndex < totalQuestions - 1) {
            setCurrentQuizIndex(curr => curr + 1);
        } else {
            submitQuiz();
        }
    };

    const handlePrevQuestion = () => {
        if (currentQuizIndex > 0) {
            setCurrentQuizIndex(curr => curr - 1);
        }
    };

    const submitQuiz = async () => {
        // Construct payload
        const answersList = Object.keys(quizAnswers).map(quizId => ({
            quiz_id: parseInt(quizId),
            selected_option: quizAnswers[quizId]
        }));

        // Ensure all questions answered? 
        // If not, maybe we should alert or treat as wrong. Let's assume user must answer.
        if (answersList.length < totalQuestions) {
            alert("Please answer all questions.");
            return;
        }

        try {
            const res = await api.post(`/learning/module/${moduleId}/submit_quiz`, { answers: answersList });
            setQuizResult(res.data);
            setMode('result');

            if (res.data.passed) {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
                toast.success(`Module Completed! +${10 + Math.floor(res.data.score / 10)} XP`, {
                    duration: 5000,
                    icon: '🎉',
                });
            } else {
                toast.error("Don't give up! Try again to unlock the next module.", {
                    icon: '💪'
                });
            }
        } catch (err) {
            console.error(err);
            toast.error("Error submitting quiz");
            alert("Error submitting quiz");
        }
    };

    const handleRetryQuiz = () => {
        setQuizAnswers({});
        setQuizResult(null);
        setCurrentQuizIndex(0);
        setMode('quiz');
    };

    const handleRevisitContent = () => {
        setQuizAnswers({});
        setQuizResult(null);
        setCurrentQuizIndex(0);
        setCurrentSlide(0);
        setMode('reading');
    };

    const handleFinish = () => {
        navigate(-1); // Go back to roadmap
    };

    return (
        <div className="layout" style={{ maxWidth: '900px', height: '90vh', display: 'flex', flexDirection: 'column' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>{content.title}</h2>
                <div style={{ color: 'var(--text-secondary)' }}>
                    {mode === 'reading' && `Slide ${currentSlide + 1} of ${totalSlides}`}
                    {mode === 'quiz' && `Question ${currentQuizIndex + 1} of ${totalQuestions}`}
                    {mode === 'result' && `Quiz Results`}
                </div>
            </header>

            <div className="glass-panel" style={{ flex: 1, padding: '3rem', overflowY: 'auto' }}>
                {/* READING MODE */}
                {mode === 'reading' && (
                    <div className="markdown-content">
                        <Markdown>{content.slides[currentSlide].content}</Markdown>
                    </div>
                )}

                {/* QUIZ MODE */}
                {mode === 'quiz' && content.quizzes && (
                    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <h3>Quiz Time!</h3>
                        <div style={{ marginBottom: '1rem', height: '4px', background: 'var(--bg-secondary)', borderRadius: '2px' }}>
                            <div style={{
                                width: `${((currentQuizIndex + 1) / totalQuestions) * 100}%`,
                                height: '100%',
                                background: 'var(--accent)',
                                transition: 'width 0.3s ease'
                            }} />
                        </div>

                        <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
                            {content.quizzes[currentQuizIndex].question}
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {content.quizzes[currentQuizIndex].options.map((option, idx) => {
                                const currentQuizId = content.quizzes[currentQuizIndex].id;
                                const isSelected = quizAnswers[currentQuizId] === option;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleOptionSelect(option)}
                                        className="glass-panel"
                                        style={{
                                            padding: '1rem', textAlign: 'left',
                                            background: isSelected ? 'rgba(139, 92, 246, 0.3)' : 'transparent',
                                            border: isSelected ? '1px solid var(--accent)' : '1px solid transparent',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <div style={{
                                                width: '20px', height: '20px', borderRadius: '50%',
                                                border: '2px solid var(--text-secondary)',
                                                marginRight: '1rem',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: isSelected ? 'var(--accent)' : 'transparent',
                                                borderColor: isSelected ? 'var(--accent)' : 'var(--text-secondary)'
                                            }}>
                                                {isSelected && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />}
                                            </div>
                                            {option}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
                            <button
                                onClick={handlePrevQuestion}
                                style={{ display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', color: 'white', opacity: currentQuizIndex === 0 ? 0.3 : 1 }}
                                disabled={currentQuizIndex === 0}
                            >
                                <ChevronLeft /> Previous
                            </button>

                            <button className="btn-primary" onClick={handleNextQuestion} disabled={!quizAnswers[content.quizzes[currentQuizIndex].id]}>
                                {currentQuizIndex === totalQuestions - 1 ? 'Submit Quiz' : 'Next Question'}
                            </button>
                        </div>
                    </div>
                )}

                {/* RESULT MODE */}
                {mode === 'result' && quizResult && (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{
                            width: '120px', height: '120px', borderRadius: '50%',
                            background: quizResult.passed ? 'var(--success)' : 'var(--error)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 2rem auto',
                            fontSize: '3rem', fontWeight: 'bold'
                        }}>
                            {quizResult.score}%
                        </div>

                        <h2>{quizResult.passed ? "Module Completed!" : "Keep Trying!"}</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem' }}>
                            {quizResult.passed
                                ? "Great job! You've mastered this module and unlocked the next step."
                                : "You need at least 80% to pass this module. Don't give up!"}
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                            {!quizResult.passed ? (
                                <>
                                    <button className="btn-secondary" onClick={handleRevisitContent} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <BookOpen size={18} /> Review Material
                                    </button>
                                    <button className="btn-primary" onClick={handleRetryQuiz} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <RefreshCcw size={18} /> Retry Quiz
                                    </button>
                                    <button style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', marginTop: '1rem', width: '100%' }} onClick={handleFinish}>
                                        Back to Roadmap
                                    </button>
                                </>
                            ) : (
                                <button className="btn-primary" onClick={handleFinish} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <ArrowLeft size={18} /> Back to Roadmap
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {mode === 'reading' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                    <button
                        onClick={handlePrevSlide}
                        style={{ display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', color: 'white', opacity: currentSlide === 0 ? 0.3 : 1 }}
                        disabled={currentSlide === 0}
                    >
                        <ChevronLeft /> Previous
                    </button>
                    <button className="btn-primary" onClick={handleNextSlide} style={{ display: 'flex', alignItems: 'center' }}>
                        {currentSlide === totalSlides - 1 ? 'Start Quiz' : 'Next'} <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default LearningSession;
