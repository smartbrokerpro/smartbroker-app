// models/organizationModel.js

const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  domain: { type: String, required: true },
  logo: { type: String, required: true },
  credits: {
    current: { type: Number, default: 4000 },
    max: { type: Number, default: 4000 },
    assignedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    rechargedAt: { type: Date, default: null }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

organizationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.models.Organization || mongoose.model('Organization', organizationSchema);
