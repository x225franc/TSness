import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserModel } from "../services/mongoose/services";

const router = express.Router();

// Inscription d'un nouvel utilisateur
router.post("/register", async (req, res) => {
	try {
		const { firstname, lastname, email, password, role } = req.body;

		if (!firstname || !lastname || !email || !password) {
			return res
				.status(400)
				.json({ erreur: "Tous les champs sont obligatoires." });
		}

		const existing = await UserModel.findOne({ email });
		if (existing) {
			return res.status(400).json({ erreur: "Cet email est déjà utilisé." });
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		const user = new UserModel({
			firstname,
			lastname,
			email,
			password: hashedPassword,
			role: role || "client",
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date(),
			challenges_created: [],
			challenges_joined: [],
			friends: [],
			badges: [],
			score: 0,
		});

		await user.save();
		res.status(201).json({ message: "Inscription réussie." });
	} catch (err) {
		res.status(500).json({ erreur: (err as Error).message });
	}
});

// Connexion utilisateur
router.post("/login", async (req, res) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			return res.status(400).json({ erreur: "Email et mot de passe requis." });
		}

		const user = await UserModel.findOne({ email });

		if (!user) {
			return res.status(400).json({ erreur: "Utilisateur introuvable." });
		}

		// Vérifier si le compte est actif
		if (!user.isActive) {
			return res
				.status(403)
				.json({
					erreur:
						"Votre compte a été désactivé. Veuillez contacter l'administrateur.",
				});
		}

		const valid = await bcrypt.compare(password, user.password);
		if (!valid) {
			return res.status(400).json({ erreur: "Mot de passe incorrect." });
		}

		// token JWT
		const token = jwt.sign(
			{ id: user._id, role: user.role },
			process.env.JWT_SECRET as string,
			{ expiresIn: "2h" }
		);

		res.json({
			token,
			user: {
				id: user._id,
				firstname: user.firstname,
				lastname: user.lastname,
				email: user.email,
				role: user.role,
			},
		});
	} catch (err) {
		res.status(500).json({ erreur: (err as Error).message });
	}
});

// Récupérer tous les propriétaires
router.get("/owners", async (_req, res) => {
	try {
		const owners = await UserModel.find(
			{ role: "owner" },
			"_id firstname lastname email"
		);
		res.json(owners);
	} catch (err) {
		res.status(500).json({ erreur: (err as Error).message });
	}
});

// Récupérer tous les utilisateurs (clients)
router.get("/clients", async (_req, res) => {
	try {
		const users = await UserModel.find(
			{ role: "client" },
			"_id firstname lastname email role"
		);
		res.json(users);
	} catch (err) {
		res.status(500).json({ erreur: (err as Error).message });
	}
});

// Classement général des membres par score
router.get("/leaderboard", async (_req, res) => {
	try {
		const users = await UserModel.find(
			{ role: "client" },
			"firstname lastname score"
		)
			.sort({ score: -1 })
			.limit(50); // top 50
		res.json(users);
	} catch (err) {
		res.status(500).json({ erreur: (err as Error).message });
	}
});

// Récupérer un utilisateur par son id
router.get("/:id", async (req, res) => {
	try {
		const user = await UserModel.findById(req.params.id);
		if (!user)
			return res.status(404).json({ erreur: "Utilisateur non trouvé" });
		res.json(user);
	} catch (err) {
		res.status(500).json({ erreur: (err as Error).message });
	}
});

export default router;
