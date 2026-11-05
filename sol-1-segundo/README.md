# E se o Sol sumisse por 1 segundo?

Vídeo vertical 9:16 (1080×1920, 30 fps, 30 s), no estilo *Technicolor 3D stage set*
(musical de estúdio dos anos 60): rua cenográfica de tijolo e reboco, céu pintado
vermelho-alaranjado, sol-herói `#D97757` com contorno preto, bonecos-manequim.

**Resultado:** [`out/sol-1-segundo.mp4`](out/sol-1-segundo.mp4)

## Roteiro

| Tempo | Câmera | O que acontece |
|---|---|---|
| 0–3,5 s | contra-plongée nos telhados, contra o céu laranja | 17:59:57, fim de tarde comum |
| 3,5–7 s | | 18:00:00: o Sol some lá no espaço, mas aqui nada muda |
| 7–14 s | descida contínua até a rua (acelerado) | contagem regressiva: luz e gravidade levam 8 min 20 s |
| 14–15,5 s | push no nível do chão | 3… 2… 1… |
| 15,5–17,5 s | câmera lenta ½× | 18:08:20: escuridão total, estrelas no céu |
| 17,5–20,5 s | | o Sol volta; a Lua apaga 1,3 s depois |
| 20,5–30 s | os bonecos param e olham para cima | consequências: cérebro leva ~0,3 s para perceber; painéis solares 1 s sem energia; órbita da Terra desvia só ~3 mm; o mundo segue |

### Conta da órbita
Aceleração centrípeta da Terra ≈ v²/r = (29,8 km/s)² / 1,496×10¹¹ m ≈ 5,9 mm/s².
Sem gravidade solar por 1 s, a Terra segue em linha reta: desvio ≈ ½·a·t² ≈ 3 mm.

## Como renderizar

```bash
npm install
node render.mjs                    # vídeo completo → out/sol-1-segundo.mp4
node render.mjs --stills 0,16,24   # quadros de prévia → out/still_*.jpg
```

Requer Node, Playwright/Chromium, Python 3 + NumPy (trilha sintetizada em
`soundtrack.py`) e ffmpeg. A cena (`scene.js`, three.js) é determinística:
`window.renderAt(t)` desenha o quadro do instante `t`.
