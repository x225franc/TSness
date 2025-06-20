const express = require('express');
const mongoose = require('mongoose');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB Connecté'))
.catch(err => console.error('MongoDB Erreur:', err));

// Simple route
app.get('/', (req, res) => {
    res.send('Hello World !');
});

app.listen(PORT, () => {
    console.log(`Server en cours d\'exécution sur le port ${PORT}`);
});