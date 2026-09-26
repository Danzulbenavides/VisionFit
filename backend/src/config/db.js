import dns from "node:dns";
import mongoose from "mongoose";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDB = async() => {
    try {
        const connection = await mongoose.connect(process.env.MONGODB_URI, {
            family: 4,
        });

        console.log("MongoDB connected:", connection.connection.host);
        console.log("MongoDB host:", connection.connection.host);
        console.log("MongoDB database:", connection.connection.name);
        console.log("Database:", connection.connection.name);
    } catch (error) {
        console.error("MongoDB connection failed:");
        console.error(error.message);

        process.exit(1);
    }
};

export default connectDB;