import { InferSchemaType, model, Schema, Document } from "mongoose";
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 6;

const userSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: false,
    },
  },{
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        delete ret.password;
        return ret;
      }}},
);


userSchema.pre('save', async function(next) {
  // 'this' is the user document
  if (!this.isModified('password')) return next();
  // Replace the password with the computed hash
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

type User = InferSchemaType<typeof userSchema>;

export default model<User>("User", userSchema);