# 🎉 Eventure

> Eine moderne Event-Management Plattform

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)

## 📋 Projektübersicht

Eventure ist eine umfassende Event-Management-Plattform, die es Benutzern ermöglicht, Veranstaltungen zu erstellen, zu verwalten und zu besuchen. Die Anwendung besteht aus einem modernen Frontend und einer leistungsstarken Backend-API.

### Technologie-Stack

- **Frontend**: Angular mit TypeScript
- **Backend**: Nest.js mit TypeScript
- **Datenbank**: SQLite
- **Authentifizierung**: JWT-basiert
- **KI-Integration**: DeepSeek AI
- **Containerisierung**: Docker & Docker Compose

## 📁 Projektstruktur

```
eventure/
├── frontend/              # Angular-Frontend
│   ├── src/
│   │   ├── app/           # Angular-Komponenten und Module
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── services/
│   │   │   └── types/
│   │   ├── assets/        # Statische Ressourcen
│   │   └── environments/  # Umgebungskonfiguration
│   └── Dockerfile         # Frontend-Container-Definition
│
├── backend/               # NestJS-Backend
│   ├── src/
│   │   ├── auth/          # Authentifizierungslogik
│   │   ├── entity/        # Datenbankmodelle
│   │   ├── events/        # Event-Funktionalität
│   │   ├── users/         # Benutzerverwaltung
│   │   ├── openai/        # KI-Integration
│   │   └── uploads/       # Datei-Upload-Funktionalität
│   └── Dockerfile         # Backend-Container-Definition
│
└── docker-compose.yml     # Docker-Compose-Konfiguration
```

## 🚀 Installationsanleitung

Diese Anleitung beschreibt die Installation und Ausführung von Eventure sowohl für Entwicklungs- als auch für Produktionsumgebungen.

### Inhalt

- [Systemvoraussetzungen](#systemvoraussetzungen)
- [Entwicklungsumgebung](#entwicklungsumgebung)
- [Produktionsumgebung mit Docker](#produktionsumgebung-mit-docker)
- [Umgebungsvariablen konfigurieren](#umgebungsvariablen-konfigurieren)
- [Bekannte Probleme und Lösungen](#bekannte-probleme-und-lösungen)

### Systemvoraussetzungen

- Node.js (Version 18 oder höher)
- npm (Version 8 oder höher)
- Docker und Docker Compose (für Produktionsumgebung)
- Git

### Entwicklungsumgebung

1. **Repository klonen**

   ```bash
   git clone https://github.com/Projekte-DHBW/eventure.git
   cd eventure
   ```

2. **Abhängigkeiten installieren**

   ```bash
   npm i                # Root-Abhängigkeiten
   cd frontend && npm i # Frontend-Abhängigkeiten
   cd ../backend && npm i # Backend-Abhängigkeiten
   cd ..
   ```

3. **Umgebungsvariablen konfigurieren**
   Siehe Abschnitt [Umgebungsvariablen konfigurieren](#umgebungsvariablen-konfigurieren)

4. **Entwicklungsserver starten**
   ```bash
   npm run dev
   ```
   Der Backend-Server startet auf Port 3000, und der Frontend-Server auf Port 4200.

### Produktionsumgebung mit Docker

1. **Repository klonen**

   ```bash
   git clone https://github.com/Projekte-DHBW/eventure.git
   cd eventure
   ```

2. **Umgebungsvariablen konfigurieren**
   Erstellen Sie eine `.env`-Datei im Root-Verzeichnis (siehe [unten](#umgebungsvariablen-konfigurieren)).

3. **Docker-Container erstellen und starten**

   ```bash
   docker-compose up -d
   ```

   Die Anwendung ist nun verfügbar:

   - **Frontend**: http://localhost:80
   - **Backend-API**: http://localhost:3000

4. **Container-Logs anzeigen**
   ```bash
   docker-compose logs -f
   ```

### Umgebungsvariablen konfigurieren

Für die Produktionsumgebung werden folgende Umgebungsvariablen benötigt:

| Variable         | Beschreibung                              |
| ---------------- | ----------------------------------------- |
| SECRET           | JWT-Secret für die Authentifizierung      |
| REFRESH_SECRET   | Secret für JWT-Refresh-Tokens             |
| DEEPSEEK_API_KEY | API-Schlüssel für DeepSeek AI-Integration |

## 📚 Verwendete Bibliotheken und Frameworks

### Frontend

- **Angular**: SPA-Framework zur Entwicklung des Frontends
- **RxJS**: Reaktive Programmierung und asynchrone Operationen
- **Angular Material**: UI-Komponenten im Material Design

### Backend

- **Nest.js**: Backend Webframework für Node.js
- **TypeOrm**: ORM
- **Passport**: Authentifizierungsmiddleware
- **JWT**: Token-basierte Authentifizierung
- **Multer**: Datei-Upload-Handling

### DevOps

- **Docker**: Containerisierung der Anwendung
- **Docker Compose**: Multi-Container-Orchestrierung
- **Prettier**: Codequalitätssicherung
