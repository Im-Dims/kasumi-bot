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