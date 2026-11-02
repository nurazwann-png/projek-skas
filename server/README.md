# Fail pelayan SK@S

Salinan rujukan fail pelayan bagi fungsi **Semak Pencapaian** (AI) dalam `skas-preview.html`. Projek Next.js penuh tidak disimpan dalam repo ini.

| Fail | Letak dalam projek Next.js | Fungsi |
|---|---|---|
| `src/app/api/ai/semak-pencapaian/route.ts` | laluan yang sama | API `POST /api/ai/semak-pencapaian`: semakan Pencapaian Guru (5.4.1) dan Pencapaian Sekolah (5.4.2) |
| `next.config.ts` | akar projek | Had saiz badan permintaan 16 MB (`proxyClientMaxBodySize`) untuk sijil sehingga 10 MB |

## Keperluan

- Next.js 16 dan pakej `@anthropic-ai/sdk`.
- Pemboleh ubah persekitaran `ANTHROPIC_API_KEY` dalam `.env.local`. **Jangan commit fail `.env.local`.** Tanpa kunci ini, API memulangkan ralat 503.
- Halaman HTML dan `assets/` diletakkan dalam folder `public/` projek.
