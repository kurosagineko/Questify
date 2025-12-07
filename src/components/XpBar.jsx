import { useState } from 'react';
import './CSS/xpbar.css';

export default function XpBar() {
	const [xp, setXP] = useState('20');

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
				aria-valuenow={xp}
				aria-valuemin='0'
				aria-valuemax='100'
			>
				<div style={{ ...progressStyle, width: `${xp}%` }}>
					<p style={{ height: 'fit-content', color: 'var(--secondary-color)' }}>{xp}%</p>
				</div>
			</div>
			<p>Next: Level 2</p>
		</div>
	);
}
