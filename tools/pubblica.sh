#!/usr/bin/env bash
# ELEKTRON — pubblica gli aggiornamenti su GitHub Pages: https://mirkoc78.github.io/elektron/
# Uso, dalla cartella del progetto (Git Bash):   bash tools/pubblica.sh "che cosa è cambiato"
#  1. ricostruisce l'app (node build.js) e lancia tutti i test: se un test fallisce si ferma e non pubblica;
#  2. controlla che nei file del progetto non ci siano email, password, chiavi o dati di studenti;
#  3. salva le modifiche sul ramo main e le invia a GitHub;
#  4. copia la cartella dist/sito nel ramo gh-pages (git subtree split) e la invia: Pages pubblica da quel ramo.
# Il collegamento a GitHub è quello di GitHub CLI (gh auth status); l'email dei commit è quella anonima di GitHub.
set -euo pipefail
cd "$(dirname "$0")/.."

GH="gh"
command -v gh >/dev/null 2>&1 || GH="/c/Program Files/GitHub CLI/gh.exe"
REPO="MirkoC78/elektron"

git config core.longpaths true
git config user.email "292388911+MirkoC78@users.noreply.github.com"

echo "== Costruzione e test"
node build.js
node test/run-all.js

echo "== Controllo dei dati riservati"
node tools/riservati.js

echo "== Ramo main"
git add -A
if ! git diff --cached --quiet; then git commit -q -m "${1:-Aggiornamento del sito}"; fi
git push origin main

echo "== Ramo gh-pages (contenuto di dist/sito)"
git branch -D gh-pages-pubblica >/dev/null 2>&1 || true
git subtree split --prefix dist/sito -b gh-pages-pubblica
git push -f origin gh-pages-pubblica:gh-pages
git branch -D gh-pages-pubblica >/dev/null

echo "== Fatto. GitHub Pages aggiorna il sito in uno o due minuti: https://mirkoc78.github.io/elektron/"
"$GH" api "repos/$REPO/pages/builds/latest" --jq '"Stato dell’ultima pubblicazione: " + .status' 2>/dev/null || true
