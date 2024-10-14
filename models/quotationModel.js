import mongoose from 'mongoose';

const quotationSchema = new mongoose.Schema({
  organization_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is required']
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required']
  },
  stock_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stock',
    required: [true, 'Stock ID is required']
  },
  client_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Client ID is required']
  },
  quotation_date: {
    type: Date,
    default: Date.now,
    required: [true, 'Quotation date is required']
  },
  uf_value_at_quotation: {
    type: Number,
    required: [true, 'UF value at quotation is required'],
    min: [0, 'UF value cannot be negative']
  },
  unit_value: {
    type: Number,
    required: [true, 'Unit value is required'],
    min: [0, 'Unit value cannot be negative']
  },
  discount_percentage: {
    type: Number,
    default: 0,
    min: [0, 'Discount percentage cannot be negative']
  },
  bonus_percentage: {
    type: Number,
    default: 0,
    min: [0, 'Bonus percentage cannot be negative']
  },
  down_payment_percentage: {
    type: Number,
    default: 0,
    min: [0, 'Down payment percentage cannot be negative']
  },
  down_payment_contribution: {
    type: Number,
    default: 0,
    min: [0, 'Down payment contribution cannot be negative']
  },
  down_payment_installments: {
    type: Number,
    default: 1,
    min: [1, 'Number of down payment installments must be at least 1']
  },
  large_installment: {
    type: Number,
    default: 0,
    min: [0, 'Large installment cannot be negative']
  },
  credit_term_years: {
    type: Number,
    default: 30,
    min: [1, 'Credit term must be at least 1 year']
  },
  annual_rate: {
    type: Number,
    default: 4.5,
    min: [0, 'Annual rate cannot be negative']
  },
  storage: {
    type: Boolean,
    default: false
  },
  parking: {
    type: Boolean,
    default: false
  },
  financing_amount: {
    type: Number,
    required: [true, 'Financing amount is required'],
    min: [0, 'Financing amount cannot be negative']
  },
  estimated_dividend: {
    type: Number,
    required: [true, 'Estimated dividend is required'],
    min: [0, 'Estimated dividend cannot be negative']
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

// Middleware to update the updated_at field before each update
quotationSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

const Quotation = mongoose.models.Quotation || mongoose.model('Quotation', quotationSchema);

export default Quotation;
