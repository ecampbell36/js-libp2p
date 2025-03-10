'use strict'

// Pubsub adapter to keep API with handlers while not removed.
/**
 * @typedef {import('libp2p-interfaces/src/pubsub').InMessage} InMessage
 * @typedef {import('libp2p-interfaces/src/pubsub')} PubsubRouter
 */

/**
 * @param {import("libp2p-interfaces/src/pubsub")} PubsubRouter
 * @param {import('.')} libp2p
 * @param {{ enabled: boolean; } & import(".").PubsubLocalOptions & import("libp2p-interfaces/src/pubsub").PubsubOptions} options
 */
function pubsubAdapter (PubsubRouter, libp2p, options) {
  // @ts-ignore Pubsub constructor type not defined
  const pubsub = new PubsubRouter(libp2p, options)
  pubsub._subscribeAdapter = pubsub.subscribe
  pubsub._unsubscribeAdapter = pubsub.unsubscribe

  /**
   * Subscribes to a given topic.
   *
   * @override
   * @param {string} topic
   * @param {(msg: InMessage) => void} [handler]
   * @returns {void}
   */
  function subscribe (topic, handler) {
    // Bind provided handler
    handler && pubsub.on(topic, handler)
    pubsub._subscribeAdapter(topic)
  }

  /**
   * Unsubscribe from the given topic.
   *
   * @override
   * @param {string} topic
   * @param {(msg: InMessage) => void} [handler]
   * @returns {void}
   */
  function unsubscribe (topic, handler) {
    if (!handler) {
      pubsub.removeAllListeners(topic)
    } else {
      pubsub.removeListener(topic, handler)
    }

    if (pubsub.listenerCount(topic) === 0) {
      pubsub._unsubscribeAdapter(topic)
    }
  }

  pubsub.subscribe = subscribe
  pubsub.unsubscribe = unsubscribe

  return pubsub
}

module.exports = pubsubAdapter
