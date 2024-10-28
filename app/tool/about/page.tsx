'use client';

import React from 'react';
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { FHIRRelationshipBeam } from "@/components/FHIRRelationshipBeam";

export default function AboutPage() {
    return (
        <div className="space-y-8 p-6">
            <section>
                <h1 className="text-4xl font-bold text-blue-700 mb-4">About Our Project</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>FHIR Visualisation Tool</CardTitle>
                        <CardDescription>Simplifying FHIR complexity through interactive visualizations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Our FHIR Visualisation Tool is designed to help healthcare professionals, developers, and researchers better understand the relationships between various FHIR (Fast Healthcare Interoperability Resources) components. By providing interactive and visually appealing representations, we aim to simplify the complexity of FHIR and enhance the learning experience.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            Whether you're new to FHIR or an experienced user, our tool offers valuable insights into the structure and connections within the FHIR ecosystem.
                        </p>
                    </CardContent>
                </Card>
            </section>

            <Separator />

            <section>
                <h2 className="text-2xl font-semibold text-blue-700 mb-4">FHIR Resource Relationships</h2>
                <Card>
                    <CardContent className="pt-6">
                        <FHIRRelationshipBeam />
                    </CardContent>
                </Card>
            </section>

            <Separator />

            <section>
                <h2 className="text-2xl font-semibold text-blue-700 mb-4">Key Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Interactive Visualizations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>Explore FHIR resources and their relationships through dynamic, interactive diagrams.</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Resource Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>Access comprehensive information about each FHIR resource, including descriptions and use cases.</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>User-Friendly Interface</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>Navigate through the tool with ease, thanks to our intuitive and responsive design.</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Educational Resources</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>Learn about FHIR standards and best practices through integrated educational content.</p>
                        </CardContent>
                    </Card>
                </div>
            </section>
        </div>
    );
}
