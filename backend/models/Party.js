const mongoose = require('mongoose');

const requirementSchema = new mongoose.Schema({
  item: { type: String, required: true },
  quantity: { type: Number, required: true },
  fulfilledBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

const partySchema = new mongoose.Schema({
  name: { type: String, required: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  location: { 
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  requirements: [requirementSchema],
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  budget: { type: Number, required: true, min: 0 }
});

module.exports = mongoose.model('Party', partySchema);
