import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import gymsRouter from './routes/gyms';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Routes
app.use(gymsRouter);
app.use('/api/user', require('./routes/user'));
app.use('/api/exercisetypes', require('./routes/exercisetypes'));
app.use('/api/badges', require('./routes/badges'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/challenges', require('./routes/challenges'));

// MongoDB connection
if (typeof process.env.MONGODB_URI === 'undefined') {
    throw new Error('MONGODB_URI is not defined');
}

mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB Connecté'))
.catch((err: Error) => console.error('MongoDB Erreur:', err));

// route test
// app.get('/', (req, res) => {
//     res.send('Hello World !');
// });

// lancement du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server en cours d\'exécution sur le port ${PORT}`);
});