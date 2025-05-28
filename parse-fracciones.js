#!/usr/bin/env node
/**
 * scripts/parse-fracciones.js
 *
 * Llegeix l'index.html de Fracciones_rítmicas al repo encapsulated,
 * extreu els <script> i <style> inline i crea fitxers externs
 * a apps/app1/scripts/main.js i apps/app1/styles/main.css,
 * i finalment desa un nou index.html net a apps/app1/index.html.
 */

const fs      = require('fs');
const path    = require('path');
const cheerio = require('cheerio');

const ROOT      = process.cwd();
const SRC_HTML  = path.resolve(ROOT, '../encapsulated/Fracciones_rítmicas/index.html');
const OUT_DIR   = path.resolve(ROOT, 'apps/app1');
const OUT_HTML  = path.join(OUT_DIR, 'index.html');
const OUT_JS    = path.join(OUT_DIR, 'scripts/main.js');
const OUT_CSS   = path.join(OUT_DIR, 'styles/main.css');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function run() {
  // 1. Llegeix l’HTML original
  const html = fs.readFileSync(SRC_HTML, 'utf-8');
  const $    = cheerio.load(html);

  // 2. Extreu i buida scripts inline
  let allJs = '';
  $('script:not([src])').each((i, el) => {
    allJs += $(el).html().trim() + '\n\n';
    $(el).remove();  // treu el bloc de l’HTML
  });

  // 3. Extreu i buida styles inline
  let allCss = '';
  $('style').each((i, el) => {
    allCss += $(el).html().trim() + '\n\n';
    $(el).remove();
  });

  // 4. Prepara la carpeta de sortida
  ensureDir(path.dirname(OUT_JS));
  ensureDir(path.dirname(OUT_CSS));
  ensureDir(OUT_DIR);

  // 5. Escriu els fitxers externs
  fs.writeFileSync(OUT_JS, allJs,  'utf-8');
  fs.writeFileSync(OUT_CSS, allCss,'utf-8');

  // 6. Afegeix referències a l’HTML net
  $('head').append('\n  <link rel="stylesheet" href="./styles/main.css">');
  $('body').append('\n  <script src="./scripts/main.js"></script>');

  // 7. Desa l’HTML net
  fs.writeFileSync(OUT_HTML, $.html(), 'utf-8');

  console.log('✅ Parsed! Fitxers creats a apps/app1/{index.html,scripts,styles}');
}

run();
