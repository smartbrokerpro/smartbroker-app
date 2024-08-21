// models/projectModel.js

import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    county_id: { type: mongoose.Schema.Types.ObjectId, ref: 'County' },
    county_name: { type: String  },
    country_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Country' },
    real_estate_company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'RealEstateCompany' },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    gallery: { type: [String] },
    commercialConditions: { type: String },
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    delivery_date: { type: Date },
    deliveryDateDescr: { type: String }, // Reincorporado al modelo
    region_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Region' },
    deliveryType: { type: String },
    downPaymentMethod: { type: String },
    installments: { type: Number },
    promiseSignatureType: { type: String },
    reservationInfo: {
      text: { type: String },
      hyperlink: { type: String }
    },
    reservationValue: { type: Number, min: [0, 'El valor de la reserva no puede ser negativo'] }
  },
  { timestamps: true }
);

export default mongoose.models.Project || mongoose.model('Project', ProjectSchema);