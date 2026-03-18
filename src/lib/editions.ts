export type Classification = "Unique" | "LimitedEdition" | "OpenEdition";
export type EditionStatus = "Available" | "Reserved" | "Sold" | "Donated" | "MuseumCollection" | "ArtistRetained" | "Destroyed";
export const STATUS_LABELS: Record<string, string> = {
  Available: "Available", Reserved: "Reserved", Sold: "Sold",
  Donated: "Donated", MuseumCollection: "Museum collection",
  ArtistRetained: "Artist retained", Destroyed: "Destroyed",
};
export const STATUS_COLORS: Record<string, string> = {
  Available: "text-green-400 border-green-800",
  Reserved: "text-yellow-400 border-yellow-800",
  Sold: "text-blue-400 border-blue-800",
  Donated: "text-purple-400 border-purple-800",
  MuseumCollection: "text-orange-400 border-orange-800",
  ArtistRetained: "text-gray-400 border-gray-700",
  Destroyed: "text-red-500 border-red-900",
};
