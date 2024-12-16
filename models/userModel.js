// models/userModel.js
import mongoose from 'mongoose';

// Definir el esquema para permisos personalizados
const PermissionSchema = new mongoose.Schema({
  view: { type: Number, min: 0, max: 1 },
  create: { type: Number, min: 0, max: 1 },
  edit: { type: Number, min: 0, max: 1 },
  delete: { type: Number, min: 0, max: 1 },
  export: { type: Number, min: 0, max: 1 },
  status: { type: Number, min: 0, max: 1 }
}, { _id: false });

// Definir el esquema de permisos personalizados por módulo
const CustomPermissionsSchema = new mongoose.Schema({
  users: PermissionSchema,
  projects: PermissionSchema,
  quotations: PermissionSchema,
  reports: PermissionSchema,
  inventory: PermissionSchema
}, { _id: false });

const UserSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, 'El nombre es requerido']
    },
    email: { 
      type: String, 
      required: [true, 'El email es requerido'],
      unique: true,
      lowercase: true,
      trim: true
    },
    googleId: { 
      type: String,
      sparse: true
    },
    password: { 
      type: String,
      select: false
    },
    role: { 
      type: String, 
      enum: ['admin', 'sales_manager', 'operations', 'sales_agent'],
      required: [true, 'El rol es requerido'],
      default: 'sales_agent'
    },
    organizationId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Organization',
      required: [true, 'La organización es requerida']
    },
    customPermissions: {
      type: CustomPermissionsSchema,
      default: null
    },
    active: {
      type: Boolean,
      default: true,
      required: true
    },
    lastLogin: {
      type: Date
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Índices
UserSchema.index({ email: 1, organizationId: 1 }, { unique: true });
UserSchema.index({ googleId: 1 }, { sparse: true });

// Virtual para obtener la organización
UserSchema.virtual('organization', {
  ref: 'Organization',
  localField: 'organizationId',
  foreignField: '_id',
  justOne: true
});

// Middleware para asegurar email en minúsculas
UserSchema.pre('save', function(next) {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase();
  }
  next();
});

export default mongoose.models.User || mongoose.model('User', UserSchema);