/**
 * Abstract Routing Policy and Target-Specific Translators
 */

export function createRoutingPolicy(options = {}) {
  const irBypass = options.irBypass ?? true;
  const privateBypass = options.privateBypass ?? true;
  const proxyTag = options.proxyTag || 'Proxy-Group';

  return {
    private: privateBypass ? 'direct' : 'proxy',
    iran: irBypass ? 'direct' : 'proxy',
    default: 'proxy',
    proxyTag
  };
}

/**
 * Translates abstract routing policy into Clash Meta rules list.
 */
export function translateRoutingToClash(policy) {
  const rules = [];

  if (policy.private === 'direct') {
    rules.push('GEOIP,lan,DIRECT,no-resolve');
    rules.push('GEOIP,private,DIRECT,no-resolve');
  }

  if (policy.iran === 'direct') {
    rules.push('GEOIP,IR,DIRECT,no-resolve');
    rules.push('GEOSITE,category-ir,DIRECT');
  }

  rules.push(`MATCH,${policy.proxyTag}`);
  return rules;
}

/**
 * Translates abstract routing policy into Sing-Box route rules.
 */
export function translateRoutingToSingBox(policy) {
  const rules = [];

  if (policy.private === 'direct') {
    rules.push({
      geoip: ['private'],
      outbound: 'direct'
    });
  }

  if (policy.iran === 'direct') {
    rules.push({
      geoip: ['ir'],
      outbound: 'direct'
    });
    rules.push({
      geosite: ['category-ir'],
      outbound: 'direct'
    });
  }

  return rules;
}

/**
 * Translates abstract routing policy into Xray routing rules.
 */
export function translateRoutingToXray(policy) {
  const rules = [];

  const directIps = [];
  if (policy.private === 'direct') directIps.push('geoip:private');
  if (policy.iran === 'direct') directIps.push('geoip:ir');

  if (directIps.length > 0) {
    rules.push({
      type: 'field',
      ip: directIps,
      outboundTag: 'direct'
    });
  }

  if (policy.iran === 'direct') {
    rules.push({
      type: 'field',
      domain: ['regexp:.*\\.ir$', 'geosite:category-ir'],
      outboundTag: 'direct'
    });
  }

  rules.push({
    type: 'field',
    network: 'tcp,udp',
    outboundTag: policy.proxyTag
  });

  return rules;
}
