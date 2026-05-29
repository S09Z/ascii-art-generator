import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { buildAsciiFromImage, buildPreviewUrl, CropRect, SegmentMask } from './lib/ascii';
import { detectFace } from './lib/detect';
import { segmentPerson } from './lib/segment';

const sizeOptions = [
  { label: 'S', width: 60 },
  { label: 'M', width: 100 },
  { label: 'L', width: 140 },
  { label: 'XL', width: 200 },
];

// Characters ordered dark → light (Paul Bourke density scale).
// Each level is a genuine subset with increasing tonal resolution.
const detailSets = [
  { label: '1', chars: '@#=+. ' },
  { label: '2', chars: '@B%8#*+=~-:,. ' },
  { label: '3', chars: '@B%8&W#*oZO0QXzcf/|1?-+~<>!I;:,. ' },
  { label: '4', chars: '@B%8&WM#*oahkbdpqwmZ0QLCJYXzcvunxrjft/|()1{}?-_+~<>i!lI;:,. ' },
  { label: '5', chars: `$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/|()1{}[]?-_+~<>i!lI;:,"^\`'. ` },
];

function App() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [asciiArt, setAsciiArt] = useState('Upload an image to generate ASCII art.');
  const [size, setSize] = useState(sizeOptions[1].width);
  const [detail, setDetail] = useState(3);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Preprocessing toggles
  const [bw, setBw] = useState(true);
  const [removeBg, setRemoveBg] = useState(false);
  const [fontWeight, setFontWeight] = useState(false);
  const [copied, setCopied] = useState(false);

  // Processing state
  const [faceFocus, setFaceFocus] = useState(false);
  const [faceCrop, setFaceCrop] = useState<CropRect | null>(null);
  const [detectingFace, setDetectingFace] = useState(false);
  const [mask, setMask] = useState<SegmentMask | null>(null);
  const [segmentingBg, setSegmentingBg] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Processed preview thumbnail
  const [processedPreviewUrl, setProcessedPreviewUrl] = useState<string | null>(null);

  const imageRef = useRef<HTMLImageElement | null>(null);
  const detailChars = useMemo(() => detailSets[detail - 1].chars, [detail]);

  // ── Effect 1: load image ────────────────────────────────────────────────
  useEffect(() => {
    if (!imageUrl) return;
    setImageLoaded(false);
    setFaceCrop(null);
    setMask(null);
    setProcessedPreviewUrl(null);
    setError(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
    img.onerror = () => {
      setError('Unable to load the selected image. Please try a different file.');
    };
    return () => { img.onload = null; img.onerror = null; };
  }, [imageUrl]);

  // ── Effect 2: face detection (MediaPipe) ───────────────────────────────
  useEffect(() => {
    if (!faceFocus) { setFaceCrop(null); return; }
    if (!imageLoaded || !imageRef.current) return;

    const img = imageRef.current;
    let cancelled = false;
    setDetectingFace(true);

    detectFace(img)
      .then((box) => {
        if (cancelled) return;
        if (!box) { setError('No face detected in this image.'); setFaceFocus(false); return; }
        const pad = Math.min(box.width, box.height) * 0.55;
        const nw = img.naturalWidth || img.width;
        const nh = img.naturalHeight || img.height;
        setFaceCrop({
          x: Math.max(0, box.x - pad),
          y: Math.max(0, box.y - pad * 0.7),
          w: Math.min(nw - Math.max(0, box.x - pad), box.width + pad * 2),
          h: Math.min(nh - Math.max(0, box.y - pad * 0.7), box.height + pad * 2.4),
        });
      })
      .catch(() => {
        if (!cancelled) { setError('Face detection failed.'); setFaceFocus(false); }
      })
      .finally(() => { if (!cancelled) setDetectingFace(false); });

    return () => { cancelled = true; };
  }, [imageLoaded, faceFocus]);

  // ── Effect 3: background segmentation ──────────────────────────────────
  useEffect(() => {
    if (!removeBg) { setMask(null); return; }
    if (!imageLoaded || !imageRef.current) return;

    let cancelled = false;
    setSegmentingBg(true);

    segmentPerson(imageRef.current)
      .then((result) => { if (!cancelled) setMask(result); })
      .catch(() => {
        if (!cancelled) {
          setError('Background removal failed — requires internet connection.');
          setRemoveBg(false);
        }
      })
      .finally(() => { if (!cancelled) setSegmentingBg(false); });

    return () => { cancelled = true; };
  }, [imageLoaded, removeBg]);

  // ── Effect 4: processed preview thumbnail ──────────────────────────────
  useEffect(() => {
    if (!imageLoaded || !imageRef.current) { setProcessedPreviewUrl(null); return; }
    // Show B&W preview immediately; if removeBg is on but mask not yet ready, show without mask
    const url = buildPreviewUrl(imageRef.current, {
      bw,
      mask: removeBg && mask ? mask : null,
    });
    setProcessedPreviewUrl(url);
  }, [imageLoaded, bw, mask, removeBg]);

  // ── Effect 5: generate ASCII art ───────────────────────────────────────
  useEffect(() => {
    if (!imageLoaded || !imageRef.current) return;
    if (faceFocus && !faceCrop) return;
    if (removeBg && !mask) return;

    setIsLoading(true);
    setError(null);
    try {
      const output = buildAsciiFromImage(imageRef.current, size, detailChars, {
        crop: faceFocus && faceCrop ? faceCrop : undefined,
        mask: removeBg && mask ? mask : undefined,
        bw,
        fontWeight,
      });
      setAsciiArt(output);
    } catch {
      setError('Failed to generate ASCII art from the image.');
    } finally {
      setIsLoading(false);
    }
  }, [imageLoaded, size, detailChars, faceCrop, faceFocus, mask, removeBg, bw, fontWeight]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageUrl(URL.createObjectURL(file));
    setAsciiArt('Processing image...');
  };

  const handleCopy = () => {
    // Strip HTML tags when copying so the clipboard gets plain text
    const plain = asciiArt.replace(/<[^>]+>/g, '');
    navigator.clipboard.writeText(plain).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const busy = isLoading || segmentingBg;
  const busyLabel = segmentingBg ? 'Removing background…' : 'Generating…';

  return (
    <div className="app-shell">
      <header>
        <h1>ASCII Art Generator</h1>
        <p>Upload an image, choose a size, and select detail level to generate ASCII art.</p>
      </header>

      <main>
        <section className="controls">
          <div className="upload-row">
            <label className="file-input">
              <span>Upload reference image</span>
              <input type="file" accept="image/*" onChange={handleFileChange} />
            </label>

            {imageUrl && (
              <div className="thumb-group">
                <div className="thumb-wrap">
                  <span className="thumb-label">Original</span>
                  <img src={imageUrl} alt="Original" className="reference-thumb" />
                </div>
                {processedPreviewUrl && (
                  <div className="thumb-wrap">
                    <span className="thumb-label">Processed</span>
                    <img
                      src={processedPreviewUrl}
                      alt="Processed preview"
                      className="reference-thumb processed"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="selector-group">
            <div>
              <p>Image size</p>
              <div className="button-row">
                {sizeOptions.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    className={option.width === size ? 'active' : ''}
                    onClick={() => setSize(option.width)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p>Detail level</p>
              <div className="button-row">
                {detailSets.map((option, index) => (
                  <button
                    key={option.label}
                    type="button"
                    className={detail === index + 1 ? 'active' : ''}
                    onClick={() => setDetail(index + 1)}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p>Face focus</p>
              <div className="button-row">
                <button
                  type="button"
                  className={faceFocus ? 'active' : ''}
                  disabled={!imageUrl}
                  onClick={() => { setFaceFocus((v) => !v); if (faceFocus) setFaceCrop(null); }}
                >
                  {faceFocus ? 'On' : 'Off'}
                </button>
              </div>
            </div>

            <div>
              <p>Black &amp; white</p>
              <div className="button-row">
                <button
                  type="button"
                  className={bw ? 'active' : ''}
                  disabled={!imageUrl}
                  onClick={() => setBw((v) => !v)}
                >
                  {bw ? 'On' : 'Off'}
                </button>
              </div>
            </div>

            <div>
              <p>Remove background</p>
              <div className="button-row">
                <button
                  type="button"
                  className={removeBg ? 'active' : ''}
                  disabled={!imageUrl}
                  onClick={() => { setRemoveBg((v) => !v); if (removeBg) setMask(null); }}
                >
                  {removeBg ? 'On' : 'Off'}
                  {segmentingBg && <span className="btn-spinner" />}
                </button>
              </div>
            </div>

            <div>
              <p>Font weight</p>
              <div className="button-row">
                <button
                  type="button"
                  className={fontWeight ? 'active' : ''}
                  disabled={!imageUrl}
                  onClick={() => setFontWeight((v) => !v)}
                >
                  {fontWeight ? 'Bold' : 'Normal'}
                </button>
              </div>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
        </section>

        <section className="preview">
          <div className="preview-header">
            <h2>ASCII Preview</h2>
            <div className="preview-header-actions">
              {busy && <span className="loading">{busyLabel}</span>}
              {imageUrl && (
                <button type="button" className="copy-btn" onClick={handleCopy}>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              )}
            </div>
          </div>
          {fontWeight
            ? <pre className="ascii-output" dangerouslySetInnerHTML={{ __html: asciiArt }} />
            : <textarea className="ascii-output" readOnly value={asciiArt} />
          }
        </section>
      </main>
    </div>
  );
}

export default App;
