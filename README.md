# 🤖 ShortSystem Discord Bot - Manager Edition

Ein professioneller Discord Management Bot mit erweiterten Features für Selfroles, Auto-Moderation, Backups und mehr.

## 📋 Inhaltsverzeichnis

- [Features](#features)
- [Installation](#installation)
- [Commands](#commands)
- [Konfiguration](#konfiguration)
- [Neue Verbesserungen](#neue-verbesserungen)
- [PM2 Management](#pm2-management)
- [Troubleshooting](#troubleshooting)

---

## ✨ Features

### Core Features
- ✅ **Selfrole-System** - Reaction-Roles für automatische Rollenvergabe
- 📜 **Regelwerk-System** - Automatisches Regelwerk mit Akzeptierung
- 🛠️ **Rollen-Editor** - Vollständige Verwaltung von Selfroles
- 📊 **Statistiken** - Detaillierte Bot- und Server-Statistiken

### Neue Manager-Features
- 🛡️ **Auto-Moderation** - Spam, Links, Caps-Lock und Mention-Filter
- 💾 **Backup-System** - Automatische Sicherung und Wiederherstellung
- 📝 **Logging-System** - Professionelle Logs mit Kategorien
- 🔐 **Permissions-Checker** - Überprüfung aller Bot-Berechtigungen
- 📋 **Audit-Logs** - Überwachung aller Bot-Aktionen
- 🔧 **Wartungs-Tools** - System-Optimierung und Reparatur

---

## 📦 Installation

### Voraussetzungen
- Node.js 16.11.0 oder höher
- npm oder yarn
- Discord Bot Token

### Setup

1. **Repository klonen**
```bash
git clone <dein-repo>
cd discord-bot
```

2. **Dependencies installieren**
```bash
npm install
```

3. **.env Datei erstellen**
```env
DISCORD_TOKEN=dein_bot_token_hier
CLIENT_ID=deine_client_id_hier
NODE_ENV=production
```

4. **Bot starten**
```bash
# Normal
npm start

# Mit PM2 (empfohlen für Produktion)
npm run pm2:start
```

---

## 🎮 Commands

### Setup & Konfiguration

#### `/setup`
Zeigt die Einrichtungsanleitung an.

#### `/setup-rules`
Richtet das Regelwerk-System ein.
```
/setup-rules channel:#regeln
```

#### `/setup-selfroles`
Richtet das Selfrole-System ein.
```
/setup-selfroles channel:#selfroles news:@News stream:@Stream ...
```

### Rollen-Verwaltung

#### `/roles-editor`
Öffnet das interaktive Rollen-Management-Menü mit folgenden Optionen:
- ➕ **Rolle hinzufügen** - Neue Selfrole hinzufügen
- 🔄 **Rolle ersetzen** - Bestehende Rolle ersetzen (Emoji bleibt gleich)
- ✏️ **Rolle bearbeiten** - Emoji oder Beschreibung ändern
- 🗑️ **Rolle löschen** - Rolle aus dem System entfernen
- 🔀 **Reihenfolge** - Rollen neu sortieren (in Entwicklung)

#### `/roles`
Zeigt alle verfügbaren Selfrole-Rollen an.

### Statistiken & Monitoring

#### `/stats`
Zeigt umfassende Bot-Statistiken an:
- Bot-Informationen (Uptime, Server, Nutzer)
- System-Ressourcen (RAM, Ping)
- Selfrole-Statistiken
- Rollen-Verteilung

### Auto-Moderation

#### `/automod status`
Zeigt den Status des Auto-Mod Systems an.

#### `/automod enable <feature>`
Aktiviert Auto-Mod Features:
- `spam` - Spam-Filter
- `links` - Link-Filter
- `caps` - Caps-Lock Filter
- `mentions` - Mention-Spam Filter
- `all` - Alle Features

#### `/automod disable <feature>`
Deaktiviert Auto-Mod Features.

#### `/automod config <setting> <value>`
Konfiguriert Auto-Mod Einstellungen:
- `max_links` - Maximale Links pro Nachricht (1-100)
- `max_mentions` - Maximale Mentions pro Nachricht (1-100)
- `caps_percentage` - Erlaubte Caps-Lock Prozent (1-100)
- `spam_window` - Spam-Zeitfenster in Sekunden (1-100)

#### `/automod whitelist <channel>`
Fügt einen Channel zur Whitelist hinzu (Auto-Mod wird ignoriert).

### Backup & Wiederherstellung

#### `/backup create`
Erstellt ein Backup der aktuellen Konfiguration.

#### `/backup list`
Zeigt alle verfügbaren Backups an.

#### `/backup download`
Lädt die aktuelle Konfiguration als JSON herunter.

#### `/backup restore <backup>`
Stellt ein Backup wieder her.

### Berechtigungen

#### `/permissions [channel]`
Überprüft alle Bot-Berechtigungen:
- Server-Berechtigungen
- Channel-Berechtigungen
- Rollen-Hierarchie
- Empfehlungen bei Problemen

### Audit & Logs

#### `/audit [type] [lines]`
Zeigt Audit-Logs an:
- `type`: all, commands, roles, errors, config
- `lines`: Anzahl der Zeilen (5-100)

Beispiel:
```
/audit type:errors lines:50
```

### Wartung

#### `/maintenance info`
Zeigt Wartungsinformationen und Systemstatus.

#### `/maintenance cleanup-logs [days]`
Löscht alte Log-Dateien.
```
/maintenance cleanup-logs days:30
```

#### `/maintenance cache-clear`
Leert den Bot-Cache.

#### `/maintenance config-validate`
Überprüft die Config-Datei auf Fehler.

#### `/maintenance repair-reactions`
Repariert fehlende Reactions auf Selfrole-Nachrichten.

#### `/maintenance db-optimize`
Optimiert die Config-Datenbank.

---

## ⚙️ Konfiguration

### Config-Struktur

Die Konfiguration wird in `config/config.json` gespeichert:

```json
{
  "guildConfigs": {
    "GUILD_ID": {
      "selfroleChannel": "CHANNEL_ID",
      "selfroleMessageId": "MESSAGE_ID",
      "selfroles": [
        {
          "emoji": "📰",
          "roleId": "ROLE_ID",
          "name": "News",
          "description": "Erhalte Neuigkeiten"
        }
      ],
      "rulesChannel": "CHANNEL_ID",
      "automod": {
        "enabled": {
          "spam": true,
          "links": false,
          "caps": true,
          "mentions": true
        },
        "settings": {
          "max_links": 3,
          "max_mentions": 5,
          "caps_percentage": 70,
          "spam_window": 5,
          "spam_messages": 5
        },
        "whitelist": ["CHANNEL_ID"],
        "log_channel": "CHANNEL_ID"
      }
    }
  }
}
```

---

## 🆕 Neue Verbesserungen

### 1. Logger-System (`utils/logger.js`)

Professionelles Logging mit:
- Kategorisierte Log-Dateien (general, commands, roles, errors)
- Automatische Rotation
- Timestamps
- Console + File Output

Verwendung:
```javascript
const logger = require('./utils/logger');

logger.info('Bot gestartet');
logger.success('Command erfolgreich');
logger.warn('Warnung');
logger.error('Fehler', error);
logger.command('roles-editor', user, guild);
logger.roleChange('added', 'News', user, guild);
```

### 2. Auto-Moderation

Automatische Moderation mit:
- **Spam-Filter** - Verhindert Message-Spam
- **Link-Filter** - Limitiert Links pro Nachricht
- **Caps-Lock Filter** - Verhindert übermäßige Großbuchstaben
- **Mention-Spam** - Limitiert Mentions

Features:
- Whitelist für Channels
- Konfigurierbare Schwellwerte
- Automatisches Löschen
- Optional: Log-Channel für Aktionen

### 3. Backup-System

Vollständiges Backup-Management:
- Automatische Sicherung der Konfiguration
- Guild-spezifische Backups
- Download als JSON
- Einfache Wiederherstellung
- Backup-Liste mit Details

### 4. Statistik-System

Detaillierte Statistiken:
- Bot-Uptime und Performance
- Speicherverbrauch
- Selfrole-Nutzung
- Rollen-Verteilung
- Server-Informationen

### 5. Permissions-Checker

Umfassende Berechtigungsprüfung:
- Server-Berechtigungen
- Channel-Berechtigungen
- Rollen-Hierarchie
- Kritische vs. optionale Permissions
- Automatische Empfehlungen

### 6. Audit-Logs

Log-Verwaltung:
- Verschiedene Log-Typen
- Filterbare Anzeige
- Statistiken (Erfolge, Warnungen, Fehler)
- Letzte N Zeilen anzeigen

### 7. Wartungs-Tools

System-Wartung:
- Log-Bereinigung
- Cache-Verwaltung
- Config-Validierung
- Reaction-Reparatur
- Datenbank-Optimierung
- System-Informationen

---

## 🚀 PM2 Management

### PM2 Commands

```bash
# Bot starten
npm run pm2:start

# Bot stoppen
npm run pm2:stop

# Bot neustarten
npm run pm2:restart

# Logs anzeigen
npm run pm2:logs

# Status anzeigen
npm run pm2:status

# Monitor öffnen
npm run pm2:monitor

# Bot löschen
npm run pm2:delete

# Config speichern
npm run pm2:save

# Auto-Start einrichten
npm run pm2:startup
```

### PM2 Manager Script

Fortgeschrittenes Management mit `pm2-manager.js`:

```bash
node pm2-manager.js start
node pm2-manager.js stop
node pm2-manager.js restart
node pm2-manager.js status
node pm2-manager.js logs [lines]
node pm2-manager.js monitor
node pm2-manager.js update
node pm2-manager.js backup
node pm2-manager.js restore <backup-file>
```

---

## 🔧 Troubleshooting

### Bot startet nicht

1. **Token überprüfen**
```bash
# Prüfe .env Datei
cat .env
```

2. **Dependencies neu installieren**
```bash
rm -rf node_modules
npm install
```

3. **Logs prüfen**
```bash
npm run pm2:logs
# oder
cat logs/error-<datum>.log
```

### Selfroles funktionieren nicht

1. **Permissions prüfen**
```
/permissions
```

2. **Rollen-Hierarchie prüfen**
- Bot-Rolle muss über den Selfrole-Rollen sein
- Bot braucht "Rollen verwalten" Permission

3. **Reactions reparieren**
```
/maintenance repair-reactions
```

### Config-Fehler

1. **Config validieren**
```
/maintenance config-validate
```

2. **Backup wiederherstellen**
```
/backup list
/backup restore <backup-name>
```

3. **Config manuell prüfen**
```bash
cat config/config.json | jq
```

### Hoher Speicherverbrauch

1. **Cache leeren**
```
/maintenance cache-clear
```

2. **Logs bereinigen**
```
/maintenance cleanup-logs days:7
```

3. **Datenbank optimieren**
```
/maintenance db-optimize
```

### Auto-Mod zu aggressiv

1. **Schwellwerte anpassen**
```
/automod config max_links 5
/automod config caps_percentage 80
```

2. **Channels zur Whitelist hinzufügen**
```
/automod whitelist channel:#chat
```

3. **Features selektiv deaktivieren**
```
/automod disable caps
```

---

## 📚 Best Practices

### Regelmäßige Wartung

1. **Wöchentlich**
   - `/stats` prüfen
   - `/audit` Log-Fehler prüfen

2. **Monatlich**
   - `/backup create` Backup erstellen
   - `/maintenance cleanup-logs days:30` Alte Logs löschen
   - `/maintenance config-validate` Config prüfen

3. **Bei Bedarf**
   - `/permissions` Bei Permission-Problemen
   - `/maintenance repair-reactions` Bei Reaction-Problemen
   - `/maintenance cache-clear` Bei Performance-Problemen

### Sicherheit

- ✅ Niemals Bot-Token teilen
- ✅ Regelmäßige Backups erstellen
- ✅ Auto-Mod für neue Server aktivieren
- ✅ Permissions regelmäßig prüfen
- ✅ Audit-Logs überwachen

### Performance

- ✅ Logs regelmäßig bereinigen
- ✅ Cache bei Bedarf leeren
- ✅ PM2 für automatische Neustarts nutzen
- ✅ Monitoring aktivieren

---

## 🤝 Support

Bei Problemen oder Fragen:

1. **Logs prüfen** - `/audit` oder `logs/` Ordner
2. **Config validieren** - `/maintenance config-validate`
3. **Permissions prüfen** - `/permissions`
4. **Dokumentation lesen** - Diese README

---

## 📝 Changelog

### v2.0.0 - Manager Edition (Neu)

#### Neue Commands
- ✅ `/stats` - Bot-Statistiken
- ✅ `/automod` - Auto-Moderation System
- ✅ `/backup` - Backup-Verwaltung
- ✅ `/permissions` - Permissions-Checker
- ✅ `/audit` - Audit-Logs
- ✅ `/maintenance` - Wartungs-Tools

#### Neue Features
- ✅ Logger-System mit Kategorien
- ✅ Auto-Moderation (Spam, Links, Caps, Mentions)
- ✅ Backup & Restore System
- ✅ Erweiterte Statistiken
- ✅ Permissions-Überwachung
- ✅ Audit-Log Verwaltung
- ✅ Wartungs-Tools

#### Verbesserungen
- ✅ Besseres Error-Handling
- ✅ Optimierte Performance
- ✅ Erweiterte Konfiguration
- ✅ Professionelles Logging
- ✅ Automatische Maintenance

### v1.0.0 - Initial Release

- ✅ Selfrole-System
- ✅ Regelwerk-System
- ✅ Rollen-Editor
- ✅ PM2 Integration

---

## 📄 Lizenz

MIT License - siehe LICENSE Datei

---

## 👨‍💻 Entwickler

SnowSystem Bot - Manager Edition
