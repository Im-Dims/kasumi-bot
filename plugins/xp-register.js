const { createHash } = require('crypto')

let Reg = /\|?(.*)([.|] *?)([0-9]*)$/i
let handler = async function (m, { conn, text, usedPrefix, command }) {
  let user = db.data.users[m.sender]
  if (user.registered === true) return m.reply(`Your number has been registered, if you want to re-register, send it ${usedPrefix + command} sn`)
  if (!Reg.test(text)) return m.reply(Func.example(usedPrefix, command, 'kasumi.15'))
  let [_, name, splitter, age] = text.match(Reg)
  if (name == 'kasumi') return conn.reply(m.chat, Func.texted('bold', 'Kenapa make namaku om??'), m)
  if (!name) return m.reply('Enter your name')
  if (!age) return m.reply('Enter your age')
  age = parseInt(age)
  if (name.length > 20) return m.reply('Name is too long')
  if (age > 80) return m.reply('Too old')
  if (age < 5) return m.reply('Too young, can babies type?')
  user.name = name.trim()
  user.age = age
  user.regTime = +new Date()
  user.registered = true
  user.limit += 100
  user.exp += 20000
  user.money += 10000
  let sn = createHash('md5').update(m.sender).digest('hex')
  let teks = `*Registered successfully*\n\n`
  teks += `∘ Name : ${name}\n`
  teks += `∘ Age : ${age} years old\n`
  teks += `∘ SN : ${sn}\n\n`
  teks += `*Registration Bonus*\n*`
  teks += `+ 100 limit\n`
  teks += `+ 20.000 exp\n`
  teks += `+ 10.000 money\n\n`
  teks += global.set.footer 
  m.reply(teks)
}
handler.help = ['register'].map((v) => v + '')
handler.tags = ['xp']
handler.command = ['reg', 'register', 'daftar']

module.exports = handler