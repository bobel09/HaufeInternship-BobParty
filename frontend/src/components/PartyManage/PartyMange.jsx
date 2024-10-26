// PartyManage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import axios from 'axios';
import './PartyManage.css';
import Navbar from '../navbar/navbar';

const PartyManage = () => {
  const { currentUser } = useAuth();
  const [hostedParties, setHostedParties] = useState([]);
  const [editingParty, setEditingParty] = useState(null);
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);

  useEffect(() => {
    const fetchHostedParties = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/hosted-parties/${currentUser.username}`);
        setHostedParties(response.data);
      } catch (error) {
        console.error('Error fetching hosted parties:', error);
      }
    };

    const fetchFriends = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/users/${currentUser.username}/friends`);
        setFriends(response.data.friends);
      } catch (error) {
        console.error('Error fetching friends:', error);
      }
    };

    fetchHostedParties();
    fetchFriends();
  }, [currentUser]);

  const handleEditParty = (party) => {
    if (party.status === 'active') {
      setEditingParty({ ...party });
    } else {
      alert('You can only edit active parties.');
    }
  };

  const handleRequirementChange = (index, field, value) => {
    const updatedRequirements = [...editingParty.requirements];
    updatedRequirements[index][field] = value;
    setEditingParty({ ...editingParty, requirements: updatedRequirements });
  };

  const handleTimeChange = (field, value) => {
    setEditingParty((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveChanges = async () => {
    try {
      const response = await axios.put(`http://localhost:5001/party/${editingParty._id}`, {
        username: currentUser.username,
        requirements: editingParty.requirements,
        startTime: editingParty.startTime,
        endTime: editingParty.endTime,
      });
      setHostedParties((prev) =>
        prev.map((party) => (party._id === response.data._id ? response.data : party))
      );
      setEditingParty(null);
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Failed to save changes. Please try again.');
    }
  };

  const handleCancelParty = async (partyId) => {
    try {
      await axios.post(`http://localhost:5001/party/${partyId}/cancel`, { username: currentUser.username });
      setHostedParties((prevParties) =>
        prevParties.map((party) => (party._id === partyId ? { ...party, status: 'cancelled' } : party))
      );
      alert('Party cancelled successfully.');
    } catch (error) {
      console.error('Error cancelling party:', error);
      alert('Failed to cancel the party.');
    }
  };

  const handleSelectFriend = (friend) => {
    setSelectedFriends((prev) =>
      prev.includes(friend) ? prev.filter((f) => f !== friend) : [...prev, friend]
    );
  };

  const handleInviteFriends = async (partyId) => {
    try {
      const response = await axios.post(`http://localhost:5001/party/${partyId}/invite`, {
        username: currentUser.username,
        friends: selectedFriends.map((friend) => friend.username),
      });
      alert('Friends invited successfully!');
      setSelectedFriends([]);
      // Refresh the party list to update the guest list with invited friends
      const updatedParty = await axios.get(`http://localhost:5001/party/${partyId}`);
      setHostedParties((prevParties) =>
        prevParties.map((party) => (party._id === updatedParty.data._id ? updatedParty.data : party))
      );
    } catch (error) {
      console.error('Error inviting friends:', error);
      alert('Failed to invite friends.');
    }
  };

  return (
    <div>
      <Navbar />
      <div className="party-manage-container">
        <h2>Manage Your Hosted Parties</h2>
        {hostedParties.length > 0 ? (
          hostedParties.map((party) => (
            <div key={party._id} className="party-item">
              <h3>{party.name}</h3>
              <p><strong>Status:</strong> {party.status}</p>
              <p><strong>Budget:</strong> ${party.budget}</p>

              {editingParty && editingParty._id === party._id ? (
                <>
                  <label>
                    Start Time:
                    <input
                      type="datetime-local"
                      value={new Date(editingParty.startTime).toISOString().slice(0, 16)}
                      onChange={(e) => handleTimeChange('startTime', new Date(e.target.value))}
                    />
                  </label>
                  <label>
                    End Time:
                    <input
                      type="datetime-local"
                      value={new Date(editingParty.endTime).toISOString().slice(0, 16)}
                      onChange={(e) => handleTimeChange('endTime', new Date(e.target.value))}
                    />
                  </label>

                  <h4>Requirements</h4>
                  {editingParty.requirements.map((req, index) => (
                    <div key={req._id || index} className="requirement-item">
                      <input
                        type="text"
                        value={req.item}
                        onChange={(e) => handleRequirementChange(index, 'item', e.target.value)}
                      />
                      <input
                        type="number"
                        value={req.quantity}
                        onChange={(e) => handleRequirementChange(index, 'quantity', parseInt(e.target.value))}
                      />
                    </div>
                  ))}

                  <button onClick={handleSaveChanges}>Save Changes</button>
                  <button onClick={() => setEditingParty(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <p><strong>Time:</strong> {new Date(party.startTime).toLocaleString()} - {new Date(party.endTime).toLocaleString()}</p>
                  <h4>Requirements</h4>
                  {party.requirements.map((req, index) => (
                    <div key={req._id || index} className="requirement-item">
                      <span>{req.item}</span> - <span>{req.quantity}</span>
                    </div>
                  ))}

                  {party.status === 'active' && (
                    <button onClick={() => handleEditParty(party)}>Edit Party</button>
                  )}
                </>
              )}

              <h4>Members</h4>
              {party.participants && party.participants.length > 0 ? (
                <ul className="member-list">
                  {party.participants.map((member) => (
                    <li key={member._id}>{member.username}</li>
                  ))}
                </ul>
              ) : (
                <p>No members joined yet.</p>
              )}

              {party.status === 'active' && (
                <>
                  <button className="cancel-party-button" onClick={() => handleCancelParty(party._id)}>Cancel Party</button>
                  
                  <h4>Invite Friends</h4>
                  <div className="party-friends-list">
                    {friends.map((friend) => {
                      const isInvited = party.participants.some((member) => member.username === friend.username);
                      return (
                        <div key={friend._id} className="party-friend-item">
                          <input
                            type="checkbox"
                            checked={selectedFriends.includes(friend)}
                            onChange={() => handleSelectFriend(friend)}
                            disabled={isInvited}
                          />
                          <label>{friend.username} {isInvited && "(Already Invited)"}</label>
                        </div>
                      );
                    })}
                  </div>
                  <button className="invite-button" onClick={() => handleInviteFriends(party._id)}>Invite Selected Friends</button>
                </>
              )}
            </div>
          ))
        ) : (
          <p>No hosted parties found.</p>
        )}
      </div>
    </div>
  );
};

export default PartyManage;
