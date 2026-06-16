# Déploiement

Le projet est une application Next.js 15 standard. Les data marts étant
versionnés dans le dépôt, aucun service externe n'est requis au runtime (hormis
l'explorateur d'articles, qui interroge OpenAlex en direct).

## Variables d'environnement

Toutes optionnelles (valeurs par défaut pour l'UGA) :

| Variable | Rôle | Défaut |
|---|---|---|
| `OPENALEX_MAILTO` | Pool « poli » OpenAlex | `demo@uga-dashboard.fr` |
| `NEXT_PUBLIC_INSTITUTION_OPENALEX_ID` | Institution ciblée | `I899635006` |
| `HAL_STRUCT_ACRONYM` | Portée HAL | `UGA` |
| `NEXT_PUBLIC_INSTITUTION_NAME` | Libellé affiché | `Université Grenoble Alpes` |

## Stratégie de rafraîchissement des données

- **Par défaut** : les marts sont commités ; le déploiement est immédiat.
- **Au build** : décommenter `RUN npm run pipeline` dans le `Dockerfile`, ou
  ajouter une étape `npm run pipeline` au pipeline CI, pour des données fraîches
  à chaque build.
- **Planifié** : une tâche cron (GitHub Actions, Cloud Scheduler) peut relancer
  `npm run pipeline` et committer les marts mis à jour.

Sonde de santé des sources : `GET /api/health` (200 si OpenAlex et HAL répondent).

## Vercel (recommandé)

Éditeur de Next.js, le plus simple.

```bash
npm i -g vercel
vercel          # préversion
vercel --prod   # production
```

Ou : connecter le dépôt GitHub sur vercel.com (détection automatique de Next.js,
build `npm run build`). Renseigner les variables d'environnement si nécessaire.

## Google Cloud Platform — Cloud Run

Conteneur autoscalé (le `Dockerfile` produit une image `standalone`).

```bash
PROJECT=mon-projet
REGION=europe-west1
gcloud artifacts repositories create uga \
  --repository-format=docker --location=$REGION
gcloud builds submit \
  --tag $REGION-docker.pkg.dev/$PROJECT/uga/dashboard
gcloud run deploy uga-dashboard \
  --image $REGION-docker.pkg.dev/$PROJECT/uga/dashboard \
  --region $REGION --allow-unauthenticated \
  --set-env-vars OPENALEX_MAILTO=contact@uga.fr
```

Rafraîchissement : Cloud Scheduler -> Cloud Run Job exécutant `npm run pipeline`.

## Amazon Web Services

Trois options selon le besoin :

- **AWS Amplify Hosting** (le plus simple) : connecter le dépôt Git, build
  `npm run build`. Support Next.js SSR géré.
- **Conteneur** : pousser l'image sur **ECR**, déployer sur **ECS Fargate** ou
  **App Runner**.
  ```bash
  aws ecr create-repository --repository-name uga-dashboard
  docker build -t uga-dashboard .
  docker tag uga-dashboard:latest <acct>.dkr.ecr.<region>.amazonaws.com/uga-dashboard
  docker push <acct>.dkr.ecr.<region>.amazonaws.com/uga-dashboard
  # puis App Runner : créer un service depuis l'image ECR
  ```
- **Serverless** : adaptateur [OpenNext](https://open-next.js.org) vers Lambda +
  CloudFront + S3.

## Microsoft Azure

- **Azure Static Web Apps** : preset Next.js, déploiement Git natif via GitHub
  Actions.
- **Azure Container Apps** (conteneur) :
  ```bash
  az acr create -n ugaregistry -g mon-rg --sku Basic
  az acr build -r ugaregistry -t uga-dashboard:latest .
  az containerapp up \
    --name uga-dashboard --resource-group mon-rg \
    --image ugaregistry.azurecr.io/uga-dashboard:latest \
    --target-port 3000 --ingress external
  ```

## Sur site (UGA)

L'image Docker `standalone` se déploie sur tout orchestrateur interne
(Kubernetes, Docker Compose). Le tableau de bord peut alors lire des marts
générés depuis le SID plutôt que depuis les API publiques.
