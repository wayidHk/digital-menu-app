# 🍽️ Digital Menu App

Application web de menu digital pour restaurant, permettant aux clients de consulter le menu, passer des commandes par QR code, et au personnel de gérer les commandes, le menu et les finances — le tout en temps réel.

Construit avec **React**, **Vite**, **Tailwind CSS** et **shadcn/ui**. Le stockage est 100% local (localStorage) — aucun backend externe requis.

---

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Architecture](#-architecture)
- [Structure du projet](#-structure-du-projet)
- [Stack technique](#-stack-technique)
- [Installation](#-installation)
- [Lancement](#-lancement)
- [Pages de l'application](#-pages-de-lapplication)
- [Modèles de données](#-modèles-de-données)
- [Composants](#-composants)
- [Configuration](#-configuration)

---

## ✨ Fonctionnalités

### Côté Client (Menu)
- 📱 Menu digital responsive optimisé mobile
- 🏷️ Filtrage par catégories avec onglets
- 🛒 Panier interactif (bottom sheet) avec gestion des quantités
- 📦 Soumission de commande avec anti-spam (10s cooldown)
- 📋 Historique des commandes en temps réel
- 🔄 Fonction "recommander" (re-commander la dernière commande)
- 📊 Mise à jour automatique des stocks

### Côté Comptoir (Counter)
- 🔐 Authentification par mot de passe pour le personnel
- 📝 Gestion des commandes avec changements de statut (en attente → prêt → livré)
- 🍕 CRUD complet des produits (ajout, modification, suppression)
- 📲 Génération de QR codes par table (téléchargement, impression)

### Côté Cuisine (Kitchen)
- 👨‍🍳 Vue temps réel des commandes en attente
- ⏱️ Timer de préparation pour chaque commande
- ✅ Marquage rapide des commandes comme "prêtes"

### Côté Finance
- 📊 Tableau de bord avec revenus, commande moyenne, top produits
- 📈 Graphiques (recharts) avec filtres par période
- 🧾 Génération et impression de factures

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend (Vite + React)        │
│                                                  │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌───────┐│
│  │  Menu    │ │ Counter  │ │Kitchen │ │Finance││
│  │ (client) │ │ (admin)  │ │(cuisine│ │(stats)││
│  └────┬─────┘ └────┬─────┘ └───┬────┘ └──┬────┘│
│       │             │           │          │     │
│  ┌────▼─────────────▼───────────▼──────────▼───┐│
│  │         React Query (cache + sync)           ││
│  └────────────────────┬────────────────────────┘│
│                       │                          │
│  ┌────────────────────▼────────────────────────┐│
│  │      localDB.js (localStorage CRUD engine)   ││
│  └──────────────────────────────────────────────┘│
│                       │                          │
│               ┌───────▼────────┐                 │
│               │  localStorage  │                 │
│               │  (navigateur)  │                 │
│               └────────────────┘                 │
└──────────────────────────────────────────────────┘
```

---

## 📁 Structure du projet

```
digital-menu-app/
├── entities/                    # Définitions des entités (schémas)
│   ├── Category                 # Catégories de produits
│   ├── Order                    # Commandes clients
│   ├── Product                  # Produits du menu
│   └── RestaurantSettings       # Configuration du restaurant
│
├── src/
│   ├── api/
│   │   └── localDB.js           # Moteur CRUD localStorage
│   │
│   ├── components/
│   │   ├── client/              # Composants côté client (menu)
│   │   │   ├── CartDrawer.jsx        # Panier (bottom sheet)
│   │   │   ├── CategoryTabs.jsx      # Onglets de catégories
│   │   │   ├── MyOrders.jsx          # Historique commandes
│   │   │   ├── OrderConfirmation.jsx # Modal de confirmation
│   │   │   └── ProductCard.jsx       # Carte produit
│   │   │
│   │   ├── counter/             # Composants côté comptoir
│   │   │   ├── CounterLogin.jsx      # Login personnel
│   │   │   ├── MenuTab.jsx           # Gestion du menu (CRUD)
│   │   │   ├── OrdersTab.jsx         # Gestion des commandes
│   │   │   └── QRCodesTab.jsx        # QR codes par table
│   │   │
│   │   ├── ui/                  # 47 composants shadcn/ui
│   │   │   ├── button.jsx, card.jsx, dialog.jsx, ...
│   │   │   └── use-toast.jsx
│   │   │
│   │   ├── InvoiceGenerator.jsx # Génération de factures
│   │   ├── NavSwitcher.jsx      # Barre de navigation
│   │   └── UserNotRegisteredError.jsx
│   │
│   ├── hooks/
│   │   └── use-mobile.jsx       # Détection mobile
│   │
│   ├── lib/
│   │   ├── app-params.js        # Paramètres de l'app
│   │   ├── AuthContext.jsx      # Contexte d'authentification
│   │   ├── PageNotFound.jsx     # Page 404
│   │   ├── query-client.js      # Config React Query
│   │   └── utils.js             # Utilitaires (cn, isIframe)
│   │
│   ├── pages/
│   │   ├── Counter.jsx          # Page comptoir (admin)
│   │   ├── Finance.jsx          # Page finances
│   │   ├── Kitchen.jsx          # Page cuisine
│   │   └── Menu.jsx             # Page menu (client)
│   │
│   ├── App.jsx                  # Composant racine
│   ├── globals.css              # Styles globaux
│   ├── index.css                # Imports Tailwind
│   ├── main.jsx                 # Point d'entrée React
│   └── pages.config.js          # Configuration des routes
│
├── index.html                   # Point d'entrée HTML
├── package.json                 # Dépendances
├── vite.config.js               # Configuration Vite
├── tailwind.config.js           # Configuration Tailwind
├── postcss.config.js            # PostCSS
├── components.json              # Config shadcn/ui
└── jsconfig.json                # Alias de chemins (@/)
```

---

## 🛠️ Stack technique

| Catégorie | Technologie |
|-----------|------------|
| **Framework** | React 18 |
| **Bundler** | Vite 6 |
| **Styling** | Tailwind CSS 3 |
| **UI Components** | shadcn/ui (Radix UI) |
| **Animations** | Framer Motion |
| **State / Cache** | React Query (TanStack) |
| **Routing** | React Router DOM 6 |
| **Stockage** | localStorage (navigateur) |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Notifications** | Sonner |
| **Formulaires** | React Hook Form + Zod |

---

## 🚀 Installation

### Prérequis

- **Node.js** ≥ 18
- **npm** ≥ 9

### Étapes

```bash
# 1. Cloner le dépôt
git clone <url-du-repo>
cd digital-menu-app

# 2. Installer les dépendances
npm install
```

> **Note :** Aucune configuration supplémentaire n'est requise.
> Les données de démo (4 catégories, 10 produits) sont générées automatiquement au premier lancement.

---

## ▶️ Lancement

```bash
# Mode développement (avec hot reload)
npm run dev

# Build de production
npm run build

# Prévisualiser le build
npm run preview

# Linting
npm run lint
npm run lint:fix
```

L'app sera accessible sur `http://localhost:5173`

---

## 📱 Pages de l'application

### `/Menu` — Menu Client (page principale)
Le client scanne un QR code qui ouvre cette page avec le paramètre `?table=N`.
- Parcourt les catégories et produits
- Ajoute au panier et passe commande
- Suit ses commandes en temps réel

### `/Counter` — Comptoir (admin)
Interface d'administration protégée par mot de passe :
- **Onglet Commandes** : voir et gérer les statuts des commandes
- **Onglet Menu** : ajouter, modifier, supprimer des produits
- **Onglet QR Codes** : générer les QR codes pour chaque table

### `/Kitchen` — Cuisine
Vue simplifiée pour le personnel en cuisine :
- Affiche les commandes en attente avec chronomètre
- Permet de marquer une commande comme "prête"

### `/Finance` — Finances
Tableau de bord analytique :
- Statistiques : CA, nb commandes, panier moyen, top produit
- Graphiques de revenus par période
- Génération de factures

---

## 📦 Modèles de données

### Category
| Champ | Type | Description |
|-------|------|-------------|
| `id` | string | Identifiant unique |
| `name` | string | Nom de la catégorie |
| `icon` | string | Emoji/icône |
| `display_order` | number | Ordre d'affichage |
| `is_active` | boolean | Visibilité |

### Product
| Champ | Type | Description |
|-------|------|-------------|
| `id` | string | Identifiant unique |
| `name` | string | Nom du produit |
| `description` | string | Description |
| `price` | number | Prix (€) |
| `category_id` | string | Lien vers Category |
| `image_url` | string | URL de l'image |
| `stock` | number | Quantité en stock |
| `is_active` | boolean | Visible au menu |

### Order
| Champ | Type | Description |
|-------|------|-------------|
| `id` | string | Identifiant unique |
| `table_id` | number | Numéro de table |
| `session_id` | string | Session client (UUID) |
| `status` | string | `pending` / `ready` / `delivered` / `cancelled` |
| `total` | number | Montant total (€) |
| `items` | array | Liste `{ product_id, product_name, quantity, price }` |
| `created_date` | string | Date de création |

### RestaurantSettings
| Champ | Type | Description |
|-------|------|-------------|
| `restaurant_name` | string | Nom du restaurant |
| `table_count` | number | Nombre de tables (défaut: 6) |
| `currency` | string | Devise (défaut: EUR) |
| `counter_password` | string | Mot de passe comptoir |
| `is_open` | boolean | Restaurant ouvert/fermé |

---

## 🧩 Composants

### Composants métier

| Composant | Rôle |
|-----------|------|
| `CategoryTabs` | Onglets de filtrage par catégorie |
| `ProductCard` | Carte produit avec contrôles de quantité |
| `CartDrawer` | Panier en bottom sheet avec total et soumission |
| `OrderConfirmation` | Modal de confirmation après commande |
| `MyOrders` | Drawer latéral avec historique des commandes |
| `CounterLogin` | Écran de connexion personnel |
| `OrdersTab` | Gestion des commandes avec filtres et actions |
| `MenuTab` | CRUD produits avec formulaire Dialog |
| `QRCodesTab` | Grille de QR codes avec download/print |
| `InvoiceGenerator` | Modal de facture avec impression |
| `NavSwitcher` | Barre de navigation bottom |

### Composants UI (shadcn/ui)
47 composants primitifs basés sur Radix UI : `accordion`, `alert`, `badge`, `button`, `card`, `checkbox`, `dialog`, `dropdown-menu`, `input`, `label`, `select`, `separator`, `sheet`, `switch`, `table`, `tabs`, `toast`, `tooltip`, etc.

---

## ⚙️ Configuration

### `pages.config.js`
Définit les routes de l'application. La page principale (`mainPage`) est `Menu`.

### `components.json`
Configuration shadcn/ui (style, alias, couleurs).

### `vite.config.js`
- Plugin React avec HMR
- Alias `@/` → `./src`

### `tailwind.config.js`
Thème personnalisé avec :
- Couleurs CSS variables pour le theming
- Animations (accordion, fade, slide)
- Support du dark mode

---

## 📄 Licence

Projet privé — © 2026

---

## 📝 Notes

- Les données sont stockées dans le `localStorage` du navigateur
- Pour réinitialiser les données de démo, exécutez dans la console : `localStorage.clear()` puis rafraîchissez
- Le mot de passe comptoir par défaut est `1234`
