import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const AuthContext = createContext({
	user: null,
	loading: true,
	login: () => {},
	logout: () => {},
});

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const navigate = useNavigate();

	useEffect(() => {
		const checkSession = async () => {
			try {
				const res = await fetch(`${API_BASE}/me`, {
					credentials: 'include',
					cache: 'no-store',
				});

				if (!res.ok) throw new Error('not logged in');

				const { data } = await res.json();
				setUser(data.user);
			} catch (_) {
				setUser(null);
			} finally {
				setLoading(false);
			}
		};
		checkSession();
	}, []);

	const login = userData => {
		setUser(userData);
	};

	const logout = async () => {
		try {
			await fetch(`${API_BASE}/logout`, {
				credentials: 'include',
			});
		} catch (error) {
			console.log(error);
		}
		setUser(null);
		navigate('/login', { state: { fromLandingBtn: 'login' }, replace: true });
	};

	return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
