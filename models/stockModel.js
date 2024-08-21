// models/stockModel.js
import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema({
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'El ID de la organización es obligatorio']
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'El ID del proyecto es obligatorio']
  },
  apartment: {
    type: String,
    required: [true, 'El número de apartamento es obligatorio'],
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  typology: {
    type: String,
    required: [true, 'La tipología es obligatoria'],
    trim: true
  },
  orientation: {
    type: String,
    required: [true, 'La orientación es obligatoria'],
    trim: true
  },
  interior_surface: {
    type: Number,
    min: [0, 'La superficie interior no puede ser negativa']
  },
  terrace_surface: {
    type: Number,
    min: [0, 'La superficie de la terraza no puede ser negativa']
  },
  total_surface: {
    type: Number,
    required: [true, 'La superficie total es obligatoria'],
    min: [0, 'La superficie total no puede ser negativa']
  },
  current_list_price: {
    type: Number,
    required: [true, 'El precio de lista es obligatorio'],
    min: [0, 'El precio de lista no puede ser negativo']
  },
  down_payment_bonus: {
    type: Number,
    required: [true, 'El bono del pie es obligatorio'],
    min: [0, 'El bono del pie no puede ser negativo']
  },
  discount: {
    type: Number,
    required: [true, 'El descuento es obligatorio'],
    min: [0, 'El descuento no puede ser negativo']
  },
  rent: {
    type: Number,
    min: [0, 'El valor de la renta no puede ser negativo']
  },
  available: {
    type: Number,
    required: [true, 'La disponibilidad es obligatoria'],
    min: [0, 'La disponibilidad no puede ser negativa']
  },
  county_id: {
    type: mongoose.Schema.Types.ObjectId
  },
  county_name: {
    type: String,
    required: [true, 'El nombre de la comuna es obligatorio'],
    trim: true
  },
  real_estate_company_id: {
    type: mongoose.Schema.Types.ObjectId
  },
  real_estate_company_name: {
    type: String,
    required: [true, 'El nombre de la inmobiliaria es obligatorio'],
    trim: true
  },
  region_name: {
    type: String,
    trim: true
  },
  project_name: {
    type: String,
    trim: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Middleware para actualizar el campo updated_at antes de cada actualización
stockSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

const Stock = mongoose.models.Stock || mongoose.model('Stock', stockSchema);

export default Stock;