const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const http = require('http'); 
const { Server } = require('socket.io'); 
const User = require('./models/User'); 
const Message = require('./models/Message'); 
const Party = require('./models/Party'); 
const Group = require('./models/Group'); 

require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect('mongodb://127.0.0.1:27017/chatapp', {})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log(err));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = new User({
            username,
            password: hashedPassword,
        });
        await user.save();
        res.status(201).json({ message: 'User created!', username: user.username });
    } catch (error) {
        res.status(500).json({ message: 'Error creating user' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    res.status(200).json({ message: 'Login successful', username: user.username });
});

app.get('/users', async (req, res) => {
    const { username } = req.query;
    try {
        const users = await User.find({ username: new RegExp(username, 'i') });
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: 'Error searching users' });
    }
});

app.get('/users/:username/friends', async (req, res) => {
    const { username } = req.params;

    try {
        const user = await User.findOne({ username }).populate('friends', 'username');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ friends: user.friends });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching friends' });
    }
});

app.post('/send-friend-request', async (req, res) => {
    const { fromUsername, toUsername } = req.body;

    try {
        const fromUser = await User.findOne({ username: fromUsername });
        const toUser = await User.findOne({ username: toUsername });

        if (!toUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (toUser.friendRequests.some(reqId => reqId.equals(fromUser._id))) {
            return res.status(400).json({ message: 'Friend request already sent' });
        }

        toUser.friendRequests.push(fromUser._id);
        await toUser.save();

        res.status(200).json({ message: 'Friend request sent!' });
    } catch (err) {
        res.status(500).json({ message: 'Error sending friend request' });
    }
});
app.post('/accept-friend-request', async (req, res) => {
    const { currentUsername, fromUsername } = req.body;

    try {
        const currentUser = await User.findOne({ username: currentUsername });
        const fromUser = await User.findOne({ username: fromUsername });

        if (!currentUser || !fromUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!currentUser.friendRequests.includes(fromUser._id)) {
            return res.status(400).json({ message: 'No such friend request' });
        }

        currentUser.friends.push(fromUser._id);
        fromUser.friends.push(currentUser._id);

        currentUser.friendRequests = currentUser.friendRequests.filter(
            (id) => id.toString() !== fromUser._id.toString()
        );

        await currentUser.save();
        await fromUser.save();

        res.status(200).json({ message: 'Friend request accepted!' });
    } catch (err) {
        res.status(500).json({ message: 'Error accepting friend request' });
    }
});

app.get('/friend-requests/:username', async (req, res) => {
    const { username } = req.params;

    try {
        const user = await User.findOne({ username }).populate('friendRequests', 'username');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user.friendRequests);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching friend requests' });
    }
});

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('sendMessage', async ({ senderUsername, recipientUsername, message, groupName }) => {
        try {
            const sender = await User.findOne({ username: senderUsername });

            if (groupName) {
                const group = await Group.findOne({ name: groupName });
                if (!group) return socket.emit('error', { message: 'Group not found' });

                const newMessage = new Message({
                    sender: sender._id,
                    groupId: group._id,
                    message,
                });
                await newMessage.save();

                const messageToEmit = {
                    senderUsername: sender.username,
                    message: newMessage.message,
                    date: newMessage.date,
                    groupName,
                };

                group.members.forEach((member) => {
                    socket.to(connectedUsers.get(member._id.toString())).emit('receiveGroupMessage', messageToEmit);
                });
            } else {
                const recipient = await User.findOne({ username: recipientUsername });
                if (!recipient) return socket.emit('error', { message: 'Recipient not found' });

                const newMessage = new Message({
                    sender: sender._id,
                    recipient: recipient._id,
                    message,
                });
                await newMessage.save();

                const messageToEmit = {
                    senderUsername: sender.username,
                    recipientUsername: recipient.username,
                    message: newMessage.message,
                    date: newMessage.date,
                };

                socket.emit('receiveMessage', messageToEmit);
                socket.to(connectedUsers.get(recipient._id.toString())).emit('receiveMessage', messageToEmit);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            socket.emit('error', { message: 'Error sending message' });
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});


app.get('/messages/:username1/:username2', async (req, res) => {
    const { username1, username2 } = req.params;

    try {
        const user1 = await User.findOne({ username: username1 });
        const user2 = await User.findOne({ username: username2 });

        if (!user1 || !user2) return res.status(404).json({ message: 'One of the users was not found' });

        const messages = await Message.find({
            $or: [
                { sender: user1._id, recipient: user2._id },
                { sender: user2._id, recipient: user1._id },
            ],
        }).sort({ date: 1 })
          .populate('sender', 'username')
          .populate('recipient', 'username');

        res.status(200).json(messages.map(msg => ({
            _id: msg._id,
            senderUsername: msg.sender.username,
            recipientUsername: msg.recipient.username,
            message: msg.message,
            date: msg.date,
        })));
    } catch (err) {
        console.error('Error fetching private messages:', err);
        res.status(500).json({ message: 'Error fetching private messages' });
    }
});


app.post('/createParty', async (req, res) => {
    const { name, username, requirements, location, startTime, endTime, budget } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const newParty = new Party({
            name,
            host: user._id,
            participants: [user._id],
            requirements,
            location,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            budget,
            status: 'active',
        });
        await newParty.save();

        const newGroup = new Group({
            name: name, 
            members: [user._id],
        });
        await newGroup.save();

        res.status(201).json({ message: 'Party and group created successfully!', party: newParty });
    } catch (error) {
        console.error('Error creating party or group:', error);
        res.status(500).json({ error: 'Failed to create party or group' });
    }
});

app.get('/user-parties/:username', async (req, res) => {
    const { username } = req.params;

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const parties = await Party.find({ participants: user._id }).populate('host', 'username');
        res.status(200).json(parties); 
    } catch (error) {
        console.error('Error fetching user parties:', error);
        res.status(500).json({ error: 'Failed to fetch user parties' });
    }
});
  
  app.get('/active-parties', async (req, res) => {
    try {
      const parties = await Party.find({ status: 'active' }).populate('host', 'username');
      res.status(200).json(parties);
    } catch (error) {
      console.error('Error fetching parties:', error);
      res.status(500).json({ message: 'Failed to fetch parties' });
    }
  });
  
  app.get('/party/:partyId', async (req, res) => {
    const { partyId } = req.params;
  
    try {
      const party = await Party.findById(partyId)
        .populate('host', 'username')
        .populate('participants', 'username');
      if (!party) return res.status(404).json({ message: 'Party not found' });
      res.status(200).json(party);
    } catch (error) {
      console.error('Error fetching party:', error);
      res.status(500).json({ message: 'Failed to fetch party' });
    }
  });
  
  app.post('/party/:partyId/join', async (req, res) => {
    const { username } = req.body;
    const { partyId } = req.params;

    try {
        const user = await User.findOne({ username });
        const party = await Party.findById(partyId);

        if (!user || !party) return res.status(404).json({ message: 'User or party not found' });

        if (!party.participants.includes(user._id)) {
            party.participants.push(user._id);
            await party.save();
        }

        res.status(200).json({ message: 'Joined the party successfully', party });
    } catch (error) {
        console.error('Error joining party:', error);
        res.status(500).json({ error: 'Failed to join the party' });
    }
});


  app.post('/party/:partyId/requirement', async (req, res) => {
    const { partyId } = req.params;
    const { item, quantity } = req.body;
  
    try {
      const party = await Party.findById(partyId);
      if (!party) return res.status(404).json({ message: 'Party not found' });
  
      party.requirements.push({ item, quantity });
      await party.save();
  
      res.status(200).json({ message: 'Requirement added successfully', party });
    } catch (error) {
      console.error('Error adding requirement:', error);
      res.status(500).json({ message: 'Failed to add requirement' });
    }
  });
app.post('/party/:partyId/leave', async (req, res) => {
    const { partyId } = req.params;
    const { username } = req.body;
  
    try {
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const party = await Party.findById(partyId);
      if (!party) {
        return res.status(404).json({ message: 'Party not found' });
      }
  
      const participantIndex = party.participants.indexOf(user._id);
      if (participantIndex === -1) {
        return res.status(400).json({ message: 'User is not a participant in this party' });
      }
      party.participants.splice(participantIndex, 1); 
  
      party.requirements.forEach((requirement) => {
        const userFulfillIndex = requirement.fulfilledBy.indexOf(user._id);
        if (userFulfillIndex !== -1) {
          requirement.fulfilledBy.splice(userFulfillIndex, 1); 
        }
      });
  
      await party.save();
  
      res.status(200).json({ message: 'User left the party and any fulfilled requirements were reset', party });
    } catch (error) {
      console.error('Error leaving party:', error);
      res.status(500).json({ message: 'Failed to leave the party' });
    }
  });
  
  
  // Fulfill a requirement in a party and deduct the price from the budget
app.post('/party/:partyId/requirement/:requirementId/fulfill', async (req, res) => {
    const { partyId, requirementId } = req.params;
    const { userId, price } = req.body;

    try {
        let userObjectId = userId;
        if (typeof userId === 'string' && userId.length !== 24) {
            const user = await User.findOne({ username: userId });
            if (!user) return res.status(404).json({ message: 'User not found' });
            userObjectId = user._id;
        }

        const party = await Party.findById(partyId);
        if (!party) return res.status(404).json({ message: 'Party not found' });

        const requirement = party.requirements.id(requirementId);
        if (!requirement) return res.status(404).json({ message: 'Requirement not found' });

        if (requirement.fulfilledBy.includes(userObjectId)) {
            return res.status(400).json({ message: 'User has already fulfilled this requirement' });
        }

        requirement.fulfilledBy.push(userObjectId);

        // Deduct the price from the budget and save changes
        party.budget -= price;
        await party.save();

        res.status(200).json({ message: 'Requirement fulfilled and budget updated', party });
    } catch (error) {
        console.error('Error fulfilling requirement:', error);
        res.status(500).json({ error: 'Failed to fulfill requirement' });
    }
});






app.post('/party/:partyId/cancel', async (req, res) => {
    const { partyId } = req.params;
    const { username } = req.body;

    try {
        const party = await Party.findById(partyId);
        if (!party) {
            return res.status(404).json({ message: 'Party not found' });
        }

        const hostUser = await User.findOne({ username });
        if (!hostUser || party.host.toString() !== hostUser._id.toString()) {
            return res.status(403).json({ message: 'Only the host can cancel the party' });
        }

        party.status = 'cancelled';
        await party.save();

        res.status(200).json({ message: 'Party cancelled successfully', party });
    } catch (error) {
        console.error('Error cancelling party:', error);
        res.status(500).json({ message: 'Failed to cancel party' });
    }
});
app.get('/hosted-parties/:username', async (req, res) => {
    try {
      const user = await User.findOne({ username: req.params.username });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const hostedParties = await Party.find({ host: user._id })
        .populate('participants', 'username') 
        .populate('host', 'username'); 
  
      res.status(200).json(hostedParties);
    } catch (error) {
      console.error('Error fetching hosted parties:', error);
      res.status(500).json({ message: 'Failed to fetch hosted parties' });
    }
  });
  app.put('/party/:partyId', async (req, res) => {
    const { partyId } = req.params;
    const { username, requirements, startTime, endTime } = req.body;

    try {
        const party = await Party.findById(partyId).populate('host', 'username');

        if (!party) {
            return res.status(404).json({ message: 'Party not found' });
        }

        if (party.host.username !== username) {
            return res.status(403).json({ message: 'You are not authorized to edit this party' });
        }

        if (requirements) party.requirements = requirements;
        if (startTime) party.startTime = new Date(startTime);
        if (endTime) party.endTime = new Date(endTime);

        await party.save();

        res.status(200).json(party);
    } catch (error) {
        console.error('Error editing party:', error);
        res.status(500).json({ message: 'Failed to edit the party' });
    }
});

app.post('/party/:partyId/invite', async (req, res) => {
    const { partyId } = req.params;
    const { username, friends } = req.body;

    try {
        const party = await Party.findById(partyId).populate('host', 'username');
        if (!party) return res.status(404).json({ message: 'Party not found' });

        if (party.host.username !== username) {
            return res.status(403).json({ message: 'You are not authorized to invite friends to this party' });
        }

        const friendUsers = await User.find({ username: { $in: friends } });
        const newParticipants = friendUsers
            .map(friend => friend._id)
            .filter(friendId => !party.participants.includes(friendId));

        party.participants.push(...newParticipants);
        await party.save();

        res.status(200).json({ message: 'Friends invited successfully', party });
    } catch (error) {
        console.error('Error inviting friends:', error);
        res.status(500).json({ message: 'Failed to invite friends' });
    }
});


server.listen(5001, () => {
    console.log('Server is running on port 5001');
});
