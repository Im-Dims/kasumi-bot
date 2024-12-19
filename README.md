### KASUMI-BOT
> This script is 100% free, which uses the api from [AlyaChan-APIs](https://api.alyachan.pro) and [SsaTeam-APIs](https://api.ssateam.my.id)

### What is needed
- [x] Server
- [x] WhatsApp
- [x] Apikey

### Set in config.js
```Javascript
global.owner = ['6281398274790']
global.owner_name = 'Dimas Triyatno'

global.APIs = {
  ssa: 'https://api.ssateam.my.id',
  alya: 'https://api.alyachan.dev'
}

global.APIKeys = {
  'https://api.ssateam.my.id': 'yourkey',
  'https://api.alyachan.pro': 'yourkey'
}

global.set = {
  wm: `© kasumi-bot v${require('./package.json').version}`,
  footer: Func.Styles('lightwight wabot made by im-dims'),
  packname: 'Sticker By',
  author: '© kasumi shirogane'
}

global.media = {
  sig: 'https://instagram.com/dims_t11',
  syt: 'https://www.youtube.com/@Dims_senpai',
  sfb: 'https://www.facebook.com/DimsTyn',
  sgh: 'https://github.com/Im-Dims',
  sch: 'https://whatsapp.com/channel/0029VaDs0ba1SWtAQnMvZb0U',
  sr: 'https://replit.com/@DimasTriyatno',
  swa: 'https://wa.me/6281398274790'
}

global.databaseurl = ''
global.pairingNumber = 6281398274790

global.multiplier = 7 
global.max_upload = 70
global.intervalmsg = 1800
```

### Plugins event 
```Javascript
let handler = async(m, { conn, usedPrefix, command, text }) => {
  try {
    // masukan kode mu di sini...
  } catch {
    console.log(e)
    return conn.reply(m.chat, Func.jsonFormat(e), m)
  }
}
handler.help = ['command'] // anunya
handler.tags = ['category'] // category
handler.command = /^(command)$/i // command
handler.group = Boolean // for group
handler.limit = Boolean // use limit
handler.game = Boolean // game mode
handler.rpg = Boolean // rpg mode
handler.owner = Boolean // for owner
handler.admin = Boolean // for admin
handler.botAdmin = Boolean // bot harus jadi admin
handler.premium = Boolean // bot must be an admin
handler.private = Boolean // private chat only
```

### Plugins event 2
```Javascript
module.exports = {
  run: async (m, { conn, usedPrefix, command, text }) => {
    try {
    // masukan kode mu di sini...
    } catch {
      console.log(e)
      return conn.reply(m.chat, Func.jsonFormat(e), m)
    }
  },
  help: ['command'],
  tags: ['category'],
  command: /^(command)$/i,
  limit: Boolean
}
```

### Plugins event 3
```Javascript
module.exports = Object.assign(async function handler(m, { conn, usedPrefix, command, text }) {
  try {
    // masukan kode mu di sini...
  } catch {
    console.log(e)
    return conn.reply(m.chat, Func.jsonFormat(e), m)
  }
}, {
  help: ['command'],
  tags: ['category'],
  command: ['command'],
  limit: Boolean
})
```

### Install and run
```
$ npm install
$ npm start
```

## Install & Run use PM2

```
$ npm install pm2 -g
$ npm install
$ pm2 start index.js && pm2 save && pm2 logs
```

### Argument node . [--options]

+ ```node . --pairing``` : For those of you who login using a code, use this command in the terminal

### Thanks To
> [Nurutomo](https://github.com/Nurutomo)
> [Neoxr](https://github.com/neoxr)
> [Alya](https://github.com/alya-tok)
> [Im-Dims](https://github.com/Im-Dims)
