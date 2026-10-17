import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Field, Layout, PrimaryButton, inputClass } from '../../components/Layout';
import { MapView } from '../../components/MapView';
import { emptyLandlordDraft, loadDraft, saveDraft } from '../../state/session';

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ListProperty() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState(loadDraft());
  const [areas, setAreas] = useState<{ name: string; coordinates: { lat: number; lng: number } }[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/neighborhoods')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setAreas(d.data);
      })
      .catch(() => {});
  }, []);

  const update = (patch: Partial<typeof draft>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    saveDraft(next);
  };

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    const selected = Array.from(files).slice(0, 6);
    const urls = await Promise.all(selected.map(fileToDataUrl));
    const labels = urls.map((_, i) => ['Gate / entrance', 'Living room', 'Kitchen', 'Bedroom', 'Bathroom', 'Outside'][i] || `Room ${i + 1}`);
    update({ images: urls, room_labels: labels });
  };

  const onContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.address.trim() || !draft.title.trim()) {
      setError('Please add a title and the street address.');
      return;
    }
    if (!draft.images.length) {
      setError('Please upload at least one photo of the apartment.');
      return;
    }
    navigate('/landlord/fees');
  };

  return (
    <Layout eyebrow="Landlord · step 1 of 4">
      <form onSubmit={onContinue} className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-black">List the property</h1>
          <p className="text-stone-600 mt-2">Upload pictures, type the address, and check the map of the area and roads.</p>
        </div>
        <Field label="Short title">
          <input className={inputClass} value={draft.title} onChange={(e) => update({ title: e.target.value })} placeholder="e.g. 2-bedroom flat in Old Bodija" />
        </Field>
        <Field label="Rent or sale">
          <select
            className={inputClass}
            value={draft.listing_type}
            onChange={(e) => update({ listing_type: e.target.value as 'rent' | 'sale' })}
          >
            <option value="rent">For rent</option>
            <option value="sale">For sale</option>
          </select>
        </Field>
        <Field label="Area">
          <select
            className={inputClass}
            value={draft.neighborhood}
            onChange={(e) => {
              const name = e.target.value;
              const hit = areas.find((a) => a.name === name);
              update({
                neighborhood: name,
                lat: hit?.coordinates.lat || draft.lat,
                lng: hit?.coordinates.lng || draft.lng,
              });
            }}
          >
            {['Old Bodija', ...areas.map((a) => a.name).filter((n) => n !== 'Old Bodija')].map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Street address">
          <input className={inputClass} value={draft.address} onChange={(e) => update({ address: e.target.value })} placeholder="House number, street, area" />
        </Field>
        <Field label="Apartment photos" hint="These photos become the virtual walkthrough.">
          <input
            className="text-sm"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => onFiles(e.target.files)}
          />
        </Field>
        {draft.images.length ? (
          <div className="grid grid-cols-3 gap-2">
            {draft.images.map((src, i) => (
              <img key={i} src={src} alt="" className="h-24 w-full object-cover rounded-xl" />
            ))}
          </div>
        ) : null}
        <div>
          <p className="font-semibold text-sm mb-2">Map of the area and roads</p>
          <MapView lat={draft.lat} lng={draft.lng} />
        </div>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <PrimaryButton type="submit">Next: rent and terms</PrimaryButton>
        <button
          type="button"
          className="text-sm text-stone-500"
          onClick={() => {
            const fresh = emptyLandlordDraft();
            setDraft(fresh);
            saveDraft(fresh);
          }}
        >
          Clear form
        </button>
      </form>
    </Layout>
  );
}
