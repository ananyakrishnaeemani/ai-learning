import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await api.get('/auth/me');
                    setUser(response.data);
                } catch (error) {
                    console.error("Token verification failed", error);
                    localStorage.removeItem('token');
                    setUser(null);
                }
            }
            setLoading(false);
        };
        verifyUser();
    }, []);

    const login = async (username, password) => {
        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);

            const response = await api.post('/auth/token', formData);
            const { access_token } = response.data;

            localStorage.setItem('token', access_token);
            setUser({ username });
            return true;
        } catch (error) {
            console.error("Login failed", error);
            return false;
        }
    };

    const signup = async (username, email, password) => {
        try {
            const response = await api.post('/auth/signup', { username, email, password });
            const { access_token } = response.data;
            localStorage.setItem('token', access_token);
            setUser({ username });
            return true;
        } catch (error) {
            console.error("Signup failed", error);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
