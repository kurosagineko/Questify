import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import avatarDefault from '../assets/avatardefault.svg';
import './CSS/profile.css';

function Profile() {
	const { user } = useAuth();
	const { changeTheme } = useTheme();
	const [currentTheme, setCurrentTheme] = useState('');
	const { isEditing, setIsEditing } = useState(false);
	const [formData, setFormDataLogin] = useState({
		email: '',
		password: '',
	});

	useEffect(() => {
		setCurrentTheme(user.theme);
	}, []);

	const handleOnChange = e => {
		const { name, value } = e.target;

		setFormDataLogin({
			...formData,
			[name]: value,
		});
	};

	const handleOnThemeSelect = e => {
		const { value } = e.target;
		console.log(value);

		setCurrentTheme(value);
		changeTheme(user.id, value);
	};

	return (
		<div className={`profile-container`}>
			<div className='profile-header'>
				<div className='profile-avatar'>
					{user.avatar_url ? (
						<img
							src={user.avatar_url}
							alt='Users profile avatar image'
						/>
					) : (
						<img
							src={avatarDefault}
							alt='Users profile avatar image'
						/>
					)}
				</div>

				<div className='profile-user-info-container'>
					<h1>{user.username}</h1>
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
					<form>
						<div className='profile-form-element'>
							<label htmlFor='username'>username</label>
							<input type='text' />
						</div>

						<div className='profile-form-element'>
							<select
								className='profile-theme-selector'
								name='profile-theme'
								id='profile-theme'
								onChange={handleOnThemeSelect}
								value={currentTheme}
							>
								<option
									className='profile-theme-option'
									id='navy'
									name='navy'
									value='navy'
								>
									Navy
								</option>
								<option
									className='profile-theme-option'
									id='ruby'
									name='ruby'
									value='ruby'
								>
									Ruby
								</option>
							</select>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}

export default Profile;
