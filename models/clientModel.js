import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  first_name: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true
  },
  last_name: {
    type: String,
    required: [true, 'El apellido es obligatorio'],
    trim: true
  },
  origin: {
    type: String,
    enum: ['facebook', 'instagram', 'referido', 'web', 'otro'],
    default: 'otro'
  },
  status: {
    type: String,
    enum: ['activo', 'inactivo', 'potencial', 'unreachable'],
    default: 'potencial'
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Por favor, ingresa un email válido']
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  rut: {
    type: String,
    unique: true,
    trim: true
  },
  contact_date: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String
  },
  broker_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Broker',
    required: true
  },
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization', 
    required: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Client = mongoose.models.Client || mongoose.model('Client', clientSchema);

export default Client;
