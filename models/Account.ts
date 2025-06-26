// models/Account.ts
import mongoose from "mongoose";

const AccountSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  email: { type: String, required: true },
  name: { type: String, required: true },
  image: { type: String },
  provider: { type: String, required: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String },
  accessTokenExpires: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  timestamps: true
});

// Compound index for faster queries
AccountSchema.index({ userId: 1, email: 1 }, { unique: true });

export const AccountModel = mongoose.models.Account || mongoose.model("Account", AccountSchema);