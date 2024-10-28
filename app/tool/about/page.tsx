import { Separator } from "@/components/ui/separator";

export default function AboutPage() {
    return <div>
        <section className="mb-16">
            <h2 className="text-2xl font-semibold text-blue-700 mb-4">About Our Project</h2>
            <p className="text-gray-700 mb-4">
                Our FHIR Visualisation Tool is designed to help healthcare professionals, developers, and researchers better understand the relationships between various FHIR (Fast Healthcare Interoperability Resources) components. By providing interactive and visually appealing representations, we aim to simplify the complexity of FHIR and enhance the learning experience.
            </p>
            <p className="text-gray-700 mb-4">
                Whether you're new to FHIR or an experienced user, our tool offers valuable insights into the structure and connections within the FHIR ecosystem.
            </p>
        </section>
        <Separator />
    </div >;
}