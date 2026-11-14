# body.bin

Human body mesh used by the 3D digital twin.

- Source: MakeHuman base mesh `hm08` (`makehuman/data/3dobjs/base.obj`,
  https://github.com/makehumancommunity/makehuman), released as **CC0** by its
  copyright holders in September 2020.
- Only the `body` group is kept (helper/joint geometry removed), triangulated and
  normalised to 1.75 m, feet at y = 0, facing +z.
- Regenerate with `node scripts/obj2bin.mjs base.obj public/models/body.bin`.

Format: `uint32 headerLength`, JSON header `[{ name, verts, indices }]`, then
`Float32 positions` and `Uint32 indices` per part.
