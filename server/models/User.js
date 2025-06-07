// models/User.js

const userSchema = new mongoose.Schema({
  clerkId: String,
  email: String,
  resumes: [
    {
      fileUrl: String,
      uploadedAt: { type: Date, default: Date.now },
      extractedText: String, // ⬅️ Add this
    },
  ],
});

export default mongoose.model("User", userSchema);
