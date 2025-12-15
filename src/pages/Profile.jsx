import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import avatarDefault from '../assets/avatardefault.svg';
import './CSS/profile.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function Profile() {
	const { user } = useAuth();
	const { changeTheme } = useTheme();
	const [currentTheme, setCurrentTheme] = useState('');
	const { isEditing, setIsEditing } = useState(false);
	const [msg, setMsg] = useState('');
	const [formDataProfile, setFormDataProfile] = useState({
		username: '',
		email: '',
		current_password: '',
		new_password: '',
		avatar_url: '',
	});

	useEffect(() => {
		setCurrentTheme(user.theme);
		setFormDataProfile({
			username: user.username,
			email: user.email,
			current_password: '',
			new_password: '',
			avatar_url: user.avatar_url || '',
		});
	}, []);

	const handleOnChange = e => {
		const { name, value } = e.target;

		setFormDataProfile({
			...formDataProfile,
			[name]: value,
		});
	};

	const handleOnThemeSelect = e => {
		const { value } = e.target;
		console.log(value);

		setCurrentTheme(value);
		changeTheme(user.id, value);
	};

	const handleOnSubmit = async e => {
		e.preventDefault();
		setMsg('');

		const userId = user.id;
		if (!userId) {
			console.warn('No id');
			return;
		}

		const changes = {};
		if (formDataProfile.username !== user.username) changes.username = formDataProfile.username;
		if (formDataProfile.email !== user.email) changes.email = formDataProfile.email;
		if (formDataProfile.new_password !== '') changes.new_password = formDataProfile.new_password;
		if (formDataProfile.avatar_url !== user.avatar_url && formDataProfile.avatar_url !== '')
			changes.avatar_url = formDataProfile.avatar_url;
		if (Object.hasOwn(changes, 'new_password') || Object.hasOwn(changes, 'email')) {
			if (formDataProfile.current_password === '') {
				setMsg('Must supply current password to change password or email');
				return;
			}
			changes.current_password = formDataProfile.current_password;
		}

		if (Object.keys(changes).length === 0) {
			setMsg('Nothing to save');
			return;
		}

		const payload = JSON.stringify({
			...changes,
		});

		try {
			const response = await fetch(`${API_BASE}/user/${userId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: payload,
				credentials: 'include',
			});

			if (!response.ok) {
				const res = await response.json();
				setMsg(res.error);
				throw new Error(`Server error ${response.status}: ${res.error}`);
			}
		} catch (error) {
			setMsg(error);
			console.error('submit failed', error);
		}
	};

	return (
		<div className={`profile-container`}>
			<div className='profile-header'>
				<div className='profile-avatar'>
					{formDataProfile.avatar_url ? (
						<img
							className='profile-pic'
							src={formDataProfile.avatar_url}
							alt='Users profile avatar image'
						/>
					) : (
						<img
							className='profile-pic'
							src={avatarDefault}
							alt='Users profile avatar image'
						/>
					)}
				</div>

				<div className='profile-user-info-container'>
					<h1>{formDataProfile.username}</h1>
					<div className='profile-user-info'>
						<p>Level: {user.level}</p>
					</div>
					<div className='profile-user-info'>
						<p>XP: {user.total_xp}</p>
					</div>
				</div>
			</div>

			<div className='profile-details-container'>
				<div>
					<form
						className='profile-form'
						action='#'
						method='POST'
						autoComplete='off'
						onSubmit={handleOnSubmit}
					>
						<div className='profile-form-element'>
							<label htmlFor='profile-username'>Username: </label>
							<input
								type='text'
								id='profile-username'
								name='username'
								value={formDataProfile.username}
								onChange={handleOnChange}
								autoComplete='username'
							/>
						</div>

						<div className='profile-form-element'>
							<label htmlFor='profile-email'>Email: </label>
							<input
								type='email'
								id='profile-email'
								name='email'
								value={formDataProfile.email}
								onChange={handleOnChange}
								autoComplete='email'
							/>
						</div>

						<div className='profile-form-element'>
							<label htmlFor='profile-current-password'>Current password: </label>
							<input
								type='password'
								id='profile-current-password'
								name='current_password'
								value={formDataProfile.current_password}
								onChange={handleOnChange}
								autoComplete='current-password'
							/>
						</div>

						<div className='profile-form-element'>
							<label htmlFor='profile-new-password'>New password: </label>
							<input
								type='password'
								id='profile-new-password'
								name='new_password'
								value={formDataProfile.new_password}
								onChange={handleOnChange}
								autoComplete='new-password'
							/>
						</div>

						<div className='profile-form-element'>
							<label htmlFor='profile-avatar'>Avatar URL: </label>
							<input
								type='text'
								id='profile-avatar'
								name='avatar_url'
								value={formDataProfile.avatar_url}
								onChange={handleOnChange}
							/>
						</div>

						<div className='profile-form-element'>
							<label htmlFor='profile-theme'>Theme: </label>
							<select
								className='profile-theme-selector'
								name='theme'
								id='profile-theme'
								onChange={handleOnThemeSelect}
								value={currentTheme}
							>
								<option
									className='profile-theme-option navy-main-color'
									id='navy'
									name='navy'
									value='navy'
								>
									Navy
								</option>
								<option
									className='profile-theme-option ruby-main-color'
									id='ruby'
									name='ruby'
									value='ruby'
								>
									Ruby
								</option>
								<option
									className='profile-theme-option dark-main-color'
									id='dark'
									name='dark'
									value='dark'
								>
									Dark
								</option>
							</select>
						</div>
						{msg && <p style={{ color: 'Red' }}>Error: {msg}</p>}
						<button
							className='profile-save-btn'
							type='submit'
						>
							Save
						</button>
					</form>
				</div>
			</div>
		</div>
	);
}

export default Profile;
