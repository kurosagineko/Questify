import { createContext, useContext, useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const ThemeContext = createContext('');

const defaultTheme = 'navy';

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
				document.getElementsByTagName('html')[0].className = user.theme;
			} catch (_) {
				document.getElementsByTagName('html')[0].className = defaultTheme;
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

			document.getElementsByTagName('html')[0].className = theme;
		} catch (error) {
			console.log(error);
		}
	};

	return <ThemeContext.Provider value={{ usersTheme, changeTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
