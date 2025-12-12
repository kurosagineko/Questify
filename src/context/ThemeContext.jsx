import { createContext, useContext, useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const ThemeContext = createContext('');

const defaultTheme = 'ruby';

export const ThemeProvider = ({ children }) => {
	const [usersTheme, setUserTheme] = useState(null);

	useEffect(() => {
		const checkSession = async () => {
			try {
				const res = await fetch(`${API_BASE}/me`, {
					credentials: 'include',
					cache: 'no-store',
				});

				if (!res.ok) throw new Error('not logged in');

				const { data } = await res.json();
				const user = data.user;
				setUserTheme(user.theme);
			} catch (_) {
				setUserTheme(defaultTheme);
			}
		};
		checkSession();
	}, []);

	const changeTheme = async (id, theme) => {
		const data = { theme: theme };
		try {
			const res = await fetch(`${API_BASE}/user/${id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
				credentials: 'include',
			});

			if (!res.ok) throw new Error('Changing theme failed');

			setUserTheme(theme);
		} catch (error) {
			console.log(error);
		}
	};

	return <ThemeContext.Provider value={{ usersTheme, changeTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
