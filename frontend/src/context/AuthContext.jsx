import React, { createContext, useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await api.get('/auth/me');
                setUser(res.data);
            } catch (err) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const login = async (credentials) => {
        const res = await api.post('/auth/login', credentials);
        // Set minimal user state synchronously to avoid navigation race
        // (login response includes role + isVerified)
        try {
            flushSync(() => setUser(res.data));
        } catch (e) {
            // flushSync may not be available in some environments; fallback
            setUser(res.data);
        }
        // Refresh full user profile in background
        try {
            const userRes = await api.get('/auth/me');
            setUser(userRes.data);
        } catch (err) {
            // ignore - keep minimal state so UI can proceed
        }
        return res.data;
    };

    const register = async (data) => {
        const res = await api.post('/auth/register', data);
        return res.data;
    };

    const logout = async () => {
        await api.post('/auth/logout');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
