import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../../AuthContext';
import './Chat.css';
import Navbar from '../navbar/navbar';

const socket = io('http://localhost:5001'); 

const ChatPage = () => {
    const { currentUser } = useAuth();
    const [friends, setFriends] = useState([]);
    const [selectedFriend, setSelectedFriend] = useState(null); 
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        const fetchFriends = async () => {
            try {
                const friendsResponse = await axios.get(`http://localhost:5001/users/${currentUser.username}/friends`);
                setFriends(friendsResponse.data.friends);
            } catch (error) {
                console.error('Error fetching friends:', error);
            }
        };
        fetchFriends();
    }, [currentUser]);

    useEffect(() => {
        socket.on('receiveMessage', (newMessage) => {
            setMessages((prevMessages) => [...prevMessages, newMessage]);
        });

        return () => {
            socket.off('receiveMessage');
        };
    }, []);

    const fetchMessages = async (friend) => {
        setSelectedFriend(friend); 
        try {
            const response = await axios.get(`http://localhost:5001/messages/${currentUser.username}/${friend.username}`);
            setMessages(response.data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const sendMessage = () => {
        if (message.trim() && selectedFriend) {
            const messageData = {
                senderUsername: currentUser.username,
                recipientUsername: selectedFriend.username,
                message
            };

            socket.emit('sendMessage', messageData);
            setMessage('');
        }
    };

    return (
        <div>
            <Navbar />
            <div className="chat-page-container">
                <div className="chat-sidebar">
                    <h2>Chats</h2>
                    <ul>
                        {friends.map((friend) => (
                            <li
                                key={friend._id}
                                onClick={() => fetchMessages(friend)}
                                className={selectedFriend?._id === friend._id ? 'selected' : ''}
                            >
                                {friend.username}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="chat-main">
                    {selectedFriend ? (
                        <>
                            <div className="chat-header">
                                <h2>Chat with {selectedFriend.username}</h2>
                            </div>
                            <div className="chat-messages">
                                {messages.map((msg, index) => (
                                    <div key={index} className={`message ${msg.senderUsername === currentUser.username ? 'sent' : 'received'}`}>
                                        <span className="sender">{msg.senderUsername}:</span>
                                        <p>{msg.message}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="chat-input">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Type a message..."
                                />
                                <button onClick={sendMessage}>Send</button>
                            </div>
                        </>
                    ) : (
                        <p>Select a friend to start chatting</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatPage;
