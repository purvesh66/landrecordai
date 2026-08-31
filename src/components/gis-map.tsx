import { Link } from "@tanstack/react-router";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

import type { LandRecord } from "@/lib/pipeline/types";

const COLORS: Record<string, string> = {
  Verified: "#15803d",
  Approved: "#15803d",
  "Review Required": "#b45309",
  Rejected: "#b91c1c",
};

function markerIcon(record: LandRecord) {
  const color = record.risk_score >= 60 ? "#b91c1c" : (COLORS[record.verification_status] ?? "#1d4ed8");
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:16px;height:16px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.25)"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export default function GisMap({ records }: { records: LandRecord[] }) {
  const plotted = records.filter((r) => r.latitude != null && r.longitude != null);
  return (
    <MapContainer
      center={[18.5804, 73.981]}
      zoom={13}
      scrollWheelZoom
      style={{ height: "70vh", width: "100%", borderRadius: "0.5rem" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {plotted.map((record) => (
        <Marker
          key={record.id}
          position={[record.latitude as number, record.longitude as number]}
          icon={markerIcon(record)}
        >
          <Popup>
            <div style={{ minWidth: 200 }}>
              <p style={{ fontWeight: 600, margin: 0 }}>{record.owner ?? "Unknown owner"}</p>
              <p style={{ margin: "4px 0 0" }}>Survey No: {record.survey_no ?? "—"}</p>
              <p style={{ margin: 0 }}>Area: {record.area?.toFixed(2) ?? "—"} ha</p>
              <p style={{ margin: 0 }}>Village: {record.village ?? "Missing"}</p>
              <p style={{ margin: 0 }}>Status: {record.verification_status}</p>
              <p style={{ margin: 0 }}>Risk score: {record.risk_score}</p>
              <Link
                to="/records/$id"
                params={{ id: record.id }}
                style={{ display: "inline-block", marginTop: 8, fontWeight: 600 }}
              >
                View Record →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
