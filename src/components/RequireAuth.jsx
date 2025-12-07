import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';

export default function RequireAuth() {
	const { user, loading } = useAuth();
	const location = useLocation();

	if (loading) {
		return (
			<div className='flex h-screen items-center justify-center'>
				<Loading />
			</div>
		);
	}

	if (!user) {
		return (
			<Navigate
				to='/login'
				state={{ fromLandingBtn: 'login' }}
				replace
			/>
		);
	}

	return <Outlet />;
}
