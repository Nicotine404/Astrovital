# anatomy.bin

Anatomical model used by the 3D digital twin: skin, 12 organ systems and 11
skeletal regions (~700k triangles), plus anchors in
`src/lib/data/anatomy.generated.json`.

## Source and licence

**BodyParts3D, (c) The Database Center for Life Science, licensed under CC
Attribution-Share Alike 2.1 Japan.**
https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html

Mitsuhashi N, Fujieda K, Tamura T, Kawamoto S, Takagi T, Okubo K.
*BodyParts3D: 3D structure database for anatomical concepts.*
Nucleic Acids Res. 2009;37(Database issue):D782-5. https://doi.org/10.1093/nar/gkn613

STL conversion: K. M. Moerman, https://github.com/Kevin-Mattheus-Moerman/BodyParts3D

`anatomy.bin` is a derivative work (decimated, merged into systems, rescaled and
re-oriented) and is distributed under the same **CC BY-SA 2.1 JP** licence. This
licence applies to the model files only, not to the application source code.

## Rebuilding

```bash
git clone --depth 1 https://github.com/Kevin-Mattheus-Moerman/BodyParts3D
node scripts/build-anatomy.mjs BodyParts3D/assets/BodyParts3D_data
```

Each system has a triangle budget in `scripts/build-anatomy.mjs`; raise it for
more detail at the cost of download size.

## Format

`uint32 headerLength`, JSON header
`[{ id, vertices, indices, index32, min, max, posOffset, idxOffset }]`, then per
system: `Int16` positions quantised to the system's bounding box, and `Uint16` or
`Uint32` triangle indices. Coordinates: metres, Y up, +X = patient's left,
+Z = anterior, feet at y = 0, height 1.75 m.
