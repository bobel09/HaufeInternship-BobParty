const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: Schema.Types.ObjectId, ref: 'User' },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group' },
    message: { type: String, required: true },
    date: { type: Date, default: Date.now },
});


module.exports = mongoose.model('Message', MessageSchema);
