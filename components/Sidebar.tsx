import React from 'react';
import Link from 'next/link';

const Sidebar = () => {
  return (
    <aside className="bg-gray-100 dark:bg-gray-700 w-64 p-6">
      <nav>
        <ul className="space-y-2">
          <li><Link href="/tool" className="block text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 p-2 rounded">Dashboard</Link></li>
          <li><Link href="/tool/patients" className="block text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 p-2 rounded">Patients</Link></li>
          <li><Link href="/tool/practitioners" className="block text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 p-2 rounded">Practitioners</Link></li>
          <li><Link href="/tool/organisations" className="block text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 p-2 rounded">Organisations</Link></li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
