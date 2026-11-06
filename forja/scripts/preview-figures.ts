// Gera uma folha com todas as animações (início e fim) para revisão visual.
// Uso: npx vite-node scripts/preview-figures.ts <saida.html>
import { writeFileSync } from 'node:fs';
import { ANIMS } from '../src/ui/figure/animations';
import { figureSvg } from '../src/ui/figure/render';
import type { Anim } from '../src/ui/figure/rig';

const cells = Object.entries(ANIMS)
  .map(([k, a]) => `<div class="c"><div class="row">${figureSvg(a as Anim, 0, undefined, { ghost: false })}${figureSvg(a as Anim, 1, undefined, { ghost: false })}</div><div class="l">${k}</div></div>`)
  .join('');
writeFileSync(process.argv[2] ?? 'figures.html', `<!doctype html><html><head><style>
:root{--bg:14 15 17;--ink:241 243 245;--muted:139 145 152;--line:60 64 70;--accent:197 245 66;--warn:245 190 70}
body{background:rgb(var(--bg));margin:0;font:11px sans-serif;color:#ccc;display:flex;flex-wrap:wrap}
.c{width:240px;margin:2px;border:1px solid #333}.row{display:flex}.row svg{width:120px;height:120px}.l{text-align:center}
</style></head><body>${cells}</body></html>`);
