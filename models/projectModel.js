import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    county_id: { type: mongoose.Schema.Types.ObjectId, ref: 'County' },
    country_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Country' },
    real_estate_company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'RealEstateCompany' },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    min_price: { type: Number },
    max_price: { type: Number },
    typologies: { type: [String] },
    region_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Region' },
    gallery: { type: [String] },
    commercialConditions: { type: String },
    organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }
  },
  { timestamps: true } // Esta línea añadirá `createdAt` y `updatedAt`
);

export default mongoose.models.Project || mongoose.model('Project', ProjectSchema);
