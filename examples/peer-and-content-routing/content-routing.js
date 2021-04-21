/* eslint-disable no-console */
'use strict'

const Libp2p = require('../../')
const TCP = require('libp2p-tcp')
const Mplex = require('libp2p-mplex')
const { NOISE } = require('libp2p-noise')
const MulticastDNS = require('libp2p-mdns')
const { node } = require('execa')
const CID = require('cids')
const KadDHT = require('libp2p-kad-dht')

const all = require('it-all')
const delay = require('delay')
const readline = require('readline')

const JsonToArray = require('./utils.js').JsonToArray
const arrayToString = require('./utils.js').arrayToString
const stringToArray = require('./utils.js').stringToArray

const createNode = async () => {
  const node = await Libp2p.create({
    addresses: {
      listen: ['/ip4/0.0.0.0/tcp/0']
    },
    modules: {
      transport: [TCP],
      streamMuxer: [Mplex],
      connEncryption: [NOISE],
      peerDiscovery: [MulticastDNS],
      dht: KadDHT
    },
    config: {
      peerDiscovery: {
        [MulticastDNS.tag]: {
          interval: 20e3,
          enabled: true
        }
      },
      dht: {
          enabled: true
      }
    }
  })

  return node
}

;(async () => {
    const [host_node] = await Promise.all([
        createNode()
      ])

  host_node.on('peer:discovery', (peerId) => console.log('Discovered:', peerId.toB58String()))

  host_node.connectionManager.on('peer:connect', (connection) => {
    console.log('Connection established to:', connection.remotePeer.toB58String())	// Emitted when a new connection has been created
  })

  await host_node.start()

  // Wait for onConnect handlers in the DHT
  await delay(500)

//   const cid = new CID('QmTp9VkYvnHyrqKQuFPiuZkiX9gPcqj6x5LJ1rmWuSySnL')

//   await host_node.contentRouting.put(Uint8Array.from([5]), Uint8Array.from([7,11,13,17]))
//   await host_node.contentRouting.put(Uint8Array.from([5]), Uint8Array.from([7,11,13,23]))
//   await host_node.contentRouting.put(Uint8Array.from([5]), Uint8Array.from([7,11,13,27]))
//   await host_node.contentRouting.provide(cid)

//   console.log(await host_node.contentRouting.getMany(Uint8Array.from([5]), 3))

  // main command loop

  function get_user_cmd() {
    return new Promise(function(resolve, reject) {
        let rl = readline.createInterface(process.stdin, process.stdout)

        rl.setPrompt("[GET | PUT] [<stock ticker>] review: ")
        rl.prompt();

        rl.on('line', async function(line) {
          if (line === "exit" || line === "quit" || line == 'q') {
            rl.close()
            return
          }

          var args = line.split(" ")

          if (args[0].toUpperCase() === "GET") {
            if (args.len < 2) {
                console.log("Invalid input")
                rl.prompt()
              }
              try {
                await host_node.contentRouting.get(stringToArray(args[1]))
              } catch (err) {
                console.log(err.code)
              }
          }

          else if (args[0].toUpperCase() == "PUT") {
              if (args.len < 3) {
                console.log("Invalid input")
                rl.prompt()
              }
              try {
                  await host_node.contentRouting.put(stringToArray(args[1]), JsonToArray({
                      nick: host_node.toB58String(),
                      opinion: args[2]
                  }))
              } catch (err) {
                  console.log(err.code)
              }
          }

          else {
              console.log("Invalid input")
          }
          rl.prompt()
        }).on('close',function(){
          resolve()
        });
      })
  }

  await get_user_cmd()
})();