import EventEmitter from 'events';

class Discovery extends EventEmitter {
  discover(payload) {
    this.emit('discover', payload);
  }
}

export default new Discovery();
