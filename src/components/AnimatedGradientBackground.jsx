import './CSS/animatedgradientbackground.css';

export default function AnimatedGradientBackground({
	children,
	width = '100%',
	height = '100%',
	color = 'white',
	gradientRotation = '120deg',
	gradientColors = 'var(--complementary-color), var(--main-color), var(--secondary-color)',
	backgroundSizeX = '300%',
	backgroundSizeY = '300%',
	animationSpeed = '12s',
	animationTimingFunction = 'linear',
	borderRadius = '20px',
	style = {},
}) {
	const colors = Array.isArray(gradientColors) ? gradientColors.join(', ') : gradientColors;

	const animGradStyle = {
		width,
		height,
		color,
		background: `linear-gradient(${gradientRotation}, ${colors})`,
		backgroundSize: `${backgroundSizeX} ${backgroundSizeY}`,
		animationDuration: animationSpeed,
		animationTimingFunction,
		borderRadius,
		...style,
	};

	return (
		<div
			className='gradient-bg'
			style={animGradStyle}
		>
			{children}
		</div>
	);
}
