const axios = require('axios')
const fetch = require('node-fetch')
const fs = require('fs')
const mime = require('mime-types')
const chalk = require('chalk')
const path = require('path')
const { tmpdir } = require('os')
const {
  fromBuffer
} = require('file-type')
const {
  green,
  blueBright,
  redBright
} = require('chalk')
const moment = require('moment-timezone')
moment.tz.setDefault('Asia/Jakarta')
const NodeID3 = require('node-id3')
const {
  read,
  MIME_JPEG,
  RESIZE_BILINEAR,
  AUTO
} = require('jimp')
const stream = require('stream')
const { generateThumbnail } = require('@whiskeysockets/baileys')

module.exports = class Function {
  delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

  createThumb = async (filePath, width = 200) => {
    const { file } = await this.getFile(filePath)
    let image = await read(await this.fetchBuffer(file))
    let thumbnail = await image.quality(100).resize(width, AUTO, RESIZE_BILINEAR).getBufferAsync(MIME_JPEG)
    return thumbnail
  }

  isUrl = (url) => {
    return url.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%.+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%+.~#?&/=]*)/, 'gi'))
  }

  fetchJson = async (url, options = {}) => {
    try {
      const response = await axios.get(url, { ...options })
      return response.data
    } catch (error) {
      return { 'status': false, 'msg': error.message }
    }
  }

  fetchBuffer = async (source, options = {}) => {
    try {
      if (this.isUrl(source)) {
        const response = await axios.get(source, { responseType: "arraybuffer", ...options })
        return response.data
      } else {
        const fileData = fs.readFileSync(source)
        return fileData
      }
    } catch (error) {
      return { 'status': false, 'msg': error.message }
    }
  }

  fetchAsBuffer = (url) => new Promise(async resolve => {
    try {
      const buffer = await (await fetch(url)).buffer()
      resolve(buffer)
    } catch (error) {
      resolve(null)
    }
  })

  fetchAsJSON = (url) => new Promise(async resolve => {
    try {
      const json = await (await fetch(url)).json()
      resolve(json)
    } catch (error) {
      resolve(null)
    }
  })

  fetchAsText = (url) => new Promise(async resolve => {
    try {
      const text = await (await fetch(url)).text()
      resolve(text)
    } catch (error) {
      resolve(null)
    }
  })

  fetchAsBlob = (url) => new Promise(async resolve => {
    try {
      const blob = await (await fetch(url)).blob()
      resolve(blob)
    } catch (error) {
      resolve(null)
    }
  })

  parseCookie = async (url, headers = {}) => {
    try {
      const response = await axios.get(url, { responseType: "arraybuffer", headers })
      return response.headers["set-cookie"]
    } catch (error) {
      return { 'status': false, 'msg': error.message }
    }
  }

  metaAudio = (filePath, tags = {}) => {
    return new Promise(async resolve => {
      try {
        const { status, file, mimeType } = await this.getFile(await this.fetchBuffer(filePath))
        if (!status) {
          return resolve({ 'status': false })
        }
        if (!/audio/.test(mimeType)) {
          return resolve({ 'status': true, 'file': file })
        }
        NodeID3.write(tags, await this.fetchBuffer(file), function (error, buffer) {
          if (error) {
            return resolve({ 'status': false })
          }
          fs.writeFileSync(file, buffer)
          resolve({ 'status': true, 'file': file })
        })
      } catch (error) {
        console.log(error)
        resolve({ 'status': false })
      }
    })
  }
  
  texted = (type, text) => {
    switch (type) {
      case 'blist':
        return '- ' + text
        break
      case 'quote':
        return '> ' + text
        break
      case 'incode':
        return '`' + text + '`'
        break
      case 'bold':
        return '*' + text + '*'
        break
      case 'italic':
        return '_' + text + '_'
        break
      case 'strikethrough':
        return '~' + text + '~'
        break
      case 'monospace':
        return '```' + text + '```'
    }
  }

  example = (usedPrefix, command, args) => {
    return `• ${this.texted('bold', 'Example')} : ${usedPrefix + command} ${args}`
  }
  
  generateThumb = async (buffer, type, options) => {
    let thumb = await generateThumbnail(buffer, type, options)
    return thumb.thumbnail
  }

  igFixed = (url) => {
    let parts = url.split('/')
    if (parts.length === 7) {
      let removedItem = parts[3]
      let newParts = this.removeItem(parts, removedItem)
      return newParts.join('/')
    } else {
      return url
    }
  }

  ttFixed = (url) => {
    if (!url.match(/(tiktok.com\/t\/)/g)) {
      return url
    }
    let parts = url.split("/t/")[1]
    return "https://vm.tiktok.com/" + parts
  }
  
  toTime = (ms) => {
    let h = Math.floor(ms / 3600000)
    let m = Math.floor(ms / 60000) % 60
    let s = Math.floor(ms / 1000) % 60
    return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
  }
  
  readTime = (milliseconds) => {
    const days = Math.floor(milliseconds / 86400000) 
    const remainderAfterDays = milliseconds % 86400000
    const hours = Math.floor(remainderAfterDays / 3600000) 
    const remainderAfterHours = remainderAfterDays % 3600000
    const minutes = Math.floor(remainderAfterHours / 60000) 
    const remainderAfterMinutes = remainderAfterHours % 60000
    const seconds = Math.floor(remainderAfterMinutes / 1000)
    return {
      'days': days.toString().padStart(2, '0'),
      'hours': hours.toString().padStart(2, '0'),
      'minutes': minutes.toString().padStart(2, '0'),
      'seconds': seconds.toString().padStart(2, '0')
    }
  }

  filename = (extension) => {
    return `${Math.floor(Math.random() * 10000)}.${extension}`
  }

  uuid = () => {
    var dt = new Date().getTime()
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (dt + Math.random() * 16) % 16 | 0
      var y = Math.floor(dt / 16)
      return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16)
    })
    return uuid
  }
  
  random = (list) => {
    return list[Math.floor(Math.random() * list.length)]
  }
   
  randomInt = (min, max) => {
    min = Math.ceil(min) 
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  formatter = (number) => {
    let num = parseInt(number)
    return Number(num).toLocaleString().replace(/,/g, '.')
  }
  
  formatNumber = (integer) => {
    let numb = parseInt(integer)
    return Number(numb).toLocaleString().replace(/,/g, '.')
  }
  
  h2k = (integer) => {
    let numb = parseInt(integer)
    return new Intl.NumberFormat('en-US', {
      notation: 'compact'
    }).format(numb)
  }
  
  formatSize = (size) => {
    function round(value, precision) {
      var multiplier = Math.pow(10, precision || 0)
      return Math.round(value * multiplier) / multiplier
    }
    var megaByte = 1024 * 1024
    var gigaByte = 1024 * megaByte
    var teraByte = 1024 * gigaByte
    if (size < 1024) {
      return size + ' B'
    } else if (size < megaByte) {
      return round(size / 1024, 1) + ' KB'
    } else if (size < gigaByte) {
      return round(size / megaByte, 1) + ' MB'
    } else if (size < teraByte) {
      return round(size / gigaByte, 1) + ' GB'
    } else {
      return round(size / teraByte, 1) + ' TB'
    }
    return ''
  }
  
  getSize = async (str) => {
    if (!isNaN(str)) return this.formatSize(str)
    let header = await (await axios.get(str)).headers
    return this.formatSize(header['content-length'])
  }
  
  getFile = (source, filename, referer) => {
    return new Promise(async (resolve) => {
      try {
        if (Buffer.isBuffer(source)) {
          let ext, mime
          try {
            mime = await (await fromBuffer(source)).mime
            ext = await (await fromBuffer(source)).ext
          } catch {
            mime = require('mime-types').lookup(filename ? filename.split`.`[filename.split`.`.length - 1] : 'txt')
            ext = require('mime-types').extension(mime)
          }
          let extension = filename ? filename.split`.`[filename.split`.`.length - 1] :
            ext
          let size = Buffer.byteLength(source)
          let filepath = tmpdir() + '/' + (Func.uuid() + '.' + ext)
          let file = fs.writeFileSync(filepath, source)
          let name = filename || path.basename(filepath)
          let data = {
            status: true,
            file: filepath,
            filename: name,
            mime: mime,
            extension: ext,
            size: await Func.getSize(size),
            bytes: size,
          }
          return resolve(data)
        } else if (source.startsWith('./')) {
          let ext, mime
          try {
            mime = await (await fromBuffer(source)).mime
            ext = await (await fromBuffer(source)).ext
          } catch {
            mime = require('mime-types').lookup(filename ? filename.split`.`[filename.split`.`.length - 1] : 'txt')
            ext = require('mime-types').extension(mime)
          }
          let extension = filename ? filename.split`.`[filename.split`.`.length - 1] : ext
          let size = fs.statSync(source).size
          let data = {
            status: true,
            file: source,
            filename: path.basename(source),
            mime: mime,
            extension: ext,
            size: await Func.getSize(size),
            bytes: size,
          }
          return resolve(data)
        } else {
          axios.get(source, {
            responseType: 'stream',
            headers: {
              Referer: referer || ''
            },
          }).then(async (response) => {
            let extension = filename ? filename.split`.`[filename.split`.`.length - 1] : mime.extension(response.headers['content-type'])
            let file = fs.createWriteStream(`${tmpdir()}/${Func.uuid() + "." + extension}`)
            let name = filename || path.basename(file.path)
            response.data.pipe(file)
            file.on('finish', async () => {
              let data = {
                status: true,
                file: file.path,
                filename: name,
                mime: mime.lookup(file.path),
                extension: extension,
                size: await Func.getSize(response.headers["content-length"] ? response.headers["content-length"] : 0),
                bytes: response.headers["content-length"] ?
                  response.headers["content-length"] : 0,
              }
              resolve(data)
              file.close()
            })
          })
        }
      } catch (e) {
        console.log(e)
        resolve({
          status: false,
        })
      }
    })
  }
 
  color = (text, color = "green") => {
    return chalk.keyword(color).bold(text)
  }

  mtype = (data) => {
    function cleanText(text) {
      return text
        .replace(/```/g, '')
        .replace(/_/g, '')
        .replace(/[*]/g, '')
    }
    let processedText = typeof data.text !== "object" ? cleanText(data.text) : ''
    return processedText
  }
 
  sizeLimit = (str, max) => {
    let data
    if (str.match('G') || str.match('GB') || str.match('T') || str.match('TB')) return data = {
      oversize: true
    }
    if (str.match('M') || str.match('MB')) {
      let first = str.replace(/MB|M|G|T/g, '').trim()
      if (isNaN(first)) return data = {
        oversize: true
      }
      if (first > max) return data = {
        oversize: true
      }
      return data = {
        oversize: false
      }
    } else {
      return data = {
        oversize: false
      }
    }
  }
  
  generateLink = (text) => {
    let urlRegex = /(https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,})/gi
    return text.match(urlRegex)
  }

  reload = (filePath) => {
    fs.watchFile(filePath, () => {
      fs.unwatchFile(filePath)
      console.log(
        redBright.bold("[ UPDATE ]"),
        blueBright(moment(new Date()).format("DD/MM/YY HH:mm:ss")),
        green.bold("~ " + path.basename(filePath))
      )
      delete require.cache[filePath]
      require(filePath)
    })
  }

  updateFile = (filePath) => {
    const fileWatcher = fs.watch(filePath, (event, filename) => {
      if (event === "change") {
        console.log(
          redBright.bold("[ UPDATE ]"),
          blueBright(moment(new Date()).format("DD/MM/YY HH:mm:ss")),
          green.bold("~ " + path.basename(filePath))
        )
        delete require.cache[require.resolve(filePath)]
        require(filePath) 
      }
    })
    process.on("exit", () => {
      fileWatcher.close()
    })
  }

  jsonFormat = (obj) => {
    try {
      let print = (obj && (obj.constructor.name == 'Object' || obj.constructor.name == 'Array')) ? require('util').format(JSON.stringify(obj, null, 2)) : require('util').format(obj)
      return print
    } catch {
      return require('util').format(obj)
    }
  }
  
  ucword = (str) => {
    return (str + '').replace(/^([a-z])|\s+([a-z])/g, function ($1) {
      return $1.toUpperCase()
    })
  }

  arrayJoin = (arr) => {
    let result = []
    for (let i = 0; i < arr.length; i++) {
      result = result.concat(arr[i])
    }
    return result
  }

  removeItem = (arr, item) => {
    let index = arr.indexOf(item)
    if (index > -1) {
      arr.splice(index, 1)
    }
    return arr
  }
  
  hitstat = (interactionId, sender) => {
    if (/bot|help|menu|stat|hitstat|hitdaily/.test(interactionId)) {
      return
    }
    if (typeof global.db === "undefined") {
      return
    }
    global.db.statistic = global.db.statistic || {}
    if (!global.db.statistic[interactionId]) {
      global.db.statistic[interactionId] = {
        'hitstat': 1,
        'today': 1,
        'lasthit': new Date().getTime(),
        'sender': sender.split('@')[0]
      }
    } else {
      global.db.statistic[interactionId].hitstat += 1
      global.db.statistic[interactionId].today += 1
      global.db.statistic[interactionId].lasthit = new Date().getTime()
      global.db.statistic[interactionId].sender = sender.split('@')[0]
    }
  }

  socmed = (url) => {
    const patterns = [
      /^(?:https?:\/\/(web\.|www\.|m\.)?(facebook|fb)\.(com|watch)\S+)?$/,
      /^(?:https?:\/\/)?(?:www\.)?(?:instagram\.com\/)(?:tv\/|p\/|reel\/)(?:\S+)?$/,
      /^(?:https?:\/\/)?(?:www\.)?(?:instagram\.com\/)(?:stories\/)(?:\S+)?$/,
      /^(?:https?:\/\/)?(?:www\.)?(?:instagram\.com\/)(?:s\/)(?:\S+)?$/,
      /^(?:https?:\/\/)?(?:www\.)?(?:mediafire\.com\/)(?:\S+)?$/,
      /pin(?:terest)?(?:\.it|\.com)/,
      /^(?:https?:\/\/)?(?:www\.|vt\.|vm\.|t\.)?(?:tiktok\.com\/)(?:\S+)?$/,
      /http(?:s)?:\/\/(?:www\.|mobile\.)?twitter\.com\/([a-zA-Z0-9_]+)/,
      /^(?:https?:\/\/)?(?:www\.|m\.|music\.)?youtu\.?be(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w\-_]+)\&?/,
      /^(?:https?:\/\/)?(?:podcasts\.)?(?:google\.com\/)(?:feed\/)(?:\S+)?$/
    ]
    return patterns.some(pattern => url.match(pattern))
  }

  matcher = (input, strings, options) => {
    const calculateDistance = (str1, str2, ignoreCase) => {
      let arr1 = []
      let arr2 = []
      let len1 = str1.length
      let len2 = str2.length
      let distance
      if (str1 === str2) {
        return 0
      }
      if (len1 === 0) {
        return len2
      }
      if (len2 === 0) {
        return len1
      }
      if (ignoreCase) {
        str1 = str1.toLowerCase()
        str2 = str2.toLowerCase()
      }
      for (let i = 0; i < len1; i++) {
        arr1[i] = str1.charCodeAt(i)
      }
      for (let j = 0; j < len2; j++) {
        let code = str2.charCodeAt(j)
        let previousRow = arr1.slice()
        let currentRow = []
        let minValue
        for (let i = 0; i < len1; i++) {
          minValue = Math.min(previousRow[i] + 1, currentRow[i - 1] + 1, arr1[i] === code ? previousRow[i - 1] : previousRow[i] + 1)
          currentRow.push(minValue)
        }
        arr1 = currentRow
      }
      return arr1[len1 - 1]
    }
    const calculateSimilarity = (inputStr, compareStr, options) => {
      let maxLen = Math.max(inputStr.length, compareStr.length)
      return ((maxLen === 0 ? 1 : (maxLen - calculateDistance(inputStr, compareStr, options.sensitive)) / maxLen) * 100).toFixed(1)
    }
    let result = []
    let targetArray = Array.isArray(strings) ? strings : [strings]
    targetArray.map(string => {
      result.push({
        'string': string,
        'accuracy': calculateSimilarity(input, string, options)
      })
    })
    return result
  }
  
  toDate = (ms) => {
    let temp = ms
    let days = Math.floor(ms / (24 * 60 * 60 * 1000))
    let daysms = ms % (24 * 60 * 60 * 1000)
    let hours = Math.floor((daysms) / (60 * 60 * 1000))
    let hoursms = ms % (60 * 60 * 1000)
    let minutes = Math.floor((hoursms) / (60 * 1000))
    let minutesms = ms % (60 * 1000)
    let sec = Math.floor((minutesms) / (1000))
    if (days == 0 && hours == 0 && minutes == 0) {
      return "Recently"
    } else {
      return days + "D " + hours + "H " + minutes + "M"
    }
  }

  timeFormat = (value) => {
    const sec = parseInt(value, 10)
    let hours = Math.floor(sec / 3600)
    let minutes = Math.floor((sec - (hours * 3600)) / 60)
    let seconds = sec - (hours * 3600) - (minutes * 60)
    if (hours < 10) hours = '0' + hours
    if (minutes < 10) minutes = '0' + minutes
    if (seconds < 10) seconds = '0' + seconds
    if (hours == parseInt('00')) return minutes + ':' + seconds
    return hours + ':' + minutes + ':' + seconds
  }
  
  switcher = (condition, option1, option2) => {
    return condition ? this.texted("bold", option1) : this.texted("bold", option2)
  }

  makeId = (length) => {
    var result = ''
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    var charactersLength = characters.length
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return result
  }
  
  timeReverse = (milliseconds) => {
    let days = Math.floor(milliseconds / 86400000)
    let hours = Math.floor((milliseconds / 3600000) % 24)
    let minutes = Math.floor((milliseconds / 60000) % 60)
    let seconds = Math.floor((milliseconds / 1000) % 60)
    let formattedHours = hours < 10 ? '0' + hours : hours
    let formattedMinutes = minutes < 10 ? '0' + minutes : minutes
    let formattedDays = days < 10 ? '0' + days : days
    return formattedDays + "D " + formattedHours + "H " + formattedMinutes + 'M'
  }

  greeting = () => {
    let hour = moment.tz(process.env.TZ || "Asia/Jakarta").format('HH')
    let greetingMessage = "Don't forget to sleep" 
    if (hour >= 18) {
      greetingMessage = "Good Night"
    } else if (hour >= 11) {
      greetingMessage = "Good Afternoon"
    } else if (hour >= 6) {
      greetingMessage = "Good Morning"
    } else if (hour >= 3) {
      greetingMessage = "Good Evening"
    }
    return greetingMessage
  }
  
  jsonRandom = (filePath) => {
    let jsonArray = JSON.parse(fs.readFileSync(filePath))
    return jsonArray[Math.floor(Math.random() * jsonArray.length)]
  }
  
  level = (j, q = 5) => {
    let L = j 
    let J = 1
    while (j > 1) {
      j /= q  
      if (j < 1) {
        J == J 
      } else {
        J += 1
      }
    }
    let W = 1
    while (L >= W) {
      W = W + W
    }
    let D = W - L
    if (D == 0) {
      D = W + W 
    }
    let x = W - D  
    return [J, W, D, x]
  }
  
  ["role"] = j => {
    const q = {
      'CagYI': function (L, J) {
        return L <= J
      },
      'Tykfy': "Newbie ㋡",
      'bPcJu': function (L, J) {
        return L <= J
      },
      'PHwKS': "Beginner Grade 1 ⚊¹",
      'QjAPW': function (L, J) {
        return L <= J
      },
      'dPJci': "Beginner Grade 2 ⚊²",
      'QquiD': "Beginner Grade 3 ⚊³",
      'FtNSm': function (L, J) {
        return L <= J
      },
      'DvMSE': "Beginner Grade 4 ⚊⁴",
      'zrBxd': function (L, J) {
        return L <= J
      },
      'RZoWZ': "Private Grade 1 ⚌¹",
      'EODcW': function (L, J) {
        return L <= J
      },
      'Zhdww': "Private Grade 2 ⚌²",
      'vwovf': function (L, J) {
        return L <= J
      },
      'IRcjr': "Private Grade 3 ⚌³",
      'Rlhcn': "Private Grade 4 ⚌⁴",
      'pnKJF': function (L, J) {
        return L <= J
      },
      'YtrnM': "Private Grade 5 ⚌⁵",
      'bBpxY': function (L, J) {
        return L <= J
      },
      'kDxxe': "Corporal Grade 1 ☰¹",
      'LwvOn': "Corporal Grade 2 ☰²",
      'CIFgB': function (L, J) {
        return L <= J
      },
      'BAANE': "Corporal Grade 3 ☰³",
      'UeieC': "Corporal Grade 4 ☰⁴",
      'AZxHz': function (L, J) {
        return L <= J
      },
      'oGjNu': "Corporal Grade 5 ☰⁵",
      'GGWwm': function (L, J) {
        return L <= J
      },
      'qsxfF': "Sergeant Grade 1 ≣¹",
      'Fjxqm': function (L, J) {
        return L <= J
      },
      'KbEST': "Sergeant Grade 2 ≣²",
      'oWoxE': function (L, J) {
        return L <= J
      },
      'ereXS': "Sergeant Grade 3 ≣³",
      'Dbkph': function (L, J) {
        return L <= J
      },
      'NXjXD': "Sergeant Grade 4 ≣⁴",
      'PSzRB': function (L, J) {
        return L <= J
      },
      'QjdAz': "Sergeant Grade 5 ≣⁵",
      'UjZyS': function (L, J) {
        return L <= J
      },
      'nXiXA': "Staff Grade 1 ﹀¹",
      'uyvSM': function (L, J) {
        return L <= J
      },
      'huOEu': "Staff Grade 2 ﹀²",
      'RSBnI': function (L, J) {
        return L <= J
      },
      'KpoxN': "Staff Grade 3 ﹀³",
      'IpArY': function (L, J) {
        return L <= J
      },
      'yyZIk': "Staff Grade 4 ﹀⁴",
      'ATZcN': function (L, J) {
        return L <= J
      },
      'WxDnw': "Staff Grade 5 ﹀⁵",
      'ncCxZ': function (L, J) {
        return L <= J
      },
      'zRAgj': "Sergeant Grade 1 ︾¹",
      'xJyAN': function (L, J) {
        return L <= J
      },
      'FOJuQ': "Sergeant Grade 2 ︾²",
      'OneNI': function (L, J) {
        return L <= J
      },
      'LdClG': "Sergeant Grade 3 ︾³",
      'Vpsqt': function (L, J) {
        return L <= J
      },
      'PnZWr': "Sergeant Grade 4 ︾⁴",
      'jUiUB': "Sergeant Grade 5 ︾⁵",
      'iQeoE': function (L, J) {
        return L <= J
      },
      'pCqWb': "2nd Lt. Grade 1 ♢¹ ",
      'QHSPj': function (L, J) {
        return L <= J
      },
      'fGtuk': "2nd Lt. Grade 2 ♢²",
      'uWYky': "2nd Lt. Grade 3 ♢³",
      'hyLNo': function (L, J) {
        return L <= J
      },
      'yopbM': "2nd Lt. Grade 4 ♢⁴",
      'nUkll': "2nd Lt. Grade 5 ♢⁵",
      'sRqRA': "1st Lt. Grade 1 ♢♢¹",
      'HsMom': function (L, J) {
        return L <= J
      },
      'XlBLF': "1st Lt. Grade 2 ♢♢²",
      'CQqeM': function (L, J) {
        return L <= J
      },
      'owyEN': "1st Lt. Grade 3 ♢♢³",
      'OtcJi': function (L, J) {
        return L <= J
      },
      'MDkYm': "1st Lt. Grade 4 ♢♢⁴",
      'MhbQY': function (L, J) {
        return L <= J
      },
      'oIOpD': "1st Lt. Grade 5 ♢♢⁵",
      'gfArs': function (L, J) {
        return L <= J
      },
      'MRHJT': "Major Grade 1 ✷¹",
      'iSufV': "Major Grade 2 ✷²",
      'asHCo': function (L, J) {
        return L <= J
      },
      'CIWMs': "Major Grade 3 ✷³",
      'niKtu': "Major Grade 4 ✷⁴",
      'XhBLA': "Major Grade 5 ✷⁵",
      'DEsIV': function (L, J) {
        return L <= J
      },
      'QJDjX': "Colonel Grade 1 ✷✷¹",
      'pfGdq': "Colonel Grade 2 ✷✷²",
      'tIgTX': function (L, J) {
        return L <= J
      },
      'ndOxb': "Colonel Grade 3 ✷✷³",
      'teMJC': "Colonel Grade 4 ✷✷⁴",
      'qisvw': function (L, J) {
        return L <= J
      },
      'EKdXY': "Colonel Grade 5 ✷✷⁵",
      'gLjdk': function (L, J) {
        return L <= J
      },
      'JFYdZ': "Brigadier Early ✰",
      'xtaID': "Brigadier Silver ✩",
      'DpgIE': "Brigadier gold ✯",
      'Skgeo': "Brigadier Platinum ✬",
      'caNLF': "Brigadier Diamond ✪",
      'TSeYC': function (L, J) {
        return L <= J
      },
      'Fzwrl': "Major General Early ✰",
      'hyXuQ': "Major General Silver ✩",
      'ugoxg': "Major General gold ✯",
      'nnKkb': function (L, J) {
        return L <= J
      },
      'wZByB': "Major General Platinum ✬",
      'VmuSD': function (L, J) {
        return L <= J
      },
      'samrv': "Major General Diamond ✪",
      'mXCDL': function (L, J) {
        return L <= J
      },
      'TmWIp': "Lt. General Early ✰",
      'Ctxxt': "Lt. General Silver ✩",
      'sxBOt': function (L, J) {
        return L <= J
      },
      'RShLq': "Lt. General gold ✯",
      'EGJcZ': "Lt. General Platinum ✬",
      'ZtVmS': function (L, J) {
        return L <= J
      },
      'jOMaO': "Lt. General Diamond ✪",
      'uDwWJ': "General Early ✰",
      'NSJjH': "General Silver ✩",
      'zHFkg': function (L, J) {
        return L <= J
      },
      'YtXdc': "General gold ✯",
      'WGxBt': function (L, J) {
        return L <= J
      },
      'iwrAY': "General Platinum ✬",
      'diydz': function (L, J) {
        return L <= J
      },
      'eVRVR': "General Diamond ✪",
      'jRbVq': function (L, J) {
        return L <= J
      },
      'ZWCCE': "Commander Early ★",
      'woAZf': "Commander Intermediate ⍣",
      'BHdZd': function (L, J) {
        return L <= J
      },
      'TDLeR': "Commander Elite ≛",
      'ZiUkg': function (L, J) {
        return L <= J
      },
      'ILXhw': "The Commander Hero ⍟",
      'NxHnU': "Legends 忍",
      'oRXIs': function (L, J) {
        return L <= J
      },
      'UiuYb': function (L, J) {
        return L <= J
      },
      'njFqi': function (L, J) {
        return L <= J
      },
      'udXpQ': function (L, J) {
        return L <= J
      },
      'zhnGA': function (L, J) {
        return L <= J
      },
      'Xszja': function (L, J) {
        return L <= J
      },
      'hodDp': function (L, J) {
        return L <= J
      },
      'MPXyR': function (L, J) {
        return L <= J
      },
      'GIzXO': function (L, J) {
        return L <= J
      },
      'CxnUZ': function (L, J) {
        return L <= J
      },
      'qfSUV': function (L, J) {
        return L <= J
      },
      'MIYfB': function (L, J) {
        return L <= J
      },
      'KqCcL': function (L, J) {
        return L <= J
      },
      'CVRhK': function (L, J) {
        return L <= J
      },
      'xbmFH': function (L, J) {
        return L <= J
      },
      'WMpNJ': function (L, J) {
        return L <= J
      },
      'BkAHa': function (L, J) {
        return L <= J
      },
      'izsJi': function (L, J) {
        return L <= J
      },
      'CZCJG': function (L, J) {
        return L <= J
      },
      'GySzP': function (L, J) {
        return L <= J
      },
      'YgXnD': function (L, J) {
        return L <= J
      },
      'jADFC': function (L, J) {
        return L <= J
      },
      'iJNyX': function (L, J) {
        return L <= J
      },
      'iBMDA': function (L, J) {
        return L <= J
      },
      'AljvS': function (L, J) {
        return L <= J
      },
      'yfCGn': function (L, J) {
        return L <= J
      },
      'xufar': function (L, J) {
        return L <= J
      },
      'ytSAk': function (L, J) {
        return L <= J
      },
      'gOdCA': function (L, J) {
        return L <= J
      },
      'lBaUF': function (L, J) {
        return L <= J
      },
      'odQGt': function (L, J) {
        return L <= J
      },
      'MpkRf': function (L, J) {
        return L <= J
      },
      'EAjzC': function (L, J) {
        return L <= J
      },
      'OLoAW': function (L, J) {
        return L <= J
      },
      'HJOiA': function (L, J) {
        return L <= J
      },
      'kLttn': function (L, J) {
        return L <= J
      }
    };
    let f = '-'
    if (j <= 2) {
      f = "Newbie ㋡"
    } else {
      if (j <= 4) {
        f = "Beginner Grade 1 ⚊¹"
      } else {
        if (j <= 6) {
          f = "Beginner Grade 2 ⚊²"
        } else {
          if (j <= 8) {
            f = "Beginner Grade 3 ⚊³"
          } else {
            if (j <= 10) {
              f = "Beginner Grade 4 ⚊⁴"
            } else {
              if (j <= 12) {
                f = "Private Grade 1 ⚌¹"
              } else {
                if (j <= 14) {
                  f = "Private Grade 2 ⚌²"
                } else {
                  if (j <= 16) {
                    f = "Private Grade 3 ⚌³"
                  } else {
                    if (j <= 18) {
                      f = "Private Grade 4 ⚌⁴"
                    } else {
                      if (j <= 20) {
                        f = "Private Grade 5 ⚌⁵"
                      } else {
                        if (j <= 22) {
                          f = "Corporal Grade 1 ☰¹"
                        } else {
                          if (j <= 24) {
                            f = "Corporal Grade 2 ☰²"
                          } else {
                            if (j <= 26) {
                              f = "Corporal Grade 3 ☰³"
                            } else {
                              if (j <= 28) {
                                f = "Corporal Grade 4 ☰⁴"
                              } else {
                                if (j <= 30) {
                                  f = "Corporal Grade 5 ☰⁵"
                                } else {
                                  if (j <= 32) {
                                    f = "Sergeant Grade 1 ≣¹"
                                  } else {
                                    if (j <= 34) {
                                      f = "Sergeant Grade 2 ≣²"
                                    } else {
                                      if (j <= 36) {
                                        f = "Sergeant Grade 3 ≣³"
                                      } else {
                                        if (j <= 38) {
                                          f = "Sergeant Grade 4 ≣⁴"
                                        } else {
                                          if (j <= 40) {
                                            f = "Sergeant Grade 5 ≣⁵"
                                          } else {
                                            if (j <= 42) {
                                              f = "Staff Grade 1 ﹀¹"
                                            } else {
                                              if (j <= 44) {
                                                f = "Staff Grade 2 ﹀²"
                                              } else {
                                                if (j <= 46) {
                                                  f = "Staff Grade 3 ﹀³"
                                                } else {
                                                  if (j <= 48) {
                                                    f = "Staff Grade 4 ﹀⁴"
                                                  } else {
                                                    if (j <= 50) {
                                                      f = "Staff Grade 5 ﹀⁵"
                                                    } else {
                                                      if (j <= 52) {
                                                        f = "Sergeant Grade 1 ︾¹"
                                                      } else {
                                                        if (j <= 54) {
                                                          f = "Sergeant Grade 2 ︾²"
                                                        } else {
                                                          if (j <= 56) {
                                                            f = "Sergeant Grade 3 ︾³"
                                                          } else {
                                                            if (j <= 58) {
                                                              f = "Sergeant Grade 4 ︾⁴"
                                                            } else {
                                                              if (j <= 60) {
                                                                f = "Sergeant Grade 5 ︾⁵"
                                                              } else {
                                                                if (j <= 62) {
                                                                  f = "2nd Lt. Grade 1 ♢¹ "
                                                                } else {
                                                                  if (j <= 64) {
                                                                    f = "2nd Lt. Grade 2 ♢²"
                                                                  } else {
                                                                    if (j <= 66) {
                                                                      f = "2nd Lt. Grade 3 ♢³"
                                                                    } else {
                                                                      if (j <= 68) {
                                                                        f = "2nd Lt. Grade 4 ♢⁴"
                                                                      } else {
                                                                        if (j <= 70) {
                                                                          f = "2nd Lt. Grade 5 ♢⁵"
                                                                        } else {
                                                                          if (j <= 72) {
                                                                            f = "1st Lt. Grade 1 ♢♢¹"
                                                                          } else {
                                                                            if (j <= 74) {
                                                                              f = "1st Lt. Grade 2 ♢♢²"
                                                                            } else {
                                                                              if (j <= 76) {
                                                                                f = "1st Lt. Grade 3 ♢♢³"
                                                                              } else {
                                                                                if (j <= 78) {
                                                                                  f = "1st Lt. Grade 4 ♢♢⁴"
                                                                                } else {
                                                                                  if (j <= 80) {
                                                                                    f = "1st Lt. Grade 5 ♢♢⁵"
                                                                                  } else {
                                                                                    if (j <= 82) {
                                                                                      f = "Major Grade 1 ✷¹"
                                                                                    } else {
                                                                                      if (j <= 84) {
                                                                                        f = "Major Grade 2 ✷²"
                                                                                      } else {
                                                                                        if (j <= 86) {
                                                                                          f = "Major Grade 3 ✷³"
                                                                                        } else {
                                                                                          if (j <= 88) {
                                                                                            f = "Major Grade 4 ✷⁴"
                                                                                          } else {
                                                                                            if (j <= 90) {
                                                                                              f = "Major Grade 5 ✷⁵"
                                                                                            } else {
                                                                                              if (j <= 92) {
                                                                                                f = "Colonel Grade 1 ✷✷¹"
                                                                                              } else {
                                                                                                if (j <= 94) {
                                                                                                  f = "Colonel Grade 2 ✷✷²"
                                                                                                } else {
                                                                                                  if (j <= 96) {
                                                                                                    f = "Colonel Grade 3 ✷✷³"
                                                                                                  } else {
                                                                                                    if (j <= 98) {
                                                                                                      f = "Colonel Grade 4 ✷✷⁴"
                                                                                                    } else {
                                                                                                      if (j <= 100) {
                                                                                                        f = "Colonel Grade 5 ✷✷⁵"
                                                                                                      } else {
                                                                                                        if (j <= 102) {
                                                                                                          f = "Brigadier Early ✰"
                                                                                                        } else {
                                                                                                          if (j <= 104) {
                                                                                                            f = "Brigadier Silver ✩"
                                                                                                          } else {
                                                                                                            if (j <= 106) {
                                                                                                              f = "Brigadier gold ✯"
                                                                                                            } else {
                                                                                                              if (j <= 108) {
                                                                                                                f = "Brigadier Platinum ✬"
                                                                                                              } else {
                                                                                                                if (j <= 110) {
                                                                                                                  f = "Brigadier Diamond ✪"
                                                                                                                } else {
                                                                                                                  if (j <= 112) {
                                                                                                                    f = "Major General Early ✰"
                                                                                                                  } else {
                                                                                                                    if (j <= 114) {
                                                                                                                      f = "Major General Silver ✩"
                                                                                                                    } else {
                                                                                                                      if (j <= 116) {
                                                                                                                        f = "Major General gold ✯"
                                                                                                                      } else {
                                                                                                                        if (j <= 118) {
                                                                                                                          f = "Major General Platinum ✬"
                                                                                                                        } else {
                                                                                                                          if (j <= 120) {
                                                                                                                            f = "Major General Diamond ✪"
                                                                                                                          } else {
                                                                                                                            if (j <= 122) {
                                                                                                                              f = "Lt. General Early ✰"
                                                                                                                            } else {
                                                                                                                              if (j <= 124) {
                                                                                                                                f = "Lt. General Silver ✩"
                                                                                                                              } else {
                                                                                                                                if (j <= 126) {
                                                                                                                                  f = "Lt. General gold ✯"
                                                                                                                                } else {
                                                                                                                                  if (j <= 128) {
                                                                                                                                    f = "Lt. General Platinum ✬"
                                                                                                                                  } else {
                                                                                                                                    if (j <= 130) {
                                                                                                                                      f = "Lt. General Diamond ✪"
                                                                                                                                    } else {
                                                                                                                                      if (j <= 132) {
                                                                                                                                        f = "General Early ✰"
                                                                                                                                      } else {
                                                                                                                                        if (j <= 134) {
                                                                                                                                          f = "General Silver ✩"
                                                                                                                                        } else {
                                                                                                                                          if (j <= 136) {
                                                                                                                                            f = "General gold ✯"
                                                                                                                                          } else {
                                                                                                                                            if (j <= 138) {
                                                                                                                                              f = "General Platinum ✬"
                                                                                                                                            } else {
                                                                                                                                              if (j <= 140) {
                                                                                                                                                f = "General Diamond ✪"
                                                                                                                                              } else {
                                                                                                                                                if (j <= 142) {
                                                                                                                                                  f = "Commander Early ★"
                                                                                                                                                } else {
                                                                                                                                                  if (j <= 144) {
                                                                                                                                                    f = "Commander Intermediate ⍣"
                                                                                                                                                  } else {
                                                                                                                                                    if (j <= 146) {
                                                                                                                                                      f = "Commander Elite ≛"
                                                                                                                                                    } else {
                                                                                                                                                      if (j <= 148) {
                                                                                                                                                        f = "The Commander Hero ⍟"
                                                                                                                                                      } else {
                                                                                                                                                        if (j <= 152) {
                                                                                                                                                          f = "Legends 忍"
                                                                                                                                                        } else {
                                                                                                                                                          if (j <= 154) {
                                                                                                                                                            f = "Legends 忍"
                                                                                                                                                          } else {
                                                                                                                                                            if (j <= 156) {
                                                                                                                                                              f = "Legends 忍"
                                                                                                                                                            } else {
                                                                                                                                                              if (j <= 158) {
                                                                                                                                                                f = "Legends 忍"
                                                                                                                                                              } else {
                                                                                                                                                                if (j <= 160) {
                                                                                                                                                                  f = "Legends 忍"
                                                                                                                                                                } else {
                                                                                                                                                                  if (j <= 162) {
                                                                                                                                                                    f = "Legends 忍"
                                                                                                                                                                  } else {
                                                                                                                                                                    if (j <= 164) {
                                                                                                                                                                      f = "Legends 忍"
                                                                                                                                                                    } else {
                                                                                                                                                                      if (j <= 166) {
                                                                                                                                                                        f = "Legends 忍"
                                                                                                                                                                      } else {
                                                                                                                                                                        if (j <= 168) {
                                                                                                                                                                          f = "Legends 忍"
                                                                                                                                                                        } else {
                                                                                                                                                                          if (j <= 170) {
                                                                                                                                                                            f = "Legends 忍"
                                                                                                                                                                          } else {
                                                                                                                                                                            if (j <= 172) {
                                                                                                                                                                              f = "Legends 忍"
                                                                                                                                                                            } else {
                                                                                                                                                                              if (j <= 174) {
                                                                                                                                                                                f = "Legends 忍"
                                                                                                                                                                              } else {
                                                                                                                                                                                if (j <= 176) {
                                                                                                                                                                                  f = "Legends 忍"
                                                                                                                                                                                } else {
                                                                                                                                                                                  if (j <= 178) {
                                                                                                                                                                                    f = "Legends 忍"
                                                                                                                                                                                  } else {
                                                                                                                                                                                    if (j <= 180) {
                                                                                                                                                                                      f = "Legends 忍"
                                                                                                                                                                                    } else {
                                                                                                                                                                                      if (j <= 182) {
                                                                                                                                                                                        f = "Legends 忍"
                                                                                                                                                                                      } else {
                                                                                                                                                                                        if (j <= 184) {
                                                                                                                                                                                          f = "Legends 忍"
                                                                                                                                                                                        } else {
                                                                                                                                                                                          if (j <= 186) {
                                                                                                                                                                                            f = "Legends 忍"
                                                                                                                                                                                          } else {
                                                                                                                                                                                            if (j <= 188) {
                                                                                                                                                                                              f = "Legends 忍"
                                                                                                                                                                                            } else {
                                                                                                                                                                                              if (j <= 190) {
                                                                                                                                                                                                f = "Legends 忍"
                                                                                                                                                                                              } else {
                                                                                                                                                                                                if (j <= 192) {
                                                                                                                                                                                                  f = "Legends 忍"
                                                                                                                                                                                                } else {
                                                                                                                                                                                                  if (j <= 194) {
                                                                                                                                                                                                    f = "Legends 忍"
                                                                                                                                                                                                  } else {
                                                                                                                                                                                                    if (j <= 196) {
                                                                                                                                                                                                      f = "Legends 忍"
                                                                                                                                                                                                    } else {
                                                                                                                                                                                                      if (j <= 198) {
                                                                                                                                                                                                        f = "Legends 忍"
                                                                                                                                                                                                      } else {
                                                                                                                                                                                                        if (j <= 200) {
                                                                                                                                                                                                          f = "Legends 忍"
                                                                                                                                                                                                        } else {
                                                                                                                                                                                                          if (j <= 210) {
                                                                                                                                                                                                            f = "Legends 忍"
                                                                                                                                                                                                          } else {
                                                                                                                                                                                                            if (j <= 220) {
                                                                                                                                                                                                              f = "Legends 忍"
                                                                                                                                                                                                            } else {
                                                                                                                                                                                                              if (j <= 230) {
                                                                                                                                                                                                                f = "Legends 忍"
                                                                                                                                                                                                              } else {
                                                                                                                                                                                                                if (j <= 240) {
                                                                                                                                                                                                                  f = "Legends 忍"
                                                                                                                                                                                                                } else {
                                                                                                                                                                                                                  if (j <= 250) {
                                                                                                                                                                                                                    f = "Legends 忍"
                                                                                                                                                                                                                  } else {
                                                                                                                                                                                                                    if (j <= 260) {
                                                                                                                                                                                                                      f = "Legends 忍"
                                                                                                                                                                                                                    } else {
                                                                                                                                                                                                                      if (j <= 270) {
                                                                                                                                                                                                                        f = "Legends 忍"
                                                                                                                                                                                                                      } else {
                                                                                                                                                                                                                        if (j <= 280) {
                                                                                                                                                                                                                          f = "Legends 忍"
                                                                                                                                                                                                                        } else {
                                                                                                                                                                                                                          if (j <= 290) {
                                                                                                                                                                                                                            f = "Legends 忍"
                                                                                                                                                                                                                          } else {
                                                                                                                                                                                                                            if (j <= 300) {
                                                                                                                                                                                                                              f = "Legends 忍"
                                                                                                                                                                                                                            } else {
                                                                                                                                                                                                                              if (j <= 310) {
                                                                                                                                                                                                                                f = "Legends 忍"
                                                                                                                                                                                                                              } else {
                                                                                                                                                                                                                                if (j <= 320) {
                                                                                                                                                                                                                                  f = "Legends 忍"
                                                                                                                                                                                                                                } else {
                                                                                                                                                                                                                                  if (j <= 330) {
                                                                                                                                                                                                                                    f = "Legends 忍"
                                                                                                                                                                                                                                  } else {
                                                                                                                                                                                                                                    if (j <= 340) {
                                                                                                                                                                                                                                      f = "Legends 忍"
                                                                                                                                                                                                                                    } else {
                                                                                                                                                                                                                                      if (j <= 350) {
                                                                                                                                                                                                                                        f = "Legends 忍"
                                                                                                                                                                                                                                      } else {
                                                                                                                                                                                                                                        if (j <= 360) {
                                                                                                                                                                                                                                          f = "Legends 忍"
                                                                                                                                                                                                                                        } else {
                                                                                                                                                                                                                                          if (j <= 370) {
                                                                                                                                                                                                                                            f = "Legends 忍"
                                                                                                                                                                                                                                          } else {
                                                                                                                                                                                                                                            if (j <= 380) {
                                                                                                                                                                                                                                              f = "Legends 忍"
                                                                                                                                                                                                                                            } else {
                                                                                                                                                                                                                                              if (j <= 390) {
                                                                                                                                                                                                                                                f = "Legends 忍"
                                                                                                                                                                                                                                              } else {
                                                                                                                                                                                                                                                if (j <= 400) {
                                                                                                                                                                                                                                                  f = "Legends 忍"
                                                                                                                                                                                                                                                } else {
                                                                                                                                                                                                                                                  if (j <= 410) {
                                                                                                                                                                                                                                                    f = "Legends 忍"
                                                                                                                                                                                                                                                  } else {
                                                                                                                                                                                                                                                    if (j <= 420) {
                                                                                                                                                                                                                                                      f = "Legends 忍"
                                                                                                                                                                                                                                                    } else {
                                                                                                                                                                                                                                                      if (j <= 430) {
                                                                                                                                                                                                                                                        f = "Legends 忍"
                                                                                                                                                                                                                                                      } else {
                                                                                                                                                                                                                                                        if (j <= 440) {
                                                                                                                                                                                                                                                          f = "Legends 忍"
                                                                                                                                                                                                                                                        } else {
                                                                                                                                                                                                                                                          if (j <= 450) {
                                                                                                                                                                                                                                                            f = "Legends 忍"
                                                                                                                                                                                                                                                          } else {
                                                                                                                                                                                                                                                            if (j <= 460) {
                                                                                                                                                                                                                                                              f = "Legends 忍"
                                                                                                                                                                                                                                                            } else {
                                                                                                                                                                                                                                                              if (j <= 470) {
                                                                                                                                                                                                                                                                f = "Legends 忍"
                                                                                                                                                                                                                                                              } else {
                                                                                                                                                                                                                                                                if (j <= 480) {
                                                                                                                                                                                                                                                                  f = "Legends 忍"
                                                                                                                                                                                                                                                                } else {
                                                                                                                                                                                                                                                                  if (j <= 490) {
                                                                                                                                                                                                                                                                    f = "Legends 忍"
                                                                                                                                                                                                                                                                  } else {
                                                                                                                                                                                                                                                                    if (j <= 500) {
                                                                                                                                                                                                                                                                      f = "Legends 忍"
                                                                                                                                                                                                                                                                    } else {
                                                                                                                                                                                                                                                                      if (j <= 600) {
                                                                                                                                                                                                                                                                        f = "Legends 忍"
                                                                                                                                                                                                                                                                      } else {
                                                                                                                                                                                                                                                                        if (j <= 700) {
                                                                                                                                                                                                                                                                          f = "Legends 忍"
                                                                                                                                                                                                                                                                        } else {
                                                                                                                                                                                                                                                                          if (j <= 800) {
                                                                                                                                                                                                                                                                            f = "Legends 忍"
                                                                                                                                                                                                                                                                          } else {
                                                                                                                                                                                                                                                                            if (j <= 900) {
                                                                                                                                                                                                                                                                              f = "Legends 忍"
                                                                                                                                                                                                                                                                            } else {
                                                                                                                                                                                                                                                                              if (j <= 1000) {
                                                                                                                                                                                                                                                                                f = "Legends 忍"
                                                                                                                                                                                                                                                                              } else {
                                                                                                                                                                                                                                                                                if (j <= 2000) {
                                                                                                                                                                                                                                                                                  f = "Legends 忍"
                                                                                                                                                                                                                                                                                } else {
                                                                                                                                                                                                                                                                                  if (j <= 3000) {
                                                                                                                                                                                                                                                                                    f = "Legends 忍"
                                                                                                                                                                                                                                                                                  } else {
                                                                                                                                                                                                                                                                                    if (j <= 4000) {
                                                                                                                                                                                                                                                                                      f = "Legends 忍"
                                                                                                                                                                                                                                                                                    } else {
                                                                                                                                                                                                                                                                                      if (j <= 5000) {
                                                                                                                                                                                                                                                                                        f = "Legends 忍"
                                                                                                                                                                                                                                                                                      } else {
                                                                                                                                                                                                                                                                                        if (j <= 6000) {
                                                                                                                                                                                                                                                                                          f = "Legends 忍"
                                                                                                                                                                                                                                                                                        } else {
                                                                                                                                                                                                                                                                                          if (j <= 7000) {
                                                                                                                                                                                                                                                                                            f = "Legends 忍"
                                                                                                                                                                                                                                                                                          } else {
                                                                                                                                                                                                                                                                                            if (j <= 8000) {
                                                                                                                                                                                                                                                                                              f = "Legends 忍"
                                                                                                                                                                                                                                                                                            } else {
                                                                                                                                                                                                                                                                                              if (j <= 9000) {
                                                                                                                                                                                                                                                                                                f = "Legends 忍"
                                                                                                                                                                                                                                                                                              } else if (j <= 10000) {
                                                                                                                                                                                                                                                                                                f = "Legends 忍"
                                                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                              }
                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                          }
                                                                                                                                                                                                                                        }
                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                    }
                                                                                                                                                                                                                                  }
                                                                                                                                                                                                                                }
                                                                                                                                                                                                                              }
                                                                                                                                                                                                                            }
                                                                                                                                                                                                                          }
                                                                                                                                                                                                                        }
                                                                                                                                                                                                                      }
                                                                                                                                                                                                                    }
                                                                                                                                                                                                                  }
                                                                                                                                                                                                                }
                                                                                                                                                                                                              }
                                                                                                                                                                                                            }
                                                                                                                                                                                                          }
                                                                                                                                                                                                        }
                                                                                                                                                                                                      }
                                                                                                                                                                                                    }
                                                                                                                                                                                                  }
                                                                                                                                                                                                }
                                                                                                                                                                                              }
                                                                                                                                                                                            }
                                                                                                                                                                                          }
                                                                                                                                                                                        }
                                                                                                                                                                                      }
                                                                                                                                                                                    }
                                                                                                                                                                                  }
                                                                                                                                                                                }
                                                                                                                                                                              }
                                                                                                                                                                            }
                                                                                                                                                                          }
                                                                                                                                                                        }
                                                                                                                                                                      }
                                                                                                                                                                    }
                                                                                                                                                                  }
                                                                                                                                                                }
                                                                                                                                                              }
                                                                                                                                                            }
                                                                                                                                                          }
                                                                                                                                                        }
                                                                                                                                                      }
                                                                                                                                                    }
                                                                                                                                                  }
                                                                                                                                                }
                                                                                                                                              }
                                                                                                                                            }
                                                                                                                                          }
                                                                                                                                        }
                                                                                                                                      }
                                                                                                                                    }
                                                                                                                                  }
                                                                                                                                }
                                                                                                                              }
                                                                                                                            }
                                                                                                                          }
                                                                                                                        }
                                                                                                                      }
                                                                                                                    }
                                                                                                                  }
                                                                                                                }
                                                                                                              }
                                                                                                            }
                                                                                                          }
                                                                                                        }
                                                                                                      }
                                                                                                    }
                                                                                                  }
                                                                                                }
                                                                                              }
                                                                                            }
                                                                                          }
                                                                                        }
                                                                                      }
                                                                                    }
                                                                                  }
                                                                                }
                                                                              }
                                                                            }
                                                                          }
                                                                        }
                                                                      }
                                                                    }
                                                                  }
                                                                }
                                                              }
                                                            }
                                                          }
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return f
  }
  
  filter = (j) => {
    if (j.length > 10) {
      return j.substr(j.length - 5)
    } else {
      if (j.length > 7) {
        return j.substr(j.length - 4)  
      } else {
        if (j.length > 5) {
          return j.substr(j.length - 3)
        } else {
          if (j.length > 2) {
            return j.substr(j.length - 2)  
          } else {
            if (j.length > 1) {
              return j.substr(j.length - 1)
            }
          }  
        }
      }
    }
  }
  
  randomString = (j, q) => {
    const defaultChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/+=*-%$();?!#@"
    q = q || defaultChars
    let L = ''
    for (let J = 0; J < j; J++) {
      let W = Math.floor(Math.random() * q.length) 
      L += q.substring(W, W + 1)
    }
    return L  
  }
  
  removeEmojis = (j) => {
    var emojiRegex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g
    return j.replace(emojiRegex, '')
  } 

  reSize = async (j, q, f) => {
    return new Promise(async (J, W) => {
      var D = await read(j)
      var resizedImage = await D.resize(q, f).getBufferAsync(MIME_JPEG)
      J(resizedImage)
    })
  }

  Styles = (text, style = 1) => {
    var xStr = 'abcdefghijklmnopqrstuvwxyz1234567890'.split('')
    var yStr = Object.freeze({
      1: 'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘqʀꜱᴛᴜᴠᴡxʏᴢ1234567890'
    })
    var replacer = []
    xStr.map((v, i) => replacer.push({
      original: v,
      convert: yStr[style].split('')[i]
    }))
    var str = text.toLowerCase().split('')
    var output = []
    str.map(v => {
      const find = replacer.find(x => x.original == v)
      find ? output.push(find.convert) : output.push(v)
    })
    return output.join('')
  }
  
  logFile = (j, q = "bot") => {
    const logStream = fs.createWriteStream(path.join(process.cwd(), q + ".log"), {
      'flags': 'a'
    })
    const timestamp = moment(new Date() * 1).format("DD/MM/YY HH:mm:ss")
    logStream.write('[' + timestamp + "] - " + j + "\n")
  }

  getEmoji = j => {
    const q = /[#*0-9]\uFE0F?\u20E3|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26AA\u26B0\u26B1\u26BD\u26BE\u26C4\u26C8\u26CF\u26D1\u26E9\u26F0-\u26F5\u26F7\u26F8\u26FA\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2757\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B55\u3030\u303D\u3297\u3299]\uFE0F?|[\u261D\u270C\u270D](?:\uFE0F|\uD83C[\uDFFB-\uDFFF])?|[\u270A\u270B](?:\uD83C[\uDFFB-\uDFFF])?|[\u23E9-\u23EC\u23F0\u23F3\u25FD\u2693\u26A1\u26AB\u26C5\u26CE\u26D4\u26EA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2795-\u2797\u27B0\u27BF\u2B50]|\u26D3\uFE0F?(?:\u200D\uD83D\uDCA5)?|\u26F9(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|\u2764\uFE0F?(?:\u200D(?:\uD83D\uDD25|\uD83E\uDE79))?|\uD83C(?:[\uDC04\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]\uFE0F?|[\uDF85\uDFC2\uDFC7](?:\uD83C[\uDFFB-\uDFFF])?|[\uDFC4\uDFCA](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDFCB\uDFCC](?:\uFE0F|\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF43\uDF45-\uDF4A\uDF4C-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uDDE6\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF]|\uDDE7\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF]|\uDDE8\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF]|\uDDE9\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF]|\uDDEA\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA]|\uDDEB\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7]|\uDDEC\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE]|\uDDED\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA]|\uDDEE\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9]|\uDDEF\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5]|\uDDF0\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF]|\uDDF1\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE]|\uDDF2\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF]|\uDDF3\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF]|\uDDF4\uD83C\uDDF2|\uDDF5\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE]|\uDDF6\uD83C\uDDE6|\uDDF7\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC]|\uDDF8\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF]|\uDDF9\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF]|\uDDFA\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF]|\uDDFB\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA]|\uDDFC\uD83C[\uDDEB\uDDF8]|\uDDFD\uD83C\uDDF0|\uDDFE\uD83C[\uDDEA\uDDF9]|\uDDFF\uD83C[\uDDE6\uDDF2\uDDFC]|\uDF44(?:\u200D\uD83D\uDFEB)?|\uDF4B(?:\u200D\uD83D\uDFE9)?|\uDFC3(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDFF3\uFE0F?(?:\u200D(?:\u26A7\uFE0F?|\uD83C\uDF08))?|\uDFF4(?:\u200D\u2620\uFE0F?|\uDB40\uDC67\uDB40\uDC62\uDB40(?:\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDC73\uDB40\uDC63\uDB40\uDC74|\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F)?)|\uD83D(?:[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3]\uFE0F?|[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC](?:\uD83C[\uDFFB-\uDFFF])?|[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4\uDEB5](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD74\uDD90](?:\uFE0F|\uD83C[\uDFFB-\uDFFF])?|[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC25\uDC27-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE41\uDE43\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED7\uDEDC-\uDEDF\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB\uDFF0]|\uDC08(?:\u200D\u2B1B)?|\uDC15(?:\u200D\uD83E\uDDBA)?|\uDC26(?:\u200D(?:\u2B1B|\uD83D\uDD25))?|\uDC3B(?:\u200D\u2744\uFE0F?)?|\uDC41\uFE0F?(?:\u200D\uD83D\uDDE8\uFE0F?)?|\uDC68(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDC68\uDC69]\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE])))?))?|\uDC69(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?[\uDC68\uDC69]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?|\uDC69\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?))|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFE])))?))?|\uDC6F(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDD75(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDE2E(?:\u200D\uD83D\uDCA8)?|\uDE35(?:\u200D\uD83D\uDCAB)?|\uDE36(?:\u200D\uD83C\uDF2B\uFE0F?)?|\uDE42(?:\u200D[\u2194\u2195]\uFE0F?)?|\uDEB6(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?)|\uD83E(?:[\uDD0C\uDD0F\uDD18-\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5\uDEC3-\uDEC5\uDEF0\uDEF2-\uDEF8](?:\uD83C[\uDFFB-\uDFFF])?|[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD\uDDCF\uDDD4\uDDD6-\uDDDD](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDDDE\uDDDF](?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD0D\uDD0E\uDD10-\uDD17\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCC\uDDD0\uDDE0-\uDDFF\uDE70-\uDE7C\uDE80-\uDE88\uDE90-\uDEBD\uDEBF-\uDEC2\uDECE-\uDEDB\uDEE0-\uDEE8]|\uDD3C(?:\u200D[\u2640\u2642]\uFE0F?|\uD83C[\uDFFB-\uDFFF])?|\uDDCE(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDDD1(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1|\uDDD1\u200D\uD83E\uDDD2(?:\u200D\uD83E\uDDD2)?|\uDDD2(?:\u200D\uD83E\uDDD2)?))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?))?|\uDEF1(?:\uD83C(?:\uDFFB(?:\u200D\uD83E\uDEF2\uD83C[\uDFFC-\uDFFF])?|\uDFFC(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFD-\uDFFF])?|\uDFFD(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])?|\uDFFE(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFD\uDFFF])?|\uDFFF(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFE])?))?)/g
    return j.match(q)
  }
  
  isEmojiPrefix = j => {
    const q = /^(?:[#*0-9]\uFE0F?\u20E3|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26AA\u26B0\u26B1\u26BD\u26BE\u26C4\u26C8\u26CF\u26D1\u26E9\u26F0-\u26F5\u26F7\u26F8\u26FA\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2757\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B55\u3030\u303D\u3297\u3299]\uFE0F?|[\u261D\u270C\u270D](?:\uFE0F|\uD83C[\uDFFB-\uDFFF])?|[\u270A\u270B](?:\uD83C[\uDFFB-\uDFFF])?|[\u23E9-\u23EC\u23F0\u23F3\u25FD\u2693\u26A1\u26AB\u26C5\u26CE\u26D4\u26EA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2795-\u2797\u27B0\u27BF\u2B50]|\u26D3\uFE0F?(?:\u200D\uD83D\uDCA5)?|\u26F9(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|\u2764\uFE0F?(?:\u200D(?:\uD83D\uDD25|\uD83E\uDE79))?|\uD83C(?:[\uDC04\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]\uFE0F?|[\uDF85\uDFC2\uDFC7](?:\uD83C[\uDFFB-\uDFFF])?|[\uDFC4\uDFCA](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDFCB\uDFCC](?:\uFE0F|\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF43\uDF45-\uDF4A\uDF4C-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uDDE6\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF]|\uDDE7\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF]|\uDDE8\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF]|\uDDE9\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF]|\uDDEA\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA]|\uDDEB\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7]|\uDDEC\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE]|\uDDED\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA]|\uDDEE\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9]|\uDDEF\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5]|\uDDF0\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF]|\uDDF1\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE]|\uDDF2\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF]|\uDDF3\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF]|\uDDF4\uD83C\uDDF2|\uDDF5\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE]|\uDDF6\uD83C\uDDE6|\uDDF7\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC]|\uDDF8\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF]|\uDDF9\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF]|\uDDFA\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF]|\uDDFB\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA]|\uDDFC\uD83C[\uDDEB\uDDF8]|\uDDFD\uD83C\uDDF0|\uDDFE\uD83C[\uDDEA\uDDF9]|\uDDFF\uD83C[\uDDE6\uDDF2\uDDFC]|\uDF44(?:\u200D\uD83D\uDFEB)?|\uDF4B(?:\u200D\uD83D\uDFE9)?|\uDFC3(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDFF3\uFE0F?(?:\u200D(?:\u26A7\uFE0F?|\uD83C\uDF08))?|\uDFF4(?:\u200D\u2620\uFE0F?|\uDB40\uDC67\uDB40\uDC62\uDB40(?:\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDC73\uDB40\uDC63\uDB40\uDC74|\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F)?)|\uD83D(?:[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3]\uFE0F?|[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC](?:\uD83C[\uDFFB-\uDFFF])?|[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4\uDEB5](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD74\uDD90](?:\uFE0F|\uD83C[\uDFFB-\uDFFF])?|[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC25\uDC27-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE41\uDE43\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED7\uDEDC-\uDEDF\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB\uDFF0]|\uDC08(?:\u200D\u2B1B)?|\uDC15(?:\u200D\uD83E\uDDBA)?|\uDC26(?:\u200D(?:\u2B1B|\uD83D\uDD25))?|\uDC3B(?:\u200D\u2744\uFE0F?)?|\uDC41\uFE0F?(?:\u200D\uD83D\uDDE8\uFE0F?)?|\uDC68(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDC68\uDC69]\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE])))?))?|\uDC69(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?[\uDC68\uDC69]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?|\uDC69\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?))|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFE])))?))?|\uDC6F(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDD75(?:\uFE0F|\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDE2E(?:\u200D\uD83D\uDCA8)?|\uDE35(?:\u200D\uD83D\uDCAB)?|\uDE36(?:\u200D\uD83C\uDF2B\uFE0F?)?|\uDE42(?:\u200D[\u2194\u2195]\uFE0F?)?|\uDEB6(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?)|\uD83E(?:[\uDD0C\uDD0F\uDD18-\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5\uDEC3-\uDEC5\uDEF0\uDEF2-\uDEF8](?:\uD83C[\uDFFB-\uDFFF])?|[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD\uDDCF\uDDD4\uDDD6-\uDDDD](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDDDE\uDDDF](?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD0D\uDD0E\uDD10-\uDD17\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCC\uDDD0\uDDE0-\uDDFF\uDE70-\uDE7C\uDE80-\uDE88\uDE90-\uDEBD\uDEBF-\uDEC2\uDECE-\uDEDB\uDEE0-\uDEE8]|\uDD3C(?:\u200D[\u2640\u2642]\uFE0F?|\uD83C[\uDFFB-\uDFFF])?|\uDDCE(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDDD1(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1|\uDDD1\u200D\uD83E\uDDD2(?:\u200D\uD83E\uDDD2)?|\uDDD2(?:\u200D\uD83E\uDDD2)?))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?))?|\uDEF1(?:\uD83C(?:\uDFFB(?:\u200D\uD83E\uDEF2\uD83C[\uDFFC-\uDFFF])?|\uDFFC(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFD-\uDFFF])?|\uDFFD(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])?|\uDFFE(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFD\uDFFF])?|\uDFFF(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFE])?))?))\w+/
    return q.test(j)
  }
  
  getDevice = j => {
    if (j.length > 21) {
      return "Android"
    }
    else if (j.substring(0, 2) === '3A') {
      return "IOS"
    }
    else {
      return "WhatsApp Web"
    }
  }
}