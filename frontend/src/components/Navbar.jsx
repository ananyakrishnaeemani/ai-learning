import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { GraduationCap, Sparkles, PenTool, BarChart2, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const navItems = [
        { path: '/chat', label: 'AI Mentor', icon: <Sparkles size={18} /> },
        { path: '/mock-exam', label: 'Mock Exams', icon: <PenTool size={18} /> },
        { path: '/progress', label: 'Progress', icon: <BarChart2 size={18} /> },
        { path: '/profile', label: 'Profile', icon: <User size={18} /> },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '1rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
        }}>
            {/* Logo */}
            <div
                onClick={() => navigate('/dashboard')}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    userSelect: 'none'
                }}
            >
                <div style={{
                    background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                    padding: '8px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                }}>
                    <GraduationCap color="white" size={24} />
                </div>
                <span style={{
                    fontSize: '1.5rem',
                    fontWeight: '800',
                    background: 'linear-gradient(to right, white, #94a3b8)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.5px'
                }}>
                    LearnWise
                </span>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.05)' }}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '0.6rem 1.2rem',
                            borderRadius: '999px',
                            textDecoration: 'none',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            color: isActive ? 'white' : '#94a3b8',
                            background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                            boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
                        })}
                    >
                        {item.icon}
                        {item.label}
                    </NavLink>
                ))}
            </div>

            {/* Logout/Actions */}
            <button
                onClick={handleLogout}
                style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#94a3b8',
                    padding: '0.6rem',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#ef4444';
                    e.currentTarget.style.color = '#ef4444';
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.color = '#94a3b8';
                    e.currentTarget.style.background = 'transparent';
                }}
            >
                <LogOut size={18} />
            </button>
        </nav>
    );
};

export default Navbar;
