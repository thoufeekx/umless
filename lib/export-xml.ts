// Timeline exports that keep the cut editable: FCP7 XML (xmeml v4, imports into Premiere Pro and DaVinci Resolve)
// and FCPXML 1.10 (Final Cut Pro, DaVinci Resolve). Each kept segment is one clip on V1 + A1 that points at the
// original media, butted end to end. Pure: no I/O.
import { canDropFrame, framesToTimecode, secondsToFrames, sourceTiming, tcBase, timecodeToFrames } from "./export-edl";
import type { Rate, Segment } from "./pipeline";

export type MediaInfo = {
  path: string; // absolute path of the original media
  name: string; // file name, what NLEs show and relink by
  rate: Rate; // exact source frame rate, e.g. { num: 30000, den: 1001 }
  hasVideo: boolean;
  width?: number;
  height?: number;
  sampleRate?: number;
  channels?: number;
  durationSec: number;
  sourceTimecode?: string; // ffprobe timecode tag, e.g. "01:00:00;00"
};

export type TimelineOptions = { title: string };

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

// file:// URL for an absolute POSIX or Windows path, percent-encoded the way Premiere and FCP write them.
export function fileUrl(p: string, localhost = false): string {
  let abs = p.replace(/\\/g, "/");
  if (/^[A-Za-z]:\//.test(abs)) abs = "/" + abs;
  const enc = abs
    .split("/")
    .map((seg, i) => (i === 1 && /^[A-Za-z]:$/.test(seg) ? seg : encodeURIComponent(seg)))
    .join("/");
  return `file://${localhost ? "localhost" : ""}${enc}`;
}

// Kept segments as whole source frames (0 = first frame of the file), dropping anything under a frame.
export function segmentFrames(segs: Segment[], fps: number): { in: number; out: number }[] {
  return segs
    .map((s) => ({ in: secondsToFrames(s.start, fps), out: secondsToFrames(s.end, fps) }))
    .filter((s) => s.out > s.in);
}

function timing(m: MediaInfo) {
  const fps = m.rate.num / m.rate.den;
  const { startFrames, dropFrame } = sourceTiming(fps, m.sourceTimecode);
  const seqStart = timecodeToFrames(dropFrame ? "01:00:00;00" : "01:00:00:00", fps).frames;
  return { fps, startFrames, dropFrame, seqStart, durationFrames: Math.max(1, Math.round(m.durationSec * fps)) };
}

// ---------- FCP7 XML (xmeml) ----------

export function buildXmeml(segs: Segment[], m: MediaInfo, o: TimelineOptions): string {
  const t = timing(m);
  const ntsc = m.rate.den === 1001;
  const rate = (ind: string) =>
    `${ind}<rate>\n${ind}  <timebase>${tcBase(t.fps)}</timebase>\n${ind}  <ntsc>${ntsc ? "TRUE" : "FALSE"}</ntsc>\n${ind}</rate>`;
  const tcBlock = (ind: string, frames: number) =>
    [
      `${ind}<timecode>`,
      rate(ind + "  "),
      `${ind}  <string>${framesToTimecode(frames, t.fps, t.dropFrame)}</string>`,
      `${ind}  <frame>${frames}</frame>`,
      `${ind}  <displayformat>${t.dropFrame && canDropFrame(t.fps) ? "DF" : "NDF"}</displayformat>`,
      `${ind}</timecode>`,
    ].join("\n");
  const sr = m.sampleRate || 48000;
  const ch = m.channels || 2;
  const fileFull = (ind: string) =>
    [
      `${ind}<file id="file-1">`,
      `${ind}  <name>${esc(m.name)}</name>`,
      `${ind}  <pathurl>${esc(fileUrl(m.path, true))}</pathurl>`,
      rate(ind + "  "),
      `${ind}  <duration>${t.durationFrames}</duration>`,
      tcBlock(ind + "  ", t.startFrames),
      `${ind}  <media>`,
      ...(m.hasVideo
        ? [
            `${ind}    <video>`,
            `${ind}      <samplecharacteristics>`,
            rate(ind + "        "),
            `${ind}        <width>${m.width || 1920}</width>`,
            `${ind}        <height>${m.height || 1080}</height>`,
            `${ind}        <pixelaspectratio>square</pixelaspectratio>`,
            `${ind}        <fielddominance>none</fielddominance>`,
            `${ind}      </samplecharacteristics>`,
            `${ind}    </video>`,
          ]
        : []),
      `${ind}    <audio>`,
      `${ind}      <samplecharacteristics>`,
      `${ind}        <depth>16</depth>`,
      `${ind}        <samplerate>${sr}</samplerate>`,
      `${ind}      </samplecharacteristics>`,
      `${ind}      <channelcount>${ch}</channelcount>`,
      `${ind}    </audio>`,
      `${ind}  </media>`,
      `${ind}</file>`,
    ].join("\n");

  const frames = segmentFrames(segs, t.fps);
  let rec = 0;
  const placed = frames.map((f) => {
    const p = { ...f, start: rec, end: rec + (f.out - f.in) };
    rec = p.end;
    return p;
  });
  let fileWritten = false;
  const clip = (kind: "video" | "audio", i: number, ind: string) => {
    const p = placed[i];
    const id = `clipitem-${kind === "video" ? "v" : "a"}${i + 1}`;
    const file = fileWritten ? `${ind}  <file id="file-1"/>` : fileFull(ind + "  ");
    fileWritten = true;
    const links = m.hasVideo
      ? (["video", "audio"] as const).map((k) =>
          [
            `${ind}  <link>`,
            `${ind}    <linkclipref>clipitem-${k === "video" ? "v" : "a"}${i + 1}</linkclipref>`,
            `${ind}    <mediatype>${k}</mediatype>`,
            `${ind}    <trackindex>1</trackindex>`,
            `${ind}    <clipindex>${i + 1}</clipindex>`,
            ...(k === "audio" ? [`${ind}    <groupindex>1</groupindex>`] : []),
            `${ind}  </link>`,
          ].join("\n"),
        )
      : [];
    return [
      `${ind}<clipitem id="${id}">`,
      `${ind}  <masterclipid>masterclip-1</masterclipid>`,
      `${ind}  <name>${esc(m.name)}</name>`,
      `${ind}  <enabled>TRUE</enabled>`,
      `${ind}  <duration>${t.durationFrames}</duration>`,
      rate(ind + "  "),
      `${ind}  <start>${p.start}</start>`,
      `${ind}  <end>${p.end}</end>`,
      `${ind}  <in>${p.in}</in>`,
      `${ind}  <out>${p.out}</out>`,
      file,
      ...(kind === "audio"
        ? [`${ind}  <sourcetrack>`, `${ind}    <mediatype>audio</mediatype>`, `${ind}    <trackindex>1</trackindex>`, `${ind}  </sourcetrack>`]
        : []),
      ...links,
      `${ind}</clipitem>`,
    ].join("\n");
  };

  const I = "          ";
  const video = m.hasVideo
    ? [
        "      <video>",
        "        <format>",
        "          <samplecharacteristics>",
        rate("            "),
        `            <width>${m.width || 1920}</width>`,
        `            <height>${m.height || 1080}</height>`,
        "            <pixelaspectratio>square</pixelaspectratio>",
        "            <fielddominance>none</fielddominance>",
        "          </samplecharacteristics>",
        "        </format>",
        "        <track>",
        ...placed.map((_, i) => clip("video", i, I)),
        "          <enabled>TRUE</enabled>",
        "          <locked>FALSE</locked>",
        "        </track>",
        "      </video>",
      ]
    : [];
  const audio = [
    "      <audio>",
    `        <numOutputChannels>${ch}</numOutputChannels>`,
    "        <format>",
    "          <samplecharacteristics>",
    "            <depth>16</depth>",
    `            <samplerate>${sr}</samplerate>`,
    "          </samplecharacteristics>",
    "        </format>",
    "        <track>",
    ...placed.map((_, i) => clip("audio", i, I)),
    "          <enabled>TRUE</enabled>",
    "          <locked>FALSE</locked>",
    "        </track>",
    "      </audio>",
  ];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<!DOCTYPE xmeml>",
    '<xmeml version="4">',
    '  <sequence id="sequence-1">',
    `    <name>${esc(o.title)}</name>`,
    `    <duration>${rec}</duration>`,
    rate("    "),
    tcBlock("    ", t.seqStart),
    "    <in>-1</in>",
    "    <out>-1</out>",
    "    <media>",
    ...video,
    ...audio,
    "    </media>",
    "  </sequence>",
    "</xmeml>",
    "",
  ].join("\n");
}

// ---------- FCPXML 1.10 ----------

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
// frames * (den/num) seconds as an exact FCPXML rational time: "1001/30000s", "3s", "0s".
export function fcpTime(frames: number, r: Rate): string {
  if (frames === 0) return "0s";
  let n = frames * r.den;
  let d = r.num;
  const g = gcd(n, d);
  n /= g;
  d /= g;
  return d === 1 ? `${n}s` : `${n}/${d}s`;
}

export function buildFcpxml(segs: Segment[], m: MediaInfo, o: TimelineOptions): string {
  const t = timing(m);
  const r = m.rate;
  const ft = (f: number) => fcpTime(f, r);
  const tcFormat = t.dropFrame ? "DF" : "NDF";
  const frames = segmentFrames(segs, t.fps);
  const total = frames.reduce((a, f) => a + f.out - f.in, 0);
  const assetName = m.name.replace(/\.[^.]+$/, "");
  const ch = m.channels || 2;
  const sr = m.sampleRate || 48000;
  const audioRate = sr === 44100 ? "44.1k" : sr === 96000 ? "96k" : "48k";
  let off = t.seqStart;
  const clips = frames.map((f, i) => {
    const line = `            <asset-clip ref="r2" name="${esc(assetName)} ${i + 1}" offset="${ft(off)}" start="${ft(t.startFrames + f.in)}" duration="${ft(f.out - f.in)}" format="r1" tcFormat="${tcFormat}" audioRole="dialogue"/>`;
    off += f.out - f.in;
    return line;
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<!DOCTYPE fcpxml>",
    '<fcpxml version="1.10">',
    "  <resources>",
    `    <format id="r1" frameDuration="${ft(1)}" width="${m.width || 1920}" height="${m.height || 1080}" colorSpace="1-1-1 (Rec. 709)"/>`,
    `    <asset id="r2" name="${esc(assetName)}" start="${ft(t.startFrames)}" duration="${ft(t.durationFrames)}" hasVideo="${m.hasVideo ? 1 : 0}" format="r1" hasAudio="1" videoSources="${m.hasVideo ? 1 : 0}" audioSources="1" audioChannels="${ch}" audioRate="${sr}">`,
    `      <media-rep kind="original-media" src="${esc(fileUrl(m.path))}"/>`,
    "    </asset>",
    "  </resources>",
    "  <library>",
    '    <event name="Umless">',
    `      <project name="${esc(o.title)}">`,
    `        <sequence format="r1" duration="${ft(total)}" tcStart="${ft(t.seqStart)}" tcFormat="${tcFormat}" audioLayout="${ch === 1 ? "mono" : "stereo"}" audioRate="${audioRate}">`,
    "          <spine>",
    ...clips,
    "          </spine>",
    "        </sequence>",
    "      </project>",
    "    </event>",
    "  </library>",
    "</fcpxml>",
    "",
  ].join("\n");
}
