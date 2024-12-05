const moment = require('moment-timezone')
moment.tz.setDefault('Asia/Jakarta')

module.exports = Object.assign(async function handler(m, { conn }) {
  try {
    let anu = await Func.fetchJson('https://api.github.com/repos/Im-Dims/kasumi-bot')
    let capt = `⼷ *Script*\n\n`
    capt += `┌  ◎  *Name* : ${anu.name}\n`
    capt += `│  ◎  *Size* : ${(anu.size / 1024).toFixed(2)} MB\n`
    capt += `│  ◎  *Updated* : ${moment(anu.updated_at).format('DD/MM/YY - HH:mm:ss')}\n`
    capt += `│  ◎  *Url* : ${anu.html_url}\n`
    capt += `│  ◎  *Forks* : ${anu.forks_count}\n`
    capt += `│  ◎  *Stars* : ${anu.stargazers_count}\n`
    capt += `└  ◎  *Issues* : ${anu.open_issues_count}\n\n`
    capt += global.set.footer
    conn.sendMessageModify(m.chat, capt, m, {
      title: 'Kasumi - Bot',
      body: '',
      largeThumb: true,
      url: 'https://github.com/Im-Dims/kasumi-bot'
    })
  } catch (e) {
    console.log(e)
    return conn.reply(m.chat, Func.jsonFormat(e), m)
  }
}, {
  help: ['script'],
  tags: ['info'],
  command: ['script', 'sc']
})