# CanadaSpends : Explorateur interactif des dépenses gouvernementales

*[English](README.en.md) | [Français](README.fr.md)*

Un outil puissant pour explorer les données des dépenses du gouvernement fédéral canadien grâce à des requêtes en langage naturel. Posez des questions sur les dépenses gouvernementales en français et obtenez des réponses instantanées alimentées par l'IA.

## Table des matières
- [Aperçu](#aperçu)
- [Fonctionnalités](#fonctionnalités)
- [Pour commencer](#pour-commencer)
  - [Prérequis](#prérequis)
  - [Installation](#installation)
- [Utilisation de l'interface de chat](#utilisation-de-linterface-de-chat)
  - [Exemples de questions](#exemples-de-questions)
  - [Commandes disponibles](#commandes-disponibles)
- [Architecture](#architecture)
- [Développement](#développement)
- [Dépannage](#dépannage)

## Aperçu

CanadaSpends rend les données des dépenses gouvernementales accessibles grâce à trois composants principaux :
- **Interface de chat interactive :** Posez des questions sur les données de dépenses en langage naturel
- **Traitement des données :** Analyse et nettoyage automatisés des sources de données gouvernementales
- **Recherche vectorielle :** Recherche sémantique avancée propulsée par Weaviate et l'IA

## Fonctionnalités

- 💬 Interface de requêtes en langage naturel
- 🤖 Génération de réponses alimentée par l'IA
- 📊 Accès en temps réel aux données des dépenses gouvernementales
- 🔍 Capacités de recherche sémantique
- 🎨 Formatage de texte enrichi pour une meilleure lisibilité
- 🔄 Stockage persistant des données
- 🐳 Déploiement facile avec Docker

## Pour commencer

### Prérequis

- Docker et Docker Compose
- Clé API Cohere

### Installation

1. **Cloner le dépôt :**
   ```bash
   git clone https://github.com/yourusername/CanadaSpends.git
   cd CanadaSpends
   ```

2. **Configurer l'environnement :**
   Créez un fichier `.env` dans le répertoire racine :
   ```env
   COHERE_API_KEY=votre_clé_api_cohere
   WEAVIATE_HOST=weaviate
   WEAVIATE_HTTP_PORT=8080
   WEAVIATE_GRPC_PORT=50051
   PYTHONPATH=/app
   ```

3. **Démarrer les services :**
   ```bash
   cd query-engine
   docker-compose up -d
   docker-compose run --rm chat
   ```

Cela lance :
- Base de données vectorielle Weaviate
- Service API
- Interface de chat interactive

## Utilisation de l'interface de chat

L'interface de chat offre un moyen intuitif d'explorer les données des dépenses gouvernementales. Il suffit de taper vos questions en langage naturel pour obtenir des réponses détaillées.

### Exemples de questions

- "Quelles étaient les dépenses totales en 2023 ?"
- "Comparez les dépenses entre les différents ministères"
- "Quelles sont les principales catégories de dépenses gouvernementales ?"
- "Quel ministère a eu les dépenses les plus élevées ?"

### Commandes disponibles

- Tapez vos questions en langage naturel pour interroger les données de dépenses
- `clear` - Efface l'écran
- `q`, `quit`, ou `exit` - Quitte l'interface de chat
- Utilisez Ctrl+C pour quitter à tout moment

## Architecture

Le système se compose de trois composants principaux :

1. **Base de données vectorielle (Weaviate)**
   - Stocke et indexe les données de dépenses
   - Permet la recherche sémantique
   - Maintient la persistance des données entre les sessions

2. **Service API**
   - Gère l'indexation des données
   - Traite les requêtes en langage naturel
   - Gère la communication avec les modèles d'IA

3. **Interface de chat**
   - Fournit une interface CLI interactive
   - Formate les réponses pour une meilleure lisibilité
   - Gère les commandes utilisateur

## Développement

Le code source est organisé selon la structure suivante :

```
CanadaSpends/
├── query-engine/
│   ├── src/
│   │   ├── chat_interface.py  # Interface CLI
│   │   ├── query_engine.py    # Traitement des requêtes
│   │   ├── indexer.py         # Indexation des données
│   │   └── main.py           # Service API
│   ├── csv-data/             # Répertoire de données
│   └── docker-compose.yaml   # Configuration des services
```

## Dépannage

Si vous rencontrez des problèmes :

1. **Problèmes de service**
   - Assurez-vous que toutes les clés API requises sont correctement définies dans `.env`
   - Vérifiez que les données CSV sont présentes dans `query-engine/csv-data`
   - Vérifiez l'état des services : `docker-compose ps`
   - Consultez les logs : `docker-compose logs`

2. **Problèmes de données**
   - Assurez-vous que les fichiers CSV sont correctement formatés
   - Vérifiez les permissions des fichiers
   - Vérifiez le chemin des données dans la configuration

3. **Problèmes d'API**
   - Confirmez que les clés API sont valides
   - Vérifiez la connectivité réseau
   - Vérifiez que les dépendances des services sont en cours d'exécution

4. **Support**
    - Pour obtenir de l'aide, veuillez ouvrir un ticket sur le [dépôt GitHub](https://github.com/yourusername/CanadaSpends/issues)
    - Ou si tout échoue, contactez [hi@canadaspends.com](mailto:hi@canadaspends.com) 