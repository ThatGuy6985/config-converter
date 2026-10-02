import { AWG_PRESETS } from './exporters/amnezia.js';

class StateStore {
  constructor() {
    this.listeners = new Set();
    this.state = {
      mode: 'paste', 
      currentTab: 'amnezia', 
      configs: [],
      allExpanded: false,
      isQrOpen: false,
      settings: {
        dns: '1.1.1.1',
        mtu: 1280,
        keepalive: 25,
        irBypass: true,
        useNoise: true,
        useFragment: true,
        allowLan: false, 
        awgPreset: 'noisy',
        awg: { ...AWG_PRESETS.noisy.params }
      },
      status: {
        visible: false,
        type: 'info', 
        message: '',
        details: []
      },
      report: null
    };
  }

  getState() {
    return this.state;
  }

  setState(partial) {
    this.state = {
      ...this.state,
      ...partial,
      settings: partial.settings ? { ...this.state.settings, ...partial.settings } : this.state.settings,
      status: partial.status ? { ...this.state.status, ...partial.status } : this.state.status
    };
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (err) {
        console.error('State listener error:', err);
      }
    }
  }

  setMode(mode) {
    this.setState({ mode });
  }

  setCurrentTab(tab) {
    this.setState({ currentTab: tab });
  }

  setConfigs(configs) {
    this.setState({ configs });
  }

  toggleExpandAll() {
    this.setState({ allExpanded: !this.state.allExpanded });
  }

  setSettings(newSettings) {
    this.setState({
      settings: {
        ...this.state.settings,
        ...newSettings
      }
    });
  }

  setStatus(type, message, details = []) {
    this.setState({
      status: {
        visible: true,
        type,
        message,
        details
      }
    });
  }

  clearStatus() {
    this.setState({
      status: {
        visible: false,
        type: 'info',
        message: '',
        details: []
      }
    });
  }

  setReport(report) {
    this.setState({ report });
  }
}

export const store = new StateStore();
