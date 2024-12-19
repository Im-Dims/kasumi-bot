const fs = require('fs')

/** enter owner number **/
global.owner = ['6281398274790']
global.owner_name = 'Dimas Triyatno'

/** function and scraper to make it more practical **/
global.Func = new (require('./lib/functions'))
global.scrap = new (require('./lib/scrape'))

/** rest's api **/
global.APIs = {
  ssa: 'https://api.ssateam.my.id',
  nea: 'https://api.neastooid.xyz',
  alya: 'https://api.alyachan.dev'
}
global.APIKeys = {
  'https://api.ssateam.my.id': 'root',
  'https://api.alyachan.pro': 'yourkey'
}

/** option setting **/
global.set = {
  wm: `© kasumi-bot v${require('./package.json').version}`,
  footer: Func.Styles('lightwight wabot made by im-dims'),
  packname: 'Sticker By',
  author: '© kasumi shirogane'
}

/** option sosial media **/
global.media = {
  sig: 'https://instagram.com/dims_t11',
  syt: 'https://www.youtube.com/@Dims_senpai',
  sfb: 'https://www.facebook.com/DimsTyn',
  sgh: 'https://github.com/Im-Dims',
  sch: 'https://whatsapp.com/channel/0029VaDs0ba1SWtAQnMvZb0U',
  sr: 'https://replit.com/@DimasTriyatno',
  swa: 'https://wa.me/6281398274790'
}

/** fill in if necessary **/
global.key = {
  github_token: 'GITHUB_TOKEN', // please fill in https://github.com/settings/tokens/
  github_owner: 'NAME_GITHUB', // your github name 
  github_repo: 'GITHUB_REPO', // your repo name 
  github_branch: 'main', // don't change it!
  groq: ''
}

/** dabase url **/
global.databaseurl = ''

/** enter your bot number to login using the code **/
global.pairingNumber = 6281398274790

/** enter your replit link, so it's active 24/7 **/
global.replit_url = ''

/** the bigger it gets the harder it is to level up **/
global.multiplier = 1000

/** maximum limit to send files **/
global.max_upload = 70

/** max upload free **/
global.max_upload_free = 10

/** maximum 2GB ram, do the math yourself **/
global.ram_usage = 2100000000

/** status message **/
global.status = {
  wait: 'Processing. . .',
  invalid: 'Invalid URL!',
  wrong: 'Wrong format!',
  error: 'Error occurred!',
  premium: 'This feature is only for premium users.',
  admin: 'This command is specific to Admins.',
  botAdmin: 'Make the bot admin to use this command.',
  owner: 'This command is for Owner only.',
  mod: 'This command is for Moderators only.',
  group: 'This command is Group specific.',
  private: 'This command is private chat only.',
  register: 'Please register first to use this command.',
  game: 'The game feature has not been activated.',
  rpg: 'The RPG feature has not been activated.',
  restrict: 'This feature is disabled'
}

/** rpg emoticon **/
global.rpg = {
  emoticon(string) {
    string = string.toLowerCase()
    let emot = {
      exp: '✉️',
      money: '💵',
      potion: '🥤',
      diamond: '💎',
      common: '📦',
      uncommon: '🎁',
      mythic: '🗳️',
      legendary: '🗃️',
      pet: '🎁',
      trash: '🗑',
      armor: '🥼',
      sword: '⚔️',
      wood: '🪵',
      rock: '🪨',
      string: '🕸️',
      horse: '🐎',
      cat: '🐈',
      dog: '🐕',
      fox: '🦊',
      petFood: '🍖',
      iron: '⛓️',
      gold: '👑',
      emerald: '💚',
    }
    let results = Object.keys(emot).map((v) => [v, new RegExp(v, 'gi')]).filter((v) => v[1].test(string))
    if (!results.length) return ''
    else return emot[results[0][0]]
  },
}

/** reload file **/
Func.reload(require.resolve(__filename))
Func.color("Update ~ 'config.js'")
