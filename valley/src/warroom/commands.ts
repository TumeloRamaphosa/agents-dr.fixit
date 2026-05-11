export interface ParsedCommand {
  command: string;
  args: string[];
  raw: string;
}

export function parseCommand(input: string): ParsedCommand {
  const trimmed = input.trim();
  
  if (trimmed.startsWith('/')) {
    const parts = trimmed.slice(1).split(/\s+/);
    return { command: parts[0], args: parts.slice(1), raw: trimmed };
  }

  if (trimmed.startsWith('@')) {
    const match = trimmed.match(/^@(\S+)(?:\s+--model\s+(\S+))?\s*(.*)/);
    if (match) {
      return { command: 'mention', args: [match[1], match[2] || '', match[3] || ''].filter(Boolean), raw: trimmed };
    }
    const parts = trimmed.split(/\s+/);
    return { command: 'mention', args: [parts[0].slice(1), ...parts.slice(1)], raw: trimmed };
  }

  if (trimmed.startsWith('warroom')) {
    const parts = trimmed.split(/\s+/);
    return { command: 'warroom', args: parts.slice(1), raw: trimmed };
  }

  return { command: 'unknown', args: [trimmed], raw: trimmed };
}

export function validateCommand(command: ParsedCommand, context: { sessionActive: boolean }): { valid: boolean; reason?: string } {
  switch (command.command) {
    case 'warroom':
      if (command.args[0] === 'start' && context.sessionActive) return { valid: false, reason: 'Session already active' };
      return { valid: true };
    case 'mention':
      return { valid: true };
    case 'decide':
    case 'end':
      return { valid: true };
    case 'unknown':
      return { valid: true };
    default:
      return { valid: true };
  }
}
