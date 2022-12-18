import * as Command from './commands.js';
import { cast } from './token.js';
import { format, output } from './util.js';

import fs from 'fs';

/**
 * parse a Clover program
 * @param {string} code
 * @param {Object} [options]
 * @param {boolean} options.silent whether to silence output. good for tests
 */
export default function parse (code, options = {}) {
  global.Clover = {};
  global.CloverError = class CloverError {
    constructor (message, ...subs) {
      this.message = format(message, ...subs);
    }
  };

  // implicit input
  let input;
  try {
    input = cast(
      fs.readFileSync('input.txt', { encoding: 'utf-8' }).trim()
    );
  } catch (e) {
    input = '';
  }

  Clover.outputs = [];
  Clover.options = options;

  // commands act on the focus list.
  // this is a list of items, each with their own "working value",
  // as well as their own mutable storage.
  // at first, there is just one item, which works with the input
  Clover.focus = [{
    input,
    working: input
  }];

  Clover.line = 0;

  code = code.split('\n')
    .map(line => line.replace(/;.*/gm, '').trim()); // clean

  // remove trailing blank line
  // (formed by trailing newline in the original code)
  if (code.at(-1).length === 0) {
    code = code.slice(0, -1);
  }

  for (const line of code) {
    Clover.line++;
    // skip empty lines
    if (line.length === 0) {
      continue;
    }
    // each line of code holds a single command
    // tokenize and evaluate
    Command.evaluate(line);
    // the `stop` command will set this value to true for an early break
    if (Clover.stop) {
      break;
    }
  }

  // implicit output
  output(Clover.focus);

  // collapse
  let collapsed = Clover.outputs.flat(Infinity)
    .map(item => {
      if (item.working === undefined) {
        return item;
      }
      return item.working;
    });
  // for a single-item array, return the item itself instead
  if (collapsed.length === 1) {
    collapsed = collapsed[0];
  }
  return collapsed;
}
