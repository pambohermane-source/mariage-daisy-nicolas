# Site mariage Daisy-Helen &amp; Nicolas — déploiement Railway

Ce dossier contient **tout** ce qu'il faut : le site, le serveur, le back-office
de collecte des confirmations, et la base de données. Suivez les étapes dans l'ordre.

---

## 📦 Ce qu'il y a dans le dossier

```
railway-app/
├── server.js          ← le serveur (sert le site + reçoit les confirmations)
├── package.json       ← la liste des dépendances
├── railway.json       ← la config de déploiement Railway
├── admin.html         ← le back-office (page protégée par mot de passe)
├── public/            ← le site lui-même (index.html, images, etc.)
└── data/              ← (créé automatiquement) la base des confirmations
```

---

## 🚀 Mise en ligne sur Railway (la plus simple — par GitHub)

### 1. Mettre le dossier sur GitHub
1. Créez un compte sur https://github.com (gratuit).
2. Créez un nouveau dépôt (**New repository**), par ex. `mariage-daisy-nicolas`.
3. Glissez-déposez **tout le contenu de ce dossier `railway-app/`** dans le dépôt
   (bouton *Add file → Upload files*). **Ne mettez pas** le dossier `node_modules`
   ni le dossier `data` (ils se recréent tout seuls).

### 2. Déployer sur Railway
1. Créez un compte sur https://railway.app (connexion avec GitHub conseillée).
2. **New Project → Deploy from GitHub repo →** choisissez votre dépôt.
3. Railway détecte Node.js et lance le déploiement automatiquement. ✅

### 3. Garder les confirmations en sécurité (volume)
Pour que les réponses ne disparaissent pas à chaque mise à jour :
1. Dans votre projet Railway, ouvrez le service → onglet **Variables**.
2. Ajoutez :
   - `ADMIN_PASSWORD` = *votre mot de passe du back-office* (ex. un mot fort à vous)
   - `DATA_DIR` = `/data`
3. Onglet **Settings → Volumes → New Volume**, point de montage : `/data`.
4. Redéployez (Railway le propose tout seul).

### 4. Mettre votre nom de domaine
1. Service → **Settings → Networking → Custom Domain**.
2. Saisissez votre domaine (ex. `mariage-daisy-nicolas.com`).
3. Railway vous donne un enregistrement **CNAME** à copier chez votre
   fournisseur de domaine (OVH, Gandi, GoDaddy…). Ajoutez-le, patientez
   quelques minutes, et le HTTPS s'active automatiquement.

---

## 🔑 Adresses une fois en ligne

- **Le site** : `https://votre-domaine.com/`
- **Le back-office** : `https://votre-domaine.com/admin`
  → on vous demande un identifiant : laissez l'utilisateur **vide** (ou n'importe quoi)
  et entrez le **mot de passe** défini dans `ADMIN_PASSWORD`.

### Dans le back-office vous pouvez :
- Voir toutes les confirmations en temps réel (nom, email, téléphone, langue,
  événement choisi, nombre d'accompagnants, régime alimentaire, message).
- Voir les totaux (présents au coutumier / au civil, total d'accompagnants).
- Rechercher et filtrer.
- **Exporter en Excel** (bouton « Exporter en CSV ») — s'ouvre dans Excel/Numbers.
- Supprimer une réponse.

---

## 💻 Tester sur votre ordinateur (facultatif)

Il faut [Node.js](https://nodejs.org) installé. Puis dans un terminal, ici :

```bash
npm install
npm start
```

Ouvrez http://localhost:3000 (le site) et http://localhost:3000/admin (le back-office,
mot de passe par défaut `daisy2026` tant que `ADMIN_PASSWORD` n'est pas défini).

---

## ❓ Points importants

- **Le formulaire est déjà branché** au serveur (il envoie vers `/api/rsvp`, sur le
  même domaine — rien à configurer côté site).
- **Clôture automatique** : le site bloque les réponses après le **10 juillet 2026**.
- **Sécurité** : changez le `ADMIN_PASSWORD` avant de communiquer l'adresse à qui que ce soit.
- Si une réponse arrive alors que le serveur est momentanément indisponible, le site
  la garde en local sur le téléphone de l'invité — mais avec Railway en ligne, tout
  arrive directement dans le back-office.
