import React, { createContext, useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            // If token stored from previous session, set Authorization header
            const token = localStorage.getItem('token');
            if (token) {
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }
            try {
                const res = await api.get('/auth/me');
                setUser(res.data);
            } catch (err) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        initializeAuth();
    }, []);

    const login = async (credentials) => {
        const res = await api.post('/auth/login', credentials);
        // Set minimal user state synchronously to avoid navigation race
        // (login response includes role + isVerified)
        try {
            const token = res.data.token;
            if (token) {
                // persist token so subsequent requests include it
                localStorage.setItem('token', token);
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }
            // Set minimal user state synchronously to avoid navigation race
            try {
                flushSync(() => setUser(res.data));
            } catch (e) {
                setUser(res.data);
            }
            // Refresh full user profile in background
            try {
                const userRes = await api.get('/auth/me');
                setUser(userRes.data);
            } catch (err) {
                // ignore
            }
            return res.data;
        } catch (err) {
            throw err;
        }
    };

    const register = async (data) => {
        const res = await api.post('/auth/register', data);
        return res.data;
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (err) {
            // ignore network errors
        }
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
