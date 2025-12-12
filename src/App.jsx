import { Route, Routes } from 'react-router-dom';
import './App.css';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import LoginRegister from './pages/LoginRegister';
import RequireAuth from './components/RequireAuth';

function App() {
	return (
		<Routes>
			{/* Public routes */}
			<Route
				path='/'
				element={<Landing />}
			/>
			<Route
				path='/login'
				element={<LoginRegister />}
			/>

			{/* Protected routes */}
			<Route element={<RequireAuth />}>
				<Route
					path='/profile'
					element={<Profile />}
				/>
				<Route
					path='/dashboard'
					element={<Dashboard />}
				/>
			</Route>

			<Route
				path='*'
				element={<NotFound />}
			/>
		</Routes>
	);
}

export default App;
