module.exports = {
  run: async (m, { conn }) => {
    await conn.reply(m.chat, Func.texted('bold', 'Restarting . . .'), m).then(async () => {
      await global.db.write()  
      process.send('reset')
    })
  },
  help: ['restart'],
  tags: ['owner'],
  command: /^(restart|debounce)$/i,
  owner: true
}