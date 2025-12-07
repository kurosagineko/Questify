import { useState, useEffect } from 'react';
import './CSS/xpbar.css';

export default function XpBar({ xpToAdd }) {
	const [xp, setXP] = useState(20);

	useEffect(() => {
		if (xpToAdd == null) return;
		setXP(prev => {
			const newXP = prev + xpToAdd;
			return newXP >= 100 ? 0 : newXP;
		});
	}, [xpToAdd]);

	const progressStyle = {
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		textAlign: 'center',
		margin: '0',
		padding: '0',
		height: '100%',
		backgroundColor: 'var(--complementary-color)',
	};

	return (
		<div className='xp-container'>
			<p>XP</p>
			<div
				className='progress'
				role='progressbar'
				aria-valuenow={xp.toString()}
				aria-valuemin='0'
				aria-valuemax='100'
			>
				<div style={{ ...progressStyle, width: `${xp}%` }}>
					<p style={{ height: 'fit-content', color: 'var(--secondary-color)' }}>{xp.toString()}%</p>
				</div>
			</div>
			<p>⭐</p>
		</div>
	);
}
