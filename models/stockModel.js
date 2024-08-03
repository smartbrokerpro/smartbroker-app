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
  role: {
    type: String,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  typology: {
    type: String,
    trim: true
  },
  program: {
    type: String,
    trim: true
  },
  orientation: {
    type: String,
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
    min: [0, 'La superficie total no puede ser negativa']
  },
  current_list_price: {
    type: Number,
    min: [0, 'El precio de lista no puede ser negativo']
  },
  down_payment_bonus: {
    type: Number,
    min: [0, 'El bono del pie no puede ser negativo']
  },
  discount: {
    type: Number,
    min: [0, 'El descuento no puede ser negativo']
  },
  rent: {
    type: Number,
    min: [0, 'El valor de la renta no puede ser negativo']
  },
  status_id: {
    type: mongoose.Schema.Types.ObjectId
  },
  county_id: {
    type: mongoose.Schema.Types.ObjectId
  },
  county_name: {
    type: String,
    trim: true
  },
  real_estate_company_name: {
    type: String,
    trim: true
  },
  region_name: {
    type: String,
    trim: true
  },
  available: {
    type: Number,
    min: [0, 'La disponibilidad no puede ser negativa']
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Stock = mongoose.models.Stock || mongoose.model('Stock', stockSchema);

export default Stock;
