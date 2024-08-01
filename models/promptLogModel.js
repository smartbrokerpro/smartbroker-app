// models/promptLogModel.js
import mongoose from 'mongoose';

const PromptLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  prompt: { type: String, required: true },
  currentCredits: { type: Number, required: true },
  creditsUsed: { type: Number, required: true },
  tokensUsed: { type: Number, required: true },
  success: { type: Boolean, required: true },
  date: { type: Date, default: Date.now }
});

const PromptLog = mongoose.models.PromptLog || mongoose.model('PromptLog', PromptLogSchema);

export default PromptLog;
