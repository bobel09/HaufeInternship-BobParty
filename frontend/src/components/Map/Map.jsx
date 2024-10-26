import React, { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

const MapComponent = ({ parties = [] }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedParty, setSelectedParty] = useState(null);
  const apiKey = process.env.REACT_APP_API_KEY;


  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey,
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error fetching location: ", error);
          setCurrentLocation({ lat: 45.764472, lng: 21.234972 }); // Default coordinates
        }
      );
    }
  }, []);

  if (!isLoaded) return <div>Loading map...</div>;
  if (!currentLocation) return <div>Loading location...</div>;

  return (
    <GoogleMap
      mapContainerStyle={{ height: "500px", width: "100%" }}
      center={currentLocation}
      zoom={12} // Adjust zoom level to show more area around user
    >
      {/* Marker for each party */}
      {parties.length > 0 && parties.map((party) => (
        party.location && (
          <Marker
            key={party._id}
            position={{ lat: party.location.lat, lng: party.location.lng }}
            label="🎉"
            onClick={() => setSelectedParty(party)}
          />
        )
      ))}

      {/* Marker for the user’s current location */}
      <Marker position={currentLocation} label="📍" />

      {/* InfoWindow for selected party */}
      {selectedParty && (
        <InfoWindow
          position={{ lat: selectedParty.location.lat, lng: selectedParty.location.lng }}
          onCloseClick={() => setSelectedParty(null)}
        >
          <div>
            <h3>{selectedParty.name}</h3>
            <p><strong>Host:</strong> {selectedParty.host?.username || "Unknown"}</p>
            <p><strong>Status:</strong> {selectedParty.status}</p>
            <p><strong>Budget:</strong> ${selectedParty.budget || "Not specified"}</p>
            <p><strong>Time:</strong> 
              {selectedParty.startTime ? new Date(selectedParty.startTime).toLocaleString() : "N/A"} - 
              {selectedParty.endTime ? new Date(selectedParty.endTime).toLocaleString() : "N/A"}
            </p>
            <h4>Requirements:</h4>
            <ul>
              {selectedParty.requirements?.map((req, index) => (
                <li key={index}>
                  {req.item} - {req.quantity} (Fulfilled by {req.fulfilledBy.length})
                </li>
              )) || <li>No requirements listed</li>}
            </ul>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
};

export default MapComponent;
