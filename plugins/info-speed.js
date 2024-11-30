let os = require('os')
let util = require('util')
let { performance } = require('perf_hooks')
let { sizeFormatter } = require('human-readable')
let format = sizeFormatter({
  std: 'JEDEC', // 'SI' (default) | 'IEC' | 'JEDEC'
  decimalPlaces: 2,
  keepTrailingZeroes: false,
  render: (literal, symbol) => `${literal} ${symbol}B`,
})

let handler = async (m, { conn }) => {
  const used = process.memoryUsage()
  const cpus = os.cpus().map(cpu => {
    cpu.total = Object.keys(cpu.times).reduce((last, type) => last + cpu.times[type], 0)
    return cpu
  })
  const cpu = cpus.reduce((last, cpu, _, { length }) => {
    last.total += cpu.total
    last.speed += cpu.speed / length
    last.times.user += cpu.times.user
    last.times.nice += cpu.times.nice
    last.times.sys += cpu.times.sys
    last.times.idle += cpu.times.idle
    last.times.irq += cpu.times.irq
    return last
  }, {
    speed: 0,
    total: 0,
    times: {
      user: 0,
      nice: 0,
      sys: 0,
      idle: 0,
      irq: 0
    }
  })
  let old = performance.now()
  let neww = performance.now()
  let speed = neww - old
  let loli = `Server Information\n\n`
  loli += `${cpus.length} CPU : ${cpus[0].model} (${cpu.speed} MHZ)\n\n`
  loli += `Uptime : ${Func.toDate(process.uptime() * 1000)}\n`
  loli += `RAM : ${format(os.totalmem() - os.freemem())} / ${format(os.totalmem())}\n`
  loli += `Speed : ${speed} ms\n`
  loli += `${Object.keys(used).map((key, _, arr) => `${key.padEnd(Math.max(...arr.map(v => v.length)), ' ')} : ${format(used[key])}`).join('\n')}`
  m.reply(Func.texted('monospace', loli))
}
handler.help = ['ping']
handler.tags = ['info']
handler.command = ['ping', 'speed']

module.exports = handler