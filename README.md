# TSness 🏋️

## Description
Application web de gestion de salles de sport avec un backend Node.js/Express, une base de données MongoDB, et un frontend Vue.js avec Tailwind CSS.

## Fonctionnalités disponibles

### 🔧 Administration (Super Admin)
- **Gestion des Salles** : Création, modification, suppression et approbation de salles
- **Attribution** : Associer des types d'exercices et niveaux de difficulté aux salles approuvées
- **Gestion d'Exercices** : Ajout, modification et suppression avec restrictions
- **Gestion des Badges** : Création et administration de badges dynamiques avec règles personnalisées
- **Gestion des Utilisateurs** : Administration des comptes avec suppression en cascade 
- **Restrictions** : Impossible de supprimer un type d'exercice lié à une salle existante

### 🏋️ Propriétaire de Salle (Owner) 
- **Multi-salles** : Gestion de plusieurs salles de sport pour un même propriétaire (maximum 4 salles)
- **Création** : Ajout de nouvelles salles (statut "en attente" par défaut)
- **Modification** : Édition des informations de ses salles
- **Suppression** : Suppression définitive de ses salles avec confirmation sécurisée
- **Proposition de Défis** : Création et gestion de défis d'entraînement spécifiques associés aux salles approuvées
- **Restrictions** : Pas de création/modification/suppression tant qu'une salle est en attente de validation

### 🎯 Gestion des Défis d'Entraînement (Owner)
- **Création de défis** : Proposer des défis spécifiques pour chaque salle approuvée
- **Personnalisation** : Définir le titre, la description, la difficulté, la durée et les objectifs
- **Association** : Lier les défis aux types d'exercices et aux équipements de la salle
- **Gestion complète** : Modifier et supprimer ses propres défis
- **Interface intuitive** : Interface moderne avec navigation entre salles et défis
- **Restrictions** : Défis uniquement pour les salles approuvées

### 🎯 Gestion des Restrictions et Sécurité
- Les owners ne peuvent pas modifier/supprimer leurs salles si l'une d'entre elles est en attente
- Les owners ne peuvent pas créer de nouvelles salles si l'une d'entre elles est en attente
- **Limite de salles** : Un propriétaire ne peut posséder plus de 4 salles de sport
- **Suppression sécurisée** : Confirmation par saisie de texte pour éviter les suppressions accidentelles
- Les admins ne peuvent pas supprimer un type d'exercice utilisé par une salle
- **Suppression en cascade** : Suppression automatique de toutes les données liées lors de la suppression d'un utilisateur
- **Prévisualisation de suppression** : Affichage détaillé des éléments qui seront supprimés
- **Protection des comptes inactifs** : Les comptes désactivés ne peuvent pas se connecter
- Protection contre la suppression des super administrateurs
- Interface utilisateur moderne et responsive avec feedback visuel

## Démarrage rapide

### Backend
- Installer les dépendances : `npm install` dans le dossier `backend`
- Configurer le fichier `.env` avec l'URI MongoDB
- Lancer le serveur : `npm start` ou `node server.js` dans `backend`

### Frontend
- Installer les dépendances : `npm install` dans le dossier `frontend`
- Lancer le serveur : `npm run dev` dans `frontend`
- Le frontend utilise Vue.js 3 + Tailwind CSS 
- **Routes disponibles** :
  - `/admin/gyms` : Gestion des salles d'entraînement (super admin)
  - `/admin/badges` : Gestion des badges et récompenses (super admin)
  - `/admin/users` : Gestion des utilisateurs (super admin)
  - `/owner/gym` : Gestion des salles (propriétaire)
  - `/owner/challenges` : Gestion des défis d'entraînement (propriétaire)
  - `/login` : Connexion
  - `/register` : Inscription

---

## API disponibles

- **/api/gyms** (gestion des salles d'entraînement)
- **/api/user** (authentification et gestion des propriétaires)
- **/api/exercisetypes** (gestion des types d'exercices)
- **/api/badges** (gestion des badges et récompenses - admin)
- **/api/admin** (gestion administrative des utilisateurs)
- **/api/challenges** (gestion des défis d'entraînement - owner)

### Routes spécifiques

#### Gestion des salles (/api/gyms)
- `GET /` : Lister toutes les salles
- `POST /` : Créer une nouvelle salle
- `PUT /:id` : Modifier une salle
- `DELETE /:id` : Supprimer une salle
- `PATCH /:id/approve` : Approuver une salle
- `PATCH /:id/assign` : Attribuer type d'exercice/difficulté/responsable
- `GET /owner?owner_id=:ownerId` : Récupérer les salles d'un propriétaire
- `POST /owner?owner_id=:ownerId` : Créer une salle pour un propriétaire
- `PUT /owner/:gymId?owner_id=:ownerId` : Modifier une salle spécifique du propriétaire
- `DELETE /owner/:gymId?owner_id=:ownerId` : Supprimer une salle spécifique du propriétaire

#### Gestion des badges (/api/badges)
- `GET /` : Lister tous les badges
- `POST /` : Créer un nouveau badge
- `PUT /:id` : Modifier un badge
- `DELETE /:id` : Supprimer un badge

#### Administration des utilisateurs (/api/admin)
- `GET /users` : Lister tous les utilisateurs
- `GET /users/:id/deletion-preview` : Prévisualiser les suppressions en cascade
- `PATCH /users/:id/toggle-status` : Activer/désactiver un utilisateur
- `PATCH /users/:id/role` : Modifier le rôle d'un utilisateur
- `DELETE /users/:id` : Supprimer un utilisateur (avec cascade)

#### Types d'exercices (/api/exercisetypes)
- `GET /` : Lister tous les types
- `POST /` : Créer un nouveau type
- `PUT /:id` : Modifier un type
- `DELETE /:id` : Supprimer un type

#### Gestion des défis (/api/challenges)
- `GET /` : Lister tous les défis (avec données populées)
- `GET /owner?ownerId=:ownerId` : Récupérer les défis d'un propriétaire via ses salles
- `POST /owner?owner_id=:ownerId` : Créer un nouveau défi pour une salle du propriétaire
- `PUT /owner/:challengeId?owner_id=:ownerId` : Modifier un défi existant (propriétaire uniquement)
- `DELETE /owner/:challengeId?owner_id=:ownerId` : Supprimer un défi (propriétaire uniquement)
- `GET /exercise-types` : Récupérer les types d'exercices pour les formulaires

#### Authentification et utilisateurs (/api/user)
- `POST /register` : Inscription d'un nouvel utilisateur
- `POST /login` : Connexion utilisateur (retourne un JWT, vérifie si le compte est actif)
- `GET /owners` : Lister tous les utilisateurs avec le rôle "owner"

---

## Journal des collections MongoDB (TSness)

- **users** :
  - Champs :
    - _id: ObjectId
    - firstname: String
    - lastname: String
    - email: String
    - password: String (bcrypt)
    - role: String ("client", "owner", "superadmin")
    - isActive: Boolean
    - createdAt: Date
    - updatedAt: Date
    - challenges_created: [ {
        title: String,
        description: String,
        type: String,
        difficulty: String,
        durationInDays: String
      } ]
    - challenges_joined: [ {
        challengeId: ObjectId,
        joinedAt: Date,
        progress: {
          sessions: Number,
          caloriesBurned: Number,
          completed: Boolean
        }
      } ]
    - friends: [ObjectId]
    - badges: [ {
        badgeId: ObjectId,
        earnedAt: Date
      } ]
    - score: Number

- **gyms** :
  - Champs :
    - _id: ObjectId
    - ownerId: ObjectId (user)
    - name: String
    - address: String
    - contact: String
    - description: String
    - equipments: [String]
    - activities: [String]
    - capacity: Number
    - isApproved: Boolean
    - createdAt: Date
    - updatedAt: Date

- **exercisetypes** :
  - Champs :
    - _id: ObjectId
    - name: String
    - description: String
    - targetedMuscles: [String]

- **challenges** :
  - Champs :
    - _id: ObjectId
    - title: String
    - description: String
    - createdBy: ObjectId (user)
    - gymId: ObjectId
    - exerciseTypeId: ObjectId
    - difficulty: String ("facile" | "intermédiaire" | "difficile")
    - durationInDays: String
    - objectives: [String]
    - createdAt: Date

- **badges** :
  - Champs :
    - _id: ObjectId
    - name: String
    - description: String
    - image: String (URL ou base64)
    - rule: {
        type: String,
        value: Number,
        details: String
      }

- **rewards** :
  - Champs :
    - _id: ObjectId
    - name: String
    - description: String
    - userId: ObjectId
    - awardedAt: Date

- **notifications** :
  - Champs :
    - _id: ObjectId
    - userId: ObjectId
    - message: String
    - type: String ("invitation" | "badge" | "challenge")
    - relatedId: ObjectId
    - isRead: Boolean
    - createdAt: Date

- **leaderboards** :
  - Champs :
    - _id: ObjectId
    - type: String ("global" | "monthly" | "gym-specific")
    - gymId: ObjectId
    - entries: [ {
        userId: ObjectId,
        score: Number,
        _id: ObjectId
      } ]
    - updatedAt: Date

---


