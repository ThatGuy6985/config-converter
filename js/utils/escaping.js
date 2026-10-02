export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escapeYamlString(val) {
  if (val === null || val === undefined) return '""';
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  const str = String(val);

  const escaped = str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');

  return `"${escaped}"`;
}

export function serializeYaml(obj, indent = 0) {
  const pad = '  '.repeat(indent);

  if (obj === null || obj === undefined) {
    return `${pad}null\n`;
  }

  if (typeof obj === 'boolean' || typeof obj === 'number') {
    return `${pad}${obj}\n`;
  }

  if (typeof obj === 'string') {
    return `${pad}${escapeYamlString(obj)}\n`;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return `${pad}[]\n`;
    let out = '';
    for (const item of obj) {
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        const entries = Object.entries(item);
        if (entries.length === 0) {
          out += `${pad}- {}\n`;
        } else {
          const [firstKey, firstVal] = entries[0];
          out += `${pad}- ${firstKey}:`;
          if (typeof firstVal === 'object' && firstVal !== null) {
            out += '\n' + serializeYaml(firstVal, indent + 2);
          } else {
            out += ` ${escapeYamlString(firstVal)}\n`;
          }
          for (let i = 1; i < entries.length; i++) {
            const [k, v] = entries[i];
            if (typeof v === 'object' && v !== null) {
              out += `${pad}  ${k}:\n${serializeYaml(v, indent + 2)}`;
            } else {
              out += `${pad}  ${k}: ${escapeYamlString(v)}\n`;
            }
          }
        }
      } else {
        out += `${pad}- ${escapeYamlString(item)}\n`;
      }
    }
    return out;
  }

  if (typeof obj === 'object') {
    let out = '';
    for (const [key, val] of Object.entries(obj)) {
      if (val === undefined) continue;
      if (typeof val === 'object' && val !== null) {
        if (Array.isArray(val) && val.length === 0) {
          out += `${pad}${key}: []\n`;
        } else if (!Array.isArray(val) && Object.keys(val).length === 0) {
          out += `${pad}${key}: {}\n`;
        } else {
          out += `${pad}${key}:\n${serializeYaml(val, indent + 1)}`;
        }
      } else {
        out += `${pad}${key}: ${escapeYamlString(val)}\n`;
      }
    }
    return out;
  }

  return `${pad}${escapeYamlString(obj)}\n`;
}
