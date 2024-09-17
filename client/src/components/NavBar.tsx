import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { UserContext } from '../components/UserContext';

export function NavBar() {
  const { user, handleSignOut } = useContext(UserContext);
  const navigate = useNavigate();

  async function handleSignOutClick() {
    handleSignOut();
    navigate('/');
  }

  return (
    <>
      <header className="purple-background">
        <div className="container">
          <div className="row">
            <div className="column-full d-flex align-center">
              <h1 className="white-text">Code Journal</h1>
              <Link to="/" className="entries-link white-text">
                <h3>Entries</h3>
              </Link>
              {user ? (
                <Link
                  to="/"
                  onClick={handleSignOutClick}
                  className="white-text px-4">
                  Sign Out
                </Link>
              ) : (
                <Link to="/auth/sign-in" className="white-text px-4">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
      <Outlet />
    </>
  );
}
