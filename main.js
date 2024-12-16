(async () => {
  require("./config")
  const {
    useMultiFileAuthState,
    DisconnectReason,
    makeInMemoryStore,
    jidNormalizedUser,
    makeCacheableSignalKeyStore,
    /*PHONENUMBER_MCC,*/
    fetchLatestBaileysVersion,
    proto,
    Browsers,
    MessageRetryMap
  } = require("@whiskeysockets/baileys")
  const readline = require("readline")
  const chalk = require("chalk")
  const CloudDBAdapter = require("./lib/cloudDBAdapter")
  const MongoDB = require("./lib/mongoDB")
  const NodeCache = require("node-cache")
  const ws = require('ws')
  const path = require("path")
  const fs = require('fs')
  const yargs = require("yargs/yargs")
  const child = require("child_process")
  const lodash = require("lodash")
  const syntax = require("syntax-error")
  const pinoh = require("pino")
  const os = require('os')
  const simple = require("./lib/simple")
  
  var low
  try {
    low = require("lowdb")
  } catch (err) {
    low = require("./lib/lowdb")
  }
  const {
    Low,
    JSONFile
  } = low 
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  const question = (text) => new Promise((resolve) => rl.question((text), (resolve)))
  const msgRetryCounterCache = new NodeCache()
    
  global.API = (name, path = '/', query = {}, apikeyqueryname) => (name in global.APIs ? global.APIs[name] : name) + path + (query || apikeyqueryname ? '?' + new URLSearchParams(Object.entries({ ...query, ...(apikeyqueryname ? { [apikeyqueryname] : global.APIKeys[name in global.APIs ? global.APIs[name] : name] } : {}) })) : '') 
  global.timestamp = {
    start: new Date()
  }
  global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
  global.prefix = new RegExp('^[' + (opts.prefix || "!+/#.") + ']')
  global.store = makeInMemoryStore({
    logger: pinoh({
      level: "fatal"
    }).child({
      level: "fatal",
      stream: "store"
    })
  })
  
  // disimpan ke store.json setiap 10 detik
  store?.readFromFile('./store.json')
  setInterval(() => {
    store?.writeToFile('./store.json')
  }, 10_000)
  
  global.db = new Low(/https?:\/\//.test(global.databaseurl || '') ? CloudDBAdapter(global.databaseurl) : /mongodb/.test(global.databaseurl) ? new MongoDB(global.databaseurl) : new JSONFile((opts._[0] ? opts._[0] + '_' : '') + "database.json"))
  global.DATABASE = global.db
  global.loadDatabase = async function loadDatabase() {
    if (global.db.READ) {
      return new Promise((resolve) => setInterval(function () {
        if (!global.db.READ) {
          clearInterval(this)
          (resolve)(global.db.data == null ? global.loadDatabase() : global.db.data)
        } else {
          null
        }
      }, 1000))
    }
    if (global.db.data !== null) {
      return
    }
    global.db.READ = true
    await global.db.read()
    global.db.READ = false
    global.db.data = {
      users: {},
      chats: {},
      settings: {},
      stats: {},
      msgs: {},
      menfess: {},
      sticker: {},
      chara: '',
      ...(global.db.data || {})
    }
    global.db.chain = lodash.chain(global.db.data)
  }
  loadDatabase()
  
  const sessiPath = '' + (opts._[0] || "session")
  global.isInit = !fs.existsSync(sessiPath)
  const {
    state,
    saveState,
    saveCreds
  } = await useMultiFileAuthState(sessiPath)
  const { 
    version, 
    isLatest 
  } = await fetchLatestBaileysVersion()
  console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`)
  const connectionOptions = {
    version: /*version*/ [2, 3000, 1015901307],
    logger: pinoh({
      level: "silent"
    }),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pinoh({
        level: "silent"
      }))
    },
    browser: ["Ubuntu", "Firefox", "20.0.04"],
    printQRInTerminal: /*!opts.pairing*/ true,
    defaultQueryTimeoutMs: undefined,
    //isLatest: true, // set the correct value for isLatest 
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
    getMessage: async (key) => {
      let jid = jidNormalizedUser(key.remoteJid)
      let msg = await store.loadMessage(jid, key.id)
      return msg?.["message"] || ''
    },
    msgRetryCounterCache,
    syncFullHistory: true
  }
  
  global.conn = simple.makeWASocket(connectionOptions)
  store.bind(conn.ev, { 
    groupMetadata: conn.groupMetadata 
  })
  
  /*if (opts.pairing && !conn.authState.creds.registered) {
    let PhoneNumber
    if (!!global.pairingNumber) {
      PhoneNumber = global.pairingNumber.toString().replace(/[^0-9]/g, '')
      if (!Object.keys(PHONENUMBER_MCC).some(v => PhoneNumber.startsWith(v))) {
        console.log(chalk.bgBlack(chalk.redBright("Start with your country's WhatsApp code, Example : 62xxx")))
        process.exit(0)
      }
    } else {
      PhoneNumber = await question(chalk.bgBlack(chalk.greenBright("Please type your WhatsApp number : ")))
      PhoneNumber = PhoneNumber.replace(/[^0-9]/g, '')
      if (!Object.keys(PHONENUMBER_MCC).some(v => PhoneNumber.startsWith(v))) {
        console.log(chalk.bgBlack(chalk.redBright("Start with your country's WhatsApp code, Example : 62xxx")))
        PhoneNumber = await question(chalk.bgBlack(chalk.greenBright("Please type your WhatsApp number : ")))
        PhoneNumber = PhoneNumber.replace(/[^0-9]/g, '')
        rl.close()
      }
    }
    setTimeout(async () => {
      let code = await conn.requestPairingCode(PhoneNumber)
      code = code?.["match"](/.{1,4}/g)?.["join"]('-') || code
      console.log(chalk.black(chalk.bgGreen("Your Pairing Code : ")), chalk.black(chalk.white(code)))
    }, 3000)
  }*/
  
  if (!opts.test) {
    if (global.db) {
      setInterval(async () => {
        if (global.db.data) {
          await global.db.write()
        }
        if (!opts.tmp && (global.support || {}).find) {
          tmp = [os.tmpdir(), "tmp"]
          tmp.forEach(v => child.spawn("find", [v, "-amin", '3', "-type", 'f', "-delete"]))
        }
      }, 30000)
    }
  }
  
  var ramReset = setInterval(() => {
    var data = process.memoryUsage().rss
    if (data >= global.ram_usage) {
      clearInterval(ramReset)
      process.send("reset")
    }
  }, 60000)
  
  if (!fs.existsSync("./tmp")) {
    fs.mkdirSync("./tmp")
  }
  
  setInterval(() => {
    try {
      const folder = fs.readdirSync("./tmp")
      if (folder.length > 0) {
        folder.filter(v => !v.endsWith(".file")).map(v => fs.unlinkSync("./tmp/" + v))
      }
    } catch {}
  }, 600000)
  
  async function connectionUpdate(update) {
    const { 
      connection, 
      lastDisconnect
    } = update
    const last = lastDisconnect?.["error"]?.["output"]?.["statusCode"] !== DisconnectReason.loggedOut
    if (connection === "close") {
      if (last) {
        try {
          console.log("Connection closed, Reconnecting. . .")
          await global.reloadHandler(true)
          global.timestamp.connect = new Date()
        } catch (error) {
          console.log("-- ERROR LOG --")
          console.log(error)
        }
      } else {
        console.log(chalk.red("Device loggedOut"))
        process.exit(0)
      }
    } else {
      if (connection == "open") {
        console.log("Opened connection ✅")
      }
    }
    if (db.data == null) {
      loadDatabase()
    }
  }
  
  process.on("uncaughtException", console.error)
  const loadModule = (modulePath) => {
    modulePath = require.resolve(modulePath)
    let moduleData
    let retries = 0
    do {
      if (modulePath in require.cache) {
        delete require.cache[modulePath]
      }
      moduleData = require(modulePath)
      retries++
    } while ((!moduleData || Array.isArray(moduleData) || moduleData instanceof String ? !(moduleData || []).length : typeof moduleData == "object" && !Buffer.isBuffer(moduleData) ? !Object.keys(moduleData || {}).length : true) && retries <= 10)
    return moduleData
  }
  
  let isInit = true
  global.reloadHandler = function (restatConn) {
    let handler = loadModule("./handler")
    if (restatConn) {
      try {
        global.conn.ws.close()
      } catch {}
      global.conn = {
        ...global.conn,
        ...simple.makeWASocket(connectionOptions)
      }
    }
    if (!isInit) {
      conn.ev.off("messages.upsert", conn.handler)
      conn.ev.off("group-participants.update", conn.participantsUpdate)
      conn.ev.off("message.delete", conn.onDelete)
      conn.ev.off("connection.update", conn.connectionUpdate)
      conn.ev.off("creds.update", conn.credsUpdate)
    }
    conn.welcome = "Thanks @user for joining into @subject group."
    conn.bye = "Good bye @user :)"
    conn.spromote = "@user is now admin!"
    conn.sdemote = "@user is now not admin!"
    conn.handler = handler.handler.bind(conn)
    conn.participantsUpdate = handler.participantsUpdate.bind(conn)
    conn.onDelete = handler["delete"].bind(conn)
    conn.connectionUpdate = connectionUpdate.bind(conn)
    conn.credsUpdate = saveCreds.bind(conn)
    conn.ev.on("messages.upsert", conn.handler)
    conn.ev.on("group-participants.update", conn.participantsUpdate)
    conn.ev.on("message.delete", conn.onDelete)
    conn.ev.on("connection.update", conn.connectionUpdate)
    conn.ev.on("creds.update", conn.credsUpdate)
    isInit = false
    return true
  }
  
  conn.ev.on('messages.upsert', async chatUpdate => {
    anakkecil = chatUpdate.messages[0]
    if (anakkecil.key && anakkecil.key.remoteJid === 'status@broadcast') {
      let emot = await Func.random(['🤧', '😭', '😂', '😹', '😍', '😋', '🙏', '😜', '😢', '😠'])
      await conn.readMessages([anakkecil.key]) 
      conn.sendMessage('status@broadcast', { react: { text: emot, key: anakkecil.key }}, { statusJidList: [anakkecil.key.participant] })
    }
  })
  
  let pluginFolder = path.join(__dirname, "plugins")
  let pluginFilter = filename => /\.js$/.test(filename)
  global.plugins = {}
  for (let filename of fs.readdirSync(pluginFolder).filter(pluginFilter)) {
    try {
      global.plugins[filename] = require(path.join(pluginFolder, filename))
    } catch (err) {
      conn.logger.error(err)
      delete global.plugins[filename]
    }
  }
  console.log(Object.keys(global.plugins))
  global.reload = (_ev, filename) => {
    if (/\.js$/.test(filename)) {
      let dir = path.join(pluginFolder, filename)
      if (dir in require.cache) {
        delete require.cache[dir]
        if (fs.existsSync(dir)) {
          conn.logger.info("re - require plugin '" + filename + "'")
        } else {
          conn.logger.warn("deleted plugin '" + filename + "'")
          return delete global.plugins[filename]
        }
      } else {
        conn.logger.info("requiring new plugin '" + filename + "'")
      }
      let err = syntax(fs.readFileSync(dir), filename)
      if (err) {
        conn.logger.error("syntax error while loading '" + filename + "'\n" + err)
      } else {
        try {
          global.plugins[filename] = require(dir)
        } catch (err) {
          conn.logger.error(err)
        } finally {
          global.plugins = Object.fromEntries(Object.entries(global.plugins).sort(([_0x249745], [_0x532567]) => _0x249745.localeCompare(_0x532567)))
        }
      }
    }
  }
  Object.freeze(global.reload)
  fs.watch(path.join(__dirname, "plugins"), global.reload)
  global.reloadHandler()
  
  async function _QuickTest() {
    let test = await Promise.all([child.spawn("ffmpeg"), child.spawn("ffprobe"), child.spawn("ffmpeg", ["-hide_banner", "-loglevel", "error", "-filter_complex", "color", "-frames:v", '1', '-f', "webp", '-']), child.spawn("convert"), child.spawn("magick"), child.spawn('gm'), child.spawn("find", ["--version"])].map(p => {
      return Promise.race([new Promise(resolve => {
        p.on("close", code => {
          resolve(code !== 127)
        })
      }), new Promise(resolve => {
        p.on("error", _ => resolve(false))
      })])
    }))
    let [ffmpeg, ffprobe, ffmpegWebp, convert, magick, gm, find] = test
    console.log(test)
    let s = global.support = {
      ffmpeg,
      ffprobe,
      ffmpegWebp,
      convert,
      magick,
      gm,
      find
    }
    Object.freeze(global.support)
    if (!s.ffmpeg) {
      conn.logger.warn("Please install ffmpeg for sending videos (pkg install ffmpeg)")
    }
    if (s.ffmpeg && !s.ffmpegWebp) {
      conn.logger.warn("Stickers may not animated without libwebp on ffmpeg (--enable-ibwebp while compiling ffmpeg)")
    }
    if (!s.convert && !s.magick && !s.gm) {
      conn.logger.warn("Stickers may not work without imagemagick if libwebp on ffmpeg doesnt isntalled (pkg install imagemagick)")
    }
  }
  _QuickTest().then(() => conn.logger.info("Quick Test Done"))["catch"](console.error)
})()
