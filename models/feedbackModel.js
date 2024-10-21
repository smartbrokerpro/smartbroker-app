import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  userQuery: { type: String, required: true },
  mongoQuery: { type: mongoose.Schema.Types.Mixed, required: true },
  analysis: { type: String, required: true },
  queryDate: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  feedback: { type: Boolean, default: null },
  feedbackDate: { type: Date }
});

const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema);

export default Feedback;