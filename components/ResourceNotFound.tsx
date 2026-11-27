import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ResourceNotFoundProps {
  resourceType: string;
  id: string | string[] | undefined;
  listHref: string;
}

/** Shown when a detail page's id is not in the loaded bundles: a stale link, or data replaced since. */
const ResourceNotFound: React.FC<ResourceNotFoundProps> = ({ resourceType, id, listHref }) => (
  <Card>
    <CardHeader>
      <CardTitle>{resourceType} not found</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <p>
        No {resourceType} with id <code>{id}</code> is in the bundles currently loaded.
        Loading or regenerating bundles replaces the previous data.
      </p>
      <Button asChild variant="outline">
        <Link href={listHref}>Back to the list</Link>
      </Button>
    </CardContent>
  </Card>
);

export default ResourceNotFound;
