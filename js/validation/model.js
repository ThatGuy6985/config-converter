/**
 * Normalized Model Constraint Validation
 */

import { isValidPort, isValidUuid, isValidBase64Key } from './input.js';

export function validateNormalizedModel(model) {
  if (!model || typeof model !== 'object') {
    return { valid: false, errors: ['Model must be an object'] };
  }

  const errors = [];
  const warnings = [];

  switch (model.protocol) {
    case 'vless': {
      if (!model.server?.address) errors.push('VLESS model missing server address');
      if (!isValidPort(model.server?.port)) errors.push(`VLESS server port (${model.server?.port}) is invalid`);
      if (!model.authentication?.uuid) {
        errors.push('VLESS model missing client UUID');
      } else if (!isValidUuid(model.authentication.uuid)) {
        warnings.push(`Client UUID '${model.authentication.uuid}' does not strictly match RFC 4122 pattern`);
      }
      if (model.security?.type === 'reality') {
        if (!model.security?.publicKey) warnings.push('Reality security enabled but Reality Public Key (pbk) is missing');
        if (!model.security?.serverName) warnings.push('Reality security enabled but SNI / serverName is missing');
      }
      break;
    }

    case 'trojan': {
      if (!model.server?.address) errors.push('Trojan model missing server address');
      if (!isValidPort(model.server?.port)) errors.push(`Trojan server port (${model.server?.port}) is invalid`);
      if (!model.authentication?.password) errors.push('Trojan model missing authentication password');
      break;
    }

    case 'vmess': {
      if (!model.server?.address) errors.push('VMess model missing server address');
      if (!isValidPort(model.server?.port)) errors.push(`VMess server port (${model.server?.port}) is invalid`);
      if (!model.authentication?.uuid) {
        errors.push('VMess model missing client UUID');
      } else if (!isValidUuid(model.authentication.uuid)) {
        warnings.push(`VMess UUID '${model.authentication.uuid}' does not match standard RFC 4122 format`);
      }
      break;
    }

    case 'wireguard': {
      if (!model.interface?.privateKey) {
        errors.push('WireGuard model missing Interface PrivateKey');
      } else if (!isValidBase64Key(model.interface.privateKey)) {
        warnings.push('WireGuard PrivateKey is not a standard 32-byte Base64 key');
      }

      if (!Array.isArray(model.peers) || model.peers.length === 0) {
        errors.push('WireGuard model must have at least one Peer');
      } else {
        model.peers.forEach((peer, idx) => {
          if (!peer.publicKey) {
            errors.push(`Peer ${idx + 1} is missing PublicKey`);
          } else if (!isValidBase64Key(peer.publicKey)) {
            warnings.push(`Peer ${idx + 1} PublicKey is not a standard 32-byte Base64 key`);
          }

          if (!peer.endpoint?.host) {
            errors.push(`Peer ${idx + 1} is missing Endpoint host`);
          }
          if (!isValidPort(peer.endpoint?.port)) {
            errors.push(`Peer ${idx + 1} endpoint port (${peer.endpoint?.port}) is invalid`);
          }
        });
      }
      break;
    }

    default:
      errors.push(`Unsupported protocol: ${model.protocol}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
