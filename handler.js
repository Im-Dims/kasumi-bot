const simple = require('./lib/simple')
const util = require('util')
const fs = require('fs')
const isNumber = x => typeof x === 'number' && !isNaN(x)

module.exports = {
  async handler(chatUpdate) {
    if (db.data == null) await loadDatabase()
    this.msgqueque = this.msgqueque || []
    if (!chatUpdate) return
    this.pushMessage(chatUpdate.messages).catch(console.error)
    // if (!(chatUpdate.type === 'notify' || chatUpdate.type === 'append')) return
    let m = chatUpdate.messages[chatUpdate.messages.length - 1]
    if (!m) return
    if (m.message?.viewOnceMessageV2) m.message = m.message.viewOnceMessageV2.message
    if (m.message?.documentWithCaptionMessage) m.message = m.message.documentWithCaptionMessage.message
    if (m.message?.viewOnceMessageV2Extension) m.message = m.message.viewOnceMessageV2Extension.message

    try {
      m = simple.smsg(this, m) || m
      if (!m) return
      m.exp = 0
      m.limit = false
      try {
        let user = db.data.users[m.sender]
        if (typeof user !== 'object') db.data.users[m.sender] = {}
        if (user) {
          if (!isNumber(user.exp)) user.exp = 1000
          if (!isNumber(user.limit)) user.limit = 20
          if (!isNumber(user.joinlimit)) user.joinlimit = 1
          if (!isNumber(user.money)) user.money = 1000
          if (!isNumber(user.bank)) user.bank = 1000

          if (!('registered' in user)) user.registered = false
          if (!user.registered) {
            if (!('name' in user)) user.name = m.name
            if (!isNumber(user.age)) user.age = -1
            if (!isNumber(user.regTime)) user.regTime = -1
          }
          
          if (!isNumber(user.afk)) user.afk = -1
          if (!('afkReason' in user)) user.afkReason = ''
          if (!('pasangan' in user)) user.pasangan = ''
          if (!('banned' in user)) user.banned = false
          if (!('premium' in user)) user.premium = false
          if (!('created' in user)) user.created = false
          if (!isNumber(user.premiumDate)) user.premiumDate = 0
          if (!isNumber(user.bannedDate)) user.bannedDate = 0
          if (!isNumber(user.warn)) user.warn = 0
          if (!isNumber(user.level)) user.level = 0
          if (!('role' in user)) user.role = 'Beginner'
          if (!('autolevelup' in user)) user.autolevelup = true
          if (!isNumber(user.hit)) user.hit = 0
          if (!isNumber(user.today)) user.today = 0
          if (!isNumber(user.lastseen)) user.lastseen = 0
          if (!isNumber(user.usebot)) user.usebot = 0

          if (!isNumber(user.judilast)) user.judilast = 0
          if (!isNumber(user.reglast)) user.reglast = 0
          if (!isNumber(user.unreglast)) user.unreglast = 0
          if (!isNumber(user.snlast)) user.snlast = 0
          if (!isNumber(user.spinlast)) user.spinlast = 0

          if (!isNumber(user.lastclaim)) user.lastclaim = 0
          if (!isNumber(user.lastweekly)) user.lastweekly = 0
          if (!isNumber(user.lastmonthly)) user.lastmonthly = 0
          if (!isNumber(user.lasthourly)) user.lasthourly = 0 
          if (!isNumber(user.lastmulung)) user.lastmulung = 0
        } else db.data.users[m.sender] = {
          exp: 100,
          limit: 20,
          joinlimit: 1,
          money: 1000,
          bank: 1000,

          registered: false,
          name: m.name,
          age: -1,
          regTime: -1,
          
          afk: -1,
          afkReason: '',
          pasangan: '',
          banned: false,
          premium: false,
          created: false,
          warn: 0,
          pc: 0,
          expg: 0,
          level: 0,
          role: 'Beginner',
          autolevelup: true,
          hit: 0,
          today: 0,
          lastseen: 0,
          usebot: 0,

          judilast: 0,
          reglast: 0,
          unreglast: 0,
          snlast: 0,
          spinlast: 0,

          lastclaim: 0,
          lastweekly: 0,
          lastmonthly: 0,
          lasthourly: 0,
          lastmulung: 0
        }

        /** chats schema */
        let chat = db.data.chats[m.chat]
        if (typeof chat !== 'object') db.data.chats[m.chat] = {}
        if (chat) {
          if (!('isBanned' in chat)) chat.isBanned = false
          if (!('welcome' in chat)) chat.welcome = true
          if (!('detect' in chat)) chat.detect = false
          if (!('sWelcome' in chat)) chat.sWelcome = ''
          if (!('sBye' in chat)) chat.sBye = ''
          if (!('sPromote' in chat)) chat.sPromote = ''
          if (!('sDemote' in chat)) chat.sDemote = ''
          if (!('delete' in chat)) chat.delete = false
          if (!('antilink' in chat)) chat.antilink = false
          if (!('antisticker' in chat)) chat.antisticker = false
          if (!('autosticker' in chat)) chat.autosticker = false
          if (!('viewonce' in chat)) chat.viewonce = false
          if (!('antitoxic' in chat)) chat.antitoxic = false
          if (!isNumber(chat.expired)) chat.expired = 0
          if (!('member' in chat)) chat.member = {}
          if (!isNumber(chat.chat)) chat.chat = 0
          if (!isNumber(chat.lastchat)) chat.lastchat = 0
          if (!isNumber(chat.lastseen)) chat.lastseen = 0
        } else db.data.chats[m.chat] = {
          isBanned: false,
          welcome: true,
          detect: false,
          sWelcome: '',
          sBye: '',
          sPromote: '',
          sDemote: '',
          delete: false,
          antilink: false,
          antistiker: false,
          autosticker: false,
          viewonce: false,
          antitoxic: false,
          expired: 0,
          member: {},
          chat: 0,
          lastchat: 0,
          lastseen: 0
        }

        /** settings schema */
        let settings = db.data.settings[this.user.jid]
        if (typeof settings !== 'object') db.data.settings[this.user.jid] = {}
        if (settings) {
          if (!'anticall' in settings) settings.anticall = true
          if (!'grouponly' in settings) settings.grouponly = false
          if (!'autoread' in settings) settings.autoread = true
          if (!'backup' in settings) settings.backup = false
          if (!isNumber(settings.backupTime)) settings.backupTime = 0
          if (!'game' in settings) settings.game = false
          if (!'rpg' in settings) settings.rpg = false
          if (!isNumber(settings.style)) settings.style = 2
          if (!'owners' in settings) settings.owners = ['62895385006567', '254775904257']
          if (!('msg' in settings)) settings.msg = 'Oh hi +tag!⁩ 👋\nI am an automated system (WhatsApp Bot) that can help to do something, search and get data / information only through WhatsApp.\n\n> ◎ *Database* : +db\n> ◎ *Library* : Baileys +bail\n> ◎ *Version* : +version\n> ◎ *Rest API* : https://api.ssateam.my.id\n> ◎ *Source* : https://github.com/Im-Dims/kasumi-bot\n\nIf you find an error or want to upgrade premium plan contact the owner.'
          if (!('hidden' in settings)) settings.hidden = []
          if (!'link' in settings) settings.link = 'https://whatsapp.com/channel/0029VaDs0ba1SWtAQnMvZb0U'
          if (!'cover' in settings) settings.cover = 'https://iili.io/2c1aUcQ.jpg'
        } else db.data.settings[this.user.jid] = {
          anticall: true,
          grouponly: false,
          autoread: true,
          backup: false,
          backupTime: 0,
          game: false,
          rpg: false,
          style: 2,
          owners: ['62895385006567', '254775904257'],
          msg: 'Oh hi +tag!⁩ 👋\nI am an automated system (WhatsApp Bot) that can help to do something, search and get data / information only through WhatsApp.\n\n> ◎ *Database* : +db\n> ◎ *Library* : Baileys +bail\n> ◎ *Version* : +version\n> ◎ *Rest API* : https://api.ssateam.my.id\n> ◎ *Source* : https://github.com/Im-Dims/kasumi-bot\n\nIf you find an error or want to upgrade premium plan contact the owner.',
          hidden: [],
          link: 'https://whatsapp.com/channel/0029VaDs0ba1SWtAQnMvZb0U',
          cover: 'https://iili.io/2c1aUcQ.jpg'
        }
      } catch (e) {
        console.error(e)
      }

      const isROwner = [global.owner, this.decodeJid(this.user.jid).split`@` [0], ...global.db.data.settings[this.user.jid].owners].map(v => v + '@s.whatsapp.net').includes(m.sender)
      const isOwner = isROwner || m.fromMe
      const isMods = isOwner
      const isPrems = db.data.users[m.sender].premium || isROwner

      if (opts['queque'] && m.text && !(isMods || isPrems)) {
        let queque = this.msgqueque, time = 1000 * 5
        const previousID = queque[queque.length - 1]
        queque.push(m.id || m.key.id)
        setInterval(async function () {
          if (queque.indexOf(previousID) === -1) clearInterval(this)
          else await delay(time)
        }, time)
      }

      if (m.isBaileys) return
      if (m.chat.endsWith('broadcast') || m.key.remoteJid.endsWith('broadcast')) return
      let blockList = await conn.fetchBlocklist()
      if (blockList?.includes(m.sender)) return
      m.exp += Math.ceil(Math.random() * 10)

      let usedPrefix
      let _user = db.data && db.data.users && db.data.users[m.sender]

      const groupMetadata = (m.isGroup ? (conn.chats[m.chat] || {}).metadata : {}) || {}
      const participants = (m.isGroup ? groupMetadata.participants : []) || []
      const user = (m.isGroup ? participants.find(u => conn.decodeJid(u.id) === m.sender) : {}) || {}
      const bot = (m.isGroup ? participants.find(u => conn.decodeJid(u.id) == this.user.jid) : {}) || {}
      const isRAdmin = user && user.admin == 'superadmin' || false
      const isAdmin = isRAdmin || user && user.admin == 'admin' || false
      const isBotAdmin = bot && bot.admin || false
      const users = global.db.data.users[m.sender],
        chat = global.db.data.chats[m.chat],
        setting = global.db.data.settings[this.user.jid]

      if (opts['nyimak']) return
      if (!m.fromMe && opts['self']) return
      if (opts['pconly'] && m.chat.endsWith('g.us')) return
      if (opts['gconly'] && !m.chat.endsWith('g.us')) return
      if (opts['swonly'] && m.chat !== 'status@broadcast') return
      if (typeof m.text !== 'string') m.text = ''

      if (m.isGroup && !m.fromMe && users && users.afk > -1) {
        this.reply(m.chat, `You are back online after being offline for : ${Func.texted('bold', Func.toTime(new Date - users.afk))}\n\n• ${Func.texted('bold', 'Reason')}: ${users.afkReason ? users.afkReason : '-'}`, m)
        users.afk = -1
        users.afkReason = ''
      }

      if (users) {
        users.lastseen = Date.now()
      }
      if (chat) {
        chat.lastseen = Date.now()
        chat.chat += 1
      }
      if (m.isGroup && !m.fromMe) {
        let now = Date.now()
        if (!chat.member[m.sender]) {
          chat.member[m.sender] = {
            lastseen: now
          }
        } else {
          chat.member[m.sender].lastseen = now
        }
      }

      for (let name in global.plugins) {
      //let plugin = global.plugins[name]
      let plugin
      if (typeof plugins[name].run === 'function') {
        let ai = plugins[name]
        plugin = ai.run;
        for (let prop in ai) {
          if (prop !== 'run') {
            plugin[prop] = ai[prop];
          }
        }
      } else {
        plugin = plugins[name]
      }

      if (!plugin) continue
      if (plugin.disabled) continue
      if (typeof plugin.all === 'function') {
        try {
          await plugin.all.call(this, m, chatUpdate)
        } catch (e) {
          console.error(e)
        }
      }

        /*if (opts['restrict']) if (plugin.tags && plugin.tags.includes('admin')) {
          global.dfail('restrict', m, this)
          continue
        }*/

        const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
        let _prefix = plugin.customPrefix ? plugin.customPrefix : conn.prefix ? conn.prefix : global.prefix
        let match = (_prefix instanceof RegExp ? // RegExp Mode?
          [[_prefix.exec(m.text), _prefix]] :
          Array.isArray(_prefix) ? // Array?
            _prefix.map(p => {
              let re = p instanceof RegExp ? // RegExp in Array?
                p :
                new RegExp(str2Regex(p))
              return [re.exec(m.text), re]
            }) :
            typeof _prefix === 'string' ? // String?
              [[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]] :
              [[[], new RegExp]]
        ).find(p => p[1])
        if (typeof plugin.before === 'function') if (await plugin.before.call(this, m, {
          match, conn: this, participants, groupMetadata, user, bot, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isPrems, users, chat, setting, chatUpdate,
        })) continue

        if (typeof plugin !== 'function') continue
        if ((usedPrefix = (match[0] || '')[0])) {
          let noPrefix = m.text.replace(usedPrefix, '')
          let [command, ...args] = noPrefix.trim().split` `.filter(v => v)
          args = args || []
          let _args = noPrefix.trim().split` `.slice(1)
          let text = _args.join` `
          command = (command || '').toLowerCase()
          let fail = plugin.fail || global.status // When failed
          let isAccept = plugin.command instanceof RegExp ? // RegExp Mode?
            plugin.command.test(command) :
            Array.isArray(plugin.command) ? // Array?
              plugin.command.some(cmd => cmd instanceof RegExp ? // RegExp in Array?
                cmd.test(command) :
                cmd === command
              ) :
              typeof plugin.command === 'string' ? // String?
                plugin.command === command :
                false

          if (!isAccept) continue

          users.hit += 1
          users.usebot = Date.now()
          console.log({ hit: users.hit, prefix: usedPrefix.trim() })

          m.plugin = name
          if (m.chat in db.data.chats || m.sender in db.data.users) {
            let chat = db.data.chats[m.chat]
            let user = db.data.users[m.sender]
            if (name != 'owner-unbanned.js' && chat && chat.isBanned) return // Except this
            if (name != 'owner-unbanned.js' && user && user.banned) return
          }

          if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) { // Both Owner
            m.reply(global.status.owner)
            continue
          }
          if (plugin.rowner && !isROwner) { // Real Owner
            m.reply(global.status.owner)
            continue
          }
          if (plugin.owner && !isOwner) { // Number Owner
            m.reply(global.status.owner)
            continue
          }
          if (plugin.mods && !isMods) { // Moderator
            m.reply(global.status.mods)
            continue
          }
          if (plugin.premium && !isPrems) { // Premium
            m.reply(global.status.premium)
            continue
          }
          if (plugin.group && !m.isGroup) { // Group Only
            m.reply(global.status.group)
            continue
          } else if (plugin.botAdmin && !isBotAdmin) { // You Admin
            m.reply(global.status.botAdmin)
            continue
          } else if (plugin.admin && !isAdmin) { // User Admin
            m.reply(global.status.admin)
            continue
          }
          if (plugin.private && m.isGroup) { // Private Chat Only
            m.reply(global.status.private)
            continue
          }
          if (plugin.register == true && _user.registered == false) { // Butuh daftar?
            m.reply(global.status.register)
            continue
          }
          if (plugin.game && db.data.settings[this.user.jid].game == false) { // game mode
            m.reply(status.game)
            continue
          }
          if (plugin.rpg && db.data.settings[this.user.jid].rpg == false) { // RPG mode
            m.reply(status.rpg)
            continue
          }

          m.isCommand = true
          let xp = 'exp' in plugin ? parseInt(plugin.exp) : 17 // XP Earning per command
          if (xp > 200) m.reply('Ngecit -_-') // Hehehe
          else m.exp += xp
          if (!isPrems && plugin.limit && db.data.users[m.sender].limit < plugin.limit * 1) {
            this.reply(m.chat, `Limit kamu habis, silahkan beli melalui *${usedPrefix}buy*`, m)
            continue // Limit habis
          }
          if (plugin.level > _user.level) {
            this.reply(m.chat, `Diperlukan level ${plugin.level} untuk menggunakan perintah ini. Level kamu ${_user.level}`, m)
            continue // If the level has not been reached
          }
          let extra = {
            match, usedPrefix, noPrefix, _args, args, command, text, conn: this, participants, groupMetadata, user, bot, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isPrems, users, chat, setting, chatUpdate,
          }
          try {
            await plugin.call(this, m, extra)
            if (!isPrems) m.limit = m.limit || plugin.limit || false
          } catch (e) {
            // Error occured
            m.error = e
            console.error(e)
            if (e) {
              let text = util.format(e)
              for (let key of Object.values(global.APIKeys))
              text = text.replace(new RegExp(key, 'g'), '#HIDDEN#')
              conn.reply(global.owner[0] + '@s.whatsapp.net', `*Plugin:* ${m.plugin}\n*Sender:* ${m.sender}\n*Chat:* ${m.chat}\n*Command:* ${usedPrefix}${command} ${args.join(' ')}\n\n\`\`\`${text}\`\`\``.trim(), m)
              //m.reply(text)
            }
          } finally {
            // m.reply(util.format(_user))
            if (typeof plugin.after === 'function') {
              try {
                await plugin.after.call(this, m, extra)
              } catch (e) {
                console.error(e)
              }
            }
            // if (m.limit) m.reply(+ m.limit + ' Limit used')
          }
          break
        }
      }
    } catch (e) {
      if (/(undefined|overlimit|timed|timeout|users|item|time)/ig.test(e.message)) return
      console.error(e)
      if (!m.fromMe) return m.reply(Func.jsonFormat('kasumi-bot encountered an error : ' + e))
    } finally {
      if (opts['queque'] && m.text) {
        const quequeIndex = this.msgqueque.indexOf(m.id || m.key.id)
        if (quequeIndex !== -1) this.msgqueque.splice(quequeIndex, 1)
      }
      //console.log(db.data.users[m.sender])
      let user, stats = db.data.stats
      if (m) {
        if (m.sender && (user = db.data.users[m.sender])) {
          user.exp += m.exp
          user.limit -= m.limit * 1
        }

        let stat
        if (m.plugin) {
          let now = + new Date
          if (m.plugin in stats) {
            stat = stats[m.plugin]
            if (!isNumber(stat.total)) stat.total = 1
            if (!isNumber(stat.success)) stat.success = m.error != null ? 0 : 1
            if (!isNumber(stat.last)) stat.last = now
            if (!isNumber(stat.lastSuccess)) stat.lastSuccess = m.error != null ? 0 : now
          } else stat = stats[m.plugin] = {
            total: 1,
            success: m.error != null ? 0 : 1,
            last: now,
            lastSuccess: m.error != null ? 0 : now
          }
          stat.total += 1
          stat.last = now
          if (m.error == null) {
            stat.success += 1
            stat.lastSuccess = now
          }
        }
      }

      try {
        require('./lib/print')(m, this)
      } catch (e) {
        console.log(m, m.quoted, e)
      }
      if (db.data.settings[this.user.jid].autoread) await this.readMessages([m.key])
    }
  },
  async participantsUpdate({ id, participants, action }) {
    if (opts['self']) return
    // if (id in conn.chats) return // First login will spam
    if (global.isInit) return
    let chat = db.data.chats[id] || {}
    let text = ''
    switch (action) {
      case 'add':
      case 'remove':
      case 'leave':
      case 'invite':
      case 'invite_v4':
        if (chat.welcome) {
          let groupMetadata = await this.groupMetadata(id) || (conn.chats[id] || {}).metadata
          for (let user of participants) {
            let pp = './src/image/pp.png'
            try {
              pp = await this.profilePictureUrl(user, 'image')
            } catch (e) {
            } finally {
              text = (action === 'add' ? (chat.sWelcome || this.welcome || conn.welcome || 'Welcome, @user!').replace('@subject', await this.getName(id)).replace('@desc', groupMetadata.desc.toString()) :
                (chat.sBye || this.bye || conn.bye || 'Bye, @user!')).replace('@user', '@' + user.split('@')[0])
              this.reply(id, text, null, {
                useModify: true,
                largeThumb: false,
                thumbnail: pp,
                url: db.data.settings[this.user.jid].link
              })
            }
          }
        }
        break
      case 'promote':
        text = (chat.sPromote || this.spromote || conn.spromote || '@user ```is now Admin```')
      case 'demote':
        if (!text)
          text = (chat.sDemote || this.sdemote || conn.sdemote || '@user ```is no longer Admin```')
        text = text.replace('@user', '@' + participants[0].split('@')[0])
        if (chat.detect)
          this.sendMessage(id, { text, mentions: this.parseMention(text) })
        break
    }
  },
  async delete(message) {
    try {
      const { fromMe, id, participant } = message
      if (fromMe) return
      let chats = Object.entries(conn.chats).find(([_, data]) => data.messages?.[id])
      if (!chats) return
      let msg = chats instanceof String ? JSON.parse(chats[1].messages[id]) : chats[1].messages[id]
      let chat = db.data.chats[msg.key.remoteJid] || {}
      if (chat.delete) return
      /*await this.reply(msg.key.remoteJid, `Terdeteksi @${participant.split`@`[0]} telah menghapus pesan\n\nUntuk mematikan fitur ini, ketik *.off antidelete*`.trim(), msg, {
        mentions: [participant]
      })
      this.copyNForward(msg.key.remoteJid, msg).catch(e => console.log(e, msg))*/
    } catch (e) {
      console.error(e)
    }
  }
},
conn.ws.on('CB:call', async function callUpdatePushToDb(json) {
  let call = json.tag
  let callerId = json.attrs.from
  console.log({ call, callerId })
  let users = db.data.users
  let user = users[callerId] || {}
  if (!db.data.settings[conn.user.jid].anticall) return
  await conn.reply(global.owner[0] + '@s.whatsapp.net', `*NOTIF CALLER BOT!*\n\n@${callerId.split`@`[0]} telah menelpon *${conn.user.name}*\n\n ${callerId.split`@`[0]}\n`, null, { mentions: [callerId] })
  conn.delay(10000) // supaya tidak spam
})

/** reload file **/
if (global.reloadHandler) Func.reload(require.resolve(__filename))
Func.color("Update ~ 'handler.js'")
