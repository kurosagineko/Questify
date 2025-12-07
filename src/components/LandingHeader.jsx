import { Link } from 'react-router-dom';
import GradientText from './GradientText';
import logo from '../assets/dash-icon.png';
import './CSS/LandingHeader.css';

export default function LandingHeader() {
	return (
		<div className='header'>
			<div className='header-brand'>
				<img
					src={logo}
					alt='Dashstar logo'
					className='logo mx-auto h-30 w-auto'
				/>
				<GradientText
					animationSpeed={8}
					showBorder={false}
					className='custom-class'
					fontSize='5rem'
				>
					Dashstar
				</GradientText>
			</div>

			<nav>
				<div>
					<Link
						to='/login'
						state={{ fromLandingBtn: 'login' }}
					>
						<button
							className='LandingHeaderBtn'
							style={{ color: 'white' }}
						>
							Login
						</button>
					</Link>
					<Link
						to='/login'
						state={{ fromLandingBtn: 'register' }}
					>
						<button
							className='LandingHeaderBtn'
							style={{ color: 'white' }}
						>
							Register
						</button>
					</Link>
				</div>
			</nav>
		</div>
	);
}
