"use client";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { FHIRRelationshipBeam } from "@/components/FHIRRelationshipBeam";
import PulsatingButton from "@/components/ui/pulsating-button";
import { Separator } from "@/components/ui/separator";
import { ModeToggle } from "@/components/mode-toggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white dark:from-gray-900 dark:to-gray-800 p-8 font-[family-name:var(--font-geist-sans)]">
      <header className="text-center mb-12 flex justify-between items-center">
        <h1 className="text-4xl font-bold text-blue-800 dark:text-blue-300 mb-4">FHIR Visualisation Tool</h1>
        <ModeToggle />
      </header>

      <main className="max-w-4xl mx-auto">
        <section>
          <h2 className="text-2xl font-semibold text-blue-700 dark:text-blue-400 mb-4">Get Started</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Ready to dive into the world of FHIR? Start exploring our visualisation tool and enhance your understanding of FHIR components and their relationships.
          </p>
          <div className="flex justify-center">
            <Link href="/tool" passHref>
              <PulsatingButton>
                Launch Visualisation Tool
              </PulsatingButton>
            </Link>
          </div>
        </section>
        <Separator className="my-8" />

        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-blue-700 dark:text-blue-400 mb-4">FHIR Component Relationships</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Explore the relationships between key FHIR components in the interactive visualisation below:
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
            <FHIRRelationshipBeam />
          </div>
        </section>
      </main>

      <footer className="mt-16 text-center text-gray-500 dark:text-gray-400">
        <p>&copy; Team Round Table's 2024 FHIR Visualisation Tool. All rights reserved.</p>
      </footer>
    </div>
  );
}
