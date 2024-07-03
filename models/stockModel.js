import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema({
  project_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  apartment: { type: String, required: true },
  role: String,
  model: String,
  typology: String,
  program: String,
  orientation: String,
  interior_surface: Number,
  terrace_surface: Number,
  total_surface: Number,
  current_list_price: Number,
  down_payment_bonus: Number,
  discount: Number,
  rent: Number,
  status_id: mongoose.Schema.Types.ObjectId,
  created_at: { type: Date, default: Date.now },
  county_id: mongoose.Schema.Types.ObjectId,
  county_name: String,
  real_estate_company_name: String,
  region_name: String,
  available: Number
});

const Stock = mongoose.models.Stock || mongoose.model('Stock', stockSchema);

export default Stock;
