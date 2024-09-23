// models/projectModel.js
import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    county_id: { type: mongoose.Schema.Types.ObjectId, ref: 'County' },
    county_name: { type: String  },
    country_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Country' },
    real_estate_company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'RealEstateCompany', required: true }, // Ahora requerido
    real_estate_company_name: { type: String }, // Agregado
    region_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Region' },
    region_name: { type: String }, // Agregado
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    gallery: { type: [String] },
    commercialConditions: { type: String },
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    delivery_date: { type: Date },
    deliveryDateDescr: { type: String }, 
    deliveryType: { type: String },
    downPaymentMethod: { type: String },
    downpayment: { type: Number, min: [0, 'El pago inicial no puede ser negativo'] }, // Agregado
    down_payment_bonus: { type: Number, min: [0, 'El bono del pie no puede ser negativo'] }, // Agregado
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
