import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import usersRouter from "./routes/user";
import gymsRouter from "./routes/gyms";
import exerciseTypesRouter from "./routes/exerciseTypes";
import badgesRouter from "./routes/badges";
import challengesRouter from "./routes/challenges";
import adminRouter from "./routes/admin";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Routes
app.use("/api/user", usersRouter);
app.use("/api/gyms", gymsRouter);
app.use("/api/exercise-types", exerciseTypesRouter);
app.use("/api/badges", badgesRouter);
app.use("/api/challenges", challengesRouter);
app.use("/api/admin", adminRouter);

// MongoDB connection
if (typeof process.env.MONGODB_URI === "undefined") {
	throw new Error("MONGODB_URI is not defined");
}

mongoose
	.connect(process.env.MONGODB_URI)
	.then(() => console.log("MongoDB Connecté"))
	.catch((err: Error) => console.error("MongoDB Erreur:", err));

// route test
app.get("/", (req, res) => {
	res.send("Hello World !");
});

// lancement du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server en cours d\'exécution sur le port ${PORT}`);
});
