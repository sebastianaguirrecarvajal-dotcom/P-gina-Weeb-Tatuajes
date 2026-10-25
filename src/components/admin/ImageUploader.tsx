"use client";

import { useState } from "react";

// Campo de imagen: permite pegar una URL o subir un archivo (que se guarda en
// /public/uploads y rellena el valor). El valor final viaja en un input oculto
// con el `name` indicado, por lo que funciona dentro de cualquier <form action>.
export function ImageUploader({
  name,
  defaultValue = "",
  label,
}: {
  name: string;
  defaultValue?: string;
  label: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al subir");
      setValue(data.url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="label">{label}</label>
      <input type="hidden" name={name} value={value} />
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="URL de la imagen o sube un archivo"
          className="input"
        />
        <label className="btn-outline cursor-pointer whitespace-nowrap px-3 py-2 text-xs">
          {uploading ? "Subiendo…" : "Subir"}
          <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={uploading} />
        </label>
      </div>
      {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="Vista previa" className="mt-2 h-24 w-24 rounded-lg object-cover" />
      )}
    </div>
  );
}
