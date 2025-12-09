import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, Settings, Key } from 'lucide-react';

const ProfileDropdown = () => {
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const getInitials = (name) => {
        return name ? name.substring(0, 2).toUpperCase() : 'U';
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: 'var(--accent)', color: 'white', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', fontWeight: 'bold'
                }}
            >
                {getInitials(user?.username)}
            </button>

            {isOpen && (
                <div className="glass-panel" style={{
                    position: 'absolute', top: '110%', right: 0,
                    width: '200px', padding: '0.5rem',
                    zIndex: 1000, boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                }}>
                    <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '0.5rem' }}>
                        <div style={{ fontWeight: 'bold' }}>{user?.username}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Student</div>
                    </div>

                    <Link to="/profile?tab=edit" style={{ textDecoration: 'none' }} onClick={() => setIsOpen(false)}>
                        <div style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text)', cursor: 'pointer', borderRadius: '4px', transition: 'background 0.2s' }} className="hover-bg">
                            <User size={16} /> Edit Profile
                        </div>
                    </Link>

                    <Link to="/profile?tab=password" style={{ textDecoration: 'none' }} onClick={() => setIsOpen(false)}>
                        <div style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text)', cursor: 'pointer', borderRadius: '4px', transition: 'background 0.2s' }} className="hover-bg">
                            <Key size={16} /> Change Password
                        </div>
                    </Link>

                    <div onClick={handleLogout} style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', cursor: 'pointer', borderRadius: '4px', marginTop: '0.5rem' }} className="hover-bg">
                        <LogOut size={16} /> Sign Out
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileDropdown;
