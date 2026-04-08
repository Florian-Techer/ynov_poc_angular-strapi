# E-commerce POC — Angular + Strapi

Ce dépôt est une preuve de concept e-commerce découpée en **deux applications** :

- **`angular-frontend`** : interface client (Angular 21, composants standalone, Angular Material, SSR possible).
- **`strapi-backend`** : API et CMS headless (Strapi 5), base SQLite (`better-sqlite3`), modèles produits, catégories et commandes.

> **Sécurité** : ne commitez pas de jetons API en clair. Remplacez les valeurs sensibles dans `angular-frontend/src/app/api.config.ts` par des variables d’environnement ou un fichier local non versionné.

---

## Fonctionnalités de l’application

### Implémenté

| Zone | Description |
|------|-------------|
| **Accueil (`/home`)** | Affiche les **derniers produits** (tri par `createdAt` côté Strapi, limite configurable). Clic sur une carte → fiche produit. |
| **Catalogue (`/products`)** | Liste les produits (jusqu’à 100 par requête) et les catégories. **Filtres côté client** : recherche texte, catégorie, fourchette de prix. Indicateur de chargement (Material). |
| **Fiche produit (`/products/:documentId`)** | Détail d’un produit par **`documentId` Strapi 5**. Gestion des états chargement / invalide / introuvable. Enrichissement des infos catégorie avec `CategoryService`. Snackbar Material pour les actions. |
| **Données** | Si `CMS_API_BASE_URL` est vide, l’app utilise des **données mock** (produits et catégories). En cas d’erreur réseau, **repli** sur les mocks pour les produits. |
| **UI** | Navigation (header), liste d’articles réutilisable (`ItemList` / `ItemCard`), pied de page. |

### Placeholders / à compléter

| Zone | État |
|------|------|
| **Panier (`/cart`)** | Page minimale ; le service `Cart` est vide. |
| **Checkout (`/checkout`)** | Page minimale ; le service `Order` est vide. |
| **Commandes Strapi** | Le type de contenu **Order** existe (schéma avec client, email, adresse, total, items JSON), mais le front **n’appelle pas encore** l’API `orders` pour créer une commande. |

---

## Routes front-end (Angular)

Définies dans `angular-frontend/src/app/app.routes.ts` :

| Chemin | Composant (lazy) |
|--------|-------------------|
| `/` | Redirection vers `/home` |
| `/home` | `Home` |
| `/products` | `Products` |
| `/products/:documentId` | `ProductDetail` |
| `/cart` | `Cart` |
| `/checkout` | `Checkout` |
| `**` | Redirection vers `/home` |

---

## API (Strapi REST)

Strapi expose par défaut une API REST sous le préfixe **`/api`**. Le serveur d’administration et l’API tournent en général sur le port **1337** (voir `strapi-backend/config/server.ts`).

### Collections métier

| Ressource | Collection Strapi | Champs principaux (aperçu) |
|-----------|-------------------|---------------------------|
| **Produits** | `products` | `title`, `slug`, `description` (blocks), `price`, `stock`, `image` (média), relation `category` |
| **Catégories** | `categories` | `category_name`, `slug`, relation inverse `products` |
| **Commandes** | `orders` | `customerName`, `email`, `address`, `total`, `items` (JSON) |

### Endpoints utilisés par le front aujourd’hui

Le front appelle explicitement :

| Méthode | URL (exemple) | Usage |
|---------|----------------|--------|
| `GET` | `/api/products` | Liste avec query params : `sort`, `pagination[pageSize]`, `pagination[page]`, `populate=*` |
| `GET` | `/api/products/:documentId` | Détail avec `populate=*` |
| `GET` | `/api/categories` | Liste avec pagination |

Authentification lecture : en-tête **`Authorization: Bearer <token>`** si `CMS_API_READ_TOKEN` est renseigné (jeton API Strapi : *Settings → API Tokens*).

### Endpoints Strapi standards (disponibles selon permissions)

Pour chaque type de collection, Strapi génère typiquement :

- `GET /api/<plural>` — liste (filtres, tri, populate, pagination via query string)
- `GET /api/<plural>/:documentId` — une entrée (Strapi 5 utilise souvent `documentId` dans l’URL REST)
- `POST /api/<plural>` — création (souvent réservé aux rôles authentifiés / policies)
- `PUT` / `DELETE` sur la même ressource — mise à jour / suppression

Les routes exactes et les politiques **`users-permissions`** dépendent de la configuration dans l’admin Strapi.

---

## Dépendances principales

### `angular-frontend` (`package.json`)

| Dépendance | Rôle |
|------------|------|
| `@angular/core`, `@angular/common`, `@angular/compiler`, `@angular/forms`, `@angular/router` | Framework SPA, formulaires, routage |
| `@angular/platform-browser`, `@angular/platform-server` | Rendu navigateur et serveur |
| `@angular/ssr` | Server-Side Rendering Angular |
| `@angular/material`, `@angular/cdk` | Composants UI (boutons, champs, spinners, icônes, etc.) |
| `@angular/animations` | Animations Material |
| `rxjs` | Flux asynchrones (Observables) avec les services HTTP |
| `express` | Serveur Node pour le bundle SSR |
| `tslib` | Helpers TypeScript |

**Dev** : `@angular/cli`, `@angular/build`, `typescript`, `vitest`, `jsdom`, `prettier`, types Node / Express.

### `strapi-backend` (`package.json`)

| Dépendance | Rôle |
|------------|------|
| `@strapi/strapi` | Cœur Strapi 5 |
| `@strapi/plugin-users-permissions` | Utilisateurs, rôles, JWT, permissions API |
| `@strapi/plugin-cloud` | Intégrations liées au déploiement Strapi Cloud |
| `better-sqlite3` | Moteur SQLite embarqué |
| `react`, `react-dom`, `react-router-dom`, `styled-components` | Stack du **panneau d’administration** Strapi (React) |

---

## Démarrage rapide

1. **Strapi** (depuis `strapi-backend/`) : `npm install` puis `npm run develop` — créer un compte admin, configurer les permissions *Public* sur `find` / `findOne` pour produits et catégories si besoin, créer un **API Token** en lecture pour le front.
2. **Angular** (depuis `angular-frontend/`) : `npm install` puis `ng serve` — ajuster `api.config.ts` (`CMS_API_BASE_URL`, jeton).

---

## Angular + Strapi **vs** Next.js + Express

Comparaison orientée **projet e-commerce / contenu** — les deux piles sont valides ; le choix dépend surtout de l’équipe, du hosting et du degré de personnalisation du back-office.

### Angular + Strapi

**Avantages**

- **Séparation nette** : le CMS (Strapi) gère contenu, médias, rôles et API REST/GraphQL sans réécrire un back-office.
- **Productivité éditoriale** : interface d’admin prête ; idéal pour catalogues enrichis (champs, relations, médias).
- **Angular** : architecture très structurée (modules / standalone, DI, RxJS), adaptée aux **grandes équipes** et applications longues.
- **Typage et outillage** : écosystème mature pour les apps enterprise.

**Inconvénients**

- **Deux déploiements** (au minimum) : front Angular + API Strapi + base de données.
- **Courbe Strapi** : montée en version, plugins, permissions et hébergement à maîtriser.
- **Moins “full-stack JS homogène”** que Next si toute l’équipe vit dans React/Node uniquement.
- Latence et complexité réseau entre deux origines si pas de BFF ou de cache soigné.

### Next.js + Express (ou API Routes Next)

**Avantages**

- **Un seul dépôt / un seul runtime Node** possible : pages React, API routes ou route handlers, parfois Express monté derrière.
- **SSR / SSG / streaming** très intégrés pour le SEO et le TTFB sur les pages vitrine.
- **Partage de types** entre client et serveur (TypeScript) si l’API est co-localisée.
- Écosystème npm énorme côté React ; recrutement et tutoriels très denses.

**Inconvénients**

- **Pas de CMS admin “clé en main”** comme Strapi : soit développement maison, soit intégration d’un headless tiers (dont Strapi justement).
- **Express seul** : tout est à coder (auth, validation, uploads, admin) — plus de contrôle, plus de responsabilité.
- Risque de **mélange des préoccupations** si la même app gère trop de logique métier sans couches claires.

**Synthèse** : Angular + Strapi privilégie **CMS + front structuré** ; Next + Express (ou API intégrée) privilégie **unification React/Node** et flexibilité du rendu, au prix d’un back-office ou d’un CMS à ajouter si besoin métier.

---

## Structures de projet : Angular **vs** Next.js (et Express)

### Angular (proche de ce dépôt)

Organisation typique par **domaine technique** dans `src/app/` :

- `pages/` ou `features/` — écrans et routage lazy
- `components/` — UI réutilisable
- `services/` — appels HTTP, état métier
- `models/` — interfaces TypeScript
- `utils/`, `mappers/` — helpers

Le **build** produit une SPA ; avec **SSR**, un serveur Node (souvent Express) sert les pages pré-rendues. Les **routes** sont déclarées dans le module de routage Angular, pas comme fichiers dans un dossier `app/`.

### Next.js (App Router)

Organisation par **arborescence de fichiers** sous `app/` (ou anciennement `pages/`) :

- `app/page.tsx`, `app/layout.tsx` — pages et layouts
- `app/api/.../route.ts` — handlers HTTP (GET, POST, …)
- `app/products/[id]/page.tsx` — routes dynamiques = chemins fichiers

Les **composants** peuvent cohabiter à côté des routes ou dans `components/`. Le lien URL ↔ code est **implicite** (convention Next).

### Express (API seule)

Souvent :

- `src/routes/` — définition des chemins REST
- `src/controllers/` — logique par ressource
- `src/models/` ou ORM (`prisma/`, `models/`) — persistance
- `src/middlewares/` — auth, erreurs, validation

Pas de moteur de vues imposé : JSON pour une API pure.

### Strapi

- `src/api/<nom>/content-types/` — schémas JSON des collections
- `src/api/<nom>/controllers|services|routes/` — extension du CRUD généré
- `config/` — base de données, serveur, plugins

Le “routing” REST est **généré** à partir des content-types, pas fichier par fichier comme Next.

---

## Licence et contexte

Projet pédagogique / POC (Ynov, M2 Next.js)

Pour toute évolution : brancher le panier et le checkout sur `POST /api/orders` (avec permissions et validation adaptées), et externaliser la configuration API hors du code source.
