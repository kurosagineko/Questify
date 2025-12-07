import FuzzyText from '../components/FuzzyText';
import './CSS/NotFound.css';

export default function NotFound() {
	return (
		<div className='NF-container'>
			<FuzzyText baseIntensity={0.2}>404</FuzzyText>
			<FuzzyText
				baseIntensity={0.2}
				fontSize='2rem'
			>
				Page Not Found
			</FuzzyText>
		</div>
	);
}
