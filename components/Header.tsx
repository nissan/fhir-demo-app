import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Header = () => {
  return (
    <header className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <Image 
            src="/images/icon-fhir-720.png" 
            alt="FHIR Icon" 
            width={40} 
            height={40}
          />
          <span className="text-2xl font-bold">FHIR Visualisation Tool</span>
        </Link>
        <nav>
          <ul className="flex space-x-4">
            <li><Link href="/tool">Dashboard</Link></li>
            <li><Link href="/tool/about">About</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
