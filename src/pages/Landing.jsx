import LandingHeader from '../components/LandingHeader';
import CarouselBanner from '../components/CarouselBanner';
import LandingFooter from '../components/LandingFooter';
import FeatureSection from '../components/FeatureSection';
import TextType from '../components/TextType';
import { useTheme } from '../context/ThemeContext';
import './CSS/landing.css';

const features = [
	{
		name: 'Manage your workflow.',
		description:
			"Admins create tasks → they appear instantly on your board. Everyone knows what's next, so work never stalls.",
		icon: '◈',
	},
	{
		name: 'Earn XP, Level up. Win.',
		description:
			'Complete tasks, collect XP, unlock stars. When you level up, you unlock team‑wide perks in the Reward Store.',
		icon: '◈',
	},
	{
		name: 'Redeem Real Rewards.',
		description:
			'Spend earned stars on company benefits, gift cards, or fun perks. Turn productivity into tangible value.',
		icon: '◈',
	},
];

export default function Landing() {
	const { usersTheme } = useTheme();
	return (
		<div className={`landing ${usersTheme}`}>
			<LandingHeader />
			<TextType
				className='tagline'
				text={[
					'Fun and intuitive task management',
					'Work happier with little rewards for doing tasks',
					'Earn badges, achievements and unlock secrets!!',
				]}
				typingSpeed={75}
				pauseDuration={1500}
				showCursor={true}
				cursorCharacter='|'
			/>
			<FeatureSection features={features} />
			<LandingFooter />
		</div>
	);
}
