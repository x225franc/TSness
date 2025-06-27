const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// Routes
app.use('/api/gyms', require('./routes/gyms'));
app.use('/api/user', require('./routes/user'));
app.use('/api/exercisetypes', require('./routes/exercisetypes'));
app.use('/api/badges', require('./routes/badges'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/challenges', require('./routes/challenges'));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('MongoDB Connecté'))
.catch(err => console.error('MongoDB Erreur:', err));

// route test
// app.get('/', (req, res) => {
//     res.send('Hello World !');
// });

// lancement du serveur
app.listen(PORT, () => {
    console.log(`Server en cours d\'exécution sur le port ${PORT}`);
});