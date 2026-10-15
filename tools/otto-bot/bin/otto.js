#!/usr/bin/env node
import { main } from '../lib/cli.js';

process.exitCode = await main(process.argv.slice(2));
