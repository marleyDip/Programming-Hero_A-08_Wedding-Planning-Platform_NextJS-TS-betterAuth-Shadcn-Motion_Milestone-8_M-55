"use client";

/**
 * Premium avatar uploader.
 * Place at: components/auth/image-upload.tsx
 *
 * Flow: pick / drop a photo -> uploads IMMEDIATELY to /api/upload (ImgBB) with
 * a live progress ring, scanning shimmer and percentage -> success state with
 * Change / Remove. If a *change* fails or is cancelled, the previous photo is
 * restored automatically.
 *
 * Props:
 *   onChange(url | null)   uploaded image URL (null when removed)
 *   onBusyChange(boolean)  true while an upload is running (disable submit)
 */

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Camera,
  Check,
  ImagePlus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

type Status = "idle" | "uploading" | "success" | "error";

const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPT = "image/png,image/jpeg,image/webp,image/gif";
const R = 52;
const C = 2 * Math.PI * R;

const formatSize = (b: number) =>
  b < 1024 * 1024
    ? `${Math.max(1, Math.round(b / 1024))} KB`
    : `${(b / 1024 / 1024).toFixed(1)} MB`;

const revoke = (url?: string | null) => {
  if (url && url.startsWith("blob:")) URL.revokeObjectURL(url);
};

/** XHR (not fetch) so we get real upload progress events. */
function uploadWithProgress(
  file: File,
  onProgress: (percent: number) => void,
  xhrRef: React.RefObject<XMLHttpRequest | null>,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.open("POST", "/api/upload");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);

        if (xhr.status >= 200 && xhr.status < 300 && data.url) {
          resolve(data.url as string);
        } else {
          reject(new Error(data.error || "Image upload failed"));
        }
      } catch {
        reject(new Error("Image upload failed"));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error. Check your connection."));
    };

    xhr.onabort = () => {
      reject(new Error("aborted"));
    };

    const fd = new FormData();
    fd.append("image", file);

    xhr.send(fd);
  });
}

interface Snapshot {
  url: string;
  preview: string;
  name: string;
  size: number;
}

export function ImageUpload({
  onChange,
  onBusyChange,
}: {
  onChange: (url: string | null) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const gradId = useId().replace(/:/g, "");
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const tokenRef = useRef(0);
  const fileRef = useRef<File | null>(null);
  const urlRef = useRef<string | null>(null); // last successfully uploaded URL
  const previewRef = useRef<string | null>(null);
  const prevRef = useRef<Snapshot | null>(null); // restore point while changing

  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ name: string; size: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const applyPreview = (url: string | null) => {
    previewRef.current = url;
    setPreview(url);
  };

  /* Clean up on unmount */
  useEffect(() => {
    const token = tokenRef;
    const xhr = xhrRef.current;

    return () => {
      token.current++;
      xhr?.abort();

      revoke(previewRef.current);
      revoke(prevRef.current?.preview);
    };
  }, []);

  /** Put the last good photo back, or reset to empty if there wasn't one. */
  const restoreOrReset = useCallback(() => {
    const prev = prevRef.current;
    revoke(previewRef.current);

    if (prev) {
      applyPreview(prev.preview);
      setMeta({ name: prev.name, size: prev.size });
      urlRef.current = prev.url;
      setStatus("success");
      prevRef.current = null;
    } else {
      applyPreview(null);
      setMeta(null);
      urlRef.current = null;
      setStatus("idle");
    }
    setProgress(0);
    setError(null);
    onBusyChange?.(false);
  }, [onBusyChange]);

  const startUpload = useCallback(
    async (file: File) => {
      // Remember the current good photo so a failed "change" can revert
      if (status === "success" && urlRef.current && previewRef.current) {
        revoke(prevRef.current?.preview);

        prevRef.current = {
          url: urlRef.current,
          preview: previewRef.current,
          name: meta?.name ?? "photo",
          size: meta?.size ?? 0,
        };
      } else if (status === "idle" || status === "error") {
        revoke(prevRef.current?.preview);
        prevRef.current = null;
      }

      // Abort anything still in flight
      xhrRef.current?.abort();
      const token = ++tokenRef.current;

      // Swap preview (keep the old blob alive only if it's the restore point)
      if (previewRef.current && previewRef.current !== prevRef.current?.preview)
        revoke(previewRef.current);

      applyPreview(URL.createObjectURL(file));
      setMeta({ name: file.name, size: file.size });
      setProgress(0);
      setError(null);
      setStatus("uploading");
      onBusyChange?.(true);

      try {
        const url = await uploadWithProgress(
          file,
          (p) => token === tokenRef.current && setProgress(p),
          xhrRef,
        );
        if (token !== tokenRef.current) return;

        setProgress(100);
        urlRef.current = url;
        setStatus("success");
        revoke(prevRef.current?.preview);
        prevRef.current = null;
        onChange(url);
        onBusyChange?.(false);
        toast.success("Profile photo uploaded");
      } catch (err) {
        if (token !== tokenRef.current) return;
        const msg = err instanceof Error ? err.message : "Image upload failed";
        if (msg === "aborted") return;

        if (prevRef.current) {
          restoreOrReset();
          toast.error(`${msg}. Your previous photo was kept.`);
        } else {
          setStatus("error");
          setError(msg);
          onBusyChange?.(false);
          toast.error(msg);
        }
      }
    },
    [status, meta, onChange, onBusyChange, restoreOrReset],
  );

  const pick = (file?: File | null) => {
    if (!file) return;

    if (!ACCEPT.split(",").includes(file.type))
      return void toast.error("Please choose a PNG, JPG, WEBP or GIF image");

    if (file.size > MAX_SIZE)
      return void toast.error("Image must be smaller than 5 MB");

    fileRef.current = file;
    startUpload(file);
  };

  const cancel = () => {
    tokenRef.current++;
    xhrRef.current?.abort();
    restoreOrReset();
  };

  const remove = () => {
    tokenRef.current++;
    xhrRef.current?.abort();

    revoke(previewRef.current);
    revoke(prevRef.current?.preview);

    prevRef.current = null;
    fileRef.current = null;
    urlRef.current = null;

    applyPreview(null);
    setMeta(null);
    setProgress(0);
    setError(null);
    setStatus("idle");
    onChange(null);
    onBusyChange?.(false);
  };

  const openDialog = () => inputRef.current?.click();

  /* Ring values */
  const processing = status === "uploading" && progress >= 100;

  const shown =
    status === "success"
      ? 100
      : status === "uploading"
        ? Math.min(progress, 92)
        : status === "error"
          ? 100
          : 0;

  const ringStyle =
    status === "success"
      ? { stroke: "var(--success)" }
      : status === "error"
        ? { stroke: "var(--destructive)" }
        : { stroke: `url(#${gradId})` };

  const containerTone = dragging
    ? "border-brand bg-brand-soft/50"
    : status === "success"
      ? "border-success/40 bg-success/5"
      : status === "error"
        ? "border-destructive/40 bg-destructive/5"
        : "border-border bg-card/50";

  const btn =
    "inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-accent";

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (status !== "uploading") setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        pick(e.dataTransfer.files?.[0]);
      }}
      className={`relative flex items-center gap-5 overflow-hidden rounded-2xl border-2 border-dashed p-4 transition-colors duration-300 ${containerTone}`}
    >
      {/* Avatar & ring */}
      <div className="relative h-26 w-26 shrink-0">
        <svg
          viewBox="0 0 120 120"
          className="absolute inset-0 -rotate-90"
          aria-hidden
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" style={{ stopColor: "var(--logo-from)" }} />
              <stop offset="1" style={{ stopColor: "var(--logo-to)" }} />
            </linearGradient>
          </defs>

          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            strokeWidth="4"
            className="stroke-border"
          />

          {status === "idle" && (
            <motion.circle
              cx="60"
              cy="60"
              r={R}
              fill="none"
              strokeWidth="3"
              strokeDasharray="3 8"
              strokeLinecap="round"
              className="stroke-brand/60"
              style={{ transformOrigin: "60px 60px" }}
              animate={{ rotate: 360 }}
              transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
            />
          )}

          {status !== "idle" && (
            <motion.circle
              cx="60"
              cy="60"
              r={R}
              fill="none"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={C}
              initial={{ strokeDashoffset: C }}
              animate={{
                strokeDashoffset: C * (1 - shown / 100),
                opacity: processing ? [1, 0.45, 1] : 1,
              }}
              transition={{
                strokeDashoffset: { duration: 0.45, ease: "easeOut" },
                opacity: processing
                  ? { duration: 1, repeat: Infinity }
                  : { duration: 0.2 },
              }}
              style={ringStyle}
            />
          )}
        </svg>

        {/* success burst */}
        {status === "success" && (
          <motion.span
            aria-hidden
            initial={{ scale: 0.9, opacity: 0.7 }}
            animate={{ scale: 1.55, opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="absolute inset-0 rounded-full border-2 border-success"
          />
        )}

        <button
          type="button"
          onClick={openDialog}
          disabled={status === "uploading"}
          aria-label={preview ? "Change profile photo" : "Upload profile photo"}
          className="group absolute inset-2.5 overflow-hidden rounded-full bg-muted text-muted-foreground outline-none focus-visible:ring-4 focus-visible:ring-brand/30 disabled:cursor-progress"
        >
          <AnimatePresence mode="wait" initial={false}>
            {preview ? (
              <motion.img
                key={preview}
                src={preview}
                alt="Profile preview"
                initial={{ opacity: 0, scale: 1.2 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className={`h-full w-full object-cover transition-all duration-500 ${
                  status === "uploading"
                    ? "scale-105 blur-[2px] brightness-75"
                    : ""
                } ${status === "error" ? "brightness-50 grayscale" : ""}`}
              />
            ) : (
              <motion.span
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: [0, -3, 0] }}
                transition={{
                  y: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
                }}
                className="grid h-full w-full place-items-center bg-linear-to-br from-brand-soft to-muted text-brand"
              >
                <ImagePlus className="h-8 w-8" />
              </motion.span>
            )}
          </AnimatePresence>

          {/* uploading overlay: scan line + percentage */}
          {status === "uploading" && (
            <>
              <motion.div
                aria-hidden
                className="absolute inset-x-0 h-10 bg-linear-to-b from-transparent via-white/55 to-transparent"
                initial={{ top: "-40%" }}
                animate={{ top: "110%" }}
                transition={{
                  duration: 1.3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              <span className="absolute inset-0 grid place-items-center text-sm font-bold text-white drop-shadow">
                {processing ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  `${progress}%`
                )}
              </span>
            </>
          )}

          {/* hover overlay: change */}
          {status === "success" && (
            <span className="absolute inset-0 grid place-items-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <span className="flex flex-col items-center gap-0.5 text-[11px] font-medium text-white">
                <Camera className="h-5 w-5" />
                Change
              </span>
            </span>
          )}

          {status === "error" && (
            <span className="absolute inset-0 grid place-items-center text-white">
              <AlertCircle className="h-7 w-7" />
            </span>
          )}
        </button>

        {/* success badge */}
        <AnimatePresence>
          {status === "success" && (
            <motion.span
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{
                type: "spring",
                stiffness: 420,
                damping: 16,
                delay: 0.15,
              }}
              className="absolute bottom-0 right-0 grid h-7 w-7 place-items-center rounded-full bg-success text-white ring-4 ring-background"
            >
              <Check className="h-4 w-4" strokeWidth={3} />
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Right side */}
      <div className="min-w-0 flex-1" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={status}
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -14 }}
            transition={{ duration: 0.2 }}
          >
            {status === "idle" && (
              <>
                <p className="text-sm font-semibold">
                  Profile photo{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </p>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  Drag &amp; drop or browse · PNG, JPG, WEBP up to 5 MB
                </p>

                <motion.button
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={openDialog}
                  className={`${btn} mt-3 border-brand/40 text-brand hover:bg-brand-soft`}
                >
                  <ImagePlus className="h-3.5 w-3.5" /> Upload photo
                </motion.button>
              </>
            )}

            {status === "uploading" && (
              <>
                <p className="text-sm font-semibold">
                  {processing ? "Almost there…" : "Uploading…"}
                </p>

                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {meta?.name} · {meta ? formatSize(meta.size) : ""}
                </p>

                <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-linear-to-r from-(--logo-from) to-(--logo-to)"
                    animate={{ width: `${Math.max(shown, 4)}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />

                  <motion.span
                    aria-hidden
                    className="absolute inset-y-0 w-1/4 bg-white/50"
                    initial={{ left: "-25%" }}
                    animate={{ left: "110%" }}
                    transition={{
                      duration: 1.1,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={cancel}
                  className={`${btn} mt-3`}
                >
                  <X className="h-3.5 w-3.5" /> Cancel
                </button>
              </>
            )}

            {status === "success" && (
              <>
                <p className="flex items-center gap-1.5 text-sm font-semibold text-success">
                  <Check className="h-4 w-4" /> Photo uploaded
                </p>

                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {meta?.name}
                  {meta?.size ? ` · ${formatSize(meta.size)}` : ""}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={openDialog}
                    className={btn}
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Change
                  </motion.button>

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={remove}
                    className={`${btn} hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive`}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </motion.button>
                </div>
              </>
            )}

            {status === "error" && (
              <>
                <p className="text-sm font-semibold text-destructive">
                  Upload failed
                </p>

                <p className="mt-0.5 text-xs text-muted-foreground">{error}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() =>
                      fileRef.current && startUpload(fileRef.current)
                    }
                    className={btn}
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Try again
                  </motion.button>

                  <button type="button" onClick={remove} className={btn}>
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* drag overlay */}
      <AnimatePresence>
        {dragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 grid place-items-center bg-brand-soft/80 text-sm font-semibold text-brand backdrop-blur-sm"
          >
            Drop your photo to upload
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
