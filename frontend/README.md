# CNPS Control Application

Une application pour gérer les contrôles et les plannings d'inspection de la CNPS.

## Fonctionnalités

- Authentification sécurisée (connexion / déconnexion)
- Gestion des utilisateurs
- Planning mensuel des contrôles
- Gestion des contrôles (création, mise à jour, suppression)
- Suivi de l'état des contrôles
- Statistiques et rapports

## Technologies utilisées

- Next.js 14+ (React Framework)
- TypeScript
- Tailwind CSS
- Recharts (pour les visualisations de données)
- Lucide React (icônes)

## Installation

Clonez le dépôt et installez les dépendances:

```bash
git clone <url-du-repo>
cd cnps-control-app
npm install
```

## Démarrage en développement

Pour lancer l'application en mode développement:

```bash
npm run dev
```

L'application sera accessible à l'adresse [http://localhost:3000](http://localhost:3000).

## Authentification (mode développement)

Pour vous connecter en mode développement, utilisez les identifiants suivants:

- **Admin:**

  - Email: admin@example.com
  - Mot de passe: n'importe quel mot de passe

- **Utilisateur régulier:**
  - Email: user@example.com
  - Mot de passe: n'importe quel mot de passe

## Déploiement en production

Pour construire l'application pour la production:

```bash
npm run build
```

Pour démarrer l'application en production:

```bash
npm run start
```

## Structure du projet

```
cnps-control-app/
├── app/               # Pages de l'application
├── components/        # Composants réutilisables
├── lib/               # Utilitaires et fonctions
├── hooks/             # Hooks personnalisés
├── public/            # Fichiers statiques
└── styles/            # Styles CSS
```

## Environnements

L'application supporte plusieurs environnements:

- **dev** - Environnement de développement local
- **test** - Environnement de test pour les QA
- **prod** - Environnement de production

## Licence

Tous droits réservés - CNPS 2024
