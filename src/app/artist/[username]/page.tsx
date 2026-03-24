import PublicArtistPage from './PublicArtistPage';

export default function ArtistPage({ params }: { params: { username: string } }) {
  return <PublicArtistPage username={params.username} />;
}
