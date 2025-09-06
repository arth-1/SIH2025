import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const instituteSchema = new mongoose.Schema(
  {
    instituteName: { type: String, required: [true, "Institute name is required"] },
    email: { type: String, required: [true, "Email is required"], unique: true, lowercase: true },
    password: { type: String, required: [true, "Password is required"] },
  },
  { timestamps: true }
);

instituteSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

instituteSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const InstituteModel = mongoose.model("Institute", instituteSchema);

export default InstituteModel;
