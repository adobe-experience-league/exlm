/** One published line is its own pre and ends with a newline. Join those into one code string. */
export default function joinCodeLines(lines) {
  return lines.map((line) => line.replace(/\n$/, '')).join('\n');
}
