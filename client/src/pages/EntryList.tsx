import { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { FaPencilAlt } from 'react-icons/fa';
import { Entry, readEntries } from '../lib/data';
import { UserContext } from '../components/UserContext';

export function EntryList() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>();
  const { user } = useContext(UserContext);

  useEffect(() => {
    async function fetchEntries() {
      try {
        setIsLoading(true);
        const entries = await readEntries();
        setEntries(entries);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchEntries();
  }, [user]);

  if (isLoading) return <div>Loading...</div>;
  if (error) {
    return (
      <div>
        Error Loading Entries:{' '}
        {error instanceof Error ? error.message : 'Unknown Error'}
      </div>
    );
  }
  if (entries.length === 0) {
    return (
      <div className="row">
        <div className="column-full d-flex justify-between align-center">
          <h1>Entries</h1>
          <h3>
            {user && (
              <Link to="/details/new" className="white-text form-link">
                NEW
              </Link>
            )}
          </h3>
        </div>
        <p>
          {user && 'No entries found. Create new entry'}
          {!user && 'Please sign in to create a new entry'}
        </p>
      </div>
    );
  }
  return (
    <div className="container">
      <div className="row">
        <div className="column-full d-flex justify-between align-center">
          <h1>Entries</h1>
          <h3>
            <Link to="/details/new" className="white-text form-link">
              NEW
            </Link>
          </h3>
        </div>
      </div>
      <div className="row">
        <div className="column-full">
          <ul className="entry-ul">
            {entries.map((entry) => (
              <EntryCard key={entry.entryId} entry={entry} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

type EntryProps = {
  entry: Entry;
};
function EntryCard({ entry }: EntryProps) {
  return (
    <li>
      <div className="row">
        <div className="column-half">
          <img
            className="input-b-radius form-image"
            src={entry.photoUrl}
            alt=""
          />
        </div>
        <div className="column-half">
          <div className="row">
            <div className="column-full d-flex justify-between">
              <h3>{entry.title}</h3>
              <Link to={`details/${entry.entryId}`}>
                <FaPencilAlt />
              </Link>
            </div>
          </div>
          <p>{entry.notes}</p>
        </div>
      </div>
    </li>
  );
}
