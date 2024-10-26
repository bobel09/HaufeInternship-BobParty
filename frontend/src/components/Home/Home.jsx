import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import './Home.css'; 
import Navbar from '../navbar/navbar';
import axios from 'axios';
import MapComponent from '../Map/Map';

const Home = () => {
  const { currentUser } = useAuth();
  const [parties, setParties] = useState([]);
  const [myParties, setMyParties] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [partyName, setPartyName] = useState('');
  const [requirements, setRequirements] = useState([{ item: '', quantity: 1 }]);
  const [address, setAddress] = useState(''); // New state for address input
  const [location, setLocation] = useState({ lat: 45.7465, lng: 21.2396 }); // Default location
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [budget, setBudget] = useState('');
  const [fulfillPrice, setFulfillPrice] = useState('');
  const apiKey = process.env.REACT_APP_API_KEY;


  useEffect(() => {
    const fetchParties = async () => {
      try {
        const [partiesResponse, myPartiesResponse] = await Promise.all([
          axios.get('http://localhost:5001/active-parties'),
          axios.get(`http://localhost:5001/user-parties/${currentUser.username}`)
        ]);
        setParties(partiesResponse.data.filter((party) => party.status !== 'cancelled'));
        setMyParties(myPartiesResponse.data.filter((party) => party.status !== 'cancelled'));
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchParties();
  }, [currentUser]);

  // Function to add a new requirement field
  const handleAddRequirement = () => {
    setRequirements([...requirements, { item: '', quantity: 1 }]);
  };

  // Geocode address to get coordinates
  const geocodeAddress = async () => {
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          address: address,
          key: "AIzaSyAtWKoDGazzRmKRObAdSvugmlRrKrq_7kQ",
        },
      });
      console.log('Geocoding response:', response.data);
      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const { lat, lng } = response.data.results[0].geometry.location;
        return { lat, lng };
      } else {
        alert('Address not found. Please try again.');
        return null;
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
      alert('Failed to fetch coordinates. Please try again.');
      return null;
    }
  };

  const handleCreateParty = async () => {
    const locationResult = await geocodeAddress();
    if (!locationResult) {
      alert("Failed to set location. Please check the address.");
      return;
    }
    
    const partyData = {
      name: partyName,
      username: currentUser.username,
      requirements,
      location: locationResult,
      startTime,
      endTime,
      budget: parseFloat(budget),
    };

    try {
      const response = await axios.post('http://localhost:5001/createParty', partyData);
      alert(`Party "${response.data.party.name}" created successfully!`);
      setShowCreateForm(false);
      setParties([...parties, response.data.party]);
    } catch (error) {
      console.error('Error creating party:', error);
      alert(error.response?.data?.message || 'Failed to create party. Please try again.');
    }
  };


  const handleJoinParty = async (partyId) => {
    try {
      const response = await axios.post(`http://localhost:5001/party/${partyId}/join`, { username: currentUser.username });
      setMyParties([...myParties, response.data.party]);
      alert('Joined the party successfully!');
    } catch (error) {
      console.error('Error joining party:', error);
      alert('Failed to join the party.');
    }
  };

  const handleCancelParty = async (partyId) => {
    try {
      await axios.post(`http://localhost:5001/party/${partyId}/cancel`, { username: currentUser.username });
      setParties(parties.filter(party => party._id !== partyId));
      alert('Party cancelled successfully.');
    } catch (error) {
      console.error('Error cancelling party:', error);
      alert('Failed to cancel the party.');
    }
  };
  const handleLeaveParty = async (partyId) => {
    try {
      await axios.post(`http://localhost:5001/party/${partyId}/leave`, { username: currentUser.username });
      setMyParties(myParties.filter((party) => party._id !== partyId));
      alert('You have left the party.');
    } catch (error) {
      console.error('Error leaving the party:', error);
      alert('Failed to leave the party.');
    }
  };
  const handleFulfillRequirement = async (partyId, requirementId) => {
    try {
        const price = parseFloat(fulfillPrice);
        if (isNaN(price) || price <= 0) {
          alert('Please enter a valid price.');
          return;
        }

        await axios.post(`http://localhost:5001/party/${partyId}/requirement/${requirementId}/fulfill`, {
            userId: currentUser._id || currentUser.username,
            price,
        });
        alert('Requirement fulfilled successfully.');

        setMyParties((prevParties) =>
            prevParties.map((party) => {
                if (party._id === partyId) {
                    return {
                        ...party,
                        budget: party.budget - price,
                        requirements: party.requirements.map((req) =>
                            req._id === requirementId
                                ? { ...req, fulfilledBy: [...req.fulfilledBy, currentUser._id || currentUser.username] }
                                : req
                        ),
                    };
                }
                return party;
            })
        );
        setFulfillPrice('');
    } catch (error) {
        console.error('Error fulfilling requirement:', error);
        alert('Failed to fulfill the requirement.');
    }
  };
    

  return (
    <div>
      <Navbar />
      <div className="background">
      <div className="home-page-container">
        <div className="greeting-section">
          <h1 className="home-greeting">Hello, {currentUser ? currentUser.username : 'User'}!</h1>
          <p className="home-welcome-text">Welcome back to BobStudParty! 🎉</p>
        </div>

        <div className="home-fun-section">
          <h2 className="home-fun-title">Find an Available Party! 🎉</h2>
          <button onClick={() => setShowCreateForm(true)}>Create Party</button>
        </div>

        {showCreateForm && (
          <div className="party-form">
            <h2>Create a New Party</h2>
            <input
              type="text"
              placeholder="Party Name"
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
            />
            <div className="address-input">
              <label>
                Address:
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter party address"
                />
              </label>
            </div>

            <div className="time-and-budget">
              <label>
                Start Time:
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </label>
              <label>
                End Time:
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </label>
              <label>
                Budget:
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </label>
            </div>

            <div className="requirements-section">
              <h3>Requirements</h3>
              {requirements.map((req, index) => (
                <div key={index} className="requirement-item">
                  <input
                    type="text"
                    placeholder="Item"
                    value={req.item}
                    onChange={(e) => {
                      const newRequirements = [...requirements];
                      newRequirements[index].item = e.target.value;
                      setRequirements(newRequirements);
                    }}
                  />
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={req.quantity}
                    onChange={(e) => {
                      const newRequirements = [...requirements];
                      newRequirements[index].quantity = parseInt(e.target.value);
                      setRequirements(newRequirements);
                    }}
                  />
                </div>
              ))}
              <button onClick={handleAddRequirement}>Add Requirement</button>
            </div>

            <button onClick={handleCreateParty}>Submit</button>
            <button onClick={() => setShowCreateForm(false)}>Cancel</button>
          </div>
        )}

        <div className="map-container">
          <MapComponent parties={parties} />
        </div>

        <div className="party-section">
  <h2>Your Joined Parties</h2>
  {myParties.length > 0 ? (
    myParties.map((party) => (
      <div key={party._id} className="party-item">
        <p><strong>Party Name:</strong> {party.name}</p>
        <p><strong>Host:</strong> {party.host.username}</p>
        <p><strong>Status:</strong> {party.status}</p>
        <p><strong>Budget:</strong> ${party.budget}</p>
        <p><strong>Time:</strong> {new Date(party.startTime).toLocaleString()} - {new Date(party.endTime).toLocaleString()}</p>
        <h4>Requirements:</h4>
        <ul>
          {party.requirements.map((req) => (
            <li key={req._id}>
              {req.item} - {req.quantity} (Fulfilled by {req.fulfilledBy.length} people)
              {req.fulfilledBy.length === 0 && (
                <>
                  <input
                    type="number"
                    placeholder="Price"
                    value={fulfillPrice}
                    onChange={(e) => setFulfillPrice(e.target.value)}
                  />
                  <button onClick={() => handleFulfillRequirement(party._id, req._id)}>
                    Fulfill Requirement
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
        <button onClick={() => handleLeaveParty(party._id)}>Leave Party</button>
      </div>
    ))
  ) : (
    <p>No joined parties.</p>
  )}
</div>

        <div className="available-parties-section">
          <h2>Available Parties</h2>
          {parties.length > 0 ? (
            parties.map((party) => (
              <div key={party._id} className="party-item">
                <p><strong>Party Name:</strong> {party.name}</p>
                <p><strong>Host:</strong> {party.host.username}</p>
                <p><strong>Status:</strong> {party.status}</p>
                <p><strong>Budget:</strong> ${party.budget}</p>
                <p><strong>Time:</strong> {new Date(party.startTime).toLocaleString()} - {new Date(party.endTime).toLocaleString()}</p>
                <button onClick={() => handleJoinParty(party._id)}>Join Party</button>
                {party.host.username === currentUser.username && (
                  <button onClick={() => handleCancelParty(party._id)}>Cancel Party</button>
                )}
              </div>
            ))
          ) : (
            <p>No available parties.</p>
          )}
        </div>

        <div className="home-footer">
          <p className="home-footer-text">Stay connected, stay engaged, and enjoy the party! 🎉</p>
        </div>
      </div>
    </div>

    </div>
  );
};

export default Home;