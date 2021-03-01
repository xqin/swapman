const Table = require('cli-table-cjk')
const prettyBytes = require('pretty-bytes')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
})

const items = {}

setInterval(() => {
  const process = Object.values(items)

  if (process.length < 1) {
    return
  }

  console.clear()

  const table = new Table({
    head: [ 'Process', 'Swap In', 'Swap Out', 'In Page', 'Out Page' ],
    colWidths: [50, 15, 15, 15, 15],
  })

  table.push.apply(
    table,
    process
    .sort((b, a) => {
      let r = a.totalOutBytes - b.totalOutBytes

      if (r !== 0) {
        return r
      }

      return a.totalInBytes - b.totalInBytes
    })
    .slice(0, 15) // top 15
    .map(({ cmd, totalInBytes, totalOutBytes, totalInCount, totalOutCount }) => [cmd, prettyBytes(totalInBytes), prettyBytes(totalOutBytes), totalInCount, totalOutCount])
  )

  console.log(table.toString())
}, 500)

rl.on('line', function (line) {
  if (!/Pg(In|Out).+ B=0x([0-9a-f]+) .+\.\d+ W (.+?)\.(\d+)$/.test(line)) {
    return
  }

  const type = RegExp.$1 // In/Out
  const bytes = parseInt(RegExp.$2, 0x10) // 按 16 进制 转换为数字
  const cmd = RegExp.$3

  if (typeof items[cmd] === 'undefined') {
    items[cmd] = {
      totalInBytes: 0,
      totalOutBytes: 0,
      totalInCount: 0,
      totalOutCount: 0,
      cmd: cmd,
    }
  }

  items[cmd][`total${type}Bytes`] += bytes
  items[cmd][`total${type}Count`]++
})