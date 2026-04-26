import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string, {
      autoIndex: true,
    });

    console.log("MongoDB Connected");
  } catch (error) {
    console.error("Mongo Connection Error:", error);
    process.exit(1);
  }
};

export default connectDB;
