import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, Key, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const Profile = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'edit';
    const { user } = useAuth();

    const [email, setEmail] = useState('');
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user?.email) setEmail(user.email);
    }, [user]);

    const handleTabChange = (tab) => {
        setSearchParams({ tab });
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put('/auth/me', { email });
            toast.success('Profile updated successfully!');
        } catch (err) {
            console.error(err);
            toast.error('Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            toast.error("New passwords don't match");
            return;
        }
        setLoading(true);
        try {
            await api.post('/auth/change-password', {
                current_password: passwords.current,
                new_password: passwords.new
            });
            toast.success('Password changed successfully!');
            setPasswords({ current: '', new: '', confirm: '' });
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.detail || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="layout">
            <h1 style={{ marginBottom: '2rem' }}>Account Settings</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem' }}>
                {/* Sidebar */}
                <div className="glass-panel" style={{ padding: '1rem', height: 'fit-content' }}>
                    <div style={{
                        padding: '1rem', borderRadius: '8px', cursor: 'pointer',
                        background: activeTab === 'edit' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                        color: activeTab === 'edit' ? 'var(--accent)' : 'var(--text-secondary)',
                        display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem'
                    }} onClick={() => handleTabChange('edit')}>
                        <User size={18} /> Edit Profile
                    </div>
                    <div style={{
                        padding: '1rem', borderRadius: '8px', cursor: 'pointer',
                        background: activeTab === 'password' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                        color: activeTab === 'password' ? 'var(--accent)' : 'var(--text-secondary)',
                        display: 'flex', alignItems: 'center', gap: '0.8rem'
                    }} onClick={() => handleTabChange('password')}>
                        <Key size={18} /> Change Password
                    </div>
                </div>

                {/* Content */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    {activeTab === 'edit' ? (
                        <div>
                            <h2 style={{ marginTop: 0 }}>Edit Profile</h2>
                            <p style={{ color: 'var(--text-secondary)' }}>Update your personal information.</p>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                                <div style={{
                                    width: '80px', height: '80px', borderRadius: '50%',
                                    background: 'var(--accent)', color: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem'
                                }}>
                                    {user?.username?.substring(0, 2).toUpperCase()}
                                </div>
                            </div>

                            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '400px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Username</label>
                                    <input type="text" defaultValue={user?.username} disabled style={{ opacity: 0.7 }} />
                                    <small style={{ color: 'var(--text-secondary)' }}>Username cannot be changed.</small>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
                                    <input
                                        type="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <button type="submit" disabled={loading} className="btn-primary" style={{ width: 'fit-content' }}>
                                    <Save size={18} style={{ marginRight: '8px' }} />
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div>
                            <h2 style={{ marginTop: 0 }}>Change Password</h2>
                            <p style={{ color: 'var(--text-secondary)' }}>Ensure your account is secure.</p>

                            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '400px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Current Password</label>
                                    <input
                                        type="password"
                                        value={passwords.current}
                                        onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>New Password</label>
                                    <input
                                        type="password"
                                        value={passwords.new}
                                        onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={passwords.confirm}
                                        onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                        required
                                    />
                                </div>
                                <button type="submit" disabled={loading} className="btn-primary" style={{ width: 'fit-content' }}>
                                    {loading ? 'Updating...' : 'Update Password'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
