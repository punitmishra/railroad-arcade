#!/bin/bash
# Railroad Arcade - GKE Deployment Script
# Usage: ./scripts/deploy-gke.sh [PROJECT_ID] [CLUSTER_NAME] [ZONE]

set -e

# Configuration
PROJECT_ID=${1:-"your-gcp-project-id"}
CLUSTER_NAME=${2:-"railroad-arcade-cluster"}
ZONE=${3:-"us-central1-a"}
IMAGE_NAME="railroad-arcade"

echo "=========================================="
echo "Railroad Arcade - GKE Deployment"
echo "=========================================="
echo "Project: $PROJECT_ID"
echo "Cluster: $CLUSTER_NAME"
echo "Zone: $ZONE"
echo "=========================================="

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud CLI is not installed."
    echo "Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "Error: kubectl is not installed."
    echo "Install it with: gcloud components install kubectl"
    exit 1
fi

# Authenticate and set project
echo ""
echo "Step 1: Configuring gcloud..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo ""
echo "Step 2: Enabling required APIs..."
gcloud services enable container.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# Check if cluster exists, create if not
echo ""
echo "Step 3: Checking GKE cluster..."
if ! gcloud container clusters describe $CLUSTER_NAME --zone $ZONE &> /dev/null; then
    echo "Creating GKE cluster: $CLUSTER_NAME..."
    gcloud container clusters create $CLUSTER_NAME \
        --zone $ZONE \
        --num-nodes 2 \
        --machine-type e2-medium \
        --enable-autoscaling \
        --min-nodes 1 \
        --max-nodes 5 \
        --enable-autorepair \
        --enable-autoupgrade
else
    echo "Cluster $CLUSTER_NAME already exists."
fi

# Get cluster credentials
echo ""
echo "Step 4: Getting cluster credentials..."
gcloud container clusters get-credentials $CLUSTER_NAME --zone $ZONE

# Reserve static IP for ingress
echo ""
echo "Step 5: Reserving static IP..."
if ! gcloud compute addresses describe railroad-arcade-ip --global &> /dev/null; then
    gcloud compute addresses create railroad-arcade-ip --global
fi
STATIC_IP=$(gcloud compute addresses describe railroad-arcade-ip --global --format='value(address)')
echo "Static IP: $STATIC_IP"

# Build and push Docker image
echo ""
echo "Step 6: Building and pushing Docker image..."
docker build -t gcr.io/$PROJECT_ID/$IMAGE_NAME:latest .
docker push gcr.io/$PROJECT_ID/$IMAGE_NAME:latest

# Update deployment.yaml with project ID
echo ""
echo "Step 7: Updating deployment configuration..."
sed -i.bak "s/PROJECT_ID/$PROJECT_ID/g" k8s/deployment.yaml
rm -f k8s/deployment.yaml.bak

# Check for secrets
echo ""
echo "Step 8: Checking secrets..."
if [ ! -f "k8s/secrets.yaml" ]; then
    echo "WARNING: k8s/secrets.yaml not found!"
    echo "Copy k8s/secrets.yaml.example to k8s/secrets.yaml and fill in your values."
    echo "Then run: kubectl apply -f k8s/secrets.yaml"
    exit 1
fi

# Apply secrets
kubectl apply -f k8s/secrets.yaml

# Deploy application
echo ""
echo "Step 9: Deploying to GKE..."
kubectl apply -f k8s/deployment.yaml

# Wait for deployment
echo ""
echo "Step 10: Waiting for deployment..."
kubectl rollout status deployment/railroad-arcade

# Get service info
echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Static IP: $STATIC_IP"
echo "Configure your DNS to point to this IP."
echo ""
echo "Check deployment status:"
echo "  kubectl get pods"
echo "  kubectl get services"
echo "  kubectl get ingress"
echo ""
echo "View logs:"
echo "  kubectl logs -l app=railroad-arcade -f"
echo ""
