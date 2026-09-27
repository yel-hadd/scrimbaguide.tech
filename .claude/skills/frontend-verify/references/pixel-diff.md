# Pixel side-by-sides

`matrix.mjs` writes one full-page capture per page, viewport and theme (`<slug>__<viewport>__<theme>.png`, height capped at 6000 px) with reduced motion on. Run it against the base and the head server into two directories, then:

```
B=$W/visual/<label>-base; H=$W/visual/<label>-head; E=$W/visual/<label>-sbs; mkdir -p "$E"
for f in "$H"/*.png; do
  n=$(basename "$f"); b="$B/$n"
  [ -f "$b" ] || { echo "NEW $n"; continue; }
  read -r w h < <(identify -format '%w %h\n' "$b" "$f" | sort -k2 -n | head -1)
  px=$(magick compare -metric AE -fuzz 2% "$b[${w}x${h}+0+0]" "$f[${w}x${h}+0+0]" null: 2>&1 | sed -E 's/.*\(([^)]*)\).*/\1/')
  [ "$px" = 0 ] || { echo "DIFF $px px $n"; magick "$b[${w}x${h}+0+0]" "$f[${w}x${h}+0+0]" +append "$E/$n"; }
done
```

- Both captures are cropped to the shorter height, so a page that grew or shrank shows as a DIFF from the first moved line down. Compare the two heights (`identify`) when that happens.
- Each file in `$E` is base on the left, head on the right. Open every one with Read. A 6000 px capture is too tall to judge at once: crop the region that changed (`magick $E/<n> -crop <w>x900+0+<y> +repage $E/crop-<n>`) and look at that.
- `-fuzz 2%` absorbs font anti-aliasing noise. Dozens of pixels scattered across the page is noise; a block of thousands is a change to explain.
- A PR that should change nothing visible passes when the loop prints nothing. A PR that changes one component passes when every DIFF is that component, in both themes, at every viewport where it appears.
