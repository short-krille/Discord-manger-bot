#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class PM2Manager {
    constructor() {
        this.ecosystemFile = 'ecosystem.config.js';
        this.logDir = 'logs';
        this.setupLogDirectory();
    }

    setupLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
            console.log(`✅ Log directory created: ${this.logDir}`);
        }
    }

    executeCommand(command, args = []) {
        return new Promise((resolve, reject) => {
            const cmd = spawn(command, args, { stdio: 'inherit', shell: true });
            
            cmd.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Command failed with code ${code}`));
                }
            });
            
            cmd.on('error', (error) => {
                reject(error);
            });
        });
    }

    async installPM2() {
        console.log('📦 Installing PM2...');
        await this.executeCommand('npm', ['install', '-g', 'pm2']);
        console.log('✅ PM2 installed globally');
    }

    async startBot() {
        console.log('🚀 Starting Discord Bot with PM2...');
        
        if (!fs.existsSync(this.ecosystemFile)) {
            console.error('❌ Ecosystem file not found');
            return;
        }
        
        await this.executeCommand('pm2', ['start', this.ecosystemFile]);
        await this.executeCommand('pm2', ['save']);
        console.log('✅ Bot started with PM2');
    }

    async stopBot() {
        console.log('🛑 Stopping Discord Bot...');
        await this.executeCommand('pm2', ['stop', 'discord-bot']);
        console.log('✅ Bot stopped');
    }

    async restartBot() {
        console.log('🔄 Restarting Discord Bot...');
        await this.executeCommand('pm2', ['restart', 'discord-bot']);
        console.log('✅ Bot restarted');
    }

    async showStatus() {
        console.log('📊 Bot Status:');
        await this.executeCommand('pm2', ['status', 'discord-bot']);
    }

    async showLogs(lines = 100) {
        console.log(`📋 Showing last ${lines} lines of logs:`);
        await this.executeCommand('pm2', ['logs', 'discord-bot', '--lines', lines.toString()]);
    }

    async monitor() {
        console.log('📡 Starting PM2 Monitor...');
        await this.executeCommand('pm2', ['monit']);
    }

    async setupAutoStart() {
        console.log('⚙️ Setting up auto-start...');
        try {
            const result = await new Promise((resolve, reject) => {
                exec('pm2 startup', (error, stdout, stderr) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(stdout);
                    }
                });
            });
            
            console.log('✅ Auto-start configured');
            console.log(result);
        } catch (error) {
            console.error('⚠️ Auto-start might need manual configuration');
            console.log('Please run: sudo env PATH=$PATH:/usr/bin pm2 startup systemd');
        }
    }

    async updateBot() {
        console.log('🔄 Updating Bot from Git...');
        await this.executeCommand('git', ['pull']);
        await this.executeCommand('npm', ['install']);
        await this.restartBot();
        console.log('✅ Bot updated and restarted');
    }

    async backupConfig() {
        const backupDir = 'backups';
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(backupDir, `config-backup-${timestamp}.json`);
        
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        const config = require('../config/config.json');
        fs.writeFileSync(backupFile, JSON.stringify(config, null, 2));
        console.log(`✅ Config backed up to: ${backupFile}`);
    }

    async restoreConfig(backupFile) {
        if (!fs.existsSync(backupFile)) {
            console.error('❌ Backup file not found');
            return;
        }
        
        const backupData = fs.readFileSync(backupFile, 'utf8');
        fs.writeFileSync('../config/config.json', backupData);
        console.log('✅ Config restored from backup');
        await this.restartBot();
    }
}

// CLI Interface
async function main() {
    const manager = new PM2Manager();
    const command = process.argv[2];
    
    switch (command) {
        case 'start':
            await manager.startBot();
            break;
        case 'stop':
            await manager.stopBot();
            break;
        case 'restart':
            await manager.restartBot();
            break;
        case 'status':
            await manager.showStatus();
            break;
        case 'logs':
            const lines = process.argv[3] || 100;
            await manager.showLogs(parseInt(lines));
            break;
        case 'monitor':
            await manager.monitor();
            break;
        case 'install':
            await manager.installPM2();
            break;
        case 'autostart':
            await manager.setupAutoStart();
            break;
        case 'update':
            await manager.updateBot();
            break;
        case 'backup':
            await manager.backupConfig();
            break;
        case 'restore':
            const backupFile = process.argv[3];
            if (!backupFile) {
                console.error('❌ Please specify backup file: npm run pm2:restore <backup-file>');
                break;
            }
            await manager.restoreConfig(backupFile);
            break;
        default:
            console.log(`
🤖 Discord Bot PM2 Manager

Usage: npm run pm2:<command>

Commands:
  start      - Start bot with PM2
  stop       - Stop bot
  restart    - Restart bot
  status     - Show bot status
  logs       - Show logs (optional: number of lines)
  monitor    - Open PM2 monitor
  install    - Install PM2 globally
  autostart  - Configure auto-start
  update     - Update bot from Git and restart
  backup     - Backup configuration
  restore    - Restore configuration from backup

Examples:
  npm run pm2:start
  npm run pm2:logs 50
  npm run pm2:update
            `);
            break;
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = PM2Manager;