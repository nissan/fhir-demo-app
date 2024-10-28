import Link from 'next/link';
// ... other imports

export function Navigation() {
  return (
    <nav>
      {/* ... other navigation items */}
      <Link href="/tool/patients">Patients</Link>
      <Link href="/tool/practitioners">Practitioners</Link>
      <Link href="/tool/organisations">Organisations</Link>
      <Link href="/tool/encounters">Encounters</Link>
      <Link href="/tool/observations">Observations</Link>
      <Link href="/tool/reports">Diagnostic Reports</Link>
      <Link href="/tool/careteams">Care Teams</Link>
      <Link href="/tool/healthcareservices">Healthcare Services</Link>
      <Link href="/tool/conditions">Conditions</Link> {/* Add this line */}
      {/* ... any other navigation items */}
    </nav>
  );
}
