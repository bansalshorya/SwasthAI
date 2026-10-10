import { useEffect, useRef, useState } from "react";
import { ExternalLink, Loader2, MapPin } from "lucide-react";

const CARE_TYPES = ["clinic", "hospital", "pediatrician", "dermatologist"];

export default function CareFinder({ language, copy }) {
  const [location, setLocation] = useState("");
  const [careType, setCareType] = useState("clinic");
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const requestRef = useRef(null);

  useEffect(() => () => requestRef.current?.abort(), []);

  async function handleSearch(event) {
    event.preventDefault();
    const cleanLocation = location.trim();
    if (cleanLocation.length < 2 || (/^\d+$/.test(cleanLocation) && !/^\d{6}$/.test(cleanLocation))) {
      setError(copy.careFinderInvalidLocation);
      setResults(null);
      return;
    }

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError("");
    setResults(null);
    try {
      const response = await fetch("/api/care-resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: cleanLocation, careType, language }),
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const code = payload?.error?.code;
        throw new Error(code || "CARE_SEARCH_UNAVAILABLE");
      }
      setResults(Array.isArray(payload?.results) ? payload.results : []);
    } catch (searchError) {
      if (searchError?.name === "AbortError") return;
      setError(searchError.message === "CARE_SEARCH_NOT_CONFIGURED" ? copy.careFinderNotConfigured
        : searchError.message === "INVALID_CARE_SEARCH" ? copy.careFinderInvalidLocation
          : copy.careFinderUnavailable);
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setLoading(false);
      }
    }
  }

  return (
    <section className="result-card care-finder no-print" aria-labelledby="care-finder-title">
      <div className="section-title"><MapPin size={20} aria-hidden="true" /><h2 id="care-finder-title">{copy.careFinderTitle}</h2></div>
      <p>{copy.careFinderIntro}</p>
      <form onSubmit={handleSearch} className="care-finder-form">
        <label>
          <span>{copy.careFinderLocation}</span>
          <input
            type="text"
            value={location}
            onChange={(event) => { requestRef.current?.abort(); setLocation(event.target.value); setResults(null); setError(""); }}
            placeholder={copy.careFinderPlaceholder}
            maxLength={80}
            autoComplete="address-level2"
            required
          />
        </label>
        <label>
          <span>{copy.careFinderType}</span>
          <select value={careType} onChange={(event) => { requestRef.current?.abort(); setCareType(event.target.value); setResults(null); setError(""); }}>
            {CARE_TYPES.map((type) => <option key={type} value={type}>{copy[`careFinderType_${type}`]}</option>)}
          </select>
        </label>
        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? <Loader2 size={17} className="spin" aria-hidden="true" /> : <MapPin size={17} aria-hidden="true" />}
          <span>{loading ? copy.careFinderSearching : copy.careFinderSearch}</span>
        </button>
      </form>
      <p className="care-finder-privacy">{copy.careFinderPrivacy}</p>
      {error && <p className="care-finder-error" role="alert">{error}</p>}
      {results && (
        <div className="care-finder-results" aria-live="polite">
          <h3>{copy.careFinderResults}</h3>
          {results.length ? (
            <ul>
              {results.map((item) => (
                <li key={item.url}>
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    <span>{item.title}</span><ExternalLink size={15} aria-hidden="true" />
                  </a>
                  {item.siteName && <small>{item.siteName}</small>}
                  {item.snippet && <p>{item.snippet}</p>}
                </li>
              ))}
            </ul>
          ) : <p>{copy.careFinderNoResults}</p>}
          <p className="care-finder-caution">{copy.careFinderVerify}</p>
        </div>
      )}
    </section>
  );
}
