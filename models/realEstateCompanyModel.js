// models/realEstateCompanyModel.js
import mongoose from 'mongoose';

const RealEstateCompanySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, default: null },
    contact_person: { type: String, default: null },
    email: { type: String, default: null },
    phone: { type: String, default: null },
    website: { type: String, default: null },
    description: { type: String, default: null },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
  },
  { 
    collection: 'real_estate_companies' // Nombre explícito de la colección
  }
);

// Middleware para actualizar el campo updated_at antes de cada actualización
RealEstateCompanySchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

const RealEstateCompany = mongoose.models.RealEstateCompany || mongoose.model('RealEstateCompany', RealEstateCompanySchema);

export default RealEstateCompany;