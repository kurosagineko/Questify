import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useState, useContext, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import TaskCard from '../components/TaskCard';
import TaskList from '../components/TaskList';
import TeamIconButton from '../components/TeamIconButton';
import CreateTaskModal from '../components/CreateTaskModal';
import XpBar from '../components/XpBar';
import AI from '../components/AI';
import AnimatedGradientBackground from '../components/AnimatedGradientBackground';
import './CSS/dashboard.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

import avatarDefault from '../assets/avatardefault.svg';
import burgerMenuIcon from '../assets/BurgerMenuIcon.png';

// more secure password
// daily quests
// email verification
// gaining xp, leveling up, gaining a star - logic, animations and images, tasks give 10xp, 100xp to level up, company sets star reward prices
// authenticate all routes
// show dashboard btn on landing instead of login register if already logged in
// forgot password link
// Add a way to view and restore archived tasks
// show teams of workspace
// show members of team

// task streaks
// team vs team challenges
// metrics for teams and metrics for workspace owners
// badges
// achievements
// get stars for leveling up, spend stars in a shop with company added rewards
// individual store items and team wide store items
// animations for leveling up, completing tasks, buying from store
// slack and discord integration
// 2FA and email verification

export default function Dashboard() {
	const { user, logout } = useAuth();
	const [level, setLevel] = useState(0);
	const [xp, setTotalXp] = useState(0);
	const [currentXp, setCurrentXp] = useState(0);
	const [username, setUsername] = useState('');
	const [avatar, setAvatar] = useState(avatarDefault);
	const [openList, setOpenList] = useState([]);
	const [inprogressList, setInprogressList] = useState([]);
	const [completeList, setCompleteList] = useState([]);
	const [currentBoard, setCurrentBoard] = useState('Personal');
	const [showTaskModal, setShowTaskModal] = useState(false);
	const [refreshCounter, setRefreshCounter] = useState(0); // bump this when a change happens in the task lists to trigger the hook

	useEffect(() => {
		setLevel(user.level);
		setTotalXp(user.total_xp);
		setCurrentXp(user.current_xp);
		setUsername(user.username);
		if (user.avatar_url !== '') setAvatar(user.avatar_url);
	}, []);

	useEffect(() => {
		const abort = new AbortController();

		try {
			fetch(`${API_BASE}/tasks?user_id=${user.id}`, {
				signal: abort.signal,
			})
				.then(res => {
					if (!res.ok) {
						console.log({ error: 'Something went wrong fetching tasks' });
					}
					return res.json();
				})
				.then(data => {
					const openTasks = data.tasks.filter(task => task.status === 'open');
					setOpenList([...openTasks]);

					const inprogressTasks = data.tasks.filter(task => task.status === 'inprogress');
					setInprogressList([...inprogressTasks]);

					const completeTasks = data.tasks.filter(task => task.status === 'complete');
					setCompleteList([...completeTasks]);
				});
		} catch (error) {
			console.log('Error loading tasks', error);
		}
	}, [refreshCounter]);

	const populateTeamIconButtons = () => {};

	const toggleCreateTaskModal = () => setShowTaskModal(prev => !prev);

	const showCreateNewTeamModal = () => {};

	const switchDashboard = () => {};

	// make reusable
	const TaskListPlaceHolder = () => {
		return (
			<div className='placeholder'>
				<p>No tasks in this list</p>
				{/* Maybe switch for an image here */}
				<p>(～￣▽￣)～</p>
			</div>
		);
	};

	const CreateTaskList = ({ title, list, showCreateBtn }) => {
		return (
			<TaskList
				title={title}
				showCreateBtn={showCreateBtn}
				onClickHandler={toggleCreateTaskModal}
			>
				{list.length !== 0 ? (
					<ul className='task-list dash-bg dash-border dash-shadow'>
						{list.map(task => (
							<li key={task.id}>
								<TaskCard
									status={task.status}
									user_id={user.id}
									task_id={task.id}
									title={task.task_name}
									desc={task.task_desc}
									refreshHandler={setRefreshCounter}
								/>
							</li>
						))}
					</ul>
				) : (
					<TaskListPlaceHolder />
				)}
			</TaskList>
		);
	};

	return (
		<div>
			{' '}
			{/* change navy to user selected theme */}
			<div>
				<div
					className='modal-bg '
					style={showTaskModal ? { display: 'block' } : { display: 'none' }}
					onClick={() => toggleCreateTaskModal()}
				></div>
				<div style={showTaskModal ? { display: 'block' } : { display: 'none' }}>
					<CreateTaskModal
						onClickHandler={toggleCreateTaskModal}
						refreshHandler={setRefreshCounter}
						id={user.id}
					/>
				</div>
			</div>
			<div className='dash-header'>
				<div className='burger-menu'>
					<img
						src={burgerMenuIcon}
						alt='Open menu icon'
					/>
				</div>

				<button onClick={() => logout()}>Logout</button>

				<div className='workspace-label-container'>
					<AnimatedGradientBackground animationSpeed='10s'>
						<h2 className='workspace-label'>{currentBoard}</h2>
					</AnimatedGradientBackground>
				</div>

				<div className='widgets'>
					<div className='level-widget dash-bg dash-border dash-shadow'>
						<div className='current-level'>
							<p style={{ height: 'fit-content', borderRight: '2px solid var(--tertiary-color)' }}>Level: {level}</p>
							<p style={{ height: 'fit-content' }}>Total: {xp}</p>
						</div>
						<div></div>
					</div>

					<Link to='/profile'>
						<div className='profile-widget dash-bg dash-border dash-shadow'>
							<div className='user-info'>
								<p>{username}</p>
							</div>
							<div className='profile-pic-container'>
								<img
									className='profile-pic'
									src={avatar || avatarDefault}
									alt='user profile picture'
								/>
							</div>
						</div>
					</Link>
				</div>
			</div>
			{}
			<div style={{ display: 'flex', justifyContent: 'center' }}>{<XpBar />}</div>
			<div className='dash-main'>
				{/* Add images for buttons here with onClick functionality */}
				<div className='dash-buttons dash-border dash-shadow'>
					<div
						className='team-buttons-alignment'
						style={{ marginBottom: '40px' }}
					>
						<TeamIconButton
							teamName={'Personal'}
							icon='🏠'
						/>
					</div>
					<div className='team-buttons-alignment'>
						<TeamIconButton
							teamName={'Create Team'}
							icon='+'
							fontSize={'2rem'}
							onClickHandler={() => console.log('click')}
						/>
					</div>
					<div className='team-buttons-alignment'>
						<TeamIconButton
							teamName={'Alpha Squad'}
							icon='▶'
						/>
					</div>
					<div className='dash-button dash-bg dash-border dash-shadow'>
						<p>■</p>
					</div>
					<div className='dash-button dash-bg dash-border dash-shadow'>
						<p>■</p>
					</div>
				</div>
				{}
				<div className='task-view-container dash-border dash-shadow'>
					<CreateTaskList
						title='Tasks'
						list={openList}
						showCreateBtn={true}
					/>
					<CreateTaskList
						title='In-progress'
						list={inprogressList}
					/>
					<CreateTaskList
						title='Complete'
						list={completeList}
					/>
				</div>
			</div>
			{/* <div className='metrics-view-container dash-border dash-shadow'></div> */}
			<AI
				taskList={[...openList, ...inprogressList, ...completeList]}
				username={user.username}
			/>
		</div>
	);
}
