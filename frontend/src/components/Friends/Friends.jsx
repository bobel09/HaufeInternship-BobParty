import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../AuthContext';
import './Friends.css';
import Navbar from '../navbar/navbar';

const FriendsPage = () => {
    const { currentUser } = useAuth();
    const [friends, setFriends] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!currentUser) return;

        const fetchFriendsAndRequests = async () => {
            try {
                const friendsResponse = await axios.get(`http://localhost:5001/users/${currentUser.username}/friends`);
                setFriends(friendsResponse.data.friends);

                const friendRequestsResponse = await axios.get(`http://localhost:5001/friend-requests/${currentUser.username}`);
                setFriendRequests(friendRequestsResponse.data);
            } catch (err) {
                console.error('Error fetching friends or friend requests', err);
            }
        };

        fetchFriendsAndRequests();
    }, [currentUser]);

    const handleSearch = async () => {
        if (!searchTerm) {
            setError('Please enter a username to search.');
            return;
        }

        try {
            const response = await axios.get(`http://localhost:5001/users?username=${encodeURIComponent(searchTerm)}`);
            setSearchResults(response.data);
            setError('');
        } catch (err) {
            setError('No users found with that username.');
        }
    };

    const handleSendFriendRequest = async (toUsername) => {
        try {
            await axios.post('http://localhost:5001/send-friend-request', { fromUsername: currentUser.username, toUsername });
            setSuccess(`Friend request sent to ${toUsername}`);
            setSearchResults([]);
        } catch (err) {
            setError('Error sending friend request.');
        }
    };

    const handleAcceptFriendRequest = async (fromUsername) => {
        try {
            await axios.post('http://localhost:5001/accept-friend-request', { currentUsername: currentUser.username, fromUsername });
            setFriends((prevFriends) => [...prevFriends, fromUsername]);
            setFriendRequests((prevRequests) => prevRequests.filter((request) => request.username !== fromUsername));
            setSuccess(`You are now friends with ${fromUsername}`);
        } catch (err) {
            setError('Error accepting friend request.');
        }
    };

    if (!currentUser) {
        return <p>Loading...</p>;
    }

    return (
        <div>
            <Navbar />
            <div className="friends-page-container">
                {error && <p className="friends-page-error-message">{error}</p>}
                {success && <p className="friends-page-success-message">{success}</p>}

                <div className="friends-page-friends-list-section">
                    <h2 className="friends-page-section-title">Your Friends</h2>
                    {friends.length > 0 ? (
                        <ul className="friends-page-friends-list">
                            {friends.map((friend, index) => (
                                <li key={index} className="friends-page-friend-item">{friend.username}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="friends-page-no-friends-text">You don't have any friends yet.</p>
                    )}
                </div>

                <div className="friends-page-add-friend-section">
                    <h2 className="friends-page-section-title">Add Friend</h2>
                    <input
                        className="friends-page-search-input"
                        type="text"
                        placeholder="Enter a username"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button className="friends-page-search-btn" onClick={handleSearch}>Search</button>
                    <div className="friends-page-search-results">
                        {searchResults.length > 0 && (
                            <ul className="friends-page-results-list">
                                {searchResults.map((user) => (
                                    <li key={user._id} className="friends-page-result-item">
                                        {user.username}
                                        <button className="friends-page-send-request-btn" onClick={() => handleSendFriendRequest(user.username)}>
                                            Send Friend Request
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="friends-page-friend-requests-section">
                    <h2 className="friends-page-section-title">Pending Friend Requests</h2>
                    {friendRequests.length > 0 ? (
                        <ul className="friends-page-requests-list">
                            {friendRequests.map((request) => (
                                <li key={request._id} className="friends-page-request-item">
                                    {request.username}
                                    <button className="friends-page-accept-btn" onClick={() => handleAcceptFriendRequest(request.username)}>
                                        Accept
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="friends-page-no-requests-text">No pending friend requests.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FriendsPage;
