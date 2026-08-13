/**
 * Everything the seven commands share: how a flag is read, where a path points,
 * which environment file wins, and how a receipt is written to disk.
 *
 * Every command in `src/` is a top-level script, not a library. They import this
 * module, read their options from it at start-up, do one job, and exit. Its
 * contract is pinned by `scripts/verify-cli-contract.ts` (`npm run verify:cli`).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

/** The directory `npm run …` was invoked from, which is the repo root. */
export const ROOT = process.cwd();

// Defect D1. Every command here is a module body with no `main()`, so a guard
// that throws — a missing key, a missing file, a config path that is not there —
// reaches Node's default handler and its perfectly good sentence comes out
// buried under a stack trace with ESM loader frames. A first-time reader sees
// "the tool is broken" instead of "I have not configured this yet". All seven
// commands import this module, so the handler goes here once rather than as a
// try/catch in each of them, and it covers the guards inside `readConfig` and
// `numberOption` too, which no per-command wrapper would reach.
// The messages are unchanged; only the framing around them is. Set SEO_DEBUG=1
// to get the stack back when the error is a real bug rather than a missing key.
process.on("uncaughtException", (error) => {
  console.error(process.env.SEO_DEBUG ? error.stack : error.message);
  process.exit(1);
});

const args = process.argv.slice(2);

/** The shape of the file passed as `--config`; see `config/seo-workflow.config.example.json`. */
type WorkflowConfig = {
  baseUrl?: string;
  siteRoot?: string;
  publicDir?: string;
  rootHtml?: string;
  publicRoutes?: string[];
  privatePatterns?: string[];
  requiredRootMarkers?: string[];
  privateNoindexRequired?: boolean;
};

// Load `.env` then `.env.local`. A variable already present in the real
// environment beats both, and `.env` beats `.env.local` because it goes first —
// so a value passed inline (`SEO_BASE_URL=… npm run audit`) is never silently
// overwritten by a file. `process.loadEnvFile` applies exactly that precedence;
// it replaced a hand-rolled parser here, and the two were diffed key-by-key on
// this repo's own `.env.example` before the swap.
for (const file of [".env", ".env.local"]) {
  const path = fromRoot(file);
  if (existsSync(path)) process.loadEnvFile(path);
}

/** `--name value` or `--name=value`; undefined when absent or followed by another flag. */
export function optionValue(name: string): string | undefined {
  const prefix = `${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
  if (inline !== undefined) return inline;
  const index = args.indexOf(name);
  const next = args[index + 1];
  return index >= 0 && next && !next.startsWith("--") ? next : undefined;
}

/** Every occurrence of a repeatable option, e.g. `--route / --route /pricing/`. */
export function optionValues(name: string): string[] {
  const values: string[] = [];
  const prefix = `${name}=`;
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith(prefix)) values.push(args[i].slice(prefix.length));
    else if (args[i] === name && args[i + 1] && !args[i + 1].startsWith("--")) values.push(args[++i]);
  }
  return values;
}

export function hasFlag(name: string): boolean {
  return args.includes(name);
}

/** A numeric option that refuses a value outside its range instead of clamping it. */
export function numberOption(name: string, fallback: number, min = 1, max = Number.MAX_SAFE_INTEGER): number {
  const value = optionValue(name);
  if (value === undefined) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) throw new Error(`${name} must be between ${min} and ${max}`);
  return parsed;
}

export function readConfig(): WorkflowConfig {
  const configPath = optionValue("--config") ?? process.env.SEO_WORKFLOW_CONFIG;
  if (!configPath) return {};
  const path = fromRoot(configPath);
  if (!existsSync(path)) throw new Error(`Config not found: ${configPath}`);
  return JSON.parse(readFileSync(path, "utf8")) as WorkflowConfig;
}

/** Resolve a user-supplied path: an absolute one stays put, a relative one hangs off the repo root. */
export function fromRoot(path: string): string {
  return resolve(ROOT, path);
}

/** Receipts are read on every platform, so their paths are always written with forward slashes. */
export function slash(path: string): string {
  return path.replace(/\\/g, "/");
}

export function writeJson(path: string, data: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

export function writeText(path: string, text: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
}

/** Keep one finding inside one Markdown table cell: no stray pipes, no wrapped rows. */
export function escapeMd(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

export function cell(value: string | undefined): string {
  return value ? escapeMd(value) : "";
}

/** Print an ffmpeg argument the way a shell would need it, for `--dry-run` output. */
export function quote(value: string): string {
  return /^[A-Za-z0-9_./:=+-]+$/.test(value) ? value : JSON.stringify(value);
}

export function urlFor(baseUrl: string, route: string): string {
  if (/^https?:\/\//i.test(route)) return route;
  return `${baseUrl.replace(/\/$/, "")}${route.startsWith("/") ? "" : "/"}${route}`;
}
