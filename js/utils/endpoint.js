export function parseEndpoint(endpoint, defaultPort = 51820) {
  if (!endpoint || typeof endpoint !== 'string') {
    return { valid: false, error: 'Endpoint must be a non-empty string' };
  }

  const trimmed = endpoint.trim();
  if (!trimmed) {
    return { valid: false, error: 'Endpoint cannot be blank' };
  }

  const ipv6Match = trimmed.match(/^\[([a-fA-F0-9:]+)\](?::(\d+))?$/);
  if (ipv6Match) {
    const host = ipv6Match[1];
    const portStr = ipv6Match[2];
    const port = portStr ? parseInt(portStr, 10) : defaultPort;

    if (port < 1 || port > 65535 || isNaN(port)) {
      return { valid: false, error: `Invalid port ${portStr}: must be between 1 and 65535` };
    }
    return { valid: true, host, port, isIpv6: true };
  }

  const colonCount = (trimmed.match(/:/g) || []).length;
  if (colonCount > 1) {

    return { valid: false, error: 'IPv6 endpoints with port must be enclosed in square brackets: [ipv6]:port' };
  }

  const lastColon = trimmed.lastIndexOf(':');
  if (lastColon > 0) {
    const host = trimmed.slice(0, lastColon);
    const portStr = trimmed.slice(lastColon + 1);

    if (!/^\d+$/.test(portStr)) {
      return { valid: false, error: `Port '${portStr}' is not a valid number` };
    }

    const port = parseInt(portStr, 10);
    if (port < 1 || port > 65535) {
      return { valid: false, error: `Invalid port ${port}: must be between 1 and 65535` };
    }

    if (!host) {
      return { valid: false, error: 'Missing host in endpoint' };
    }

    return { valid: true, host, port, isIpv6: false };
  }

  if (defaultPort < 1 || defaultPort > 65535) {
    return { valid: false, error: `Invalid default port ${defaultPort}` };
  }

  return { valid: true, host: trimmed, port: defaultPort, isIpv6: false };
}
