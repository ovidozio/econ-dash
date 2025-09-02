export function colorForKey(key: string): string {
  let h = 0;
  for (let i=0; i<key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return `hsl(${h % 360} 60% 45%)`;
}

